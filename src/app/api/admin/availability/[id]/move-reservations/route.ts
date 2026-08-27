import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { userCanManageExperience } from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export async function POST(
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
    const targetAvailabilityId = String(body.targetAvailabilityId || "");
    if (!targetAvailabilityId || targetAvailabilityId === params.id) {
      return NextResponse.json({ error: "Elige una nueva fecha distinta." }, { status: 400 });
    }

    const slots = await db.execute({
      sql: `SELECT id, experience_id, booked, capacity, status
            FROM availability
            WHERE id IN (?, ?)`,
      args: [params.id, targetAvailabilityId],
    });
    const source = slots.rows.find((slot) => String(slot.id) === params.id);
    const target = slots.rows.find((slot) => String(slot.id) === targetAvailabilityId);

    if (!source || !target) {
      return NextResponse.json({ error: "Fecha origen o destino no encontrada." }, { status: 404 });
    }
    if (String(source.experience_id) !== String(target.experience_id)) {
      return NextResponse.json({ error: "Solo puedes mover reservas entre fechas de la misma experiencia." }, { status: 409 });
    }
    if (String(target.status || "open") !== "open") {
      return NextResponse.json({ error: "La fecha destino debe estar abierta." }, { status: 409 });
    }
    if (!(await userCanManageExperience(user, String(source.experience_id)))) {
      return NextResponse.json({ error: "No autorizado para reagendar esta experiencia." }, { status: 403 });
    }

    const reservations = await db.execute({
      sql: "SELECT id, attendees_count, capacity_held FROM reservations WHERE availability_id = ?",
      args: [params.id],
    });
    if (reservations.rows.length === 0) {
      return NextResponse.json({ error: "No hay reservas para mover en esta fecha." }, { status: 400 });
    }

    const heldCount = reservations.rows.reduce((sum, reservation) => {
      if (Number(reservation.capacity_held) !== 1) return sum;
      return sum + (Number(reservation.attendees_count) || 1);
    }, 0);
    const targetBooked = Number(target.booked) || 0;
    const targetCapacity = Number(target.capacity) || 0;

    if (targetBooked + heldCount > targetCapacity) {
      return NextResponse.json(
        { error: `La nueva fecha no tiene cupo suficiente. Necesita ${heldCount} lugar(es) libres.` },
        { status: 409 }
      );
    }

    await db.batch([
      {
        sql: "UPDATE reservations SET availability_id = ?, updated_at = datetime('now') WHERE availability_id = ?",
        args: [targetAvailabilityId, params.id],
      },
      {
        sql: "UPDATE availability SET booked = MAX(booked - ?, 0) WHERE id = ?",
        args: [heldCount, params.id],
      },
      {
        sql: "UPDATE availability SET booked = booked + ? WHERE id = ?",
        args: [heldCount, targetAvailabilityId],
      },
    ]);

    return NextResponse.json({ ok: true, moved: reservations.rows.length, heldCount });
  } catch (error) {
    console.error("[POST /api/admin/availability/:id/move-reservations]", error);
    return NextResponse.json({ error: "Error al mover las reservas." }, { status: 500 });
  }
}
