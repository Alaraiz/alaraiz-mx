import { createClient } from "@libsql/client";

/**
 * Turso/LibSQL database client.
 * Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your .env file.
 */
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Ensures migrate() is called exactly once per process lifetime.
 * Safe to call from any API route — subsequent calls are no-ops.
 */
let _migrated: Promise<void> | null = null;

export function ensureMigrated(): Promise<void> {
  if (!_migrated) {
    // Lazy import to avoid circular dependency at module load
    _migrated = import("./schema").then((m) => m.migrate());
  }
  return _migrated;
}
