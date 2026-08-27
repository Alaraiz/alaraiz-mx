import { NextRequest, NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    await ensureMigrated();

    const body = await request.json();
    const { name, role, password, facilitatorId } = body;

    const validRoles = ["admin", "editor"];
    const userRole = validRoles.includes(role) ? role : undefined;
    const assignedFacilitatorId = userRole === "editor" && facilitatorId ? String(facilitatorId) : null;

    if (password) {
      const hash = await hashPassword(password);
      await db.execute({
        sql: `UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), facilitator_id = ?, password_hash = ? WHERE id = ?`,
        args: [name || null, userRole || null, assignedFacilitatorId, hash, params.id],
      });
    } else {
      await db.execute({
        sql: `UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), facilitator_id = ? WHERE id = ?`,
        args: [name || null, userRole || null, assignedFacilitatorId, params.id],
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/users/:id]", error);
    return NextResponse.json({ error: "Error al actualizar el usuario." }, { status: 500 });
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

  // Prevent self-deletion
  if (params.id === user.sub) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  try {
    await ensureMigrated();

    await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [params.id] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/users/:id]", error);
    return NextResponse.json({ error: "Error al eliminar el usuario." }, { status: 500 });
  }
}
