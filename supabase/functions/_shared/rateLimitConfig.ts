/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/rateLimitConfig.ts
 * Generated: 2025-12-29T00:07:58.436Z
 */
﻿// =============================================================================
// RATE LIMIT CONSTANTS
// SSOT MASTER: Frontend rate limit definitions
// Backend mirror: supabase/functions/_shared/rateLimit.ts
// =============================================================================

/**
 * Rate limit configuration for lesson generation
 * Controls API usage and costs
 */
export const RATE_LIMITS = {
  // Beta program limits
  BETA_LESSONS_PER_DAY: 7,
  BETA_PERIOD_HOURS: 24,
  
  // Production limits (post-beta)
  FREE_LESSONS_PER_DAY: 3,
  FREE_PERIOD_HOURS: 24,
  
  // Admin exempt from limits
  ADMIN_EXEMPT: true,
} as const;

/**
 * Rate limit error messages
 */
export const RATE_LIMIT_MESSAGES = {
  BETA_EXCEEDED: (resetTime: string) => 
    `Beta rate limit reached: Maximum ${RATE_LIMITS.BETA_LESSONS_PER_DAY} lessons per ${RATE_LIMITS.BETA_PERIOD_HOURS} hours. Try again at ${resetTime}.`,
  FREE_EXCEEDED: (resetTime: string) => 
    `Daily limit reached: Maximum ${RATE_LIMITS.FREE_LESSONS_PER_DAY} lessons per day. Upgrade for unlimited lessons or try again at ${resetTime}.`,
} as const;

export type RateLimitTier = 'beta' | 'free' | 'paid' | 'admin';
