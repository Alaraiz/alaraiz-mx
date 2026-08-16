import type { PaymentGateway, CheckoutInput, CheckoutResult, WebhookResult } from "../types";

/**
 * Stripe payment adapter (STUB).
 *
 * Required environment variables:
 *   - STRIPE_SECRET_KEY: Your Stripe secret key (sk_live_... or sk_test_...)
 *   - PAYMENT_WEBHOOK_SECRET: Stripe webhook signing secret (whsec_...)
 *   - NEXT_PUBLIC_SITE_URL: Base URL for success/cancel redirects
 *
 * TODO: Install stripe SDK or use fetch against https://api.stripe.com/v1/
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

    // TODO: Replace with actual Stripe Checkout Session creation
    // Using fetch against Stripe API:
    // POST https://api.stripe.com/v1/checkout/sessions
    // Headers: Authorization: Bearer ${this.secretKey}
    // Body: mode=payment, line_items, success_url, cancel_url, metadata.reservationId

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
        success_url: `${baseUrl}/reservar/confirmacion?ref={CHECKOUT_SESSION_ID}`,
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
    // TODO: Implement Stripe signature verification using HMAC-SHA256
    // See: https://stripe.com/docs/webhooks/signatures
    // For now, basic parsing (INSECURE — replace before production)

    if (!signature) {
      throw new Error("[StripeGateway] Missing webhook signature.");
    }

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
}
