import { useEffect, useState } from "react";

export type WebglQuality = {
  tier: "low" | "mid" | "high";
  /** Renderer DPR clamp. Single-value tuple keeps the renderer stable. */
  dpr: [number, number];
  /** Visible product tiles on the globe. */
  tiles: number;
  /** Data-point count for the world layer. */
  points: number;
  /** Base segment budget for shells and orbit rings. */
  segments: number;
  /** Continuous atmosphere pulse (decorative only). */
  pulse: boolean;
  supported: boolean;
  reduced: boolean;
};

type Budget = Omit<WebglQuality, "supported" | "reduced">;

const LOW: Budget = {
  tier: "low",
  dpr: [1, 1],
  tiles: 18,
  points: 1200,
  segments: 96,
  pulse: false,
};
const MID: Budget = {
  tier: "mid",
  dpr: [1, 1.25],
  tiles: 24,
  points: 1800,
  segments: 128,
  pulse: true,
};
const HIGH: Budget = {
  tier: "high",
  dpr: [1, 1.5],
  tiles: 30,
  points: 2800,
  segments: 192,
  pulse: true,
};

function detect(): WebglQuality {
  if (typeof window === "undefined") {
    return { ...MID, supported: true, reduced: false };
  }

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const cores =
    (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  let supported = true;
  let weakGpu = false;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    supported = !!gl;
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? "") : "";
      weakGpu = /swiftshader|llvmpipe|software|mali-4|adreno \(tm\) 3/i.test(renderer);
    }
  } catch {
    supported = false;
  }

  // Quality is never decided by viewport width alone.
  let base = HIGH;
  if (coarse) base = cores >= 6 && memory >= 4 ? MID : LOW;
  else if (cores <= 4 || memory <= 4) base = MID;
  if (weakGpu) base = LOW;
  if (reduced) base = { ...base, pulse: false };

  return { ...base, supported, reduced };
}

/**
 * Device-aware WebGL budget: pointer type, cores, memory, GPU, reduced-motion
 * and measured frame stability. Only counts change between tiers — the layered
 * material composition of the globe is identical in every mode, so the globe
 * can never visually switch appearance mid-scroll.
 */
export function useWebglQuality(): WebglQuality {
  const [q, setQ] = useState<WebglQuality>(() => ({ ...MID, supported: true, reduced: false }));

  useEffect(() => {
    setQ(detect());
  }, []);

  // Downgrade at most once if measured frame stability is poor (sampled).
  useEffect(() => {
    if (typeof window === "undefined" || q.tier === "low") return;
    let frames = 0;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      frames += 1;
      if (performance.now() - start < 1200) raf = requestAnimationFrame(tick);
      else {
        const fps = (frames / (performance.now() - start)) * 1000;
        if (fps < 40)
          setQ((prev) =>
            prev.tier === "low"
              ? prev
              : { ...LOW, supported: prev.supported, reduced: prev.reduced },
          );
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [q.tier]);

  return q;
}
