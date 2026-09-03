import { Resend } from "resend";
import { siteUrl } from "@/lib/site";

const FROM = process.env.EMAIL_FROM || "Raíz <onboarding@resend.dev>";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

type ReservationEmailData = {
  reservationId: string;
  paymentReference?: string | null;
  customerName: string;
  experienceTitle: string;
  date?: string | null;
  time?: string | null;
  attendeesCount: number;
  amount: number;
  subtotalAmount?: number | null;
  discountAmount?: number | null;
  discountCode?: string | null;
};

export async function sendEmail({ to, subject, html }: SendArgs): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email omitido - falta RESEND_API_KEY] para=${to} asunto="${subject}"`);
    return { ok: true, skipped: true };
  }

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] error de Resend:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] excepcion:", error);
    return { ok: false, error: error instanceof Error ? error.message : "error" };
  }
}

function layout(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaLabel && ctaUrl
    ? `<tr><td style="padding:28px 0 6px;text-align:center">
         <a href="${ctaUrl}" style="display:inline-block;background:#1c6b57;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 30px;border-radius:999px">${ctaLabel}</a>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#f4efe7">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe7;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
  <tr><td style="padding:0 8px 20px;text-align:left">
    <span style="display:inline-block;width:11px;height:11px;border-radius:999px;background:#1c6b57;box-shadow:0 0 0 4px rgba(28,107,87,.18);vertical-align:middle"></span>
    <span style="color:#163229;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;letter-spacing:.14em;vertical-align:middle;padding-left:10px">Raíz</span>
  </td></tr>
  <tr><td style="background:#fffdf8;border:1px solid rgba(22,50,41,.1);border-radius:20px;padding:34px 32px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif">
      <tr><td style="color:#163229;font-size:21px;font-weight:700;padding-bottom:14px">${title}</td></tr>
      <tr><td style="color:#4e5b55;font-size:14px;line-height:1.65">${bodyHtml}</td></tr>
      ${cta}
    </table>
  </td></tr>
  <tr><td style="padding:22px 8px;text-align:center;color:#6f7b76;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6">
    Raíz · La ciudad debajo de la ciudad<br/>
    Ciudad de México · Este correo se generó automáticamente para tu reserva.
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function fila(label: string, value: string) {
  return `<tr>
    <td style="color:#6f7b76;font-size:13px;padding:6px 14px 6px 0;white-space:nowrap">${label}</td>
    <td style="color:#163229;font-size:13px;font-weight:600;padding:6px 0">${value}</td>
  </tr>`;
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-MX")} MXN`;
}

function formatReservationDate(date?: string | null, time?: string | null) {
  if (!date && !time) return "Por confirmar";
  if (!date) return time || "Por confirmar";

  const label = new Date(`${date}T12:00:00Z`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return time ? `${label} · ${time} h` : label;
}

export function tplReservationConfirmed(data: ReservationEmailData): { subject: string; html: string } {
  const details = [
    fila("Experiencia", data.experienceTitle),
    fila("Fecha", formatReservationDate(data.date, data.time)),
    fila("Personas", String(data.attendeesCount)),
    fila("Total", formatMoney(data.amount)),
    data.discountAmount && data.discountAmount > 0
      ? fila(
          "Descuento",
          `${data.discountCode || "Aplicado"} · -${formatMoney(data.discountAmount).replace("$", "$")}`
        )
      : "",
    data.paymentReference ? fila("Referencia", data.paymentReference) : fila("Reserva", data.reservationId),
  ].filter(Boolean).join("");

  return {
    subject: `Reserva confirmada · ${data.experienceTitle}`,
    html: layout(
      "Tu lugar ya está apartado",
      `Hola ${escapeHtml(data.customerName)}, gracias por reservar con <strong style="color:#163229">Raíz</strong>.<br/><br/>
       Tu lugar para <strong style="color:#163229">${escapeHtml(data.experienceTitle)}</strong> ya quedó confirmado. Diseñamos cada salida en grupos pequeños y con anfitriones que conocen la ciudad desde adentro; este correo es tu referencia de reserva.
       <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#f7f3eb;border:1px solid rgba(22,50,41,.09);border-radius:12px;padding:14px 16px;width:100%">
         ${details}
       </table>
       <p style="margin:14px 0 0">Si hay indicaciones previas, punto de encuentro o recomendaciones útiles para vivir mejor la experiencia, te las compartiremos por este mismo medio.</p>
       <p style="margin:12px 0 0">Nos vemos pronto,<br/><strong style="color:#163229">El colectivo Raíz</strong></p>`,
      "Ver confirmación",
      `${siteUrl()}/confirmacion?ref=${encodeURIComponent(data.paymentReference || data.reservationId)}`
    ),
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
