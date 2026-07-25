import { createFileRoute } from "@tanstack/react-router";
import { resolveActiveAIProvider } from "@/lib/ai-provider.server";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/ai/debug")({
  server: {
    handlers: {
      GET: async () => {
        let providersCount = 0;
        try {
          const { count } = await supabase
            .from("ai_provider_configs" as any)
            .select("*", { count: "exact", head: true })
            .eq("enabled", true);
          providersCount = count || 0;
        } catch (e) {
          console.warn("[AI_DEBUG_COUNT_ERROR]", e);
        }

        const resolved = await resolveActiveAIProvider();

        return Response.json({
          providersFound: providersCount,
          activeProvider: resolved?.provider || null,
          model: resolved?.modelName || null,
          source: resolved?.source || null,
        });
      },
    },
  },
});
