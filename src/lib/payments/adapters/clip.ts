import type { CheckoutInput, CheckoutResult, PaymentGateway, WebhookResult } from "../types";

type ClipPaymentResponse = {
  id?: string;
  status?: string;
  status_detail?: { message?: string; code?: string };
  pending_action?: { type?: string; url?: string };
  external_reference?: string;
};

export class ClipGateway implements PaymentGateway {
  private apiKey: string;
  private authScheme: string;

  constructor() {
    const apiKey = process.env.CLIP_API_KEY;
    if (!apiKey) {
      throw new Error("[ClipGateway] CLIP_API_KEY no configurado. Agrega la API Key de Clip.");
    }

    this.apiKey = apiKey;
    this.authScheme = process.env.CLIP_AUTH_SCHEME || "Bearer";
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!input.cardToken) {
      throw new Error("[ClipGateway] Falta el token de tarjeta de Clip.");
    }
    if (!input.customerPhone) {
      throw new Error("[ClipGateway] Clip requiere teléfono del cliente para procesar el pago.");
    }

    const response = await fetch("https://api.payclip.com/payments", {
      method: "POST",
      headers: {
        Authorization: `${this.authScheme} ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(input.amount.toFixed(2)),
        currency: "MXN",
        description: input.description.slice(0, 255),
        external_reference: input.reservationId.slice(0, 36),
        payment_method: {
          token: input.cardToken,
        },
        customer: {
          email: input.customerEmail,
          phone: input.customerPhone,
        },
      }),
    });

    const payment = (await response.json().catch(() => ({}))) as ClipPaymentResponse;
    if (!response.ok) {
      const detail = payment.status_detail?.message || payment.status_detail?.code || response.statusText;
      throw new Error(`[ClipGateway] No se pudo procesar el pago: ${detail}`);
    }

    const reference = payment.id || input.reservationId;
    const status = normalizeClipStatus(payment.status);
    const pendingActionUrl = payment.pending_action?.url;

    if (status === "failed") {
      throw new Error(
        payment.status_detail?.message ||
          "Clip rechazó el pago. Revisa los datos de la tarjeta o intenta con otra."
      );
    }

    return {
      url: pendingActionUrl || `${input.baseUrl}/confirmacion?ref=${reference}`,
      reference,
      status,
      pendingActionUrl,
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<WebhookResult> {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const headers = readClipHeaders(signature);
    if (!secret || headers.xSignature !== secret) {
      throw new Error("[ClipGateway] Webhook verification is not configured.");
    }

    const event = JSON.parse(payload) as ClipPaymentResponse;
    return {
      reference: event.id || event.external_reference || "",
      status: normalizeClipStatus(event.status) === "paid" ? "paid" : "failed",
    };
  }
}

function readClipHeaders(signature: string) {
  try {
    return JSON.parse(signature) as { xSignature?: string };
  } catch {
    return { xSignature: signature };
  }
}

function normalizeClipStatus(status?: string): "paid" | "pending" | "failed" {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "paid";
  if (normalized === "pending" || normalized === "authorized") return "pending";
  return "failed";
}
