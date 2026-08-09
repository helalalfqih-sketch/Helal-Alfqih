export const STORE_CONTACT = "771370740";
export const CURRENCY = "ريال";

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  rating: number;
  reviews: number;
  categoryId: string;
  badge?: string;
  videoPlaybackId?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export const categories: Category[] = [
  { id: "fashion", name: "الأزياء", icon: "Shirt", color: "from-purple-500 to-indigo-600" },
  { id: "perfumes", name: "العطور", icon: "Sparkles", color: "from-pink-500 to-rose-600" },
  {
    id: "beauty_care",
    name: "الجمال والعناية",
    icon: "Heart",
    color: "from-fuchsia-400 to-purple-600",
  },
  {
    id: "electronics",
    name: "الإلكترونيات",
    icon: "Headphones",
    color: "from-blue-500 to-violet-700",
  },
  { id: "home_decor", name: "المنزل", icon: "Home", color: "from-amber-500 to-orange-600" },
];

export const products: Product[] = [
  {
    id: "p1",
    slug: "smart-watch-amoled",
    name: "ساعة ذكية",
    description: "شاشة AMOLED",
    price: 199,
    oldPrice: 285,
    stock: 34,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    reviews: 128,
    categoryId: "electronics",
    badge: "خصم 30%",
  },
  {
    id: "p2",
    slug: "wireless-earbuds-anc",
    name: "سماعات لاسلكية",
    description: "عزل ضوضاء",
    price: 149,
    oldPrice: 199,
    stock: 50,
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    reviews: 96,
    categoryId: "electronics",
    badge: "خصم 25%",
  },
  {
    id: "p3",
    slug: "oud-perfume-luxury",
    name: "عطر عود",
    description: "فاخر",
    price: 119,
    oldPrice: 149,
    stock: 25,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    reviews: 73,
    categoryId: "perfumes",
    badge: "خصم 20%",
  },
  {
    id: "p4",
    slug: "air-fryer-4-5l",
    name: "قلاية هوائية 4.5 لتر",
    description: "متعددة الاستخدام",
    price: 289,
    oldPrice: 339,
    stock: 18,
    image:
      "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
    rating: 4.6,
    reviews: 62,
    categoryId: "home_decor",
    badge: "خصم 15%",
  },
];

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);

export const getProductsByCategory = (id: string) => products.filter((p) => p.categoryId === id);

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n) + " " + CURRENCY;
