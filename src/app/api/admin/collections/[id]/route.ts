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
    const current = await db.execute({
      sql: "SELECT name, name_en, description, is_active, sort_order FROM collections WHERE id = ?",
      args: [params.id],
    });
    const collection = current.rows[0];
    if (!collection) {
      return NextResponse.json({ error: "Colección no encontrada." }, { status: 404 });
    }
    const previousName = String(collection.name || "");
    const nextName = name === undefined ? previousName : String(name || "").trim();
    const nextNameEn = nameEn === undefined ? collection.name_en : String(nameEn || "").trim() || null;
    const nextDescription = description === undefined ? collection.description : String(description || "").trim() || null;
    const nextIsActive = isActive === undefined ? collection.is_active : isActive ? 1 : 0;
    const nextSortOrder = sortOrder === undefined ? collection.sort_order : Number(sortOrder) || 0;

    await db.execute({
      sql: `UPDATE collections SET
              name = ?,
              name_en = ?,
              description = ?,
              is_active = ?,
              sort_order = ?
            WHERE id = ?`,
      args: [
        nextName,
        nextNameEn,
        nextDescription,
        nextIsActive,
        nextSortOrder,
        params.id,
      ],
    });

    if (nextName && previousName && nextName !== previousName) {
      await db.batch([
        {
          sql: "UPDATE experiences SET collection = ? WHERE collection = ?",
          args: [nextName, previousName],
        },
        {
          sql: "UPDATE facilitators SET collection = ? WHERE collection = ?",
          args: [nextName, previousName],
        },
      ]);
    }

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
    const current = await db.execute({
      sql: "SELECT name FROM collections WHERE id = ?",
      args: [params.id],
    });
    const name = String(current.rows[0]?.name || "");
    if (name) {
      await db.batch([
        { sql: "UPDATE experiences SET collection = NULL WHERE collection = ?", args: [name] },
        { sql: "UPDATE facilitators SET collection = NULL WHERE collection = ?", args: [name] },
      ]);
    }
    await db.execute({ sql: "DELETE FROM collections WHERE id = ?", args: [params.id] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/collections/:id]", error);
    return NextResponse.json({ error: "Error al eliminar la colección." }, { status: 500 });
  }
}
