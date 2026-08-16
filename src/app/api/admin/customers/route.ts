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
    const { name, email: customerEmail, phone, source, stage, tags, notes, folderId } = body;

    if (!name || !customerEmail) {
      return NextResponse.json(
        { error: "El nombre y el correo son obligatorios." },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: `INSERT INTO customers (name, email, phone, source, stage, tags_json, notes, folder_ids)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        name,
        customerEmail,
        phone || null,
        source || "landing",
        stage || "nuevo",
        JSON.stringify(tags || []),
        notes || null,
        folderId || "",
      ],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("[POST /api/admin/customers]", error);
    return NextResponse.json({ error: "Error al crear el cliente." }, { status: 500 });
  }
}
