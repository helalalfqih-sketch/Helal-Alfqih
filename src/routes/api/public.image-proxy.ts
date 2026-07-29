import { createFileRoute } from "@tanstack/react-router";
import sharp from "sharp";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "cross-origin-resource-policy": "cross-origin",
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB limit

const DISALLOWED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254", // Cloud metadata service
]);

function isPrivateIpOrHost(hostname: string): boolean {
  if (DISALLOWED_HOSTNAMES.has(hostname.toLowerCase())) return true;
  // Private IPv4 ranges
  if (/^10\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^127\./.test(hostname)) return true;
  return false;
}

function isDomainAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();

  // Allowlist patterns
  if (host.endsWith(".supabase.co")) return true;
  if (host.endsWith(".unsplash.com")) return true;
  if (host.endsWith(".facebook.com")) return true;
  if (host.endsWith(".fbcdn.net")) return true;
  if (host.endsWith(".githubusercontent.com")) return true;
  if (host.endsWith(".vercel.app")) return true;
  if (host.includes("indexes-store")) return true;

  // Custom environment domains
  const customDomains = process.env.ALLOWED_IMAGE_DOMAINS?.split(",") || [];
  if (customDomains.some((d) => host.endsWith(d.trim().toLowerCase()))) return true;

  return false;
}

export const Route = createFileRoute("/api/public/image-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const source = requestUrl.searchParams.get("url") ?? "";
        const wStr = requestUrl.searchParams.get("w");
        const hStr = requestUrl.searchParams.get("h");
        const qStr = requestUrl.searchParams.get("q");

        // Bound parameters
        const w = wStr ? Math.min(Math.max(parseInt(wStr, 10) || 0, 1), 2000) : null;
        const h = hStr ? Math.min(Math.max(parseInt(hStr, 10) || 0, 1), 2000) : null;
        const rawQ = qStr ? parseInt(qStr, 10) : 80;
        const q = Math.min(Math.max(rawQ || 80, 10), 100);

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(source);
          if (parsedUrl.protocol !== "https:") {
            return new Response("Invalid image URL protocol: HTTPS required", { status: 400, headers: CORS_HEADERS });
          }
        } catch {
          return new Response("Invalid image URL format", { status: 400, headers: CORS_HEADERS });
        }

        // SSRF Check: Private IPs
        if (isPrivateIpOrHost(parsedUrl.hostname)) {
          console.warn("[ImageProxy] SSRF attempt blocked for private host:", parsedUrl.hostname);
          return new Response("Forbidden: Access to private network addresses is restricted", {
            status: 403,
            headers: CORS_HEADERS,
          });
        }

        // Domain Allowlist Check
        if (!isDomainAllowed(parsedUrl.hostname)) {
          console.warn("[ImageProxy] Unauthorized image domain blocked:", parsedUrl.hostname);
          return new Response(`Forbidden: Host '${parsedUrl.hostname}' is not in the allowed domains list`, {
            status: 403,
            headers: CORS_HEADERS,
          });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);
        try {
          console.info("[IMAGE_PROXY]", { source, width: w, height: h, quality: q });

          const upstream = await fetch(source, {
            signal: controller.signal,
            headers: { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
          });

          if (!upstream.ok) {
            console.warn(`[ImageProxy] Upstream returned HTTP ${upstream.status} for URL: ${source}`);
            return new Response("Image not available", {
              status: upstream.status || 502,
              headers: CORS_HEADERS,
            });
          }

          const contentLength = upstream.headers.get("content-length");
          if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_BYTES) {
            return new Response("Image exceeds maximum allowed size (10MB)", { status: 413, headers: CORS_HEADERS });
          }

          const contentType = upstream.headers.get("content-type") || "image/jpeg";
          if (!contentType.startsWith("image/")) {
            return new Response("Unsupported media type", { status: 415, headers: CORS_HEADERS });
          }

          const arrayBuffer = await upstream.arrayBuffer();
          if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
            return new Response("Image exceeds maximum allowed size (10MB)", { status: 413, headers: CORS_HEADERS });
          }

          const buffer = Buffer.from(arrayBuffer);

          // Skip sharp processing for SVGs/GIFs
          if (contentType.includes("svg") || contentType.includes("gif")) {
            return new Response(buffer, {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                "content-type": contentType,
                "cache-control": "public, max-age=31536000, immutable",
              },
            });
          }

          // Format detection based on Accept header
          const acceptHeader = request.headers.get("accept") || "";
          let format: "avif" | "webp" | "jpeg" | "png" = "jpeg";
          let targetContentType = "image/jpeg";

          if (acceptHeader.includes("image/avif")) {
            format = "avif";
            targetContentType = "image/avif";
          } else if (acceptHeader.includes("image/webp")) {
            format = "webp";
            targetContentType = "image/webp";
          } else if (contentType.includes("png")) {
            format = "png";
            targetContentType = "image/png";
          }

          let pipeline = sharp(buffer);

          if (w || h) {
            pipeline = pipeline.resize(w || undefined, h || undefined, {
              fit: "inside",
              withoutEnlargement: true,
            });
          }

          if (format === "avif") {
            pipeline = pipeline.avif({ quality: q });
          } else if (format === "webp") {
            pipeline = pipeline.webp({ quality: q });
          } else if (format === "png") {
            pipeline = pipeline.png({ quality: q });
          } else {
            pipeline = pipeline.jpeg({ quality: q, progressive: true });
          }

          const outputBuffer = await pipeline.toBuffer();

          return new Response(outputBuffer, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              "content-type": targetContentType,
              "cache-control": "public, max-age=31536000, immutable",
            },
          });
        } catch (err) {
          console.error("[ImageProxy] Processing error for URL:", source, err);
          return new Response("Image proxy processing failed", {
            status: 502,
            headers: CORS_HEADERS,
          });
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  },
});