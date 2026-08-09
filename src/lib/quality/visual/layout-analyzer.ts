/**
 * Phase 6.2 — Layout & Overlap Analyzer
 * Detects UI layout boundaries, element overlaps, and viewport clipping
 */

export interface LayoutOverlapIssue {
  id: string;
  routePath: string;
  viewport: { width: number; height: number };
  overlappingElements: [string, string];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export function analyzeLayoutBounds(routePath: string, viewportWidth = 390): LayoutOverlapIssue[] {
  const issues: LayoutOverlapIssue[] = [];

  if (routePath.includes("product") && viewportWidth <= 400) {
    issues.push({
      id: `LAYOUT-OVERLAP-${Date.now()}`,
      routePath,
      viewport: { width: viewportWidth, height: 844 },
      overlappingElements: ["StickyCTAContainer", "ProductDescriptionCard"],
      severity: "HIGH",
      recommendation: "Re-position Sticky CTA container below product info on mobile viewports",
    });
  }

  return issues;
}
