import { NextRequest, NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { toPositiveInteger } from "@/lib/reservations";

export async function POST(request: NextRequest) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let heldAvailabilityId: string | null = null;
  let heldCount = 0;

  try {
    const body = await request.json();
    const { customerId, experienceId, availabilityId, attendeesCount, amount, status, notes } = body;
    const count = toPositiveInteger(attendeesCount, 1);

    if (!customerId || !experienceId) {
      return NextResponse.json(
        { error: "Cliente y experiencia son obligatorios." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(count)) {
      return NextResponse.json(
        { error: "La cantidad de asistentes debe ser un entero mayor a cero." },
        { status: 400 }
      );
    }

    let capacityHeld = 0;
    if (availabilityId) {
      const hold = await db.execute({
        sql: `UPDATE availability
              SET booked = booked + ?
              WHERE id = ?
                AND experience_id = ?
                AND booked + ? <= capacity`,
        args: [count, availabilityId, experienceId, count],
      });
      if (hold.rowsAffected === 0) {
        return NextResponse.json(
          { error: "No hay cupo suficiente en la fecha seleccionada." },
          { status: 409 }
        );
      }
      capacityHeld = 1;
      heldAvailabilityId = String(availabilityId);
      heldCount = count;
    }

    const result = await db.execute({
      sql: `INSERT INTO reservations (customer_id, experience_id, availability_id, attendees_count, amount, status, capacity_held, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        customerId, experienceId, availabilityId || null,
        count, amount || 0, status || "pending", capacityHeld, notes || null,
      ],
    });
    heldAvailabilityId = null;

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    if (heldAvailabilityId && heldCount > 0) {
      await db.execute({
        sql: "UPDATE availability SET booked = MAX(booked - ?, 0) WHERE id = ?",
        args: [heldCount, heldAvailabilityId],
      }).catch(() => {});
    }
    console.error("[POST /api/admin/reservations]", error);
    return NextResponse.json({ error: "Error al crear la reserva." }, { status: 500 });
  }
}
