import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireRole(["admin", "editor"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, tag, description, duration, price, capacity, coverImageUrl, isPublished, collection, facilitatorId, pace, zone, language, includes, titleEn, tagEn, descriptionEn, includesEn } = body;

    await db.execute({
      sql: `UPDATE experiences SET
              title = ?, tag = ?, description = ?, duration = ?,
              price = ?, capacity = ?, cover_image_url = ?,
              is_published = ?, collection = ?, facilitator_id = ?,
              pace = ?, zone = ?, language = ?, includes = ?,
              title_en = ?, tag_en = ?, description_en = ?, includes_en = ?,
              updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        title, tag || null, description || null, duration || null,
        price ?? null, capacity || 12, coverImageUrl || null,
        isPublished ? 1 : 0, collection || null, facilitatorId || null,
        pace || null, zone || null, language || "ES / EN", includes || null,
        titleEn || null, tagEn || null, descriptionEn || null, includesEn || null,
        params.id,
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/experiences/:id]", error);
    return NextResponse.json({ error: "Error al actualizar la experiencia." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireRole(["admin", "editor"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    await db.execute({ sql: "DELETE FROM experiences WHERE id = ?", args: [params.id] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/experiences/:id]", error);
    return NextResponse.json({ error: "Error al eliminar la experiencia." }, { status: 500 });
  }
}
