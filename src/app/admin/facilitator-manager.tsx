"use client";
import { FormEvent, useRef, useState } from "react";

type Row = Record<string, string | number | null>;
type Props = {
  data: { facilitators: Row[] };
  refresh: () => void;
  notify: (message: string) => void;
};

export default function FacilitatorManager({ data, refresh, notify }: Props) {
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
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
      setPhotoUrl(data.url);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al subir imagen.");
    } finally {
      setUploading(false);
    }
  }

  function startCreating() {
    setEditing(null);
    setCreating(true);
    setPhotoUrl("");
  }

  function startEditing(facilitator: Row) {
    setCreating(false);
    setEditing(facilitator);
    setPhotoUrl(String(facilitator.photo_url || ""));
  }

  function closeModal() {
    setEditing(null);
    setCreating(false);
  }

  async function handleDelete() {
    if (!editing) return;
    const name = String(editing.name || "este facilitador");
    if (!window.confirm(`¿Eliminar a "${name}"? Esta acción no se puede deshacer.`)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/admin/facilitators/" + editing.id, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(d.error || "Error al eliminar.");
      }
      notify("Facilitador eliminado.");
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
      ? "/api/admin/facilitators/" + id
      : "/api/admin/facilitators";

    try {
      const response = await fetch(path, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          role: values.role || null,
          bio: values.bio || null,
          photoUrl,
          collection: values.collection || null,
          reclaims: values.reclaims || null,
          isPublished: values.isPublished === "on",
        }),
      });

      if (response.ok) {
        closeModal();
        await refresh();
        notify(id ? "Facilitador actualizado." : "Facilitador creado.");
      } else {
        const data = await response.json().catch(() => ({ error: "Error desconocido." }));
        notify(data.error || "No se pudo guardar.");
      }
    } catch {
      notify("Error de red al guardar el facilitador.");
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p className="admin-muted">
          Gestiona los perfiles de los especialistas que guían cada experiencia.
        </p>
        <button className="admin-primary admin-small" onClick={startCreating}>
          ＋ Nuevo facilitador
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
        {data.facilitators.map((facilitator) => (
          <button
            className="admin-panel"
            style={{ cursor: "pointer", textAlign: "left", padding: "0", overflow: "hidden" }}
            key={String(facilitator.id)}
            onClick={() => startEditing(facilitator)}
          >
            <div
              style={{
                height: 120,
                backgroundImage: facilitator.photo_url
                  ? `url(${facilitator.photo_url})`
                  : "linear-gradient(135deg, #2a2a2a, #3a3a3a)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
              }}
            >
              <span
                className="admin-pill"
                style={{ position: "absolute", top: 8, left: 8, background: "var(--admin-surface)" }}
              >
                {facilitator.is_published ? "PUBLICADO" : "BORRADOR"}
              </span>
            </div>
            <div style={{ padding: "1rem" }}>
              <h3 style={{ fontSize: "1rem" }}>{facilitator.name}</h3>
              <p className="admin-muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                {facilitator.role || "Sin rol asignado"}
              </p>
            </div>
          </button>
        ))}
        {!data.facilitators.length && (
          <p className="admin-empty">No hay facilitadores creados todavía.</p>
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
              {editing ? "Editar facilitador" : "Nuevo facilitador"}
            </p>
            <h3>{editing ? String(editing.name) : "Crear facilitador"}</h3>
            <div className="admin-form-grid">
              <label>
                Nombre
                <input name="name" defaultValue={String(active.name || "")} required />
              </label>
              <label>
                Rol / Especialidad
                <input name="role" defaultValue={String(active.role || "")} placeholder="Ej. Sommelier, Chef, Guía" />
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
                Foto de perfil
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
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="Preview"
                    style={{ marginTop: "0.5rem", maxHeight: 100, borderRadius: 6, objectFit: "cover" }}
                  />
                )}
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="URL de foto (se llena automáticamente al subir)"
                  style={{ marginTop: "0.4rem", fontSize: "0.8rem", opacity: 0.7 }}
                />
              </label>
            </div>
            <label>
              Reclaims / Frase
              <input name="reclaims" defaultValue={String(active.reclaims || "")} placeholder="Ej. Caminante experto desde 2010" />
            </label>
            <label>
              Bio
              <textarea name="bio" rows={4} defaultValue={String(active.bio || "")} placeholder="Breve biografía del facilitador" />
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
                  {deleting ? "Eliminando…" : "Eliminar facilitador"}
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
