import { db } from "./db";
import { getEmailTemplate, sendEmail, tplReservationRescheduled, type RescheduleEmailData } from "./email";

export async function getRescheduleNotificationSummary(availabilityId: string) {
  const result = await db.execute({
    sql: `SELECT status, COUNT(*) AS total FROM reschedule_notifications
          WHERE availability_id = ? GROUP BY status`, args: [availabilityId],
  });
  const counts: Record<string, number> = { pending: 0, failed: 0, sending: 0, sent: 0, superseded: 0 };
  for (const row of result.rows) counts[String(row.status)] = Number(row.total);
  return counts;
}

export async function getRescheduleNotificationErrors(availabilityId: string) {
  const result = await db.execute({
    sql: "SELECT DISTINCT last_error FROM reschedule_notifications WHERE availability_id = ? AND status = 'failed' AND last_error IS NOT NULL LIMIT 3",
    args: [availabilityId],
  });
  return result.rows.map(row => String(row.last_error));
}

/** Claim before sending so simultaneous clicks cannot send the same notice twice. */
export async function sendRescheduleNotifications(
  availabilityId: string,
  options: { send?: typeof sendEmail; pauseMs?: number; ids?: string[] } = {},
) {
  const send = options.send || sendEmail;
  // A bounded batch fits within the API request; remaining notices stay available in the panel.
  const idFilter = options.ids ? (options.ids.length ? ` AND id IN (${options.ids.map(() => "?").join(",")})` : " AND 0") : "";
  const pending = await db.execute({
    sql: `SELECT id FROM reschedule_notifications WHERE availability_id = ?
          AND (status IN ('pending', 'failed') OR (status = 'sending' AND attempted_at < datetime('now', '-5 minutes')))
          ${idFilter} ORDER BY created_at, id LIMIT 20`, args: [availabilityId, ...(options.ids || [])],
  });
  let sent = 0, failed = 0;
  const template = await getEmailTemplate("reservation_rescheduled");
  for (const item of pending.rows) {
    const id = String(item.id);
    const claim = await db.execute({
      sql: `UPDATE reschedule_notifications SET status = 'sending', attempts = attempts + 1, attempted_at = datetime('now')
            WHERE id = ? AND (status IN ('pending', 'failed') OR (status = 'sending' AND attempted_at < datetime('now', '-5 minutes')))
            RETURNING *`, args: [id],
    });
    const notice = claim.rows[0];
    if (!notice) continue;
    try {
      const reservation = await db.execute({
        sql: "SELECT r.availability_id, r.status, r.payment_status, c.email FROM reservations r LEFT JOIN customers c ON c.id = r.customer_id WHERE r.id = ?", args: [notice.reservation_id],
      });
      const current = reservation.rows[0];
      if (!current || String(current.availability_id) !== availabilityId ||
          ["cancelled", "failed", "refunded"].includes(String(current.status)) ||
          ["failed", "refunded"].includes(String(current.payment_status))) {
        await db.execute({ sql: "UPDATE reschedule_notifications SET status = 'superseded' WHERE id = ?", args: [id] });
        continue;
      }
      const recipient = notice.rendered_json ? String(notice.recipient) : String(current.email || "").trim();
      if (!recipient) throw new Error("La reserva no tiene correo. Corrige el contacto en CRM y reintenta.");
      const data = JSON.parse(String(notice.payload_json)) as RescheduleEmailData;
      // Freeze the rendered payload for retries with the same provider idempotency key.
      const rendered = notice.rendered_json ? JSON.parse(String(notice.rendered_json)) as { subject: string; html: string }
        : tplReservationRescheduled(data, template);
      await db.execute({ sql: "UPDATE reschedule_notifications SET rendered_json = ?, recipient = ? WHERE id = ?", args: [JSON.stringify(rendered), recipient, id] });
      const result = await send({ to: recipient, ...rendered, idempotencyKey: `reschedule/${id}` });
      if (!result.ok || result.skipped) throw new Error(result.error || "Envío omitido: revisa el correo del cliente y la configuración de Resend.");
      await db.execute({ sql: "UPDATE reschedule_notifications SET status = 'sent', last_error = NULL, sent_at = datetime('now') WHERE id = ?", args: [id] });
      sent++;
    } catch (error) {
      await db.execute({
        sql: "UPDATE reschedule_notifications SET status = 'failed', last_error = ? WHERE id = ?",
        args: [error instanceof Error ? error.message.slice(0, 500) : "No se pudo enviar el aviso.", id],
      });
      failed++;
    }
    if ((options.pauseMs ?? 550) > 0) await new Promise(resolve => setTimeout(resolve, options.pauseMs ?? 550));
  }
  return { sent, failed, counts: await getRescheduleNotificationSummary(availabilityId), errors: await getRescheduleNotificationErrors(availabilityId) };
}
