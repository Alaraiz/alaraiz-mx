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
  const [activeSection, setActiveSection] = useState("hero");
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

    return Array.from(grouped.entries())
      .map(([sectionKey, items]) => ({
        sectionKey,
        items: items.sort((a, b) => a.sort_order - b.sort_order),
      }))
      .sort((a, b) => (a.items[0]?.sort_order || 0) - (b.items[0]?.sort_order || 0));
  }, [blocks, activeLocale]);

  const activeSectionData =
    sections.find((section) => section.sectionKey === activeSection) || sections[0];

  useEffect(() => {
    if (sections.length && !sections.some((section) => section.sectionKey === activeSection)) {
      setActiveSection(sections[0].sectionKey);
    }
  }, [activeSection, sections]);

  function updateBlock(id: string, value: string) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, value } : block))
    );
  }

  function addFaqItem() {
    const faqBlocks = blocks.filter((block) => block.section_key === "faq" && block.locale === activeLocale);
    const nextNumber =
      Math.max(
        0,
        ...faqBlocks
          .map((block) => Number(block.field_key.replace(/^[qa]/, "")))
          .filter(Number.isFinite)
      ) + 1;
    const padded = String(nextNumber).padStart(2, "0");
    const baseSort = 800 + (nextNumber - 1) * 10;

    setBlocks((current) => [
      ...current,
      {
        id: `new-faq-q-${activeLocale}-${padded}`,
        page_key: "landing",
        section_key: "faq",
        field_key: `q${padded}`,
        locale: activeLocale,
        label: `FAQ ${padded} / ${activeLocale === "es" ? "pregunta" : "question"}`,
        type: "text",
        value: "",
        default_value: "",
        sort_order: baseSort,
      },
      {
        id: `new-faq-a-${activeLocale}-${padded}`,
        page_key: "landing",
        section_key: "faq",
        field_key: `a${padded}`,
        locale: activeLocale,
        label: `FAQ ${padded} / ${activeLocale === "es" ? "respuesta" : "answer"}`,
        type: "textarea",
        value: "",
        default_value: "",
        sort_order: baseSort + 2,
      },
    ]);
    setActiveSection("faq");
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
            label: block.label,
            type: block.type,
            sortOrder: block.sort_order,
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
    <div className="admin-section-stack cms-manager">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">CMS de landing</p>
          <h2>Contenido público</h2>
          <p className="admin-muted">
            Edita por sección para mantener el contenido ordenado. Los cambios se publican al guardar.
          </p>
        </div>
        <div className="admin-form-actions cms-head-actions">
          <a className="admin-btn" href="/" target="_blank" rel="noreferrer">
            Vista pública
          </a>
          <button className="admin-primary" onClick={save} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="admin-panel cms-controls">
        <label>
          Idioma
          <select value={activeLocale} onChange={(event) => setActiveLocale(event.target.value as "es" | "en")}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          Sección
          <select value={activeSectionData?.sectionKey || ""} onChange={(event) => setActiveSection(event.target.value)}>
            {sections.map((section) => (
              <option key={section.sectionKey} value={section.sectionKey}>
                {sectionLabels[section.sectionKey] || section.sectionKey}
              </option>
            ))}
          </select>
        </label>
        {activeSectionData?.sectionKey === "faq" && (
          <button type="button" className="admin-btn" onClick={addFaqItem}>
            + Añadir pregunta
          </button>
        )}
      </div>

      {activeSectionData && (
        <section className="admin-panel cms-section" key={activeSectionData.sectionKey}>
          <div className="cms-section-head">
            <p className="admin-kicker">
              {sectionLabels[activeSectionData.sectionKey] || activeSectionData.sectionKey}
            </p>
            <span className="admin-muted">{activeLocale.toUpperCase()}</span>
          </div>

          {activeSectionData.sectionKey === "faq" ? (
            <div className="cms-faq-list">
              {faqPairs(activeSectionData.items).map(({ number, question, answer }) => (
                <div className="cms-faq-row" key={number}>
                  <span className="cms-faq-number">{number}</span>
                  {question && <CmsField block={question} updateBlock={updateBlock} />}
                  {answer && <CmsField block={answer} updateBlock={updateBlock} />}
                </div>
              ))}
            </div>
          ) : (
            <div className="cms-field-grid">
              {activeSectionData.items.map((block) => (
                <CmsField key={block.id} block={block} updateBlock={updateBlock} />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="cms-save-bar">
        <span>{sectionLabels[activeSectionData?.sectionKey || ""] || "Contenido"} · {activeLocale.toUpperCase()}</span>
        <button className="admin-primary" onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function CmsField({
  block,
  updateBlock,
}: {
  block: Block;
  updateBlock: (id: string, value: string) => void;
}) {
  const value = block.value ?? block.default_value ?? "";
  const labelId = `cms-${block.id}`;

  return (
    <div className="cms-field">
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
}

function faqPairs(items: Block[]) {
  const numbers = Array.from(
    new Set(
      items
        .map((block) => block.field_key.match(/^[qa](\d+)$/)?.[1])
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => Number(a) - Number(b));

  return numbers.map((number) => ({
    number,
    question: items.find((block) => block.field_key === `q${number}`),
    answer: items.find((block) => block.field_key === `a${number}`),
  }));
}
