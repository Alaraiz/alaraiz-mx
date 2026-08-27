import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { clientIp, hasSpamTrap, isValidEmail, rateLimit } from "@/lib/public-forms";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await ensureMigrated();

  const limited = rateLimit(`host-application:${clientIp(request)}`, {
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Recibimos demasiadas propuestas desde esta conexión. Intenta más tarde." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    if (hasSpamTrap(body)) return NextResponse.json({ ok: true });

    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    const name = String(body.name || payload["Tu nombre"] || "").trim();
    const email = String(body.email || payload["Correo"] || "").trim().toLowerCase();
    const phone = String(body.phone || payload["Teléfono"] || "").trim();
    const title = String(body.title || payload["Título de trabajo"] || "Propuesta de experiencia").trim();

    if (!name || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Nombre y correo válido son obligatorios." },
        { status: 400 }
      );
    }

    const customerId = await upsertCustomer({
      name,
      email,
      phone,
      source: "host_application",
      stage: "interesado",
      notes: `Propuesta de anfitrión: ${title}`,
    });

    const submission = await db.execute({
      sql: `INSERT INTO form_submissions (type, customer_id, payload_json)
            VALUES ('host_application', ?, ?) RETURNING id`,
      args: [customerId, JSON.stringify(payload)],
    });

    await db.execute({
      sql: `INSERT INTO crm_events (customer_id, type, title, body)
            VALUES (?, 'host_application', ?, ?)`,
      args: [
        customerId,
        `Propuesta de anfitrión: ${title}`,
        formatPayload(payload),
      ],
    });

    return NextResponse.json({ ok: true, id: submission.rows[0].id });
  } catch (error) {
    console.error("[POST /api/public/host-applications]", error);
    return NextResponse.json(
      { error: "No pudimos guardar la propuesta." },
      { status: 500 }
    );
  }
}

async function upsertCustomer(input: {
  name: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  notes: string;
}) {
  const existing = await db.execute({
    sql: "SELECT id, notes FROM customers WHERE email = ? COLLATE NOCASE",
    args: [input.email],
  });

  if (existing.rows[0]) {
    const id = String(existing.rows[0].id);
    await db.execute({
      sql: `UPDATE customers
            SET name = ?, phone = COALESCE(?, phone), source = ?, stage = ?,
                notes = trim(COALESCE(notes || char(10), '') || ?),
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [input.name, input.phone || null, input.source, input.stage, input.notes, id],
    });
    return id;
  }

  const inserted = await db.execute({
    sql: `INSERT INTO customers (name, email, phone, source, stage, notes)
          VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    args: [input.name, input.email, input.phone || null, input.source, input.stage, input.notes],
  });
  return String(inserted.rows[0].id);
}

function formatPayload(payload: Record<string, unknown>) {
  return Object.entries(payload)
    .filter(([, value]) => String(value || "").trim())
    .map(([key, value]) => `${key}: ${String(value).trim()}`)
    .join("\n");
}
