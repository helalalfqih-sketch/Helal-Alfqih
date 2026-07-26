import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionUser } from "@/lib/auth.functions";

/**
 * Phase 0 🔴 — Strict Admin Lockdown Route Guard
 * Enforces server-side and client-side authentication for all /admin routes.
 * Unauthenticated public visitors are immediately redirected to /auth.
 */
export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    try {
      const user = await getSessionUser();
      if (!user || !user.id) {
        throw redirect({
          to: "/auth",
          search: { next: location.pathname },
        });
      }
    } catch (e: any) {
      // If it's already a redirect, rethrow it
      if (e?.to || e?.isRedirect) throw e;
      throw redirect({
        to: "/auth",
        search: { next: location.pathname },
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Indexes Store Admin — Dashboard" },
      { name: "description", content: "AI-powered commerce admin for Indexes Store." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminShell,
});
