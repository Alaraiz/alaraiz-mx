import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(request: NextRequest) {
  const user = await requireRole(["admin", "editor"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten archivos de imagen." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el límite de 8 MB." },
        { status: 400 }
      );
    }

    const blob = await put(`alaraiz/${Date.now()}-${file.name}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json(
      { error: "Error al subir la imagen." },
      { status: 500 }
    );
  }
}
