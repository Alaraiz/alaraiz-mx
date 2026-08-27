import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { normalizeDiscountCode } from "@/lib/discounts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireRole(["admin"]);
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    await ensureMigrated();
    const result = await db.execute(
      `SELECT id, code, label, discount_type, value, is_active, max_uses, used_count, starts_at, expires_at, created_at, updated_at
       FROM discount_codes
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ discounts: result.rows });
  } catch (error) {
    console.error("[GET /api/admin/discounts]", error);
    return NextResponse.json({ error: "Error al cargar descuentos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const result = await db.execute({
      sql: `INSERT INTO discount_codes (code, label, discount_type, value, is_active, max_uses, starts_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        code,
        body.label ? String(body.label) : null,
        type,
        value,
        body.isActive === false || body.is_active === 0 ? 0 : 1,
        maxUses && maxUses > 0 ? maxUses : null,
        body.startsAt || body.starts_at || null,
        body.expiresAt || body.expires_at || null,
      ],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Ese código ya existe." }, { status: 409 });
    }
    console.error("[POST /api/admin/discounts]", error);
    return NextResponse.json({ error: "Error al crear descuento." }, { status: 500 });
  }
}
