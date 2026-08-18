"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ExperienceManager from "./experience-manager";
import FacilitatorManager from "./facilitator-manager";
import CrmManager from "./crm-manager";
import UserManager from "./user-manager";

type Row = Record<string, string | number | null>;
type Data = {
  experiences: Row[];
  dates: Row[];
  customers: Row[];
  reservations: Row[];
  events: Row[];
  folders: Row[];
  facilitators: Row[];
};
type Notice = { message: string; tone: "success" | "error" };
type Notify = (message: string, tone?: Notice["tone"]) => void;

const allTabs = [
  ["overview", "Resumen"],
  ["experiences", "Experiencias"],
  ["facilitators", "Facilitadores"],
  ["calendar", "Calendario"],
  ["crm", "CRM"],
  ["payments", "Pagos"],
  ["settings", "Configuración"],
];

const adminOnlyTabs = new Set(["crm", "payments"]);

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [role, setRole] = useState<string>("admin");
  const [userName, setUserName] = useState<string>("");
  const [data, setData] = useState<Data>({
    experiences: [],
    dates: [],
    customers: [],
    reservations: [],
    events: [],
    folders: [],
    facilitators: [],
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = useMemo(
    () => allTabs.filter((t) => role === "admin" || !adminOnlyTabs.has(t[0])),
    [role]
  );

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.role) setRole(d.role);
        if (d.name) setUserName(d.name);
      })
      .catch(() => {});
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/data");
      const value = await response.json();
      if (!response.ok)
        throw new Error(value.error || "No se pudieron cargar los datos.");
      setData(value);
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const notify: Notify = (message, tone) => {
    const lower = message.toLowerCase();
    const resolvedTone =
      tone ||
      (/error|no se pudo|no autorizado|obligatorio|falta configurar|tardó demasiado|no encontramos/.test(
        lower
      )
        ? "error"
        : "success");
    setNotice({ message, tone: resolvedTone });
    window.setTimeout(
      () =>
        setNotice((current) =>
          current?.message === message ? null : current
        ),
      5000
    );
  };

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/admin/login";
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-logo" href="/">
          RAÍZ<span>ADMIN</span>
        </a>
        <p className="admin-side-label">Gestión</p>
        <nav>
          {tabs.map((item) => (
            <button
              className={tab === item[0] ? "active" : ""}
              onClick={() => setTab(item[0])}
              key={item[0]}
            >
              <span>{({ overview: "◌", experiences: "✦", facilitators: "☉", calendar: "▦", crm: "♧", payments: "↗", settings: "⚙" } as Record<string, string>)[item[0]] || "·"}</span>
              {item[1]}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Raíz</p>
            <h1>{tabs.find((t) => t[0] === tab)?.[1]}</h1>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            Ver landing ↗
          </a>
        </header>
        {notice && (
          <div
            className={`admin-notice admin-notice-${notice.tone}`}
            role="status"
          >
            {notice.message}
          </div>
        )}
        {loading ? (
          <div className="admin-panel">
            <p className="admin-muted">Cargando información…</p>
          </div>
        ) : (
          <>
            {tab === "overview" && <Overview data={data} setTab={setTab} userName={userName} />}
            {tab === "experiences" && (
              <ExperienceManager data={data} refresh={refresh} notify={notify} />
            )}
            {tab === "facilitators" && <FacilitatorManager data={data} refresh={refresh} notify={notify} />}
            {tab === "calendar" && <Calendar data={data} refresh={refresh} notify={notify} />}
            {tab === "crm" && (
              <CrmManager data={data} refresh={refresh} notify={notify} />
            )}
            {tab === "payments" && <Payments data={data} />}
            {tab === "settings" && <Settings notify={notify} role={role} />}
          </>
        )}
      </section>
    </main>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="admin-empty">{text}</p>;
}

function Overview({
  data,
  setTab,
  userName,
}: {
  data: Data;
  setTab: (s: string) => void;
  userName: string;
}) {
  const [chartRange, setChartRange] = useState<"7d" | "30d" | "6m" | "1y">("7d");

  // Time-sensitive greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  // Revenue calculations
  const paid = data.reservations.filter((r) => r.payment_status === "paid");
  const totalRevenue = paid.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const pendingRevenue = data.reservations
    .filter((r) => r.payment_status !== "paid")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Chart data based on selected range
  const chartData = useMemo(() => {
    const now = new Date();
    const bars: { label: string; value: number }[] = [];

    if (chartRange === "7d") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("es-MX", { weekday: "short" });
        const total = paid
          .filter((r) => String(r.created_at || "").startsWith(key))
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        bars.push({ label, value: total });
      }
    } else if (chartRange === "30d") {
      // Group by week (4 weeks + current partial)
      for (let week = 4; week >= 0; week--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - week * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        const startKey = weekStart.toISOString().slice(0, 10);
        const endKey = weekEnd.toISOString().slice(0, 10);
        const label = `${weekStart.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString("es-MX", { month: "short" })}`;
        const total = paid
          .filter((r) => {
            const d = String(r.created_at || "").slice(0, 10);
            return d >= startKey && d <= endKey;
          })
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        bars.push({ label, value: total });
      }
    } else if (chartRange === "6m") {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("es-MX", { month: "short" });
        const total = paid
          .filter((r) => String(r.created_at || "").startsWith(key))
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        bars.push({ label, value: total });
      }
    } else {
      // 1y — monthly for 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("es-MX", { month: "short" });
        const total = paid
          .filter((r) => String(r.created_at || "").startsWith(key))
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        bars.push({ label, value: total });
      }
    }

    return bars;
  }, [paid, chartRange]);

  const chartMax = Math.max(...chartData.map((d) => d.value), 1);
  const rangeRevenue = chartData.reduce((s, d) => s + d.value, 0);

  // Quick stats for operational message
  const pendingReservations = data.reservations.filter((r) => r.payment_status !== "paid").length;
  const upcomingDates = data.dates.filter((d) => String(d.date) >= new Date().toISOString().slice(0, 10)).length;

  const rangeOptions: [typeof chartRange, string][] = [
    ["7d", "7 días"],
    ["30d", "Mes"],
    ["6m", "6 meses"],
    ["1y", "Año"],
  ];

  return (
    <>
      {/* Operational summary */}
      <div className="admin-panel">
        <p className="admin-kicker">{greeting}{userName ? `, ${userName}` : ""}</p>
        <h2 style={{ fontSize: "1.3rem", marginTop: "0.3rem" }}>
          Todo empieza <em style={{ color: "var(--admin-accent)" }}>aquí.</em>
        </h2>
        <p className="admin-muted" style={{ marginTop: "0.5rem", fontSize: "0.85rem", lineHeight: 1.5 }}>
          {upcomingDates > 0 ? (
            <>Tienes <strong style={{ color: "var(--admin-accent)" }}>{upcomingDates} salida{upcomingDates !== 1 ? "s" : ""}</strong> próxima{upcomingDates !== 1 ? "s" : ""}.</>
          ) : (
            <>No hay salidas programadas.</>
          )}
          {pendingReservations > 0 && (
            <> Hay <strong style={{ color: "#e95" }}>{pendingReservations} reserva{pendingReservations !== 1 ? "s" : ""}</strong> pendiente{pendingReservations !== 1 ? "s" : ""} de pago.</>
          )}
          {data.customers.length > 0 && (
            <> {data.customers.length} cliente{data.customers.length !== 1 ? "s" : ""} en tu CRM.</>
          )}
        </p>
      </div>

      {/* Quick stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {(
          [
            ["Experiencias", data.experiences.length, "experiences"],
            ["Facilitadores", data.facilitators.length, "facilitators"],
            ["Próximas salidas", data.dates.length, "calendar"],
            ["Clientes", data.customers.length, "crm"],
            ["Reservas", data.reservations.length, "payments"],
          ] as [string, number, string][]
        ).map((s) => (
          <button
            className="admin-panel"
            style={{ cursor: "pointer", textAlign: "left" }}
            onClick={() => setTab(s[2])}
            key={s[0]}
          >
            <span className="admin-muted" style={{ fontSize: "0.72rem" }}>{s[0]}</span>
            <strong style={{ display: "block", fontSize: "1.6rem", marginTop: "0.3rem" }}>{s[1]}</strong>
          </button>
        ))}
      </div>

      {/* Revenue card with chart */}
      <div className="admin-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
          <div>
            <p className="admin-kicker">Ingresos</p>
            <h3 style={{ fontSize: "1.6rem", margin: "0.2rem 0 0" }}>
              ${totalRevenue.toLocaleString("es-MX")}
              <span className="admin-muted" style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}>total cobrado</span>
            </h3>
            {pendingRevenue > 0 && (
              <p style={{ fontSize: "0.8rem", color: "#e95", marginTop: "0.2rem" }}>
                ${pendingRevenue.toLocaleString("es-MX")} pendiente
              </p>
            )}
          </div>
          {/* Range selector pills */}
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {rangeOptions.map(([key, label]) => (
              <button
                key={key}
                className="admin-pill"
                onClick={(e) => { e.stopPropagation(); setChartRange(key); }}
                style={{
                  cursor: "pointer",
                  background: chartRange === key ? "var(--admin-accent)" : "transparent",
                  color: chartRange === key ? "var(--admin-accent-ink)" : "var(--admin-muted)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 20,
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.68rem",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Period revenue */}
        {rangeRevenue > 0 && rangeRevenue !== totalRevenue && (
          <p className="admin-muted" style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
            ${rangeRevenue.toLocaleString("es-MX")} en este periodo
          </p>
        )}

        {/* Bar chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: chartData.length > 7 ? "0.2rem" : "0.4rem", height: 72 }}>
          {chartData.map((bar, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: chartData.length > 7 ? 24 : 32,
                  height: `${Math.max((bar.value / chartMax) * 52, 3)}px`,
                  background: bar.value > 0 ? "var(--admin-accent)" : "var(--admin-border)",
                  borderRadius: 4,
                  transition: "height 0.3s",
                }}
                title={`$${bar.value.toLocaleString("es-MX")}`}
              />
              <span className="admin-muted" style={{ fontSize: chartData.length > 7 ? "0.52rem" : "0.6rem", textTransform: "capitalize", whiteSpace: "nowrap" }}>
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Calendar({ data, refresh, notify }: { data: Data; refresh: () => void; notify: (s: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ experienceId: "", date: "", time: "10:00", capacity: "12" });
  const [saving, setSaving] = useState(false);

  // Group availability slots by week
  const sortedDates = useMemo(() => {
    return [...data.dates].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [data.dates]);

  // Get reservations per availability
  const reservationsByAvailability = useMemo(() => {
    const map: Record<string, Row[]> = {};
    data.reservations.forEach((r) => {
      const avId = String(r.availability_id || "");
      if (avId) {
        if (!map[avId]) map[avId] = [];
        map[avId].push(r);
      }
    });
    return map;
  }, [data.reservations]);

  async function createSlot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId: formData.experienceId,
          date: formData.date,
          time: formData.time,
          capacity: parseInt(formData.capacity) || 12,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al crear");
      }
      notify("Fecha creada correctamente.");
      setShowForm(false);
      setFormData({ experienceId: "", date: "", time: "10:00", capacity: "12" });
      refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Error al crear la fecha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <p className="admin-kicker">Calendario de salidas</p>
          <p className="admin-muted">
            {sortedDates.length} fecha{sortedDates.length !== 1 ? "s" : ""} programada{sortedDates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className={showForm ? "admin-btn" : "admin-primary admin-small"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "＋ Nueva fecha"}
        </button>
      </div>

      {/* Create availability form */}
      {showForm && (
        <form className="admin-panel admin-inline-form" onSubmit={createSlot}>
          <label style={{ gridColumn: "1 / -1" }}>
            Experiencia
            <select
              value={formData.experienceId}
              onChange={(e) => setFormData({ ...formData, experienceId: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              {data.experiences.map((exp) => (
                <option key={String(exp.id)} value={String(exp.id)}>
                  {String(exp.title)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </label>
          <label>
            Hora
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </label>
          <label>
            Capacidad
            <input
              type="number"
              min={1}
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </label>
          <button
            type="submit"
            className="admin-primary admin-small"
            disabled={saving}
          >
            {saving ? "Guardando…" : "Crear fecha"}
          </button>
        </form>
      )}

      {/* Calendar grid */}
      {sortedDates.length === 0 ? (
        <div className="admin-panel">
          <p className="admin-muted">No hay fechas programadas. Crea una para empezar.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {sortedDates.map((slot) => {
            const booked = Number(slot.booked) || 0;
            const capacity = Number(slot.capacity) || 12;
            const pct = Math.min((booked / capacity) * 100, 100);
            const avReservations = reservationsByAvailability[String(slot.id)] || [];
            return (
              <div key={String(slot.id)} className="admin-panel" style={{ padding: "0.8rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 80 }}>
                    <strong style={{ fontSize: "0.9rem" }}>{formatCalDate(String(slot.date))}</strong>
                    <span className="admin-muted" style={{ display: "block", fontSize: "0.75rem" }}>{String(slot.time)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <span style={{ fontSize: "0.85rem" }}>{String(slot.title)}</span>
                  </div>
                  <div style={{ minWidth: 100, textAlign: "right" }}>
                    <span style={{ fontSize: "0.8rem" }}>
                      {booked}/{capacity} cupos
                    </span>
                    <div style={{ height: 4, background: "var(--admin-border)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: pct > 80 ? "#e55" : "var(--admin-accent)", borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                  <span className="admin-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                    {String(slot.status)}
                  </span>
                </div>
                {avReservations.length > 0 && (
                  <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--admin-border)" }}>
                    {avReservations.map((r) => (
                      <div key={String(r.id)} style={{ display: "flex", gap: "0.5rem", fontSize: "0.78rem", padding: "0.2rem 0", color: "var(--admin-muted)" }}>
                        <span>{String(r.name)}</span>
                        <span>·</span>
                        <span>{String(r.attendees_count)} pax</span>
                        <span>·</span>
                        <span style={{ color: String(r.payment_status) === "paid" ? "#6c6" : "#e95" }}>
                          {String(r.payment_status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function formatCalDate(d: string): string {
  try {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

function Payments({ data }: { data: Data }) {
  const paid = data.reservations.filter((r) => r.payment_status === "paid");
  const pending = data.reservations.filter((r) => r.payment_status === "unpaid" || r.payment_status === "pending");
  const totalRevenue = paid.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <>
      <div className="admin-panel">
        <p className="admin-kicker">Cobros directos</p>
        <h3 style={{ marginTop: "0.3rem" }}>Pasarela de pago</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <span className="admin-muted" style={{ fontSize: "0.72rem" }}>Total reservas</span>
            <strong style={{ display: "block", fontSize: "1.3rem" }}>{data.reservations.length}</strong>
          </div>
          <div>
            <span className="admin-muted" style={{ fontSize: "0.72rem" }}>Pagadas</span>
            <strong style={{ display: "block", fontSize: "1.3rem", color: "#6c6" }}>{paid.length}</strong>
          </div>
          <div>
            <span className="admin-muted" style={{ fontSize: "0.72rem" }}>Pendientes</span>
            <strong style={{ display: "block", fontSize: "1.3rem", color: "#e95" }}>{pending.length}</strong>
          </div>
          <div>
            <span className="admin-muted" style={{ fontSize: "0.72rem" }}>Ingresos</span>
            <strong style={{ display: "block", fontSize: "1.3rem" }}>${totalRevenue.toLocaleString("es-MX")}</strong>
          </div>
        </div>
      </div>

      {data.reservations.length === 0 ? (
        <div className="admin-panel">
          <p className="admin-muted">No hay reservas aún.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {data.reservations.map((r) => (
            <div key={String(r.id)} className="admin-panel" style={{ padding: "0.7rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <strong style={{ fontSize: "0.85rem" }}>{String(r.name || "Sin nombre")}</strong>
                <span className="admin-muted" style={{ display: "block", fontSize: "0.75rem" }}>{String(r.title || "")}</span>
              </div>
              <span style={{ fontSize: "0.8rem" }}>{Number(r.attendees_count)} pax</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>${Number(r.amount).toLocaleString("es-MX")}</span>
              <span style={{
                fontSize: "0.7rem",
                padding: "0.2rem 0.5rem",
                borderRadius: 4,
                background: r.payment_status === "paid" ? "#6c62" : "#e952",
                color: r.payment_status === "paid" ? "#6c6" : "#e95",
                textTransform: "uppercase",
              }}>
                {String(r.payment_status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Settings({ notify, role }: { notify: (s: string) => void; role: string }) {
  const [subTab, setSubTab] = useState<"security" | "users">("security");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    notify(r.ok ? "Contraseña actualizada." : (await r.json()).error);
    if (r.ok) e.currentTarget.reset();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Sub-tab navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
        <button
          className="admin-pill"
          onClick={() => setSubTab("security")}
          style={{
            cursor: "pointer",
            background: subTab === "security" ? "var(--admin-accent)" : "transparent",
            color: subTab === "security" ? "var(--admin-accent-ink)" : "var(--admin-muted)",
            border: "1px solid var(--admin-border)",
            borderRadius: 20,
            padding: "0.3rem 0.7rem",
            fontSize: "0.75rem",
          }}
        >
          Seguridad
        </button>
        {role === "admin" && (
          <button
            className="admin-pill"
            onClick={() => setSubTab("users")}
            style={{
              cursor: "pointer",
              background: subTab === "users" ? "var(--admin-accent)" : "transparent",
              color: subTab === "users" ? "var(--admin-accent-ink)" : "var(--admin-muted)",
              border: "1px solid var(--admin-border)",
              borderRadius: 20,
              padding: "0.3rem 0.7rem",
              fontSize: "0.75rem",
            }}
          >
            Usuarios
          </button>
        )}
      </div>

      {/* Security sub-tab */}
      {subTab === "security" && (
        <form className="admin-form admin-panel" onSubmit={submit}>
          <p className="admin-kicker">Seguridad</p>
          <h3>Cambiar contraseña</h3>
          <label>
            Contraseña actual
            <input name="currentPassword" type="password" required />
          </label>
          <label>
            Nueva contraseña
            <input name="newPassword" type="password" minLength={8} required />
          </label>
          <button className="admin-primary">Actualizar contraseña</button>
        </form>
      )}

      {/* Users sub-tab (admin only) */}
      {subTab === "users" && role === "admin" && <UserManager notify={notify} />}
    </div>
  );
}
