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
    const { title, tag, description, duration, price, capacity, coverImageUrl, isPublished } = body;

    if (!title) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const result = await db.execute({
      sql: `INSERT INTO experiences (title, slug, tag, description, duration, price, capacity, cover_image_url, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [title, slug, tag || null, description || null, duration || null, price ?? null, capacity || 12, coverImageUrl || null, isPublished ? 1 : 0],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("[POST /api/admin/experiences]", error);
    return NextResponse.json({ error: "Error al crear la experiencia." }, { status: 500 });
  }
}
