import { expect, test } from "@playwright/test";

test("webgl_fallbackGrid_rendersWhenWebGLUnavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "WebGLRenderingContext", { value: undefined });
  });
  await page.goto("/");
  await expect(page.getByTestId("webgl-fallback-grid")).toBeVisible();
});

test("hydration_noError418OnHomePage", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors.filter((message) => /Minified React error #418|hydration/i.test(message))).toEqual([]);
});

test("search_filterButton_neverTriggersNavigation", async ({ page }) => {
  await page.goto("/search?q=ساعة");
  const pathname = new URL(page.url()).pathname;
  await page.getByRole("button", { name: "تصفية النتائج" }).click();
  await expect(page.getByText("فلاتر البحث المتقدم")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(pathname);
});

test("search_emptyQuery_showsEmptyStateAndSeparateRecommendations", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByText("ابدأ بكتابة اسم المنتج الذي تبحث عنه")).toBeVisible();
  await expect(page.getByRole("heading", { name: "منتجات مقترحة" })).toBeVisible();
});
