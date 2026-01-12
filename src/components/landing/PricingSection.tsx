// ============================================================
// BibleLessonSpark - LANDING PAGE PRICING SECTION (SSOT-COMPLIANT)
// Location: src/components/landing/PricingSection.tsx
// Uses usePricingPlans hook - same SSOT as PricingPage.tsx
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { usePricingPlans, formatPlanPrice, getAnnualSavings } from "@/hooks/usePricingPlans";
import { UPGRADE_PROMPTS, formatPrice } from "@/constants/pricingConfig";

export function PricingSection() {
  const navigate = useNavigate();
  const { freePlan, personalPlan, isLoading, error } = usePricingPlans();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');

  // Load saved billing cycle preference
  useEffect(() => {
    const saved = localStorage.getItem("billing-cycle");
    if (saved === "month" || saved === "year") {
      setBillingInterval(saved);
    }
  }, []);

  // Persist billing cycle choice
  useEffect(() => {
    localStorage.setItem("billing-cycle", billingInterval);
  }, [billingInterval]);

  const handleGetStarted = (tier: 'free' | 'personal') => {
    if (tier === 'free') {
      navigate('/auth');
    } else {
      navigate('/auth?redirect=/pricing&plan=personal');
    }
  };

  if (isLoading) {
    return (
      <section id="pricing" className="py-10 sm:py-16 lg:py-20">
        <div className="container px-4 sm:px-6">
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm sm:text-base text-muted-foreground mt-3 sm:mt-4">Loading pricing plans…</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !freePlan || !personalPlan) {
    return (
      <section id="pricing" className="py-10 sm:py-16 lg:py-20">
        <div className="container px-4 sm:px-6">
          <div className="text-center py-12 sm:py-16 lg:py-20 px-4">
            <p className="text-sm sm:text-base text-muted-foreground">
              Unable to load pricing. Please <a href="/pricing" className="text-primary underline">visit our pricing page</a>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const personalMonthlyDisplay = formatPlanPrice(personalPlan, 'month');
  const personalAnnualMonthlyDisplay = formatPlanPrice(personalPlan, 'year');
  const annualSavings = getAnnualSavings(personalPlan);
  const annualSavingsDisplay = formatPrice(annualSavings);

  return (
    <section id="pricing" className="py-10 sm:py-16 lg:py-20">
      <div className="container px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
          <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">
            Pricing
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Start free, upgrade when you need complete lessons. No hidden fees, cancel anytime.
          </p>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6 lg:mt-8 rounded-full border-2 border-border bg-card px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-sm w-auto max-w-full">
            <button
              onClick={() => setBillingInterval("month")}
              className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-h-[36px] sm:min-h-[40px] ${
                billingInterval === "month"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-pressed={billingInterval === "month"}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-h-[36px] sm:min-h-[40px] ${
                billingInterval === "year"
                  ? "bg-gradient-to-r from-secondary to-warning text-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-pressed={billingInterval === "year"}
            >
              Yearly{" "}
              {annualSavings > 0 && (
                <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs opacity-90 font-semibold whitespace-nowrap">
                  (Save {annualSavingsDisplay})
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* FREE PLAN */}
          <Card className="relative overflow-hidden transition-all duration-300 border-border hover:border-primary/30 hover:shadow-lg bg-gradient-card">
            <CardHeader className="text-center px-4 sm:px-6 pt-6 pb-2">
              <CardTitle className="text-xl sm:text-2xl font-semibold">{freePlan.planName}</CardTitle>
              <CardDescription className="text-sm">
                {freePlan.bestFor || 'Try before you buy'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6">
              <div className="mb-6">
                <span className="text-4xl sm:text-5xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-3 text-left">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span><strong>{freePlan.lessonsPerMonth}</strong> lessons per month</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span><strong>3</strong> core sections</span>
                </li>
                {UPGRADE_PROMPTS.sections.freeIncluded.map((section) => (
                  <li key={section} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{section}</span>
                  </li>
                ))}
                {UPGRADE_PROMPTS.sections.personalAdds.slice(0, 3).map((section) => (
                  <li key={section} className="flex items-center gap-3 text-sm text-muted-foreground/50">
                    <X className="h-5 w-5 flex-shrink-0" />
                    <span>{section}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="px-4 sm:px-6 pb-6">
              <Button
                variant="outline"
                className="w-full min-h-[44px]"
                onClick={() => handleGetStarted('free')}
              >
                Get Started Free
              </Button>
            </CardFooter>
          </Card>

          {/* PERSONAL PLAN */}
          <Card className="relative overflow-hidden transition-all duration-300 border-2 border-sky-500 shadow-xl md:scale-[1.02] bg-gradient-to-br from-white via-sky-50/50 to-white dark:from-card dark:via-sky-900/10 dark:to-card">
            <div className="absolute -top-0 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-amber-500 text-white px-4 py-1.5 rounded-b-lg text-xs sm:text-sm font-semibold shadow-md">
                Most Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center px-4 sm:px-6 pt-10 pb-2">
              <CardTitle className="text-xl sm:text-2xl font-semibold">{personalPlan.planName}</CardTitle>
              <CardDescription className="text-sm">
                {personalPlan.bestFor || 'Volunteer teachers who want complete lessons'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6">
              <div className="mb-2">
                <span className="text-4xl sm:text-5xl font-bold">
                  {billingInterval === 'year' ? personalAnnualMonthlyDisplay : personalMonthlyDisplay}
                </span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              {billingInterval === 'year' && annualSavings > 0 && (
                <p className="text-sm text-green-600 font-medium mb-4">
                  Billed annually at {formatPrice(personalPlan.priceAnnual)} (Save {annualSavingsDisplay})
                </p>
              )}
              {billingInterval === 'month' && (
                <p className="text-sm text-muted-foreground mb-4">Billed monthly</p>
              )}
              <ul className="space-y-3 text-left">
                <li className="flex items-center gap-3 text-sm font-medium text-sky-700">
                  <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <span><strong>{personalPlan.lessonsPerMonth}</strong> lessons per month</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-sky-700">
                  <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <span><strong>All 8</strong> lesson sections</span>
                </li>
                {UPGRADE_PROMPTS.sections.freeIncluded.map((section) => (
                  <li key={section} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{section}</span>
                  </li>
                ))}
                {UPGRADE_PROMPTS.sections.personalAdds.map((section) => (
                  <li key={section} className="flex items-center gap-3 text-sm font-medium text-sky-700">
                    <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <span>{section}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="px-4 sm:px-6 pb-6">
              <Button
                className="w-full min-h-[44px] bg-sky-600 hover:bg-sky-700"
                onClick={() => handleGetStarted('personal')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-12 sm:mt-16 text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-6">Frequently Asked Questions</h3>
          <div className="space-y-6 text-left">
            <div>
              <h4 className="font-semibold text-base sm:text-lg">What is included in a section?</h4>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Each lesson can have up to 8 sections covering different aspects: from theological 
                background to interactive activities. Free users get the 3 core sections, while 
                Personal users get all 8 for complete, well-rounded lessons.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-base sm:text-lg">Can I cancel anytime?</h4>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Yes! You can <a href="/account" className="text-sky-600 hover:text-sky-700 underline">cancel</a> your subscription at any time. You will continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-base sm:text-lg">What payment methods do you accept?</h4>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
