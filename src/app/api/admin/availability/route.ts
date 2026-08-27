import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { userCanManageExperience } from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["admin", "editor"]);
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    await ensureMigrated();

    const body = await request.json();
    const { experienceId, date, time, capacity } = body;

    if (!experienceId || !date || !time) {
      return NextResponse.json(
        { error: "Experiencia, fecha y hora son obligatorios." },
        { status: 400 }
      );
    }
    if (!(await userCanManageExperience(user, String(experienceId)))) {
      return NextResponse.json({ error: "No autorizado para crear fechas en esta experiencia." }, { status: 403 });
    }

    const result = await db.execute({
      sql: `INSERT INTO availability (experience_id, date, time, capacity) VALUES (?, ?, ?, ?) RETURNING id`,
      args: [experienceId, date, time, capacity || 12],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("[POST /api/admin/availability]", error);
    return NextResponse.json({ error: "Error al crear la fecha." }, { status: 500 });
  }
}
