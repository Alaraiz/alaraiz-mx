import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { clientIp, hasSpamTrap, isValidEmail, rateLimit } from "@/lib/public-forms";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await ensureMigrated();

  const limited = rateLimit(`lead:${clientIp(request)}`, {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Recibimos demasiadas solicitudes desde esta conexión. Intenta más tarde." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    if (hasSpamTrap(body)) return NextResponse.json({ ok: true });

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const experience = String(body.experience || "").trim();
    const people = String(body.people || "").trim();
    const accessibility = String(body.accessibility || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Nombre y correo válido son obligatorios." },
        { status: 400 }
      );
    }

    const customerId = await upsertLead({ name, email, phone, experience });
    const payload = { experience, people, accessibility, message };

    await db.batch([
      {
        sql: `INSERT INTO form_submissions (type, customer_id, payload_json)
              VALUES ('landing_lead', ?, ?)`,
        args: [customerId, JSON.stringify(payload)],
      },
      {
        sql: `INSERT INTO crm_events (customer_id, type, title, body)
              VALUES (?, 'landing_lead', ?, ?)`,
        args: [
          customerId,
          `Solicitud desde landing${experience ? ` · ${experience}` : ""}`,
          [
            `Experiencia: ${experience || "Sin dato"}`,
            `Personas: ${people || "Sin dato"}`,
            `Accesibilidad: ${accessibility || "Sin dato"}`,
            `Mensaje: ${message || "Sin dato"}`,
          ].join("\n"),
        ],
      },
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/public/leads]", error);
    return NextResponse.json(
      { error: "No pudimos guardar la solicitud." },
      { status: 500 }
    );
  }
}

async function upsertLead(input: {
  name: string;
  email: string;
  phone: string;
  experience: string;
}) {
  const existing = await db.execute({
    sql: "SELECT id, notes FROM customers WHERE email = ? COLLATE NOCASE",
    args: [input.email],
  });

  const note = `Solicitud landing${input.experience ? `: ${input.experience}` : ""}`;
  if (existing.rows[0]) {
    const id = String(existing.rows[0].id);
    await db.execute({
      sql: `UPDATE customers
            SET name = ?, phone = COALESCE(?, phone), source = 'landing',
                stage = CASE WHEN stage = 'nuevo' THEN 'interesado' ELSE stage END,
                notes = trim(COALESCE(notes || char(10), '') || ?),
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [input.name, input.phone || null, note, id],
    });
    return id;
  }

  const inserted = await db.execute({
    sql: `INSERT INTO customers (name, email, phone, source, stage, notes)
          VALUES (?, ?, ?, 'landing', 'interesado', ?) RETURNING id`,
    args: [input.name, input.email, input.phone || null, note],
  });
  return String(inserted.rows[0].id);
}
