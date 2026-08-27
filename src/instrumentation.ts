/**
 * Next.js Instrumentation hook.
 * Runs once when the server starts — ensures DB tables exist.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureMigrated } = await import("@/lib/db");
    await ensureMigrated();
  }
}
