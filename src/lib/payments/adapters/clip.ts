import type { CheckoutInput, CheckoutResult, PaymentGateway, WebhookResult } from "../types";

type ClipPaymentResponse = {
  id?: string;
  status?: string;
  status_detail?: { message?: string; code?: string };
  message?: string;
  error_code?: string;
  detail?: string[];
  pending_action?: { type?: string; url?: string };
  external_reference?: string;
};

export class ClipPaymentError extends Error {
  statusCode: number;
  paymentStatus: "failed";

  constructor(message: string, statusCode = 402) {
    super(message);
    this.name = "ClipPaymentError";
    this.statusCode = statusCode;
    this.paymentStatus = "failed";
  }
}

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

    const body = JSON.stringify({
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
    });

    let response = await fetch("https://api.payclip.com/payments", {
      method: "POST",
      headers: {
        Authorization: this.authorizationHeader(),
        "Content-Type": "application/json",
      },
      body,
    });

    let payment = (await response.json().catch(() => ({}))) as ClipPaymentResponse;
    if (response.status === 401 && this.authScheme.toLowerCase() !== "basic") {
      response = await fetch("https://api.payclip.com/payments", {
        method: "POST",
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body,
      });
      payment = (await response.json().catch(() => ({}))) as ClipPaymentResponse;
    }

    if (!response.ok) {
      throw new ClipPaymentError(readClipError(payment, response.statusText), response.status === 401 ? 401 : 402);
    }

    const reference = payment.id || input.reservationId;
    const status = normalizeClipStatus(payment.status);
    const pendingActionUrl = payment.pending_action?.url;

    if (status === "failed") {
      throw new ClipPaymentError(
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

  private authorizationHeader() {
    if (/^(basic|bearer)\s+/i.test(this.apiKey)) return this.apiKey;
    return `${this.authScheme} ${this.apiKey}`;
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

function readClipError(payment: ClipPaymentResponse, fallback: string) {
  const detail = Array.isArray(payment.detail) ? payment.detail.filter(Boolean).join(". ") : "";
  return (
    detail ||
    payment.status_detail?.message ||
    payment.status_detail?.code ||
    payment.message ||
    payment.error_code ||
    fallback ||
    "Clip no pudo procesar el pago."
  );
}
