/**
 * Task Decomposition Engine — Gen 2 Agentic Engine 🧩
 *
 * Breaks down high-level user requests into multi-layer engineering tasks:
 *   Layer 1: Database Migration / Table Schema
 *   Layer 2: Repository Layer / DB Access
 *   Layer 3: Business Logic / Service Layer
 *   Layer 4: Server Functions & APIs
 *   Layer 5: UI Components & Route Integration
 *   Layer 6: Typecheck & Automated Testing
 *   Layer 7: Production Build & Deployment Validation
 */

export interface DecomposedTaskStep {
  layer: "database" | "repository" | "service" | "api" | "ui" | "testing" | "deployment";
  title: string;
  description: string;
  targetFile?: string;
  requiresApproval: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface DecomposedTaskPlan {
  objective: string;
  layersCount: number;
  steps: DecomposedTaskStep[];
  estimatedTimeSeconds: number;
}

/**
 * Decompose a high-level user prompt into architectural layers
 */
export function decomposeUserRequest(prompt: string): DecomposedTaskPlan {
  const p = prompt.toLowerCase();
  const steps: DecomposedTaskStep[] = [];

  const isNewFeature = p.includes("أضف") || p.includes("أنشئ") || p.includes("add") || p.includes("create");
  const includesDb = p.includes("جدول") || p.includes("database") || p.includes("schema") || p.includes("تخزين") || isNewFeature;

  if (includesDb) {
    steps.push({
      layer: "database",
      title: "1. إعداد مخطط قاعدة البيانات وسياسات RLS",
      description: "إنشاء Migration جديد يضمن عزالية البيانات وشحنات Multi-Tenant RLS.",
      targetFile: "supabase/migrations/timestamp_feature_schema.sql",
      requiresApproval: true,
      riskLevel: "medium",
    });
  }

  steps.push({
    layer: "repository",
    title: "2. بناء طبقة الوصول للبيانات (Repository Layer)",
    description: "تأمين الاستعلامات وعزل استدلال البيانات حسب tenant_id المباشر.",
    targetFile: "src/lib/data-repository.ts",
    requiresApproval: false,
    riskLevel: "low",
  });

  steps.push({
    layer: "service",
    title: "3. تطبيق منطق العمل والخدمة الخادمية (Service Logic)",
    description: "بناء المنطق التجاري ومعالجة حالات الخطأ وحساب المقاييس.",
    targetFile: "src/services/feature.service.ts",
    requiresApproval: false,
    riskLevel: "low",
  });

  steps.push({
    layer: "api",
    title: "4. إنشاء Server Functions & API Endpoints",
    description: "ربط الخدمة بـ TanStack Server Functions وتأمين الصلاحيات.",
    targetFile: "src/lib/feature.functions.ts",
    requiresApproval: false,
    riskLevel: "low",
  });

  steps.push({
    layer: "ui",
    title: "5. بناء الواجهات الرسومية والمكونات (UI Integration)",
    description: "تطوير واجهات المستخدم باستخدام Tailwind CSS ونظام التصميم Glassmorphism.",
    targetFile: "src/components/feature-component.tsx",
    requiresApproval: true,
    riskLevel: "medium",
  });

  steps.push({
    layer: "testing",
    title: "6. التثبت التلقائي واختبار الأنواع (Typecheck & Validation)",
    description: "تشغيل `npm run typecheck` وفحص توافق الأنواع في TypeScript.",
    requiresApproval: false,
    riskLevel: "low",
  });

  steps.push({
    layer: "deployment",
    title: "7. النشر المباشر والمصادقة الإنتاجية",
    description: "تجهيز الحزمة البرمجية وتنفيذ النشر التلقائي للإنتاج.",
    requiresApproval: true,
    riskLevel: "high",
  });

  return {
    objective: prompt,
    layersCount: steps.length,
    steps,
    estimatedTimeSeconds: steps.length * 15,
  };
}
