// @ts-nocheck
declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

/**
 * Transparent Webhook Gateway Proxy
 * Forwards requests to the single canonical endpoint: /api/webhooks/whatsapp
 * Ensures 0 duplicate processing or signature logic divergence.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const siteUrl =
      Deno.env.get("SITE_URL") || Deno.env.get("VERCEL_URL") || "https://indexes-store.com";
    const canonicalTarget = `${siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`}/api/webhooks/whatsapp`;

    const reqUrl = new URL(req.url);
    const targetUrl = `${canonicalTarget}${reqUrl.search}`;

    console.log(
      `[Webhook Edge Proxy] Proxying ${req.method} request to canonical endpoint: ${targetUrl}`,
    );

    const proxyHeaders = new Headers(req.headers);
    proxyHeaders.set("x-forwarded-by", "supabase-edge-function");

    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders,
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    const resBody = await proxyRes.text();
    const resHeaders = new Headers(proxyRes.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => resHeaders.set(k, v));

    return new Response(resBody, {
      status: proxyRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Proxy error";
    console.error("[Webhook Edge Proxy] Failed to proxy request:", errMessage);
    return new Response(JSON.stringify({ error: `Webhook proxy failed: ${errMessage}` }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 502,
    });
  }
});
