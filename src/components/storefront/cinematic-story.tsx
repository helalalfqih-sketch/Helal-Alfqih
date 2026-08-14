import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { MessageCircle } from "lucide-react";

// Public, muted, looping ambient video â€” CDN hosted, safe for autoplay.
const VIDEO_SRC = "https://cdn.coverr.co/videos/coverr-a-luxury-modern-living-room-4568/1080p.mp4";
const VIDEO_POSTER =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=70";

const WA_LINK =
  "https://wa.me/967771370740?text=" +
  encodeURIComponent("ظ…ط±ط­ط¨ط§ظ‹طŒ ط£ط±ظٹط¯ ط§ظ„ط§ط³طھظپط³ط§ط± ط¹ظ† ظ…ظ†طھط¬ط§طھ ط§ظ†ط¯ظƒط³ ط³طھظˆط±");

const HEADLINE = "ط§ظ†ط¯ظƒط³ ط³طھظˆط±: ط­ظٹط« طھظ„طھظ‚ظٹ ط§ظ„ظپط®ط§ظ…ط© ط¨ط§ظ„طھظ‚ظ†ظٹط©";

const STORY_BLOCKS = [
  {
    kicker: "ط§ظ„ظپطµظ„ ط§ظ„ط£ظˆظ„",
    title: "طھط¬ط±ط¨ط© طھط³ظˆظ‘ظ‚ ط³ظٹظ†ظ…ط§ط¦ظٹط©",
    body: "ظ„ط§ ظ†ط¨ظٹط¹ ظ…ظ†طھط¬ط§طھ ظپظ‚ط· â€” ظ†طµظ†ط¹ ظ„ط­ط¸ط§طھ. ظƒظ„ طھظپطµظٹظ„ط© ط¯ط§ط®ظ„ ط§ظ†ط¯ظƒط³ ط³طھظˆط± ظ…طµظ…ظ‘ظ…ط© ظ„طھظ…ظ†ط­ظƒ ط¥ط­ط³ط§ط³ظ‹ط§ ط¨ط§ظ„ظپط®ط§ظ…ط© ظ…ظ†ط° ط§ظ„ظ„ظ…ط³ط© ط§ظ„ط£ظˆظ„ظ‰.",
  },
  {
    kicker: "ط§ظ„ظپطµظ„ ط§ظ„ط«ط§ظ†ظٹ",
    title: "طھظ‚ظ†ظٹط© ط¨ظ„ط§ ط­ط¯ظˆط¯",
    body: "ط£ط­ط¯ط« ط§ظ„ط£ط¬ظ‡ط²ط© ط§ظ„ط°ظƒظٹط©طŒ ط§ظ„ط¥ظƒط³ط³ظˆط§ط±ط§طھ ط§ظ„ظپط§ط®ط±ط©طŒ ظˆط§ظ„طھط¬ط§ط±ط¨ ط«ظ„ط§ط«ظٹط© ط§ظ„ط£ط¨ط¹ط§ط¯ ط§ظ„طھظٹ طھط¬ط¹ظ„ظƒ طھط¹ظٹط´ ط§ظ„ظ…ظ†طھط¬ ظ‚ط¨ظ„ ط§ظ‚طھظ†ط§ط¦ظ‡.",
  },
  {
    kicker: "ط§ظ„ظپطµظ„ ط§ظ„ط«ط§ظ„ط«",
    title: "ط®ط¯ظ…ط© طھظ„ظٹظ‚ ط¨ظƒ",
    body: "طھظˆطµظٹظ„ ظ„ظƒظ„ ط§ظ„ظ…ط­ط§ظپط¸ط§طھطŒ ط¯ط¹ظ… ظ…ط¨ط§ط´ط± ط¹ط¨ط± ط§ظ„ظˆط§طھط³ط§ط¨طŒ ظˆط¶ظ…ط§ظ† ط¬ظˆط¯ط© ط¹ظ„ظ‰ ظƒظ„ ظ‚ط·ط¹ط©. ط£ظ†طھ ظپظٹ ط§ظ„ظ…ظƒط§ظ† ط§ظ„طµط­ظٹط­.",
  },
];

const headlineWords = HEADLINE.split(" ");

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function CinematicStory() {
  return (
    <section
      dir="rtl"
      aria-label="ظ‚طµط© ط§ظ†ط¯ظƒط³ ط³طھظˆط±"
      className="relative w-full rounded-3xl overflow-hidden my-4 py-12 md:py-16 bg-showcase border border-showcase-border/40"
      style={{
        fontFamily: "Tajawal, system-ui, sans-serif",
      }}
    >
      {/* Video background */}
      <div className="absolute inset-0 h-full w-full">
        <video
          src={VIDEO_SRC}
          poster={VIDEO_POSTER}
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
          {HEADLINE}
        </h2>

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
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-showcase-foreground/25 bg-showcase-foreground/10 px-7 py-3 text-xs md:text-sm font-black text-showcase-foreground shadow-2xl backdrop-blur-xl transition hover:bg-showcase-foreground/20 hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" />
          <span>ط§ط¨ط¯ط£ ط±ط­ظ„طھظƒ ظ…ط¹ظ†ط§ ط¹ط¨ط± ظˆط§طھط³ط§ط¨</span>
        </a>
      </div>
    </section>
  );
}

