// =============================================================================
// usePricingPlans Hook
// SSOT: Reads from src/constants/pricingPlans.ts
// =============================================================================

import { useMemo } from 'react';
import {
  PRICING_PLANS,
  getPlansArray,
  getPaidPlans,
  getPlanByProductId,
  getPlanByPriceId,
  formatPrice,
  type PricingPlan,
  type PlanTier,
  type BillingInterval,
} from '@/constants/pricingPlans';

export function usePricingPlans() {
  const plans = useMemo(() => getPlansArray(), []);
  const paidPlans = useMemo(() => getPaidPlans(), []);

  return {
    // All plans
    plans,
    paidPlans,
    
    // Individual plans
    free: PRICING_PLANS.free,
    essentials: PRICING_PLANS.essentials,
    pro: PRICING_PLANS.pro,
    premier: PRICING_PLANS.premier,
    
    // Helpers
    getPlanByProductId,
    getPlanByPriceId,
    formatPrice,
  };
}

export type { PricingPlan, PlanTier, BillingInterval };
