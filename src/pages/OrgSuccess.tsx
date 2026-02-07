// src/pages/OrgSuccess.tsx
// Self-Service Shepherd Entry Point - Success Page
// Stack 2: Shepherd (Org Manager)
//
// User lands here after successful Stripe checkout
// Shows confirmation and next steps

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BRANDING } from '@/config/branding';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  Users, 
  BookOpen, 
  ArrowRight, 
  Loader2,
  Church,
  Sparkles,
  Mail
} from 'lucide-react';

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
            onClick={() => navigate('/dashboard')}
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
    </div>
  );
};

export default OrgSuccess;
