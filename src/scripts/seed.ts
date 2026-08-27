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

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "Alaraiz@pm.me";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const EDITOR_EMAIL = process.env.SEED_EDITOR_EMAIL;
const EDITOR_PASSWORD = process.env.SEED_EDITOR_PASSWORD;

async function seed() {
  console.log("Running migrations...");
  await migrate();
  console.log("Tables created.");

  // Check if admin user exists
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [ADMIN_EMAIL],
  });

  if (existing.rows.length === 0) {
    if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
      throw new Error(
        "Set SEED_ADMIN_PASSWORD with at least 12 characters before creating the admin user."
      );
    }
    const hash = await hashPassword(ADMIN_PASSWORD);
    await db.execute({
      sql: "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
      args: [ADMIN_EMAIL, hash, "Admin Raíz", "admin"],
    });
    console.log(`Admin user created: ${ADMIN_EMAIL}`);
  } else {
    console.log("Admin user already exists.");
  }

  if (EDITOR_EMAIL && EDITOR_PASSWORD) {
    if (EDITOR_PASSWORD.length < 12) {
      throw new Error(
        "Set SEED_EDITOR_PASSWORD with at least 12 characters before creating the editor user."
      );
    }

    const editorExists = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [EDITOR_EMAIL],
    });

    if (editorExists.rows.length === 0) {
      const editorHash = await hashPassword(EDITOR_PASSWORD);
      await db.execute({
        sql: "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
        args: [EDITOR_EMAIL, editorHash, "Editor Raíz", "editor"],
      });
      console.log(`Editor user created: ${EDITOR_EMAIL}`);
    } else {
      console.log("Editor user already exists.");
    }
  }

  console.log("Seed complete.");
}

seed().catch(console.error);
