import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAccounts } from "@/db/schema";
import { adminBody, adminError, AdminError, adminJson, checkOrigin, digest, hashPassword, passwordValue, rateLimit, startAdminSession, verifyPassword } from "@/lib/admin-auth";
import { email, text } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await adminBody(request);
    const ownerEmail = email(text(body.email, "your email address", 200)).toLowerCase();
    const password = passwordValue(body.password);
    const source = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
    await rateLimit(`login-source:${digest(source)}`, 40);
    await rateLimit(`login-email:${digest(ownerEmail)}`, 10);
    const [account] = await db.select().from(adminAccounts).where(eq(adminAccounts.email, ownerEmail)).limit(1);
    if (!account) {
      await hashPassword(password);
      throw new AdminError("The email or password is incorrect.", 401);
    }
    if (!(await verifyPassword(password, account.passwordHash))) throw new AdminError("The email or password is incorrect.", 401);
    await startAdminSession(account.id, request);
    return adminJson({ ok: true });
  } catch (error) { return adminError(error); }
}
