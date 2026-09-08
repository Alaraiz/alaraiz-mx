import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireRole(["admin"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  await ensureMigrated();
  const result = await db.execute(
    "SELECT key, label, subject, title, body, cta_label, footer, updated_at FROM email_templates ORDER BY label ASC"
  );

  return NextResponse.json({ templates: result.rows });
}
