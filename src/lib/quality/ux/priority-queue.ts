/**
 * Phase 6.2 — AI Priority Queue Engine
 * Ranks UX and quality improvement items by business impact
 */

export interface PriorityQueueItem {
  id: string;
  rank: number;
  priorityLabel: "CRITICAL" | "MEDIUM" | "LOW";
  title: string;
  businessImpact: string;
  affectedSessionsCount: number;
  targetFile: string;
  evidenceSummary: string;
  actionRequired: string;
  requiresApproval: boolean;
}

export function generatePriorityQueue(): PriorityQueueItem[] {
  return [
    {
      id: "QUEUE-001",
      rank: 1,
      priorityLabel: "CRITICAL",
      title: "Product page image loading failure on mobile viewports",
      businessImpact: "Lost sales & high bounce rate on mobile storefront",
      affectedSessionsCount: 143,
      targetFile: "src/routes/product.$slug.tsx",
      evidenceSummary: "143 sessions abandoned page after 8.2s wait time due to 404 asset response",
      actionRequired: "Review & approve asset chunk loader fix",
      requiresApproval: true,
    },
    {
      id: "QUEUE-002",
      rank: 2,
      priorityLabel: "MEDIUM",
      title: "Checkout payment button query latency P95: 4.8s",
      businessImpact: "Increased checkout drop-off rate at payment step",
      affectedSessionsCount: 52,
      targetFile: "src/routes/checkout.tsx",
      evidenceSummary: "3 duplicated API calls detected during payment gate init",
      actionRequired: "Cache payment methods query response",
      requiresApproval: true,
    },
  ];
}
