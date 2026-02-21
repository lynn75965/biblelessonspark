// ============================================================
// BibleLessonSpark - UPGRADE PROMPT MODAL (SSOT-COMPLIANT)
// Location: src/components/subscription/UpgradePromptModal.tsx
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
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
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
  const { startCheckout, lessonsUsed, lessonsLimit, resetDate, tier } = useSubscription();
  const { freePlan, personalPlan, isLoading: plansLoading } = usePricingPlans();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);

  const prompt = trigger === 'limit_reached' 
    ? UPGRADE_PROMPTS.limitReached 
    : UPGRADE_PROMPTS.featureTeaser;

  const handleUpgrade = async () => {
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
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
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
              <Sparkles className="h-5 w-5 text-amber-500" />
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-amber-500" />
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

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg">{freePlan.planName}</h3>
              <p className="text-2xl font-bold">$0</p>
              <p className="text-sm text-muted-foreground">Your current plan</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {freePlan.lessonsPerMonth} lessons/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {freePlan.sectionsIncluded.length} sections
              </li>
              {UPGRADE_PROMPTS.sections.freeIncluded.map((section) => (
                <li key={section} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  {section}
                </li>
              ))}
              {UPGRADE_PROMPTS.sections.paidAdds.slice(0, 3).map((section) => (
                <li key={section} className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  {section}
                </li>
              ))}
              <li className="text-muted-foreground text-xs ml-6">
                + {UPGRADE_PROMPTS.sections.paidAdds.length - 3} more sections...
              </li>
            </ul>
          </div>

          <div className="border-2 border-sky-500 rounded-lg p-4 bg-sky-50 relative">
            <Badge className="absolute -top-2 -right-2 bg-secondary">
              Recommended
            </Badge>
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
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 font-medium text-accent">
                <Check className="h-4 w-4 text-sky-600" />
                {personalPlan.lessonsPerMonth} lessons/month
              </li>
              <li className="flex items-center gap-2 font-medium text-accent">
                <Check className="h-4 w-4 text-sky-600" />
                {personalPlan.sectionsIncluded.length} sections (all!)
              </li>
              {UPGRADE_PROMPTS.sections.freeIncluded.map((section) => (
                <li key={section} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {section}
                </li>
              ))}
              {UPGRADE_PROMPTS.sections.paidAdds.map((section) => (
                <li key={section} className="flex items-center gap-2 text-accent font-medium">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {section}
                </li>
              ))}
            </ul>
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
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
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
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to {personalPlan.planName}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Cancel anytime. No questions asked.
        </p>
      </DialogContent>
    </Dialog>
  );
}


