import { describe, expect, it } from "vitest";
import { yemeniPhoneSchema, normalizeArabicDigits } from "../../src/lib/validation/phone";
import { rankSearchResults } from "../../src/lib/search-engine";
import type { LegacyProductShape } from "../../src/lib/data-adapter";

// ─── Fixture ────────────────────────────────────────────────────────────────

const watchProduct = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "ساعة ذكية سامسونج",
  description: "شاشة AMOLED مع متابعة اللياقة البدنية",
  categoryId: "electronics",
  category_name: "إلكترونيات",
  image: "https://example.com/watch.webp",
  slug: "smart-watch-samsung",
  price: 25_000,
  stock: 10,
  rating: 5,
  reviews: 2,
} as LegacyProductShape;

const carProduct = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "مصباح LED للسيارة",
  description: "إضاءة أمامية عالية الكفاءة",
  categoryId: "car-accessories",
  category_name: "إكسسوارات السيارة",
  image: "https://example.com/car-led.webp",
  slug: "car-led-light",
  price: 8_500,
  stock: 10,
  rating: 4,
  reviews: 12,
} as LegacyProductShape;

const allProducts = [watchProduct, carProduct];

// ─── Phone Validation ────────────────────────────────────────────────────────

describe("checkout phone validation", () => {
  it.each(["771234567", "+967771234567", "967771234567"])(
    "accepts and normalizes %s to 967771234567",
    (input) => {
      expect(yemeniPhoneSchema.parse(input)).toBe("967771234567");
    },
  );

  it("accepts Arabic-Indic digits ٧٧١٢٣٤٥٦٧", () => {
    expect(yemeniPhoneSchema.parse("٧٧١٢٣٤٥٦٧")).toBe("967771234567");
  });

  it("accepts Persian digits ۷۷۱۲۳۴۵۶۷", () => {
    expect(yemeniPhoneSchema.parse("۷۷۱۲۳۴۵۶۷")).toBe("967771234567");
  });

  it.each(["", "123456789", "967123456789", "77123"])("rejects invalid: %s", (input) =>
    expect(yemeniPhoneSchema.safeParse(input).success).toBe(false),
  );

  it("normalizeArabicDigits handles both Arabic and Persian blocks", () => {
    expect(normalizeArabicDigits("١٢٣ ۴۵۶")).toBe("123 456");
  });
});

// ─── Search Relevance ────────────────────────────────────────────────────────

describe("search relevance floor (rankSearchResults)", () => {
  it("returns exact name match for ساعة", () => {
    const results = rankSearchResults(allProducts, "ساعة");
    expect(results).toContain(watchProduct);
  });

  it("returns synonym match for watch", () => {
    const results = rankSearchResults(allProducts, "watch");
    expect(results).toContain(watchProduct);
  });

  it("returns car product for سيارة", () => {
    const results = rankSearchResults(allProducts, "سيارة");
    expect(results).toContain(carProduct);
  });

  it("returns empty for pure noise query zzzz-no-match", () => {
    expect(rankSearchResults(allProducts, "zzzz-no-match")).toEqual([]);
  });

  it("returns empty for stop-words-only query", () => {
    expect(rankSearchResults(allProducts, "no product in the store")).toEqual([]);
  });

  it("does not return all products for nonsense query zzzz-no-product-987654", () => {
    const results = rankSearchResults(allProducts, "zzzz-no-product-987654");
    expect(results).toHaveLength(0);
  });

  it("returns empty array when products list is empty", () => {
    expect(rankSearchResults([], "ساعة")).toEqual([]);
  });

  it("returns all products unchanged for empty query", () => {
    expect(rankSearchResults(allProducts, "")).toHaveLength(allProducts.length);
  });
});
