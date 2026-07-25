import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai/debug")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          lovable_exists: Boolean(process.env.LOVABLE_API_KEY),
          gemini_exists: Boolean(process.env.GEMINI_API_KEY),
          vertex_exists: Boolean(
            process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_VERTEX_PROJECT,
          ),
          vercel_env: process.env.VERCEL_ENV || "unknown",
        });
      },
    },
  },
});
