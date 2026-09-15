import { db, ensureMigrated } from "./db";
import { getMexicoDateKey } from "./mexico-time";
import type { CalendarSlot } from "./calendar";

export async function getPublicCalendar(): Promise<CalendarSlot[]> {
  await ensureMigrated();
  const result = await db.execute({
    sql: `SELECT a.id, a.date, a.time, a.capacity, a.booked, e.title, e.slug, e.duration, e.zone,
                 f.name AS facilitator
          FROM availability a JOIN experiences e ON e.id = a.experience_id
          LEFT JOIN facilitators f ON f.id = e.facilitator_id
          WHERE e.is_published = 1 AND e.slug IS NOT NULL AND a.status = 'open' AND a.date >= ?
          ORDER BY a.date, a.time, e.title`,
    args: [getMexicoDateKey()],
  });
  return result.rows.map(row => ({
    id: String(row.id), date: String(row.date), time: String(row.time), title: String(row.title),
    slug: String(row.slug), duration: String(row.duration || ""), zone: String(row.zone || ""),
    facilitator: String(row.facilitator || ""), remaining: Math.max(0, Number(row.capacity) - Number(row.booked)),
  }));
}
