// src/pages/OrgSetup.tsx
// Self-Service Shepherd Entry Point - Org Creation Form + Tier Selection
// Stack 2: Shepherd (Org Manager)
//
// Flow:
//   1. Collect org information (name, type, denomination, leader info)
//   2. Select tier + check personal subscription
//   3. Proceed to Stripe checkout
//
// SSOT: Organization types from organizationConfig.ts
// SSOT: Tier pricing from orgPricingConfig.ts

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BRANDING } from '@/config/branding';
import { ORG_TYPES, ORG_TYPE_IDS, OrgType } from '@/constants/organizationConfig';
import { ORG_TIERS, getActiveOrgTiers, OrgTier } from '@/constants/orgPricingConfig';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Church, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  User, 
  Building2,
  CreditCard,
  Info,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Filter org types for self-service (exclude beta_program)
const SELF_SERVICE_ORG_TYPES = ORG_TYPE_IDS.filter(
  (type) => type !== 'beta_program'
);

interface OrgFormData {
  orgName: string;
  orgType: OrgType | '';
  denomination: string;
  leaderName: string;
  leaderEmail: string;
  orgEmail: string;
}

interface PersonalSubStatus {
  hasSubscription: boolean;
  tier: string | null;
  loading: boolean;
}

const OrgSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<OrgFormData>({
    orgName: '',
    orgType: '',
    denomination: '',
    leaderName: '',
    leaderEmail: '',
    orgEmail: '',
  });

  // Tier selection state
  const [selectedTier, setSelectedTier] = useState<string>(
    searchParams.get('tier') || ''
  );
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');

  // Personal subscription check
  const [personalSub, setPersonalSub] = useState<PersonalSubStatus>({
    hasSubscription: false,
    tier: null,
    loading: true,
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<OrgFormData>>({});

  const activeTiers = getActiveOrgTiers();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?returnTo=${encodeURIComponent('/org/setup')}`);
    }
  }, [user, authLoading, navigate]);

  // Pre-fill leader info from user profile
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        setFormData((prev) => ({
          ...prev,
          leaderName: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            : '',
          leaderEmail: user.email || '',
        }));
      };
      fetchProfile();
    }
  }, [user]);

  // Check personal subscription status
  useEffect(() => {
    if (user) {
      const checkSubscription = async () => {
        setPersonalSub((prev) => ({ ...prev, loading: true }));
        
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .single();

        const hasActiveSub = subscription?.tier === 'subscribed';
        
        setPersonalSub({
          hasSubscription: hasActiveSub,
          tier: subscription?.tier || null,
          loading: false,
        });
      };
      checkSubscription();
    }
  }, [user]);

  // Form validation
  const validateStep1 = (): boolean => {
    const newErrors: Partial<OrgFormData> = {};

    if (!formData.orgName.trim()) {
      newErrors.orgName = 'Organization name is required';
    }
    if (!formData.orgType) {
      newErrors.orgType = 'Organization type is required';
    }
    if (!formData.leaderName.trim()) {
      newErrors.leaderName = 'Leader name is required';
    }
    if (!formData.leaderEmail.trim()) {
      newErrors.leaderEmail = 'Leader email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.leaderEmail)) {
      newErrors.leaderEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!selectedTier) {
      toast({
        title: 'Please select a tier',
        description: 'Choose a Shepherd tier to continue.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleCheckout();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/org');
    }
  };

  // Checkout handler
  const handleCheckout = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const tier = activeTiers.find((t) => t.tier === selectedTier);
      if (!tier) throw new Error('Invalid tier selected');

      const priceId = billingInterval === 'annual' 
        ? tier.stripePriceIdAnnual 
        : tier.stripePriceIdMonthly;

      // Call the Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-org-checkout-session', {
        body: {
          priceId,
          billingInterval,
          // Pass org data as metadata - org will be created on webhook success
          orgMetadata: {
            orgName: formData.orgName.trim(),
            orgType: formData.orgType,
            denomination: formData.denomination.trim() || null,
            leaderName: formData.leaderName.trim(),
            leaderEmail: formData.leaderEmail.trim(),
            orgEmail: formData.orgEmail.trim() || null,
          },
          // Include personal subscription if user doesn't have one
          includePersonalSubscription: !personalSub.hasSubscription,
          successUrl: `${window.location.origin}/org/success`,
          cancelUrl: `${window.location.origin}/org/setup?tier=${selectedTier}`,
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Error',
        description: error.message || 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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

  // Calculate total
  const getSelectedTierPrice = (): number => {
    const tier = activeTiers.find((t) => t.tier === selectedTier);
    if (!tier) return 0;
    return billingInterval === 'annual' ? tier.priceAnnual : tier.priceMonthly;
  };

  const getPersonalSubPrice = (): number => {
    if (personalSub.hasSubscription) return 0;
    return billingInterval === 'annual' ? 90 : 9;
  };

  const getTotalPrice = (): number => {
    return getSelectedTierPrice() + getPersonalSubPrice();
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
          <Button variant="ghost" onClick={() => navigate('/org')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="hidden sm:inline font-medium">Organization Info</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              2
            </div>
            <span className="hidden sm:inline font-medium">Select Plan</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        {/* Step 1: Organization Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Organization Information</CardTitle>
                  <CardDescription>Tell us about your organization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Org Name */}
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  placeholder="e.g., First Baptist of Springfield"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  className={errors.orgName ? 'border-destructive' : ''}
                />
                {errors.orgName && (
                  <p className="text-sm text-destructive">{errors.orgName}</p>
                )}
              </div>

              {/* Org Type */}
              <div className="space-y-2">
                <Label htmlFor="orgType">Organization Type *</Label>
                <Select
                  value={formData.orgType}
                  onValueChange={(value) => setFormData({ ...formData, orgType: value as OrgType })}
                >
                  <SelectTrigger className={errors.orgType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SELF_SERVICE_ORG_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ORG_TYPES[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.orgType && (
                  <p className="text-sm text-destructive">{errors.orgType}</p>
                )}
              </div>

              {/* Denomination */}
              <div className="space-y-2">
                <Label htmlFor="denomination">Denomination (optional)</Label>
                <Input
                  id="denomination"
                  placeholder="e.g., Southern Baptist Convention"
                  value={formData.denomination}
                  onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                />
              </div>

              <Separator />

              {/* Leader Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Organization Leader</h3>
                  <p className="text-sm text-muted-foreground">You'll be the Org Manager</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaderName">Your Name *</Label>
                  <Input
                    id="leaderName"
                    placeholder="e.g., Pastor John Smith"
                    value={formData.leaderName}
                    onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                    className={errors.leaderName ? 'border-destructive' : ''}
                  />
                  {errors.leaderName && (
                    <p className="text-sm text-destructive">{errors.leaderName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leaderEmail">Your Email *</Label>
                  <Input
                    id="leaderEmail"
                    type="email"
                    placeholder="leader@organization.org"
                    value={formData.leaderEmail}
                    onChange={(e) => setFormData({ ...formData, leaderEmail: e.target.value })}
                    className={errors.leaderEmail ? 'border-destructive' : ''}
                  />
                  {errors.leaderEmail && (
                    <p className="text-sm text-destructive">{errors.leaderEmail}</p>
                  )}
                </div>
              </div>

              {/* Org Email */}
              <div className="space-y-2">
                <Label htmlFor="orgEmail">Organization Email (optional)</Label>
                <Input
                  id="orgEmail"
                  type="email"
                  placeholder="If different from your personal email"
                  value={formData.orgEmail}
                  onChange={(e) => setFormData({ ...formData, orgEmail: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used for organization-related communications
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Continue to Plan Selection
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Tier Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Tier Selection Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Church className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Select Your Shepherd Tier</CardTitle>
                    <CardDescription>
                      Setting up: <span className="font-medium text-foreground">{formData.orgName}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Billing Toggle */}
                <div className="flex justify-center mb-6">
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

                {/* Tier Options */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTiers.map((tier) => {
                    const price = billingInterval === 'annual' ? tier.priceAnnual : tier.priceMonthly;
                    const isSelected = selectedTier === tier.tier;
                    const isPopular = tier.tier === 'org_growth';

                    return (
                      <div
                        key={tier.tier}
                        onClick={() => setSelectedTier(tier.tier)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {isPopular && (
                          <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{tier.displayName}</h4>
                            <p className="text-xs text-muted-foreground">{tier.bestFor}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="text-2xl font-bold">{formatPrice(price)}</span>
                          <span className="text-muted-foreground text-sm">
                            /{billingInterval === 'annual' ? 'year' : 'month'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {tier.lessonsLimit} lessons/month
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Personal Subscription Check */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Personal Subscription</CardTitle>
                    <CardDescription>For your own lesson preparation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {personalSub.loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking subscription status...
                  </div>
                ) : personalSub.hasSubscription ? (
                  <Alert className="bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Your personal subscription is active.</strong> You're all set for your own lesson preparation.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>A Personal subscription will be added.</strong> The Shepherd tier covers your organization's shared pool. 
                      For your own lessons and devotionals, you need a Personal subscription 
                      ({formatPrice(getPersonalSubPrice())}/{billingInterval === 'annual' ? 'year' : 'month'}).
                      It will be included in your checkout.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            {selectedTier && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Order Summary</CardTitle>
                      <CardDescription>Review before checkout</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Org Tier */}
                    <div className="flex justify-between">
                      <span>
                        {activeTiers.find((t) => t.tier === selectedTier)?.displayName} Tier
                        <span className="text-muted-foreground text-sm ml-1">
                          ({billingInterval})
                        </span>
                      </span>
                      <span className="font-medium">{formatPrice(getSelectedTierPrice())}</span>
                    </div>

                    {/* Personal Sub (if needed) */}
                    {!personalSub.hasSubscription && !personalSub.loading && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          Personal Subscription
                          <span className="text-sm ml-1">({billingInterval})</span>
                        </span>
                        <span>{formatPrice(getPersonalSubPrice())}</span>
                      </div>
                    )}

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(getTotalPrice())}</span>
                    </div>

                    {billingInterval === 'annual' && (
                      <p className="text-xs text-muted-foreground text-center">
                        Billed annually. Cancel anytime.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!selectedTier || isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Checkout...
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgSetup;
