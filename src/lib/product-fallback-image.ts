/**
 * Smart Contextual Product Fallback Image Resolver
 * Provides high-resolution, category & keyword-matched Unsplash product photos
 * instead of generic SVG placeholders or 'no image available' text.
 */

const CATEGORY_IMAGES: Record<string, string[]> = {
  beauty: [
    "https://images.unsplash.com/photo-1608248597262-838d1487f960?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1517055729445-fa7d27394b48?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80",
  ],
  tools: [
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80",
  ],
  perfumes: [
    "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
  ],
  home: [
    "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  ],
  fashion: [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
  ],
};

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSmartProductFallbackImage(
  name?: string,
  category?: string,
  id?: string
): string {
  const text = `${name || ""} ${category || ""}`.toLowerCase();

  let pool = CATEGORY_IMAGES.general;

  if (
    /زيت|شعر|عناية|جمال|تجميل|بشرة|كريم|لوشن|شامبو|أفغاني|أفقاني|بلسم|سيروم/i.test(
      text
    ) ||
    category === "beauty_care" ||
    category === "beauty"
  ) {
    pool = CATEGORY_IMAGES.beauty;
  } else if (
    /أدوات|ماكيات|ماكيتا|كهربائية|درل|مثقاب|مفك|صيانة|عدة|مجموعة أدوات/i.test(
      text
    ) ||
    category === "tools"
  ) {
    pool = CATEGORY_IMAGES.tools;
  } else if (
    /كشاف|يدوي|سطوع|بطارية|إضاءة|rgb|ساعة|سماعة|كاميرا|شاحن|إلكترونيات|كمبيوتر|هاتف|جوال/i.test(
      text
    ) ||
    category === "electronics"
  ) {
    pool = CATEGORY_IMAGES.electronics;
  } else if (
    /عطر|عود|بخور|مسك|طيب|فريد/i.test(text) ||
    category === "perfumes"
  ) {
    pool = CATEGORY_IMAGES.perfumes;
  } else if (
    /منزل|مطبخ|قلاية|ديكور|أثاث|طاولة|كرسي/i.test(text) ||
    category === "home_decor" ||
    category === "home"
  ) {
    pool = CATEGORY_IMAGES.home;
  } else if (
    /أزياء|ملابس|قميص|حذاء|حقيبة|فستان/i.test(text) ||
    category === "fashion"
  ) {
    pool = CATEGORY_IMAGES.fashion;
  }

  const seed = id || name || "product";
  const index = getHash(seed) % pool.length;
  return pool[index];
}

export function isSvgFallbackOrEmpty(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return true;
  const clean = url.trim();
  if (!clean) return true;
  if (clean.startsWith("data:image/svg")) return true;
  if (clean.includes("لا%20تتوفر%20صورة") || clean.includes("لا تتوفر صورة"))
    return true;
  return false;
}
