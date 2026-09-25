import { chromium, devices, expect } from "@playwright/test";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];
const themeOf = (p) => p.evaluate(() => document.documentElement.dataset.theme);
const metaColor = (p) => p.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute("content"));

try {
  // Desktop: toggle, persist, and survive navigation.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: "light" });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  expect(await themeOf(page)).toBe("light");
  await page.getByRole("switch", { name: "Switch to dark mode" }).click();
  expect(await themeOf(page)).toBe("dark");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
  expect(await metaColor(page)).toBe("#151714");
  await page.reload();
  expect(await themeOf(page)).toBe("dark");
  await page.getByRole("link", { name: "Shop Spare Parts" }).first().click();
  await expect(page).toHaveURL(/\/shop/);
  expect(await themeOf(page)).toBe("dark");
  console.log("PASS desktop toggle, colour-scheme, theme-color meta, persistence across reload and navigation");

  // No flash: the theme must already be applied on the very first paint.
  const early = await ctx.newPage();
  await early.goto(base, { waitUntil: "commit" });
  expect(await early.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await early.close();
  console.log("PASS theme applied before first paint (no light flash)");

  // Cross-tab sync.
  const second = await ctx.newPage();
  await second.goto(base);
  expect(await themeOf(second)).toBe("dark");
  await second.getByRole("switch", { name: "Switch to light mode" }).click();
  await expect.poll(() => themeOf(page)).toBe("light");
  await second.close();
  console.log("PASS switching in one tab updates the other");

  // Dark mode inside dialogs.
  await page.getByRole("switch", { name: "Switch to dark mode" }).click();
  await page.getByRole("button", { name: /Shopping bag/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const dialogBg = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dialogBg).toBe("rgb(28, 31, 26)");
  await page.screenshot({ path: "artifacts/dialog-dark.png" });
  await page.keyboard.press("Escape");
  console.log("PASS dialogs and drawers follow the dark theme");

  // Respecting the operating system when the visitor has made no choice.
  const fresh = await browser.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: "dark" });
  const freshPage = await fresh.newPage();
  await freshPage.goto(base);
  expect(await themeOf(freshPage)).toBe("dark");
  await fresh.close();
  const freshLight = await browser.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: "light" });
  const lightPage = await freshLight.newPage();
  await lightPage.goto(base);
  expect(await themeOf(lightPage)).toBe("light");
  await freshLight.close();
  console.log("PASS first visit follows the device's light/dark setting");

  // Android and iOS: the labelled switch lives in the menu.
  for (const [name, device] of [["Android", devices["Pixel 7"]], ["iPhone", devices["iPhone 14"]], ["iPad", devices["iPad (gen 7)"]]]) {
    const mctx = await browser.newContext({ ...device, colorScheme: "light" });
    const m = await mctx.newPage();
    m.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
    await m.goto(base);
    const inMenu = await m.getByRole("button", { name: "Open navigation" }).count();
    if (inMenu) {
      await m.getByRole("button", { name: "Open navigation" }).click();
      const row = m.getByRole("switch", { name: /mode/i }).last();
      await expect(row).toBeVisible();
      await row.click();
      expect(await themeOf(m)).toBe("dark");
      await expect(m.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    } else {
      await m.getByRole("switch", { name: /Switch to/ }).click();
      expect(await themeOf(m)).toBe("dark");
    }
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
    await m.screenshot({ path: `artifacts/${name.toLowerCase()}-toggle.png` });
    console.log(`PASS ${name}: switch reachable, applies dark mode, menu stays open, no overflow`);
    await mctx.close();
  }

  // Storage blocked: the switch must still work for the visit.
  const blocked = await browser.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: "light" });
  await blocked.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === "whl-theme") throw new DOMException("blocked", "SecurityError");
      return set.call(this, k, v);
    };
  });
  const bp = await blocked.newPage();
  bp.on("pageerror", (e) => errors.push(`blocked: ${e.message}`));
  await bp.goto(base);
  await bp.getByRole("switch", { name: "Switch to dark mode" }).click();
  expect(await themeOf(bp)).toBe("dark");
  await blocked.close();
  console.log("PASS switch still works when browser storage is blocked");

  expect(errors).toEqual([]);
  console.log("PASS no browser JavaScript errors");
  console.log("ALL DARK MODE CHECKS PASSED");
} finally {
  await browser.close();
}
