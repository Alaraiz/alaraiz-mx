import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireRole(["admin", "editor"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const result = await db.execute("SELECT * FROM facilitators ORDER BY created_at DESC");
    return NextResponse.json({ facilitators: result.rows });
  } catch (error) {
    console.error("[GET /api/admin/facilitators]", error);
    return NextResponse.json({ error: "Error al cargar facilitadores." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRole(["admin", "editor"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, role, bio, photoUrl, collection, reclaims, isPublished } = body;

    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    const result = await db.execute({
      sql: `INSERT INTO facilitators (name, role, bio, photo_url, collection, reclaims, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [name, role || null, bio || null, photoUrl || null, collection || null, reclaims || null, isPublished ? 1 : 0],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("[POST /api/admin/facilitators]", error);
    return NextResponse.json({ error: "Error al crear el facilitador." }, { status: 500 });
  }
}
