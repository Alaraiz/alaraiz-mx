import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { normalizeDiscountCode } from "@/lib/discounts";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["admin"]);
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    await ensureMigrated();
    const body = await request.json();
    const code = normalizeDiscountCode(body.code);
    const type = String(body.discountType || body.discount_type || "percent");
    const value = Number(body.value);
    const maxUses = body.maxUses || body.max_uses ? Number(body.maxUses || body.max_uses) : null;

    if (!code) return NextResponse.json({ error: "El código es obligatorio." }, { status: 400 });
    if (!["percent", "fixed"].includes(type)) return NextResponse.json({ error: "Tipo de descuento inválido." }, { status: 400 });
    if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "El valor debe ser mayor a cero." }, { status: 400 });
    if (type === "percent" && value > 100) return NextResponse.json({ error: "El porcentaje no puede ser mayor a 100." }, { status: 400 });

    await db.execute({
      sql: `UPDATE discount_codes
            SET code = ?, label = ?, discount_type = ?, value = ?, is_active = ?,
                max_uses = ?, starts_at = ?, expires_at = ?, updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        code,
        body.label ? String(body.label) : null,
        type,
        value,
        body.isActive === false || body.is_active === 0 ? 0 : 1,
        maxUses && maxUses > 0 ? maxUses : null,
        body.startsAt || body.starts_at || null,
        body.expiresAt || body.expires_at || null,
        params.id,
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Ese código ya existe." }, { status: 409 });
    }
    console.error("[PUT /api/admin/discounts/:id]", error);
    return NextResponse.json({ error: "Error al actualizar descuento." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["admin"]);
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    await ensureMigrated();
    await db.execute({ sql: "DELETE FROM discount_codes WHERE id = ?", args: [params.id] });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/discounts/:id]", error);
    return NextResponse.json({ error: "Error al eliminar descuento." }, { status: 500 });
  }
}
