# Visual QA Plan — INDEXES Store Homepage

Purpose: make homepage verification repeatable and evidence-based. No storefront change is
"done" until this plan has been executed for every required viewport and the evidence is
stored in `docs/design-reference/qa/`.

## Artifacts produced per viewport

| Artifact                  | Filename pattern                    | Description                                                                   |
| ------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Reference screenshot      | `<role>-<W>x<H>-reference.png`      | The canonical V1 PNG scaled (not cropped) to the target width                 |
| Implementation screenshot | `<role>-<W>x<H>-implementation.png` | Live app capture at the exact viewport, application viewport only             |
| Side-by-side              | `<role>-<W>x<H>-sidebyside.png`     | Reference left / implementation right, same scale, shared baseline            |
| Overlay                   | `<role>-<W>x<H>-overlay.png`        | Implementation over reference at 50 % opacity, aligned on the header top edge |
| Diff notes                | `<role>-<W>x<H>-notes.md`           | Measured differences and remaining mismatches                                 |

`<role>` is `mobile` for Reference A viewports and `commerce` for Reference B viewports.

## Capture rules

- Application viewport only. No browser chrome, no Lovable editor UI, no device frame, no OS status bar.
- Headless Chromium, `deviceScaleFactor: 2`, `prefers-reduced-motion: no-preference`.
- Wait for network idle plus 2 s for WebGL/textures before capture.
- Scroll position must be explicit and recorded (immersive captures at `scrollY = 0`; commerce captures at the scroll offset where the exclusive-offers banner is fully settled).
- Never `full_page: true` — capture the viewport box.

## Required viewports

| Role     | Viewport    | Governing reference              |
| -------- | ----------- | -------------------------------- |
| mobile   | 360 × 800   | INDEXES-HOME-IMMERSIVE-MOBILE-V1 |
| mobile   | 375 × 812   | INDEXES-HOME-IMMERSIVE-MOBILE-V1 |
| mobile   | 390 × 844   | INDEXES-HOME-IMMERSIVE-MOBILE-V1 |
| mobile   | 412 × 915   | INDEXES-HOME-IMMERSIVE-MOBILE-V1 |
| commerce | 768 × 1024  | INDEXES-HOME-COMMERCE-V1         |
| commerce | 1024 × 1536 | INDEXES-HOME-COMMERCE-V1         |
| commerce | 1366 × 768  | INDEXES-HOME-COMMERCE-V1         |
| commerce | 1440 × 900  | INDEXES-HOME-COMMERCE-V1         |

## Measured differences (recorded for every viewport)

For each section (header, announcement, store identity, planet, hero copy, AI panel, trust
panel, offers banner, categories, best offers, trust strip, loyalty, bottom nav) record:

- element x/y position delta (px)
- width/height delta (px and %)
- vertical gap between sections (px)
- font size, weight and line-height delta
- planet/globe diameter as % of container width
- product tile placement and count
- corner radius
- background/border/glow color sampling
- total section height

## Pass / fail criteria

Pass when, at every required viewport:

- Section order matches the contract exactly, with no unrelated sections inserted.
- Position deltas ≤ 8 px and size deltas ≤ 4 % for every listed element.
- Vertical section gaps within ±4 px of the reference proportion.
- Planet/globe diameter within ±5 % of the reference proportion; globe occupies 45–55 % of banner width at ≥ 768 px.
- Corner radii match within 2 px; sampled colors within ΔE ≤ 5.
- No horizontal overflow, no clipped planet or product tile, no element overlap.
- Bottom navigation covers no content.
- Text remains legible over the planet (contrast ≥ 4.5:1 for body copy).
- No console errors, no duplicate WebGL canvas, no hydration mismatch.

Fail on any single violation. Fix and re-capture; do not waive a criterion without an entry in
`docs/design-reference/DEVIATIONS.md` carrying explicit user approval.

## Loop

1. Capture reference + implementation.
2. Build side-by-side and overlay.
3. Record measured differences.
4. Correct the implementation.
5. Repeat until pass criteria are met.
6. Commit the final evidence set to `docs/design-reference/qa/` and list remaining mismatches in the report.
