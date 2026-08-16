/**
 * Migration script — creates all database tables.
 * Run with: npm run db:migrate
 */
import "dotenv/config";
import { migrate } from "../lib/schema";

async function main() {
  console.log("🗄️  Running database migrations…");
  await migrate();
  console.log("✅ All tables created / verified.");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
