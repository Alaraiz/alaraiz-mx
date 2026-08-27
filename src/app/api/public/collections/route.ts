import { NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureMigrated();

  try {
    const result = await db.execute(
      `SELECT id, name, name_en, description
       FROM collections
       WHERE is_active = 1
       ORDER BY sort_order ASC, name ASC`
    );

    return NextResponse.json({ collections: result.rows });
  } catch (error) {
    console.error("[GET /api/public/collections]", error);
    return NextResponse.json(
      { error: "Error al cargar colecciones." },
      { status: 500 }
    );
  }
}
