import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, nameEn, description, isActive, sortOrder } = body;

    await db.execute({
      sql: `UPDATE collections SET
              name = COALESCE(?, name),
              name_en = ?,
              description = ?,
              is_active = COALESCE(?, is_active),
              sort_order = COALESCE(?, sort_order)
            WHERE id = ?`,
      args: [
        name || null,
        nameEn ?? null,
        description ?? null,
        isActive != null ? (isActive ? 1 : 0) : null,
        sortOrder ?? null,
        params.id,
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/collections/:id]", error);
    return NextResponse.json({ error: "Error al actualizar la colección." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    await db.execute({ sql: "DELETE FROM collections WHERE id = ?", args: [params.id] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/collections/:id]", error);
    return NextResponse.json({ error: "Error al eliminar la colección." }, { status: 500 });
  }
}
