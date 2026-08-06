/**
 * Shared motion tokens. Keeping durations/easings in one place stops the
 * storefront from drifting into inconsistent, ad-hoc animation timing.
 */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  micro: 0.12,
  fast: 0.22,
  base: 0.42,
  slow: 0.6,
} as const;

/** Spring used to smooth scroll-linked progress values (weighted feel). */
export const SCROLL_SPRING = { stiffness: 140, damping: 30, mass: 0.35 } as const;

/** Stagger between neighbouring cards, capped so long lists never feel slow. */
export const STAGGER_STEP = 0.045;
export const STAGGER_MAX_INDEX = 6;

export const staggerDelay = (index = 0) =>
  Math.min(index, STAGGER_MAX_INDEX) * STAGGER_STEP;
