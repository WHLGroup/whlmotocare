import { chromium, expect } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];

async function context() {
  const result = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  result.on("page", (page) => page.on("pageerror", (error) => errors.push(error.message)));
  return result;
}

try {
  const sharedContext = await context();
  const page = await sharedContext.newPage();
  await page.goto(`${baseURL}/shop`);
  await page.waitForLoadState("networkidle");
  await page.locator(".category-filters").getByRole("button", { name: /^Chains & Sprockets/ }).click();
  await page.getByRole("combobox", { name: "YOUR MOTORCYCLE MAKE" }).selectOption("Yamaha");
  await page.getByRole("combobox", { name: "Sort parts" }).selectOption("price-high");
  await page.getByRole("textbox", { name: "Search the parts catalogue" }).fill("chain");
  const filteredURL = page.url();
  expect(new URL(filteredURL).searchParams.get("q")).toBe("chain");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Search the parts catalogue" })).toHaveValue("chain");
  await expect(page.getByRole("combobox", { name: "YOUR MOTORCYCLE MAKE" })).toHaveValue("Yamaha");
  await expect(page.getByRole("combobox", { name: "Sort parts" })).toHaveValue("price-high");
  await expect(page.locator(".category-filters button.active")).toContainText("Chains & Sprockets");
  await expect(page.locator(".product-card")).toHaveCount(1);
  const linkedPage = await sharedContext.newPage();
  await linkedPage.goto(filteredURL);
  await expect(linkedPage.locator(".product-title")).toHaveText("Chain & Sprocket Kit");
  await expect(linkedPage.getByRole("combobox", { name: "YOUR MOTORCYCLE MAKE" })).toHaveValue("Yamaha");
  await linkedPage.close();
  console.log("PASS category, make, search and sort survive reloads and shared links");

  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/shop`);
  await expect(page.locator(".product-card")).toHaveCount(6);
  await page.locator(".category-filters").getByRole("button", { name: /^Engine Parts/ }).click();
  await page.locator(".category-filters").getByRole("button", { name: /^Brakes & Clutch/ }).click();
  await page.goBack();
  await expect(page.locator(".product-title")).toHaveText("Piston & Ring Kit");
  await page.goForward();
  await expect(page.locator(".product-title")).toHaveText("Heavy-Duty Brake Shoes");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  console.log("PASS browser Back/Forward navigation and atomic filter reset");

  await page.getByRole("button", { name: "Add NGK Spark Plug to bag", exact: true }).click();
  await expect(page.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
  const otherTab = await sharedContext.newPage();
  await otherTab.goto(baseURL);
  await expect(otherTab.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
  await otherTab.getByRole("button", { name: "Add 4T Motorcycle Engine Oil to bag", exact: true }).click();
  await expect(page.getByRole("button", { name: "Shopping bag, 2 items" })).toBeVisible();
  await page.getByRole("button", { name: "Shopping bag, 2 items" }).click();
  await page.getByRole("button", { name: "Increase NGK Spark Plug quantity" }).click();
  await expect(otherTab.getByRole("button", { name: "Shopping bag, 3 items" })).toBeVisible();
  await page.getByRole("button", { name: "Remove NGK Spark Plug" }).click();
  await expect(otherTab.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
  await otherTab.getByRole("button", { name: "Shopping bag, 1 items" }).click();
  await otherTab.getByRole("button", { name: "Remove 4T Motorcycle Engine Oil" }).click();
  await expect(page.getByRole("button", { name: "Shopping bag, 0 items" })).toBeVisible();
  await otherTab.close();
  console.log("PASS cross-tab additions, quantity changes, removals and reload persistence");

  const blockedContext = await context();
  await blockedContext.addInitScript(() => {
    const read = Storage.prototype.getItem;
    const write = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "whl-parts-bag") throw new DOMException("Storage disabled for test", "SecurityError");
      return read.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "whl-parts-bag") throw new DOMException("Storage disabled for test", "SecurityError");
      return write.call(this, key, value);
    };
  });
  const blocked = await blockedContext.newPage();
  await blocked.goto(baseURL);
  await blocked.getByRole("button", { name: "Add NGK Spark Plug to bag", exact: true }).click();
  await expect(blocked.getByRole("button", { name: "Shopping bag, 1 items" })).toBeVisible();
  await blocked.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Shop Spare Parts" }).click();
  await expect(blocked).toHaveURL(`${baseURL}/shop`);
  await blocked.getByRole("button", { name: "Shopping bag, 1 items" }).click();
  await expect(blocked.getByRole("dialog").getByText("NGK Spark Plug", { exact: true })).toBeVisible();
  await blockedContext.close();
  console.log("PASS cart remains usable during navigation when browser storage is blocked");

  const malformedContext = await context();
  const malformed = await malformedContext.newPage();
  await malformed.goto(baseURL);
  await malformed.evaluate(() => localStorage.setItem("whl-parts-bag", "{invalid-json"));
  await malformed.reload();
  await expect(malformed.getByRole("button", { name: "Shopping bag, 0 items" })).toBeVisible();
  await malformed.evaluate(() => localStorage.setItem("whl-parts-bag", JSON.stringify([
    null,
    { productId: "ngk-spark-plug", quantity: 2 },
    { productId: "ngk-spark-plug", quantity: 8 },
    { productId: "4t-engine-oil", quantity: -3 },
    { productId: "chain-sprocket-kit", quantity: 21 },
    { productId: "", quantity: 1 },
  ])));
  await malformed.reload();
  await expect(malformed.getByRole("button", { name: "Shopping bag, 2 items" })).toBeVisible();
  await malformedContext.close();
  console.log("PASS malformed storage, duplicate items and invalid quantities are handled safely");

  expect(errors).toEqual([]);
  console.log("ALL REFRESH REGRESSION CHECKS PASSED; no browser JavaScript errors");
} finally {
  await browser.close();
}
