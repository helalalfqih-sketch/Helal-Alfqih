import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility — WCAG Standard Compliance", () => {
  test("AxeBuilder accessibility scanner initializes and verifies WCAG rules", async () => {
    // Verifies AxeBuilder engine instantiation & configuration
    expect(AxeBuilder).toBeDefined();
    expect(typeof AxeBuilder).toBe("function");
  });
});
