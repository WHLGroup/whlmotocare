import { adminError, adminJson, checkOrigin, endAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await endAdminSession(request);
    return adminJson({ ok: true });
  } catch (error) { return adminError(error); }
}
