import { NextRequest, NextResponse } from "next/server";
import { adminEmail } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { experienceId, date, time, capacity } = body;

    if (!experienceId || !date || !time) {
      return NextResponse.json(
        { error: "Experiencia, fecha y hora son obligatorios." },
        { status: 400 }
      );
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
