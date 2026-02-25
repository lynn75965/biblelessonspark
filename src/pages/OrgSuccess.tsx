// src/pages/OrgSuccess.tsx
// Self-Service Shepherd Entry Point - Success Page
// Stack 2: Shepherd (Org Manager)
//
// User lands here after successful Stripe checkout
// Shows confirmation, next steps, and Interactive Tour (item 8)

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BRANDING } from '@/config/branding';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ROUTES } from "@/constants/routes";
import { 
  CheckCircle2, 
  Users, 
  BookOpen, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Church,
  Sparkles,
  Mail,
  LayoutDashboard,
  Eye,
  PartyPopper,
  Play
} from 'lucide-react';

// --- Interactive Tour Configuration (Self-Service Entry item 8) ---
// Each step describes a key Org Manager feature the new Shepherd should know.
const TOUR_STEPS = [
  {
    icon: LayoutDashboard,
    title: "Your Org Manager Dashboard",
    description:
      "This is your central hub for shepherding your teaching ministry. " +
      "From here you can see your lesson pool usage, manage your team, " +
      "and set the direction for your teachers -- all in one place.",
    tip: "You can always reach it from the sidebar menu or by visiting /org-manager.",
  },
  {
    icon: Users,
    title: "Invite Your Teachers",
    description:
      "Add your teachers by email. They'll receive an invitation " +
      "to join your organization and can immediately begin drawing from your " +
      "shared lesson pool -- no extra per-seat cost.",
    tip: "Teachers keep their own personal workspace and lesson library too.",
  },
  {
    icon: BookOpen,
    title: "Set a Shared Focus",
    description:
      "Guide your teaching team with a Shared Focus -- a suggested Bible passage " +
      "or theme for the week or month. Teachers will see your suggestion when " +
      "they open their lesson builder.",
    tip: "Your teachers can follow the focus or teach their own calling. It's a gentle shepherd's nudge, not a mandate.",
  },
  {
    icon: Eye,
    title: "Monitor Your Ministry",
    description:
      "See which teachers are actively preparing, view lessons funded by your " +
      "pool, and track your remaining lesson balance. Encourage your team " +
      "and celebrate their faithfulness in preparation.",
    tip: "You'll see activity summaries right on your dashboard -- no digging required.",
  },
  {
    icon: PartyPopper,
    title: "You're All Set!",
    description:
      "Your organization is live, your subscription is active, and your " +
      "lesson pool is ready. Head to your Org Manager Dashboard to invite " +
      "your first teacher and set your first Shared Focus.",
    tip: "Questions? Reach us anytime at support@biblelessonspark.com.",
  },
];

interface OrgData {
  id: string;
  name: string;
  subscription_tier: string;
  lessons_limit: number;
  lessons_remaining: number;
}

const OrgSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive Tour state
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const sessionId = searchParams.get('session_id');

  // Fetch the user's new organization
  useEffect(() => {
    if (!user) return;

    const fetchOrg = async () => {
      setLoading(true);
      
      // Small delay to allow webhook to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get user's primary organization (set by webhook)
      const { data: profile } = await supabase
        .from('profiles')
        .select('primary_organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.primary_organization_id) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, subscription_tier, lessons_limit, lessons_remaining')
          .eq('id', profile.primary_organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching org:', orgError);
          setError('Unable to load organization details. Please try refreshing.');
        } else if (org) {
          setOrgData(org);
        }
      } else {
        // Fallback: find org where user is owner
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (membership?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('id, name, subscription_tier, lessons_limit, lessons_remaining')
            .eq('id', membership.organization_id)
            .single();

          if (org) {
            setOrgData(org);
          }
        }
      }

      setLoading(false);
    };

    fetchOrg();
  }, [user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?returnTo=/org/success');
    }
  }, [user, authLoading, navigate]);

  // Format tier name for display
  const formatTierName = (tier: string): string => {
    const tierMap: Record<string, string> = {
      'org_single_staff': 'Single Staff',
      'org_starter': 'Starter',
      'org_growth': 'Growth',
      'org_develop': 'Develop',
      'org_expansion': 'Expansion',
    };
    return tierMap[tier] || tier;
  };

  // Tour navigation handlers
  const handleTourNext = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1);
    }
  };

  const handleTourPrev = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const handleTourFinish = () => {
    setShowTour(false);
    setTourStep(0);
    navigate('/org-manager');
  };

  const handleTourClose = () => {
    setShowTour(false);
    setTourStep(0);
  };

  const currentStep = TOUR_STEPS[tourStep];
  const isLastStep = tourStep === TOUR_STEPS.length - 1;
  const isFirstStep = tourStep === 0;
  const StepIcon = currentStep.icon;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
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
        </div>
      </header>

      {/* Success Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, Shepherd!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your organization is ready to go.
          </p>
        </div>

        {/* Organization Card */}
        {orgData && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Church className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{orgData.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    {formatTierName(orgData.subscription_tier)} Tier
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{orgData.lessons_limit}</p>
                  <p className="text-sm text-muted-foreground">Lessons/Month</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{orgData.lessons_remaining}</p>
                  <p className="text-sm text-muted-foreground">Available Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Tour Prompt -- Self-Service Entry item 8 */}
        <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Take a Quick Tour
                </h3>
                <p className="text-sm text-muted-foreground">
                  See what your Org Manager Dashboard can do -- takes about 60 seconds.
                </p>
              </div>
              <Button onClick={() => { setTourStep(0); setShowTour(true); }} size="sm">
                Start Tour
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">What's Next?</CardTitle>
            <CardDescription>Get the most from your Shepherd subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Invite Your Teachers</h3>
                <p className="text-sm text-muted-foreground">
                  Add your teaching team so they can access the shared lesson pool and see your Shared Focus.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Set Your Shared Focus</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a passage or theme for your teaching team. Teachers will see your suggestion when preparing lessons.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a confirmation with your subscription details and a quick-start guide.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            size="lg" 
            className="flex-1"
            onClick={() => navigate('/org-manager')}
          >
            Go to Org Manager Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="flex-1"
            onClick={() => navigate(ROUTES.DASHBOARD)}
          >
            Go to My Dashboard
          </Button>
        </div>

        {/* Support Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Questions? Email us at{' '}
          <a href="mailto:support@biblelessonspark.com" className="text-primary hover:underline">
            support@biblelessonspark.com
          </a>
        </p>
      </div>

      {/* --- Interactive Tour Modal (Self-Service Entry item 8) --- */}
      <Dialog open={showTour} onOpenChange={handleTourClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <StepIcon className="h-5 w-5 text-primary" />
              </div>
              <span>{currentStep.title}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Org Manager tour step {tourStep + 1} of {TOUR_STEPS.length}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {currentStep.description}
            </p>
            {currentStep.tip && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground italic">
                \u{1F4A1} {currentStep.tip}
              </div>
            )}
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1.5 py-2">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === tourStep
                    ? 'w-6 bg-primary'
                    : index < tourStep
                    ? 'w-2 bg-primary/40'
                    : 'w-2 bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTourPrev}
              disabled={isFirstStep}
              className={isFirstStep ? 'invisible' : ''}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            <span className="text-xs text-muted-foreground">
              {tourStep + 1} of {TOUR_STEPS.length}
            </span>

            {isLastStep ? (
              <Button size="sm" onClick={handleTourFinish}>
                Go to Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleTourNext}>
                Next
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgSuccess;

