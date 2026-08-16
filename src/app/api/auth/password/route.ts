import { NextRequest, NextResponse } from "next/server";
import { adminEmail, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const email = await adminEmail();
  if (!email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: "SELECT password_hash FROM users WHERE email = ?",
      args: [email],
    });

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, String(user.password_hash));
    if (!valid) {
      return NextResponse.json(
        { error: "Contraseña actual incorrecta." },
        { status: 401 }
      );
    }

    const hash = await hashPassword(newPassword);
    await db.execute({
      sql: "UPDATE users SET password_hash = ? WHERE email = ?",
      args: [hash, email],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/auth/password]", error);
    return NextResponse.json({ error: "Error al cambiar la contraseña." }, { status: 500 });
  }
}
