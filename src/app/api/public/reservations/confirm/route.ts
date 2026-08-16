import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";

/**
 * GET /api/public/reservations/confirm?ref=<reference>
 * Confirms a reservation as paid (for manual adapter or return-from-gateway).
 * Marks payment_status = 'paid', status = 'confirmed'.
 */
export async function GET(request: NextRequest) {
  await ensureMigrated();

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Falta la referencia de pago." }, { status: 400 });
  }

  try {
    // Find reservation by payment_reference
    const result = await db.execute({
      sql: `SELECT r.id, r.status, r.payment_status, r.customer_id, r.experience_id, r.availability_id,
                   r.attendees_count, r.amount, c.name, c.email, e.title
            FROM reservations r
            LEFT JOIN customers c ON c.id = r.customer_id
            LEFT JOIN experiences e ON e.id = r.experience_id
            WHERE r.payment_reference = ?`,
      args: [ref],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
    }

    const reservation = result.rows[0];

    // If already confirmed, just return the data
    if (reservation.payment_status === "paid") {
      return NextResponse.json({
        ok: true,
        message: "Reserva ya confirmada.",
        reservation: {
          id: reservation.id,
          customerName: reservation.name,
          customerEmail: reservation.email,
          experienceTitle: reservation.title,
          attendeesCount: reservation.attendees_count,
          amount: reservation.amount,
          status: reservation.status,
          paymentStatus: reservation.payment_status,
        },
      });
    }

    // Confirm the reservation
    await db.execute({
      sql: `UPDATE reservations SET status = 'confirmed', payment_status = 'paid', payment_method = 'online', updated_at = datetime('now') WHERE id = ?`,
      args: [reservation.id],
    });

    // Update customer stage
    await db.execute({
      sql: `UPDATE customers SET stage = 'confirmado', updated_at = datetime('now') WHERE id = ?`,
      args: [reservation.customer_id],
    });

    return NextResponse.json({
      ok: true,
      message: "Reserva confirmada exitosamente.",
      reservation: {
        id: reservation.id,
        customerName: reservation.name,
        customerEmail: reservation.email,
        experienceTitle: reservation.title,
        attendeesCount: reservation.attendees_count,
        amount: reservation.amount,
        status: "confirmed",
        paymentStatus: "paid",
      },
    });
  } catch (error) {
    console.error("[GET /api/public/reservations/confirm]", error);
    return NextResponse.json(
      { error: "Error al confirmar la reserva." },
      { status: 500 }
    );
  }
}
