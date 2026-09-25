import sharp from "sharp";
import { db } from "@/db";
import { catalogueImages } from "@/db/schema";
import { adminError, AdminError, adminJson, rateLimit, readLimitedBytes, requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
// Image decoding and re-encoding needs more headroom than a default invocation.
export const maxDuration = 30;
const maxFileSize = 3 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    await rateLimit(`image-upload:${admin.id}`, 60);
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data;")) throw new AdminError("Choose a JPG, PNG or WebP photo.");
    const bytes = await readLimitedBytes(request, maxFileSize + 64 * 1024);
    let form: FormData;
    try {
      form = await new Request(request.url, { method: "POST", headers: { "Content-Type": contentType }, body: new Blob([new Uint8Array(bytes)]) }).formData();
    } catch { throw new AdminError("Couldn’t read that upload. Please choose your photo again."); }
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new AdminError("Choose a JPG, PNG or WebP photo. SVG files are not accepted.");
    if (file.size > maxFileSize) throw new AdminError("Your photo must be 3 MB or smaller.", 413);
    let optimized: Buffer;
    try {
      const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 25_000_000, failOn: "warning" });
      const metadata = await image.metadata();
      if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error("Unsupported image");
      optimized = await image.rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    } catch { throw new AdminError("That photo could not be processed. Choose a non-animated JPG, PNG or WebP under 25 megapixels."); }
    if (optimized.byteLength > 2 * 1024 * 1024) throw new AdminError("That photo is too detailed. Try a smaller photo.", 413);
    const [image] = await db.insert(catalogueImages).values({ contentType: "image/webp", data: optimized.toString("base64"), fileName: file.name.slice(0, 200) }).returning({ id: catalogueImages.id });
    return adminJson({ image: `/api/catalogue-images/${image.id}` }, 201);
  } catch (error) { return adminError(error); }
}
