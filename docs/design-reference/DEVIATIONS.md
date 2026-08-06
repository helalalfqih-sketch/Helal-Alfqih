# DEVIATIONS — INDEXES Storefront Home

Only user-approved deviations from the V1 references / GEOMETRY_LOCK are listed here.
Anything not listed is a bug, not a deviation.

## D-001 — Desktop breakpoint moved from 1024 px to 768 px
- Reference: `INDEXES-HOME-COMMERCE-V1`
- Approved by the user (2026-08-05): "شفت المشكلة… معاينتك بعرض 834px" — the user's
  preview pane is 834 px wide and required the desktop composition there.
- Change: `use-desktop.tsx`, `scroll-globe-hero.tsx` and the `lg:` → `md:` utilities in
  `app-shell.tsx`, `index.tsx`, `neon-product-card.tsx`, `desktop-hero.tsx`.
- Not changed: every locked dimension. The same desktop geometry simply starts earlier.
- Evidence: `qa/desktop-1280-responsive-pass.png`, `qa/mobile-390-geometry-pass.png`.

## D-002 — Container width raised to `max-w-7xl` (1280 px)
- Reference: `INDEXES-HOME-COMMERCE-V1` (measured at a 952 px content column)
- Approved by the user (2026-08-05): explicit request for `max-w-7xl` in
  `src/components/store-theme-layout.tsx` for both `<header>` and `<main>`.
- Change: content column may now grow to 1280 px; internal ratios per section unchanged.

## D-003 — Bottom padding 110 px → `calc(118px + env(safe-area-inset-bottom))`
- Reference: `INDEXES-HOME-IMMERSIVE-MOBILE-V1` acceptance criterion
  "bottom nav never covers content".
- Approved by the user (2026-08-05) in the "FINAL VISUAL POLISH PASS" request, item 4.
- Change: `store-theme-layout.tsx` only. No section geometry affected.

## D-004 — Duplicate controls removed from the header / identity row
- Approved in the same polish pass, item 1: scan button and the duplicated search/cart
  shortcuts were removed so store identity, search and cart appear exactly once.
- Deviates from Reference A, which shows the scan icon and the identity-row shortcuts.
