import type { Metadata } from "next";
import { getPublicCalendar } from "@/lib/public-calendar";
import { getMexicoDateKey } from "@/lib/mexico-time";
import Calendar from "./calendar";
import "./calendar.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Calendario de experiencias · A la raíz",
  description: "Explora las próximas fechas de A la raíz y guarda las experiencias en tu calendario.",
  alternates: { canonical: "/calendario" },
};
export default async function CalendarPage() {
  let slots;
  try { slots = await getPublicCalendar(); } catch (error) { console.error("[calendar page]", error); }
  return <main className="raiz-calendar">
    <header><a className="calendar-back" href="/">← Volver a Raíz</a><p className="calendar-eyebrow">Recreo · Agenda de experiencias</p>
      <h1>Hazle espacio<br /><em>a la ciudad.</em></h1>
      <p>Todas nuestras próximas salidas, en un solo lugar. Encuentra tu fecha y ven a vivir la ciudad desde adentro.</p>
    </header>
    {slots ? <Calendar slots={slots} today={getMexicoDateKey()} /> : <section className="calendar-empty"><h2>No pudimos cargar las fechas.</h2><p>Intenta de nuevo en unos minutos.</p><a href="/calendario">Volver a intentar</a></section>}
    <footer>A la raíz · Ciudad de México</footer>
  </main>;
}
