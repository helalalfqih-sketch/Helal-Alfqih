import { fetchProducts } from "@/lib/actions/product.actions";
import type { LegacyProductShape } from "@/lib/data-adapter";

export const MIN_RELEVANCE_SCORE = 8;

const searchCache = new Map<string, LegacyProductShape[]>();
let productCatalogPromise: Promise<LegacyProductShape[]> | null = null;

function loadProductCatalog(): Promise<LegacyProductShape[]> {
  productCatalogPromise ??= fetchProducts();
  return productCatalogPromise;
}

/** Arabic Text Normalizer & Typo Tolerator */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  return (
    text
      .toLowerCase()
      .trim()
      // Remove Tashkeel / Diacritics
      .replace(/[\u064B-\u0652]/g, "")
      // Normalize Alef
      .replace(/[أإآٱ]/g, "ا")
      // Normalize Yaa / Alef Maqsura
      .replace(/[ىئ]/g, "ي")
      // Normalize Taa Marbouta
      .replace(/ة/g, "ه")
      // Replace non-alphanumeric except spaces
      .replace(/[^\w\s\u0600-\u06FF]/g, " ")
      .replace(/\s+/g, " ")
  );
}

/** Arabic & English Synonym & Typo Dictionary */
const SYNONYM_MAP: Record<string, string[]> = {
  كميرا: ["كاميرا", "camera", "عدسة", "تصوير"],
  كاميرا: ["كميرا", "camera", "عدسة", "تصوير"],
  camera: ["كاميرا", "كميرا", "عدسة"],
  ساعه: ["ساعة", "ساعات", "watch", "smartwatch"],
  ساعة: ["ساعه", "ساعات", "watch", "smartwatch"],
  watch: ["ساعة", "ساعات", "smartwatch"],
  جوال: ["هاتف", "موبايل", "phone", "mobile", "آيفون", "سامسونج"],
  هاتف: ["جوال", "موبايل", "phone", "mobile"],
  phone: ["هاتف", "جوال", "موبايل", "mobile"],
  منشار: ["منشار", "تقليم", "saw", "قطع", "كهربائي"],
  saw: ["منشار", "تقليم"],
  سماعه: ["سماعة", "سماعات", "speaker", "headphone", "audio"],
  سماعة: ["سماعه", "سماعات", "speaker", "headphone", "audio"],
  speaker: ["سماعة", "سماعات", "صوت"],
  شاشه: ["شاشة", "تلفزيون", "tv", "screen", "monitor"],
  شاشة: ["شاشه", "تلفزيون", "tv", "screen", "monitor"],
  tv: ["شاشة", "تلفزيون", "screen"],
};

/** Get Query Tokens with Synonyms & Variations */
function getExpandedTokens(query: string): string[] {
  const normalized = normalizeArabic(query);
  const rawTokens = normalized.split(" ").filter((t) => t.length > 0);

  const set = new Set<string>();
  for (const token of rawTokens) {
    set.add(token);
    // Add synonyms if present
    const synonyms = SYNONYM_MAP[token];
    if (synonyms) {
      synonyms.forEach((s) => set.add(normalizeArabic(s)));
    }
  }
  return Array.from(set);
}

export interface SearchFilterOptions {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  dealsOnly?: boolean;
  inStockOnly?: boolean;
  brand?: string;
  sortBy?: "bestselling" | "latest" | "price_asc" | "price_desc" | "rating";
}

/** Advanced Search & Rank Engine */
export async function searchProductsAdvanced(
  options: SearchFilterOptions = {},
  signal?: AbortSignal,
): Promise<LegacyProductShape[]> {
  const cacheKey = JSON.stringify(options);
  const cached = searchCache.get(cacheKey);
  if (cached) return [...cached];

  const { search, categoryId, minPrice, maxPrice, dealsOnly, inStockOnly, brand, sortBy } = options;
  const allProducts = await loadProductCatalog();
  if (signal?.aborted) throw new DOMException("Search aborted", "AbortError");

  let filtered = allProducts.filter((p) => {
    // Category Filter
    if (categoryId && categoryId !== "all") {
      const matchCat =
        p.categoryId === categoryId ||
        (p as any).category_name?.toLowerCase() === categoryId.toLowerCase();
      if (!matchCat) return false;
    }

    // Brand Filter
    if (brand && brand !== "all") {
      const matchBrand = (p as any).brand?.toLowerCase() === brand.toLowerCase();
      if (!matchBrand) return false;
    }

    // Price Filter
    if (minPrice !== undefined && p.price < minPrice) return false;
    if (maxPrice !== undefined && p.price > maxPrice) return false;

    // Deals Filter
    if (dealsOnly) {
      const isOffer =
        p.isDeal ||
        (typeof p.oldPrice === "number" && p.oldPrice > p.price) ||
        (p.badge && (p.badge.includes("عرض") || p.badge.includes("خصم")));
      if (!isOffer) return false;
    }

    // In Stock Filter
    if (inStockOnly) {
      const inStock = (p as any).stock !== undefined ? (p as any).stock > 0 : true;
      if (!inStock) return false;
    }

    return true;
  });

  // Text Search Matching & Scoring
  if (search && search.trim()) {
    const rawTokens = getExpandedTokens(search);

    // Stop-words: tokens that are too common or semantically empty to drive relevance
    const STOP_WORDS = new Set([
      "no", "product", "products", "item", "items", "the", "a", "an", "in", "on", "of", "to", "for", "with", "and", "or", "is",
      "من", "في", "على", "عن", "مع", "لا", "او", "ام", "ال", "ما", "هذا", "هذه"
    ]);

    // Content tokens: not a stop-word AND at least 3 chars (eliminates single-letter fragments
    // and common English noise tokens like "no", "on", "in" that cause accidental matches)
    const contentTokens = rawTokens.filter((t) => !STOP_WORDS.has(t) && t.length >= 3);

    // If NO meaningful tokens remain, the query is pure noise — return empty immediately
    if (contentTokens.length === 0) {
      filtered = [];
    } else {
      const scored = filtered.map((p) => {
        let score = 0;
        const normName = normalizeArabic(p.name);
        const normDesc = normalizeArabic(p.description || "");
        const normBrand = normalizeArabic((p as any).brand || "");
        const normCat = normalizeArabic((p as any).category_name || p.categoryId || "");
        const normSku = normalizeArabic((p as any).sku || "");
        const normBarcode = normalizeArabic((p as any).barcode || "");
        const normTags = normalizeArabic(((p as any).tags || []).join(" "));

        for (const token of contentTokens) {
          // Score only on product-facing fields; intentionally omit metadata JSON
          // to avoid accidental substring matches on internal identifiers
          if (normName.includes(token)) score += 10;       // name match
          if (normSku.includes(token) || normBarcode.includes(token)) score += 8; // sku/barcode
          if (normBrand.includes(token)) score += 6;       // brand
          if (normCat.includes(token)) score += 5;         // category
          if (normTags.includes(token)) score += 4;        // tags
          if (normDesc.includes(token)) score += 2;        // description
        }

        return { product: p, score };
      });

      // Require name/SKU/brand-level match (score >= 8) to surface a result.
      // This prevents tag-only (score 4) or description-only (score 2) noise matches.
      filtered = scored
        .filter((s) => s.score >= MIN_RELEVANCE_SCORE)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.product);
    }
  }

  // Sorting
  if (sortBy) {
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "latest":
        filtered.sort(
          (a, b) =>
            new Date((b as any).created_at || 0).getTime() -
            new Date((a as any).created_at || 0).getTime(),
        );
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "bestselling":
      default:
        filtered.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
        break;
    }
  }

  if (signal?.aborted) throw new DOMException("Search aborted", "AbortError");
  searchCache.set(cacheKey, [...filtered]);
  return filtered;
}

export async function getRecommendations(limit = 8): Promise<LegacyProductShape[]> {
  const products = await loadProductCatalog();
  return [...products]
    .sort((a, b) => (b.rating ?? 0) * (b.reviews ?? 0) - (a.rating ?? 0) * (a.reviews ?? 0))
    .slice(0, limit);
}

/**
 * Synchronous ranking helper for unit tests.
 * Applies the same stop-word filtering and scoring as `searchProductsAdvanced`,
 * but operates on an explicit product list without async catalog loading.
 */
export function rankSearchResults(
  products: LegacyProductShape[],
  query: string,
): LegacyProductShape[] {
  if (!query || !query.trim()) return [...products];

  const rawTokens = getExpandedTokens(query);
  const STOP_WORDS = new Set([
    "no", "product", "products", "item", "items", "the", "a", "an", "in", "on", "of",
    "to", "for", "with", "and", "or", "is",
    "\u0645\u0646", "\u0641\u064a", "\u0639\u0644\u0649", "\u0639\u0646", "\u0645\u0639", "\u0644\u0627", "\u0627\u0648", "\u0627\u0645", "\u0627\u0644", "\u0645\u0627", "\u0647\u0630\u0627", "\u0647\u0630\u0647",
  ]);
  const contentTokens = rawTokens.filter((t) => !STOP_WORDS.has(t) && t.length >= 3);
  if (contentTokens.length === 0) return [];

  const scored = products.map((p) => {
    let score = 0;
    const normName = normalizeArabic(p.name);
    const normDesc = normalizeArabic(p.description || "");
    const normBrand = normalizeArabic((p as any).brand || "");
    const normCat = normalizeArabic((p as any).category_name || p.categoryId || "");
    const normSku = normalizeArabic((p as any).sku || "");
    const normTags = normalizeArabic(((p as any).tags || []).join(" "));
    for (const token of contentTokens) {
      if (normName.includes(token)) score += 10;
      if (normSku.includes(token)) score += 8;
      if (normBrand.includes(token)) score += 6;
      if (normCat.includes(token)) score += 5;
      if (normTags.includes(token)) score += 4;
      if (normDesc.includes(token)) score += 2;
    }
    return { product: p, score };
  });

  return scored
    .filter((s) => s.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product);
}

export interface SearchSuggestionItem {
  id: string;
  type: "product" | "category" | "keyword";
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  count?: number;
  slug?: string;
}

/** Get Live Search Suggestions */
export async function getSearchSuggestions(query: string): Promise<SearchSuggestionItem[]> {
  const q = query.trim();
  if (!q) return [];

  const matched = await searchProductsAdvanced({ search: q });
  const suggestions: SearchSuggestionItem[] = [];

  // 1. Matching Product Items (up to 4)
  for (const p of matched.slice(0, 4)) {
    suggestions.push({
      id: p.id,
      type: "product",
      title: p.name,
      subtitle: (p as any).category_name || "منتج",
      image: p.image,
      price: p.price,
      slug: p.slug,
    });
  }

  // 2. Keyword / Category Summary Suggestion
  if (matched.length > 0) {
    suggestions.push({
      id: `keyword-${q}`,
      type: "keyword",
      title: `البحث عن "${q}" في جميع الأقسام`,
      subtitle: `عثرنا على ${matched.length} منتج`,
      count: matched.length,
    });
  }

  return suggestions;
}
