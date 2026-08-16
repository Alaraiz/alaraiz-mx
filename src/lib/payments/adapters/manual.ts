import type { PaymentGateway, CheckoutInput, CheckoutResult, WebhookResult } from "../types";

/**
 * Manual/Test payment adapter.
 * Simulates a checkout flow without a real payment processor.
 * Useful for development and for flows where payment is collected offline.
 */
export class ManualGateway implements PaymentGateway {
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const reference = `manual_${Date.now()}_${input.reservationId}`;
    const url = `${input.baseUrl}/reservar/confirmacion?ref=${reference}`;

    return { url, reference };
  }

  async verifyWebhook(payload: string, _signature: string): Promise<WebhookResult> {
    // Manual adapter trusts the payload directly (no cryptographic verification)
    try {
      const data = JSON.parse(payload);
      return {
        reference: data.reference || "",
        status: data.status === "failed" ? "failed" : "paid",
      };
    } catch {
      return { reference: "", status: "failed" };
    }
  }
}
