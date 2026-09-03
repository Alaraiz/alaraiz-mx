import { Resend } from "resend";
import { siteUrl } from "@/lib/site";

const FROM = process.env.EMAIL_FROM || "Raíz <onboarding@resend.dev>";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
};

export type ReservationEmailData = {
  reservationId: string;
  paymentReference?: string | null;
  customerName: string;
  experienceTitle: string;
  date?: string | null;
  time?: string | null;
  attendeesCount: number;
  amount: number;
  discountAmount?: number | null;
  discountCode?: string | null;
  duration?: string | null;
  meetingPoint?: string | null;
  whatToExpect?: string | null;
};

export async function sendEmail({ to, subject, html, attachments }: SendArgs): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
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
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content).toString("base64"),
        contentType: attachment.contentType,
      })),
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

function formatExperienceDate(date?: string | null) {
  if (!date) return "Por confirmar";
  const parts = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).formatToParts(new Date(`${date}T12:00:00Z`));
  const weekday = capitalize(parts.find((part) => part.type === "weekday")?.value || "");
  const day = parts.find((part) => part.type === "day")?.value || "";
  const month = (parts.find((part) => part.type === "month")?.value || "").replace(".", "").toUpperCase();
  return [weekday, day, month].filter(Boolean).join(" ");
}

function formatExperienceTime(time?: string | null) {
  return time ? `${time} hrs` : "Por confirmar";
}

function capitalize(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function textToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

export function createReservationTicket(data: ReservationEmailData) {
  return [
    "re·creo by raíz · Ciudad de México",
    "",
    `Entrada para: ${data.experienceTitle}`,
    `Nombre: ${data.customerName}`,
    `Fecha: ${formatExperienceDate(data.date)}`,
    `Hora: ${formatExperienceTime(data.time)}`,
    `Punto de encuentro: ${data.meetingPoint || "Por confirmar"}`,
    `Referencia: ${data.paymentReference || data.reservationId}`,
    `Personas: ${data.attendeesCount}`,
    `Total: ${formatMoney(data.amount)}`,
  ].join("\n");
}

export function createTicketFilename(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `entrada-${slug || "recreo"}.txt`;
}

export function tplReservationConfirmed(data: ReservationEmailData): { subject: string; html: string } {
  return {
    subject: `Tu llave a la ciudad oculta · Bienvenido a la raíz · ${data.experienceTitle}`,
    html: layout(
      "Tu llave a la ciudad oculta",
      `<p style="margin:0 0 16px">¡Hola, ${escapeHtml(data.customerName)}!</p>
       <p style="margin:0 0 16px">Ya está: tu lugar está confirmado y no lo suelta nadie.</p>
       <p style="margin:0 0 16px">Somos pocos, ni uno más, y uno de esos lugares es tuyo. Así que sí: esta es tu llave a la ciudad oculta.</p>
       <p style="margin:0 0 16px">Bienvenido a la raíz — nos dio muchísimo gusto ver tu nombre en la lista para <strong style="color:#163229">${escapeHtml(data.experienceTitle)}</strong>.</p>
       <p style="margin:0 0 16px">Nos vemos pronto para recorrer esta historia desde adentro y compartir la ciudad como se vive de verdad.</p>
       <p style="margin:0 0 12px">Aquí lo importante, para que no lo tengas que buscar:</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:0;background:#f7f3eb;border:1px solid rgba(22,50,41,.09);border-radius:12px;padding:14px 16px;width:100%">
         ${fila("Punto de encuentro", escapeHtml(data.meetingPoint || "Por confirmar"))}
         ${fila("Cuándo", formatExperienceDate(data.date))}
         ${fila("Hora", formatExperienceTime(data.time))}
         ${data.duration ? fila("Duración", escapeHtml(data.duration)) : ""}
         ${fila("Qué esperar", textToHtml(data.whatToExpect || "Pronto te compartiremos este detalle."))}
       </table>
       <p style="margin:16px 0 10px">Te recomendamos traer:</p>
       <ul style="margin:0 0 16px 18px;padding:0;color:#163229">
         <li style="margin:0 0 8px">Zapatos cómodos</li>
         <li style="margin:0 0 8px">Gorra y/o bloqueador solar</li>
         <li style="margin:0 0 8px">Botella de agua reutilizable</li>
         <li style="margin:0 0 8px">Paraguas / chamarra</li>
       </ul>
       <p style="margin:0 0 16px">Cómo llegar: te sugerimos transporte público o rideshare — podrían presentarse cierres vehiculares y el estacionamiento en la zona es limitado.</p>
       <p style="margin:0 0 16px">Te va adjunta tu entrada. No hace falta imprimirla ni enseñarla en la puerta: es tuya, para presumirla si quieres y para que sepas que ya estás dentro. Si la compartes, etiquétanos: nos encanta ver quién viene.</p>
       <p style="margin:0 0 16px">Y si la vida se atraviesa y no puedes venir, avísanos con tiempo (24hrs para rembolso) y le damos tu lugar a alguien más.</p>
       <p style="margin:0 0 16px">Ya nos queremos ver,<br/><strong style="color:#163229">El equipo de re·creo</strong></p>
       <p style="margin:0;color:#6f7b76;font-size:12px">re·creo by raíz · Ciudad de México<br/>alaraiz.mx · recreobyraiz@pm.me</p>`,
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
