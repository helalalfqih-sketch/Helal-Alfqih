import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Phase 0 🔴 — Admin Route Shell
 * Authentication is enforced client-side by AdminGate inside AdminShell.
 * The AdminGate checks the Supabase session and roles, and redirects to /auth
 * if unauthenticated. This avoids SSR redirect loops caused by missing Bearer tokens.
 */
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Indexes Store Admin — Dashboard" },
      { name: "description", content: "AI-powered commerce admin for Indexes Store." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminShell,
});
