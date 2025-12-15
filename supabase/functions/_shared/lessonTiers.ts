/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/lessonTiers.ts
 * Generated: 2025-12-15T20:44:38.254Z
 */
﻿// =====================================================
// LESSON TIERS - Single Source of Truth
// =====================================================
// Location: src/constants/lessonTiers.ts (MASTER)
// Mirror: supabase/functions/_shared/lessonTiers.ts
// DO NOT EDIT MIRROR DIRECTLY - Run: npm run sync-constants
// Last Updated: 2025-12-07
// =====================================================

export interface LessonTier {
  id: string;
  name: string;
  displayName: string;
  description: string;
  sections: number[];
  includesTeaser: boolean;
  wordCountTarget: { min: number; max: number };
  estimatedMinutes: { min: number; max: number };
  displayOrder: number;
  isDefault: boolean;
}

export const LESSON_TIERS: LessonTier[] = [
  {
    id: 'basic',
    name: 'basic',
    displayName: 'Quick Lesson',
    description: 'Essential framework (3 sections) - faster generation',
    sections: [1, 5, 8],
    includesTeaser: false,
    wordCountTarget: { min: 1030, max: 1490 },
    estimatedMinutes: { min: 0.5, max: 1 },
    displayOrder: 1,
    isDefault: false
  },
  {
    id: 'full',
    name: 'full',
    displayName: 'Complete Lesson',
    description: 'Full framework (8 sections + optional teaser)',
    sections: [1, 2, 3, 4, 5, 6, 7, 8],
    includesTeaser: true,
    wordCountTarget: { min: 2100, max: 2790 },
    estimatedMinutes: { min: 1, max: 1.5 },
    displayOrder: 2,
    isDefault: true
  }
];

// Valid tier IDs (for database CHECK constraints)
export const VALID_TIER_IDS = LESSON_TIERS.map(t => t.id) as readonly string[];

// Helper functions
export function getLessonTier(id: string): LessonTier | undefined {
  return LESSON_TIERS.find(t => t.id === id);
}

export function getDefaultLessonTier(): LessonTier {
  return LESSON_TIERS.find(t => t.isDefault) || LESSON_TIERS[0];
}

export function getLessonTiersSorted(): LessonTier[] {
  return [...LESSON_TIERS].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getTierSections(tierId: string): number[] {
  const tier = getLessonTier(tierId);
  return tier ? tier.sections : getDefaultLessonTier().sections;
}

export function getTierById(id: string): LessonTier {
  return getLessonTier(id) || getDefaultLessonTier();
}
