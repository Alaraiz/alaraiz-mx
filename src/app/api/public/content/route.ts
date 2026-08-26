import { NextRequest, NextResponse } from "next/server";
import { db, ensureMigrated } from "@/lib/db";
import { blocksForPage, contentRowsToMap } from "@/content-cms/registry";

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
  await ensureMigrated();

  const pageKey = request.nextUrl.searchParams.get("pageKey") || "landing";
  await seedPageBlocks(pageKey);

  try {
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

async function seedPageBlocks(pageKey: string) {
  const definitions = blocksForPage(pageKey);
  if (definitions.length === 0) return;

  const existing = await db.execute({
    sql: "SELECT COUNT(*) AS total FROM content_blocks WHERE page_key = ?",
    args: [pageKey],
  });
  if (Number(existing.rows[0]?.total) >= definitions.length) return;

  for (const block of definitions) {
    await db.execute({
      sql: `INSERT INTO content_blocks (
              page_key, section_key, field_key, locale, label, type,
              default_value, is_rich_text, sort_order
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(page_key, section_key, field_key, locale)
            DO UPDATE SET
              label = excluded.label,
              type = excluded.type,
              default_value = excluded.default_value,
              is_rich_text = excluded.is_rich_text,
              sort_order = excluded.sort_order`,
      args: [
        block.pageKey,
        block.sectionKey,
        block.fieldKey,
        block.locale,
        block.label,
        block.type,
        block.defaultValue,
        block.type === "richtext" ? 1 : 0,
        block.sortOrder,
      ],
    });
  }
}
