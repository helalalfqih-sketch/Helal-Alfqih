# Visual Implementation Contract — INDEXES Store Homepage

1. **Source of truth.** `docs/design-reference/indexes-home-immersive-mobile-v1.png`
   (`INDEXES-HOME-IMMERSIVE-MOBILE-V1`) and `docs/design-reference/indexes-home-commerce-v1.png`
   (`INDEXES-HOME-COMMERCE-V1`) are the approved visual specification for the storefront homepage.
2. **Comparison is mandatory.** Every homepage edit must be visually compared against the
   relevant reference at the target viewports before it is considered done.
3. **No subjective redesign.** Do not reinterpret, simplify, "improve" or replace the
   composition, hierarchy, spacing, colors, lighting or typography of the references.
4. **No layout deviation without explicit user approval.**
5. **Future agents must read this contract**, the `REFERENCE_MANIFEST.md` and both reference
   PNGs before changing any storefront UI file.
6. **Reference files must never be deleted** during cleanup, refactoring or asset migration.
   They are documentation, not build assets, and are excluded from any pruning task.
7. **Real data, fixed geometry.** Product, category, price, rating, cart and loyalty content
   comes from the live database and may differ from the reference imagery. Component geometry,
   proportions and presentation must remain faithful regardless of the data shown.
8. **Documented deviations only.** Any intentional deviation must be recorded in
   `docs/design-reference/DEVIATIONS.md` with:
   - reason
   - affected reference ID
   - before screenshot
   - after screenshot
   - explicit user approval (quote or link)

## QA evidence

Screenshot evidence lives in `docs/design-reference/qa/` using the naming pattern
`<role>-<width>x<height>-implementation.png` and `<role>-<width>x<height>-overlay.png`
(e.g. `mobile-390x844-overlay.png`). QA captures must contain the application viewport only —
no browser chrome, no editor UI.

## Required viewports

360×800 · 375×812 · 390×844 · 412×915 · 711×1536 · 768×1024 · 1024×1536 · 1366×768 · 1440×900
