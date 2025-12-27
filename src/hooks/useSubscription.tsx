// ============================================================
// LESSONSPARK USA - SUBSCRIPTION HOOK
// Location: src/hooks/useSubscription.tsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { STRIPE_CONFIG, SubscriptionTier, getTierSections } from '@/constants/pricingConfig';

interface SubscriptionState {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  lessonsUsed: number;
  lessonsLimit: number;
  canGenerate: boolean;
  sectionsAllowed: string[];
  includesTeaser: boolean;
  resetDate: Date | null;
  upgradeNeeded: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CheckoutOptions {
  priceId: string;
  billingInterval: 'month' | 'year';
  successUrl?: string;
  cancelUrl?: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    status: 'active',
    lessonsUsed: 0,
    lessonsLimit: 5,
    canGenerate: true,
    sectionsAllowed: getTierSections('free'),
    includesTeaser: false,
    resetDate: null,
    upgradeNeeded: false,
    isLoading: true,
    error: null,
  });

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('check_lesson_limit', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching subscription:', error);
        setState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setState({
          tier: result.tier || 'free',
          status: 'active',
          lessonsUsed: result.lessons_used || 0,
          lessonsLimit: result.lessons_limit || 5,
          canGenerate: result.can_generate ?? true,
          sectionsAllowed: result.sections_allowed || getTierSections('free'),
          includesTeaser: result.includes_teaser ?? false,
          resetDate: result.reset_date ? new Date(result.reset_date) : null,
          upgradeNeeded: result.upgrade_needed ?? false,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error('Subscription fetch error:', err);
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to load subscription',
        isLoading: false 
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .rpc('increment_lesson_usage', { p_user_id: user.id });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      await fetchSubscription();
      return true;
    } catch (err) {
      console.error('Increment usage error:', err);
      return false;
    }
  }, [user, fetchSubscription]);

  const startCheckout = useCallback(async (options: CheckoutOptions): Promise<string | null> => {
    if (!user) {
      console.error('No user for checkout');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          price_id: options.priceId,
          billing_interval: options.billingInterval,
          success_url: options.successUrl,
          cancel_url: options.cancelUrl,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        return null;
      }

      return data?.url || null;
    } catch (err) {
      console.error('Checkout error:', err);
      return null;
    }
  }, [user]);

  const checkCanGenerate = useCallback(async (): Promise<{
    canGenerate: boolean;
    reason?: string;
    sectionsAllowed: string[];
  }> => {
    await fetchSubscription();
    
    if (!state.canGenerate) {
      return {
        canGenerate: false,
        reason: `You have used all ${state.lessonsLimit} lessons this month. Upgrade to Personal for more lessons.`,
        sectionsAllowed: state.sectionsAllowed,
      };
    }

    return {
      canGenerate: true,
      sectionsAllowed: state.sectionsAllowed,
    };
  }, [fetchSubscription, state]);

  const getUpgradeUrl = useCallback(async (interval: 'month' | 'year' = 'month'): Promise<string | null> => {
    const priceId = interval === 'year' 
      ? STRIPE_CONFIG.PRICES.PERSONAL_ANNUAL 
      : STRIPE_CONFIG.PRICES.PERSONAL_MONTHLY;

    return startCheckout({
      priceId,
      billingInterval: interval,
    });
  }, [startCheckout]);

  return {
    ...state,
    refreshSubscription: fetchSubscription,
    incrementUsage,
    startCheckout,
    openCustomerPortal,
    checkCanGenerate,
    getUpgradeUrl,
    isFreeTier: state.tier === 'free',
    isPaidTier: state.tier === 'personal',
    usagePercentage: state.lessonsLimit > 0 
      ? Math.round((state.lessonsUsed / state.lessonsLimit) * 100) 
      : 0,
    lessonsRemaining: state.lessonsLimit - state.lessonsUsed,
  };
}
