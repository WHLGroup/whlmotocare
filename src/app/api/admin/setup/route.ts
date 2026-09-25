import { db, hasDatabaseConfig } from "@/db";
import { adminAccounts } from "@/db/schema";
import { adminBody, adminError, AdminError, adminJson, checkOrigin, hashPassword, hasAdmin, passwordValue, rateLimit, startAdminSession, validateSetupKey } from "@/lib/admin-auth";
import { email, text } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!hasDatabaseConfig()) throw new AdminError("Database is not configured. Connect PostgreSQL to continue.", 503);
    if (await hasAdmin()) throw new AdminError("Owner setup is complete. Please sign in with your admin account.", 409);
    await rateLimit("owner-setup", 10);
    const body = await adminBody(request);
    validateSetupKey(body.setupKey);
    const name = text(body.name, "your name", 80);
    const ownerEmail = email(text(body.email, "your email address", 200)).toLowerCase();
    const password = passwordValue(body.password, true);
    if (body.confirmPassword !== password) throw new AdminError("Your passwords don’t match.");
    const passwordHash = await hashPassword(password);
    const [created] = await db.insert(adminAccounts).values({ id: "owner", name, email: ownerEmail, passwordHash }).onConflictDoNothing().returning({ id: adminAccounts.id });
    if (!created) throw new AdminError("Owner setup is already complete. Please sign in.", 409);
    await startAdminSession(created.id, request);
    return adminJson({ ok: true }, 201);
  } catch (error) { return adminError(error); }
}
