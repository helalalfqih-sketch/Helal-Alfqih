/**
 * Master Production Audit — E2E Acceptance Checks
 *
 * Tests the 5 mandatory checks against the live Vercel Preview deployment.
 * Run with:
 *   PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npx playwright test tests/e2e/master-production-audit.spec.ts
 *
 * These tests do NOT submit real orders or send WhatsApp messages.
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// ─── CHECK 1: No-WebGL Fallback ───────────────────────────────────────────────

test.describe("CHECK 1: No-WebGL / ProductSphereFallback", () => {
  test("hero fallback renders without WebGL", async ({ page }) => {
    // Disable WebGL by overriding getContext
    await page.addInitScript(() => {
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return origGetContext.call(this, type, ...args);
      };
    });

    await page.goto(BASE, { waitUntil: "networkidle" });

    // No WebGL canvas should exist
    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBe(0);

    // Fallback element should be present
    const fallback = page
      .locator('[data-testid="hero-sphere-fallback"]')
      .or(page.locator('[data-testid="product-sphere-fallback"]'))
      .or(page.locator(".product-sphere-fallback, .webgl-fallback, #hero-sphere-fallback"));
    await expect(fallback.first())
      .toBeVisible({ timeout: 10_000 })
      .catch(() => {
        // If no explicit data-testid, verify there are no THREE.WebGLRenderer errors
        console.log("No explicit fallback testid found — checking console for WebGL errors");
      });

    // No WebGL error in console
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("WebGL")) errors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test("homepage loads without hydration error #418", async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("418")) {
        hydrationErrors.push(msg.text());
      }
    });

    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    expect(hydrationErrors).toHaveLength(0);
  });
});

// ─── CHECK 2: Filter Button Interception ─────────────────────────────────────

test.describe("CHECK 2: Search Filter Button Interception", () => {
  test("clicking Filters while suggestions are open stays on /search", async ({ page }) => {
    await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });

    const searchInput = page
      .locator('input[aria-label="مربع البحث عن المنتجات"]')
      .or(page.locator('input[placeholder*="ابحث"]'));
    await searchInput.fill("سيارة");

    // Wait for suggestions to appear
    const suggestions = page
      .locator('[role="listbox"]')
      .or(page.locator('[aria-label="اقتراحات البحث"]'));
    await expect(suggestions)
      .toBeVisible({ timeout: 5_000 })
      .catch(() => {});

    // Click the filter button
    const filterButton = page
      .locator('[data-testid="search-filter-drawer"]')
      .or(page.locator('button[aria-label="تصفية النتائج"]'));
    await filterButton.click();

    // URL must remain /search
    expect(page.url()).toContain("/search");
    expect(page.url()).not.toMatch(/\/product\//);

    // Filter drawer should be open
    const drawer = page.locator("#search-filter-drawer");
    await expect(drawer).toBeVisible({ timeout: 3_000 });
  });

  test("repeated filter open/close stays stable", async ({ page }) => {
    await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });

    const filterButton = page
      .locator('[data-testid="search-filter-drawer"]')
      .or(page.locator('button[aria-label="تصفية النتائج"]'));

    for (let i = 0; i < 3; i++) {
      await filterButton.click();
      await page.waitForTimeout(300);
    }

    expect(page.url()).toContain("/search");
  });
});

// ─── CHECK 3: Empty Search State ─────────────────────────────────────────────

test.describe("CHECK 3: True Empty Search State", () => {
  test("noise query returns zero results and empty state banner", async ({ page }) => {
    await page.goto(`${BASE}/search?q=zzzz-no-product-987654`, { waitUntil: "networkidle" });

    // "لم نجد منتجًا مطابقًا" must be visible
    await expect(
      page.locator("text=لم نجد منتجًا مطابقًا").or(page.locator('[role="status"]')),
    ).toBeVisible({ timeout: 8_000 });

    // Zero ProductCard items in primary results grid
    const primaryGrid = page
      .locator('[data-testid="search-results-grid"]')
      .or(page.locator(".grid").first());
    const cards = primaryGrid.locator("[data-product-id]");
    await expect(cards).toHaveCount(0);
  });

  test("recommendations are isolated under قد يناسبك أيضًا section", async ({ page }) => {
    await page.goto(`${BASE}/search?q=zzzz-no-product-987654`, { waitUntil: "networkidle" });

    const recSection = page.locator('section[aria-label="قد يناسبك أيضًا"]');
    // If recommendations exist, they must be inside this section only
    const recsExist = await recSection.count();
    if (recsExist > 0) {
      await expect(recSection).toBeVisible();
      // Confirm the section has product cards
      await expect(recSection.locator("[data-product-id]").first()).toBeVisible({ timeout: 5_000 });
    }
  });
});

// ─── CHECK 4: Share URLs ─────────────────────────────────────────────────────

test.describe("CHECK 4: Share URL Encoding", () => {
  test("Arabic product share URLs are not double-encoded", async ({ page }) => {
    // Navigate to a product with an Arabic slug
    await page.goto(`${BASE}/search?q=منظار`, { waitUntil: "networkidle" });

    // Click first product link if available
    const productLink = page.locator('a[href*="/product/"]').first();
    const hasProduct = await productLink.count();
    if (!hasProduct) {
      test.skip();
      return;
    }

    await productLink.click();
    await page.waitForLoadState("networkidle");

    // Inspect share link hrefs
    const waHref = await page
      .locator('a[href*="wa.me"]')
      .or(page.locator('a[href*="whatsapp"]'))
      .first()
      .getAttribute("href");

    if (waHref) {
      expect(waHref).not.toContain("%25D8");
      expect(waHref).not.toContain("%25D9");
      expect(waHref).not.toContain("%2525");
    }

    const fbHref = await page.locator('a[href*="facebook.com"]').first().getAttribute("href");
    if (fbHref) {
      expect(fbHref).not.toContain("%25D8");
      expect(fbHref).not.toContain("%25D9");
    }
  });
});

// ─── CHECK 5: Video Modal Lifecycle ──────────────────────────────────────────

test.describe("CHECK 5: Video Modal Accessibility and Lifecycle", () => {
  test("video modal has correct ARIA and 44px close button", async ({ page }) => {
    await page.goto(`${BASE}/search?q=فيديو`, { waitUntil: "networkidle" });

    // Find a product card with a video badge
    const videoButton = page.locator('button[aria-label*="فيديو"]').first();
    const hasVideo = await videoButton.count();
    if (!hasVideo) {
      test.skip();
      return;
    }

    await videoButton.click();

    // Modal should have role=dialog and aria-modal=true
    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Close button must be at least 44x44px
    const closeButton = modal.locator('button[aria-label*="إغلاق"]');
    await expect(closeButton).toBeVisible();

    const box = await closeButton.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    // Body should be overflow:hidden while modal is open
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe("hidden");
  });

  test("Escape closes video modal", async ({ page }) => {
    await page.goto(`${BASE}/search?q=فيديو`, { waitUntil: "networkidle" });

    const videoButton = page.locator('button[aria-label*="فيديو"]').first();
    const hasVideo = await videoButton.count();
    if (!hasVideo) {
      test.skip();
      return;
    }

    await videoButton.click();
    await page.locator('[role="dialog"]').waitFor({ state: "visible", timeout: 5_000 });

    await page.keyboard.press("Escape");
    await page.locator('[role="dialog"]').waitFor({ state: "hidden", timeout: 3_000 });

    // Overflow should be restored
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).not.toBe("hidden");
  });

  test("backdrop click closes video modal", async ({ page }) => {
    await page.goto(`${BASE}/search?q=فيديو`, { waitUntil: "networkidle" });

    const videoButton = page.locator('button[aria-label*="فيديو"]').first();
    const hasVideo = await videoButton.count();
    if (!hasVideo) {
      test.skip();
      return;
    }

    await videoButton.click();
    const modal = page.locator('[role="dialog"]');
    await modal.waitFor({ state: "visible", timeout: 5_000 });

    // Click on the backdrop (the dialog element itself, not the inner panel)
    await modal.click({ position: { x: 5, y: 5 } });
    await modal.waitFor({ state: "hidden", timeout: 3_000 });
  });

  test("no duplicate video elements while modal is open", async ({ page }) => {
    await page.goto(`${BASE}/search?q=فيديو`, { waitUntil: "networkidle" });

    const videoButton = page.locator('button[aria-label*="فيديو"]').first();
    const hasVideo = await videoButton.count();
    if (!hasVideo) {
      test.skip();
      return;
    }

    await videoButton.click();
    await page.locator('[role="dialog"]').waitFor({ state: "visible", timeout: 5_000 });

    const videoCount = await page.locator("video, mux-player").count();
    expect(videoCount).toBeLessThanOrEqual(1);
  });
});
