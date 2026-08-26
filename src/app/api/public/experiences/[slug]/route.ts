import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/experiences/[slug]
 * Returns a single published experience by slug, including full facilitator data.
 * No auth required — public endpoint.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  await ensureMigrated();

  const { slug } = params;

  try {
    const result = await db.execute({
      sql: `SELECT e.id, e.slug, e.title, e.tag, e.description, e.duration, e.price,
                   e.capacity, e.cover_image_url, e.collection, e.pace, e.zone,
                   e.language, e.includes, e.facilitator_id
            FROM experiences e
            WHERE e.slug = ? AND e.is_published = 1
            LIMIT 1`,
      args: [slug],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Experiencia no encontrada." },
        { status: 404 }
      );
    }

    const experience = result.rows[0];

    // Fetch facilitator if exists
    let facilitator = null;
    if (experience.facilitator_id) {
      const facResult = await db.execute({
        sql: `SELECT id, name, role, bio, photo_url, collection, reclaims
              FROM facilitators WHERE id = ?`,
        args: [experience.facilitator_id as string],
      });
      if (facResult.rows.length > 0) {
        facilitator = facResult.rows[0];
      }
    }

    return NextResponse.json({ experience, facilitator });
  } catch (error) {
    console.error("[GET /api/public/experiences/[slug]]", error);
    return NextResponse.json(
      { error: "Error al cargar la experiencia." },
      { status: 500 }
    );
  }
}
