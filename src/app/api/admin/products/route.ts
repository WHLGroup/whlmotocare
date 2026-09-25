import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { products } from "@/db/schema";
import { adminBody, adminError, adminJson, requireAdmin } from "@/lib/admin-auth";
import { getAdminProducts, refreshCatalogue, serializeProduct, validateProduct } from "@/lib/admin-catalogue";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    return adminJson({ products: await getAdminProducts() });
  } catch (error) { return adminError(error); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const data = await validateProduct(await adminBody(request));
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65) || "part";
    const [product] = await db.insert(products).values({ ...data, id: `${slug}-${randomBytes(4).toString("hex")}` }).returning();
    refreshCatalogue();
    return adminJson({ product: serializeProduct(product) }, 201);
  } catch (error) { return adminError(error); }
}
