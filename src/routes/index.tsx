import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product } from "@/lib/store-data";
import type { HeroConfig, HeroSlide } from "@/lib/domain/appearance";
import {
  categoriesQuery,
  bestSellersQuery,
  offersQuery,
  globePoolQuery,
} from "@/lib/queries/catalog";
import { CategoryRailSkeleton, ProductRailSkeleton } from "@/components/home/home-skeletons";
import { NeonProductCard } from "@/components/home/neon-product-card";
import { AiSearchPanel } from "@/components/home/ai-search-panel";
import { TrustStrip } from "@/components/home/trust-strip";
import loyaltyGem from "@/assets/loyalty-gem.png";
import { Reveal } from "@/components/motion/reveal";
import { SnapRail } from "@/components/motion/snap-rail";

const ImmersiveProductExperience = lazy(() =>
  import("@/components/immersive/ImmersiveProductExperience").then((module) => ({
    default: module.ImmersiveProductExperience,
  })),
);

const ProductSphereHero = lazy(() =>
  import("@/components/product-sphere-hero").then((module) => ({
    default: module.ProductSphereHero,
  })),
);

function HeroContent({
  hero,
}: {
  hero: Pick<HeroConfig, "badgeText" | "title" | "subtitle" | "ctaText" | "ctaLink">;
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end space-y-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-start sm:p-10">
      {hero.badgeText && (
        <span className="inline-block self-start rounded-full border border-primary/40 bg-primary/30 px-3.5 py-1 text-xs font-bold text-primary">
          {hero.badgeText}
        </span>
      )}
      <h1 className="text-2xl font-black leading-tight text-white sm:text-4xl">{hero.title}</h1>
      <p className="max-w-xl text-xs text-gray-200 sm:text-sm">{hero.subtitle}</p>
      {hero.ctaText && (
        <a
          href={hero.ctaLink || "/offers"}
          className="inline-flex self-start items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-white shadow-brand transition hover:bg-primary/90"
        >
          {hero.ctaText}
        </a>
      )}
    </div>
  );
}

function BannerHero({ hero }: { hero: HeroConfig }) {
  return (
    <div
      data-testid="hero-banner"
      className="relative mx-2 my-2 min-h-[350px] overflow-hidden rounded-[32px] border border-white/10 bg-surface shadow-2xl sm:mx-4"
    >
      {hero.bannerImageUrl ? (
        <img
          src={hero.bannerImageUrl}
          alt={hero.title || "البنر الرئيسي"}
          className="h-[50vh] min-h-[350px] w-full object-cover"
        />
      ) : (
        <div className="h-[50vh] min-h-[350px] w-full bg-gradient-to-r from-primary/30 to-secondary/30" />
      )}
      <HeroContent hero={hero} />
    </div>
  );
}

function VideoHero({ hero }: { hero: HeroConfig }) {
  return (
    <div
      data-testid="hero-video"
      className="relative mx-2 my-2 min-h-[400px] overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-2xl sm:mx-4"
    >
      {hero.bannerVideoUrl ? (
        <video
          src={hero.bannerVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/40 to-blue-900/40" />
      )}
      <div className="relative z-10 flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8 text-center sm:p-14">
        {hero.badgeText && (
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-4 py-1 text-xs font-bold text-cyan-400">
            {hero.badgeText}
          </span>
        )}
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{hero.title}</h1>
        <p className="max-w-lg text-sm text-gray-300 sm:text-base">{hero.subtitle}</p>
        {hero.ctaText && (
          <a
            href={hero.ctaLink || "/offers"}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3 text-xs font-black text-black shadow-lg transition hover:bg-cyan-300"
          >
            {hero.ctaText}
          </a>
        )}
      </div>
    </div>
  );
}

function SlideshowHero({ hero }: { hero: HeroConfig }) {
  const slides = useMemo(
    () => [...hero.slides].filter((slide) => slide.mediaUrl).sort((a, b) => a.order - b.order),
    [hero.slides],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    if (slides.length < 2) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % slides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [slides]);

  if (slides.length === 0) {
    return (
      <div data-testid="hero-slideshow">
        <BannerHero hero={hero} />
      </div>
    );
  }

  const slide: HeroSlide = slides[activeIndex] ?? slides[0];
  const content = {
    badgeText: slide.badgeText || hero.badgeText,
    title: slide.title || hero.title,
    subtitle: slide.subtitle || hero.subtitle,
    ctaText: slide.ctaText || hero.ctaText,
    ctaLink: slide.ctaLink || hero.ctaLink,
  };

  return (
    <div
      data-testid="hero-slideshow"
      className="relative mx-2 my-2 min-h-[220px] overflow-hidden rounded-[24px] border border-white/10 bg-black shadow-2xl sm:mx-4 sm:min-h-[280px] md:min-h-[340px]"
    >
      {slide.mediaType === "video" ? (
        <video
          key={slide.id}
          src={slide.mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <img
          key={slide.id}
          src={slide.mediaUrl}
          alt={content.title || "الشريحة الرئيسية"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/40 to-black/80" />

      <div className="relative z-10 flex min-h-[220px] flex-col justify-center p-6 text-start sm:min-h-[280px] sm:p-8 md:min-h-[340px]">
        {content.badgeText && (
          <span className="mb-2 inline-block self-start rounded-lg bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {content.badgeText}
          </span>
        )}
        <h1 className="text-xl font-black leading-tight text-white sm:text-3xl md:text-4xl">
          {content.title}
        </h1>
        {content.subtitle && (
          <p className="mt-1 max-w-xs text-xs text-white/70 sm:text-sm">{content.subtitle}</p>
        )}
        {content.ctaText && (
          <a
            href={content.ctaLink || "/offers"}
            className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-xs font-black text-slate-900 shadow-lg transition hover:bg-slate-100 sm:px-6 sm:py-3"
          >
            {content.ctaText}
            <Icons.ChevronLeft className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`الشريحة ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-5 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function StorefrontHero({
  hero,
  products,
}: {
  hero: HeroConfig;
  products: LegacyProductShape[];
}) {
  if (hero.enabled === false) return null;

  switch (hero.type) {
    case "sphere_3d":
      return (
        <div data-testid="hero-sphere-3d">
          <Suspense fallback={<div className="h-40" />}>
            <ProductSphereHero products={products} title="آلاف المنتجات" />
          </Suspense>
        </div>
      );
    case "cinematic":
      return (
        <div data-testid="hero-cinematic">
          <Suspense fallback={<div className="h-40" />}>
            <ImmersiveProductExperience products={products} />
          </Suspense>
        </div>
      );
    case "banner_image":
      return <BannerHero hero={hero} />;
    case "video":
      return <VideoHero hero={hero} />;
    case "slideshow":
      return <SlideshowHero hero={hero} />;
    default:
      return null;
  }
}

function StoreIdentity() {
  return (
    <div className="flex h-[56px] items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2.5">
        <span className="grid h-[52px] w-[52px] shrink-0 place-items-center gap-0.5 rounded-[18px] border border-neon/55 bg-ink-card text-neon-2 shadow-[0_0_26px_-10px_var(--neon)]">
          <Icons.ShoppingBag className="mx-auto h-[22px] w-[22px]" strokeWidth={1.7} />
          <span className="block text-[7px] font-bold tracking-[0.14em] text-ink-text">
            INDEXES
          </span>
        </span>
        <div className="text-right">
          <p className="flex items-center gap-1.5 text-[17.5px] font-bold leading-tight">
            اندكس ستور
            <Icons.BadgeCheck className="h-[16px] w-[16px] shrink-0 fill-neon text-ink" />
          </p>
          <p className="text-[12.5px] leading-tight text-ink-muted">
            كل ما تحتاجه في مكان واحد
          </p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن" },
      {
        name: "description",
        content:
          "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد.",
      },
      { property: "og:title", content: "اندكس ستور — تسوّق أونلاين في اليمن" },
      {
        property: "og:description",
        content: "عروض حصرية تصل إلى 50% وشحن مجاني للطلبات فوق 30,000 ريال.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(bestSellersQuery(4)),
      context.queryClient.ensureQueryData(offersQuery(6)),
      context.queryClient.ensureQueryData(globePoolQuery()),
    ]);
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  pendingComponent: HomeSkeleton,
  component: HomePage,
});

function HomeSkeleton() {
  return (
    <div
      dir="rtl"
      className="flex flex-col gap-3.5 bg-ink px-3.5 pt-3 text-ink-text sm:px-4 lg:px-9"
    >
      <div className="h-11 rounded-[14px] border border-ink-line bg-ink-card lg:h-[50px]" />
      <div className="h-[380px] rounded-[24px] border border-ink-line bg-[#0A1020]" />
      <CategoryRailSkeleton />
      <ProductRailSkeleton />
      <div className="h-24 rounded-2xl border border-ink-line bg-[#0A1020] lg:h-[84px]" />
      <div className="min-h-[170px] rounded-[24px] border border-ink-line bg-[#0A1020]" />
    </div>
  );
}

function HomePage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: bestSellers } = useSuspenseQuery(bestSellersQuery(4));
  const { data: dailyDeals } = useSuspenseQuery(offersQuery(6));
  const { data: allProducts } = useSuspenseQuery(globePoolQuery());

  const deals = (dailyDeals.length ? dailyDeals : bestSellers) as unknown as Product[];
  const globeProducts = (allProducts.length ? allProducts : dailyDeals) as LegacyProductShape[];

  return (
    <div
      dir="rtl"
      className="flex flex-col gap-3.5 bg-ink px-3.5 pt-3 text-ink-text sm:px-4 lg:px-9"
    >
      {/* 1. Shipping bar */}
      <div className="flex h-11 items-center justify-between gap-3 rounded-[14px] border border-ink-line bg-ink-card px-3 text-[11px] font-semibold leading-4 lg:h-[50px] lg:rounded-2xl lg:px-[30px] lg:text-[16px]">
        <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          <Icons.Zap className="h-3.5 w-3.5 shrink-0 text-neon-2" />
          <span>توصيل سريع 24 - 48 ساعة</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          <Icons.Truck className="h-3.5 w-3.5 shrink-0 text-neon-2" />
          <span>
            شحن مجاني فوق <span className="text-neon-2">30,000</span> ريال
          </span>
        </span>
      </div>

      {/* 2. Store identity */}
      <StoreIdentity />

      {/* 3. Product sphere hero (Dominant mobile scale) */}
      <Suspense fallback={<div className="h-[380px] w-full rounded-3xl bg-ink-card animate-pulse" />}>
        <ProductSphereHero products={globeProducts} title="آلاف المنتجات" />
      </Suspense>

      {/* 4. AI search panel */}
      <AiSearchPanel height={48} />

      {/* 5. Trust strip */}
      <Reveal as="div" className="defer-paint">
        <TrustStrip variant="inline" />
      </Reveal>

      {/* 6. Categories */}
      <Reveal as="section" className="-mx-3.5 sm:-mx-4 lg:mx-0">
        <SnapRail className="px-3.5 sm:px-4 lg:px-0" itemGapClass="gap-2.5 lg:gap-4">
          {categories.slice(0, 6).map((c) => {
            const Icon =
              (Icons as unknown as Record<string, Icons.LucideIcon>)[c.icon] ?? Icons.Package;
            return (
              <Link
                key={c.id}
                to="/category/$id"
                params={{ id: c.id }}
                className="press card-lift flex h-[104px] w-[90px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-ink-line bg-ink-card px-2 sm:w-24 lg:h-[116px] lg:w-full lg:flex-1"
              >
                <Icon className="h-9 w-9 text-neon-2 lg:h-12 lg:w-12" strokeWidth={1.4} />
                <span className="line-clamp-2 w-full text-center text-[13px] font-semibold leading-tight text-ink-text lg:text-[16px]">
                  {c.name}
                </span>
              </Link>
            );
          })}
          <Link
            to="/search"
            search={{ q: "" }}
            className="press card-lift flex h-[104px] w-[90px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-ink-line bg-ink-card px-2 sm:w-24 lg:hidden"
          >
            <Icons.LayoutGrid className="h-9 w-9 text-neon-2" strokeWidth={1.4} />
            <span className="line-clamp-2 w-full text-center text-[13px] font-semibold leading-tight text-ink-text">
              المزيد
            </span>
          </Link>
        </SnapRail>
      </Reveal>

      {/* 7. Products */}
      <Reveal as="section">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-[15px] font-black">
            <Icons.Flame
              className="h-[17px] w-[17px] fill-warning text-warning"
              strokeWidth={1.2}
            />
            أفضل العروض
          </h2>
          <Link to="/offers" className="flex items-center gap-1 text-[12px] font-bold text-neon-2">
            عرض الكل
            <Icons.ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="relative">
          <SnapRail
            className="-mx-3.5 px-3.5 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0"
            itemGapClass="gap-3"
          >
            {deals.map((p, i) => (
              <Reveal key={p.id} index={i} className="shrink-0">
                <NeonProductCard product={p} />
              </Reveal>
            ))}
          </SnapRail>
        </div>
      </Reveal>

      {/* 8. Loyalty program card */}
      <Reveal
        as="section"
        className="defer-paint relative overflow-hidden rounded-[24px] border border-neon/40 bg-linear-to-r from-neon-soft via-ink-card to-ink-card p-4 lg:h-[158px]"
      >
        <div className="flex h-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex min-w-0 items-center gap-3 lg:order-2 lg:flex-1 lg:flex-row-reverse lg:justify-end lg:text-center">
            <img
              src={loyaltyGem}
              alt="جوهرة برنامج الولاء"
              loading="lazy"
              width={512}
              height={512}
              className="h-[72px] w-[72px] shrink-0 object-contain drop-shadow-[0_0_18px_var(--neon)] lg:h-[126px] lg:w-[126px]"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-black leading-tight lg:text-[18px]">
                برنامج <span className="text-neon-2">INDEXES</span> المميز
              </h3>
              <p className="mt-1 text-[11.5px] leading-snug text-ink-muted lg:text-[13px]">
                اكسب نقاط مع كل طلب واستبدلها بمكافآت حصرية
              </p>
              <Link
                to="/account"
                className="press mt-2.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-neon px-4 py-2 text-[12px] font-bold text-white"
              >
                اكتشف المزايا
                <Icons.ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-line bg-ink/60 p-3 text-center lg:order-1 lg:w-[38%] lg:shrink-0">
            <p className="flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-neon-2">
              <Icons.Sparkles className="h-4 w-4 shrink-0" />
              برنامج المكافآت
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-ink-muted">
              سجّل الدخول لمتابعة مكافآتك
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
