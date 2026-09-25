import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { initialProducts } from "@/lib/catalog";

export async function getProducts() {
  const catalogue = await db.select().from(products).where(eq(products.active, true));
  const position = new Map(initialProducts.map((product, index) => [product.id, index]));
  return catalogue.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || (position.get(a.id) ?? 999) - (position.get(b.id) ?? 999) || a.name.localeCompare(b.name));
}
