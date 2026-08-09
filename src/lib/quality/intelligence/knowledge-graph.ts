/**
 * Phase 7.1 — Project Knowledge Graph Engine
 * Maps dependencies between UI components, database tables, storage buckets, and features
 */

export interface KnowledgeGraphNode {
  id: string;
  name: string;
  type: "COMPONENT" | "DATABASE_TABLE" | "STORAGE_BUCKET" | "INTEGRATION_FEATURE";
  pathOrIdentifier: string;
  dependencies: string[];
}

export function buildProjectKnowledgeGraph(): KnowledgeGraphNode[] {
  return [
    {
      id: "comp-product-page",
      name: "ProductPage",
      type: "COMPONENT",
      pathOrIdentifier: "src/routes/product.$slug.tsx",
      dependencies: ["db-products", "db-product-images", "bucket-uploads", "feat-whatsapp-sync"],
    },
    {
      id: "db-products",
      name: "products table",
      type: "DATABASE_TABLE",
      pathOrIdentifier: "public.products",
      dependencies: [],
    },
    {
      id: "db-product-images",
      name: "product_images table",
      type: "DATABASE_TABLE",
      pathOrIdentifier: "public.product_images",
      dependencies: ["bucket-uploads"],
    },
    {
      id: "bucket-uploads",
      name: "uploads bucket",
      type: "STORAGE_BUCKET",
      pathOrIdentifier: "supabase/storage/uploads",
      dependencies: [],
    },
    {
      id: "feat-whatsapp-sync",
      name: "WhatsApp Catalog Sync",
      type: "INTEGRATION_FEATURE",
      pathOrIdentifier: "src/services/whatsapp-sync.service.ts",
      dependencies: ["db-products", "db-product-images"],
    },
  ];
}

export function findImpactedFeatures(componentPath: string): string[] {
  const graph = buildProjectKnowledgeGraph();
  const node = graph.find((n) => n.pathOrIdentifier === componentPath);
  if (!node) return [];

  const impacted: string[] = [];
  for (const depId of node.dependencies) {
    const depNode = graph.find((n) => n.id === depId);
    if (depNode) impacted.push(depNode.name);
  }
  return impacted;
}
