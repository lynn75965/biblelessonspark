// ============================================================
// BibleLessonSpark - SUBSCRIPTION HOOK
// Location: src/hooks/useSubscription.tsx
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { STRIPE_INDIVIDUAL, SubscriptionTier, getTierSections, isPaidTier, TIER_LESSON_LIMITS } from '@/constants/pricingConfig';
import { TRIAL_CONFIG, getTrialStatus } from '@/constants/trialConfig';

interface SubscriptionState {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  lessonsUsed: number;
  lessonsLimit: number;
  canGenerate: boolean;
  sectionsAllowed: string[];
  includesTeaser: boolean;
  resetDate: Date | null;
  billingInterval: 'month' | 'year' | null;
  upgradeNeeded: boolean;
  isLoading: boolean;
  error: string | null;
  trialFullUsed: number;
  trialShortUsed: number;
  // Free-tier trial-derived fields (Phase 3). For paid tiers: fullRemaining /
  // shortRemaining are 0 and nextLessonType is 'full'.
  fullRemaining: number;
  shortRemaining: number;
  nextLessonType: 'full' | 'short' | null;
}

interface CheckoutOptions {
  priceId: string;
  billingInterval: 'month' | 'year';
  successUrl?: string;
  cancelUrl?: string;
  // B7: descriptive-only, not security-relevant (Rule #30's price_id/URL
  // validation is unaffected). Threaded through to create-checkout-session
  // so the server-side checkout_started conversion event retains which of
  // the three conversion moments led here.
  triggerSource?: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    status: 'active',
    lessonsUsed: 0,
    lessonsLimit: TIER_LESSON_LIMITS.free,
    canGenerate: true,
    sectionsAllowed: getTierSections('free'),
    includesTeaser: false,
    resetDate: null,
    billingInterval: null,
    upgradeNeeded: false,
    isLoading: true,
    error: null,
    trialFullUsed: 0,
    trialShortUsed: 0,
    fullRemaining: TRIAL_CONFIG.fullLessonsPerPeriod,
    shortRemaining: TRIAL_CONFIG.shortLessonsPerPeriod,
    nextLessonType: 'full',
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
        const resolvedTier: SubscriptionTier = result.tier || 'free';

        const fullLimit  = TRIAL_CONFIG.fullLessonsPerPeriod;   // 3
        const shortLimit = TRIAL_CONFIG.shortLessonsPerPeriod;  // 2

        if (resolvedTier === 'free') {
          // FREE-TIER SSOT: gating, remaining counts, reset date, and the
          // next-lesson type are ALL derived from the profiles trial counters
          // via getTrialStatus -- never from the flat RPC lessons_used counter.
          // (Phase 3 / Decisions 1 + 5: one authoritative free counter. The
          // backend is the only writer of those counters.)
          const { data: profile } = await supabase
            .from('profiles')
            .select('trial_full_lessons_used, trial_short_lessons_used, trial_period_start, trial_full_lesson_granted_until')
            .eq('id', user.id)
            .single();

          const trialFull  = profile?.trial_full_lessons_used ?? 0;
          const trialShort = profile?.trial_short_lessons_used ?? 0;

          const ts = getTrialStatus(
            profile?.trial_period_start ?? null,
            trialFull,
            trialShort,
            profile?.trial_full_lesson_granted_until ?? null
          );

          const nextLessonType: 'full' | 'short' | null =
            ts.fullAvailable ? 'full' : (ts.shortAvailable ? 'short' : null);

          setState({
            tier: resolvedTier,
            status: 'active',
            lessonsUsed: trialFull + trialShort,
            lessonsLimit: fullLimit + shortLimit,
            canGenerate: ts.canGenerateAny,
            sectionsAllowed: nextLessonType === 'full'
              ? getTierSections('personal')
              : getTierSections('free'),
            includesTeaser: nextLessonType === 'full',
            resetDate: ts.periodEnd,
            billingInterval: null,
            upgradeNeeded: !ts.canGenerateAny,
            isLoading: false,
            error: null,
            trialFullUsed: trialFull,
            trialShortUsed: trialShort,
            fullRemaining: ts.fullLessonsRemaining,
            shortRemaining: ts.shortLessonsRemaining,
            nextLessonType,
          });
        } else {
          // PAID TIERS: gating + reset date come from check_lesson_limit
          // (user_subscriptions), which the backend now increments server-side.
          // Paid lessons are always full; the short tier does not apply.
          setState({
            tier: resolvedTier,
            status: 'active',
            lessonsUsed: result.lessons_used || 0,
            lessonsLimit: result.lessons_limit || TIER_LESSON_LIMITS.free,
            canGenerate: result.can_generate ?? true,
            sectionsAllowed: result.sections_allowed || getTierSections(resolvedTier),
            includesTeaser: result.includes_teaser ?? true,
            resetDate: result.reset_date ? new Date(result.reset_date) : null,
            billingInterval: result.billing_interval || null,
            upgradeNeeded: result.upgrade_needed ?? false,
            isLoading: false,
            error: null,
            trialFullUsed: 0,
            trialShortUsed: 0,
            fullRemaining: 0,
            shortRemaining: 0,
            nextLessonType: 'full',
          });
        }
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

  // NOTE: There is intentionally NO client-side usage increment. Usage is
  // written server-side ONLY (generate-lesson edge function): free tier ->
  // profiles.trial_* counters, paid tier -> increment_lesson_usage, org ->
  // pool consumption. The client only READS via refreshSubscription.
  // (Phase 3 / Decision 2: one writer, server-side.)

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
          trigger_source: options.triggerSource,
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

  const openCustomerPortal = useCallback(async (returnUrl?: string): Promise<string | null> => {
    if (!user) {
      console.error('No user for portal');
      return null;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session for portal');
        return null;
      }

      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { return_url: returnUrl },
      });

      if (error) {
        console.error('Portal session error:', error);
        return null;
      }

      return data?.url || null;
    } catch (err) {
      console.error('Portal error:', err);
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
        reason: `You have used all ${state.lessonsLimit} lessons this period. Upgrade for more lessons.`,
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
      ? STRIPE_INDIVIDUAL.personal.prices.annual
      : STRIPE_INDIVIDUAL.personal.prices.monthly;

    return startCheckout({
      priceId,
      billingInterval: interval,
    });
  }, [startCheckout]);

  return {
    ...state,
    refreshSubscription: fetchSubscription,
    startCheckout,
    openCustomerPortal,
    checkCanGenerate,
    getUpgradeUrl,
    isFreeTier: state.tier === 'free',
    isPaidTier: isPaidTier(state.tier),
    usagePercentage: state.lessonsLimit > 0 
      ? Math.round((state.lessonsUsed / state.lessonsLimit) * 100) 
      : 0,
    lessonsRemaining: state.lessonsLimit - state.lessonsUsed,
  };
}
