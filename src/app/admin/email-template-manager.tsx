"use client";

import { FormEvent, useMemo, useState } from "react";
import { EMAIL_TEMPLATE_VARIABLES } from "@/lib/email-template-defaults";

type Row = Record<string, string | number | null>;
type Props = {
  templates: Row[];
  refresh: () => void;
  notify: (message: string, tone?: "success" | "error") => void;
};

function text(value: unknown) {
  return value == null ? "" : String(value);
}

export default function EmailTemplateManager({ templates, refresh, notify }: Props) {
  const [activeKey, setActiveKey] = useState(() => text(templates[0]?.key) || "reservation_confirmation");
  const [saving, setSaving] = useState(false);
  const active = useMemo(
    () => templates.find((template) => text(template.key) === activeKey) || templates[0] || null,
    [activeKey, templates]
  );

  async function saveTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    setSaving(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const response = await fetch(`/api/admin/email-templates/${encodeURIComponent(text(active.key))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: values.subject,
          title: values.title,
          body: values.body,
          cta_label: values.cta_label,
          footer: values.footer,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la plantilla.");
      notify("Plantilla de correo guardada.");
      refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar la plantilla.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!active) {
    return (
      <div className="admin-panel">
        <p className="admin-muted">No encontramos plantillas de correo. Recarga el admin para intentar de nuevo.</p>
      </div>
    );
  }

  return (
    <div className="admin-section-stack">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Correos automatizados</p>
          <p className="admin-muted">
            Edita el texto que reciben las personas al confirmar una reserva o al pedirles feedback.
          </p>
        </div>
        <div className="admin-tabs" role="group" aria-label="Plantillas de correo">
          {templates.map((template) => (
            <button
              key={text(template.key)}
              type="button"
              className="admin-pill"
              aria-pressed={text(template.key) === activeKey}
              onClick={() => setActiveKey(text(template.key))}
            >
              {text(template.label)}
            </button>
          ))}
        </div>
      </div>

      <form key={text(active.key)} className="admin-panel admin-form admin-email-template-editor" onSubmit={saveTemplate}>
        <div className="admin-panel-head">
          <div>
            <p className="admin-kicker">{text(active.label)}</p>
            <h3>Texto del correo</h3>
          </div>
          <button type="submit" className="admin-primary admin-small" disabled={saving}>
            {saving ? "Guardando..." : "Guardar plantilla"}
          </button>
        </div>

        <label>
          Asunto
          <input name="subject" defaultValue={text(active.subject)} required />
        </label>
        <label>
          Título dentro del correo
          <input name="title" defaultValue={text(active.title)} required />
        </label>
        <label>
          Texto principal
          <textarea name="body" rows={14} defaultValue={text(active.body)} required />
        </label>
        <label>
          Texto del botón
          <input name="cta_label" defaultValue={text(active.cta_label)} />
        </label>
        <label>
          Pie del correo
          <textarea name="footer" rows={3} defaultValue={text(active.footer)} />
        </label>

        <div className="admin-template-vars">
          <p className="admin-kicker">Variables disponibles</p>
          <div>
            {EMAIL_TEMPLATE_VARIABLES.map(([variable, label]) => (
              <span key={variable} title={label}>
                {variable}
              </span>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
