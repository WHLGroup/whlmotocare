import { sql } from "drizzle-orm";
import { db, hasDatabaseConfig } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Deployment health probe. Confirms the app is running *and* that it can reach
 * the database, which is the usual failure after a misconfigured DATABASE_URL.
 */
export async function GET() {
  const startedAt = Date.now();
  const headers = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };
  try {
    if (!hasDatabaseConfig()) {
      return Response.json({ ok: false, database: "unconfigured", hint: "Set DATABASE_URL to a PostgreSQL connection string before using the shop or admin tools." }, { status: 503, headers });
    }
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "connected", latencyMs: Date.now() - startedAt }, { headers });
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json(
      { ok: false, database: "unreachable", hint: "Check DATABASE_URL and that the schema has been applied." },
      { status: 503, headers },
    );
  }
}
