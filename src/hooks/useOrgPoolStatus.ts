/**
 * useOrgPoolStatus Hook
 * 
 * Fetches organization pool status and tier configuration from database.
 * Pool usage comes from the organizations table; tier configs from
 * org_tier_config. Lesson-pack display data is NOT fetched here -- it now
 * comes from the LESSON_PACKS frontend SSOT (src/constants/orgPricingConfig.ts),
 * consumed via the LessonPackPurchase component.
 *
 * @location src/hooks/useOrgPoolStatus.ts
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ORG_POOL } from "@/constants/organizationConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface OrgPoolStatus {
  // Subscription info
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  billingInterval: 'month' | 'year' | null;
  /**
   * Canonical pool-usability gate -- mirrors the backend (orgPoolCheck.ts):
   * the SUBSCRIPTION portion of the pool is only available when the org sub is
   * active/trialing. Consumers should treat the pool as usable when
   * totalAvailable > 0 (which already encodes this gate) and use this flag only
   * to distinguish an INACTIVE subscription from a merely EXHAUSTED pool.
   */
  hasActiveSubscription: boolean;

  // Pool limits and usage
  lessonsLimit: number;
  lessonsUsedThisPeriod: number;
  bonusLessons: number;

  // Calculated values (subscriptionRemaining is 0 when the sub is inactive)
  subscriptionRemaining: number;
  totalAvailable: number;
  usagePercentage: number;

  // Period info -- the pool window is a 30-day ROLLING window anchored on
  // pool_period_start, INDEPENDENT of the annual Stripe boundary below.
  poolPeriodStart: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  daysUntilReset: number | null;
  /** Actual calendar date the 30-day pool window resets (ISO). Shown as
   *  "Resets Mon D" -- matches the personal usage display. NEVER the annual
   *  Stripe renewal date (too confusing for multi-member pools). */
  resetDate: string | null;

  // Stripe IDs for checkout
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface OrgTierConfig {
  tier: string;
  displayName: string;
  lessonsLimit: number;
  priceMonthly: number;
  priceAnnual: number;
  stripeProductId: string;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  description: string;
  bestFor: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UseOrgPoolStatusReturn {
  poolStatus: OrgPoolStatus | null;
  tierConfigs: OrgTierConfig[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useOrgPoolStatus(organizationId: string | null): UseOrgPoolStatusReturn {
  const [poolStatus, setPoolStatus] = useState<OrgPoolStatus | null>(null);
  const [tierConfigs, setTierConfigs] = useState<OrgTierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolStatus = useCallback(async () => {
    if (!organizationId) {
      setPoolStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch organization pool data
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select(`
          subscription_tier,
          subscription_status,
          billing_interval,
          lessons_limit,
          lessons_used_this_period,
          bonus_lessons,
          pool_period_start,
          current_period_start,
          current_period_end,
          stripe_customer_id,
          stripe_subscription_id
        `)
        .eq("id", organizationId)
        .single();

      if (orgError) throw orgError;

      // Canonical usability gate -- mirror the backend (orgPoolCheck.ts): the
      // subscription pool is only available when the sub is active/trialing.
      const hasActiveSubscription =
        orgData.subscription_status === "active" ||
        orgData.subscription_status === "trialing";

      // Calculate derived values
      const lessonsLimit = orgData.lessons_limit || 0;
      const lessonsUsed = orgData.lessons_used_this_period || 0;
      const bonusLessons = orgData.bonus_lessons || 0;
      // Subscription portion is gated on active status; bonus is always usable.
      const subscriptionRemaining = hasActiveSubscription
        ? Math.max(0, lessonsLimit - lessonsUsed)
        : 0;
      const totalAvailable = subscriptionRemaining + bonusLessons;

      // Calculate usage percentage (of subscription pool only)
      const usagePercentage = lessonsLimit > 0
        ? Math.round((lessonsUsed / lessonsLimit) * 100)
        : 0;

      // Days until reset -- the pool is a 30-day ROLLING window anchored on
      // pool_period_start (NOT the annual Stripe boundary). When the anchor is
      // null the window has not started yet, so the next generation resets it;
      // treat that as a full window from now.
      const now = new Date();
      const periodStartMs = orgData.pool_period_start
        ? new Date(orgData.pool_period_start).getTime()
        : now.getTime();
      const resetMs = periodStartMs + ORG_POOL.periodDays * 24 * 60 * 60 * 1000;
      const daysUntilReset = Math.max(
        0,
        Math.ceil((resetMs - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      const resetDate = new Date(resetMs).toISOString();

      setPoolStatus({
        subscriptionTier: orgData.subscription_tier,
        subscriptionStatus: orgData.subscription_status,
        billingInterval: orgData.billing_interval,
        hasActiveSubscription,
        lessonsLimit,
        lessonsUsedThisPeriod: lessonsUsed,
        bonusLessons,
        subscriptionRemaining,
        totalAvailable,
        usagePercentage,
        poolPeriodStart: orgData.pool_period_start,
        currentPeriodStart: orgData.current_period_start,
        currentPeriodEnd: orgData.current_period_end,
        daysUntilReset,
        resetDate,
        stripeCustomerId: orgData.stripe_customer_id,
        stripeSubscriptionId: orgData.stripe_subscription_id,
      });

      // Fetch tier configurations (SSOT from database)
      const { data: tierData, error: tierError } = await supabase
        .from("org_tier_config")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (tierError) throw tierError;

      setTierConfigs(
        (tierData || []).map((t) => ({
          tier: t.tier,
          displayName: t.display_name,
          lessonsLimit: t.lessons_limit,
          priceMonthly: t.price_monthly,
          priceAnnual: t.price_annual,
          stripeProductId: t.stripe_product_id,
          stripePriceIdMonthly: t.stripe_price_id_monthly,
          stripePriceIdAnnual: t.stripe_price_id_annual,
          description: t.description,
          bestFor: t.best_for,
          displayOrder: t.display_order,
          isActive: t.is_active,
        }))
      );

    } catch (err: any) {
      console.error("Error fetching org pool status:", err);
      setError(err.message || "Failed to load pool status");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchPoolStatus();
  }, [fetchPoolStatus]);

  return {
    poolStatus,
    tierConfigs,
    loading,
    error,
    refetch: fetchPoolStatus,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display name for subscription tier
 */
export function getTierDisplayName(tier: string | null, tierConfigs: OrgTierConfig[]): string {
  if (!tier) return "No Subscription";
  const config = tierConfigs.find((t) => t.tier === tier);
  return config?.displayName || tier;
}

/**
 * Get status badge variant based on subscription status
 */
export function getStatusBadgeVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "trialing":
      return "secondary";
    case "past_due":
      return "destructive";
    case "canceled":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: string | null): string {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past Due";
    case "canceled":
      return "Canceled";
    default:
      return "Inactive";
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(0)}`;
}
