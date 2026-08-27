import { NextRequest, NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerId, type, title, body: eventBody } = body;

    if (!customerId || !title) {
      return NextResponse.json(
        { error: "Cliente y título son obligatorios." },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: `INSERT INTO crm_events (customer_id, type, title, body) VALUES (?, ?, ?, ?) RETURNING id`,
      args: [customerId, type || "note", title, eventBody || null],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("[POST /api/admin/crm-events]", error);
    return NextResponse.json({ error: "Error al crear el evento." }, { status: 500 });
  }
}
