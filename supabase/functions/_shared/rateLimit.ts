/**
 * Rate limiting for lesson generation
 * Prevents API abuse and controls costs
 */

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
  userId: string
): Promise<RateLimitResult> {
  const now = new Date();
  
  // Check hourly limit (10 lessons per hour)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const { data: hourlyLessons, error: hourlyError } = await supabaseClient
    .from('lessons')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())
    .order('created_at', { ascending: false });

  if (hourlyError) {
    console.error('Rate limit check error (hourly):', hourlyError);
    // Fail open - allow request if we can't check
    return { allowed: true, remaining: 10, resetAt: new Date(now.getTime() + 60 * 60 * 1000) };
  }

  const hourlyCount = hourlyLessons?.length || 0;
  
  if (hourlyCount >= 10) {
    const oldestLesson = hourlyLessons[hourlyLessons.length - 1];
    const resetAt = new Date(new Date(oldestLesson.created_at).getTime() + 60 * 60 * 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      message: `Rate limit exceeded: Maximum 10 lessons per hour. Try again at ${resetAt.toLocaleTimeString()}.`
    };
  }

  // Check daily limit (50 lessons per day)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const { data: dailyLessons, error: dailyError } = await supabaseClient
    .from('lessons')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneDayAgo.toISOString());

  if (dailyError) {
    console.error('Rate limit check error (daily):', dailyError);
    // Fail open - allow request if we can't check
    return { allowed: true, remaining: 10 - hourlyCount, resetAt: new Date(now.getTime() + 60 * 60 * 1000) };
  }

  const dailyCount = dailyLessons?.length || 0;
  
  if (dailyCount >= 50) {
    const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      message: `Daily rate limit exceeded: Maximum 50 lessons per day. Try again tomorrow.`
    };
  }

  // Allow request
  return {
    allowed: true,
    remaining: Math.min(10 - hourlyCount, 50 - dailyCount),
    resetAt: new Date(now.getTime() + 60 * 60 * 1000)
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
