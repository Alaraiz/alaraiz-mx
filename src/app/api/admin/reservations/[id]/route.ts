import { NextRequest, NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { db } from "@/lib/db";
import { releaseReservationCapacity } from "@/lib/reservations";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { paymentStatus, paymentMethod, paymentReference, status, attendeesCount, amount, availabilityId } = body;
    if (["cancelled", "failed", "refunded"].includes(String(status || paymentStatus))) {
      await releaseReservationCapacity(params.id);
    }

    await db.execute({
      sql: `UPDATE reservations SET
              payment_status = ?, payment_method = ?, payment_reference = ?,
              status = ?, attendees_count = ?, amount = ?, availability_id = ?,
              updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        paymentStatus || "unpaid", paymentMethod || "pending",
        paymentReference || null, status || "pending",
        attendeesCount || 1, amount || 0, availabilityId || null, params.id,
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/reservations/:id]", error);
    return NextResponse.json({ error: "Error al actualizar la reserva." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    await releaseReservationCapacity(params.id);
    await db.execute({ sql: "DELETE FROM reservations WHERE id = ?", args: [params.id] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/reservations/:id]", error);
    return NextResponse.json({ error: "Error al eliminar la reserva." }, { status: 500 });
  }
}
