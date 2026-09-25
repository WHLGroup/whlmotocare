/**
 * Idempotent environment bootstrap for WHL Motocare.
 *
 * Safe to run repeatedly: it never overwrites an existing catalogue, admin
 * account, order, booking or setup key.
 *
 * Local sandbox / fresh checkout:
 *   npm run bootstrap
 *
 * Against a hosted database (Vercel, Neon, Supabase), from your own machine:
 *   DATABASE_URL="postgres://…" npm run bootstrap -- --print-key
 *
 * `--print-key` prints a generated ADMIN_SETUP_KEY instead of writing it to
 * .env, so you can paste it into your hosting provider's environment variables.
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import { products } from "../src/db/schema.ts";
import { initialProducts } from "../src/lib/catalog.ts";

const printKeyOnly = process.argv.includes("--print-key") || Boolean(process.env.VERCEL);
const skipSeed = process.argv.includes("--no-seed");
const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

// 1. Schema — drizzle-kit push only applies what is missing.
execFileSync("npx", ["drizzle-kit", "push"], { stdio: "pipe" });
console.log("✓ Database schema is up to date.");

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
const db = drizzle(pool);

try {
  // 2. Starter catalogue — existing products are never modified.
  if (skipSeed) {
    console.log("• Skipped catalogue seeding (--no-seed).");
  } else {
    const [{ count }] = await db.select({ count: sql`count(*)::int` }).from(products);
    if (count === 0) {
      await db.insert(products).values(initialProducts).onConflictDoNothing();
      console.log(`✓ Seeded ${initialProducts.length} starter products into an empty catalogue.`);
    } else {
      console.log(`✓ Catalogue already has ${count} product(s); left untouched.`);
    }
  }

  // 3. Private owner enrollment key — generated once, never regenerated.
  const envText = (() => { try { return readFileSync(".env", "utf8"); } catch { return ""; } })();
  const alreadySet = Boolean(process.env.ADMIN_SETUP_KEY) || /^ADMIN_SETUP_KEY=.+/m.test(envText);

  if (alreadySet) {
    console.log("✓ Private ADMIN_SETUP_KEY already configured; preserved.");
  } else {
    const key = randomBytes(32).toString("base64url");
    if (printKeyOnly) {
      console.log("\n✓ Generated a private ADMIN_SETUP_KEY (not written to disk).");
      console.log("\n  Add this environment variable to your hosting provider:\n");
      console.log(`    ADMIN_SETUP_KEY=${key}\n`);
      console.log("  Then redeploy and open:  https://your-domain/admin#setup=" + key + "\n");
    } else {
      appendFileSync(".env", `${!envText || envText.endsWith("\n") ? "" : "\n"}\n# Private, single-use owner enrollment key. Never expose in client code.\nADMIN_SETUP_KEY=${key}\n`);
      console.log("✓ Generated a new private ADMIN_SETUP_KEY.");
      console.log(`\n  First-time owner setup path: /admin#setup=${key}`);
      console.log("  Share this link privately with the shop owner only.\n");
    }
  }
  console.log("Bootstrap complete. Restart the app to load any new environment values.");
} finally {
  await pool.end();
}
