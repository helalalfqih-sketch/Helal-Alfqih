/**
 * Indexes AI Engineering Agent — Alias Route for /admin/ai-agent
 * Redirects or renders the AI Developer page.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/ai-agent")({
  component: AIAgentAliasPage,
});

function AIAgentAliasPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/admin/ai-developer", replace: true });
  }, [navigate]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold">
        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        جاري التوجيه إلى مطوّر AI...
      </div>
    </div>
  );
}
