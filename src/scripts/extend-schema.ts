/**
 * Idempotent migration: adds new experience columns to an existing local.db.
 * SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we check PRAGMA table_info first.
 *
 * Usage: npx tsx src/scripts/extend-schema.ts
 */
import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

interface ColumnInfo {
  name: string;
}

async function getColumns(table: string): Promise<Set<string>> {
  const result = await db.execute(`PRAGMA table_info(${table})`);
  return new Set(result.rows.map((r) => String((r as unknown as ColumnInfo).name)));
}

async function addColumnIfMissing(
  table: string,
  column: string,
  definition: string,
  existingColumns: Set<string>
) {
  if (existingColumns.has(column)) {
    console.log(`  ✓ ${table}.${column} already exists`);
    return;
  }
  const sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`;
  await db.execute(sql);
  console.log(`  + ${table}.${column} added`);
}

async function main() {
  console.log("Extending experiences table...\n");

  const cols = await getColumns("experiences");

  await addColumnIfMissing("experiences", "pace", "TEXT", cols);
  await addColumnIfMissing("experiences", "zone", "TEXT", cols);
  await addColumnIfMissing("experiences", "language", "TEXT DEFAULT 'ES / EN'", cols);
  await addColumnIfMissing("experiences", "includes", "TEXT", cols);
  await addColumnIfMissing("experiences", "facilitator_id", "TEXT REFERENCES facilitators(id)", cols);

  console.log("\nDone. All columns are present.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
