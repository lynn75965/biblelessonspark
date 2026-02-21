// ============================================================================
// FEATURE FLAGS - SSOT
// BibleLessonSpark
// Location: src/constants/featureFlags.ts
//
// Controls which features are accessible by subscription tier.
// Locked features always show with an upgrade prompt — never hidden.
//
// USAGE:
//   import { hasFeatureAccess, getUpgradePrompt } from '@/constants/featureFlags';
//   const canSave = hasFeatureAccess(tier, 'lessonLibrary');
//
// To gate a feature:            set requiredTier to 'personal'
// To open a feature to all:     set requiredTier to 'free'
// To disable entirely:          set enabled to false
// ============================================================================

import { SubscriptionTier, isPaidTier } from '@/constants/pricingConfig';

export interface FeatureFlag {
  requiredTier:  'free' | 'personal';
  enabled:        boolean;
  label:          string;
  upgradePrompt:  string;
}

// ----------------------------------------------------------------------------
// FEATURE DEFINITIONS
// Add new features here — nowhere else
// ----------------------------------------------------------------------------
export const FEATURE_FLAGS = {

  lessonLibrary: {
    requiredTier:  'personal',
    enabled:        true,
    label:          'Lesson Library',
    upgradePrompt:  'Upgrade to Personal Plan to save lessons to your Lesson Library.',
  },

  studentTeaser: {
    requiredTier:  'personal',
    enabled:        true,
    label:          'Student Teaser',
    upgradePrompt:  'Upgrade to Personal Plan to include a Student Teaser with your lessons.',
  },

  devotional: {
    requiredTier:  'personal',
    enabled:        true,
    label:          'DevotionalSpark',
    upgradePrompt:  'Upgrade to Personal Plan to generate personal devotionals for each lesson.',
  },

  lessonShaping: {
    requiredTier:  'personal',
    enabled:        true,
    label:          'Lesson Shaping',
    upgradePrompt:  'Upgrade to Personal Plan to reshape lessons into different teaching styles.',
  },

  teachingTeam: {
    requiredTier:  'personal',
    enabled:        true,
    label:          'Teaching Team',
    upgradePrompt:  'Upgrade to Personal Plan to share lessons with your Teaching Team.',
  },

  export: {
    requiredTier:  'free',
    enabled:        true,
    label:          'Export (PDF / Word)',
    upgradePrompt:  '',
  },

  parables: {
    requiredTier:  'free',
    enabled:        true,
    label:          'Parable Generator',
    upgradePrompt:  '',
  },

} as const satisfies Record<string, FeatureFlag>;

export type FeatureKey = keyof typeof FEATURE_FLAGS;

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

/** Returns true if the given tier can use the given feature */
export function hasFeatureAccess(tier: SubscriptionTier, feature: FeatureKey): boolean {
  const flag = FEATURE_FLAGS[feature];
  if (!flag.enabled) return false;
  if (flag.requiredTier === 'free') return true;
  return isPaidTier(tier);
}

/** Returns the upgrade prompt string for a locked feature, or '' if accessible */
export function getUpgradePrompt(tier: SubscriptionTier, feature: FeatureKey): string {
  if (hasFeatureAccess(tier, feature)) return '';
  return FEATURE_FLAGS[feature].upgradePrompt;
}

/** Returns false if a feature is globally disabled */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURE_FLAGS[feature].enabled;
}
