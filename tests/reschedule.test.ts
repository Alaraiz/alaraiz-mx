import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("Reagendar: transacción, permisos y avisos recuperables sin correos reales", async t => {
  const dir = await mkdtemp(path.join(tmpdir(), "raiz-reschedule-"));
  process.env.TURSO_DATABASE_URL = `file:${path.join(dir, "test.db")}`;
  process.env.TURSO_AUTH_TOKEN = "";
  process.env.RESEND_API_KEY = "";
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
  const { db } = await import("../src/lib/db");
  const { migrate } = await import("../src/lib/schema");
  const { moveReservationGroup } = await import("../src/lib/reschedule");
  const { sendRescheduleNotifications, getRescheduleNotificationSummary } = await import("../src/lib/reschedule-notifications");
  const admin = { sub: "admin", email: "admin@example.test", role: "admin" };
  try {
    await migrate();
    await migrate();
    await db.batch([
      "INSERT INTO experiences(id,title,slug) VALUES('e','Paseo <especial>','paseo')",
      "INSERT INTO customers(id,name,email) VALUES('c','Persona <test>','person@example.test')",
      "INSERT INTO availability(id,experience_id,date,time,capacity,booked) VALUES('a','e','2026-10-01','09:00',10,3)",
      "INSERT INTO availability(id,experience_id,date,time,capacity,booked) VALUES('b','e','2026-10-05','12:00',10,0)",
      "INSERT INTO availability(id,experience_id,date,time,capacity,booked) VALUES('small','e','2026-10-06','12:00',1,0)",
      "INSERT INTO reservations(id,customer_id,experience_id,availability_id,attendees_count,status,payment_status,capacity_held) VALUES('r1','c','e','a',2,'confirmed','paid',1)",
      "INSERT INTO reservations(id,customer_id,experience_id,availability_id,attendees_count,status,payment_status,capacity_held) VALUES('r2','c','e','a',1,'pending','unpaid',1)",
      "INSERT INTO reservations(id,customer_id,experience_id,availability_id,status,payment_status) VALUES('cancelled','c','e','a','cancelled','refunded')",
    ]);
    await t.test("migración y plantilla nueva idempotentes", async () => {
      assert.equal((await db.execute("SELECT COUNT(*) AS n FROM email_templates WHERE key='reservation_rescheduled'")).rows[0].n, 1);
    });
    await t.test("permiso de editor y rollback sin cupo", async () => {
      await assert.rejects(moveReservationGroup({ ...admin, role: "editor" }, "a", "b"), /No autorizado/);
      await assert.rejects(moveReservationGroup(admin, "a", "small"), /lugar/);
      assert.equal((await db.execute("SELECT booked FROM availability WHERE id='a'")).rows[0].booked, 3);
      assert.equal((await db.execute("SELECT COUNT(*) AS n FROM reschedule_notifications")).rows[0].n, 0);
    });
    let ids: string[] = [];
    await t.test("manual: mueve y guarda fechas originales sin enviar", async () => {
      const move = await moveReservationGroup(admin, "a", "b");
      ids = move.notificationIds;
      assert.equal(move.moved, 3); assert.equal(move.queued, 2);
      assert.equal((await db.execute("SELECT booked FROM availability WHERE id='a'")).rows[0].booked, 0);
      assert.equal((await db.execute("SELECT booked FROM availability WHERE id='b'")).rows[0].booked, 3);
      const payload = JSON.parse(String((await db.execute("SELECT payload_json FROM reschedule_notifications LIMIT 1")).rows[0].payload_json));
      assert.equal(payload.previousDate, "2026-10-01"); assert.equal(payload.date, "2026-10-05");
      assert.equal((await getRescheduleNotificationSummary("b")).pending, 2);
    });
    const calls: string[] = [];
    await t.test("fallo de correo no revierte movimiento y reintento conserva payload", async () => {
      const failure = await sendRescheduleNotifications("b", { ids: [ids[0]], pauseMs: 0, send: async args => {
        calls.push(args.html); return { ok: false, error: "Error simulado" };
      } });
      assert.equal(failure.failed, 1);
      assert.equal((await db.execute("SELECT availability_id FROM reservations WHERE id='r1'")).rows[0].availability_id, "b");
      await db.execute("UPDATE email_templates SET body='Nueva plantilla {{fecha_anterior}} {{fecha}}' WHERE key='reservation_rescheduled'");
      const retry = await sendRescheduleNotifications("b", { ids: [ids[0]], pauseMs: 0, send: async args => {
        assert.equal(args.html, calls[0]); assert(args.idempotencyKey?.startsWith("reschedule/"));
        assert(!args.html.includes("<especial>")); assert(!args.html.includes("{{fecha"));
        return { ok: true };
      } });
      assert.equal(retry.sent, 1); assert.equal(retry.counts.pending, 1);
    });
    await t.test("clics concurrentes no repiten correos ya enviados", async () => {
      let sent = 0;
      const options = { pauseMs: 0, send: async () => { sent++; return { ok: true }; } };
      await Promise.all([sendRescheduleNotifications("b", options), sendRescheduleNotifications("b", options)]);
      assert.equal(sent, 1);
      await sendRescheduleNotifications("b", options); assert.equal(sent, 1);
    });
    await t.test("nuevo cambio reemplaza avisos pendientes anteriores", async () => {
      await moveReservationGroup(admin, "b", "a");
      await moveReservationGroup(admin, "a", "b");
      assert.equal((await getRescheduleNotificationSummary("a")).superseded, 2);
      const none = await sendRescheduleNotifications("a", { pauseMs: 0, send: async () => { throw new Error("No debe enviar"); } });
      assert.equal(none.sent, 0); assert.equal(none.failed, 0);
    });
    await t.test("envío interrumpido recuperable; bloquea reagendar durante envío", async () => {
      await db.execute("UPDATE reschedule_notifications SET status='sending', attempted_at=datetime('now') WHERE availability_id='b' AND status='pending'");
      await assert.rejects(moveReservationGroup(admin, "b", "a"), /avisos enviándose/);
      await db.execute("UPDATE reschedule_notifications SET attempted_at=datetime('now','-6 minutes') WHERE status='sending'");
      const recovered = await sendRescheduleNotifications("b", { pauseMs: 0, send: async () => ({ ok: true }) });
      assert.equal(recovered.sent, 2);
    });
    await t.test("Resend sin configurar queda fallido, nunca enviado", async () => {
      await moveReservationGroup(admin, "b", "a");
      const skipped = await sendRescheduleNotifications("a", { pauseMs: 0, send: async () => ({ ok: true, skipped: true }) });
      assert.equal(skipped.sent, 0); assert.equal(skipped.failed, 2);
    });
  } finally { db.close(); await rm(dir, { recursive: true, force: true }); }
});
