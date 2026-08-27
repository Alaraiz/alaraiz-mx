"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ExperienceManager from "./experience-manager";
import FacilitatorManager from "./facilitator-manager";
import CrmManager from "./crm-manager";
import UserManager from "./user-manager";
import CollectionManager from "./collection-manager";
import ContentManager from "./content-manager";
import { getMexicoDateKey, getMexicoHour } from "@/lib/mexico-time";

type Row = Record<string, string | number | null>;
type Data = {
  experiences: Row[];
  dates: Row[];
  customers: Row[];
  reservations: Row[];
  events: Row[];
  folders: Row[];
  submissions: Row[];
  facilitators: Row[];
  collections: Row[];
};
type Notice = { message: string; tone: "success" | "error" };
type Notify = (message: string, tone?: Notice["tone"]) => void;

const allTabs = [
  ["overview", "Resumen"],
  ["experiences", "Experiencias"],
  ["facilitators", "Facilitadores"],
  ["calendar", "Calendario"],
  ["collections", "Colecciones"],
  ["content", "Contenido"],
  ["crm", "CRM"],
  ["payments", "Pagos"],
  ["settings", "Configuración"],
];

const adminOnlyTabs = new Set(["collections", "crm", "payments"]);

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  throw new Error(fallbackMessage);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

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
    submissions: [],
    facilitators: [],
    collections: [],
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs = useMemo(
    () => allTabs.filter((t) => role === "admin" || !adminOnlyTabs.has(t[0])),
    [role]
  );

  useEffect(() => {
    fetchWithTimeout("/api/admin/me", {}, 8000)
      .then((r) => readJson<{ role?: string; name?: string }>(r, "No pudimos validar la sesión."))
      .then((d) => {
        if (d.role) setRole(d.role);
        if (d.name) setUserName(d.name);
      })
      .catch(() => {});
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout("/api/admin/data");
      const value = await readJson<Data & { error?: string }>(
        response,
        "El servidor respondió con un error inesperado al cargar el admin."
      );
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
              <span>{({ overview: "◌", experiences: "✦", facilitators: "☉", calendar: "▦", collections: "◫", content: "✎", crm: "♧", payments: "↗", settings: "⚙" } as Record<string, string>)[item[0]] || "·"}</span>
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
            {tab === "collections" && <CollectionManager notify={notify} />}
            {tab === "content" && <ContentManager notify={notify} />}
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
    const hour = getMexicoHour();
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
        const key = getMexicoDateKey(d);
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
        const startKey = getMexicoDateKey(weekStart);
        const endKey = getMexicoDateKey(weekEnd);
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
  const upcomingDates = data.dates.filter((d) => String(d.date) >= getMexicoDateKey()).length;

  const rangeOptions: [typeof chartRange, string][] = [
    ["7d", "7 días"],
    ["30d", "Mes"],
    ["6m", "6 meses"],
    ["1y", "Año"],
  ];

  return (
    <>
      <div className="admin-panel">
        <p className="admin-kicker">{greeting}{userName ? `, ${userName}` : ""}</p>
        <h2 className="admin-summary-title">
          Todo empieza <em>aquí.</em>
        </h2>
        <p className="admin-muted admin-summary-copy">
          {upcomingDates > 0 ? (
            <>Tienes <strong>{upcomingDates} salida{upcomingDates !== 1 ? "s" : ""}</strong> próxima{upcomingDates !== 1 ? "s" : ""}.</>
          ) : (
            <>No hay salidas programadas.</>
          )}
          {pendingReservations > 0 && (
            <> Hay <strong className="is-warning">{pendingReservations} reserva{pendingReservations !== 1 ? "s" : ""}</strong> pendiente{pendingReservations !== 1 ? "s" : ""} de pago.</>
          )}
          {data.customers.length > 0 && (
            <> {data.customers.length} cliente{data.customers.length !== 1 ? "s" : ""} en tu CRM.</>
          )}
        </p>
      </div>

      <div className="admin-stat-grid">
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
            className="admin-panel admin-stat-card"
            onClick={() => setTab(s[2])}
            key={s[0]}
          >
            <span className="admin-muted" style={{ fontSize: "0.72rem" }}>{s[0]}</span>
            <strong style={{ display: "block", fontSize: "1.6rem", marginTop: "0.3rem" }}>{s[1]}</strong>
          </button>
        ))}
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
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
          <div className="admin-tabs" role="group" aria-label="Rango de ingresos">
            {rangeOptions.map(([key, label]) => (
              <button
                key={key}
                className="admin-pill"
                onClick={(e) => { e.stopPropagation(); setChartRange(key); }}
                aria-pressed={chartRange === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {rangeRevenue > 0 && rangeRevenue !== totalRevenue && (
          <p className="admin-muted" style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
            ${rangeRevenue.toLocaleString("es-MX")} en este periodo
          </p>
        )}

        <div className="admin-chart" data-dense={chartData.length > 7}>
          {chartData.map((bar, i) => (
            <div key={i} className="admin-chart-item">
              <div
                className="admin-chart-bar"
                style={{
                  height: `${Math.max((bar.value / chartMax) * 52, 3)}px`,
                }}
                data-empty={bar.value <= 0}
                title={`$${bar.value.toLocaleString("es-MX")}`}
              />
              <span className="admin-muted admin-chart-label">
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
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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

  // Group dates by day for the calendar grid
  const slotsByDate = useMemo(() => {
    const map: Record<string, Row[]> = {};
    data.dates.forEach((slot) => {
      const d = String(slot.date);
      if (!map[d]) map[d] = [];
      map[d].push(slot);
    });
    return map;
  }, [data.dates]);

  // Calendar grid helpers
  const monthYear = currentMonth.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7; // Monday-based
  const today = getMexicoDateKey();
  const selectedSlot = sortedDates.find((slot) => String(slot.id) === selectedSlotId) || null;
  const selectedReservations = selectedSlot ? reservationsByAvailability[String(selectedSlot.id)] || [] : [];
  const selectedExperience = selectedSlot
    ? data.experiences.find((experience) => String(experience.id) === String(selectedSlot.experience_id))
    : null;
  const selectedFacilitator = selectedExperience?.facilitator_id
    ? data.facilitators.find((facilitator) => String(facilitator.id) === String(selectedExperience.facilitator_id))
    : null;

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

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

  async function updateSlot(
    slot: Row,
    updates: { capacity?: number; status?: string }
  ) {
    const currentCapacity = Number(slot.capacity) || 1;
    const booked = Number(slot.booked) || 0;
    const nextCapacity = updates.capacity ?? currentCapacity;
    if (nextCapacity < booked) {
      notify(`No puedes bajar de ${booked} cupos ya reservados.`);
      return;
    }

    try {
      const res = await fetch(`/api/admin/availability/${String(slot.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capacity: nextCapacity,
          status: updates.status ?? String(slot.status || "open"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la fecha.");
      notify("Fecha actualizada.");
      refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "No se pudo actualizar la fecha.");
    }
  }

  async function deleteReservation(reservation: Row) {
    const paid = String(reservation.payment_status) === "paid";
    if (paid) {
      notify("No se puede borrar desde calendario una reserva pagada. Cámbiala desde pagos/CRM para conservar historial.");
      return;
    }
    const label = `${String(reservation.name || "esta persona")} · ${String(reservation.attendees_count || 1)} pax`;
    if (!window.confirm(`¿Eliminar ${label} y liberar sus cupos?`)) return;

    try {
      const res = await fetch(`/api/admin/reservations/${String(reservation.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar la reserva.");
      notify("Reserva eliminada y cupos liberados.");
      refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "No se pudo eliminar la reserva.");
    }
  }

  return (
    <>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">Calendario de salidas</p>
          <p className="admin-muted">
            {sortedDates.length} fecha{sortedDates.length !== 1 ? "s" : ""} programada{sortedDates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="admin-toolbar">
          <div className="admin-tabs" role="group" aria-label="Vista de calendario">
            <button
              type="button"
              className="admin-pill"
              onClick={() => setView("calendar")}
              aria-pressed={view === "calendar"}
            >
              Mes
            </button>
            <button
              type="button"
              className="admin-pill"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
            >
              Lista
            </button>
          </div>
          <button
            className={showForm ? "admin-btn" : "admin-primary admin-small"}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancelar" : "＋ Nueva fecha"}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="admin-panel admin-inline-form" onSubmit={createSlot}>
          <label className="admin-form-wide">
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

      {view === "calendar" && (
        <div className="admin-panel admin-calendar-panel">
          <div className="admin-calendar-nav">
            <button type="button" className="admin-btn admin-small" onClick={prevMonth}>←</button>
            <strong style={{ fontSize: "0.95rem", textTransform: "capitalize" }}>{monthYear}</strong>
            <button type="button" className="admin-btn admin-small" onClick={nextMonth}>→</button>
          </div>

          <div className="admin-calendar-weekdays">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d}>
                {d}
              </div>
            ))}
          </div>

          <div className="admin-calendar-grid">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="admin-calendar-empty" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const daySlots = slotsByDate[dateKey] || [];
              const isToday = dateKey === today;
              const hasSlots = daySlots.length > 0;

              return (
                <div
                  key={day}
                  className={`admin-calendar-day${isToday ? " is-today" : ""}${hasSlots ? " has-slots" : ""}`}
                >
                  <span>
                    {day}
                  </span>
                  {daySlots.map((slot) => {
                    const booked = Number(slot.booked) || 0;
                    const cap = Number(slot.capacity) || 12;
                    const full = booked >= cap;
                    return (
                      <button
                        type="button"
                        key={String(slot.id)}
                        title={`${String(slot.title)} · ${String(slot.time)} · ${booked}/${cap}`}
                        className={`admin-calendar-slot${full ? " is-full" : ""}`}
                        onClick={() => setSelectedSlotId(String(slot.id))}
                      >
                        {String(slot.time).slice(0, 5)} · {String(slot.title).slice(0, 10)}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
        <>
          {sortedDates.length === 0 ? (
            <div className="admin-panel">
              <p className="admin-muted">No hay fechas programadas. Crea una para empezar.</p>
            </div>
          ) : (
            <div className="admin-list-stack">
              {sortedDates.map((slot) => {
                const booked = Number(slot.booked) || 0;
                const capacity = Number(slot.capacity) || 12;
                const pct = Math.min((booked / capacity) * 100, 100);
                const avReservations = reservationsByAvailability[String(slot.id)] || [];
                return (
                  <div key={String(slot.id)} className="admin-panel admin-slot-row">
                    <div className="admin-slot-content">
                      <div style={{ minWidth: 80 }}>
                        <strong style={{ fontSize: "0.9rem" }}>{formatCalDate(String(slot.date))}</strong>
                        <span className="admin-muted" style={{ display: "block", fontSize: "0.75rem" }}>{String(slot.time)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <span style={{ fontSize: "0.85rem" }}>{String(slot.title)}</span>
                      </div>
                      <div className="admin-capacity">
                        <span style={{ fontSize: "0.8rem" }}>
                          {booked}/{capacity} cupos
                        </span>
                        <div className="admin-capacity-track">
                          <div className="admin-capacity-fill" style={{ width: `${pct}%` }} data-full={pct > 80} />
                        </div>
                      </div>
                      <span className="admin-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                        {String(slot.status)}
                      </span>
                      <div className="admin-slot-actions" aria-label="Acciones de cupo">
                        <button
                          type="button"
                          className="admin-btn admin-small"
                          onClick={() => setSelectedSlotId(String(slot.id))}
                        >
                          Ver bitácora
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-small"
                          onClick={() => updateSlot(slot, { capacity: capacity + 1 })}
                        >
                          +1 cupo
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-small"
                          onClick={() => updateSlot(slot, { capacity: capacity + 5 })}
                        >
                          +5 cupos
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-small"
                          onClick={() =>
                            updateSlot(slot, {
                              status: String(slot.status) === "open" ? "closed" : "open",
                            })
                          }
                        >
                          {String(slot.status) === "open" ? "Cerrar" : "Abrir"}
                        </button>
                      </div>
                    </div>
                    <div className="admin-slot-meta">
                      <span>
                        {capacity - booked} disponible{capacity - booked !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {avReservations.length} contacto{avReservations.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {avReservations.length > 0 && (
                      <div className="admin-slot-reservations">
                        {avReservations.map((r) => (
                          <div key={String(r.id)} className="admin-slot-contact">
                            <span className="admin-slot-contact-name">{String(r.name || "Sin nombre")}</span>
                            <span>·</span>
                            <span>{String(r.attendees_count)} pax</span>
                            <span>·</span>
                            <a href={`mailto:${String(r.email)}`}>{String(r.email || "Sin correo")}</a>
                            {r.phone && (
                              <>
                                <span>·</span>
                                <a href={`https://wa.me/${String(r.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                                  {String(r.phone)}
                                </a>
                              </>
                            )}
                            <span>·</span>
                            <span style={{ color: String(r.payment_status) === "paid" ? "#6c6" : "#e95" }}>
                              {String(r.payment_status)}
                            </span>
                            {String(r.payment_status) !== "paid" && (
                              <>
                                <span>·</span>
                                <button
                                  type="button"
                                  className="admin-link-button"
                                  onClick={() => deleteReservation(r)}
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
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
      )}

      {selectedSlot && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedSlotId(null)}>
          <section className="admin-panel admin-modal admin-slot-log" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="admin-modal-close" onClick={() => setSelectedSlotId(null)}>
              ×
            </button>
            <p className="admin-kicker">Bitácora de salida</p>
            <h3>{String(selectedSlot.title)}</h3>
            <div className="admin-log-grid">
              <p><strong>Fecha</strong><span>{formatCalDate(String(selectedSlot.date))} · {String(selectedSlot.time)}</span></p>
              <p><strong>Cupos</strong><span>{Number(selectedSlot.booked) || 0}/{Number(selectedSlot.capacity) || 12}</span></p>
              <p><strong>Estatus</strong><span>{String(selectedSlot.status || "open")}</span></p>
              <p><strong>Anfitrión</strong><span>{String(selectedFacilitator?.name || "Sin asignar")}</span></p>
              <p><strong>Colección</strong><span>{String(selectedExperience?.collection || "Sin colección")}</span></p>
              <p><strong>Zona</strong><span>{String(selectedExperience?.zone || "Sin zona")}</span></p>
            </div>
            <div className="admin-slot-actions admin-slot-log-actions">
              <button type="button" className="admin-btn admin-small" onClick={() => updateSlot(selectedSlot, { capacity: (Number(selectedSlot.capacity) || 12) + 1 })}>+1 cupo</button>
              <button type="button" className="admin-btn admin-small" onClick={() => updateSlot(selectedSlot, { capacity: (Number(selectedSlot.capacity) || 12) + 5 })}>+5 cupos</button>
              <button type="button" className="admin-btn admin-small" onClick={() => updateSlot(selectedSlot, { status: String(selectedSlot.status) === "open" ? "closed" : "open" })}>
                {String(selectedSlot.status) === "open" ? "Cerrar fecha" : "Abrir fecha"}
              </button>
            </div>
            <div className="admin-log-section">
              <p className="admin-kicker">Personas reservadas ({selectedReservations.length})</p>
              {selectedReservations.length === 0 ? (
                <p className="admin-empty">Todavía no hay personas registradas para esta salida.</p>
              ) : (
                selectedReservations.map((reservation) => (
                  <article key={String(reservation.id)} className="admin-log-reservation">
                    <div>
                      <strong>{String(reservation.name || "Sin nombre")}</strong>
                      <span className="admin-muted">{String(reservation.email || "Sin correo")} · {String(reservation.phone || "Sin teléfono")}</span>
                    </div>
                    <div className="admin-log-reservation-meta">
                      <span>{String(reservation.attendees_count)} pax</span>
                      <span>{String(reservation.payment_status)}</span>
                      <span>${Number(reservation.amount || 0).toLocaleString("es-MX")}</span>
                    </div>
                    {(reservation.dietary_restrictions || reservation.accessibility_needs || reservation.interests || reservation.referral_source) && (
                      <div className="admin-crm-intake">
                        {reservation.dietary_restrictions && <p><strong>Alergias/restricciones:</strong> {String(reservation.dietary_restrictions)}</p>}
                        {reservation.accessibility_needs && <p><strong>Movilidad/accesibilidad:</strong> {String(reservation.accessibility_needs)}</p>}
                        {reservation.interests && <p><strong>Intereses/contexto:</strong> {String(reservation.interests)}</p>}
                        {reservation.referral_source && <p><strong>Origen:</strong> {String(reservation.referral_source)}</p>}
                      </div>
                    )}
                    {String(reservation.payment_status) !== "paid" && (
                      <button type="button" className="admin-btn-danger" onClick={() => deleteReservation(reservation)}>
                        Eliminar y liberar cupos
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
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
        <div className="admin-metric-grid">
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
        <div className="admin-list-stack">
          {data.reservations.map((r) => (
            <div key={String(r.id)} className="admin-panel admin-payment-row">
              <div className="admin-list-main">
                <strong style={{ fontSize: "0.85rem" }}>{String(r.name || "Sin nombre")}</strong>
                <span className="admin-muted" style={{ display: "block", fontSize: "0.75rem" }}>{String(r.title || "")}</span>
              </div>
              <span style={{ fontSize: "0.8rem" }}>{Number(r.attendees_count)} pax</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>${Number(r.amount).toLocaleString("es-MX")}</span>
              <span className={`admin-badge ${r.payment_status === "paid" ? "success" : "warning"}`}>
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
    <div className="admin-section-stack">
      <div className="admin-tabs" role="group" aria-label="Configuración">
        <button
          className="admin-pill"
          onClick={() => setSubTab("security")}
          aria-pressed={subTab === "security"}
        >
          Seguridad
        </button>
        {role === "admin" && (
          <button
            className="admin-pill"
            onClick={() => setSubTab("users")}
            aria-pressed={subTab === "users"}
          >
            Usuarios
          </button>
        )}
      </div>

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

      {subTab === "users" && role === "admin" && <UserManager notify={notify} />}
    </div>
  );
}
