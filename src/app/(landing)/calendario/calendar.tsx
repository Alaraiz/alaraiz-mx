"use client";
import { useState } from "react";
import type { CalendarSlot } from "@/lib/calendar";

export default function Calendar({ slots, today }: { slots: CalendarSlot[]; today: string }) {
  const [month, setMonth] = useState((slots[0]?.date || today).slice(0, 7));
  const [day, setDay] = useState<string | null>(null);
  const [year, number] = month.split("-").map(Number);
  const start = new Date(year, number - 1, 1);
  const offset = (start.getDay() + 6) % 7;
  const days = new Date(year, number, 0).getDate();
  const monthSlots = slots.filter(slot => slot.date.startsWith(month));
  const visible = day ? monthSlots.filter(slot => slot.date === day) : monthSlots;
  const label = start.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  function move(delta: number) {
    const date = new Date(year, number - 1 + delta, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`); setDay(null);
  }
  return <>
    <div className="calendar-toolbar"><div><p className="calendar-eyebrow">Tu próxima pausa</p><h2>Calendario de salidas</h2></div>
      {slots.length > 0 && <a className="calendar-button" href="/api/public/calendar">↓ Importar todas las fechas</a>}
    </div>
    <p className="calendar-hint">Horarios de Ciudad de México. Descarga el archivo .ics y ábrelo en tu app de calendario, o impórtalo desde Google Calendar en computadora. Las fechas guardadas no se actualizan automáticamente ni reservan un lugar.</p>
    <div className="calendar-layout"><section className="calendar-month" aria-label="Calendario mensual">
      <div className="calendar-month-nav"><button onClick={() => move(-1)} aria-label="Mes anterior">←</button><h3 aria-live="polite">{label}</h3><button onClick={() => move(1)} aria-label="Mes siguiente">→</button></div>
      <div className="calendar-grid">{["L", "M", "M", "J", "V", "S", "D"].map((name, i) => <span className="calendar-weekday" key={i} aria-hidden="true">{name}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const key = `${month}-${String(i + 1).padStart(2, "0")}`;
          const count = monthSlots.filter(slot => slot.date === key).length;
          return <button key={key} disabled={!count} className={`${count ? "has-events" : ""} ${key === today ? "is-today" : ""}`} aria-pressed={day === key} aria-label={`${i + 1} de ${label}: ${count} actividades`} onClick={() => setDay(day === key ? null : key)}><span>{i + 1}</span>{count > 0 && <small>{count} {count === 1 ? "salida" : "salidas"}</small>}</button>;
        })}
      </div><button className="calendar-reset" onClick={() => {setDay(null); setMonth((slots[0]?.date || today).slice(0, 7));}}>Ir a la próxima fecha</button>
    </section>
    <section className="calendar-events" aria-label="Fechas de experiencias" aria-live="polite">
      <div className="calendar-list-head"><h3>{day ? `Salidas del ${Number(day.slice(-2))}` : "Todas las fechas del mes"}</h3>{day && <button onClick={() => setDay(null)}>Ver todo el mes</button>}</div>
      {!visible.length && <div className="calendar-empty"><h3>{slots.length ? "Este mes todavía está en pausa." : "Pronto habrá nuevas salidas."}</h3><p>{slots.length ? "Explora otro mes para encontrar tu próxima experiencia." : "Vuelve pronto para conocer las próximas fechas."}</p></div>}
      {visible.map(slot => <article className="calendar-event" key={slot.id}>
        <p className="calendar-eyebrow">{new Date(`${slot.date}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })} · {slot.time.slice(0, 5)}</p>
        <h3>{slot.title}</h3><p>{[slot.zone, slot.duration, slot.facilitator].filter(Boolean).join(" · ")}</p>
        <p className="calendar-capacity">{slot.remaining > 0 ? `${slot.remaining} lugares disponibles` : "Cupo completo"}</p>
        <div className="calendar-actions">{slot.remaining > 0 && <a className="calendar-button" href={`/reservar/${encodeURIComponent(slot.slug)}`}>Reservar lugar ↗</a>}<a className="calendar-save" href={`/api/public/calendar?id=${encodeURIComponent(slot.id)}`}>↓ Guardar en mi calendario</a></div>
      </article>)}
    </section></div>
  </>;
}
