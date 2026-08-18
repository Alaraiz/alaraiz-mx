import { NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";

/**
 * GET /api/public/experiences
 * Returns all published experiences with facilitator info.
 * No auth required — public endpoint.
 */
export async function GET() {
  await ensureMigrated();

  try {
    const result = await db.execute(
      `SELECT e.id, e.slug, e.title, e.tag, e.description, e.duration, e.price,
              e.capacity, e.cover_image_url, e.collection, e.pace, e.zone,
              e.language, e.includes, e.facilitator_id,
              e.title_en, e.tag_en, e.description_en, e.includes_en,
              f.name AS facilitator_name, f.role AS facilitator_role,
              f.photo_url AS facilitator_photo_url
       FROM experiences e
       LEFT JOIN facilitators f ON f.id = e.facilitator_id
       WHERE e.is_published = 1
       ORDER BY e.created_at ASC`
    );

    return NextResponse.json({ experiences: result.rows });
  } catch (error) {
    console.error("[GET /api/public/experiences]", error);
    return NextResponse.json(
      { error: "Error al cargar experiencias." },
      { status: 500 }
    );
  }
}
