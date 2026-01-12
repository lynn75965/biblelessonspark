// ============================================================
// BibleLessonSpark - PRICING PLANS HOOK (SSOT-COMPLIANT)
// Location: src/hooks/usePricingPlans.tsx
//
// Prices come FROM Supabase (which got them from Stripe webhook)
// This hook READS from database, never hardcodes prices
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionTier, formatPrice } from '@/constants/pricingConfig';

export interface PricingPlan {
  id: string;
  tier: SubscriptionTier;
  planName: string;
  priceMonthly: number;
  priceAnnual: number;
  lessonsPerMonth: number;
  sectionsIncluded: string[];
  includesTeaser: boolean;
  includesModernParables: boolean;
  displayOrder: number;
  bestFor: string | null;
  stripePriceIdMonthly: string | null;
  stripePriceIdAnnual: string | null;
}

interface UsePricingPlansReturn {
  plans: PricingPlan[];
  freePlan: PricingPlan | null;
  personalPlan: PricingPlan | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePricingPlans(): UsePricingPlansReturn {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        console.error('Error fetching pricing plans:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        const mappedPlans: PricingPlan[] = data.map((row: any) => ({
          id: row.id,
          tier: row.tier as SubscriptionTier,
          planName: row.plan_name,
          priceMonthly: row.price_monthly,
          priceAnnual: row.price_annual,
          lessonsPerMonth: row.lessons_per_month,
          sectionsIncluded: row.sections_included || [],
          includesTeaser: row.includes_teaser || false,
          includesModernParables: row.includes_modern_parables ?? true,
          displayOrder: row.display_order,
          bestFor: row.best_for,
          stripePriceIdMonthly: row.stripe_price_id_monthly,
          stripePriceIdAnnual: row.stripe_price_id_annual,
        }));

        setPlans(mappedPlans);
      }
    } catch (err) {
      console.error('Pricing plans fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pricing');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const freePlan = plans.find((p) => p.tier === 'free') || null;
  const personalPlan = plans.find((p) => p.tier === 'personal') || null;

  return {
    plans,
    freePlan,
    personalPlan,
    isLoading,
    error,
    refetch: fetchPlans,
  };
}

export function formatPlanPrice(plan: PricingPlan, interval: 'month' | 'year'): string {
  if (plan.tier === 'free') return '$0';
  
  if (interval === 'year') {
    const monthlyEquivalent = plan.priceAnnual / 12;
    return formatPrice(monthlyEquivalent);
  }
  
  return formatPrice(plan.priceMonthly);
}

export function getAnnualSavings(plan: PricingPlan): number {
  if (plan.tier === 'free') return 0;
  const yearlyIfMonthly = plan.priceMonthly * 12;
  return yearlyIfMonthly - plan.priceAnnual;
}
