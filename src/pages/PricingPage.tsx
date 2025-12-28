// ============================================================
// LESSONSPARK USA - PRICING PAGE (SSOT-COMPLIANT)
// Location: src/pages/PricingPage.tsx
// Prices come FROM Supabase database (synced via Stripe webhook)
// ============================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePricingPlans, formatPlanPrice, getAnnualSavings } from '@/hooks/usePricingPlans';
import { STRIPE_CONFIG, UPGRADE_PROMPTS, formatPrice, SubscriptionTier, DEFAULT_BILLING_INTERVAL } from '@/constants/pricingConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tier: currentTier, startCheckout } = useSubscription();
  const { freePlan, personalPlan, isLoading: plansLoading, error: plansError } = usePricingPlans();
  
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>(DEFAULT_BILLING_INTERVAL);
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionTier | null>(null);

  const paymentStatus = searchParams.get('payment');

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === 'free') {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
      return;
    }

    if (!user) {
      navigate('/auth?redirect=/pricing&plan=personal');
      return;
    }

    if (currentTier === tier) {
      navigate('/dashboard');
      return;
    }

    setLoadingPlan(tier);
    try {
      const priceId = billingInterval === 'year'
        ? STRIPE_CONFIG.PRICES.PERSONAL_ANNUAL
        : STRIPE_CONFIG.PRICES.PERSONAL_MONTHLY;

      const url = await startCheckout({
        priceId,
        billingInterval,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/pricing?payment=canceled`,
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonText = (tier: SubscriptionTier): string => {
    if (loadingPlan === tier) return 'Loading...';
    if (!user) return tier === 'free' ? 'Get Started Free' : 'Sign Up';
    if (currentTier === tier) return 'Current Plan';
    if (tier === 'free') return 'Downgrade';
    return 'Upgrade Now';
  };

  const isButtonDisabled = (tier: SubscriptionTier): boolean => {
    return loadingPlan !== null || (user !== null && currentTier === tier);
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-600" />
            <p className="mt-2 text-gray-600">Loading pricing...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (plansError || !freePlan || !personalPlan) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
          <Alert className="max-w-md border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Unable to load pricing information. Please refresh the page.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  const personalMonthlyDisplay = formatPlanPrice(personalPlan, 'month');
  const personalAnnualMonthlyDisplay = formatPlanPrice(personalPlan, 'year');
  const annualSavings = getAnnualSavings(personalPlan);
  const annualSavingsDisplay = formatPrice(annualSavings);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-sky-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Start free, upgrade when you need complete lessons. 
              No hidden fees, cancel anytime.
            </p>

            {paymentStatus === 'success' && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Payment successful! Your subscription is now active.
                </AlertDescription>
              </Alert>
            )}
            {paymentStatus === 'canceled' && (
              <Alert className="mb-6 border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  Checkout was canceled. You can try again when you are ready.
                </AlertDescription>
              </Alert>
            )}

            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white shadow-sm mb-8">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'month'
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'year'
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                {annualSavings > 0 && (
                  <span className="ml-2 text-xs text-green-600 font-semibold">
                    Save {annualSavingsDisplay}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FREE PLAN */}
            <Card className={`relative ${currentTier === 'free' && user ? 'ring-2 ring-gray-300' : ''}`}>
              {currentTier === 'free' && user && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-600">
                  Current Plan
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{freePlan.planName}</CardTitle>
                <CardDescription>{freePlan.bestFor || 'Try before you buy'}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span><strong>{freePlan.lessonsPerMonth}</strong> lessons per month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span><strong>3</strong> core sections</span>
                  </li>
                  {UPGRADE_PROMPTS.sections.freeIncluded.map((section) => (
                    <li key={section} className="flex items-center gap-3 text-gray-600">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{section}</span>
                    </li>
                  ))}
                  {UPGRADE_PROMPTS.sections.personalAdds.slice(0, 3).map((section) => (
                    <li key={section} className="flex items-center gap-3 text-gray-400">
                      <X className="h-5 w-5 flex-shrink-0" />
                      <span>{section}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSelectPlan('free')}
                  disabled={isButtonDisabled('free')}
                >
                  {getButtonText('free')}
                </Button>
              </CardFooter>
            </Card>

            {/* PERSONAL PLAN */}
            <Card className={`relative border-2 ${
              currentTier === 'personal' && user 
                ? 'ring-2 ring-sky-500 border-sky-500' 
                : 'border-sky-500'
            }`}>
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500">
                {currentTier === 'personal' && user ? 'Current Plan' : 'Most Popular'}
              </Badge>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{personalPlan.planName}</CardTitle>
                <CardDescription>{personalPlan.bestFor || 'Complete lessons for dedicated teachers'}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-2">
                  <span className="text-5xl font-bold">
                    {billingInterval === 'year' ? personalAnnualMonthlyDisplay : personalMonthlyDisplay}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                {billingInterval === 'year' && annualSavings > 0 && (
                  <p className="text-sm text-green-600 font-medium mb-4">
                    Billed annually at {formatPrice(personalPlan.priceAnnual)} (Save {annualSavingsDisplay})
                  </p>
                )}
                {billingInterval === 'month' && (
                  <p className="text-sm text-gray-500 mb-4">Billed monthly</p>
                )}
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3 font-medium text-sky-700">
                    <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <span><strong>{personalPlan.lessonsPerMonth}</strong> lessons per month</span>
                  </li>
                  <li className="flex items-center gap-3 font-medium text-sky-700">
                    <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <span><strong>All 8</strong> lesson sections</span>
                  </li>
                  {UPGRADE_PROMPTS.sections.freeIncluded.map((section) => (
                    <li key={section} className="flex items-center gap-3 text-gray-600">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{section}</span>
                    </li>
                  ))}
                  {UPGRADE_PROMPTS.sections.personalAdds.map((section) => (
                    <li key={section} className="flex items-center gap-3 font-medium text-sky-700">
                      <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <span>{section}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-sky-600 hover:bg-sky-700"
                  onClick={() => handleSelectPlan('personal')}
                  disabled={isButtonDisabled('personal')}
                >
                  {loadingPlan === 'personal' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      {currentTier !== 'personal' && <Sparkles className="h-4 w-4 mr-2" />}
                      {getButtonText('personal')}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="max-w-2xl mx-auto mt-16 text-center">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6 text-left">
              <div>
                <h3 className="font-semibold text-lg">What is included in a section?</h3>
                <p className="text-gray-600 mt-1">
                  Each lesson can have up to 8 sections covering different aspects: from theological 
                  background to interactive activities. Free users get the 3 core sections, while 
                  Personal users get all 8 for complete, well-rounded lessons.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Can I cancel anytime?</h3>
                <p className="text-gray-600 mt-1">Yes! You can <a href="/account" className="text-sky-600 hover:text-sky-700 underline">cancel</a> your subscription at any time. You will continue to have access until the end of your billing period.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">What payment methods do you accept?</h3>
                <p className="text-gray-600 mt-1">
                  We accept all major credit cards through our secure payment processor, Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}



