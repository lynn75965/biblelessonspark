// ============================================================
// BIBLELESSONSPARK - SUBSCRIPTION CHECK (SHARED)
// Location: supabase/functions/_shared/subscriptionCheck.ts
//
// SSOT COMPLIANT: Imports tier sections from pricingConfig.ts
// ============================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TIER_SECTIONS, type SubscriptionTier } from './pricingConfig.ts';

export interface LessonLimitResult {
  can_generate: boolean;
  lessons_used: number;
  lessons_limit: number;
  tier: string;
  sections_allowed: number[];
  reset_date: string | null;
  /** true only when the RPC itself errored -- distinct from a legitimate
   *  "quota reached" denial. Lets the caller return an honest "try again"
   *  response instead of granting unlimited generation. (B8) */
  checkFailed?: boolean;
}

export async function checkLessonLimit(supabase: SupabaseClient, userId: string): Promise<LessonLimitResult> {
  const { data, error } = await supabase.rpc('check_lesson_limit', { p_user_id: userId });

  if (error) {
    console.error('Error checking lesson limit:', error);
    // FAIL CLOSED (B8) -- a DB/RPC error must never be silently treated as
    // "unlimited." checkFailed lets the caller (generate-lesson) return an
    // honest "we couldn't check, try again" response instead of granting
    // 999 lessons or misfiring the LIMIT_REACHED upgrade-prompt flow.
    return {
      can_generate: false,
      lessons_used: 0,
      lessons_limit: 0,
      tier: 'free',
      sections_allowed: getSectionsForTier('free'),
      reset_date: null,
      checkFailed: true
    };
  }
  
  return (Array.isArray(data) ? data[0] : data) as LessonLimitResult;
}

export async function incrementLessonUsage(supabase: SupabaseClient, userId: string): Promise<void> {
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
