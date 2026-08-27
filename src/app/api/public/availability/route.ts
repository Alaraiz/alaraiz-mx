import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { getMexicoDateKey } from "@/lib/mexico-time";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/availability?experienceId=<id>
 * Returns open availability slots for a given experience (or all published).
 * Only returns future dates with status='open' and remaining capacity.
 */
export async function GET(request: NextRequest) {
  const experienceId = request.nextUrl.searchParams.get("experienceId");
  const today = getMexicoDateKey();

  try {
    await ensureMigrated();

    let result;

    if (experienceId) {
      result = await db.execute({
        sql: `SELECT a.id, a.experience_id, a.date, a.time, a.capacity, a.booked, a.status,
                     e.title, e.slug, e.tag, e.description, e.price, e.duration, e.cover_image_url,
                     e.collection, e.pace, e.zone, e.language, e.includes,
                     f.name AS facilitator_name, f.role AS facilitator_role
              FROM availability a
              JOIN experiences e ON e.id = a.experience_id
              LEFT JOIN facilitators f ON f.id = e.facilitator_id
              WHERE a.experience_id = ? AND a.status = 'open' AND e.is_published = 1
                AND a.date >= ?
                AND (a.capacity - a.booked) > 0
              ORDER BY a.date ASC, a.time ASC`,
        args: [experienceId, today],
      });
    } else {
      result = await db.execute({
        sql: `SELECT a.id, a.experience_id, a.date, a.time, a.capacity, a.booked, a.status,
                     e.title, e.slug, e.tag, e.description, e.price, e.duration, e.cover_image_url,
                     e.collection, e.pace, e.zone, e.language, e.includes,
                     f.name AS facilitator_name, f.role AS facilitator_role
              FROM availability a
              JOIN experiences e ON e.id = a.experience_id
              LEFT JOIN facilitators f ON f.id = e.facilitator_id
              WHERE a.status = 'open' AND e.is_published = 1
                AND a.date >= ?
                AND (a.capacity - a.booked) > 0
              ORDER BY a.date ASC, a.time ASC`,
        args: [today],
      });
    }

    // Add remaining capacity info
    const slots = result.rows.map((row) => ({
      ...row,
      remaining: Number(row.capacity) - Number(row.booked),
    }));

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("[GET /api/public/availability]", error);
    return NextResponse.json(
      { error: "Error al cargar disponibilidad." },
      { status: 500 }
    );
  }
}
