import crypto from "crypto";
import type { PaymentGateway, CheckoutInput, CheckoutResult, WebhookResult } from "../types";

/**
 * Stripe payment adapter.
 *
 * Required environment variables:
 *   - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
 *   - PAYMENT_WEBHOOK_SECRET: Stripe webhook signing secret (whsec_...)
 *   - NEXT_PUBLIC_SITE_URL: Base URL for success/cancel redirects
 *
 * Uses Stripe Checkout via HTTPS and verifies webhook signatures locally.
 */
export class StripeGateway implements PaymentGateway {
  private secretKey: string;
  private webhookSecret: string;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    const whSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!key) {
      throw new Error(
        "[StripeGateway] STRIPE_SECRET_KEY no configurado. Agrega la variable de entorno."
      );
    }
    if (!whSecret) {
      throw new Error(
        "[StripeGateway] PAYMENT_WEBHOOK_SECRET no configurado. Agrega la variable de entorno."
      );
    }

    this.secretKey = key;
    this.webhookSecret = whSecret;
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const baseUrl = input.baseUrl;

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "line_items[0][price_data][currency]": input.currency,
        "line_items[0][price_data][unit_amount]": String(Math.round(input.amount * 100)),
        "line_items[0][price_data][product_data][name]": input.description,
        "line_items[0][quantity]": "1",
        success_url: `${baseUrl}/confirmacion?ref={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/reservar/cancelado`,
        customer_email: input.customerEmail,
        "metadata[reservationId]": input.reservationId,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`[StripeGateway] Error creando checkout: ${err}`);
    }

    const session = await response.json();
    return {
      url: session.url,
      reference: session.id,
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<WebhookResult> {
    const stripeSignature = readStripeSignature(signature);

    if (!stripeSignature) {
      throw new Error("[StripeGateway] Missing webhook signature.");
    }
    this.verifySignature(payload, stripeSignature);

    const event = JSON.parse(payload);

    if (event.type === "checkout.session.completed") {
      return {
        reference: event.data?.object?.id || "",
        status: "paid",
      };
    }

    return {
      reference: event.data?.object?.id || "",
      status: "failed",
    };
  }

  private verifySignature(payload: string, signature: string) {
    const timestamp = signature
      .split(",")
      .find((part) => part.startsWith("t="))
      ?.slice(2);
    const signatures = signature
      .split(",")
      .filter((part) => part.startsWith("v1="))
      .map((part) => part.slice(3));

    if (!timestamp || signatures.length === 0) {
      throw new Error("[StripeGateway] Invalid webhook signature format.");
    }

    const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
      throw new Error("[StripeGateway] Webhook signature timestamp outside tolerance.");
    }

    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(`${timestamp}.${payload}`, "utf8")
      .digest("hex");

    const expectedBuffer = Buffer.from(expected, "hex");
    const matched = signatures.some((candidate) => {
      const candidateBuffer = Buffer.from(candidate, "hex");
      return (
        candidateBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(candidateBuffer, expectedBuffer)
      );
    });

    if (!matched) {
      throw new Error("[StripeGateway] Invalid webhook signature.");
    }
  }
}

function readStripeSignature(signature: string): string {
  try {
    const headers = JSON.parse(signature) as { stripeSignature?: string };
    return headers.stripeSignature || "";
  } catch {
    return signature;
  }
}
