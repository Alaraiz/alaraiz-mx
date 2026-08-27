import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { toPositiveInteger } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["admin", "editor"]);
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    await ensureMigrated();

    const body = await request.json();
    const currentResult = await db.execute({
      sql: "SELECT booked, capacity FROM availability WHERE id = ?",
      args: [params.id],
    });
    const current = currentResult.rows[0];
    if (!current) {
      return NextResponse.json({ error: "Fecha no encontrada." }, { status: 404 });
    }

    const booked = Number(current.booked) || 0;
    const requestedCapacity =
      body.capacity == null ? Number(current.capacity) || 1 : toPositiveInteger(body.capacity, 1);
    if (requestedCapacity < booked) {
      return NextResponse.json(
        { error: `La capacidad no puede ser menor a los ${booked} lugares ya reservados.` },
        { status: 409 }
      );
    }

    const status = String(body.status || "open");
    if (!["open", "closed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Estatus inválido." }, { status: 400 });
    }

    await db.execute({
      sql: "UPDATE availability SET capacity = ?, status = ? WHERE id = ?",
      args: [requestedCapacity, status, params.id],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/availability/:id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar la fecha." },
      { status: 500 }
    );
  }
}
