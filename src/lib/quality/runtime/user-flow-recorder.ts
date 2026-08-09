/**
 * Phase 4 — User Flow Recorder
 * Tracks critical e-commerce user flows (Product View -> Add Cart -> Checkout)
 */

export interface UserFlowStep {
  stepName: string;
  success: boolean;
  durationMs?: number;
  failureReason?: string;
  timestamp: string;
}

const userFlowBuffer: UserFlowStep[] = [];

export function recordUserFlowStep(step: Omit<UserFlowStep, "timestamp">) {
  userFlowBuffer.push({
    ...step,
    timestamp: new Date().toISOString(),
  });
  if (userFlowBuffer.length > 50) userFlowBuffer.shift();
}

export function getUserFlowHistory(): UserFlowStep[] {
  return [...userFlowBuffer];
}
