import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { adminBody, adminError, AdminError, adminJson, requireAdmin } from "@/lib/admin-auth";
import { productVersion, refreshCatalogue, serializeProduct, validateProduct } from "@/lib/admin-catalogue";

type Context = { params: Promise<{ id: string }> };

async function productById(context: Context) {
  const { id } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(id)) throw new AdminError("Product not found.", 404);
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) throw new AdminError("This product was removed. Refresh your catalogue.", 404);
  return product;
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdmin(request);
    const body = await adminBody(request);
    const version = productVersion(body.version);
    const current = await productById(context);
    const data = await validateProduct({ ...current, ...body });
    const [product] = await db.update(products).set({ ...data, version: sql`${products.version} + 1`, updatedAt: new Date() }).where(and(eq(products.id, current.id), eq(products.version, version))).returning();
    if (!product) throw new AdminError("This product changed in another tab. Close this form, refresh the catalogue and try again.", 409);
    refreshCatalogue();
    return adminJson({ product: serializeProduct(product) });
  } catch (error) { return adminError(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    await requireAdmin(request);
    const version = productVersion((await adminBody(request)).version);
    const current = await productById(context);
    const [deleted] = await db.delete(products).where(and(eq(products.id, current.id), eq(products.version, version))).returning({ id: products.id });
    if (!deleted) throw new AdminError("This product changed in another tab. Refresh the catalogue before deleting it.", 409);
    refreshCatalogue();
    return adminJson({ ok: true, id: deleted.id });
  } catch (error) { return adminError(error); }
}
