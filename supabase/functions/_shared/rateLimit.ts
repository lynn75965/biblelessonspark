/**
 * Rate Limiting Functions
 *
 * =============================================================================
 * ARCHITECTURAL RULING (December 13, 2025)
 * =============================================================================
 * This file is a BACKEND-ONLY behavioral file, not a structural constant.
 *
 * SSOT COMPLIANCE:
 * - Rate limit VALUES are defined in rateLimitConfig.ts (frontend SSOT, synced)
 * - This file contains FUNCTIONS that use those values
 * - Similar pattern to customizationDirectives.ts
 *
 * DO NOT add new rate limit VALUES here. Add them to src/constants/rateLimitConfig.ts
 * first, then run npm run sync-constants.
 * =============================================================================
 */
import { RATE_LIMITS, RATE_LIMIT_MESSAGES } from './rateLimitConfig.ts';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  message?: string;
}

/**
 * Check if user has exceeded rate limits
 */
export async function checkRateLimit(
  supabaseClient: any,
  userId: string,
  isAdmin: boolean = false
): Promise<RateLimitResult> {
  // Admin exempt from limits
  if (isAdmin && RATE_LIMITS.ADMIN_EXEMPT) {
    return { 
      allowed: true, 
      remaining: 999, 
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) 
    };
  }

  const now = new Date();
  const periodMs = RATE_LIMITS.BETA_PERIOD_HOURS * 60 * 60 * 1000;
  const periodAgo = new Date(now.getTime() - periodMs);

  // Check beta limit
  const { data: lessons, error } = await supabaseClient
    .from('lessons')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', periodAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if we can't check
    return { 
      allowed: true, 
      remaining: RATE_LIMITS.BETA_LESSONS_PER_DAY, 
      resetAt: new Date(now.getTime() + periodMs) 
    };
  }

  const count = lessons?.length || 0;
  
  if (count >= RATE_LIMITS.BETA_LESSONS_PER_DAY) {
    const oldestLesson = lessons[0];
    const resetAt = new Date(new Date(oldestLesson.created_at).
$fullContent = @'
/**
 * Rate Limiting Functions
 *
 * =============================================================================
 * ARCHITECTURAL RULING (December 13, 2025)
 * =============================================================================
 * This file is a BACKEND-ONLY behavioral file, not a structural constant.
 *
 * SSOT COMPLIANCE:
 * - Rate limit VALUES are defined in rateLimitConfig.ts (frontend SSOT, synced)
 * - This file contains FUNCTIONS that use those values
 * - Similar pattern to customizationDirectives.ts
 *
 * DO NOT add new rate limit VALUES here. Add them to src/constants/rateLimitConfig.ts
 * first, then run npm run sync-constants.
 * =============================================================================
 */
import { RATE_LIMITS, RATE_LIMIT_MESSAGES } from './rateLimitConfig.ts';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  message?: string;
}

/**
 * Check if user has exceeded rate limits
 */
export async function checkRateLimit(
  supabaseClient: any,
  userId: string,
  isAdmin: boolean = false
): Promise<RateLimitResult> {
  // Admin exempt from limits
  if (isAdmin && RATE_LIMITS.ADMIN_EXEMPT) {
    return { 
      allowed: true, 
      remaining: 999, 
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) 
    };
  }

  const now = new Date();
  const periodMs = RATE_LIMITS.BETA_PERIOD_HOURS * 60 * 60 * 1000;
  const periodAgo = new Date(now.getTime() - periodMs);

  // Check beta limit
  const { data: lessons, error } = await supabaseClient
    .from('lessons')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', periodAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if we can't check
    return { 
      allowed: true, 
      remaining: RATE_LIMITS.BETA_LESSONS_PER_DAY, 
      resetAt: new Date(now.getTime() + periodMs) 
    };
  }

  const count = lessons?.length || 0;
  
  if (count >= RATE_LIMITS.BETA_LESSONS_PER_DAY) {
    const oldestLesson = lessons[0];
    const resetAt = new Date(new Date(oldestLesson.created_at).getTime() + periodMs);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      message: RATE_LIMIT_MESSAGES.BETA_EXCEEDED(resetAt.toLocaleTimeString())
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMITS.BETA_LESSONS_PER_DAY - count,
    resetAt: new Date(now.getTime() + periodMs)
  };
}

/**
 * Log API usage for monitoring
 */
export function logUsage(userId: string, action: string, metadata?: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    userId,
    action,
    metadata
  }));
}
