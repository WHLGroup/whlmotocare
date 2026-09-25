import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Serverless-safe PostgreSQL access.
 *
 * On Vercel every concurrent invocation is its own process, so each one opens
 * its own pool. The pool is therefore kept deliberately small and is allowed to
 * drain while idle. Point DATABASE_URL at a pooled (PgBouncer) connection
 * string in production — Neon, Supabase and Vercel Postgres all provide one.
 *
 * The connection is created lazily so importing this module never throws during
 * `next build`, where no database is reachable.
 */

const globalForDb = globalThis as typeof globalThis & {
  __whlPool?: Pool;
  __whlDb?: NodePgDatabase;
};

export function hasDatabaseConfig(): boolean {
  return Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL);
}

function connectionString(): string {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to your environment variables (see .env.example).");
  }
  return url;
}

export function getPool(): Pool {
  if (!globalForDb.__whlPool) {
    const max = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
    globalForDb.__whlPool = new Pool({
      connectionString: connectionString(),
      // Small per-instance ceiling: many instances share one database.
      max: Number.isInteger(max) && max > 0 ? max : 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      // Let idle sockets close so frozen serverless instances hold nothing open.
      allowExitOnIdle: true,
    });
    // A pool-level error must never take the whole process down.
    globalForDb.__whlPool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error:", error);
    });
  }
  return globalForDb.__whlPool;
}

export function getDb(): NodePgDatabase {
  globalForDb.__whlDb ??= drizzle(getPool());
  return globalForDb.__whlDb;
}

/** Lazily-resolved Drizzle client. Safe to import at module scope. */
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, property) {
    const client = getDb();
    const value = Reflect.get(client, property) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});
