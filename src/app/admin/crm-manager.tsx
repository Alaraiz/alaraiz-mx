"use client";
import { FormEvent, useMemo, useState } from "react";

type Row = Record<string, string | number | null>;
type Props = {
  data: {
    experiences: Row[];
    dates: Row[];
    customers: Row[];
    reservations: Row[];
    events: Row[];
    folders: Row[];
  };
  refresh: () => void;
  notify: (message: string) => void;
};

const stages = [
  ["todos", "Todos"],
  ["nuevo", "Nuevos"],
  ["interesado", "Interesados"],
  ["reserva_pendiente", "Reserva pendiente"],
  ["confirmado", "Confirmados"],
  ["recurrente", "Recurrentes"],
  ["inactivo", "Inactivos"],
];

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function stageLabel(value: unknown) {
  return stages.find((item) => item[0] === text(value))?.[1] || "Nuevo";
}

export default function CrmManager({ data, refresh, notify }: Props) {
  const [stage, setStage] = useState("todos");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      data.customers.filter((customer) => {
        const haystack =
          `${text(customer.name)} ${text(customer.email)} ${text(customer.phone)}`.toLowerCase();
        return (
          (stage === "todos" || text(customer.stage) === stage) &&
          (!search.trim() || haystack.includes(search.toLowerCase().trim()))
        );
      }),
    [data.customers, stage, search]
  );

  const selected =
    data.customers.find((c) => text(c.id) === selectedId) || null;

  // Customer events for the selected customer
  const customerEvents = useMemo(
    () =>
      selected
        ? data.events.filter((e) => text(e.customer_id) === text(selected.id))
        : [],
    [selected, data.events]
  );

  const customerReservations = useMemo(
    () =>
      selected
        ? data.reservations.filter((r) => text(r.customer_id) === text(selected.id))
        : [],
    [selected, data.reservations]
  );

  async function createCustomer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const values = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(d.error);
      }
      notify("Cliente creado.");
      setShowCreate(false);
      refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al crear cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function addNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const values = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/admin/crm-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: text(selected.id), title: values.title, body: values.body }),
      });
      if (!res.ok) throw new Error("Error");
      notify("Nota agregada.");
      e.currentTarget.reset();
      refresh();
    } catch {
      notify("Error al agregar nota.");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "1rem" }}>
      {/* Left: List */}
      <div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {stages.map((item) => (
            <button
              key={item[0]}
              className="admin-pill"
              style={{
                cursor: "pointer",
                background: stage === item[0] ? "var(--admin-accent)" : "transparent",
                color: stage === item[0] ? "var(--admin-accent-ink)" : "var(--admin-muted)",
                border: "1px solid var(--admin-border)",
                borderRadius: 20,
                padding: "0.3rem 0.7rem",
                fontSize: "0.75rem",
              }}
              onClick={() => setStage(item[0])}
            >
              {item[1]}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <input
            placeholder="Buscar por nombre, correo o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "var(--admin-bg)",
              border: "1px solid var(--admin-border)",
              borderRadius: "8px",
              padding: "0.5rem 0.7rem",
              color: "var(--admin-text)",
              font: "inherit",
              fontSize: "0.85rem",
            }}
          />
          <button
            className="admin-btn"
            onClick={() => setShowCreate(!showCreate)}
            style={{ padding: "0.5rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}
          >
            + Nuevo
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form
            className="admin-panel"
            onSubmit={createCustomer}
            style={{ marginBottom: "0.75rem", padding: "0.8rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}
          >
            <input name="name" placeholder="Nombre *" required style={inputStyle} />
            <input name="email" placeholder="Email *" type="email" required style={inputStyle} />
            <input name="phone" placeholder="Teléfono" style={inputStyle} />
            <select name="stage" style={inputStyle} defaultValue="nuevo">
              {stages.filter((s) => s[0] !== "todos").map((s) => (
                <option key={s[0]} value={s[0]}>{s[1]}</option>
              ))}
            </select>
            <button
              type="submit"
              className="admin-btn"
              disabled={saving}
              style={{ gridColumn: "1 / -1", padding: "0.5rem", cursor: saving ? "wait" : "pointer" }}
            >
              {saving ? "Guardando..." : "Crear cliente"}
            </button>
          </form>
        )}

        <div className="admin-panel" style={{ maxHeight: 480, overflowY: "auto" }}>
          <p className="admin-muted" style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}>
            {filtered.length} contacto{filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.map((customer) => (
            <div
              key={text(customer.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.7rem",
                padding: "0.5rem 0.4rem",
                borderBottom: "1px solid var(--admin-border)",
                cursor: "pointer",
                background: text(selected?.id) === text(customer.id) ? "var(--admin-border)" : "transparent",
                borderRadius: 4,
              }}
              onClick={() => setSelectedId(text(customer.id))}
            >
              <span
                className="admin-avatar"
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--admin-accent)", color: "var(--admin-accent-ink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
                }}
              >
                {text(customer.name).slice(0, 1).toUpperCase()}
              </span>
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: "0.85rem", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {text(customer.name)}
                </strong>
                <span className="admin-muted" style={{ fontSize: "0.72rem" }}>
                  {text(customer.email) || text(customer.phone) || "Sin datos"} · {stageLabel(customer.stage)}
                </span>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <p className="admin-empty" style={{ fontSize: "0.85rem" }}>No hay contactos con estos filtros.</p>
          )}
        </div>
      </div>

      {/* Right: Detail panel */}
      {selected && (
        <div>
          <div className="admin-panel" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{text(selected.name)}</h3>
                <p className="admin-muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  {text(selected.email)} · {text(selected.phone) || "Sin tel."}
                </p>
              </div>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: 12,
                  background: "var(--admin-accent)",
                  color: "var(--admin-accent-ink)",
                  textTransform: "uppercase",
                }}
              >
                {stageLabel(selected.stage)}
              </span>
            </div>
            <p className="admin-muted" style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Fuente: {text(selected.source) || "landing"} · Creado: {text(selected.created_at).slice(0, 10)}
            </p>
            {selected.notes && (
              <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "var(--admin-text)" }}>
                {text(selected.notes)}
              </p>
            )}
          </div>

          {/* Reservations */}
          {customerReservations.length > 0 && (
            <div className="admin-panel" style={{ marginBottom: "0.75rem" }}>
              <p className="admin-kicker" style={{ marginBottom: "0.4rem" }}>Reservas ({customerReservations.length})</p>
              {customerReservations.map((r) => (
                <div key={text(r.id)} style={{ fontSize: "0.8rem", padding: "0.3rem 0", borderBottom: "1px solid var(--admin-border)", display: "flex", gap: "0.5rem" }}>
                  <span style={{ flex: 1 }}>{text(r.title)}</span>
                  <span>{Number(r.attendees_count)} pax</span>
                  <span style={{ color: text(r.payment_status) === "paid" ? "#6c6" : "#e95" }}>
                    {text(r.payment_status)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Events/Notes */}
          <div className="admin-panel" style={{ marginBottom: "0.75rem" }}>
            <p className="admin-kicker" style={{ marginBottom: "0.4rem" }}>Notas y seguimiento</p>
            {customerEvents.length === 0 && (
              <p className="admin-muted" style={{ fontSize: "0.8rem" }}>Sin notas aún.</p>
            )}
            {customerEvents.map((ev) => (
              <div key={text(ev.id)} style={{ fontSize: "0.8rem", padding: "0.4rem 0", borderBottom: "1px solid var(--admin-border)" }}>
                <strong>{text(ev.title)}</strong>
                {ev.body && <p className="admin-muted" style={{ margin: "0.2rem 0 0", fontSize: "0.75rem" }}>{text(ev.body)}</p>}
                <span className="admin-muted" style={{ fontSize: "0.68rem" }}>{text(ev.created_at).slice(0, 16)}</span>
              </div>
            ))}
          </div>

          {/* Add note form */}
          <form className="admin-panel" onSubmit={addNote} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <input name="title" placeholder="Título de la nota *" required style={inputStyle} />
            <textarea name="body" placeholder="Detalle (opcional)" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            <button type="submit" className="admin-btn" style={{ alignSelf: "flex-end", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}>
              Agregar nota
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--admin-bg)",
  border: "1px solid var(--admin-border)",
  borderRadius: 6,
  padding: "0.5rem 0.7rem",
  color: "var(--admin-text)",
  font: "inherit",
  fontSize: "0.85rem",
  width: "100%",
  boxSizing: "border-box",
};
