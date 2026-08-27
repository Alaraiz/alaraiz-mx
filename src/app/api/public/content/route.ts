import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { contentRowsToMap } from "@/content-cms/registry";

export const dynamic = "force-dynamic";

type ContentSqlRow = {
  page_key?: unknown;
  section_key?: unknown;
  field_key?: unknown;
  locale?: unknown;
  value?: unknown;
  default_value?: unknown;
};

export async function GET(request: NextRequest) {
  const pageKey = request.nextUrl.searchParams.get("pageKey") || "landing";

  try {
    await ensureMigrated();

    const result = await db.execute({
      sql: `SELECT page_key, section_key, field_key, locale,
                   COALESCE(value, default_value, '') AS value,
                   default_value
            FROM content_blocks
            WHERE page_key = ?
            ORDER BY sort_order ASC`,
      args: [pageKey],
    });

    return NextResponse.json({
      content: contentRowsToMap(result.rows as ContentSqlRow[]),
    });
  } catch (error) {
    console.error("[GET /api/public/content]", error);
    return NextResponse.json(
      { error: "Error al cargar contenido." },
      { status: 500 }
    );
  }
}
