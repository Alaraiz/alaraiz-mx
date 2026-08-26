"use client";
import { FormEvent, useEffect, useState } from "react";

type Collection = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
};

type Props = {
  notify: (message: string) => void;
};

export default function CollectionManager({ notify }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", nameEn: "", description: "" });

  async function fetchCollections() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/collections");
      if (!res.ok) throw new Error((await res.json()).error || "Error al cargar.");
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al cargar colecciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm({ name: "", nameEn: "", description: "" });
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(col: Collection) {
    setEditing(col);
    setForm({ name: col.name, nameEn: col.name_en || "", description: col.description || "" });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      notify("El nombre es obligatorio.");
      return;
    }
    setSaving(true);

    try {
      if (editing) {
        const res = await fetch(`/api/admin/collections/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Error al actualizar.");
        notify("Colección actualizada.");
      } else {
        const res = await fetch("/api/admin/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Error al crear.");
        notify("Colección creada.");
      }
      resetForm();
      await fetchCollections();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(col: Collection) {
    if (!window.confirm(`¿Eliminar "${col.name}"? Las experiencias que la usen quedarán sin colección.`)) return;

    try {
      const res = await fetch(`/api/admin/collections/${col.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Error al eliminar.");
      notify("Colección eliminada.");
      await fetchCollections();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al eliminar.");
    }
  }

  async function toggleActive(col: Collection) {
    try {
      const res = await fetch(`/api/admin/collections/${col.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !col.is_active }),
      });
      if (!res.ok) throw new Error("Error");
      await fetchCollections();
    } catch {
      notify("Error al cambiar estado.");
    }
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <p className="admin-muted">Cargando colecciones…</p>
      </div>
    );
  }

  return (
    <div className="admin-section-stack">
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Catálogo</p>
          <p className="admin-muted">Agrupa experiencias y facilitadores por colección.</p>
        </div>
        {!showForm && (
          <button className="admin-primary admin-small" onClick={() => setShowForm(true)}>
            ＋ Nueva colección
          </button>
        )}
      </div>

      {showForm && (
        <form
          className="admin-panel admin-inline-form"
          onSubmit={handleSubmit}
        >
          <p className="admin-form-title">
            {editing ? "Editar colección" : "Nueva colección"}
          </p>
          <label>
            Nombre (ES)
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Ej. Colección III"
            />
          </label>
          <label>
            Name (EN)
            <input
              type="text"
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder="E.g. Collection III"
            />
          </label>
          <label className="admin-form-wide">
            Descripción (opcional)
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Breve descripción de la colección"
            />
          </label>
          <div className="admin-form-row-actions">
            <button type="button" className="admin-btn" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="admin-primary admin-small" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-panel admin-list-panel">
        <p className="admin-muted admin-list-count">
          {collections.length} colección{collections.length !== 1 ? "es" : ""}
        </p>
        {collections.length === 0 ? (
          <p className="admin-empty">No hay colecciones creadas. Crea una para organizar tus experiencias.</p>
        ) : (
          collections.map((col) => (
            <div
              key={col.id}
              className="admin-list-row"
            >
              <span
                className={`admin-status-dot ${col.is_active ? "is-active" : "is-inactive"}`}
                title={col.is_active ? "Activa" : "Inactiva"}
              />

              <div className="admin-list-main">
                <strong style={{ fontSize: "0.85rem" }}>{col.name}</strong>
                {col.name_en && (
                  <span className="admin-muted" style={{ fontSize: "0.72rem", marginLeft: "0.4rem" }}>
                    / {col.name_en}
                  </span>
                )}
                {col.description && (
                  <p className="admin-muted" style={{ fontSize: "0.72rem", margin: "0.1rem 0 0" }}>
                    {col.description}
                  </p>
                )}
              </div>

              <div className="admin-row-actions">
                <button
                  className="admin-btn admin-small"
                  onClick={() => toggleActive(col)}
                  title={col.is_active ? "Desactivar" : "Activar"}
                >
                  {col.is_active ? "Desactivar" : "Activar"}
                </button>
                <button className="admin-btn admin-small" onClick={() => startEdit(col)}>
                  Editar
                </button>
                <button className="admin-btn-danger" onClick={() => handleDelete(col)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
