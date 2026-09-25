/** Verifies Vercel-style proxy header handling for admin security. */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { randomBytes, scryptSync } from "node:crypto";
import pg from "pg";
import { adminAccounts, adminRateLimits } from "../src/db/schema.ts";

const base = "http://127.0.0.1:3000";
const id = "proxy-" + randomBytes(6).toString("hex");
const email = `${id}@example.invalid`;
const password = randomBytes(18).toString("hex");
const salt = randomBytes(24).toString("hex");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const db = drizzle(pool);
await db.insert(adminAccounts).values({
  id, name: "Proxy Check", email,
  passwordHash: `scrypt$${salt}$${scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 67108864 }).toString("hex")}`,
});

const login = (headers) => fetch(`${base}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify({ email, password }),
  redirect: "manual",
});

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` — ${detail}`}`);
  if (!ok) failures++;
};

try {
  // 1. Vercel pattern: browser hit shop.example.com; proxy forwards it.
  const proxied = await login({
    Origin: "https://shop.example.com",
    "X-Forwarded-Host": "shop.example.com",
    "X-Forwarded-Proto": "https",
    Host: "internal-runtime.vercel.internal",
  });
  check("proxied request accepted via X-Forwarded-Host", proxied.status === 200, `got ${proxied.status}`);

  // 2. Session cookie must be Secure when the proxy terminated TLS.
  const cookie = proxied.headers.get("set-cookie") ?? "";
  check("session cookie marked Secure behind HTTPS proxy", /;\s*Secure/i.test(cookie), cookie.slice(0, 80));
  check("session cookie HttpOnly + SameSite=Strict", /HttpOnly/i.test(cookie) && /SameSite=Strict/i.test(cookie), cookie.slice(0, 80));

  // 3. Attacker origin that matches no forwarded host must be refused.
  const forged = await login({
    Origin: "https://attacker.invalid",
    "X-Forwarded-Host": "shop.example.com",
    "X-Forwarded-Proto": "https",
    Host: "shop.example.com",
  });
  check("mismatched origin rejected", forged.status === 403, `got ${forged.status}`);

  // 4. Spoofed forwarded host that does not match origin must be refused.
  const spoofed = await login({
    Origin: "https://shop.example.com",
    "X-Forwarded-Host": "attacker.invalid",
    Host: "another.invalid",
  });
  check("origin not matching any known host rejected", spoofed.status === 403, `got ${spoofed.status}`);

  // 5. Plain local HTTP still works for development.
  const local = await login({ Origin: base, Host: "127.0.0.1:3000" });
  check("local HTTP development login still works", local.status === 200, `got ${local.status}`);
  const localCookie = local.headers.get("set-cookie") ?? "";
  check("local cookie not forced Secure over plain HTTP", !/;\s*Secure/i.test(localCookie), localCookie.slice(0, 80));
} finally {
  await db.delete(adminAccounts).where(eq(adminAccounts.id, id));
  await db.delete(adminRateLimits).where(eq(adminRateLimits.key, `login-email:${(await import("node:crypto")).createHash("sha256").update(email).digest("hex")}`));
  await pool.end();
}
process.exit(failures ? 1 : 0);
