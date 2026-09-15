import { randomUUID } from "crypto";
import { db } from "./db";
import { userCanManageExperience } from "./admin-permissions";
import type { TokenPayload } from "./auth";
import type { RescheduleEmailData } from "./email";

export class RescheduleError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Move the reservations, capacity and pending notices together, or roll everything back. */
export async function moveReservationGroup(user: TokenPayload, sourceId: string, targetId: string) {
  if (!targetId || targetId === sourceId) throw new RescheduleError("Elige una nueva fecha distinta.", 400);
  // Resolve the ownership check before opening a write transaction on the same database.
  const ownership = await db.execute({ sql: "SELECT experience_id FROM availability WHERE id = ?", args: [sourceId] });
  if (!ownership.rows[0]) throw new RescheduleError("Fecha origen no encontrada.", 404);
  if (!(await userCanManageExperience(user, String(ownership.rows[0].experience_id)))) throw new RescheduleError("No autorizado para reagendar esta experiencia.", 403);
  const tx = await db.transaction("write");
  try {
    const slots = await tx.execute({ sql: "SELECT * FROM availability WHERE id IN (?, ?)", args: [sourceId, targetId] });
    const source = slots.rows.find(row => String(row.id) === sourceId);
    const target = slots.rows.find(row => String(row.id) === targetId);
    if (!source || !target) throw new RescheduleError("Fecha origen o destino no encontrada.", 404);
    if (source.experience_id !== target.experience_id) throw new RescheduleError("Solo puedes mover reservas entre fechas de la misma experiencia.", 409);
    if (target.status !== "open") throw new RescheduleError("La fecha destino debe estar abierta.", 409);
    const reservations = await tx.execute({
      sql: `SELECT r.*, c.name, c.email, e.title, e.duration, e.email_meeting_point, e.email_what_to_expect
            FROM reservations r LEFT JOIN customers c ON c.id = r.customer_id
            JOIN experiences e ON e.id = r.experience_id WHERE r.availability_id = ?`, args: [sourceId],
    });
    if (!reservations.rows.length) throw new RescheduleError("No hay reservas para mover en esta fecha.", 400);
    const heldCount = reservations.rows.reduce((sum, row) => sum + (Number(row.capacity_held) === 1 ? Number(row.attendees_count) || 1 : 0), 0);
    // Do not let another move overtake a request already dispatching this group's notices.
    const inFlight = await tx.execute({
      sql: `SELECT n.id FROM reschedule_notifications n JOIN reservations r ON r.id = n.reservation_id
            WHERE r.availability_id = ? AND n.status = 'sending' AND n.attempted_at >= datetime('now', '-5 minutes') LIMIT 1`, args: [sourceId],
    });
    if (inFlight.rows.length) throw new RescheduleError("Hay avisos enviándose. Espera a que terminen antes de volver a reagendar.", 409);
    const hold = await tx.execute({
      sql: "UPDATE availability SET booked = booked + ? WHERE id = ? AND booked + ? <= capacity",
      args: [heldCount, targetId, heldCount],
    });
    if (!hold.rowsAffected) throw new RescheduleError(`La nueva fecha necesita ${heldCount} lugar(es) libres.`, 409);
    const notificationIds: string[] = [];
    for (const row of reservations.rows) {
      await tx.execute({ sql: "UPDATE reschedule_notifications SET status = 'superseded' WHERE reservation_id = ? AND status != 'sent'", args: [row.id] });
      if (["cancelled", "failed", "refunded"].includes(String(row.status)) || ["failed", "refunded"].includes(String(row.payment_status))) continue;
      const data: RescheduleEmailData = {
        reservationId: String(row.id), paymentReference: String(row.payment_reference || ""), customerName: String(row.name || "amiga/o"),
        experienceTitle: String(row.title), previousDate: String(source.date), previousTime: String(source.time),
        date: String(target.date), time: String(target.time), attendeesCount: Number(row.attendees_count) || 1,
        amount: Number(row.amount) || 0, discountAmount: Number(row.discount_amount) || 0, discountCode: String(row.discount_code || ""),
        duration: String(row.duration || ""), meetingPoint: String(row.email_meeting_point || ""), whatToExpect: String(row.email_what_to_expect || ""),
      };
      const notificationId = randomUUID();
      await tx.execute({
        sql: "INSERT INTO reschedule_notifications(id, reservation_id, availability_id, recipient, payload_json) VALUES(?, ?, ?, ?, ?)",
        args: [notificationId, row.id, targetId, String(row.email || ""), JSON.stringify(data)],
      });
      notificationIds.push(notificationId);
    }
    await tx.execute({ sql: "UPDATE reservations SET availability_id = ?, updated_at = datetime('now') WHERE availability_id = ?", args: [targetId, sourceId] });
    await tx.execute({ sql: "UPDATE availability SET booked = MAX(booked - ?, 0) WHERE id = ?", args: [heldCount, sourceId] });
    await tx.commit();
    return { moved: reservations.rows.length, heldCount, queued: notificationIds.length, notificationIds };
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally { tx.close(); }
}
