import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { UserManagement } from "@/components/admin/UserManagement";
import { BetaAnalyticsDashboard } from "@/components/analytics/BetaAnalyticsDashboard";
import { FeedbackQuestionsManager } from "@/components/admin/FeedbackQuestionsManager";
import { GuardrailViolationsPanel } from "@/components/admin/GuardrailViolationsPanel";
import { SystemAnalyticsDashboard } from "@/components/admin/SystemAnalyticsDashboard";
import { AllLessonsPanel } from "@/components/admin/AllLessonsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Settings, BarChart3, DollarSign, Rocket, Gift, TrendingUp, Building2, ShieldAlert, BookOpen, Palette } from "lucide-react";import { supabase } from "@/integrations/supabase/client";
import { PricingPlansManager } from "@/components/admin/PricingPlansManager";
import { OrganizationManagement } from "@/components/admin/OrganizationManagement";
import { SystemSettingsPanel } from "@/components/admin/SystemSettingsPanel";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { PROGRAM_CONFIG } from "@/constants/programConfig";
import { isBetaMode } from "@/constants/systemSettings";
import { AdminSecurityPanel } from "@/components/admin/AdminSecurityPanel";
import { TenantBrandingPanel } from "@/components/admin/TenantBrandingPanel";

// Mobile responsiveness fixes (December 4, 2025)
// SSOT Fix: Query 'feedback' table with is_beta_feedback flag (December 10, 2025)
// SSOT Fix: Filter beta stats to show ONLY beta testers, not all users/lessons (December 10, 2025)
// System Analytics Dashboard with per-user lesson viewing (December 10, 2025)
// All Lessons tab for admin access to ALL platform lessons (December 11, 2025)
// Generation Metrics merged into System Analytics tab (December 17, 2025)

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSystemSettings();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [betaStats, setBetaStats] = useState({
    totalBetaTesters: 0,
    betaTesterLessons: 0,
    feedbackCount: 0,
    averageRating: null as number | null,
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check email verification first
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user && !userData.user.email_confirmed_at) {
        toast({
          title: "Email Verification Required",
          description: "Please verify your email to access admin tools.",
          variant: "destructive",
        });
        navigate('/setup');
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Access Error",
            description: "Could not verify admin access.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        setUserProfile(profile);

        // Check if user has admin role using new role system
        const { data: hasAdminRole, error: roleError } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (roleError || !hasAdminRole) {
          console.error('Admin verification error:', roleError);
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        // Fetch beta stats - SSOT FIX: Filter for ONLY beta testers (not all users)
        // Step 1: Get admin user IDs to exclude them
        const { data: adminUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');
        
        const adminIdSet = new Set(adminUsers?.map(a => a.user_id) || []);

        // Step 2: Get all beta testers, then filter out admins in JavaScript
        const { data: allBetaTesters } = await supabase
          .from('profiles')
          .select('id')
          .eq('beta_participant', true);
        
        // Filter out admin users
        const betaTesters = allBetaTesters?.filter(bt => !adminIdSet.has(bt.id)) || [];
        const betaTesterIds = betaTesters.map(bt => bt.id);
        const betaTesterCount = betaTesterIds.length;

        // Step 2: Count lessons created by beta testers only
        let betaLessonCount = 0;
        if (betaTesterIds.length > 0) {
          const { count: lessonCount } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .in('user_id', betaTesterIds);
          betaLessonCount = lessonCount || 0;
        }

        // Step 3: Get feedback stats (already correctly filtered)
        const { data: feedbackData, count: feedbackCount } = await supabase
          .from('feedback')
          .select('rating', { count: 'exact' })
          .eq('is_beta_feedback', true);

        let avgRating = null;
        if (feedbackData && feedbackData.length > 0) {
          const validRatings = feedbackData.filter(f => f.rating !== null && f.rating > 0);
          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, f) => acc + f.rating, 0);
            avgRating = Math.round((sum / validRatings.length) * 10) / 10;
          }
        }

        setBetaStats({
          totalBetaTesters: betaTesterCount,
          betaTesterLessons: betaLessonCount,
          feedbackCount: feedbackCount || 0,
          averageRating: avgRating,
        });

      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-gradient-card">
          <CardContent className="p-8 text-center">
            <Shield className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        isAuthenticated
        organizationName="LessonSpark USA"
      />

      <main className="container py-6 px-4 sm:px-6">
        {/* Admin Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-gradient-primary flex-shrink-0">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Admin Panel</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              System administration and user management
            </p>
          </div>
        </div>

        {/* Admin Tabs - MOBILE FIX: Use flex with horizontal scroll */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted p-1 rounded-lg mb-2 relative z-10">
            <TabsTrigger value="users" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">User Management</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Organizations</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">All Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="beta" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Rocket className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Beta Program</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Pricing & Plans</span>
            </TabsTrigger>
            <TabsTrigger value="guardrails" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Guardrails</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">System Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">System Settings</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          <TabsTrigger value="branding" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Palette className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
	</TabsList>

          {/* MOBILE FIX: Add relative z-0 to all TabsContent */}
          <TabsContent value="users" className="mt-6 relative z-0">
            <UserManagement />
          </TabsContent>

          <TabsContent value="organizations" className="mt-6 relative z-0">
            <OrganizationManagement />
          </TabsContent>

          <TabsContent value="lessons" className="mt-6 relative z-0">
            <AllLessonsPanel />
          </TabsContent>

          <TabsContent value="beta" className="mt-6 relative z-0">
            <div className="space-y-6">
              {/* Beta Program Header */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        Beta Program Management
                      </CardTitle>
                      <CardDescription>
                        Monitor beta testers, feedback, and program progress
                      </CardDescription>
                    </div>
                    {isBetaMode(settings.current_phase as string) && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{settings.current_phase}</Badge>
                        <Badge variant="secondary">Target: {settings.target_launch}</Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Beta Stats Row - NOW SHOWS ONLY BETA TESTER DATA */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{betaStats.totalBetaTesters}</p>
                      <p className="text-xs text-muted-foreground">Beta Testers</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{betaStats.betaTesterLessons}</p>
                      <p className="text-xs text-muted-foreground">Lessons Created</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Gift className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{betaStats.feedbackCount}</p>
                      <p className="text-xs text-muted-foreground">Feedback Received</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <BarChart3 className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                      <p className="text-2xl font-bold">{betaStats.averageRating ?? "N/A"}</p>
                      <p className="text-xs text-muted-foreground">Avg Rating</p>
                    </div>
                  </div>

                  {/* Beta Benefits */}
                  {isBetaMode(settings.current_phase as string) && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary" />
                        Beta Tester Benefits
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {PROGRAM_CONFIG.beta.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Beta Analytics Dashboard */}
              <BetaAnalyticsDashboard />
            </div>

            {/* Manage Beta Feedback Questions */}
            <FeedbackQuestionsManager />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6 relative z-0">
            <PricingPlansManager />
          </TabsContent>

          <TabsContent value="guardrails" className="mt-6 relative z-0">
            <GuardrailViolationsPanel />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 relative z-0">
            <SystemAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="settings" className="mt-6 relative z-0">
            <SystemSettingsPanel />
          </TabsContent>

          <TabsContent value="security" className="mt-6 relative z-0">
            <AdminSecurityPanel />
          </TabsContent>
		<TabsContent value="branding" className="mt-6 relative z-0">
            <TenantBrandingPanel />
          </TabsContent>
	<TabsTrigger value="branding" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Palette className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
        </Tabs>
      </main>
    </div>
  );
}
