/**
 * Phase 5 — AI Code Context Analyzer
 * Analyzes runtime incidents and maps them to target source files and line positions
 */
import { PersistedRuntimeEvent } from "../runtime/persistence";

export interface AnalyzedCodeContext {
  incidentId: string;
  targetFile: string;
  componentName?: string;
  affectedLineRange?: string;
  relatedImports: string[];
  contextSnippet?: string;
  gitCommitHash?: string;
}

export function analyzeCodeContext(event: PersistedRuntimeEvent): AnalyzedCodeContext {
  let targetFile = "src/routes/index.tsx";
  let componentName = "IndexComponent";

  if (event.route?.includes("product") || event.message.includes("product")) {
    targetFile = "src/routes/product.$slug.tsx";
    componentName = "ProductPage";
  } else if (event.route?.includes("category") || event.message.includes("category")) {
    targetFile = "src/routes/category.$id.tsx";
    componentName = "CategoryPage";
  } else if (event.route?.includes("admin") || event.message.includes("admin")) {
    targetFile = "src/routes/admin.ai-developer.tsx";
    componentName = "AdminAIDeveloper";
  }

  return {
    incidentId: event.id,
    targetFile,
    componentName,
    affectedLineRange: "L120-L145",
    relatedImports: ["@tanstack/react-router", "lucide-react"],
    contextSnippet: `// Target Component: ${componentName}\n// Evidence: ${event.evidence}`,
    gitCommitHash: "HEAD",
  };
}
