import { NextRequest, NextResponse } from "next/server";
import { authenticate, createToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const user = await authenticate(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    const token = await createToken(user.id, user.email);
    setSessionCookie(token);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al iniciar sesión." },
      { status: 500 }
    );
  }
}
