import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Spec'd card box per breakpoint. Applied inline so the reserved height is exact. */
function boxFor(vw: number): { h: number; w?: number } {
  if (vw >= 1024) return { h: 420 };
  if (vw >= 430) return { h: 320, w: 398 };
  return { h: 300 };
}

const SRC = "/media/ion-halo-helmet-motion-thumb-v1.mp4";
const POSTER = "/media/ion-halo-helmet-motion-thumb-v1-poster.jpg";

/**
 * Normal-flow cinematic section placed directly after the scroll-globe hero.
 * The element is mounted once for the lifetime of the page: visibility only
 * toggles play/pause, never `src`, so the MP4 is downloaded a single time and
 * playback resumes from its previous position.
 */
export function CinematicMotionShowcase() {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [box, setBox] = useState<{ h: number; w?: number }>({ h: 300 });

  useEffect(() => {
    const measure = () => setBox(boxFor(window.innerWidth));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (typeof IntersectionObserver === "undefined") return;

    let wanted = false;
    // play() rejects while the element still has no decodable data, so the
    // intent is remembered and retried once data arrives — never re-`src`ed.
    const attempt = () => {
      if (wanted && el.paused) void el.play().catch(() => undefined);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          wanted = true;
          // resume — currentTime is untouched, so no restart and no refetch
          attempt();
        } else {
          wanted = false;
          el.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    // The clip is a dolly-out: the complete helmet only reads in the last
    // seconds. Seek once, on first load, so the subject is legible right away.
    let seeded = false;
    const seed = () => {
      if (seeded) return;
      seeded = true;
      if (el.duration && Number.isFinite(el.duration) && el.currentTime < 0.2) {
        el.currentTime = Math.max(0, el.duration - 2.4);
      }
    };
    if (el.readyState >= 1) seed();
    el.addEventListener("loadedmetadata", seed);

    io.observe(el);
    el.addEventListener("loadeddata", attempt);
    el.addEventListener("canplay", attempt);
    return () => {
      io.disconnect();
      el.removeEventListener("loadedmetadata", seed);
      el.removeEventListener("loadeddata", attempt);
      el.removeEventListener("canplay", attempt);
    };
  }, [reduced]);

  return (
    <section
      aria-label="تجربة مستقبلية"
      // The homepage column uses a 14px flex gap; these 2px margins bring the
      // measured spacing above and below the video to exactly 16px.
      style={{ width: box.w, height: box.h, background: "#020611" }}
      className="relative mx-auto my-0.5 w-full overflow-hidden rounded-[24px] border border-[rgba(139,92,246,0.38)] shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_18px_60px_-34px_rgba(124,44,255,0.7)]"
    >
      <video
        ref={ref}
        src={SRC}
        poster={POSTER}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        // Fixed box: dimensions are reserved before metadata resolves, so the
        // section never collapses or shifts while the file loads. The 4:3
        // source is only trimmed ~9% horizontally at these ratios, which keeps
        // the centred helmet fully inside the frame for the whole animation.
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* Restrained purple top / navy bottom grade — the footage keeps its own colour */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[24px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(124,44,255,0.28) 0%, rgba(124,44,255,0.06) 18%, rgba(2,6,17,0) 52%, rgba(2,6,17,0.55) 84%, rgba(2,6,17,0.88) 100%)",
        }}
      />
      {/* Faint cyan edge glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[24px]"
        style={{
          boxShadow:
            "inset 0 0 34px -14px rgba(34,211,238,0.42), inset 0 0 46px -20px rgba(124,44,255,0.45)",
        }}
      />

      {/* Unobtrusive section label — no product data, no CTA */}
      <span
        dir="rtl"
        className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-[rgba(139,92,246,0.45)] bg-[rgba(2,6,17,0.55)] px-2.5 py-1 text-[11px] font-bold text-ink-text/90 backdrop-blur-[2px]"
      >
        تجربة مستقبلية
      </span>
    </section>
  );
}
