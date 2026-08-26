import type { PaymentGateway, CheckoutInput, CheckoutResult, WebhookResult } from "../types";

/**
 * MercadoPago payment adapter.
 *
 * Required environment variables:
 *   - MERCADOPAGO_TOKEN: Your MercadoPago access token
 *   - PAYMENT_WEBHOOK_SECRET: Secret for verifying webhook notifications
 *   - NEXT_PUBLIC_SITE_URL: Base URL for back_urls
 *
 * API docs: https://www.mercadopago.com.mx/developers/es/reference/preferences/_checkout_preferences/post
 */
export class MercadoPagoGateway implements PaymentGateway {
  private token: string;
  private webhookSecret: string;

  constructor() {
    const token = process.env.MERCADOPAGO_TOKEN;
    const whSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!token) {
      throw new Error(
        "[MercadoPagoGateway] MERCADOPAGO_TOKEN no configurado. Agrega la variable de entorno."
      );
    }
    if (!whSecret) {
      throw new Error(
        "[MercadoPagoGateway] PAYMENT_WEBHOOK_SECRET no configurado. Agrega la variable de entorno."
      );
    }

    this.token = token;
    this.webhookSecret = whSecret;
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const baseUrl = input.baseUrl;

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: input.description,
            quantity: 1,
            unit_price: input.amount,
            currency_id: input.currency.toUpperCase(),
          },
        ],
        payer: { email: input.customerEmail },
        back_urls: {
          success: `${baseUrl}/confirmacion?ref=${input.reservationId}`,
          failure: `${baseUrl}/reservar/cancelado`,
          pending: `${baseUrl}/confirmacion?ref=${input.reservationId}&pending=1`,
        },
        auto_return: "approved",
        external_reference: input.reservationId,
        metadata: { reservationId: input.reservationId },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`[MercadoPagoGateway] Error creando preferencia: ${err}`);
    }

    const pref = await response.json();
    return {
      url: pref.init_point || pref.sandbox_init_point,
      reference: pref.id,
    };
  }

  async verifyWebhook(_payload: string, signature: string): Promise<WebhookResult> {
    const headers = readMercadoPagoHeaders(signature);
    if (!headers.xSignature || !headers.xRequestId || !this.webhookSecret) {
      throw new Error("[MercadoPagoGateway] Secure webhook verification is not configured.");
    }

    throw new Error(
      "[MercadoPagoGateway] Webhook verification requires the provider-specific signed manifest flow before enabling confirmations."
    );
  }
}

function readMercadoPagoHeaders(signature: string) {
  try {
    return JSON.parse(signature) as { xSignature?: string; xRequestId?: string };
  } catch {
    return { xSignature: signature, xRequestId: "" };
  }
}
