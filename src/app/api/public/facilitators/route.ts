import { NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";

/**
 * GET /api/public/facilitators
 * Returns all published facilitators.
 * No auth required — public endpoint.
 */
export async function GET() {
  await ensureMigrated();

  try {
    const result = await db.execute(
      `SELECT id, name, role, bio, photo_url, collection, reclaims
       FROM facilitators
       WHERE is_published = 1
       ORDER BY created_at ASC`
    );

    return NextResponse.json({ facilitators: result.rows });
  } catch (error) {
    console.error("[GET /api/public/facilitators]", error);
    return NextResponse.json(
      { error: "Error al cargar facilitadores." },
      { status: 500 }
    );
  }
}
