import type { CheckoutInput, CheckoutResult, PaymentGateway, WebhookResult } from "../types";

const CLIP_PAYMENTS_ENDPOINT = "https://api.payclip.com/payments";

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

/**
 * Clip Checkout Transparente gateway.
 *
 * Authorization for POST https://api.payclip.com/payments follows Clip's
 * official docs (https://developer.clip.mx/reference/token-de-autenticacion):
 *
 *   Authorization: Basic base64(API_KEY + ":" + CLAVE_SECRETA)
 *
 * The backend requires BOTH the API Key and the Clave Secreta (secret). The
 * public API Key alone (used by the browser SDK) is NOT enough to authenticate
 * the payment call — that is the usual cause of "Unauthorized" here.
 */
export class ClipGateway implements PaymentGateway {
  private authorization: string;

  constructor() {
    this.authorization = buildClipAuthorization();
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!input.cardToken) {
      throw new Error("[ClipGateway] Falta el token de tarjeta de Clip.");
    }
    const customerPhone = normalizeClipPhone(input.customerPhone);
    if (customerPhone.length < 10) {
      throw new ClipPaymentError(
        "Clip requiere un teléfono válido de 10 dígitos para procesar el pago.",
        400
      );
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
        phone: customerPhone,
      },
    });

    let response: Response;
    try {
      response = await fetch(CLIP_PAYMENTS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: this.authorization,
          "Content-Type": "application/json",
        },
        body,
      });
    } catch (networkError) {
      logClipError({
        stage: "network",
        message: networkError instanceof Error ? networkError.message : "network error",
      });
      throw new ClipPaymentError(
        "No pudimos contactar a Clip para procesar el pago. Intenta de nuevo en unos minutos.",
        502
      );
    }

    const payment = (await response.json().catch(() => ({}))) as ClipPaymentResponse;

    if (!response.ok) {
      const sanitizedBody = sanitizeClipBody(payment);
      logClipError({
        stage: "http",
        status: response.status,
        statusText: response.statusText,
        endpoint: CLIP_PAYMENTS_ENDPOINT,
        scheme: schemeLabel(this.authorization),
        body: sanitizedBody,
      });

      if (response.status === 401 || response.status === 403) {
        // Authentication problem — surface a controlled, actionable message.
        throw new ClipPaymentError(
          "Clip rechazó la autenticación del comercio (Unauthorized). Verifica CLIP_API_KEY y CLIP_API_SECRET en el servidor.",
          response.status
        );
      }

      throw new ClipPaymentError(readClipError(payment, response.statusText), 402);
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

/**
 * Builds the exact Authorization header Clip expects for POST /payments.
 *
 * Precedence:
 *  1. If CLIP_API_KEY already includes a scheme prefix ("Basic "/"Bearer "),
 *     it is treated as a ready-to-use token and used verbatim.
 *  2. If CLIP_API_SECRET is set, encode base64(CLIP_API_KEY:CLIP_API_SECRET).
 *  3. If CLIP_API_KEY itself is in "key:secret" form, encode that.
 *  4. Otherwise fall back to base64(CLIP_API_KEY) and warn — this is almost
 *     certainly misconfigured (missing secret) and will likely 401.
 */
function buildClipAuthorization(): string {
  const rawKey = (process.env.CLIP_API_KEY || "").trim();
  if (!rawKey) {
    throw new Error("[ClipGateway] CLIP_API_KEY no configurado. Agrega la API Key de Clip.");
  }

  // 1) Already a full Authorization value (e.g. "Basic xxxx").
  if (/^(basic|bearer)\s+/i.test(rawKey)) {
    return rawKey;
  }

  const secret = (process.env.CLIP_API_SECRET || "").trim();

  // 2) API key + secret provided separately.
  if (secret) {
    return `Basic ${base64(`${rawKey}:${secret}`)}`;
  }

  // 3) API key already in "key:secret" form.
  if (rawKey.includes(":")) {
    return `Basic ${base64(rawKey)}`;
  }

  // 4) Only the API key, no secret. Almost certainly wrong for Payments.
  console.warn(
    "[ClipGateway] CLIP_API_SECRET no está configurado. La API de Payments de Clip requiere " +
      "Authorization: Basic base64(CLIP_API_KEY:CLAVE_SECRETA). Sin la clave secreta, Clip devolverá Unauthorized."
  );
  return `Basic ${base64(rawKey)}`;
}

function base64(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64");
}

function normalizeClipPhone(value?: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/** Human-readable scheme label for logs (never exposes the credential). */
function schemeLabel(authorization: string): string {
  const match = /^(\w+)\s+/.exec(authorization);
  return match ? match[1] : "unknown";
}

/** Removes anything that could be sensitive before logging Clip's error body. */
function sanitizeClipBody(payment: ClipPaymentResponse) {
  return {
    status: payment.status,
    status_detail: payment.status_detail,
    message: payment.message,
    error_code: payment.error_code,
    detail: payment.detail,
  };
}

function logClipError(info: Record<string, unknown>) {
  // Never logs the API key/secret or the Authorization value — only metadata.
  console.error("[ClipGateway] payment request failed", JSON.stringify(info));
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
  // rejected, cancelled, refunded, unknown → treat as failed for checkout purposes.
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
