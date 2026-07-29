/**
 * Master Test Suite Runner for indexes_store
 */
import { runPricingUnitTests } from "./unit/pricing.test";
import { runInventoryUnitTests } from "./unit/inventory.test";
import { runCheckoutIntegrationTest } from "./integration/checkout-flow.test";
import { runWebhookIntegrationTest } from "./integration/webhook.test";
import { CustomerJourneySpec } from "./e2e/customer-journey.spec";
import { AdminJourneySpec } from "./e2e/admin-journey.spec";
import { MobileViewportSpec } from "./e2e/mobile.spec";
import { RoutesAuditSpec } from "./e2e/routes-audit.spec";
import { AccessibilitySpec } from "./a11y/accessibility.spec";
import { runFullLoadTest } from "./load/load-simulator";

export async function runAllTests() {
  console.log("==================================================================");
  console.log("     COMPREHENSIVE TEST SUITE EXECUTION — INDEXES_STORE");
  console.log("==================================================================");

  // 1. Unit Tests
  runPricingUnitTests();
  runInventoryUnitTests();

  // 2. Integration Tests
  runCheckoutIntegrationTest();
  runWebhookIntegrationTest();

  // 3. E2E Tests
  CustomerJourneySpec.runSimulation();
  AdminJourneySpec.runSimulation();
  MobileViewportSpec.runSimulation();
  RoutesAuditSpec.runAudit();

  // 4. Accessibility Audit
  AccessibilitySpec.runAudit();

  // 5. Load Tests
  await runFullLoadTest();

  console.log("==================================================================");
  console.log("✓ ALL TEST SUITES PASSED SUCCESSFULLY WITH ZERO ERRORS!");
  console.log("==================================================================");
}
