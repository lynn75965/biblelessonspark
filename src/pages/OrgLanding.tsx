// src/pages/OrgLanding.tsx
// Self-Service Shepherd Entry Point - Landing Page
// Stack 2: Shepherd (Org Manager) - Ministry leaders managing their teaching ministry
//
// Entry points:
//   A. Direct URL: biblelessonspark.com/org
//   B. Post-signup prompt on dashboard
//   C. Direct link sent by Platform Admin
//
// Banner for existing org owners added (February 2026)

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BRANDING } from '@/config/branding';
import { ORG_TIERS, getActiveOrgTiers } from '@/constants/orgPricingConfig';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Church, Users, BookOpen, Shield, ArrowRight, Sparkles, LayoutDashboard } from 'lucide-react';

const OrgLanding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');

  // Existing-org banner state
  const [existingOrgName, setExistingOrgName] = useState<string | null>(null);
  const [checkingOrg, setCheckingOrg] = useState(false);

  const activeTiers = getActiveOrgTiers();

  // Check if logged-in user already owns an organization
  useEffect(() => {
    if (!user) {
      setExistingOrgName(null);
      return;
    }

    const checkExistingOrg = async () => {
      setCheckingOrg(true);
      try {
        // Look for org membership with 'owner' role
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .limit(1)
          .maybeSingle();

        if (membership?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', membership.organization_id)
            .single();

          if (org) {
            setExistingOrgName(org.name);
          }
        }
      } catch (error) {
        console.error('Error checking existing org:', error);
      }
      setCheckingOrg(false);
    };

    checkExistingOrg();
  }, [user]);

  // Handle "Get Started" click
  const handleGetStarted = (tierKey?: string) => {
    if (!user) {
      // Not logged in - redirect to auth with return URL
      const returnUrl = tierKey ? `/org/setup?tier=${tierKey}` : '/org/setup';
      navigate(`/auth?returnTo=${encodeURIComponent(returnUrl)}`);
    } else {
      // Logged in - go directly to setup
      const setupUrl = tierKey ? `/org/setup?tier=${tierKey}` : '/org/setup';
      navigate(setupUrl);
    }
  };

  // Format price display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate savings percentage for annual
  const calculateSavings = (monthly: number, annual: number) => {
    const yearlyCostIfMonthly = monthly * 12;
    const savings = yearlyCostIfMonthly - annual;
    const percentage = Math.round((savings / yearlyCostIfMonthly) * 100);
    return { savings, percentage };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img 
              src={BRANDING.logo.primary} 
              alt={BRANDING.logo.altText} 
              className="h-8 w-auto"
            />
            <span className="font-semibold text-lg text-primary hidden sm:inline">
              {BRANDING.appName}
            </span>
          </a>
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button onClick={() => handleGetStarted()}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Existing Org Banner — for logged-in users who already own an organization */}
      {user && existingOrgName && (
        <div className="bg-primary/5 border-b border-primary/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Church className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-foreground">
                  You already manage <strong>{existingOrgName}</strong>.
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/org-manager')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Go to Org Manager
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Church className="h-3 w-3 mr-1" />
            For Ministry Leaders
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Shepherd Your Teaching Ministry
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Equip your teachers with BibleLessonSpark-powered lesson preparation. 
            Share a lesson pool across your teaching team and see how God is working 
            through your teaching ministry in every way at any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => handleGetStarted()} className="text-lg px-8">
              Set Up Your Organization
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/')}>
              Learn More About {BRANDING.appName}
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 px-4 sm:px-6 bg-background/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            What You Get as a Shepherd
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Shared Lesson Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your teachers draw from a shared monthly pool of lessons. 
                  No per-seat pricing — invite as many teachers as you need.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Shared Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Set an organization-wide passage or theme. Your teachers see your suggestion 
                  and can align their lessons — or teach their own calling.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Pastoral Oversight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  See which teachers are preparing, view lessons funded by your pool, 
                  and encourage your team — all from one dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Choose Your Shepherd Tier
            </h2>
            <p className="text-muted-foreground mb-6">
              Every tier includes unlimited teachers. You're paying for lesson capacity, not seats.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-2 bg-muted rounded-lg p-1">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'monthly'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'annual'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
                <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
              </button>
            </div>
          </div>

          {/* Tier Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {activeTiers.map((tier) => {
              const price = billingInterval === 'annual' ? tier.priceAnnual : tier.priceMonthly;
              const { savings } = calculateSavings(tier.priceMonthly, tier.priceAnnual);
              const isPopular = tier.tier === 'org_growth'; // Middle tier

              return (
                <Card 
                  key={tier.tier} 
                  className={`relative flex flex-col ${
                    isPopular ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{tier.displayName}</CardTitle>
                    <CardDescription className="text-sm">{tier.bestFor}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{formatPrice(price)}</span>
                        <span className="text-muted-foreground text-sm">
                          /{billingInterval === 'annual' ? 'year' : 'month'}
                        </span>
                      </div>
                      {billingInterval === 'annual' && (
                        <p className="text-xs text-green-600 mt-1">
                          Save {formatPrice(savings)} per year
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span><strong>{tier.lessonsLimit}</strong> lessons/month</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Unlimited teachers</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Shared Focus</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Org Manager dashboard</span>
                      </li>
                    </ul>

                    <Button 
                      onClick={() => handleGetStarted(tier.tier)}
                      variant={isPopular ? 'default' : 'outline'}
                      className="w-full"
                    >
                      {user ? 'Select This Tier' : 'Get Started'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Lesson Packs Note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Need more lessons mid-month? You can always purchase a{' '}
            <span className="font-medium">Lesson Pack</span> — bonus lessons that never expire.
          </p>
        </div>
      </section>

      {/* Personal Subscription Note */}
      <section className="py-12 px-4 sm:px-6 bg-secondary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-xl font-semibold mb-3">
            A Note About Personal Subscriptions
          </h3>
          <p className="text-muted-foreground">
            The Shepherd tier gives your organization a shared lesson pool and management tools. 
            For your <em>own</em> lessons (personal preparation, devotionals), you'll also need 
            a Personal subscription ($9/month OR $90/year — $7.50 monthly). Be sure to match 
            your choice with your organization's billing choice. If you don't have a Personal subscription yet, 
            we'll add it automatically at checkout.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Shepherd Your Teaching Ministry?
          </h2>
          <p className="text-muted-foreground mb-6">
            Set up your organization in minutes. Invite your teachers. Start preparing together.
          </p>
          <Button size="lg" onClick={() => handleGetStarted()} className="text-lg px-8">
            Set Up Your Organization
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {BRANDING.appName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a href="/legal/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="/legal/terms" className="text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <Link to="/help" state={{ scrollTo: 'organizations-shepherds' }} className="text-muted-foreground hover:text-foreground">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrgLanding;
