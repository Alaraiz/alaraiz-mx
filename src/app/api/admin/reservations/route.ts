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
    const { customerId, experienceId, availabilityId, attendeesCount, amount, status, notes } = body;

    if (!customerId || !experienceId) {
      return NextResponse.json(
        { error: "Cliente y experiencia son obligatorios." },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: `INSERT INTO reservations (customer_id, experience_id, availability_id, attendees_count, amount, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        customerId, experienceId, availabilityId || null,
        attendeesCount || 1, amount || 0, status || "pending", notes || null,
      ],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("[POST /api/admin/reservations]", error);
    return NextResponse.json({ error: "Error al crear la reserva." }, { status: 500 });
  }
}
