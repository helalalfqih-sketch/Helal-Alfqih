/**
 * Quality History Storage Manager Test Suite (Production vs Development Adapters)
 */
import { saveQualityReports, loadLatestReport, isProductionEnvironment, QualityReportSummary } from "./history";

async function runHistoryTests() {
  console.log("==========================================");
  console.log("🧪 Starting Quality History Storage Manager Tests...");
  console.log("==========================================");

  const mockSummary: QualityReportSummary = {
    schemaVersion: "1.0.0",
    overallScore: 98,
    grade: "A+",
    status: "PASS",
    environment: "production",
    lastVerifiedAt: new Date().toISOString(),
    auditsCount: 9,
    passedCount: 9,
    failedCount: 0,
    warningCount: 0,
    notMeasuredCount: 0,
    results: [],
    manifest: {
      schemaVersion: "1.0.0",
      executionId: "EXEC-PROD-TEST",
      environment: "production",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 150,
      auditsCount: 9,
      passedCount: 9,
      failedCount: 0,
      warningCount: 0,
      notMeasuredCount: 0,
    },
  };

  // Scenario 1: Production Mode (Vercel Serverless)
  console.log("⚙️ [1/2] Testing Production Storage Mode (Vercel Serverless / DB Memory Adapter)...");
  const originalVercel = process.env.VERCEL;
  process.env.VERCEL = "1";

  if (!isProductionEnvironment()) throw new Error("❌ Environment detection failed for Vercel production");

  // Save report in production mode (must not throw ENOENT mkdir '/var/task/reports')
  saveQualityReports(mockSummary);
  const prodLoaded = loadLatestReport();

  console.log(`✅ Production Save & Load Result: OverallScore=${prodLoaded?.overallScore} | Grade=${prodLoaded?.grade}`);
  if (prodLoaded?.overallScore !== 98) throw new Error("❌ Production report save/load failed");

  // Reset environment
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;

  // Scenario 2: Development Mode (Local Disk Adapter)
  console.log("⚙️ [2/2] Testing Development Storage Mode (Local Disk Adapter)...");
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  saveQualityReports(mockSummary);
  const devLoaded = loadLatestReport();

  console.log(`✅ Development Save & Load Result: OverallScore=${devLoaded?.overallScore} | Grade=${devLoaded?.grade}`);
  if (devLoaded?.overallScore !== 98) throw new Error("❌ Development report save/load failed");

  process.env.NODE_ENV = originalEnv;

  console.log("==========================================");
  console.log("🎉 ALL QUALITY HISTORY STORAGE MANAGER TESTS PASSED!");
  console.log("==========================================");
}

runHistoryTests().catch((err) => {
  console.error("❌ History Test Failure:", err);
  process.exit(1);
});
