import { supabase } from "@/integrations/supabase/client";

export const TEST_TENANT_SLUG = "test-tenant-qa";

export async function seedTestTenant() {
  console.log("[Seed] Starting test tenant provisioning for QA...");

  // 1. Create or fetch test tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .upsert(
      {
        slug: TEST_TENANT_SLUG,
        name: "QA Test Tenant",
        plan: "enterprise",
        status: "active",
        settings: { qa_enabled: true, mode: "sandbox" },
      },
      { onConflict: "slug" },
    )
    .select()
    .single();

  if (tenantError) {
    console.error("[Seed] Failed to provision test tenant:", tenantError);
    throw tenantError;
  }

  console.log(`[Seed] Test tenant ready: ID ${tenant.id} (${tenant.slug})`);

  // 2. Create sample categories for test tenant
  const { data: category, error: catError } = await supabase
    .from("categories")
    .upsert(
      {
        tenant_id: tenant.id,
        slug: "electronics-qa",
        name: "QA Electronics",
        description: "Test electronics category",
        is_active: true,
      },
      { onConflict: "tenant_id,slug" },
    )
    .select()
    .single();

  if (catError) {
    console.error("[Seed] Category seed error:", catError);
  }

  // 3. Create test products with media assets
  const sampleProducts: Array<{
    tenant_id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    old_price?: number;
    category_id?: string;
    brand: string;
    images: string[];
    stock: number;
    badge: string;
    is_published: boolean;
    video_playback_id?: string;
  }> = [
    {
      tenant_id: tenant.id,
      slug: "smart-watch-pro-qa",
      name: "Smart Watch Pro (QA Test)",
      description: "High-performance smartwatch for automated E2E testing.",
      price: 199.99,
      old_price: 249.99,
      category_id: category?.id,
      brand: "Indexes Tech",
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      ],
      stock: 50,
      badge: "QA Ready",
      is_published: true,
      video_playback_id: "demo-qa-video-01",
    },
    {
      tenant_id: tenant.id,
      slug: "wireless-earbuds-qa",
      name: "Wireless Earbuds (QA Test)",
      description: "Noise-cancelling wireless earbuds for testing catalog flows.",
      price: 89.99,
      category_id: category?.id,
      brand: "Indexes Sound",
      images: ["https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800"],
      stock: 100,
      badge: "Best Seller",
      is_published: true,
    },
  ];

  for (const prod of sampleProducts) {
    const { error: prodError } = await supabase
      .from("products")
      .upsert(prod, { onConflict: "tenant_id,slug" });

    if (prodError) {
      console.error(`[Seed] Product seed error for ${prod.slug}:`, prodError);
    }
  }

  console.log("[Seed] Test tenant seeding complete successfully!");
  return { tenantId: tenant.id, slug: tenant.slug };
}
