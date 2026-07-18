// ============================================================
// BIBLELESSONSPARK - ORGANIZATION POOL CHECK (SHARED)
// Location: supabase/functions/_shared/orgPoolCheck.ts
//
// SSOT COMPLIANCE:
// - Pool limits come from organizations table (synced from Stripe)
// - Consumption order: subscription pool first, then bonus pool
// - Org members always get organization_id on lessons
// - org_pool_consumed = true only when pool was actually used
// - pool window is a 30-day ROLLING allowance (ORG_POOL.periodDays), rolled
//   lazily on read -- independent of the annual Stripe billing boundary
// ============================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ORG_POOL } from './organizationConfig.ts';

/** Rolling pool window length in ms, sourced from the frontend SSOT. */
const POOL_PERIOD_MS = ORG_POOL.periodDays * 24 * 60 * 60 * 1000;

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
  /** Anchor of the current 30-day rolling pool window (re-anchored on refill). */
  pool_period_start: string | null;
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
      current_period_end,
      pool_period_start
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
    pool_period_start: org.pool_period_start ?? null,
  };
}

/**
 * Roll the 30-day pool window forward LAZILY if it has elapsed.
 *
 * The Shepherding pool is a 30-day rolling allowance that refills to full every
 * ORG_POOL.periodDays, INDEPENDENT of the annual Stripe billing boundary. There
 * is no pg_cron and no DB trigger (Architecture Principle #2) -- this function,
 * called on every pool check, is the only writer.
 *
 *  - pool_period_start NULL  -> initialize the window to now() (no reset; the
 *    org has simply never been checked under the rolling model yet).
 *  - window elapsed          -> reset lessons_used_this_period to 0 and
 *    re-anchor pool_period_start to now(). No carryover.
 *  - window still open       -> no-op.
 *
 * Must run BEFORE getOrgPoolBalance so the balance reflects any refill.
 */
export async function rollOrgPoolPeriodIfElapsed(
  supabase: SupabaseClient,
  organizationId: string
): Promise<void> {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('pool_period_start')
    .eq('id', organizationId)
    .single();

  if (error || !org) {
    console.error('Pool period roll: could not read organization', organizationId, error);
    return;
  }

  const now = new Date();

  // Not yet initialized -> anchor the window now. No reset (fresh window).
  if (!org.pool_period_start) {
    const { error: initError } = await supabase
      .from('organizations')
      .update({ pool_period_start: now.toISOString() })
      .eq('id', organizationId);
    if (initError) {
      console.error('Pool period init failed for org', organizationId, initError);
    } else {
      console.log(`Pool window initialized for org ${organizationId} (anchored to now).`);
    }
    return;
  }

  const periodStart = new Date(org.pool_period_start);
  if (now.getTime() - periodStart.getTime() >= POOL_PERIOD_MS) {
    // 30-day window elapsed -> refill: reset usage and re-anchor. No carryover.
    const { error: rollError } = await supabase
      .from('organizations')
      .update({
        lessons_used_this_period: 0,
        pool_period_start: now.toISOString(),
      })
      .eq('id', organizationId);
    if (rollError) {
      console.error('Pool period roll failed for org', organizationId, rollError);
    } else {
      console.log(`Org pool refilled (${ORG_POOL.periodDays}-day window elapsed). Org ${organizationId}: usage reset to 0, window re-anchored.`);
    }
  }
}

/**
 * Complete org pool check - combines membership and balance check
 */
export async function checkOrgPoolAccess(
  supabase: SupabaseClient,
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

  // Step 2: Roll the 30-day pool window forward if it has elapsed (lazy refill),
  // THEN read the balance so it reflects any refill.
  await rollOrgPoolPeriodIfElapsed(supabase, membership.organization_id);
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
  supabase: SupabaseClient,
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
