/**
 * Seed script — creates the initial admin user and runs migrations.
 * Run with: npx tsx src/scripts/seed.ts
 *
 * You need TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your .env,
 * or it will create a local SQLite file (local.db).
 */
import "dotenv/config";
import { db } from "../lib/db";
import { hashPassword } from "../lib/auth";
import { migrate } from "../lib/schema";

async function seed() {
  console.log("🌱 Running migrations…");
  await migrate();
  console.log("✅ Tables created.");

  // Check if admin user exists
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: ["admin@alaraiz.mx"],
  });

  if (existing.rows.length === 0) {
    const hash = await hashPassword("cambiame123");
    await db.execute({
      sql: "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
      args: ["admin@alaraiz.mx", hash, "Admin Raíz", "admin"],
    });
    console.log("👤 Admin user created: admin@alaraiz.mx / cambiame123");
  } else {
    console.log("👤 Admin user already exists.");
  }

  // Create editor user if it doesn't exist
  const editorExists = await db.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: ["editor@alaraiz.mx"],
  });

  if (editorExists.rows.length === 0) {
    const editorHash = await hashPassword("cambiame123");
    await db.execute({
      sql: "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
      args: ["editor@alaraiz.mx", editorHash, "Editor Raíz", "editor"],
    });
    console.log("👤 Editor user created: editor@alaraiz.mx / cambiame123");
  } else {
    console.log("👤 Editor user already exists.");
  }

  console.log("🌱 Seed complete!");
}

seed().catch(console.error);
