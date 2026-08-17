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
    const { name, role, bio, photoUrl, collection, reclaims, isPublished } = body;

    if (!name) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    await db.execute({
      sql: `UPDATE facilitators SET name = ?, role = ?, bio = ?, photo_url = ?, collection = ?, reclaims = ?, is_published = ? WHERE id = ?`,
      args: [name, role || null, bio || null, photoUrl || null, collection || null, reclaims || null, isPublished ? 1 : 0, params.id],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/facilitators/:id]", error);
    return NextResponse.json({ error: "Error al actualizar el facilitador." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    await db.execute({ sql: "DELETE FROM facilitators WHERE id = ?", args: [params.id] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/facilitators/:id]", error);
    return NextResponse.json({ error: "Error al eliminar el facilitador." }, { status: 500 });
  }
}
