import "dotenv/config";
import { chromium, expect } from "@playwright/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import { orders, bookings } from "../src/db/schema.ts";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const customerName = "__WHL_AUTOMATED_TEST__";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await mkdir("artifacts", { recursive: true });

async function ready(target = page) {
  await target.waitForLoadState("networkidle");
  await target.locator("img").evaluateAll((images) => images.forEach((image) => { image.loading = "eager"; }));
  await target.waitForLoadState("networkidle");
  await target.evaluate(() => document.fonts.ready);
}
async function assertNoOverflow(target = page) {
  const overflow = await target.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
}

try {
  await page.goto(baseURL);
  await ready();
  await expect(page.getByRole("heading", { name: "KEEP YOUR RIDE IN TOP GEAR." })).toBeVisible();
  await assertNoOverflow();
  await page.screenshot({ path: "artifacts/home-desktop.png" });
  for (let y = 600; y < 3600; y += 600) { await page.evaluate((position) => window.scrollTo(0, position), y); await page.waitForTimeout(150); }
  await ready();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: "artifacts/home-full.png", fullPage: true });
  console.log("PASS homepage, photography, layout and desktop rendering");

  await page.locator(".category-card").nth(1).click();
  await expect(page).toHaveURL(/category=brakes/);
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("button", { name: "All spare parts" }).click();
  await expect(page.locator(".product-card")).toHaveCount(6);
  await page.getByRole("textbox", { name: "Search the parts catalogue" }).fill("oil");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("textbox", { name: "Search the parts catalogue" }).fill("does-not-exist");
  await expect(page.getByText("Let’s try another route.")).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await page.getByRole("combobox", { name: "Sort parts" }).selectOption("price-low");
  await expect(page.locator(".product-title").first()).toHaveText("NGK Spark Plug");
  await page.getByRole("combobox", { name: "YOUR MOTORCYCLE MAKE" }).selectOption("Yamaha");
  await expect(page.locator(".product-card")).toHaveCount(5);
  await page.getByRole("combobox", { name: "YOUR MOTORCYCLE MAKE" }).selectOption("all");
  await ready();
  await page.screenshot({ path: "artifacts/shop-desktop.png", fullPage: true });
  console.log("PASS category links, search, empty state, price sorting and make filter");

  await page.getByRole("button", { name: "View NGK Spark Plug", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Increase NGK Spark Plug quantity" }).click();
  await dialog.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Add 4T Motorcycle Engine Oil to bag", exact: true }).click();
  await page.reload();
  await ready();
  await page.getByRole("button", { name: "Shopping bag, 3 items" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Increase NGK Spark Plug quantity" }).click();
  await expect(dialog.getByText("MK 34,500")).toBeVisible();
  await page.screenshot({ path: "artifacts/cart-desktop.png" });
  await dialog.getByRole("button", { name: "Continue to order" }).click();
  await dialog.getByRole("textbox", { name: "Your name" }).fill(customerName);
  await dialog.getByRole("textbox", { name: "Phone number" }).fill("0888000001");
  await dialog.getByRole("textbox", { name: "Bike model or order notes" }).fill("Automated validation. Yamaha YBR 125.");
  await dialog.getByRole("button", { name: "Place order request" }).click();
  await expect(dialog.getByText("Your next ride starts here.")).toBeVisible();
  const orderReference = await dialog.locator(".reference-box strong").innerText();
  expect(orderReference).toMatch(/^WHL-O-/);
  await expect(dialog.getByText("MK 34,500")).toBeVisible();
  await dialog.getByRole("button", { name: "Back to the road" }).click();
  await expect(page.getByRole("button", { name: "Shopping bag, 0 items" })).toBeVisible();
  console.log(`PASS cart persistence, quantity edits and checkout: ${orderReference}`);

  await page.getByRole("button", { name: "Track an order or booking" }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("textbox", { name: "Order or booking reference" })).toHaveValue(orderReference);
  await dialog.getByRole("textbox", { name: "Phone number" }).fill("0888000001");
  await dialog.getByRole("button", { name: "Find my request" }).click();
  await expect(dialog.getByText("ORDER FOUND", { exact: true })).toBeVisible();
  await expect(dialog.getByText("MK 34,500")).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  const denied = await page.request.post(`${baseURL}/api/track`, { data: { reference: orderReference, phone: "0888000002" } });
  expect(denied.status()).toBe(404);
  console.log("PASS persisted order tracking and phone-number privacy check");

  await page.goto(baseURL);
  await ready();
  await page.locator(".hero").getByRole("button", { name: "Book a Repair" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Your name" }).fill(customerName);
  await dialog.getByRole("textbox", { name: "Phone number" }).fill("0993000001");
  await dialog.getByRole("combobox", { name: "Motorcycle make" }).selectOption("Yamaha");
  await dialog.getByRole("textbox", { name: "Model" }).fill("YBR 125");
  await dialog.getByRole("combobox", { name: "What does your bike need?" }).selectOption("General service & tune-up");
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Blantyre", year: "numeric", month: "2-digit", day: "2-digit" }).format(tomorrow);
  await dialog.getByLabel("Preferred date").fill(day);
  await dialog.getByRole("combobox", { name: "Preferred time" }).selectOption("Morning");
  await page.screenshot({ path: "artifacts/booking-desktop.png" });
  await dialog.getByRole("button", { name: "Request my repair booking" }).click();
  await expect(dialog.getByText("Your bike is in good hands.")).toBeVisible();
  const bookingReference = await dialog.locator(".reference-box strong").innerText();
  expect(bookingReference).toMatch(/^WHL-R-/);
  const tracking = await page.request.post(`${baseURL}/api/track`, { data: { reference: bookingReference, phone: "0993000001" } });
  const bookingResult = await tracking.json();
  expect(bookingResult.preferredDate).toBe(day);
  expect(bookingResult.status).toBe("requested");
  await dialog.getByRole("button", { name: "Back to the road" }).click();
  console.log(`PASS repair booking and database tracking: ${bookingReference}`);

  const invalidOrder = await page.request.post(`${baseURL}/api/orders`, { data: { customerName, phone: "0888000001", fulfillment: "pickup", items: [{ productId: "ngk-spark-plug", quantity: -1 }] } });
  expect(invalidOrder.status()).toBe(400);
  const priceTest = await page.request.post(`${baseURL}/api/orders`, { data: { customerName, phone: "0888000001", fulfillment: "pickup", total: 1, items: [{ productId: "ngk-spark-plug", quantity: 2, price: 1 }] } });
  expect(priceTest.status()).toBe(201);
  expect((await priceTest.json()).total).toBe(13000);
  const invalidBooking = await page.request.post(`${baseURL}/api/bookings`, { data: { customerName, phone: "0993000001", brand: "Yamaha", service: "General service & tune-up", preferredDate: "2000-01-01", preferredTime: "Morning" } });
  expect(invalidBooking.status()).toBe(400);
  console.log("PASS server validation, past-date rejection and server-owned product pricing");

  await page.getByRole("button", { name: "Search spare parts", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Search spare parts" }).fill("chain");
  await expect(dialog.locator(".search-result")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  console.log("PASS global search and keyboard dismissal");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(baseURL);
  await ready(mobile);
  await assertNoOverflow(mobile);
  await mobile.screenshot({ path: "artifacts/home-mobile.png", fullPage: true });
  await mobile.getByRole("button", { name: "Open navigation" }).click();
  await mobile.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Shop Spare Parts" }).click();
  await expect(mobile).toHaveURL(/\/shop/);
  await ready(mobile);
  await assertNoOverflow(mobile);
  await mobile.screenshot({ path: "artifacts/shop-mobile.png", fullPage: true });
  await mobile.getByRole("button", { name: "Add NGK Spark Plug to bag", exact: true }).click();
  await mobile.getByRole("button", { name: "Shopping bag, 1 items" }).click();
  await expect(mobile.getByRole("dialog").getByText("NGK Spark Plug", { exact: true })).toBeVisible();
  await mobile.getByRole("button", { name: "Remove NGK Spark Plug" }).click();
  await expect(mobile.getByText("Your next ride is waiting.", { exact: true })).toBeVisible();
  await assertNoOverflow(mobile);
  await mobile.close();
  console.log("PASS mobile navigation, catalogue, bag removal and zero horizontal overflow");
  expect(errors).toEqual([]);
  console.log("PASS no browser JavaScript errors");
  console.log("ALL WHL MOTOCARE END-TO-END CHECKS PASSED");
} finally {
  await db.delete(orders).where(eq(orders.customerName, customerName));
  await db.delete(bookings).where(eq(bookings.customerName, customerName));
  await pool.end();
  await browser.close();
  console.log("Automated test orders and bookings cleaned up.");
}
