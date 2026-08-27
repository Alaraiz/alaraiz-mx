import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireRole(["admin", "editor"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const result = await db.execute(
      "SELECT id, name, name_en, description, is_active, sort_order, created_at FROM collections ORDER BY sort_order ASC, created_at ASC"
    );
    return NextResponse.json({ collections: result.rows });
  } catch (error) {
    console.error("[GET /api/admin/collections]", error);
    return NextResponse.json({ error: "Error al cargar colecciones." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, nameEn, description } = body;

    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    const result = await db.execute({
      sql: "INSERT INTO collections (name, name_en, description) VALUES (?, ?, ?) RETURNING id",
      args: [name, nameEn || null, description || null],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("[POST /api/admin/collections]", error);
    return NextResponse.json({ error: "Error al crear la colección." }, { status: 500 });
  }
}
