"use client";
import { FormEvent, useState } from "react";

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
  const active = editing || (creating ? {} : null);

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
    } catch (err) {
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
                URL de imagen
                <input
                  name="coverImageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
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
