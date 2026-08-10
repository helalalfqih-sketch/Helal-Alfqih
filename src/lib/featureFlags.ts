/**
 * Feature Flags Configuration for Indexes Store Releases
 */

export const FEATURE_FLAGS = {
  // Release 1: Shipped & Production Active
  RELEASE_1_CUSTOMER_CONVENIENCE: true,

  // Release 2: Intelligent Assistant Spec (Flagged Inactive)
  RELEASE_2_INTELLIGENT_ASSISTANT: false,

  // Release 3: Differentiated Experience Spec (Flagged Inactive)
  RELEASE_3_DIFFERENTIATED_EXP: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}
