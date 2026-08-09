# Phase 2 — Homepage Audit & Implementation Plan (for approval)

Status: **audit only — no application file was modified.**
References: `INDEXES-HOME-IMMERSIVE-MOBILE-V1` (A), `INDEXES-HOME-COMMERCE-V1` (B).

---

## 1. Section-by-section mapping

| # | Contract section | Reference | Current implementation | Verdict |
|---|---|---|---|---|
| 1 | Premium header | B (in A the top bar is mobile **browser chrome**, not app UI) | `src/components/app-shell.tsx` → `TopBar` (LTR grid menu·scan·search·bell·cart, 64/72 px) | Keep · tune |
| 2 | Shipping announcement | A + B | `src/routes/index.tsx:89-100` | Keep · tune (values hard-coded) |
| 3 | Store identity | A | `scroll-globe-hero.tsx:141-174` `StoreIdentity` | Keep · tune |
| 4 | Immersive globe hero | A | `scroll-globe-hero.tsx` + `product-sphere-hero.tsx` (`ProductGlobeCanvas`) | Keep · enhance |
| 5 | AI smart-search panel | A | `home/ai-search-panel.tsx` | Keep · tune (chips hard-coded) |
| 6 | Trust-benefits panel | A | `home/trust-strip.tsx` (`stacked`) | Keep · tune (copy hard-coded) |
| 7 | Scroll transition | A→B | `scroll-globe-hero.tsx` (sticky stage, TRAVEL=340, framer-motion) | Keep · calibrate |
| 8 | Exclusive-offers banner | B | `home/exclusive-offers-banner.tsx` (`OfferContent`/`BannerBackdrop`/`BannerDots`) | Keep · rebuild proportions |
| 9 | Category navigation | B | `index.tsx:108-138` inline + `motion/snap-rail` | Extract · tune |
| 10 | Best-offers products | B | `index.tsx:141-167` + `home/neon-product-card.tsx` | Keep · tune |
| 11 | Trust strip | B | `home/trust-strip.tsx` (`inline`) | Keep · tune |
| 12 | INDEXES loyalty | B | `index.tsx:176-214` inline | Extract · rebuild |
| 13 | Other CMS sections | — | none rendered | N/A |
| 14 | Footer | — | `components/site-footer.tsx` via AppShell | Keep |
| 15 | Fixed bottom nav | A + B | `app-shell.tsx` → `BottomNav` | Keep · verify |

Orphan component: `src/components/home/cinematic-motion-showcase.tsx` (helmet showcase) — **already not rendered** on the homepage. Leave the file in place, unreferenced, per the contract (only render if enabled as a separate CMS section after required content).

### Notable audit finding
The top bar in Reference A (`indexes-store.vercel.app`, tab/URL row) is **mobile browser chrome**, not application UI. Reference A's first app element is the shipping strip; the store identity row (cart + search squares on the left, name/tagline/logo on the right) is the app's in-page identity. The app header proper is specified by **Reference B**. The current build already matches this reading. I will not add a duplicate header to the mobile immersive view.

---

## 2. Reusable vs rebuild

**Reuse as-is:** `app-shell.tsx` (TopBar/BottomNav), `site-footer.tsx`, `motion/*` (reveal, snap-rail, fade-image, motion-tokens), `lib/queries/catalog.ts`, `neon-product-card.tsx`, `home-skeletons.tsx`, `main-menu.tsx`, `cart-store`, `whatsapp.ts`.

**Enhance in place:** `product-sphere-hero.tsx` (planet surface detail, orbital trails, tile depth/margins), `scroll-globe-hero.tsx` (geometry + timeline calibration), `ai-search-panel.tsx`, `trust-strip.tsx`, `exclusive-offers-banner.tsx`, `hero-copy.tsx`.

**Extract from `index.tsx` into components** (no behaviour change): category rail → `home/category-rail.tsx`; best-offers rail → `home/best-offers-rail.tsx`; loyalty card → `home/loyalty-card.tsx`; shipping strip → `home/shipping-strip.tsx`. This is required to make per-section visual QA and future edits safe.

---

## 3. Database dependencies (verified against the live database)

Tables present: `products`, `categories`, `profiles`, `cart_items`, `orders`, `order_items`, `order_status_history`, `inventory_movements`, `tenants`, `tenant_members`, `user_roles`.

Measured facts:
- 651 published products; **all 651 have at least one image** — globe/product media supply is healthy.
- **376 products have no `category_id`** — category rail is fine (8 active categories) but category landing pages are thin.
- **Only 4 published products have a valid `old_price > price`** — the "أفضل العروض" rail therefore falls back to best-sellers, and genuine discount badges are nearly absent. The reference shows 15–30 % badges on every card; with real data this will not reproduce. **This is a data gap, not a layout gap.**
- **Only 8 products have `rating > 0` and `reviews_count > 0`** — most cards will legitimately render without a rating row.

Tables that do **not** exist (needed to remove the remaining hard-coded values):
- storefront settings (shipping threshold, return window, warranty, support hours)
- promotions (banner title, max discount, CTA target, carousel slides)
- loyalty (points, level, progress)
- AI search suggestions / trending terms

**Proposal:** Phase 3 keeps the current literals exactly as-is (no visual change) and centralises them in one typed module `src/lib/storefront-config.ts` with a documented TODO per value, so a later phase swaps the module's internals for DB reads without touching any component. Creating those tables is **out of scope for Phase 3** unless you approve it separately.

---

## 4. WebGL risks

- One `ProductGlobeCanvas` instance only; it must stay mounted across the whole scroll transition (any change that moves the canvas between two JSX parents remounts it and reloads every texture).
- Canvas box is a fixed pixel square inside a scaled parent — scaling the measured box double-shrinks the drawing buffer. Must not be refactored into a percentage box.
- Texture budget comes from `src/lib/use-webgl-quality.ts` (12/16/20 tiles by tier). Raising tile counts for reference density directly raises texture memory on mid-range Android.
- Product images are fetched through `src/routes/api/public.image-proxy.ts` for CORS; sandbox occasionally returns 402 for some upstream hosts, so QA must tolerate a partial tile set without failing the layout.
- Fallbacks required: no-WebGL static hero, `prefers-reduced-motion` branch (already present in `scroll-globe-hero.tsx:239-267` and must be kept in sync with any geometry change).

---

## 5. File-by-file implementation plan (Phase 3)

| # | File | Action | Detail |
|---|---|---|---|
| 1 | `src/lib/storefront-config.ts` | **create** | Typed constants for shipping threshold/currency, return days, warranty, support, promo (title/max discount/CTA), AI chips. Values identical to today. Documented future data source per field. |
| 2 | `src/components/home/shipping-strip.tsx` | **create** | Extract from `index.tsx:89-100`, read from config. Match A/B: two items, single line, 44/50 px. |
| 3 | `src/components/home/category-rail.tsx` | **create** | Extract `index.tsx:108-138`. Ref B geometry: 6 uniform tiles, equal gaps, glow border, RTL order, `المزيد` tile on mobile only. |
| 4 | `src/components/home/best-offers-rail.tsx` | **create** | Extract `index.tsx:141-167`. Heading + `عرض الكل`, equal card heights, 4-up at ≥1024 px. |
| 5 | `src/components/home/loyalty-card.tsx` | **create** | Extract `index.tsx:176-214`; rebuild to Ref B layout (gem left, copy centre, points panel right with level + progress). Real/empty state only — no invented points. |
| 6 | `src/routes/index.tsx` | **edit** | Compose sections 1→15 in contract order; keep loader/query/head; remove inline markup moved into 2–5. |
| 7 | `src/components/home/trust-strip.tsx` | **edit** | Copy from config. `stacked` = Ref A 4-across card; `inline` = Ref B 4-across strip; both must stay 4-across down to 360 px (currently stacks on mobile). |
| 8 | `src/components/home/ai-search-panel.tsx` | **edit** | Chips from config; verify glass border, glow, robot badge, internal spacing against Ref A. Search flow unchanged. |
| 9 | `src/components/home/hero-copy.tsx` | **edit** | Type scale, line-height, CTA size and dot-indicator placement to Ref A measurements. |
| 10 | `src/components/home/exclusive-offers-banner.tsx` | **edit** | Ref B proportions: copy column left, globe 45–55 % of banner width at ≥768 px, `50%` dominant, dots centred, radius/lighting matched. Promo values from config. |
| 11 | `src/components/product-sphere-hero.tsx` | **edit** | Planet surface detail (map/technical dots), purple+electric-blue rim light, cyan highlight, orbital trails, depth-scaled tiles, safe margins, no clipping. Texture budget unchanged. |
| 12 | `src/components/home/scroll-globe-hero.tsx` | **edit** | Recalibrate geometry/timeline after 7–11; keep single canvas, keep reduced-motion branch in sync. |
| 13 | `src/components/app-shell.tsx` | **edit (minimal)** | Verify 44 px targets, RTL order, bottom padding `calc(nav + safe-area)`, no overlap at 360 px. Only fix measured deviations. |
| 14 | `src/lib/use-webgl-quality.ts` | **edit if needed** | Only if planet detail requires a different tile/texture budget. |
| 15 | `scripts/visual-qa.mjs` (or `.py`) | **create** | Playwright capture/overlay per `VISUAL_QA_PLAN.md`, writes into `docs/design-reference/qa/`. |
| 16 | `docs/design-reference/qa/*` | **create** | Evidence for all 8 viewports. |
| 17 | `docs/design-reference/DEVIATIONS.md` | **create if needed** | Only for deviations you approve. |

Not touched: routing, auth, cart/checkout logic, server functions, database schema, admin, CMS behaviour, product/category data flows.

### Engineering checks to run before reporting
`tsgo` typecheck · ESLint (if a script exists in `package.json`) · `bunx vitest run` · production build. Results reported verbatim, including failures.

### Known constraints to acknowledge up front
- Branch creation, Pull Requests and Vercel Preview are outside my control here (git state is managed by Lovable, and this project deploys through Lovable hosting). I can produce the full diff and QA evidence; the PR/preview steps need to happen on your side or you tell me how to proceed.
- Discount badges and ratings will appear on far fewer cards than in Reference B until offer/rating data exists — geometry will match, density will not.

---

## 6. Approval requested

Please approve: (a) this file-by-file plan, (b) the `storefront-config.ts` approach for hard-coded values, and (c) whether Phase 3 may also create the settings/promotions/loyalty tables or must defer them.
