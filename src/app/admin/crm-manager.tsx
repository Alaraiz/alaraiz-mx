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
    submissions: Row[];
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
  const [source, setSource] = useState("todos");
  const [payment, setPayment] = useState("todos");
  const [experience, setExperience] = useState("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const sourceOptions = useMemo(() => {
    const values = new Set(data.customers.map((customer) => text(customer.source)).filter(Boolean));
    return ["todos", ...Array.from(values).sort()];
  }, [data.customers]);

  const filtered = useMemo(
    () =>
      data.customers.filter((customer) => {
        const customerReservations = data.reservations.filter(
          (reservation) => text(reservation.customer_id) === text(customer.id)
        );
        const haystack =
          `${text(customer.name)} ${text(customer.email)} ${text(customer.phone)} ${text(customer.notes)}`.toLowerCase();
        return (
          (stage === "todos" || text(customer.stage) === stage) &&
          (source === "todos" || text(customer.source) === source) &&
          (payment === "todos" ||
            customerReservations.some((reservation) => text(reservation.payment_status) === payment)) &&
          (experience === "todos" ||
            customerReservations.some((reservation) => text(reservation.experience_id) === experience)) &&
          (!search.trim() || haystack.includes(search.toLowerCase().trim()))
        );
      }),
    [data.customers, data.reservations, experience, payment, source, stage, search]
  );

  const selected =
    data.customers.find((c) => text(c.id) === selectedId) || null;

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

  const customerSubmissions = useMemo(
    () =>
      selected
        ? data.submissions.filter((item) => text(item.customer_id) === text(selected.id))
        : [],
    [selected, data.submissions]
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

  async function updateCustomer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const values = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(`/api/admin/customers/${text(selected.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          source: values.source,
          stage: values.stage,
          notes: values.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al actualizar cliente.");
      notify("Contacto actualizado.");
      refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al actualizar cliente.");
    }
  }

  async function deleteCustomer() {
    if (!selected) return;
    if (!window.confirm(`¿Eliminar el contacto ${text(selected.name)}? También se borrarán todas sus reservas y se liberarán sus cupos. Esto no hace reembolsos ni movimientos en Clip.`)) return;

    try {
      const res = await fetch(`/api/admin/customers/${text(selected.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al borrar contacto.");
      notify("Contacto eliminado.");
      setSelectedId(null);
      refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al borrar contacto.");
    }
  }

  async function deleteReservation(reservation: Row) {
    const paid = text(reservation.payment_status) === "paid";
    const paidWarning = paid
      ? "\n\nEsta reserva aparece como pagada. Esta acción NO hace reembolso ni mueve dinero en Clip; solo la elimina del CRM/calendario y libera sus cupos."
      : "";
    if (!window.confirm(`¿Eliminar solo esta reserva de ${text(reservation.title)} para ${text(selected?.name)}?${paidWarning}`)) return;

    try {
      const res = await fetch(`/api/admin/reservations/${text(reservation.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al borrar reserva.");
      notify("Reserva eliminada y cupos liberados.");
      refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al borrar reserva.");
    }
  }

  async function sendConfirmationEmail(reservation: Row) {
    const reservationId = text(reservation.id);
    const customerEmail = text(reservation.email || selected?.email);
    if (!reservationId) return;
    if (!customerEmail) {
      notify("Esta reserva no tiene correo de cliente.");
      return;
    }
    if (!window.confirm(`¿Enviar correo de confirmación a ${customerEmail}?`)) return;

    setSendingEmailId(reservationId);
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}/confirmation-email`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el correo.");
      notify(`Correo de confirmación enviado a ${customerEmail}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "No se pudo enviar el correo.");
    } finally {
      setSendingEmailId(null);
    }
  }

  return (
    <div className={`admin-crm-layout${selected ? " has-selection" : ""}`}>
      <div>
        <div className="admin-tabs admin-crm-filters" role="group" aria-label="Etapas del CRM">
          {stages.map((item) => (
            <button
              key={item[0]}
              className="admin-pill"
              onClick={() => setStage(item[0])}
              aria-pressed={stage === item[0]}
            >
              {item[1]}
            </button>
          ))}
        </div>

        <div className="admin-toolbar">
          <input
            placeholder="Buscar por nombre, correo o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
          <button
            className={showCreate ? "admin-btn" : "admin-primary admin-small"}
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancelar" : "＋ Nuevo"}
          </button>
        </div>

        <div className="admin-panel admin-crm-filter-panel">
          <label>
            Fuente
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "todos" ? "Todas" : option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Experiencia
            <select value={experience} onChange={(e) => setExperience(e.target.value)}>
              <option value="todos">Todas</option>
              {data.experiences.map((item) => (
                <option key={text(item.id)} value={text(item.id)}>
                  {text(item.title)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pago
            <select value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="unpaid">Pendiente</option>
              <option value="paid">Pagado</option>
              <option value="failed">Fallido</option>
              <option value="refunded">Reembolsado</option>
            </select>
          </label>
        </div>

        {showCreate && (
          <form
            className="admin-panel admin-inline-form"
            onSubmit={createCustomer}
          >
            <label>
              Nombre
              <input name="name" placeholder="Nombre *" required />
            </label>
            <label>
              Email
              <input name="email" placeholder="correo@ejemplo.com" type="email" required />
            </label>
            <label>
              Teléfono
              <input name="phone" placeholder="Opcional" />
            </label>
            <label>
              Etapa
              <select name="stage" defaultValue="nuevo">
                {stages.filter((s) => s[0] !== "todos").map((s) => (
                  <option key={s[0]} value={s[0]}>{s[1]}</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="admin-primary admin-small"
              disabled={saving}
            >
              {saving ? "Guardando…" : "Crear cliente"}
            </button>
          </form>
        )}

        <div className="admin-panel admin-list-panel">
          <p className="admin-muted admin-list-count">
            {filtered.length} contacto{filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.map((customer) => (
            <div
              key={text(customer.id)}
              className={`admin-list-row clickable${text(selected?.id) === text(customer.id) ? " is-selected" : ""}`}
              onClick={() => setSelectedId(text(customer.id))}
            >
              <span
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--admin-accent)", color: "var(--admin-accent-ink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
                }}
              >
                {text(customer.name).slice(0, 1).toUpperCase()}
              </span>
              <div className="admin-list-main">
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

      {selected && (
        <div>
          <div className="admin-panel">
            <div className="admin-crm-detail-head">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{text(selected.name)}</h3>
                <p className="admin-muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                  {text(selected.email)} · {text(selected.phone) || "Sin tel."}
                </p>
              </div>
              <div className="admin-crm-detail-actions">
                <span className="admin-crm-stage-pill">
                  {stageLabel(selected.stage)}
                </span>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Cerrar contacto"
                  title="Cerrar contacto"
                >
                  ×
                </button>
              </div>
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

          <form className="admin-panel admin-inline-form" onSubmit={updateCustomer}>
            <p className="admin-kicker admin-form-wide">Editar contacto</p>
            <label>
              Nombre
              <input name="name" defaultValue={text(selected.name)} required />
            </label>
            <label>
              Email
              <input name="email" type="email" defaultValue={text(selected.email)} required />
            </label>
            <label>
              Teléfono
              <input name="phone" defaultValue={text(selected.phone)} />
            </label>
            <label>
              Fuente
              <input name="source" defaultValue={text(selected.source) || "landing"} />
            </label>
            <label>
              Etapa
              <select name="stage" defaultValue={text(selected.stage) || "nuevo"}>
                {stages.filter((s) => s[0] !== "todos").map((s) => (
                  <option key={s[0]} value={s[0]}>{s[1]}</option>
                ))}
                <option value="requiere_revision">Requiere revisión</option>
              </select>
            </label>
            <label className="admin-form-wide">
              Notas internas
              <textarea name="notes" rows={3} defaultValue={text(selected.notes)} />
            </label>
            <button type="submit" className="admin-primary admin-small">
              Guardar contacto
            </button>
            <button type="button" className="admin-btn-danger" onClick={deleteCustomer}>
              Eliminar contacto
            </button>
          </form>

          {customerReservations.length > 0 && (
            <div className="admin-panel">
              <p className="admin-kicker" style={{ marginBottom: "0.4rem" }}>Reservas ({customerReservations.length})</p>
              {customerReservations.map((r) => (
                <div key={text(r.id)} className="admin-crm-reservation">
                  <div className="admin-crm-reservation-line">
                    <span>{text(r.title)}</span>
                    <span>{Number(r.attendees_count)} pax</span>
                    <span style={{ color: text(r.payment_status) === "paid" ? "#6c6" : "#e95" }}>
                      {text(r.payment_status)}
                    </span>
                  </div>
                  {(r.dietary_restrictions || r.accessibility_needs || r.interests || r.referral_source) && (
                    <div className="admin-crm-intake">
                      {r.dietary_restrictions && <p><strong>Alergias/restricciones:</strong> {text(r.dietary_restrictions)}</p>}
                      {r.accessibility_needs && <p><strong>Movilidad/accesibilidad:</strong> {text(r.accessibility_needs)}</p>}
                      {r.interests && <p><strong>Intereses/contexto:</strong> {text(r.interests)}</p>}
                      {r.referral_source && <p><strong>Origen:</strong> {text(r.referral_source)}</p>}
                    </div>
                  )}
                  <div className="admin-reservation-actions">
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={sendingEmailId === text(r.id)}
                      onClick={() => sendConfirmationEmail(r)}
                    >
                      {sendingEmailId === text(r.id) ? "Enviando correo..." : "Enviar correo de confirmación"}
                    </button>
                    <button type="button" className="admin-btn-danger" onClick={() => deleteReservation(r)}>
                      Eliminar solo esta reserva y liberar cupos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="admin-panel">
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

          {customerSubmissions.length > 0 && (
            <div className="admin-panel">
              <p className="admin-kicker" style={{ marginBottom: "0.4rem" }}>Formularios ({customerSubmissions.length})</p>
              {customerSubmissions.map((submission) => (
                <details key={text(submission.id)} className="admin-crm-submission">
                  <summary>
                    <strong>{submissionTypeLabel(submission.type)}</strong>
                    <span className="admin-muted">{text(submission.created_at).slice(0, 16)}</span>
                  </summary>
                  <div className="admin-crm-submission-grid">
                    {payloadEntries(submission.payload_json).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}</strong>
                        <span>{value}</span>
                      </p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}

          <form className="admin-panel admin-inline-form" onSubmit={addNote}>
            <label className="admin-form-wide">
              Título
              <input name="title" placeholder="Título de la nota *" required />
            </label>
            <label className="admin-form-wide">
              Detalle
              <textarea name="body" placeholder="Opcional" rows={2} style={{ resize: "vertical" }} />
            </label>
            <button
              type="submit"
              className="admin-primary admin-small"
            >
              Agregar nota
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function payloadEntries(value: unknown): [string, string][] {
  try {
    const parsed = JSON.parse(text(value));
    if (!parsed || typeof parsed !== "object") return [];
    return Object.entries(parsed)
      .filter(([, item]) => text(item).trim())
      .map(([key, item]) => [key, text(item)]);
  } catch {
    return [];
  }
}

function submissionTypeLabel(value: unknown) {
  const type = text(value);
  if (type === "exit_survey") return "Encuesta de salida";
  if (type === "host_application") return "Propuesta de anfitrión";
  if (type === "landing_lead") return "Solicitud desde landing";
  return type || "Formulario";
}
