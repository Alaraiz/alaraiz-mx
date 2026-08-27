import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db";
import {
  confirmPaidReservation,
  getReservationByPaymentReference,
  serializeReservation,
} from "@/lib/reservations";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/reservations/confirm?ref=<reference>
 * Returns reservation payment status.
 * Manual/offline checkout may auto-confirm here; real providers must use webhooks.
 */
export async function GET(request: NextRequest) {
  await ensureMigrated();

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Falta la referencia de pago." }, { status: 400 });
  }

  try {
    const provider = (process.env.PAYMENT_PROVIDER || "manual").toLowerCase();

    const manualAutoConfirmAllowed =
      provider === "manual" &&
      (process.env.NODE_ENV !== "production" || process.env.ALLOW_MANUAL_AUTO_CONFIRM === "true");

    if (!manualAutoConfirmAllowed) {
      const reservation = await getReservationByPaymentReference(ref);
      if (!reservation) {
        return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
      }

      return NextResponse.json({
        ok: true,
        message:
          reservation.payment_status === "paid"
            ? "Pago registrado."
            : "Pago pendiente de confirmación.",
        reservation: serializeReservation(reservation),
      });
    }

    const confirmation = await confirmPaidReservation(ref, "manual");
    if (!confirmation.ok) {
      return NextResponse.json({ error: confirmation.error }, { status: confirmation.status });
    }

    return NextResponse.json({
      ok: true,
      message: confirmation.message,
      reservation: confirmation.reservation,
    });
  } catch (error) {
    console.error("[GET /api/public/reservations/confirm]", error);
    return NextResponse.json(
      { error: "Error al confirmar la reserva." },
      { status: 500 }
    );
  }
}
