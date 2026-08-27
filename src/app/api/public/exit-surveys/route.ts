import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { clientIp, hasSpamTrap, isValidEmail, rateLimit } from "@/lib/public-forms";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await ensureMigrated();

  const limited = rateLimit(`exit-survey:${clientIp(request)}`, {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Recibimos demasiadas respuestas desde esta conexión. Intenta más tarde." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    if (hasSpamTrap(body)) return NextResponse.json({ ok: true });

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const payload = {
      experienceTitle: String(body.experienceTitle || "").trim(),
      rating: String(body.rating || "").trim(),
      nps: String(body.nps || "").trim(),
      highlight: String(body.highlight || "").trim(),
      improve: String(body.improve || "").trim(),
      repeatIntent: String(body.repeatIntent || "").trim(),
      testimonialPermission: Boolean(body.testimonialPermission),
    };

    if (!name || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Nombre y correo válido son obligatorios." },
        { status: 400 }
      );
    }

    const customerId = await upsertCustomer(name, email);
    const submission = await db.execute({
      sql: `INSERT INTO form_submissions (type, customer_id, payload_json)
            VALUES ('exit_survey', ?, ?) RETURNING id`,
      args: [customerId, JSON.stringify(payload)],
    });

    await db.execute({
      sql: `INSERT INTO crm_events (customer_id, type, title, body)
            VALUES (?, 'exit_survey', ?, ?)`,
      args: [
        customerId,
        `Encuesta de salida${payload.experienceTitle ? ` · ${payload.experienceTitle}` : ""}`,
        formatSurvey(payload),
      ],
    });

    return NextResponse.json({ ok: true, id: submission.rows[0].id });
  } catch (error) {
    console.error("[POST /api/public/exit-surveys]", error);
    return NextResponse.json(
      { error: "No pudimos guardar la encuesta." },
      { status: 500 }
    );
  }
}

async function upsertCustomer(name: string, email: string) {
  const existing = await db.execute({
    sql: "SELECT id FROM customers WHERE email = ? COLLATE NOCASE",
    args: [email],
  });

  if (existing.rows[0]) {
    const id = String(existing.rows[0].id);
    await db.execute({
      sql: "UPDATE customers SET name = ?, updated_at = datetime('now') WHERE id = ?",
      args: [name, id],
    });
    return id;
  }

  const inserted = await db.execute({
    sql: `INSERT INTO customers (name, email, source, stage)
          VALUES (?, ?, 'exit_survey', 'recurrente') RETURNING id`,
    args: [name, email],
  });
  return String(inserted.rows[0].id);
}

function formatSurvey(payload: Record<string, string | boolean>) {
  return [
    `Experiencia: ${payload.experienceTitle || "No especificada"}`,
    `Satisfacción: ${payload.rating || "Sin dato"}`,
    `NPS: ${payload.nps || "Sin dato"}`,
    `Volvería/recomendaría: ${payload.repeatIntent || "Sin dato"}`,
    `Momento memorable: ${payload.highlight || "Sin dato"}`,
    `Mejoras: ${payload.improve || "Sin dato"}`,
    `Permiso testimonial: ${payload.testimonialPermission ? "Sí" : "No"}`,
  ].join("\n");
}
