"use client";

import { useEffect, useMemo, useState } from "react";
import RichTextEditor from "@/content-cms/RichTextEditor";

type Block = {
  id: string;
  page_key: string;
  section_key: string;
  field_key: string;
  locale: "es" | "en";
  label: string;
  type: "text" | "textarea" | "richtext";
  value: string | null;
  default_value: string | null;
  sort_order: number;
};

type Notify = (message: string, tone?: "success" | "error") => void;

const sectionLabels: Record<string, string> = {
  hero: "Hero",
  recreo: "Recreo",
  specialists: "Especialistas",
  rsvp: "Lanzamiento",
  discover: "Descubre",
  discover_nav: "Menú Descubre",
  faq: "FAQ",
  footer: "Footer",
};

export default function ContentManager({ notify }: { notify: Notify }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeLocale, setActiveLocale] = useState<"es" | "en">("es");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content?pageKey=landing");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el contenido.");
      setBlocks(data.blocks || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo cargar el contenido.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sections = useMemo(() => {
    const grouped = new Map<string, Block[]>();
    blocks
      .filter((block) => block.locale === activeLocale)
      .forEach((block) => {
        const current = grouped.get(block.section_key) || [];
        current.push(block);
        grouped.set(block.section_key, current);
      });
    return Array.from(grouped.entries()).map(([sectionKey, items]) => ({
      sectionKey,
      items: items.sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [blocks, activeLocale]);

  function updateBlock(id: string, value: string) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, value } : block))
    );
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey: "landing",
          blocks: blocks.map((block) => ({
            sectionKey: block.section_key,
            fieldKey: block.field_key,
            locale: block.locale,
            type: block.type,
            value: block.value ?? block.default_value ?? "",
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el contenido.");
      notify("Contenido actualizado.");
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : "No se pudo guardar el contenido.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <p className="admin-muted">Cargando contenido editable...</p>
      </div>
    );
  }

  return (
    <div className="admin-section-stack">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">CMS de landing</p>
          <h2>Contenido público</h2>
          <p className="admin-muted">
            Edita los textos principales de la landing en español e inglés. Los cambios se publican al guardar.
          </p>
        </div>
        <div className="admin-form-actions">
          <a className="admin-btn" href="/" target="_blank" rel="noreferrer">
            Vista pública
          </a>
          <button className="admin-primary" onClick={save} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="admin-tabs" role="group" aria-label="Idioma del contenido">
        <button
          className="admin-pill"
          onClick={() => setActiveLocale("es")}
          aria-pressed={activeLocale === "es"}
        >
          Español
        </button>
        <button
          className="admin-pill"
          onClick={() => setActiveLocale("en")}
          aria-pressed={activeLocale === "en"}
        >
          English
        </button>
      </div>

      {sections.map((section) => (
        <section className="admin-panel cms-section" key={section.sectionKey}>
          <div className="cms-section-head">
            <p className="admin-kicker">
              {sectionLabels[section.sectionKey] || section.sectionKey}
            </p>
            <span className="admin-muted">{activeLocale.toUpperCase()}</span>
          </div>

          <div className="cms-field-grid">
            {section.items.map((block) => {
              const value = block.value ?? block.default_value ?? "";
              const labelId = `cms-${block.id}`;
              return (
                <div className="cms-field" key={block.id}>
                  <span id={labelId}>{block.label}</span>
                  {block.type === "richtext" ? (
                    <RichTextEditor
                      value={value}
                      labelledBy={labelId}
                      onChange={(next) => updateBlock(block.id, next)}
                    />
                  ) : block.type === "textarea" ? (
                    <textarea
                      value={value}
                      aria-labelledby={labelId}
                      rows={4}
                      onChange={(event) => updateBlock(block.id, event.target.value)}
                    />
                  ) : (
                    <input
                      value={value}
                      aria-labelledby={labelId}
                      onChange={(event) => updateBlock(block.id, event.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
