import { db } from "./db";
import {
  getReservationEntryAttachments,
  sendEmail,
  tplReservationConfirmed,
} from "./email";

export type ReservationConfirmation =
  | {
      ok: true;
      reservation: Record<string, unknown>;
      capacityConfirmed: boolean;
      message: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export function toPositiveInteger(value: unknown, fallback = 1): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return NaN;
  }
  return parsed;
}

export async function getReservationByPaymentReference(reference: string) {
  const result = await db.execute({
    sql: `SELECT r.id, r.status, r.payment_status, r.payment_method, r.customer_id,
                 r.experience_id, r.availability_id, r.attendees_count, r.amount,
                 r.subtotal_amount, r.discount_code, r.discount_amount, r.payment_reference, r.capacity_held,
                 c.name, c.email, e.title, e.duration, e.email_meeting_point, e.email_what_to_expect, a.date, a.time
          FROM reservations r
          LEFT JOIN customers c ON c.id = r.customer_id
          LEFT JOIN experiences e ON e.id = r.experience_id
          LEFT JOIN availability a ON a.id = r.availability_id
          WHERE r.payment_reference = ? OR r.id = ?
          LIMIT 1`,
    args: [reference, reference],
  });

  return result.rows[0] ?? null;
}

export function serializeReservation(row: Record<string, unknown>) {
  return {
    id: row.id,
    customerName: row.name,
    customerEmail: row.email,
    experienceTitle: row.title,
    attendeesCount: row.attendees_count,
    subtotalAmount: row.subtotal_amount,
    discountCode: row.discount_code,
    discountAmount: row.discount_amount,
    paymentReference: row.payment_reference,
    amount: row.amount,
    status: row.status,
    paymentStatus: row.payment_status,
  };
}

export async function sendReservationConfirmationEmail(referenceOrReservationId: string) {
  const reservation = await getReservationByPaymentReference(referenceOrReservationId);

  if (!reservation?.email) {
    return { ok: false, skipped: true, error: "Reserva sin correo de cliente." };
  }

  const tpl = tplReservationConfirmed({
    reservationId: String(reservation.id),
    paymentReference: String(reservation.payment_reference || ""),
    customerName: String(reservation.name || "amiga/o"),
    experienceTitle: String(reservation.title || "Tu experiencia"),
    date: reservation.date ? String(reservation.date) : null,
    time: reservation.time ? String(reservation.time) : null,
    attendeesCount: toPositiveInteger(reservation.attendees_count, 1),
    amount: Number(reservation.amount) || 0,
    discountAmount: Number(reservation.discount_amount) || 0,
    discountCode: reservation.discount_code ? String(reservation.discount_code) : null,
    duration: reservation.duration ? String(reservation.duration) : null,
    meetingPoint: reservation.email_meeting_point ? String(reservation.email_meeting_point) : null,
    whatToExpect: reservation.email_what_to_expect ? String(reservation.email_what_to_expect) : null,
  });

  return sendEmail({
    to: String(reservation.email),
    subject: tpl.subject,
    html: tpl.html,
    attachments: await getReservationEntryAttachments(),
  });
}

export async function markPaymentFailed(reference: string) {
  const reservation = await getReservationByPaymentReference(reference);
  if (reservation?.capacity_held && reservation.availability_id) {
    await releaseReservationCapacity(String(reservation.id));
  }

  await db.execute({
    sql: `UPDATE reservations
          SET status = 'cancelled',
              payment_status = 'failed',
              updated_at = datetime('now')
          WHERE payment_reference = ?
            AND payment_status != 'paid'`,
    args: [reference],
  });
}

export async function releaseReservationCapacity(reservationId: string) {
  const result = await db.execute({
    sql: `SELECT id, availability_id, attendees_count, capacity_held
          FROM reservations
          WHERE id = ?`,
    args: [reservationId],
  });
  const reservation = result.rows[0];
  if (!reservation?.availability_id || !reservation.capacity_held) return;

  const attendeesCount = toPositiveInteger(reservation.attendees_count, 1);
  if (!Number.isFinite(attendeesCount)) return;

  await db.batch([
    {
      sql: `UPDATE availability
            SET booked = MAX(booked - ?, 0)
            WHERE id = ?`,
      args: [attendeesCount, reservation.availability_id],
    },
    {
      sql: "UPDATE reservations SET capacity_held = 0, updated_at = datetime('now') WHERE id = ?",
      args: [reservationId],
    },
  ]);
}

export async function confirmPaidReservation(
  reference: string,
  paymentMethod: "manual" | "online" = "online"
): Promise<ReservationConfirmation> {
  const reservation = await getReservationByPaymentReference(reference);

  if (!reservation) {
    return { ok: false, status: 404, error: "Reserva no encontrada." };
  }

  if (reservation.payment_status === "paid") {
    return {
      ok: true,
      reservation: serializeReservation(reservation),
      capacityConfirmed: reservation.status === "confirmed",
      message:
        reservation.status === "confirmed"
          ? "Reserva ya confirmada."
          : "Pago registrado; la reserva requiere revisión de cupo.",
    };
  }

  const attendeesCount = toPositiveInteger(reservation.attendees_count);
  if (!Number.isFinite(attendeesCount)) {
    return { ok: false, status: 409, error: "La reserva tiene una cantidad de asistentes inválida." };
  }

  if (reservation.availability_id && !reservation.capacity_held) {
    const capacityResult = await db.execute({
      sql: `UPDATE availability
            SET booked = booked + ?
            WHERE id = ?
              AND status = 'open'
              AND booked + ? <= capacity`,
      args: [attendeesCount, reservation.availability_id, attendeesCount],
    });

    if (capacityResult.rowsAffected === 0) {
      await db.execute({
        sql: `UPDATE reservations
              SET status = 'needs_review',
                  payment_status = 'paid',
                  payment_method = ?,
                  notes = trim(COALESCE(notes || char(10), '') || 'Pago recibido sin cupo disponible automáticamente. Revisar operación/reembolso.'),
                  updated_at = datetime('now')
              WHERE id = ?`,
        args: [paymentMethod, reservation.id],
      });

      await db.execute({
        sql: `UPDATE customers SET stage = 'requiere_revision', updated_at = datetime('now') WHERE id = ?`,
        args: [reservation.customer_id],
      });

      return {
        ok: true,
        reservation: {
          ...serializeReservation(reservation),
          status: "needs_review",
          paymentStatus: "paid",
        },
        capacityConfirmed: false,
        message: "Pago registrado; no fue posible confirmar cupo automáticamente.",
      };
    }
  }

  await db.execute({
    sql: `UPDATE reservations
          SET status = 'confirmed',
              payment_status = 'paid',
              payment_method = ?,
              capacity_held = CASE WHEN availability_id IS NULL THEN 0 ELSE 1 END,
              updated_at = datetime('now')
          WHERE id = ?`,
    args: [paymentMethod, reservation.id],
  });

  await db.execute({
    sql: `UPDATE customers SET stage = 'confirmado', updated_at = datetime('now') WHERE id = ?`,
    args: [reservation.customer_id],
  });

  await sendReservationConfirmationEmail(String(reservation.payment_reference || reservation.id));

  return {
    ok: true,
    reservation: {
      ...serializeReservation(reservation),
      status: "confirmed",
      paymentStatus: "paid",
    },
    capacityConfirmed: true,
    message: "Reserva confirmada exitosamente.",
  };
}
