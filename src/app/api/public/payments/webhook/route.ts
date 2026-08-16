import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { getGateway } from "@/lib/payments";

/**
 * POST /api/public/payments/webhook
 * Receives payment notifications from the configured gateway.
 * Verifies signature and updates reservation status.
 */
export async function POST(request: NextRequest) {
  await ensureMigrated();

  try {
    const payload = await request.text();
    const signature =
      request.headers.get("stripe-signature") ||
      request.headers.get("x-signature") ||
      request.headers.get("x-request-id") ||
      "";

    const gateway = getGateway();
    const result = await gateway.verifyWebhook(payload, signature);

    if (!result.reference) {
      return NextResponse.json({ error: "Reference missing." }, { status: 400 });
    }

    if (result.status === "paid") {
      // Find and update the reservation
      const reservation = await db.execute({
        sql: "SELECT id, customer_id FROM reservations WHERE payment_reference = ?",
        args: [result.reference],
      });

      if (reservation.rows.length > 0) {
        const resId = reservation.rows[0].id;
        const customerId = reservation.rows[0].customer_id;

        await db.execute({
          sql: `UPDATE reservations SET status = 'confirmed', payment_status = 'paid', payment_method = 'online', updated_at = datetime('now') WHERE id = ?`,
          args: [resId],
        });

        // Update customer stage
        await db.execute({
          sql: `UPDATE customers SET stage = 'confirmado', updated_at = datetime('now') WHERE id = ?`,
          args: [customerId],
        });
      }
    } else {
      // Mark as failed
      await db.execute({
        sql: `UPDATE reservations SET payment_status = 'failed', updated_at = datetime('now') WHERE payment_reference = ?`,
        args: [result.reference],
      });
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
