import "server-only";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { catalogueImages, products } from "@/db/schema";
import { brands, categories } from "@/lib/catalog";
import { choice, text, ValidationError } from "@/lib/validation";
import { AdminError } from "@/lib/admin-auth";

export function serializeProduct(product: typeof products.$inferSelect) {
  return { ...product, createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() };
}

export async function getAdminProducts() {
  const rows = await db.select().from(products).orderBy(desc(products.updatedAt), products.name);
  return rows.map(serializeProduct);
}

export async function validateProduct(body: Record<string, unknown>) {
  const name = text(body.name, "a product name", 120);
  if (name.length < 2) throw new ValidationError("A product name needs at least 2 characters.");
  const category = choice(body.category, categories.map((item) => item.id), "a category");
  const description = text(body.description, "a product description", 3000);
  if (typeof body.price !== "number" || !Number.isInteger(body.price) || body.price < 1 || body.price > 10_000_000) throw new ValidationError("Enter a whole-kwacha price between MK 1 and MK 10,000,000.");
  const allowedMakes = [...brands, "Other"];
  if (!Array.isArray(body.compatibility) || !body.compatibility.length || body.compatibility.length > allowedMakes.length || body.compatibility.some((make) => typeof make !== "string" || !allowedMakes.includes(make))) throw new ValidationError("Select at least one motorcycle make, or choose Other.");
  if (typeof body.active !== "boolean" || typeof body.featured !== "boolean") throw new ValidationError("Choose valid publishing and featured settings.");
  const image = text(body.image, "a product photo", 200);
  if (!categories.some((item) => item.image === image)) {
    const match = /^\/api\/catalogue-images\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.exec(image);
    if (!match) throw new ValidationError("Upload a product photo or use a category illustration.");
    const [stored] = await db.select({ id: catalogueImages.id }).from(catalogueImages).where(eq(catalogueImages.id, match[1])).limit(1);
    if (!stored) throw new ValidationError("That photo could not be found. Please upload it again.");
  }
  return { name, category, description, price: body.price, image, compatibility: [...new Set(body.compatibility as string[])], active: body.active, featured: body.featured };
}

export function productVersion(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) throw new AdminError("Reload this product before saving your changes.", 409);
  return value;
}

export function refreshCatalogue() {
  revalidatePath("/", "page");
  revalidatePath("/shop", "page");
  revalidatePath("/admin", "page");
}
