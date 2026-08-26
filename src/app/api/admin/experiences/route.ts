import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await requireRole(["admin", "editor"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, tag, description, duration, price, capacity, coverImageUrl, galleryImages, isPublished, collection, facilitatorId, pace, zone, language, includes, titleEn, tagEn, descriptionEn, includesEn } = body;

    if (!title) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const result = await db.execute({
      sql: `INSERT INTO experiences (title, slug, tag, description, duration, price, capacity, cover_image_url, gallery_images_json, is_published, collection, facilitator_id, pace, zone, language, includes, title_en, tag_en, description_en, includes_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        title, slug, tag || null, description || null, duration || null,
        price ?? null, capacity || 12, coverImageUrl || null,
        JSON.stringify(Array.isArray(galleryImages) ? galleryImages.filter(Boolean) : []),
        isPublished ? 1 : 0,
        collection || null, facilitatorId || null, pace || null, zone || null,
        language || "ES / EN", includes || null,
        titleEn || null, tagEn || null, descriptionEn || null, includesEn || null,
      ],
    });

    return NextResponse.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("[POST /api/admin/experiences]", error);
    return NextResponse.json({ error: "Error al crear la experiencia." }, { status: 500 });
  }
}
