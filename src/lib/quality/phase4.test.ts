/**
 * Phase 4 Verification Test Suite — Quality API Layer & Control Center
 */
import { runQualityAudit } from "./index";
import { registerConsoleMonitor, getConsoleErrors } from "./runtime/console-monitor";
import { recordNetworkError, getNetworkErrors } from "./runtime/network-monitor";
import { recordUserFlowStep, getUserFlowHistory } from "./runtime/user-flow-recorder";

async function runPhase4Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 4 Quality API & Control Center Tests...");
  console.log("==========================================");

  // Test 1: Console Monitor
  console.log("⚙️ Testing Console Monitor...");
  registerConsoleMonitor();
  console.error("Test console error for Phase 4 audit");
  const consoleErrors = getConsoleErrors();
  console.log(`✅ Console errors captured: ${consoleErrors.length}`);
  if (consoleErrors.length === 0) throw new Error("❌ Console monitor failed");

  // Test 2: Network Monitor
  console.log("⚙️ Testing Network Monitor...");
  recordNetworkError({
    url: "/assets/test-product.js",
    status: 404,
    method: "GET",
    route: "product.$slug",
    severity: "MEDIUM",
  });
  const networkErrors = getNetworkErrors();
  console.log(`✅ Network errors captured: ${networkErrors.length} (404 captured)`);
  if (networkErrors.length === 0) throw new Error("❌ Network monitor failed");

  // Test 3: User Flow Recorder
  console.log("⚙️ Testing User Flow Recorder...");
  recordUserFlowStep({
    stepName: "Product Checkout",
    success: true,
    durationMs: 120,
  });
  const flowHistory = getUserFlowHistory();
  console.log(`✅ User flow steps recorded: ${flowHistory.length}`);
  if (flowHistory.length === 0) throw new Error("❌ User flow recorder failed");

  // Test 4: Quality Engine Run with Runtime Evidence
  console.log("⚙️ Executing Quality Engine Run...");
  const summary = await runQualityAudit({ environment: "local" });
  console.log(`📊 Overall Quality Score: ${summary.report.summary.overallScore}/100`);

  console.log("==========================================");
  console.log("🎉 ALL PHASE 4 CONTROL CENTER TESTS PASSED!");
  console.log("==========================================");
}

runPhase4Tests().catch((err) => {
  console.error("❌ Phase 4 Test Failure:", err);
  process.exit(1);
});
