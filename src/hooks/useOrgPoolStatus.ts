/**
 * useOrgPoolStatus Hook
 * 
 * Fetches organization pool status and pricing configuration from database.
 * SSOT: Database tables (org_tier_config, lesson_pack_config) are the source of truth.
 * 
 * @location src/hooks/useOrgPoolStatus.ts
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

export interface OrgPoolStatus {
  // Subscription info
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  billingInterval: 'month' | 'year' | null;
  
  // Pool limits and usage
  lessonsLimit: number;
  lessonsUsedThisPeriod: number;
  bonusLessons: number;
  
  // Calculated values
  subscriptionRemaining: number;
  totalAvailable: number;
  usagePercentage: number;
  
  // Period info
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  daysUntilReset: number | null;
  
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

export interface LessonPackConfig {
  packType: string;
  displayName: string;
  lessonsIncluded: number;
  price: number;
  stripeProductId: string;
  stripePriceId: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UseOrgPoolStatusReturn {
  poolStatus: OrgPoolStatus | null;
  tierConfigs: OrgTierConfig[];
  lessonPackConfigs: LessonPackConfig[];
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
  const [lessonPackConfigs, setLessonPackConfigs] = useState<LessonPackConfig[]>([]);
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
          current_period_start,
          current_period_end,
          stripe_customer_id,
          stripe_subscription_id
        `)
        .eq("id", organizationId)
        .single();

      if (orgError) throw orgError;

      // Calculate derived values
      const lessonsLimit = orgData.lessons_limit || 0;
      const lessonsUsed = orgData.lessons_used_this_period || 0;
      const bonusLessons = orgData.bonus_lessons || 0;
      const subscriptionRemaining = Math.max(0, lessonsLimit - lessonsUsed);
      const totalAvailable = subscriptionRemaining + bonusLessons;
      
      // Calculate usage percentage (of subscription pool only)
      const usagePercentage = lessonsLimit > 0 
        ? Math.round((lessonsUsed / lessonsLimit) * 100) 
        : 0;

      // Calculate days until reset
      let daysUntilReset: number | null = null;
      if (orgData.current_period_end) {
        const endDate = new Date(orgData.current_period_end);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        daysUntilReset = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      setPoolStatus({
        subscriptionTier: orgData.subscription_tier,
        subscriptionStatus: orgData.subscription_status,
        billingInterval: orgData.billing_interval,
        lessonsLimit,
        lessonsUsedThisPeriod: lessonsUsed,
        bonusLessons,
        subscriptionRemaining,
        totalAvailable,
        usagePercentage,
        currentPeriodStart: orgData.current_period_start,
        currentPeriodEnd: orgData.current_period_end,
        daysUntilReset,
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

      // Fetch lesson pack configurations (SSOT from database)
      const { data: packData, error: packError } = await supabase
        .from("lesson_pack_config")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (packError) throw packError;

      setLessonPackConfigs(
        (packData || []).map((p) => ({
          packType: p.pack_type,
          displayName: p.display_name,
          lessonsIncluded: p.lessons_included,
          price: p.price,
          stripeProductId: p.stripe_product_id,
          stripePriceId: p.stripe_price_id,
          description: p.description,
          displayOrder: p.display_order,
          isActive: p.is_active,
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
    lessonPackConfigs,
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
