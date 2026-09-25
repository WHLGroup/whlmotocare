import "server-only";

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lte, sql } from "drizzle-orm";
import { db, hasDatabaseConfig } from "@/db";
import { adminAccounts, adminRateLimits, adminSessions } from "@/db/schema";
import { ValidationError } from "@/lib/validation";

const sessionCookie = "whl-admin-session";
const sessionSeconds = 12 * 60 * 60;
export type AdminIdentity = { id: string; name: string; email: string };

export class AdminError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export function adminJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export function adminError(error: unknown) {
  if (error instanceof AdminError) {
    const response = adminJson({ error: error.message }, error.status);
    if (error.status === 429) response.headers.set("Retry-After", "900");
    return response;
  }
  if (error instanceof ValidationError) return adminJson({ error: error.message }, 400);
  console.error("Admin operation failed:", error);
  return adminJson({ error: "We couldn’t complete that change. Please try again." }, 500);
}

/**
 * Hosts this request may legitimately have been sent to. Behind a proxy such as
 * Vercel the forwarded host is the public domain the browser actually used.
 */
function requestHosts(request: Request): string[] {
  const forwarded = (request.headers.get("x-forwarded-host") ?? "").split(",")[0].trim();
  const direct = request.headers.get("host") ?? "";
  let fromUrl = "";
  try { fromUrl = new URL(request.url).host; } catch { /* Relative URLs have no host. */ }
  return [forwarded, direct, fromUrl].filter(Boolean);
}

/** True when the browser reached us over HTTPS, including via a TLS-terminating proxy. */
export function isSecureRequest(request: Request): boolean {
  const proto = (request.headers.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  if (proto) return proto === "https";
  const origin = request.headers.get("origin");
  if (origin?.startsWith("https:")) return true;
  try { return new URL(request.url).protocol === "https:"; } catch { return false; }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (!origin || (site && site !== "same-origin" && site !== "none")) throw new AdminError("This request must come from your admin page.", 403);
  let source: URL;
  try { source = new URL(origin); } catch { throw new AdminError("Invalid request origin.", 403); }
  if (!["http:", "https:"].includes(source.protocol) || !requestHosts(request).includes(source.host)) {
    throw new AdminError("This request must come from your admin page.", 403);
  }
}

export async function readLimitedBytes(request: Request, maximum: number) {
  if (Number(request.headers.get("content-length")) > maximum) throw new AdminError("This upload is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new AdminError("Please send a valid request.");
  const chunks: Buffer[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) { await reader.cancel(); throw new AdminError("This request is too large.", 413); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export async function adminBody(request: Request): Promise<Record<string, unknown>> {
  const bytes = await readLimitedBytes(request, 24_000);
  try {
    const value: unknown = JSON.parse(bytes.toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new AdminError("Please send valid form details."); }
}

export function passwordValue(value: unknown, creating = false): string {
  if (typeof value !== "string" || value.length > 128 || value.length < (creating ? 12 : 1)) throw new AdminError(creating ? "Choose a password between 12 and 128 characters." : "Enter your password.");
  if (creating && value.trim().length < 12) throw new AdminError("Your password needs at least 12 non-padding characters.");
  return value;
}

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(24).toString("hex");
  return `scrypt$${salt}$${(await derivePassword(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !/^[a-f0-9]{48}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(hash ?? "")) return false;
  return timingSafeEqual(await derivePassword(password, salt), Buffer.from(hash, "hex"));
}

export async function hasAdmin() {
  if (!hasDatabaseConfig()) return false;
  const [account] = await db.select({ id: adminAccounts.id }).from(adminAccounts).where(eq(adminAccounts.id, "owner")).limit(1);
  return Boolean(account);
}

export async function getAdmin(): Promise<AdminIdentity | null> {
  if (!hasDatabaseConfig()) return null;
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const [account] = await db.select({ id: adminAccounts.id, name: adminAccounts.name, email: adminAccounts.email }).from(adminSessions).innerJoin(adminAccounts, eq(adminSessions.adminId, adminAccounts.id)).where(and(eq(adminSessions.tokenHash, digest(token)), gt(adminSessions.expiresAt, new Date()))).limit(1);
  return account ?? null;
}

export async function requireAdmin(request?: Request) {
  const admin = await getAdmin();
  if (!admin) throw new AdminError("Your admin session has expired. Sign in again to continue.", 401);
  if (request) checkOrigin(request);
  return admin;
}

function cookieOptions(request: Request) {
  // Secure everywhere except plain-HTTP local development, where the browser
  // would otherwise refuse to store the session cookie.
  let local = false;
  try {
    local = ["127.0.0.1", "localhost", "[::1]"].includes(new URL(request.headers.get("origin") ?? request.url).hostname);
  } catch { /* Fall back to the secure default. */ }
  return { httpOnly: true, sameSite: "strict" as const, secure: isSecureRequest(request) || !local, path: "/" };
}

export async function startAdminSession(adminId: string, request: Request) {
  const jar = await cookies();
  const previous = jar.get(sessionCookie)?.value;
  if (previous) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, digest(previous)));
  await db.delete(adminSessions).where(lte(adminSessions.expiresAt, new Date()));
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionSeconds * 1000);
  await db.insert(adminSessions).values({ tokenHash: digest(token), adminId, expiresAt });
  jar.set(sessionCookie, token, { ...cookieOptions(request), maxAge: sessionSeconds, expires: expiresAt });
}

export async function endAdminSession(request: Request) {
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value;
  if (token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, digest(token)));
  jar.set(sessionCookie, "", { ...cookieOptions(request), maxAge: 0, expires: new Date(0) });
}

export async function rateLimit(key: string, maximum = 10) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + 15 * 60 * 1000);
  const [bucket] = await db.insert(adminRateLimits).values({ key, attempts: 1, resetAt }).onConflictDoUpdate({ target: adminRateLimits.key, set: {
    attempts: sql`case when ${adminRateLimits.resetAt} <= ${now} then 1 else ${adminRateLimits.attempts} + 1 end`,
    resetAt: sql`case when ${adminRateLimits.resetAt} <= ${now} then ${resetAt} else ${adminRateLimits.resetAt} end`,
  } }).returning();
  if (bucket.attempts > maximum) throw new AdminError("Too many attempts. Please wait 15 minutes and try again.", 429);
}

export function validateSetupKey(value: unknown) {
  const expected = process.env.ADMIN_SETUP_KEY;
  if (!expected || expected.length < 24) throw new AdminError("Owner setup is not configured. Set a private ADMIN_SETUP_KEY on the server first.", 503);
  if (typeof value !== "string" || value.length > 256 || !timingSafeEqual(Buffer.from(digest(value.trim()), "hex"), Buffer.from(digest(expected), "hex"))) throw new AdminError("That owner setup key is not valid. Use your private setup link.", 403);
}
