import { NextRequest, NextResponse } from "next/server";
import { requireRole, hashPassword } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: user === null ? 403 : 401 });
  }

  try {
    await ensureMigrated();

    const result = await db.execute(
      `SELECT u.id, u.email, u.name, u.role, u.facilitator_id, u.created_at,
              f.name AS facilitator_name
       FROM users u
       LEFT JOIN facilitators f ON f.id = u.facilitator_id
       ORDER BY u.created_at DESC`
    );
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ error: "Error al cargar usuarios." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    await ensureMigrated();

    const body = await request.json();
    const { email, password, name, role, facilitatorId } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios." }, { status: 400 });
    }

    const validRoles = ["admin", "editor"];
    const userRole = validRoles.includes(role) ? role : "editor";
    const assignedFacilitatorId = userRole === "editor" && facilitatorId ? String(facilitatorId) : null;

    const hash = await hashPassword(password);
    const result = await db.execute({
      sql: "INSERT INTO users (email, password_hash, name, role, facilitator_id) VALUES (?, ?, ?, ?, ?) RETURNING id",
      args: [email, hash, name || null, userRole, assignedFacilitatorId],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 409 });
    }
    console.error("[POST /api/admin/users]", error);
    return NextResponse.json({ error: "Error al crear el usuario." }, { status: 500 });
  }
}
