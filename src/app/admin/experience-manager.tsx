"use client";
import { FormEvent, useRef, useState } from "react";

type Row = Record<string, string | number | null>;
type Props = {
  data: { experiences: Row[]; facilitators: Row[]; collections: Row[] };
  refresh: () => void;
  notify: (message: string) => void;
};

export default function ExperienceManager({ data, refresh, notify }: Props) {
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [imageUrl, setImageUrl] = useState("/assets/exp-mesa.jpg");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contentLang, setContentLang] = useState<"es" | "en">("es");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const active = editing || (creating ? {} : null);

  async function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      notify("Solo se permiten archivos de imagen.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify("El archivo excede el límite de 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen.");
      setImageUrl(data.url);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al subir imagen.");
    } finally {
      setUploading(false);
    }
  }

  function startCreating() {
    setEditing(null);
    setCreating(true);
    setImageUrl("/assets/exp-mesa.jpg");
    setContentLang("es");
  }

  function startEditing(experience: Row) {
    setCreating(false);
    setEditing(experience);
    setImageUrl(String(experience.cover_image_url || "/assets/exp-mesa.jpg"));
    setContentLang("es");
  }

  function closeModal() {
    setEditing(null);
    setCreating(false);
  }

  async function handleDelete() {
    if (!editing) return;
    const title = String(editing.title || "esta experiencia");
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/admin/experiences/" + editing.id, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(d.error || "Error al eliminar.");
      }
      notify("Experiencia eliminada.");
      closeModal();
      await refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setDeleting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(
      new FormData(event.currentTarget).entries()
    );
    const id = editing?.id;
    const path = id
      ? "/api/admin/experiences/" + id
      : "/api/admin/experiences";
    const price = values.price === "" ? null : Number(values.price);
    const capacity = Number(values.capacity);

    try {
      const response = await fetch(path, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          coverImageUrl: imageUrl,
          capacity,
          price,
          isPublished: values.isPublished === "on",
          collection: values.collection || null,
          facilitatorId: values.facilitatorId || null,
          pace: values.pace || null,
          zone: values.zone || null,
          language: values.language || null,
          includes: values.includes || null,
          titleEn: values.titleEn || null,
          tagEn: values.tagEn || null,
          descriptionEn: values.descriptionEn || null,
          includesEn: values.includesEn || null,
        }),
      });

      if (response.ok) {
        closeModal();
        await refresh();
        notify(id ? "Experiencia actualizada." : "Experiencia creada.");
      } else {
        const data = await response.json().catch(() => ({ error: "Error desconocido." }));
        notify(data.error || "No se pudo guardar.");
      }
    } catch {
      notify("Error de red al guardar la experiencia.");
    }
  }

  return (
    <>
      <div className="admin-page-head">
        <p className="admin-muted">
          Haz clic en una tarjeta para editarla y actualizar la landing.
        </p>
        <button className="admin-primary admin-small" onClick={startCreating}>
          ＋ Nueva experiencia
        </button>
      </div>
      <div className="admin-card-grid">
        {data.experiences.map((experience) => (
          <button
            className="admin-panel admin-resource-card"
            key={String(experience.id)}
            onClick={() => startEditing(experience)}
          >
            <div
              className="admin-resource-image"
              style={{
                backgroundImage: `url(${experience.cover_image_url || "/assets/exp-mesa.jpg"})`,
              }}
            >
              <span className="admin-pill admin-status-pill">
                {experience.is_published ? "PUBLICADA" : "BORRADOR"}
              </span>
            </div>
            <div className="admin-resource-body">
              <h3>{experience.title}</h3>
              <p className="admin-muted">
                {experience.tag || "Sin etiqueta"} · {experience.duration || "Sin duración"} · Cupo{" "}
                {experience.capacity}
              </p>
            </div>
          </button>
        ))}
        {!data.experiences.length && (
          <p className="admin-empty">No hay experiencias creadas todavía.</p>
        )}
      </div>

      {/* Modal */}
      {active && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <form
            className="admin-form admin-panel admin-modal"
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="admin-modal-close" onClick={closeModal}>
              ×
            </button>
            <p className="admin-kicker">
              {editing ? "Editar experiencia" : "Nueva experiencia"}
            </p>
            <h3>{editing ? String(editing.title) : "Completa los datos"}</h3>

            <div className="admin-form-grid">
              <label>
                Duración
                <input name="duration" defaultValue={String(active.duration || "")} placeholder="Ej. 3 horas" />
              </label>
              <label>
                Precio por persona (MXN)
                <input
                  name="price"
                  type="number"
                  min="0"
                  defaultValue={active.price == null ? "" : String(active.price)}
                  placeholder="0"
                />
              </label>
              <label>
                Cupo máximo
                <input
                  name="capacity"
                  type="number"
                  defaultValue={String(active.capacity || 12)}
                  min="1"
                />
              </label>
              <label>
                Anfitrión
                <select name="facilitatorId" defaultValue={String(active.facilitator_id || "")}>
                  <option value="">— Sin asignar —</option>
                  {data.facilitators.map((f) => (
                    <option key={String(f.id)} value={String(f.id)}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Colección
                <select name="collection" defaultValue={String(active.collection || "")}>
                  <option value="">— Ninguna —</option>
                  {data.collections.map((col) => (
                    <option key={String(col.id)} value={String(col.name)}>
                      {String(col.name)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ritmo
                <input name="pace" defaultValue={String(active.pace || "")} placeholder="Ej. Tranquilo, Con pausas" />
              </label>
              <label>
                Zona
                <input name="zone" defaultValue={String(active.zone || "")} placeholder="Ej. Centro → San Rafael" />
              </label>
              <label>
                Idioma de la experiencia
                <input name="language" defaultValue={String(active.language || "ES / EN")} />
              </label>
            </div>

            <div className="admin-panel-head" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
              <p className="admin-kicker" style={{ margin: 0 }}>Contenido</p>
              <div className="admin-tabs" role="group" aria-label="Idioma del contenido">
                <button
                  type="button"
                  className="admin-pill"
                  onClick={() => setContentLang("es")}
                  aria-pressed={contentLang === "es"}
                >
                  ES
                </button>
                <button
                  type="button"
                  className="admin-pill"
                  onClick={() => setContentLang("en")}
                  aria-pressed={contentLang === "en"}
                >
                  EN
                </button>
              </div>
            </div>

            <div style={{ display: contentLang === "es" ? "block" : "none" }}>
              <div className="admin-form-grid">
                <label>
                  Nombre de la experiencia
                  <input name="title" defaultValue={String(active.title || "")} required placeholder="Ej. Caminata al amanecer" />
                </label>
                <label>
                  Etiqueta
                  <input name="tag" defaultValue={String(active.tag || "")} placeholder="Ej. Naturaleza, Gastronomía" />
                </label>
              </div>
              <label>
                ¿Qué incluye?
                <textarea name="includes" rows={2} defaultValue={String(active.includes || "")} placeholder="Separa con comas: Picnic, Caminata guiada, Fotografía" />
              </label>
              <label>
                Descripción
                <textarea name="description" rows={4} defaultValue={String(active.description || "")} placeholder="Describe la experiencia para la página de detalle" />
              </label>
            </div>

            <div style={{ display: contentLang === "en" ? "block" : "none" }}>
              <div className="admin-form-grid">
                <label>
                  Experience name (EN)
                  <input name="titleEn" defaultValue={String(active.title_en || "")} placeholder="E.g. Sunrise hike" />
                </label>
                <label>
                  Tag (EN)
                  <input name="tagEn" defaultValue={String(active.tag_en || "")} placeholder="E.g. Nature, Gastronomy" />
                </label>
              </div>
              <label>
                What&apos;s included? (EN)
                <textarea name="includesEn" rows={2} defaultValue={String(active.includes_en || "")} placeholder="Separate with commas: Picnic, Guided walk, Photography" />
              </label>
              <label>
                Description (EN)
                <textarea name="descriptionEn" rows={4} defaultValue={String(active.description_en || "")} placeholder="Describe the experience for the detail page" />
              </label>
            </div>

            <label className="admin-kicker" style={{ marginTop: "0.5rem" }}>Imagen de portada</label>
            <div
              className={`admin-upload-zone${imageUrl && imageUrl !== "/assets/exp-mesa.jpg" ? "" : " is-empty"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--admin-accent)"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--admin-border)"; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "var(--admin-border)";
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageUpload(file);
              }}
            >
              {imageUrl && imageUrl !== "/assets/exp-mesa.jpg" ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Portada"
                    className="admin-upload-image"
                    style={{ opacity: uploading ? 0.5 : 1 }}
                  />
                  <div className="admin-img-overlay" style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.4)",
                  }}>
                    <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>
                      {uploading ? "Subiendo…" : "Clic o arrastra para cambiar"}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ opacity: uploading ? 0.5 : 1 }}>
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🖼</span>
                  <p style={{ fontSize: "0.85rem", color: "var(--admin-text)", margin: "0 0 0.25rem" }}>
                    {uploading ? "Subiendo imagen…" : "Arrastra una imagen aquí o haz clic para seleccionar"}
                  </p>
                  <p className="admin-muted" style={{ fontSize: "0.72rem", margin: 0 }}>JPG, PNG o WebP · máx 8 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </div>

            <label className="admin-checkbox-row">
              <input
                name="isPublished"
                type="checkbox"
                defaultChecked={Boolean(active.is_published)}
              />
              Publicar en la landing
            </label>

            <div className="admin-form-actions">
              {editing && (
                <button
                  type="button"
                  className="admin-btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Eliminando…" : "Eliminar"}
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" onClick={closeModal}>
                Cancelar
              </button>
              <button className="admin-primary">
                {editing ? "Guardar cambios" : "Crear experiencia"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
