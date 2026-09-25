import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * Schema changes read the connection string from the environment so the same
 * command works locally and against a hosted database.
 *
 * Use a direct (non-pooled) connection string for migrations where your
 * provider offers one — PgBouncer transaction pooling does not support every
 * statement drizzle-kit issues.
 */
const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!url) {
  throw new Error("Set DATABASE_URL (or DIRECT_DATABASE_URL) before running drizzle-kit.");
}

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
} satisfies Config;
