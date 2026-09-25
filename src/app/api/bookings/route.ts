import { randomBytes } from "node:crypto";
import { db, hasDatabaseConfig } from "@/db";
import { bookings } from "@/db/schema";
import { brands, services } from "@/lib/catalog";
import { apiError, choice, date, email, phone, readBody, text } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (!hasDatabaseConfig()) return Response.json({ error: "The database is not configured yet. Set DATABASE_URL before submitting requests." }, { status: 503 });
    const body = await readBody(request);
    const customerName = text(body.customerName, "your name", 100);
    const customerPhone = phone(body.phone);
    const customerEmail = email(body.email);
    const brand = choice(body.brand, [...brands, "Other"], "your motorcycle make");
    const model = text(body.model, "motorcycle model", 100, false);
    const service = choice(body.service, services, "a repair service");
    const preferredDate = date(body.preferredDate);
    const preferredTime = choice(body.preferredTime, ["Morning", "Afternoon", "Any time"], "a preferred time");
    const notes = text(body.notes, "repair notes", 1500, false);
    const reference = `WHL-R-${randomBytes(4).toString("hex").toUpperCase()}`;
    await db.insert(bookings).values({ reference, customerName, phone: customerPhone, email: customerEmail || null, brand, model: model || null, service, preferredDate, preferredTime, notes: notes || null });
    return Response.json({ reference, preferredDate, preferredTime, service, message: "Repair request received. Our team will call to confirm your appointment and discuss the work." }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
