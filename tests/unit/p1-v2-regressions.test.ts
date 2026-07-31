import { beforeEach, describe, expect, it, vi } from "vitest";
import { yemeniPhoneSchema } from "../../src/lib/validation/phone";
import { buildShareUrls } from "../../src/lib/share-urls";

const catalog = [
  {
    id: "1",
    name: "شاحن سيارة سريع",
    slug: "شاحن-سيارة-سريع",
    description: "شاحن مخصص للسيارات",
    categoryId: "cars",
    price: 5000,
    rating: 4.8,
    reviews: 20,
    image: "https://example.com/car.jpg",
  },
  {
    id: "2",
    name: "خلاط مطبخ",
    slug: "خلاط-مطبخ",
    description: "جهاز منزلي",
    categoryId: "home",
    price: 7000,
    rating: 4.2,
    reviews: 10,
    image: "https://example.com/blender.jpg",
  },
];

vi.mock("@/lib/actions/product.actions", () => ({
  fetchProducts: vi.fn(async () => catalog),
}));

describe("P1 v2 regressions", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["771234567", "0771234567", "+967771234567", "٧٧١٢٣٤٥٦٧"])(
    "accepts valid Yemeni phone format %s",
    (phone) => {
      expect(yemeniPhoneSchema.parse(phone)).toBe("967771234567");
    },
  );

  it.each(["12345", "661234567", "96777123", "not-a-phone"])(
    "rejects invalid Yemeni phone format %s",
    (phone) => {
      expect(yemeniPhoneSchema.safeParse(phone).success).toBe(false);
    },
  );

  it("builds share URLs without double encoding Arabic slugs", () => {
    const urls = buildShareUrls(
      { name: "لمبات زينة", slug: "لمبات-زينة-led" },
      "https://indexes-store.vercel.app",
    );

    expect(urls.productUrl).toContain("/product/لمبات-زينة-led");
    expect(urls.whatsapp).not.toContain("%25D9");
    expect(decodeURIComponent(new URL(urls.facebook).searchParams.get("u") ?? "")).toBe(
      urls.productUrl,
    );
  });

  it("applies the minimum relevance threshold", async () => {
    const { searchProductsAdvanced } = await import("../../src/lib/search-engine");
    expect(await searchProductsAdvanced({ search: "zzzz-no-product-987654" })).toEqual([]);
    expect((await searchProductsAdvanced({ search: "سيارة" })).map((p) => p.id)).toEqual(["1"]);
  });
});
