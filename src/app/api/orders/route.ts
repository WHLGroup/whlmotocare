import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, hasDatabaseConfig } from "@/db";
import { orders, products, type OrderItem } from "@/db/schema";
import { apiError, choice, email, phone, readBody, text, ValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (!hasDatabaseConfig()) return Response.json({ error: "The database is not configured yet. Set DATABASE_URL before submitting requests." }, { status: 503 });
    const body = await readBody(request);
    const customerName = text(body.customerName, "your name", 100);
    const customerPhone = phone(body.phone);
    const customerEmail = email(body.email);
    const fulfillment = choice(body.fulfillment, ["pickup", "delivery"], "a collection method");
    const address = text(body.address, "your delivery address", 500, fulfillment === "delivery");
    const notes = text(body.notes, "order notes", 1500, false);
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 30) {
      throw new ValidationError("Please add at least one part to your order.");
    }
    const quantities = new Map<string, number>();
    for (const rawItem of body.items) {
      if (!rawItem || typeof rawItem !== "object") throw new ValidationError("One of your order items is invalid.");
      const item = rawItem as Record<string, unknown>;
      const id = text(item.productId, "a valid part", 100);
      if (typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        throw new ValidationError("Part quantities must be between 1 and 20.");
      }
      const quantity = (quantities.get(id) ?? 0) + item.quantity;
      if (quantity > 20) throw new ValidationError("You can order up to 20 of each part online. Call us for bulk supply.");
      quantities.set(id, quantity);
    }
    const selected = await db.select().from(products).where(and(inArray(products.id, [...quantities.keys()]), eq(products.active, true)));
    if (selected.length !== quantities.size) throw new ValidationError("A part in your cart is no longer available. Please refresh your cart.");
    const items: OrderItem[] = selected.map((product) => ({ productId: product.id, name: product.name, price: product.price, quantity: quantities.get(product.id)! }));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (!Number.isSafeInteger(total) || total > 2_147_483_647) throw new ValidationError("This order is above our online order limit. Please call us to arrange bulk supply.");
    const reference = `WHL-O-${randomBytes(4).toString("hex").toUpperCase()}`;
    await db.insert(orders).values({ reference, customerName, phone: customerPhone, email: customerEmail || null, fulfillment, address: address || null, notes: notes || null, items, total });
    return Response.json({ reference, total, message: "Order received. Our team will call to confirm fit, availability and the final price." }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
