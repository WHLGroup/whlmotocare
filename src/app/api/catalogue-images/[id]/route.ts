import { eq } from "drizzle-orm";
import { db } from "@/db";
import { catalogueImages } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)) return new Response("Image not found", { status: 404 });
  const [image] = await db.select().from(catalogueImages).where(eq(catalogueImages.id, id)).limit(1);
  if (!image) return new Response("Image not found", { status: 404 });
  const headers = {
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `inline; filename="product-${id}.webp"`,
    ETag: `"${id}"`,
  };
  if (request.headers.get("if-none-match") === headers.ETag) return new Response(null, { status: 304, headers });
  return new Response(new Uint8Array(Buffer.from(image.data, "base64")), { headers });
}
