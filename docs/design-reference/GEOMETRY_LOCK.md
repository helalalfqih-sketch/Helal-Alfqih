# GEOMETRY LOCK — INDEXES Storefront Home (V1)

Status: **LOCKED**. Locked on 2026-08-05.

The two canonical references are treated as an engineering blueprint:

- `indexes-home-immersive-mobile-v1.png` (immersive first viewport)
- `indexes-home-commerce-v1.png` (commercial page + desktop)

## Rules (non-negotiable)

1. No redesign. No reinterpretation of composition, hierarchy, spacing, color or type.
2. Every value in the tables below is **frozen**. Once a section is approved, its
   ratios are never touched again while working on a later section.
3. A later change must not move, resize or restyle any already-approved element.
   If a fix appears to require it, stop and ask the user first.
4. Any approved deviation is recorded in `DEVIATIONS.md` with reason, reference ID
   and before/after screenshots.
5. Every storefront change ships visual comparison evidence in `docs/design-reference/qa/`
   at 390 / 430 / 1024 px, application viewport only.

## Locked constants — source of truth per file

### A. Immersive hero — `src/components/home/scroll-globe-hero.tsx`

| Token                     | Value                         | Meaning                                   |
| ------------------------- | ----------------------------- | ----------------------------------------- |
| `HEADER_SM` / `HEADER_LG` | 64 / 72 px                    | sticky header height                      |
| `IDENTITY_H`              | 56 px                         | store identity row                        |
| `GLOBE_GAP`               | 4 px                          | identity → globe                          |
| `PROJECTION`              | 0.872                         | sphere diameter = 87.2% of viewport width |
| `AI_H`                    | 140 px                        | AI search panel                           |
| `TRUST_H`                 | 76 px                         | trust strip                               |
| `PANEL_GAP`               | 8 px                          | between the closing panels                |
| `NAV_RESERVE`             | 86 px (+34 at ≥1024)          | floating bottom nav reserve               |
| compact globe             | ⌀ 204 px, 10.5 px right inset | released state, globe RIGHT / text LEFT   |

### B. Hero copy + CTA — `src/components/home/hero-copy.tsx`

| Element    | Value                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------- |
| brand pill | 11 px bold, tracking 4 px, `px-3 py-1`                                                          |
| title      | `clamp(23px, 6.4vw, 38px)`, line-height 1.16, `mt-2.5`                                          |
| subtitle   | `clamp(11px, 3.1vw, 15px)`, `mt-1`                                                              |
| CTA        | h `clamp(38px,10.2vw,50px)`, w `clamp(150px,41vw,230px)`, text `clamp(13px,3.5vw,17px)`, `mt-4` |
| CTA icon   | 15 × 15 px                                                                                      |
| dots row   | `mt-5`                                                                                          |

### C. Categories rail — `src/routes/index.tsx`

| Element | Value                                                                       |
| ------- | --------------------------------------------------------------------------- |
| card    | 90 × 104 px mobile, 96 px wide ≥640, 116 px tall ≥1024 (flex-1, six across) |
| icon    | 36 × 36 px (48 × 48 ≥1024), stroke 1.4                                      |
| label   | 13 px / 16 px ≥1024, 2-line clamp                                           |
| gap     | 10 px mobile, 16 px ≥1024                                                   |
| radius  | `rounded-2xl`                                                               |

### D. Product card — `src/components/home/neon-product-card.tsx`

| Element     | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| card        | height 328 px (fixed)                                       |
| image box   | height 138 px                                               |
| title block | height 36 px, 12.5 px bold, 18 px line-height, 2-line clamp |

### E. Cinematic video — `src/components/home/cinematic-motion-showcase.tsx`

| Viewport  | Box                       |
| --------- | ------------------------- |
| < 430 px  | height 300 px, full width |
| ≥ 430 px  | 398 × 320 px              |
| ≥ 1024 px | height 420 px             |

Object-fit `cover`, poster preloaded, intersection play/pause (200 px margin), never remounts.

### F. Page flow

Section order: Header → Shipping strip → Immersive/Compact globe → Video →
Categories → Products → Trust → Loyalty → Footer.
Vertical rhythm: **16 px** between sections. Bottom padding:
`calc(110px + env(safe-area-inset-bottom))`.

## Change protocol

Before editing any storefront file:

1. Read this document and `VISUAL_IMPLEMENTATION_CONTRACT.md`.
2. Identify the single section being changed.
3. Confirm no constant from another section is touched by the diff.
4. Capture QA screenshots at 390 / 430 / 1024 and store them under `qa/`.

---

# APPENDIX 1 — Commercial sections (Reference B), locked 2026-08-05

Measured at 1024 px (content column 952 px). Mobile values from Section A–F above
are unchanged. Appended only; no earlier value was edited.

### 1. Exclusive-offers banner — LOCKED

| Metric      | Value                                                               |
| ----------- | ------------------------------------------------------------------- |
| banner box  | 952 × 374 px (h/w = 0.393), radius 24 px                            |
| composition | LTR grid: copy left column, globe right column, no overlap          |
| copy inset  | 64 px from the left edge, vertically centred                        |
| copy block  | width 300 px; title 44 px; subtitle 26 px; “50%” 112 px             |
| CTA         | 190 × 56 px, 21 px text, pill radius                                |
| globe       | ⌀ 322 px sphere (86% of banner height), centred in the right column |
| dots        | 4 × 8 px, centred, 12 px above the bottom edge                      |

### 2. Category rail — LOCKED

6 visible cards at 1024: 145 × 116 px each, 16 px gaps (6×145 + 5×16 = 950 of 952),
icon 48 × 48 px stroke 1.4, label 16 px, radius 16 px, RTL order right→left,
14 px section gap above and below. No clipped or oversized card.

### 3. Best-offers cards — LOCKED

4 visible cards at 1024: 229 × 328 px, 12 px gaps, radius 20 px, 12 px padding.
Badge row 28 px (discount right / favourite left in RTL), image area 229-24 × 138 px,
title 36 px (2 lines), rating row **always reserved at 16 px** even without rating data,
price row centred, add-to-cart pinned at the bottom, height 44 px. Equal baselines.

### 4. Commercial trust strip — LOCKED

952 × 78 px, radius 16 px, 4 equal columns, vertical dividers between columns,
icon 36 × 36 px, title 16 px bold, subtitle 13 px muted, 8 px horizontal padding.
Separate component instance from the locked 76 px mobile hero trust panel.

### 5. Loyalty card — LOCKED

952 × 176 px, radius 24 px, padding 16 px / 20 px horizontal.
RTL order: points/status panel right (38% width), copy + CTA centre, gem 126 × 126 px left.
Title 18 px, description 13 px, CTA pill 12 px text.
Truthful state only: signed-out shows a sign-in prompt, signed-in with no records shows
“no points data yet”. No invented points or tier.

### 6. Footer — LOCKED

Panel 952 × ~151 px inside a 183 px footer block, radius 24 px, padding 16/20 px.
RTL columns: logo badge 104 px circle (right, 132 px column) → contact list (flex-1,
13 px, 10 px row gap) → contact CTA + social row (190 px, left).
Unconfigured values (social profiles) are hidden, not stubbed.
Copyright line 10 px, separated by a 1 px rule.

### Regression check (this pass)

- 390 × 844: hero globe, AI panel, trust panel, spacing and bottom nav unchanged.
- No horizontal overflow at 390 / 430 / 1024 (`scrollWidth === innerWidth`).
- Footer bottom 1390 px vs bottom-nav top 1404 px at 1024; 734 px vs 762 px at 390 — no overlap.
- Evidence: `qa/commercial-1024-sections-pass.png`, `qa/commercial-390-regression-check.png`.

---

# CORRECTION 1 — Product-card height (supersedes Appendix 1 §3), 2026-08-05

Appendix 1 §3 locked the desktop card at 328 px. That value was inherited from the
mobile rail and never verified against Reference B. Pixel measurement of
`indexes-home-commerce-v1.png` (1024 px wide, native scale, first card in the
"أفضل العروض" rail) disproves it.

### Measurement comparison (desktop, Reference B)

| Metric                | Reference B (measured)                 | Previous lock      | Corrected lock                 |
| --------------------- | -------------------------------------- | ------------------ | ------------------------------ |
| card outer box        | x 34→265, y 774→1172 = **231 × 398**   | 229 × 328          | 229 × 394                      |
| aspect h/w            | 1.723                                  | 1.432              | 1.721                          |
| inner padding         | 12 px                                  | 12 px              | 12 px                          |
| badge / favourite row | y 786→812 = 28 px                      | 28 px              | 28 px                          |
| image area            | y 812→988 = **176 px**                 | 138 px             | 176 px                         |
| title block (2 lines) | y 990→1040 = 50 px, ~22 px line        | 36 px (18 px line) | 44 px (22 px line, 14 px font) |
| rating row            | y 1050→1066 = 16 px                    | 16 px              | 16 px (always reserved)        |
| price row             | y 1080→1102 = 22 px                    | 22 px              | 22 px                          |
| CTA button            | y 1113→1159 = **46 px**, bottom-pinned | 44 px              | 44 px (kept; within 2 px)      |
| padding below CTA     | 1172 − 1159 = 13 px                    | 12 px              | 12 px                          |

Card width 229 (locked) × reference aspect 1.723 = 394.6 → **394 px**.

### Corrected locked values

- Desktop (≥1024): card 229 × **394**, image area **176**, title block **44**
  (14 px / 22 px line-height), rating 16, price 22, CTA 44 bottom-pinned, padding 12.
- Mobile (<1024): unchanged from Section A — card height 328, image 138, title 36.
  Reference A governs the mobile rail; that lock is not affected.

Reason for the change: an incorrect measurement, not a redesign. Composition,
element order, typography scale ratios, colors and spacing rules are untouched.

---

# RE-AFFIRMATION — 2026-08-05 (user instruction)

The user re-confirmed the blueprint rule: the two references are an engineering
blueprint; every section ratio is frozen and a later section may never move,
resize or restyle an earlier approved one.

### Verification of the code against the lock (this pass, no code changed)

| Locked value                                           | File                    | Found |
| ------------------------------------------------------ | ----------------------- | ----- |
| HEADER_SM 64 / HEADER_LG 72                            | `scroll-globe-hero.tsx` | ✅    |
| IDENTITY_H 56 · GLOBE_GAP 4 · PANEL_GAP 8              | `scroll-globe-hero.tsx` | ✅    |
| PROJECTION 0.872                                       | `scroll-globe-hero.tsx` | ✅    |
| AI_H 140 · TRUST_H 76 · NAV_RESERVE 86 (+34 desktop)   | `scroll-globe-hero.tsx` | ✅    |
| product card 328 mobile / 394 desktop, image 138 / 176 | `neon-product-card.tsx` | ✅    |

No constant was edited in this pass.

### Open deviations

Recorded in `DEVIATIONS.md`: D-001 desktop breakpoint 768 px, D-002 container
`max-w-7xl`, D-003 bottom padding 118 px, D-004 duplicate header controls removed.
All four were explicitly requested by the user; none changes a per-section ratio.

### Standing protocol for every future storefront edit

1. Name the single section being changed before editing.
2. Diff-check that no constant from another section appears in the diff.
3. If a fix seems to require touching an approved constant — stop and ask first.
4. Ship QA screenshots at 390 / 430 / 1024 px into `qa/`.
