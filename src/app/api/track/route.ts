import { and, eq } from "drizzle-orm";
import { db, hasDatabaseConfig } from "@/db";
import { bookings, orders } from "@/db/schema";
import { apiError, phone, readBody, text } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (!hasDatabaseConfig()) return Response.json({ error: "The database is not configured yet. Set DATABASE_URL before tracking requests." }, { status: 503 });
    const body = await readBody(request);
    const reference = text(body.reference, "your reference number", 40).toUpperCase();
    const customerPhone = phone(body.phone);
    if (reference.startsWith("WHL-R-")) {
      const [booking] = await db.select({ reference: bookings.reference, status: bookings.status, service: bookings.service, preferredDate: bookings.preferredDate, preferredTime: bookings.preferredTime, createdAt: bookings.createdAt }).from(bookings).where(and(eq(bookings.reference, reference), eq(bookings.phone, customerPhone))).limit(1);
      if (booking) return Response.json({ type: "repair", ...booking }, { headers: { "Cache-Control": "no-store" } });
    } else {
      const [order] = await db.select({ reference: orders.reference, status: orders.status, items: orders.items, total: orders.total, fulfillment: orders.fulfillment, createdAt: orders.createdAt }).from(orders).where(and(eq(orders.reference, reference), eq(orders.phone, customerPhone))).limit(1);
      if (order) return Response.json({ type: "order", ...order }, { headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ error: "We couldn’t find that request. Check your reference and use the phone number you ordered or booked with." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
