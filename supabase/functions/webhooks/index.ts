// @ts-nocheck
declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider") || "default";
    const body = req.method !== "GET" ? await req.json() : null;

    console.log(`[Webhook Edge Function] Provider: ${provider}, Method: ${req.method}`);

    switch (provider) {
      case "whatsapp":
        if (req.method === "GET") {
          const mode = url.searchParams.get("hub.mode");
          const token = url.searchParams.get("hub.verify_token");
          const challenge = url.searchParams.get("hub.challenge");

          if (mode === "subscribe" && token === Deno.env.get("WHATSAPP_VERIFY_TOKEN")) {
            return new Response(challenge, { status: 200 });
          }
        }
        return new Response(
          JSON.stringify({ status: "received", provider, body }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
        );

      case "payment":
        return new Response(
          JSON.stringify({ status: "payment_processed", provider, body }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
        );

      default:
        return new Response(
          JSON.stringify({ status: "success", provider, payload: body }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
        );
    }
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errMessage }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
