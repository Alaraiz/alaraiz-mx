"use client";
import { FormEvent, useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
};

type Props = {
  notify: (message: string) => void;
};

export default function UserManager({ notify }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ email: "", name: "", role: "editor", password: "" });

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error((await res.json()).error || "Error al cargar usuarios.");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm({ email: "", name: "", role: "editor", password: "" });
    setEditingUser(null);
    setShowForm(false);
  }

  function startEdit(user: User) {
    setEditingUser(user);
    setForm({ email: user.email, name: user.name || "", role: user.role, password: "" });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        const body: Record<string, string> = { name: form.name, role: form.role };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Error al actualizar.");
        notify("Usuario actualizado.");
      } else {
        if (!form.email || !form.password) {
          notify("Email y contraseña son obligatorios.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Error al crear usuario.");
        notify("Usuario creado.");
      }
      resetForm();
      await fetchUsers();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`¿Eliminar a ${user.email}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Error al eliminar.");
      notify("Usuario eliminado.");
      await fetchUsers();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al eliminar.");
    }
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <p className="admin-muted">Cargando usuarios…</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="admin-kicker">Equipo</p>
          <p className="admin-muted">Gestiona quién tiene acceso al panel.</p>
        </div>
        {!showForm && (
          <button className="admin-primary admin-small" onClick={() => setShowForm(true)}>
            ＋ Nuevo usuario
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <form
          className="admin-panel admin-inline-form"
          onSubmit={handleSubmit}
          style={{ padding: "1rem" }}
        >
          <p style={{ gridColumn: "1 / -1", margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "var(--admin-text)" }}>
            {editingUser ? "Editar usuario" : "Nuevo usuario"}
          </p>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required={!editingUser}
              disabled={!!editingUser}
              placeholder="correo@ejemplo.com"
            />
          </label>
          <label>
            Nombre
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre completo"
            />
          </label>
          <label>
            Rol
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <label>
            {editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingUser}
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="button" className="admin-btn" onClick={resetForm}>
              Cancelar
            </button>
            <button type="submit" className="admin-primary admin-small" disabled={saving}>
              {saving ? "Guardando…" : editingUser ? "Guardar" : "Crear usuario"}
            </button>
          </div>
        </form>
      )}

      {/* Permissions legend */}
      <div className="admin-panel" style={{ padding: "0.8rem 1rem" }}>
        <p className="admin-kicker" style={{ marginBottom: "0.4rem" }}>Permisos por rol</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>Administrador</span>
            <p className="admin-muted" style={{ margin: "0.1rem 0 0", fontSize: "0.72rem" }}>
              Acceso completo: experiencias, facilitadores, calendario, CRM, pagos, usuarios.
            </p>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>Editor</span>
            <p className="admin-muted" style={{ margin: "0.1rem 0 0", fontSize: "0.72rem" }}>
              Acceso limitado: crear experiencias y gestionar facilitadores.
            </p>
          </div>
        </div>
      </div>

      {/* Users list */}
      <div className="admin-panel" style={{ maxHeight: 480, overflowY: "auto", padding: "1rem" }}>
        <p className="admin-muted" style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}>
          {users.length} usuario{users.length !== 1 ? "s" : ""}
        </p>
        {users.length === 0 ? (
          <p className="admin-empty">No hay usuarios registrados.</p>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.7rem",
                padding: "0.5rem 0.4rem",
                borderBottom: "1px solid var(--admin-border)",
              }}
            >
              {/* Avatar */}
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: user.role === "admin" ? "#4f46e5" : "var(--admin-accent)",
                  color: user.role === "admin" ? "#fff" : "var(--admin-accent-ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {(user.name || user.email).slice(0, 1).toUpperCase()}
              </span>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <strong style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.name || user.email}
                  </strong>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      padding: "0.1rem 0.45rem",
                      borderRadius: 12,
                      background: user.role === "admin" ? "#4f46e5" : "var(--admin-accent)",
                      color: user.role === "admin" ? "#fff" : "var(--admin-accent-ink)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      flexShrink: 0,
                    }}
                  >
                    {user.role === "admin" ? "Admin" : "Editor"}
                  </span>
                </div>
                <span className="admin-muted" style={{ fontSize: "0.72rem" }}>
                  {user.email}
                  {user.created_at && ` · ${new Date(user.created_at).toLocaleDateString("es-MX")}`}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                <button className="admin-btn admin-small" onClick={() => startEdit(user)}>
                  Editar
                </button>
                <button className="admin-btn-danger" onClick={() => handleDelete(user)}>
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
