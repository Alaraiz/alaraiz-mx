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

  async verifyWebhook(payload: string, signature: string): Promise<WebhookResult> {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const providedSignature = readHeaderSignature(signature);
    if (secret && providedSignature !== secret) {
      throw new Error("[ManualGateway] Invalid webhook signature.");
    }
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("[ManualGateway] PAYMENT_WEBHOOK_SECRET is required for production webhooks.");
    }

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

function readHeaderSignature(signature: string): string {
  try {
    const headers = JSON.parse(signature) as { xSignature?: string };
    return headers.xSignature || "";
  } catch {
    return signature;
  }
}
