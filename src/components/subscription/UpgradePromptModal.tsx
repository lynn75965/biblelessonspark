// ============================================================
// BibleLessonSpark - UPGRADE PROMPT MODAL (SSOT-COMPLIANT)
// Location: src/components/subscription/UpgradePromptModal.tsx
//
// 2026-02-26: Added email confirmation step before checkout
// ============================================================

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePricingPlans, formatPlanPrice, getAnnualSavings } from '@/hooks/usePricingPlans';
import { UPGRADE_PROMPTS, formatPrice } from '@/constants/pricingConfig';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'limit_reached' | 'feature_teaser' | 'manual';
}

export function UpgradePromptModal({ 
  isOpen, 
  onClose, 
  trigger = 'limit_reached' 
}: UpgradePromptModalProps) {
  const { user } = useAuth();
  const { startCheckout, lessonsUsed, lessonsLimit, resetDate, tier } = useSubscription();
  const { freePlan, personalPlan, isLoading: plansLoading } = usePricingPlans();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);

  const prompt = trigger === 'limit_reached' 
    ? UPGRADE_PROMPTS.limitReached 
    : UPGRADE_PROMPTS.featureTeaser;

  const handleUpgradeClick = () => {
    // Show email confirmation before proceeding to Stripe
    setShowEmailConfirm(true);
  };

  const proceedToCheckout = async () => {
    setShowEmailConfirm(false);
    setIsLoading(true);
    try {
      const priceId = billingInterval === 'year'
        ? personalPlan.stripePriceIdAnnual
        : personalPlan.stripePriceIdMonthly;

      const url = await startCheckout({
        priceId: priceId ?? '',
        billingInterval,
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResetDate = () => {
    if (!resetDate) return 'next month';
    return resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  if (plansLoading || !freePlan || !personalPlan) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Personal tier users who hit their limit - show "wait for reset" message
  if (tier === 'personal' && trigger === 'limit_reached') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Star className="h-5 w-5 text-amber-500" />
              Monthly Limit Reached
            </DialogTitle>
            <DialogDescription className="text-base">
              <span className="text-amber-600 font-medium">
                You have used {lessonsUsed} of {lessonsLimit} lessons this month.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
            <p className="text-sm text-foreground">
              Your lesson limit will reset on <strong>{formatResetDate()}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Thank you for being a Personal subscriber! If you need more lessons, 
              please contact support.
            </p>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={onClose} className="bg-sky-600 hover:bg-sky-700">
              Got It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const monthlyPrice = formatPlanPrice(personalPlan, 'month');
  const annualMonthlyPrice = formatPlanPrice(personalPlan, 'year');
  const annualSavings = getAnnualSavings(personalPlan);
  const annualSavingsDisplay = formatPrice(annualSavings);

  // Email confirmation step
  if (showEmailConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={() => { setShowEmailConfirm(false); onClose(); }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-5 w-5 text-primary" />
              Confirm Your Account Email
            </DialogTitle>
            <DialogDescription className="text-base">
              Please verify this is the correct email for your subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">
              Your subscription will be linked to:
            </p>
            <p className="text-lg font-semibold text-primary break-all">
              {user?.email}
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Make sure this is the email you use to log in to BibleLessonSpark.
              If you need to use a different email, please log out and sign in 
              with the correct email before upgrading.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowEmailConfirm(false)} 
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              onClick={proceedToCheckout}
              disabled={isLoading}
              className="flex-1 bg-sky-600 hover:bg-sky-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Yes, Continue to Checkout
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Star className="h-5 w-5 text-amber-500" />
            {prompt.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {trigger === 'limit_reached' && (
              <span className="text-destructive font-medium">
                You have used {lessonsUsed} of {lessonsLimit} lessons. 
                Your limit resets on {formatResetDate()}.
              </span>
            )}
            {trigger !== 'limit_reached' && prompt.description}
          </DialogDescription>
        </DialogHeader>

        <p className="text-center text-sm italic text-muted-foreground py-3 border-y border-border my-4">
          A good lesson teaches. An equipped teacher disciples.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* LEFT COLUMN -- Where you are */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wide mb-2">Where you are</p>
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">{freePlan.planName}</h3>
              <p className="text-2xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">Your current plan</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                {freePlan.lessonsPerMonth} lessons per month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                3 core sections only
              </li>
              {UPGRADE_PROMPTS.sections.freeIncluded.map((section) => (
                <li key={section} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  {section}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT COLUMN -- Where you could take them */}
          <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 relative">
            <Badge className="absolute -top-2 -right-2 bg-secondary">
              Recommended
            </Badge>
            <p className="text-xs font-bold text-primary text-center uppercase tracking-wide mb-2">Where you could take them</p>
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">{personalPlan.planName}</h3>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold">
                  {billingInterval === 'year' ? annualMonthlyPrice : monthlyPrice}
                </p>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              {billingInterval === 'year' && annualSavings > 0 && (
                <p className="text-xs text-primary font-medium">
                  Save {annualSavingsDisplay}/year
                </p>
              )}
            </div>

            {/* Band 1 -- All lesson sections */}
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                {personalPlan.lessonsPerMonth} lessons/month
              </li>
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                <strong>All 8</strong> lesson sections
              </li>
              {UPGRADE_PROMPTS.sections.freeIncluded.map((section) => (
                <li key={section} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  {section}
                </li>
              ))}
              {UPGRADE_PROMPTS.sections.paidAdds.map((section) => (
                <li key={section} className="flex items-center gap-2 text-primary font-medium">
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  {section}
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div className="border-t border-primary/20 my-3" />

            {/* Band 2 -- Beyond Sunday */}
            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2" aria-hidden="true">Beyond Sunday</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-primary font-medium">
                <Star className="h-4 w-4 text-primary" aria-hidden="true" />
                DevotionalSpark follow-up for your class
              </li>
              <li className="flex items-center gap-2 text-primary font-medium">
                <Star className="h-4 w-4 text-primary" aria-hidden="true" />
                Series of 2 to 13 lessons
              </li>
              <li className="flex items-center gap-2 text-primary font-medium">
                <Star className="h-4 w-4 text-primary" aria-hidden="true" />
                Publish as booklet, ePub, or Kindle curriculum
              </li>
            </ul>

            <p className="text-xs text-muted-foreground italic mt-3">
              A free account prepares a lesson. The Personal Plan equips a class.
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <div className="inline-flex rounded-lg border p-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'month'
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly ({monthlyPrice})
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'year'
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly ({formatPrice(personalPlan.priceAnnual)})
              {annualSavings > 0 && (
                <span className="ml-1 text-xs text-primary">Save {annualSavingsDisplay}</span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Not right now
          </Button>
          <Button
            onClick={handleUpgradeClick}
            disabled={isLoading}
            aria-label="Yes, upgrade to Personal Plan and do more for your class"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Yes {'\u2014'} Let's Do More
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Cancel anytime before your next billing date. No charges after cancellation.
        </p>
      </DialogContent>
    </Dialog>
  );
}
