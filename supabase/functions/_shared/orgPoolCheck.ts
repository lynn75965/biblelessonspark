// ============================================================
// LESSONSPARK USA - ORGANIZATION POOL CHECK (SHARED)
// Location: supabase/functions/_shared/orgPoolCheck.ts
//
// SSOT COMPLIANCE:
// - Pool limits come from organizations table (synced from Stripe)
// - Consumption order: subscription pool first, then bonus pool
// - Org members always get organization_id on lessons
// - org_pool_consumed = true only when pool was actually used
// ============================================================

export interface OrgMembership {
  organization_id: string;
  organization_name: string;
  role: 'member' | 'leader';
  subscription_tier: string | null;
  subscription_status: string | null;
}

export interface OrgPoolStatus {
  has_active_subscription: boolean;
  subscription_remaining: number;
  bonus_remaining: number;
  total_available: number;
  lessons_limit: number;
  lessons_used_this_period: number;
  bonus_lessons: number;
  current_period_end: string | null;
}

export interface OrgPoolCheckResult {
  is_org_member: boolean;
  organization_id: string | null;
  organization_name: string | null;
  role: string | null;
  can_use_org_pool: boolean;
  pool_status: OrgPoolStatus | null;
}

/**
 * Check if user is a member of an organization and get their org details
 */
export async function getOrgMembership(
  supabase: any,
  userId: string
): Promise<OrgMembership | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        subscription_tier,
        subscription_status
      )
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking org membership:', error);
    return null;
  }

  if (!data || !data.organizations) {
    return null;
  }

  return {
    organization_id: data.organization_id,
    organization_name: data.organizations.name,
    role: data.role,
    subscription_tier: data.organizations.subscription_tier,
    subscription_status: data.organizations.subscription_status,
  };
}

/**
 * Get organization's pool balance (subscription + bonus)
 */
export async function getOrgPoolBalance(
  supabase: any,
  organizationId: string
): Promise<OrgPoolStatus | null> {
  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      subscription_tier,
      subscription_status,
      lessons_limit,
      lessons_used_this_period,
      bonus_lessons,
      current_period_end
    `)
    .eq('id', organizationId)
    .single();

  if (error || !org) {
    console.error('Error fetching org pool status:', error);
    return null;
  }

  // Check if subscription is active
  const hasActiveSubscription = 
    org.subscription_status === 'active' || 
    org.subscription_status === 'trialing';

  // Calculate remaining from subscription pool
  const subscriptionRemaining = hasActiveSubscription
    ? Math.max(0, (org.lessons_limit || 0) - (org.lessons_used_this_period || 0))
    : 0;

  // Bonus lessons are always available regardless of subscription status
  const bonusRemaining = org.bonus_lessons || 0;

  return {
    has_active_subscription: hasActiveSubscription,
    subscription_remaining: subscriptionRemaining,
    bonus_remaining: bonusRemaining,
    total_available: subscriptionRemaining + bonusRemaining,
    lessons_limit: org.lessons_limit || 0,
    lessons_used_this_period: org.lessons_used_this_period || 0,
    bonus_lessons: bonusRemaining,
    current_period_end: org.current_period_end,
  };
}

/**
 * Complete org pool check - combines membership and balance check
 */
export async function checkOrgPoolAccess(
  supabase: any,
  userId: string
): Promise<OrgPoolCheckResult> {
  // Step 1: Check if user is an org member
  const membership = await getOrgMembership(supabase, userId);

  if (!membership) {
    return {
      is_org_member: false,
      organization_id: null,
      organization_name: null,
      role: null,
      can_use_org_pool: false,
      pool_status: null,
    };
  }

  // Step 2: Get org pool balance
  const poolStatus = await getOrgPoolBalance(supabase, membership.organization_id);

  if (!poolStatus) {
    return {
      is_org_member: true,
      organization_id: membership.organization_id,
      organization_name: membership.organization_name,
      role: membership.role,
      can_use_org_pool: false,
      pool_status: null,
    };
  }

  // Step 3: Determine if pool can be used
  const canUseOrgPool = poolStatus.total_available > 0;

  return {
    is_org_member: true,
    organization_id: membership.organization_id,
    organization_name: membership.organization_name,
    role: membership.role,
    can_use_org_pool: canUseOrgPool,
    pool_status: poolStatus,
  };
}

/**
 * Consume one lesson from organization pool
 * Order: subscription pool first, then bonus pool
 * 
 * @returns true if consumption succeeded, false if pool was empty
 */
export async function consumeFromOrgPool(
  supabase: any,
  organizationId: string
): Promise<boolean> {
  // Get current pool status
  const poolStatus = await getOrgPoolBalance(supabase, organizationId);

  if (!poolStatus || poolStatus.total_available <= 0) {
    console.log('Org pool empty, cannot consume');
    return false;
  }

  // Determine which pool to deduct from
  if (poolStatus.subscription_remaining > 0) {
    // Deduct from subscription pool (increment lessons_used_this_period)
    const { error } = await supabase
      .from('organizations')
      .update({
        lessons_used_this_period: poolStatus.lessons_used_this_period + 1,
      })
      .eq('id', organizationId);

    if (error) {
      console.error('Error consuming from subscription pool:', error);
      return false;
    }

    console.log(`Consumed from subscription pool. Org ${organizationId}: ${poolStatus.lessons_used_this_period + 1}/${poolStatus.lessons_limit} used`);
    return true;
  } else if (poolStatus.bonus_remaining > 0) {
    // Deduct from bonus pool (decrement bonus_lessons)
    const { error } = await supabase
      .from('organizations')
      .update({
        bonus_lessons: poolStatus.bonus_remaining - 1,
      })
      .eq('id', organizationId);

    if (error) {
      console.error('Error consuming from bonus pool:', error);
      return false;
    }

    console.log(`Consumed from bonus pool. Org ${organizationId}: ${poolStatus.bonus_remaining - 1} bonus lessons remaining`);
    return true;
  }

  return false;
}
