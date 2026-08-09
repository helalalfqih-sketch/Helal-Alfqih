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
    const { event, user } = await req.json();

    console.log(`[Auth-Functions Edge Hook] Event: ${event}, User ID: ${user?.id}`);

    const responsePayload = {
      event,
      user_id: user?.id,
      custom_claims: {
        tenant_id: user?.user_metadata?.tenant_id || null,
        is_admin: false,
      },
    };

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errMessage }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
