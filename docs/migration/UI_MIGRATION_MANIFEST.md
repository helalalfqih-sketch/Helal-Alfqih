# UI Migration Manifest — target: helalalfqih-sketch/indexes_store

Scope: **frontend / presentation only**. No database, Supabase, auth, server
functions or business logic files are included.

## 1. Homepage

- `src/routes/index.tsx` — storefront home composition (immersive hero → commerce sections)

## 2. Layout / shell

- `src/components/app-shell.tsx` — TopBar, BottomNav, page padding, container widths
- `src/components/store-theme-layout.tsx` — `max-w-7xl` (1280px) header/main container
- `src/components/site-footer.tsx`
- `src/components/main-menu.tsx`
- `src/routes/__root.tsx` — head metadata, Toaster mount, global providers wiring (UI parts only)

## 3. Home components

- `src/components/home/scroll-globe-hero.tsx` — scroll-linked globe transform + geometry
- `src/components/home/desktop-hero.tsx`
- `src/components/home/hero-copy.tsx`
- `src/components/home/ai-search-panel.tsx`
- `src/components/home/trust-strip.tsx`
- `src/components/home/exclusive-offers-banner.tsx`
- `src/components/home/neon-product-card.tsx`
- `src/components/home/cinematic-motion-showcase.tsx`
- `src/components/home/home-skeletons.tsx`

## 4. 3D / WebGL presentation

- `src/components/product-sphere-hero.tsx` — 5-layer material globe, rim light, halo
- `src/components/webgl-hero.tsx`
- `src/components/cinematic-story.tsx`
- `src/components/product-3d-viewer-card.tsx`
- `src/lib/use-webgl-quality.ts` — quality budgets / tile density (presentation constant)

## 5. Motion system

- `src/components/motion/motion-tokens.ts`
- `src/components/motion/reveal.tsx`
- `src/components/motion/snap-rail.tsx`
- `src/components/motion/page-transition.tsx`
- `src/components/motion/fade-image.tsx`

## 6. Shared UI

- `src/components/product-card.tsx`
- `src/components/ui/*` — shadcn primitives touched by the theme (button, card, badge, sonner)

## 7. Hooks (viewport only)

- `src/hooks/use-desktop.tsx` — 768px desktop threshold
- `src/hooks/use-mobile.tsx`

## 8. Styles

- `src/styles.css` — neon-dark tokens, Astryx `@layer` imports, Tailwind theme
- Astryx packages required in `package.json`: `@astryxdesign/core`, `@astryxdesign/theme-neutral`

## 9. Assets

- `src/assets/hero-globe-promo.jpg`
- `src/assets/hero-neon-cart.jpg`
- `src/assets/loyalty-gem.png`
- `src/assets/noqta-logo.png`
- `src/assets/showroom-bg.jpg`
- `src/assets/indexes-store-bg.jpg.asset.json`
- `src/assets/reference/*.asset.json`

## 10. Design reference docs (ship with the UI)

- `docs/design-reference/REFERENCE_MANIFEST.md`
- `docs/design-reference/VISUAL_IMPLEMENTATION_CONTRACT.md`
- `docs/design-reference/GEOMETRY_LOCK.md`
- `docs/design-reference/DEVIATIONS.md`
- `docs/design-reference/VISUAL_QA_PLAN.md`
- `docs/design-reference/indexes-home-immersive-mobile-v1.png`
- `docs/design-reference/indexes-home-commerce-v1.png`

---

## Explicitly excluded

- `supabase/`, all migrations, RLS/policies
- `src/integrations/supabase/*`
- `src/lib/*.functions.ts`, `src/lib/*.server.ts`, `src/lib/actions/*`,
  `src/lib/services/*`, `src/lib/repositories/*`, `src/lib/domain/*`, `src/lib/seed*`
- `src/routes/api/*`, `src/routes/auth.tsx`, `src/routes/admin*.tsx`, `src/routes/checkout.tsx`
- `src/components/cart-sync-provider.tsx`, `src/components/tenant-provider.tsx`, `src/lib/cart-store.ts`
- `.env`, keys, `src/start.ts` auth middleware

## Porting notes

1. Copy styles first (`src/styles.css` + Astryx deps), then layout, then home components.
2. Home components read products through `src/lib/queries/catalog.ts` in this project —
   in the target repo, rewire those imports to its own data layer; the components
   themselves take plain props/queries and contain no business rules.
3. Keep the 768px desktop breakpoint and the 1280px container together — they were
   calibrated as a pair.
