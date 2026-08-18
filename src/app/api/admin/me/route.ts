import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getUserFromToken();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Fetch name from DB since it's not in the JWT
  let name: string | null = null;
  try {
    const result = await db.execute({
      sql: "SELECT name FROM users WHERE id = ?",
      args: [user.sub],
    });
    if (result.rows.length > 0) {
      name = result.rows[0].name as string | null;
    }
  } catch {
    // Non-critical, continue without name
  }

  return NextResponse.json({
    id: user.sub,
    email: user.email,
    role: user.role,
    name,
  });
}
