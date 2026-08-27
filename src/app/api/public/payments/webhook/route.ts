import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db";
import { getGateway } from "@/lib/payments";
import { confirmPaidReservation, markPaymentFailed } from "@/lib/reservations";

export const dynamic = "force-dynamic";

/**
 * POST /api/public/payments/webhook
 * Receives payment notifications from the configured gateway.
 * Verifies signature and updates reservation status.
 */
export async function POST(request: NextRequest) {
  await ensureMigrated();

  try {
    const payload = await request.text();
    const signature = JSON.stringify({
      stripeSignature: request.headers.get("stripe-signature") || "",
      xSignature: request.headers.get("x-signature") || "",
      xRequestId: request.headers.get("x-request-id") || "",
    });

    const gateway = getGateway();
    const result = await gateway.verifyWebhook(payload, signature);

    if (!result.reference) {
      return NextResponse.json({ error: "Reference missing." }, { status: 400 });
    }

    if (result.status === "paid") {
      const confirmation = await confirmPaidReservation(result.reference, "online");
      if (!confirmation.ok && confirmation.status !== 404) {
        return NextResponse.json({ error: confirmation.error }, { status: confirmation.status });
      }
    } else {
      await markPaymentFailed(result.reference);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[POST /api/public/payments/webhook]", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
