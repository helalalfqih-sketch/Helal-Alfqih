import { describe, expect, it } from "vitest";
import { yemeniPhoneSchema, normalizeArabicDigits } from "@/lib/validation/phone";
import { normalizeYemeniPhone } from "@/lib/shipping";
import { rankSearchResults } from "@/lib/search-engine";
import type { LegacyProductShape } from "@/lib/data-adapter";

const product = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "ساعة ذكية",
  description: "شاشة AMOLED",
  categoryId: "electronics",
  image: "https://example.com/watch.webp",
  slug: "smart-watch",
  price: 25_000,
  rating: 5,
  reviews: 2,
} as LegacyProductShape;

describe("checkout phone validation", () => {
  it.each(["771234567", "+967771234567", "٧٧١٢٣٤٥٦٧", "۷۷۱۲۳۴۵۶۷"])(
    "accepts and normalizes %s",
    (input) => {
      expect(yemeniPhoneSchema.parse(input)).toBe("967771234567");
      expect(normalizeYemeniPhone(input)).toBe("967771234567");
    },
  );

  it.each(["", "123456789", "0712345678", "967123456789", "77123"])("rejects %s", (input) =>
    expect(yemeniPhoneSchema.safeParse(input).success).toBe(false),
  );

  it("normalizes both Arabic digit blocks", () => {
    expect(normalizeArabicDigits("١٢٣ ۴۵۶")).toBe("123 456");
  });
});

describe("search relevance floor", () => {
  it("returns an exact or synonym match", () => {
    expect(rankSearchResults([product], "ساعة")).toEqual([product]);
    expect(rankSearchResults([product], "watch")).toEqual([product]);
  });

  it("does not return recommendations as search results for a random query", () => {
    expect(rankSearchResults([product], "zzzz-no-match")).toEqual([]);
  });
});
