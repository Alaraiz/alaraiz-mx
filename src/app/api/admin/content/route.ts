import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db, ensureMigrated } from "@/lib/db";
import { blocksForPage, contentRowsToMap } from "@/content-cms/registry";
import { normalizeCmsHtml } from "@/content-cms/html";

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
  try {
    const user = await requireRole(["admin", "editor"]);
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    await ensureMigrated();
    const pageKey = request.nextUrl.searchParams.get("pageKey") || "landing";
    await seedPageBlocks(pageKey);

    const result = await db.execute({
      sql: `SELECT id, page_key, section_key, field_key, locale, label, type,
                   value, default_value, is_rich_text, sort_order, updated_at
            FROM content_blocks
            WHERE page_key = ?
            ORDER BY sort_order ASC, section_key ASC, field_key ASC, locale ASC`,
      args: [pageKey],
    });

    return NextResponse.json({
      blocks: result.rows,
      content: contentRowsToMap(result.rows as ContentSqlRow[]),
    });
  } catch (error) {
    console.error("[GET /api/admin/content]", error);
    return NextResponse.json(
      { error: "Error al cargar el contenido." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(["admin", "editor"]);
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    await ensureMigrated();

    const body = await request.json();
    const pageKey = String(body.pageKey || "landing");
    const updates = Array.isArray(body.blocks) ? body.blocks : [];
    await seedPageBlocks(pageKey);

    for (const item of updates) {
      const sectionKey = String(item.sectionKey || item.section_key || "");
      const fieldKey = String(item.fieldKey || item.field_key || "");
      const locale = String(item.locale || "es");
      const type = String(item.type || "text");
      const rawValue = String(item.value ?? "");
      const value = type === "richtext" ? normalizeCmsHtml(rawValue) : rawValue;
      const label = String(item.label || item.fieldKey || item.field_key || "Campo");
      const sortOrder = Number(item.sortOrder ?? item.sort_order ?? 9999);

      if (!sectionKey || !fieldKey) continue;

      await db.execute({
        sql: `INSERT INTO content_blocks (
                page_key, section_key, field_key, locale, label, type, value,
                default_value, is_rich_text, sort_order, updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, datetime('now'))
              ON CONFLICT(page_key, section_key, field_key, locale)
              DO UPDATE SET
                label = excluded.label,
                type = excluded.type,
                value = excluded.value,
                is_rich_text = excluded.is_rich_text,
                sort_order = excluded.sort_order,
                updated_at = datetime('now')`,
        args: [
          pageKey,
          sectionKey,
          fieldKey,
          locale,
          label,
          type,
          value,
          type === "richtext" ? 1 : 0,
          sortOrder,
        ],
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/content]", error);
    return NextResponse.json(
      { error: "Error al guardar el contenido." },
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
