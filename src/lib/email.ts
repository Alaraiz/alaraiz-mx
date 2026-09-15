import { readFile } from "fs/promises";
import path from "path";
import { Resend } from "resend";
import { db } from "@/lib/db";
import {
  DEFAULT_EMAIL_TEMPLATES,
  type EmailTemplateDefault,
  type EmailTemplateKey,
} from "@/lib/email-template-defaults";
import { siteUrl } from "@/lib/site";

const FROM = process.env.EMAIL_FROM || "Raíz <onboarding@resend.dev>";

type SendArgs = {
  idempotencyKey?: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
    encoding?: "utf8" | "base64";
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

type EmailTemplate = EmailTemplateDefault;

type TemplateVars = Record<string, string | number | null | undefined>;

export async function sendEmail({ to, subject, html, attachments, idempotencyKey }: SendArgs): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
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
        content:
          attachment.encoding === "base64"
            ? attachment.content
            : Buffer.from(attachment.content).toString("base64"),
        contentType: attachment.contentType,
      })),
    }, idempotencyKey ? { idempotencyKey } : undefined);

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

function layout(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string, footer?: string): string {
  const cta = ctaLabel && ctaUrl
    ? `<tr><td style="padding:28px 0 6px;text-align:center">
         <a href="${ctaUrl}" style="display:inline-block;background:#1c6b57;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 30px;border-radius:999px">${ctaLabel}</a>
       </td></tr>`
    : "";

  const footerHtml = footer ? textToHtml(footer) : "Raíz · La ciudad debajo de la ciudad<br/>Ciudad de México · Este correo se generó automáticamente para tu reserva.";

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
    ${footerHtml}
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
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

export async function getReservationEntryAttachments() {
  const files = [
    {
      source: path.join(process.cwd(), "public", "email-assets", "entrada-recreo-es.jpeg"),
      filename: "entrada-recreo-es.jpeg",
      contentType: "image/jpeg",
    },
    {
      source: path.join(process.cwd(), "public", "email-assets", "entrada-recreo-en.jpeg"),
      filename: "entrada-recreo-en.jpeg",
      contentType: "image/jpeg",
    },
  ];

  try {
    return await Promise.all(
      files.map(async (file) => ({
        filename: file.filename,
        content: await readFile(file.source, { encoding: "base64" }),
        contentType: file.contentType,
        encoding: "base64" as const,
      }))
    );
  } catch (error) {
    console.error("[email] no se pudieron cargar las entradas adjuntas:", error);
    return [];
  }
}

export async function getEmailTemplate(key: EmailTemplateKey): Promise<EmailTemplate> {
  try {
    const result = await db.execute({
      sql: "SELECT key, label, subject, title, body, cta_label, footer FROM email_templates WHERE key = ? LIMIT 1",
      args: [key],
    });
    const row = result.rows[0];
    if (!row) return DEFAULT_EMAIL_TEMPLATES[key];

    return {
      key,
      label: String(row.label || DEFAULT_EMAIL_TEMPLATES[key].label),
      subject: String(row.subject || DEFAULT_EMAIL_TEMPLATES[key].subject),
      title: String(row.title || DEFAULT_EMAIL_TEMPLATES[key].title),
      body: String(row.body || DEFAULT_EMAIL_TEMPLATES[key].body),
      cta_label: String(row.cta_label || DEFAULT_EMAIL_TEMPLATES[key].cta_label),
      footer: String(row.footer || DEFAULT_EMAIL_TEMPLATES[key].footer),
    };
  } catch (error) {
    console.error(`[email] no se pudo leer la plantilla ${key}:`, error);
    return DEFAULT_EMAIL_TEMPLATES[key];
  }
}

function renderTemplate(value: string, vars: TemplateVars) {
  return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    const next = vars[key];
    return next == null || next === "" ? match : String(next);
  });
}

function templateVars(data: ReservationEmailData, links: { confirmationUrl?: string; surveyUrl?: string }): TemplateVars {
  return {
    nombre: data.customerName,
    experiencia: data.experienceTitle,
    fecha: formatExperienceDate(data.date),
    hora: formatExperienceTime(data.time),
    personas: data.attendeesCount,
    total: formatMoney(data.amount),
    descuento: data.discountAmount ? formatMoney(data.discountAmount) : "",
    codigo_descuento: data.discountCode || "",
    duracion: data.duration || "Por confirmar",
    punto_encuentro: data.meetingPoint || "Por confirmar",
    que_esperar: data.whatToExpect || "Pronto te compartiremos este detalle.",
    link_confirmacion: links.confirmationUrl || "",
    link_cuestionario: links.surveyUrl || "",
  };
}

export function tplReservationConfirmed(data: ReservationEmailData, template = DEFAULT_EMAIL_TEMPLATES.reservation_confirmation): { subject: string; html: string } {
  const confirmationUrl = `${siteUrl()}/confirmacion?ref=${encodeURIComponent(data.paymentReference || data.reservationId)}`;
  const vars = templateVars(data, { confirmationUrl });
  return {
    subject: renderTemplate(template.subject, vars),
    html: layout(
      renderTemplate(template.title, vars),
      textToHtml(renderTemplate(template.body, vars)),
      renderTemplate(template.cta_label, vars),
      confirmationUrl,
      renderTemplate(template.footer, vars)
    ),
  };
}

export type RescheduleEmailData = ReservationEmailData & { previousDate: string; previousTime: string };

export function tplReservationRescheduled(data: RescheduleEmailData, template = DEFAULT_EMAIL_TEMPLATES.reservation_rescheduled) {
  const confirmationUrl = `${siteUrl()}/confirmacion?ref=${encodeURIComponent(data.paymentReference || data.reservationId)}`;
  const vars = {
    ...templateVars(data, { confirmationUrl }),
    fecha_anterior: formatExperienceDate(data.previousDate),
    hora_anterior: formatExperienceTime(data.previousTime),
  };
  return {
    subject: renderTemplate(template.subject, vars),
    html: layout(renderTemplate(template.title, vars), textToHtml(renderTemplate(template.body, vars)),
      renderTemplate(template.cta_label, vars), confirmationUrl, renderTemplate(template.footer, vars)),
  };
}

export function tplExitSurvey(data: ReservationEmailData, template = DEFAULT_EMAIL_TEMPLATES.exit_survey): { subject: string; html: string } {
  const surveyUrl = `${siteUrl()}/encuesta-salida/${encodeURIComponent(data.reservationId)}`;
  const vars = templateVars(data, { surveyUrl });
  return {
    subject: renderTemplate(template.subject, vars),
    html: layout(
      renderTemplate(template.title, vars),
      textToHtml(renderTemplate(template.body, vars)),
      renderTemplate(template.cta_label, vars),
      surveyUrl,
      renderTemplate(template.footer, vars)
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
