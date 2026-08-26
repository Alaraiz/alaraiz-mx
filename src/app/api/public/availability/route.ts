import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/availability?experienceId=<id>
 * Returns open availability slots for a given experience (or all published).
 * Only returns future dates with status='open' and remaining capacity.
 */
export async function GET(request: NextRequest) {
  await ensureMigrated();

  const experienceId = request.nextUrl.searchParams.get("experienceId");

  try {
    let result;

    if (experienceId) {
      result = await db.execute({
        sql: `SELECT a.id, a.experience_id, a.date, a.time, a.capacity, a.booked, a.status,
                     e.title, e.slug, e.price, e.duration, e.cover_image_url
              FROM availability a
              JOIN experiences e ON e.id = a.experience_id
              WHERE a.experience_id = ? AND a.status = 'open' AND e.is_published = 1
                AND a.date >= date('now')
                AND (a.capacity - a.booked) > 0
              ORDER BY a.date ASC, a.time ASC`,
        args: [experienceId],
      });
    } else {
      result = await db.execute(
        `SELECT a.id, a.experience_id, a.date, a.time, a.capacity, a.booked, a.status,
                e.title, e.slug, e.price, e.duration, e.cover_image_url
         FROM availability a
         JOIN experiences e ON e.id = a.experience_id
         WHERE a.status = 'open' AND e.is_published = 1
           AND a.date >= date('now')
           AND (a.capacity - a.booked) > 0
         ORDER BY a.date ASC, a.time ASC`
      );
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
