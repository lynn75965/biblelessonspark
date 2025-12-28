// ============================================================
// LESSONSPARK USA - SUBSCRIPTION CHECK (SHARED)
// Location: supabase/functions/_shared/subscriptionCheck.ts
// ============================================================

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
    return {
      can_generate: true,
      lessons_used: 0,
      lessons_limit: 999,
      tier: 'free',
      sections_allowed: [1, 5, 8],
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

export function getSectionsForTier(tier: string): number[] {
  if (tier === 'personal') {
    return [1, 2, 3, 4, 5, 6, 7, 8];
  }
  // Free tier gets core sections only
  return [1, 5, 8];
}
