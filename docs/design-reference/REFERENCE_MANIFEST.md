# INDEXES Store — Visual Reference Manifest (V1, immutable)

Both files listed below are **immutable V1 assets**. They must never be cropped,
resized, recompressed, renamed, moved or deleted. A new approved design requires
**new V2 files** (`...-v2.png`) plus a new manifest entry — never an overwrite of V1.

Date added: 2026-08-05

---

## REFERENCE A — `INDEXES-HOME-IMMERSIVE-MOBILE-V1`

| Field             | Value                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| File path         | `docs/design-reference/indexes-home-immersive-mobile-v1.png`                                            |
| Stored dimensions | 853 × 1844 px (original upload described as 711 × 1536; stored bytes are the uploaded file, unmodified) |
| SHA-256           | `e49baf062c221a93d333bda1d19fcf5f828d642667f7afe35cefa21bb2d8a9e7`                                      |
| Byte size         | 1 609 052                                                                                               |
| Viewport role     | Mobile first viewport (immersive introduction), 360–430 px class devices                                |

### Sections controlled by Reference A

- Premium mobile header (menu, scan, central search field, notifications, cart with live count)
- Shipping announcement strip (30,000 ﷼ threshold, rocket icon, dark glass card)
- Store identity row (store name, verified badge, tagline, INDEXES logo, search/cart shortcuts)
- Immersive product planet (dark sphere, purple/electric-blue rim light, cyan highlights, surface detail, orbital trails, real product tiles)
- Hero copy: `INDEXES` · `آلاف المنتجات` · `جودة عالية · أسعار منافسة · توصيل سريع` · CTA `استكشف المنتجات`
- Carousel indicator dots under the planet
- AI smart-search panel (`البحث الذكي بالذكاء الاصطناعي`, description, robot icon, input, search button, suggestion chips)
- Trust-benefits panel (دعم 24/7 · إرجاع سهل · شحن مجاني · ضمان سنتين)
- Fixed bottom navigation (السلة · بحث · الرئيسية (central glow) · واتساب · حسابي)

### Visual acceptance criteria

- Planet dominates the viewport without covering header, store identity or AI panel.
- No product tile is clipped by the viewport edge; safe margins preserved.
- Hero copy stays readable over the planet (scrim allowed, glow must not wash out text).
- Header controls ≥ 44 × 44 px, RTL order preserved, no icon/text collision.
- No horizontal overflow at 360, 375, 390, 412 px widths.
- Bottom nav never covers content: `padding-bottom: calc(nav-height + env(safe-area-inset-bottom))`.

---

## REFERENCE B — `INDEXES-HOME-COMMERCE-V1`

| Field             | Value                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------- |
| File path         | `docs/design-reference/indexes-home-commerce-v1.png`                                         |
| Stored dimensions | 1024 × 1536 px                                                                               |
| SHA-256           | `e1c4f2d086e28fe61eadca52345672f2d40e35c64400cc9eddef328d31fed873`                           |
| Byte size         | 1 755 380                                                                                    |
| Viewport role     | Commercial storefront after the immersive introduction; tablet/desktop composition reference |

### Sections controlled by Reference B

- Main header with wide search bar, notifications, cart badge
- Announcement strip (fast delivery left, free shipping right)
- Exclusive-offers banner: copy left (`عروض حصرية`, `خصومات تصل إلى`, dominant `50%`, CTA `تسوق الآن`), large product globe right, carousel dots
- Category cards row (icon, label, glass card, glow border, RTL order)
- Best-offers section (`أفضل العروض` + `عرض الكل`, product cards: discount badge, favorite icon, title, rating, price, previous price, add-to-cart)
- Trust strip (four horizontal features)
- INDEXES premium loyalty panel (purple gem, points panel, level badge, progress, `اكتشف المزايا`)
- Fixed bottom navigation

### Visual acceptance criteria

- Globe occupies ~45–55 % of banner width at ≥ 768 px; keeps visual impact on mobile (never a corner icon).
- Product cards have equal heights and identical radii; badges never overlap the favorite icon.
- Category cards keep uniform width/gap and RTL ordering.
- Loyalty panel reflects **real** data or a truthful signed-out/empty state — never invented points.
- Section vertical rhythm and card corner radii match the reference.

---

## Rules

1. Both PNGs are the approved UI specification, not inspiration.
2. Hashes above must stay valid; if a hash changes, the file was modified and must be restored.
3. New design direction ⇒ add `-v2.png` files and a new manifest section. Never overwrite or delete V1.
4. Real database content may vary; component geometry and presentation must not.
