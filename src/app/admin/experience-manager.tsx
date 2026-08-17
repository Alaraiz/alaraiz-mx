"use client";
import { FormEvent, useRef, useState } from "react";

type Row = Record<string, string | number | null>;
type Props = {
  data: { experiences: Row[]; facilitators: Row[] };
  refresh: () => void;
  notify: (message: string) => void;
};

export default function ExperienceManager({ data, refresh, notify }: Props) {
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [imageUrl, setImageUrl] = useState("/assets/exp-mesa.jpg");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  }

  function startEditing(experience: Row) {
    setCreating(false);
    setEditing(experience);
    setImageUrl(String(experience.cover_image_url || "/assets/exp-mesa.jpg"));
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p className="admin-muted">
          Haz clic en una tarjeta para editarla y actualizar la landing.
        </p>
        <button className="admin-primary admin-small" onClick={startCreating}>
          ＋ Nueva experiencia
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {data.experiences.map((experience) => (
          <button
            className="admin-panel"
            style={{ cursor: "pointer", textAlign: "left", padding: "0", overflow: "hidden" }}
            key={String(experience.id)}
            onClick={() => startEditing(experience)}
          >
            <div
              style={{
                height: 140,
                backgroundImage: `url(${experience.cover_image_url || "/assets/exp-mesa.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
              }}
            >
              <span
                className="admin-pill"
                style={{ position: "absolute", top: 8, left: 8, background: "var(--admin-surface)" }}
              >
                {experience.is_published ? "PUBLICADA" : "BORRADOR"}
              </span>
            </div>
            <div style={{ padding: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem" }}>{experience.title}</h3>
              <p className="admin-muted" style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>
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
            <h3>{editing?.title || "Crear experiencia"}</h3>
            <div className="admin-form-grid">
              <label>
                Nombre
                <input name="title" defaultValue={String(active.title || "")} required />
              </label>
              <label>
                Etiqueta
                <input name="tag" defaultValue={String(active.tag || "")} />
              </label>
              <label>
                Duración
                <input name="duration" defaultValue={String(active.duration || "")} />
              </label>
              <label>
                Precio MXN
                <input
                  name="price"
                  type="number"
                  defaultValue={active.price == null ? "" : String(active.price)}
                />
              </label>
              <label>
                Cupo total
                <input
                  name="capacity"
                  type="number"
                  defaultValue={String(active.capacity || 12)}
                  min="1"
                />
              </label>
              <label>
                Imagen de portada
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", overflow: "hidden" }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ minWidth: 0, maxWidth: "100%" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                  {uploading && <span className="admin-muted" style={{ fontSize: "0.75rem", flexShrink: 0 }}>Subiendo…</span>}
                </div>
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ marginTop: "0.5rem", maxHeight: 120, borderRadius: 6, objectFit: "cover" }}
                  />
                )}
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL de imagen (se llena automáticamente al subir)"
                  style={{ marginTop: "0.4rem", fontSize: "0.8rem", opacity: 0.7 }}
                />
              </label>
              <label>
                Colección
                <select name="collection" defaultValue={String(active.collection || "")}>
                  <option value="">— Sin colección —</option>
                  <option value="Colección II">Colección II</option>
                  <option value="Colección III">Colección III</option>
                  <option value="Próximamente">Próximamente</option>
                </select>
              </label>
              <label>
                Anfitrión
                <select name="facilitatorId" defaultValue={String(active.facilitator_id || "")}>
                  <option value="">— Sin anfitrión —</option>
                  {data.facilitators.map((f) => (
                    <option key={String(f.id)} value={String(f.id)}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ritmo
                <input name="pace" defaultValue={String(active.pace || "")} placeholder="Ej. Con pausas, Tranquilo" />
              </label>
              <label>
                Zona
                <input name="zone" defaultValue={String(active.zone || "")} placeholder="Ej. San Rafael → Centro" />
              </label>
              <label>
                Idioma
                <input name="language" defaultValue={String(active.language || "ES / EN")} />
              </label>
            </div>
            <label>
              Incluye
              <textarea name="includes" rows={2} defaultValue={String(active.includes || "")} placeholder="Ej. Picnic incluido · Caminata en bosque" />
            </label>
            <label>
              Descripción
              <textarea name="description" rows={5} defaultValue={String(active.description || "")} />
            </label>
            <label style={{ display: "flex", flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
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
                  {deleting ? "Eliminando…" : "Eliminar experiencia"}
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" onClick={closeModal}>
                Cancelar
              </button>
              <button className="admin-primary">Guardar cambios</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
