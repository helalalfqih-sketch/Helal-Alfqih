import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { MessageCircle } from "lucide-react";

const DEFAULT_VIDEO_SRC = "https://cdn.coverr.co/videos/coverr-a-luxury-modern-living-room-4568/1080p.mp4";
const DEFAULT_VIDEO_POSTER =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=70";

const DEFAULT_HEADLINE = "اندكس ستور: حيث تلتقي الفخامة بالتقنية";

const STORY_BLOCKS = [
  {
    kicker: "الفصل الأول",
    title: "تجربة تسوّق سينمائية",
    body: "لا نبيع منتجات فقط — نصنع لحظات. كل تفصيلة داخل اندكس ستور مصمّمة لتمنحك إحساساً بالفخامة منذ اللمسة الأولى.",
  },
  {
    kicker: "الفصل الثاني",
    title: "تقنية بلا حدود",
    body: "أحدث الأجهزة الذكية، الإكسسوارات الفاخرة، والتجارب ثلاثية الأبعاد التي تجعلك تعيش المنتج قبل اقتنائه.",
  },
  {
    kicker: "الفصل الثالث",
    title: "خدمة تليق بك",
    body: "توصيل لكل المحافظات، دعم مباشر عبر الواتساب، وضمان جودة على كل قطعة. أنت في المكان الصحيح.",
  },
];

export interface CinematicStoryProps {
  cinematicConfig?: {
    title?: string;
    subtitle?: string;
    videoUrl?: string;
    posterUrl?: string;
  };
  whatsappNumber?: string;
}

export function CinematicStory({ cinematicConfig, whatsappNumber = "967771370740" }: CinematicStoryProps) {
  const headline = cinematicConfig?.title || DEFAULT_HEADLINE;
  const videoSrc = cinematicConfig?.videoUrl || DEFAULT_VIDEO_SRC;
  const videoPoster = cinematicConfig?.posterUrl || DEFAULT_VIDEO_POSTER;
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("مرحباً، أود الاستفسار عن منتجات متجر اندكس ستور")}`;

  return (
    <section
      dir="rtl"
      aria-label="قصة اندكس ستور"
      className="relative w-full rounded-3xl overflow-hidden my-4 py-12 md:py-16 bg-showcase border border-showcase-border/40"
      style={{
        fontFamily: "Tajawal, system-ui, sans-serif",
      }}
    >
      {/* Video background */}
      <div className="absolute inset-0 h-full w-full">
        <video
          src={videoSrc}
          poster={videoPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--showcase) 92%, transparent) 0%, color-mix(in oklab, var(--showcase) 70%, transparent) 50%, color-mix(in oklab, var(--showcase) 95%, transparent) 100%)",
          }}
        />
      </div>

      {/* Massive editorial background typography */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <span
          className="select-none font-black tracking-tight text-showcase-foreground/15 mix-blend-overlay whitespace-nowrap"
          style={{
            fontSize: "clamp(6rem, 20vw, 20rem)",
            lineHeight: 0.85,
          }}
        >
          INDEXES
        </span>
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 md:px-6 text-center text-showcase-foreground">
        <h2 className="mx-auto max-w-4xl font-black leading-[1.15] tracking-tight text-2xl sm:text-4xl md:text-5xl">
          {headline}
        </h2>
        {cinematicConfig?.subtitle && (
          <p className="mt-2 text-sm sm:text-base text-showcase-foreground/80 max-w-2xl">
            {cinematicConfig.subtitle}
          </p>
        )}

        {/* Chapters */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
          {STORY_BLOCKS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-showcase-border/60 bg-showcase-foreground/[0.05] p-5 backdrop-blur-md text-start flex flex-col justify-between"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-showcase-muted">
                  {b.kicker}
                </p>
                <h3 className="mt-1.5 text-base font-black text-showcase-foreground">
                  {b.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-showcase-foreground/80">
                  {b.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-showcase-foreground/25 bg-showcase-foreground/10 px-7 py-3 text-xs md:text-sm font-black text-showcase-foreground shadow-2xl backdrop-blur-xl transition hover:bg-showcase-foreground/20 hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" />
          <span>ابدأ رحلتك معنا عبر واتساب</span>
        </a>
      </div>
    </section>
  );
}
