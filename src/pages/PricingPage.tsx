// =============================================================================
// PricingPage - Display pricing plans with Stripe checkout
// SSOT: Uses pricingPlans.ts for plan data
// =============================================================================

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import type { BillingInterval, PricingPlan } from '@/constants/pricingPlans';

export default function PricingPage() {
  const { plans, formatPrice } = usePricingPlans();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.id === 'free') {
      // Free plan - just go to auth/signup
      if (!user) {
        navigate(ROUTES.AUTH);
      } else {
        navigate(ROUTES.WORKSPACE);
      }
      return;
    }

    // Paid plan - get Stripe price ID
    const priceId = billingInterval === 'monthly' 
      ? plan.prices.monthly.stripePriceId 
      : plan.prices.annual.stripePriceId;

    if (!priceId) {
      console.error('No price ID for plan:', plan.id);
      return;
    }

    if (!user) {
      navigate(ROUTES.AUTH + '?redirect=pricing&plan=' + plan.id);
      return;
    }

    // Create Stripe checkout session
    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate(ROUTES.AUTH + '?redirect=pricing&plan=' + plan.id);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to start checkout. Please try again.');
    }
  };

  const getFeatureList = (plan: PricingPlan): string[] => {
    const features: string[] = [];
    
    if (plan.features.lessonsPerMonth === 'unlimited') {
      features.push('Unlimited lessons per month');
    } else {
      features.push(`${plan.features.lessonsPerMonth} lessons per month`);
    }
    
    features.push(plan.features.tierAccess === 'full' ? 'Full lesson templates' : 'Basic lesson templates');
    
    if (plan.features.exportFormats.length > 1) {
      features.push('Export to PDF, Word, Print');
    } else {
      features.push('Print only');
    }
    
    if (plan.features.customization) {
      features.push('Full customization options');
    }
    
    if (plan.features.prioritySupport) {
      features.push('Priority support');
    }
    
    if (plan.features.teamMembers > 1) {
      features.push(`Up to ${plan.features.teamMembers} team members`);
    }
    
    if (plan.features.orgFeatures) {
      features.push('Organization management');
    }
    
    return features;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your ministry. All plans include our core 
            AI-powered lesson generation technology.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label htmlFor="billing-toggle" className={billingInterval === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingInterval === 'annual'}
            onCheckedChange={(checked) => setBillingInterval(checked ? 'annual' : 'monthly')}
          />
          <Label htmlFor="billing-toggle" className={billingInterval === 'annual' ? 'font-semibold' : 'text-muted-foreground'}>
            Annual
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              Save ~17%
            </Badge>
          </Label>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const price = billingInterval === 'monthly' 
              ? plan.prices.monthly.amount 
              : plan.prices.annual.amount;
            const perMonth = billingInterval === 'annual' 
              ? Math.round(price / 12) 
              : price;

            return (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription className="min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Free' : formatPrice(perMonth)}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                    {billingInterval === 'annual' && price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Billed {formatPrice(price)} annually
                      </p>
                    )}
                  </div>
                  
                  <ul className="space-y-3">
                    {getFeatureList(plan).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.id === 'free' ? 'Get Started' : 'Subscribe'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <p className="text-center text-muted-foreground mt-12">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>
      </div>
      <Footer />
    </>
  );
}








