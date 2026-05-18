// ============================================================
// BIBLELESSONSPARK - FEATURE FLAGS (SHARED, BACKEND)
// Location: supabase/functions/_shared/featureFlags.ts
//
// HAND-MAINTAINED MIRROR -- not auto-synced.
// Rule #24: featureFlags.ts is NOT in scripts/sync-constants.cjs FILES_TO_SYNC.
// Frontend SSOT lives at src/constants/featureFlags.ts. If RESHAPE_RULE
// (or any other backend-consumed flag) changes there, update this file
// in the same commit.
//
// Backend-only scope: this file exports ONLY the constants the Edge
// Functions actually consume. Frontend-only helpers (hasFeatureAccess,
// getUpgradePrompt) are intentionally omitted.
// ============================================================

// ----------------------------------------------------------------------------
// RESHAPE RULE -- Single Source of Truth (SSOT)
// Must match src/constants/featureFlags.ts RESHAPE_RULE exactly.
// ----------------------------------------------------------------------------
export const RESHAPE_RULE = {
  eligibleLessonType: 'full',       // only 8-section lessons
  costInLessonCredits: 1,           // costs exactly 1 credit
  eligibleForShortLesson: false,    // 3-section lessons never eligible
} as const;
