import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { DEFAULT_EMAIL_TEMPLATES, type EmailTemplateKey } from "@/lib/email-template-defaults";

export const dynamic = "force-dynamic";

const validKeys = new Set(Object.keys(DEFAULT_EMAIL_TEMPLATES));

export async function PUT(request: Request, { params }: { params: { key: string } }) {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!validKeys.has(params.key)) {
    return NextResponse.json({ error: "Plantilla no encontrada." }, { status: 404 });
  }

  try {
    await ensureMigrated();
    const body = await request.json();
    const key = params.key as EmailTemplateKey;
    const fallback = DEFAULT_EMAIL_TEMPLATES[key];
    const subject = String(body.subject || "").trim();
    const title = String(body.title || "").trim();
    const templateBody = String(body.body || "").trim();
    const ctaLabel = String(body.cta_label || "").trim();
    const footer = String(body.footer || "").trim();

    if (!subject || !title || !templateBody) {
      return NextResponse.json(
        { error: "Asunto, título y cuerpo son obligatorios." },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: `INSERT INTO email_templates (key, label, subject, title, body, cta_label, footer, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET
              subject = excluded.subject,
              title = excluded.title,
              body = excluded.body,
              cta_label = excluded.cta_label,
              footer = excluded.footer,
              updated_at = datetime('now')
            RETURNING key, label, subject, title, body, cta_label, footer, updated_at`,
      args: [key, fallback.label, subject, title, templateBody, ctaLabel || fallback.cta_label, footer || fallback.footer],
    });

    return NextResponse.json({ template: result.rows[0] });
  } catch (error) {
    console.error("[PUT /api/admin/email-templates/:key]", error);
    return NextResponse.json(
      { error: "No se pudo guardar la plantilla." },
      { status: 500 }
    );
  }
}
