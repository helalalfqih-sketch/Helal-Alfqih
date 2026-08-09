/**
 * Shared typed CSV parser and normalizer for product catalog imports.
 * Handles RFC-4180, UTF-8 BOM, CRLF/LF, quoted commas, escaped quotes,
 * multiline quoted descriptions, and indexed Meta fields like additional_image_link[0].
 * No @ts-nocheck. No `any` types (except where noted with strict justification).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type VideoProvider = "direct" | "mux" | "youtube" | "unknown";

export type CatalogMedia =
  | {
      type: "image";
      url: string;
      sortOrder: number;
    }
  | {
      type: "video";
      url: string;
      sortOrder: number;
      tag?: string;
      provider: VideoProvider;
    };

export interface NormalizedCatalogRow {
  rowNumber: number;
  externalId: string | null;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  media: CatalogMedia[];
  sourceUrl: string | null;
  stock: number;
  availability: string | null;
  condition: string | null;
  brand: string | null;
  productType: string | null;
  sku: string | null;
  barcode: string | null;
  tags: string[];
  salePrice: number | null;
  costPrice: number | null;
}

export interface SkippedRow {
  rowNumber: number;
  externalId: string | null;
  status: "skipped";
  code: "MISSING_TITLE" | "EMPTY_ROW" | "INVALID_PRICE";
  rawTitle?: string;
}

export type ParsedRow = NormalizedCatalogRow | SkippedRow;

export interface CatalogParseResult {
  csvRows: number;
  validRows: NormalizedCatalogRow[];
  skippedRows: SkippedRow[];
  headers: string[];
}

// ─── RFC-4180 CSV Parser ──────────────────────────────────────────────────────

/**
 * Parse raw CSV text into a 2D array of strings.
 * Handles: UTF-8 BOM, CRLF/LF, quoted fields, escaped double-quotes (""),
 * multiline quoted fields, and empty trailing columns.
 */
export function parseCsvText(text: string): string[][] {
  // Strip UTF-8 BOM
  const src = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        // Escaped double-quote?
        if (src[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && src[i + 1] === "\n") i++;
        row.push(cur);
        cur = "";
        // Skip blank lines at end of file but keep empty data rows
        if (row.length > 1 || row[0] !== "") {
          rows.push(row);
        }
        row = [];
      } else {
        cur += c;
      }
    }
  }
  // Final row (no trailing newline)
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    if (row.length > 1 || row[0] !== "") {
      rows.push(row);
    }
  }
  return rows;
}

// ─── URL Validation ────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i;
const ALLOWED_VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|m4v)(\?|$)/i;

/** Returns the URL string if valid HTTPS/HTTP, otherwise null. Trims whitespace. */
export function validateMediaUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  // Reject URLs that look like prose (contain spaces outside of query params)
  const [path] = s.split("?");
  if (path.includes(" ")) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    // Prefer https - upgrade http if domain is trusted Firebase Storage
    return s;
  } catch {
    return null;
  }
}

/** Deduplicate URLs preserving source order. */
export function deduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

/** Keep the imported primary/additional ordering while retaining older media. */
export function mergeImportedImages(imported: string[], existing: string[]): string[] {
  return deduplicateUrls([...imported, ...existing]);
}

// ─── Video Provider Detection ─────────────────────────────────────────────────

const YOUTUBE_PATTERN =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const MUX_PATTERN = /^[A-Za-z0-9]{20,}$/;
const MUX_URL_PATTERN = /stream\.mux\.com|mux\.com/;
const FIREBASE_VIDEO_PATTERN = /firebasestorage\.googleapis\.com/;
const DIRECT_VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|m4v)(\?|$)/i;

export function detectVideoProvider(url: string): VideoProvider {
  if (!url) return "unknown";
  if (YOUTUBE_PATTERN.test(url)) return "youtube";
  if (MUX_URL_PATTERN.test(url)) return "mux";
  if (FIREBASE_VIDEO_PATTERN.test(url)) return "direct";
  if (DIRECT_VIDEO_EXTENSIONS.test(url)) return "direct";
  // A raw Mux playback ID (no URL structure)
  if (MUX_PATTERN.test(url) && !url.includes("/") && !url.includes(".")) return "mux";
  return "unknown";
}

// ─── Price Parsing ─────────────────────────────────────────────────────────────

/** Parse "18500.00 YER" → { price: 18500, currency: "YER" } */
export function parsePrice(raw: string): { price: number; currency: string } {
  const s = (raw || "").trim();
  if (!s) return { price: 0, currency: "YER" };
  const m = s.match(/([\d.,]+)\s*([A-Za-z]{3})?/);
  const price = m ? Number(m[1].replace(/,/g, "")) : 0;
  return {
    price: Number.isFinite(price) ? price : 0,
    currency: (m?.[2] || "YER").toUpperCase(),
  };
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export function slugify(input: string, fallback: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return base || fallback;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

/**
 * Parse a CSV text into normalized catalog rows.
 * Returns all valid rows plus an explicit skipped list.
 */
export function parseCatalogCsv(csvText: string): CatalogParseResult {
  const allRows = parseCsvText(csvText);
  if (allRows.length < 2) {
    return { csvRows: 0, validRows: [], skippedRows: [], headers: [] };
  }

  const headers = allRows[0].map((h) => h.trim());
  const dataRows = allRows.slice(1);
  const totalDataRows = dataRows.length;

  /** Get column index by exact header name */
  const col = (name: string): number => headers.indexOf(name);

  // Required columns
  const idIdx = col("id");
  const titleIdx = col("title");
  const descIdx = col("description");
  const priceIdx = col("price");
  const imageIdx = col("image_link");
  const availIdx = col("availability");
  const condIdx = col("condition");
  const linkIdx = col("link");
  const brandIdx = col("brand");
  const qtyIdx = col("quantity_to_sell_on_facebook");

  // Extended columns
  const skuIdx = col("sku");
  const barcodeIdx = headers.findIndex((h) => h === "gtin" || h === "barcode");
  const salePriceIdx = col("sale_price");
  const costPriceIdx = col("cost_price");
  const colorIdx = col("color");
  const sizeIdx = col("size");
  const gcatIdx = col("google_product_category");
  const fbcatIdx = col("fb_product_category");
  const materialIdx = col("material");
  const patternIdx = col("pattern");
  const genderIdx = col("gender");
  const ageGroupIdx = col("age_group");
  const productTypeIdx = col("product_type");

  // Collect additional_image_link[n] column indices (ordered)
  const additionalImageCols: number[] = [];
  for (let n = 0; n <= 9; n++) {
    const idx = col(`additional_image_link[${n}]`);
    if (idx >= 0) additionalImageCols.push(idx);
  }
  // Also check bare "additional_image_link" (without index)
  const bareAdditionalIdx = col("additional_image_link");
  if (bareAdditionalIdx >= 0 && !additionalImageCols.includes(bareAdditionalIdx)) {
    additionalImageCols.unshift(bareAdditionalIdx);
  }

  // Video columns
  const videoUrlIdx = col("video[0].url");
  const videoTagIdx = col("video[0].tag[0]");

  const validRows: NormalizedCatalogRow[] = [];
  const skippedRows: SkippedRow[] = [];

  for (let r = 0; r < dataRows.length; r++) {
    const rowNumber = r + 2; // 1-based, +1 for header
    const row = dataRows[r];
    if (!row || row.every((c) => !c?.trim())) continue;

    const rawId = idIdx >= 0 ? (row[idIdx] ?? "").trim() : "";
    const externalId = rawId || null;
    const rawTitle = titleIdx >= 0 ? (row[titleIdx] ?? "").trim() : "";

    if (!rawTitle) {
      skippedRows.push({
        rowNumber,
        externalId,
        status: "skipped",
        code: "MISSING_TITLE",
        rawTitle: "",
      });
      continue;
    }

    const { price: regPrice, currency: regCurrency } = parsePrice(
      priceIdx >= 0 ? (row[priceIdx] ?? "") : "",
    );
    const { price: salePrice } =
      salePriceIdx >= 0 ? parsePrice(row[salePriceIdx] ?? "") : { price: 0 };
    const { price: costPrice } =
      costPriceIdx >= 0 ? parsePrice(row[costPriceIdx] ?? "") : { price: 0 };

    let price = regPrice;
    let computedSalePrice: number | null = null;
    if (salePrice > 0 && salePrice < regPrice) {
      price = salePrice;
      computedSalePrice = regPrice;
    }

    // Build ordered image list
    const rawImages: string[] = [];
    const primaryImage = imageIdx >= 0 ? (row[imageIdx] ?? "").trim() : "";
    if (primaryImage) rawImages.push(primaryImage);
    for (const colIdx of additionalImageCols) {
      const v = (row[colIdx] ?? "").trim();
      if (v) rawImages.push(v);
    }
    const images = deduplicateUrls(
      rawImages.map((u) => validateMediaUrl(u)).filter((u): u is string => u !== null),
    );

    // Build media list (images + video)
    const media: CatalogMedia[] = images.map((url, i) => ({
      type: "image" as const,
      url,
      sortOrder: i,
    }));

    // Video
    if (videoUrlIdx >= 0) {
      const rawVideoUrl = (row[videoUrlIdx] ?? "").trim();
      const validVideoUrl = validateMediaUrl(rawVideoUrl);
      if (validVideoUrl) {
        const provider = detectVideoProvider(validVideoUrl);
        const tag = videoTagIdx >= 0 ? (row[videoTagIdx] ?? "").trim() || undefined : undefined;
        media.push({
          type: "video",
          url: validVideoUrl,
          sortOrder: images.length,
          tag,
          provider,
        });
      }
    }

    const stockRaw = qtyIdx >= 0 ? Number((row[qtyIdx] ?? "").trim()) : NaN;
    const stock = Number.isFinite(stockRaw) && stockRaw >= 0 ? Math.floor(stockRaw) : 0;

    const tags: string[] = [];
    const color = colorIdx >= 0 ? (row[colorIdx] ?? "").trim() : "";
    const size = sizeIdx >= 0 ? (row[sizeIdx] ?? "").trim() : "";
    const gcat = gcatIdx >= 0 ? (row[gcatIdx] ?? "").trim() : "";
    const fbcat = fbcatIdx >= 0 ? (row[fbcatIdx] ?? "").trim() : "";
    const material = materialIdx >= 0 ? (row[materialIdx] ?? "").trim() : "";
    const pattern = patternIdx >= 0 ? (row[patternIdx] ?? "").trim() : "";
    const gender = genderIdx >= 0 ? (row[genderIdx] ?? "").trim() : "";
    const ageGroup = ageGroupIdx >= 0 ? (row[ageGroupIdx] ?? "").trim() : "";
    if (color) tags.push(`_color:${color}`);
    if (size) tags.push(`_size:${size}`);
    if (gcat) tags.push(`_gcat:${gcat}`);
    if (fbcat) tags.push(`_fbcat:${fbcat}`);
    if (material) tags.push(`_material:${material}`);
    if (pattern) tags.push(`_pattern:${pattern}`);
    if (gender) tags.push(`_gender:${gender}`);
    if (ageGroup) tags.push(`_age:${ageGroup}`);

    const rawLink = linkIdx >= 0 ? (row[linkIdx] ?? "").trim() : "";
    // Only preserve valid HTTPS links as source_url (not prose/WhatsApp/Facebook links)
    const sourceUrl = validateMediaUrl(rawLink);

    validRows.push({
      rowNumber,
      externalId,
      title: rawTitle,
      description: descIdx >= 0 ? (row[descIdx] ?? "").trim() : "",
      price,
      currency: regCurrency,
      images,
      media,
      sourceUrl,
      stock,
      availability: availIdx >= 0 ? (row[availIdx] ?? "").trim() || null : null,
      condition: condIdx >= 0 ? (row[condIdx] ?? "").trim() || null : null,
      brand: brandIdx >= 0 ? (row[brandIdx] ?? "").trim() || null : null,
      productType: productTypeIdx >= 0 ? (row[productTypeIdx] ?? "").trim() || null : null,
      sku: skuIdx >= 0 ? (row[skuIdx] ?? "").trim() || null : null,
      barcode: barcodeIdx >= 0 ? (row[barcodeIdx] ?? "").trim() || null : null,
      tags,
      salePrice: computedSalePrice,
      costPrice: costPrice > 0 ? costPrice : null,
    });
  }

  return {
    csvRows: totalDataRows,
    validRows,
    skippedRows,
    headers,
  };
}
