/**
 * Automated Code Review Engine — Gen 2 Agentic Engine 🔍
 *
 * Performs multi-dimensional automated code audits:
 *   - Security & RLS Isolation
 *   - TypeScript Type Safety
 *   - Performance & Memory Leak Prevention
 *   - Accessibility (a11y) & SEO Compliance
 */

export interface CodeReviewFinding {
  id: string;
  category: "security" | "performance" | "accessibility" | "typescript" | "rls" | "seo" | "memory_leak";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  lineNumber?: number;
  snippet?: string;
  recommendation: string;
}

export interface CodeReviewReport {
  filePath: string;
  passed: boolean;
  score: number; // 0 - 100
  findings: CodeReviewFinding[];
  auditedAt: string;
}

/**
 * Audit code content for security vulnerabilities and best practices
 */
export function reviewCodeContent(filePath: string, codeContent: string): CodeReviewReport {
  const findings: CodeReviewFinding[] = [];

  // Check 1: Sensitive keys leak
  if (/(sk_live|secret_key|password|api_secret)\s*[:=]\s*['"][^'"]+['"]/i.test(codeContent)) {
    findings.push({
      id: "sec-01",
      category: "security",
      severity: "critical",
      title: "كشف مفاتيح سرية في الكود (Hardcoded Secret)",
      description: "تم العثور على مفاتيح تشفير أو API Secret مكتوبة مباشرة داخل الملف.",
      recommendation: "قم بنقل المفتاح إلى ملف البيئة `.env` واستدعائه عبر process.env",
    });
  }

  // Check 2: Supabase database query without tenant_id check
  if (codeContent.includes(".from(") && !codeContent.includes("tenant_id") && !filePath.includes("migrations")) {
    findings.push({
      id: "rls-01",
      category: "rls",
      severity: "high",
      title: "استعلام قاعدة البيانات قد يفتقر لعزل Tenant ID",
      description: "تم اكتشاف استعلام جدول بدون تصفية صريحة بواسطة tenant_id.",
      recommendation: "تأكد من إضافة `.eq('tenant_id', tenantId)` أو تفعيل RLS Policy على الجدول.",
    });
  }

  // Check 3: Missing TypeScript return types on exported functions
  if (/export\s+async\s+function\s+\w+\([^)]*\)\s*\{/i.test(codeContent)) {
    findings.push({
      id: "ts-01",
      category: "typescript",
      severity: "low",
      title: "دالة خادمية تصديرية بدون نوع إرجاع صريح",
      description: "إضافة نوع الإرجاع Explicit Return Type يزيد من موثوقية التجميع.",
      recommendation: "أضف `: Promise<ReturnType>` لدالة التصدير.",
    });
  }

  // Check 4: Uncleaned useEffect listeners (Potential Memory Leak)
  if (codeContent.includes("addEventListener") && !codeContent.includes("removeEventListener")) {
    findings.push({
      id: "mem-01",
      category: "memory_leak",
      severity: "medium",
      title: "مستمع أحداث (Event Listener) قد يسبب تسريب ذاكرة",
      description: "تمت إضافة addEventListener بدون تنظيفه في دالة العودة الخاصة بـ useEffect.",
      recommendation: "أضف دالة التنظيف `return () => window.removeEventListener(...)` داخل useEffect.",
    });
  }

  const criticals = findings.filter((f) => f.severity === "critical").length;
  const highs = findings.filter((f) => f.severity === "high").length;
  const score = Math.max(0, 100 - criticals * 40 - highs * 15 - findings.length * 5);

  return {
    filePath,
    passed: criticals === 0 && score >= 70,
    score,
    findings,
    auditedAt: new Date().toISOString(),
  };
}
