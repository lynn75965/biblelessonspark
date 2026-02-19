// ============================================================
// BIBLELESSONSPARK - SUBSCRIPTION CHECK (SHARED)
// Location: supabase/functions/_shared/subscriptionCheck.ts
//
// SSOT COMPLIANT: Imports tier sections from pricingConfig.ts
// ============================================================

import { TIER_SECTIONS, type SubscriptionTier } from './pricingConfig.ts';

export interface LessonLimitResult {
  can_generate: boolean;
  lessons_used: number;
  lessons_limit: number;
  tier: string;
  sections_allowed: number[];
  reset_date: string | null;
}

export async function checkLessonLimit(supabase: any, userId: string): Promise<LessonLimitResult> {
  const { data, error } = await supabase.rpc('check_lesson_limit', { p_user_id: userId });
  
  if (error) {
    console.error('Error checking lesson limit:', error);
    // Fail open - allow generation if check fails
    // Use SSOT for free tier sections
    return {
      can_generate: true,
      lessons_used: 0,
      lessons_limit: 999,
      tier: 'free',
      sections_allowed: getSectionsForTier('free'),
      reset_date: null
    };
  }
  
  return (Array.isArray(data) ? data[0] : data) as LessonLimitResult;
}

export async function incrementLessonUsage(supabase: any, userId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_lesson_usage', { p_user_id: userId });
  
  if (error) {
    console.error('Error incrementing lesson usage:', error);
    // Don't throw - lesson was already generated successfully
  }
}

/**
 * Get allowed section numbers for a subscription tier
 * SSOT: Reads from TIER_SECTIONS in pricingConfig.ts
 * 
 * @param tier - Subscription tier ('free', 'personal', 'admin')
 * @returns Array of section numbers (integers)
 */
export function getSectionsForTier(tier: string): number[] {
  // Normalize tier to valid key
  const normalizedTier = (tier === 'admin' || tier === 'personal' || tier === 'free') 
    ? tier as SubscriptionTier 
    : 'free';
  
  // Get sections from SSOT and convert strings to numbers
  const sections = TIER_SECTIONS[normalizedTier];
  return sections.map(s => parseInt(s, 10));
}
