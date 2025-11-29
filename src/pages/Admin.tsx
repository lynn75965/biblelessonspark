import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { UserManagement } from "@/components/admin/UserManagement";
import { BetaAnalyticsDashboard } from "@/components/analytics/BetaAnalyticsDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Settings, BarChart3, DollarSign, Rocket, Gift, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PricingPlansManager } from "@/components/admin/PricingPlansManager";
import { useToast } from "@/hooks/use-toast";
import { PROGRAM_CONFIG, isBetaMode } from "@/constants/programConfig";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [betaStats, setBetaStats] = useState({
    totalUsers: 0,
    totalLessons: 0,
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

        // Fetch beta stats
        const [usersResult, lessonsResult, feedbackResult] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('beta_feedback').select('rating', { count: 'exact' }),
        ]);

        let avgRating = null;
        if (feedbackResult.data && feedbackResult.data.length > 0) {
          const validRatings = feedbackResult.data.filter(f => f.rating !== null && f.rating > 0);
          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, f) => acc + f.rating, 0);
            avgRating = Math.round((sum / validRatings.length) * 10) / 10;
          }
        }

        setBetaStats({
          totalUsers: usersResult.count || 0,
          totalLessons: lessonsResult.count || 0,
          feedbackCount: feedbackResult.count || 0,
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

      <main className="container py-6">
        {/* Admin Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">
              System administration and user management
            </p>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="beta">
              <Rocket className="h-4 w-4 mr-2" />
              Beta Program
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="h-4 w-4 mr-2" />
              Pricing & Plans
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              System Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="beta" className="mt-6">
            <div className="space-y-6">
              {/* Beta Program Header */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        Beta Program Management
                      </CardTitle>
                      <CardDescription>
                        Monitor beta testers, feedback, and program progress
                      </CardDescription>
                    </div>
                    {isBetaMode() && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{PROGRAM_CONFIG.beta.currentPhase}</Badge>
                        <Badge variant="secondary">Target: {PROGRAM_CONFIG.beta.targetLaunch}</Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Beta Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{betaStats.totalUsers}</p>
                      <p className="text-xs text-muted-foreground">Total Users</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{betaStats.totalLessons}</p>
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
                  {isBetaMode() && (
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
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <PricingPlansManager />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>
                  Platform usage statistics and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground">
                    Comprehensive system analytics coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Global application configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">System Configuration</h3>
                  <p className="text-muted-foreground">
                    Advanced system settings panel coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle>Security Center</CardTitle>
                <CardDescription>
                  Security monitoring and access control management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Security Dashboard</h3>
                  <p className="text-muted-foreground">
                    Advanced security controls and monitoring coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
