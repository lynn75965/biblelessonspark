import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CreditsDisplay } from "@/components/dashboard/CreditsDisplay";
import { EnhanceLessonForm } from "@/components/dashboard/EnhanceLessonForm";
import { LessonLibrary } from "@/components/dashboard/LessonLibrary";
import { BetaFeedbackForm } from "@/components/feedback/BetaFeedbackForm";
import { BetaAnalyticsDashboard } from "@/components/analytics/BetaAnalyticsDashboard";
import { OrganizationSettingsModal } from "@/components/dashboard/OrganizationSettingsModal";
import { UserProfileModal } from "@/components/dashboard/UserProfileModal";
import { BetaHubModal } from "@/components/dashboard/BetaHubModal";
import LanguageSelector from "@/components/settings/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Sparkles,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BetaFeedbackButton } from "@/components/BetaFeedbackButton";
import { BetaFeedbackModal } from "@/components/BetaFeedbackModal";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useLessons } from "@/hooks/useLessons";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useOrganization } from "@/hooks/useOrganization";
import { OrganizationSetup } from "@/components/organization/OrganizationSetup";
import { OrgMemberManagement } from "@/components/org/OrgMemberManagement";
import { getEffectiveRole, canAccessTab, canAccessFeature, ROLES, ORG_ROLES } from "@/constants/accessControl";

interface DashboardProps {
  organizationName?: string;
  setupComplete?: boolean;
}

export default function Dashboard({
  organizationName = "Demo Baptist Church",
  setupComplete = true
}: DashboardProps) {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showBetaFeedbackModal, setShowBetaFeedbackModal] = useState(false);
  const [showBetaHubModal, setShowBetaHubModal] = useState(false);
  const [lastGeneratedLessonId, setLastGeneratedLessonId] = useState<string | null>(null);
  const [showOrgSettingsModal, setShowOrgSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState("enhance");
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, loading: creditsLoading, refetch: refetchCredits } = useCredits();
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const { lessons, loading: lessonsLoading } = useLessons();
  const { trackEvent, trackFeatureUsed, trackLessonViewed } = useAnalytics();
  const { organization, loading: orgLoading, hasOrganization } = useOrganization();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [totalPlatformUsers, setTotalPlatformUsers] = useState<number>(0);

  // SSOT: Determine user's effective role and access permissions
  const effectiveRole = getEffectiveRole(isAdmin, hasOrganization, userProfile?.organization_role);
  const hasOrgContext = hasOrganization;

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
      const { data: profile } = await (await import('@/integrations/supabase/client')).supabase
        .from('profiles')
        .select('preferred_age_group, organization_role, organization_id')
        .eq('id', user.id)
        .single();

        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Fetch platform stats for admin
  useEffect(() => {
    const loadPlatformStats = async () => {
      if (!isAdmin) return;

      try {
        const { count } = await (await import('@/integrations/supabase/client')).supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setTotalPlatformUsers(count || 0);
      } catch (error) {
        console.error('Error loading platform stats:', error);
      }
    };

    loadPlatformStats();
  }, [isAdmin]);

  const stats = {
    lessonsCreated: lessons.length,
    aiGenerations: lessons.length * 3,
    membersActive: 8,
    setupProgress: 6
  };

  const handleCreateLesson = () => {
    trackFeatureUsed('create_lesson_clicked');
    setActiveTab("enhance");
  };

  const handleViewLesson = (lesson: any) => {
    trackLessonViewed(lesson.id);
    setSelectedLesson(lesson);
    setActiveTab("enhance");
    toast({
      title: "Opening lesson",
      description: `Opening "${lesson.ai_lesson_title || lesson.title}" for viewing.`,
    });
  };

  const handleFeedback = () => {
    trackFeatureUsed('feedback_button_clicked');
    setShowFeedbackDialog(true);
  };

  const handleNavigateToAnalytics = () => {
    setActiveTab("analytics");
  };

  const handleOrgSetupComplete = () => {
  };

  const handleProfileUpdated = async () => {
    if (!user) return;

    try {
    const { data: profile } = await (await import('@/integrations/supabase/client')).supabase
      .from('profiles')
      .select('preferred_age_group, org_setup_dismissed, organization_role, organization_id')
      .eq('id', user.id)
      .single();

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const currentOrgName = organization?.name || "Personal Workspace";
  const isIndividualUser = !organization;

  const [showOrgSetup, setShowOrgSetup] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (orgLoading || adminLoading) return;
    if (isAdmin) return;

    const localSeen = localStorage.getItem('org-setup-seen') === 'true';
    if (localSeen) return;

    const dismissed = userProfile?.org_setup_dismissed === true;
    if (dismissed) {
      localStorage.setItem('org-setup-seen', 'true');
      return;
    }

    if (hasOrganization) return;

    setShowOrgSetup(true);
  }, [orgLoading, adminLoading, hasOrganization, isAdmin, userProfile?.org_setup_dismissed]);

  const handleOrgSetupCompleteInternal = async () => {
    try {
      localStorage.setItem('org-setup-seen', 'true');
      setShowOrgSetup(false);
      handleOrgSetupComplete();
    } catch (error) {
      console.error('Error saving org setup completion:', error);
      setShowOrgSetup(false);
      handleOrgSetupComplete();
    }
  };

  const handleOrgSetupDismiss = async () => {
    try {
      localStorage.setItem('org-setup-seen', 'true');
      setShowOrgSetup(false);
    } catch (error) {
      console.error('Error saving org setup dismissal:', error);
      setShowOrgSetup(false);
    }
  };

  // SSOT: Calculate grid columns based on visible tabs
  const visibleTabCount = [
    canAccessTab(effectiveRole, 'enhance', hasOrgContext),
    canAccessTab(effectiveRole, 'library', hasOrgContext),
    canAccessTab(effectiveRole, 'members', hasOrgContext),
    canAccessTab(effectiveRole, 'analytics', hasOrgContext),
    canAccessTab(effectiveRole, 'settings', hasOrgContext),
  ].filter(Boolean).length;

  // MOBILE FIX: Simplified grid that works better on mobile
  const getGridCols = () => {
    if (visibleTabCount <= 2) return 'grid-cols-2';
    if (visibleTabCount === 3) return 'grid-cols-3';
    if (visibleTabCount === 4) return 'grid-cols-4';
    // For 5 tabs: use flex with horizontal scroll on mobile instead of grid
    return 'grid-cols-5';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        isAuthenticated
        organizationName={currentOrgName}
      />

      {showOrgSetup && (
        <OrganizationSetup
          open={showOrgSetup}
          onComplete={handleOrgSetupCompleteInternal}
          onDismiss={handleOrgSetupDismiss}
        />
      )}

      <main className="container py-4 sm:py-6 px-4 sm:px-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="md:col-span-2">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, <span className="gradient-text">{userName}!</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isIndividualUser ? "Your Personal Bible Study Enhancement Platform" : `Bible Study Enhancement Platform for ${currentOrgName}`}
            </p>
          </div>
          <CreditsDisplay balance={balance} loading={creditsLoading} />
        </div>

        {/* Stats Cards - SSOT access control */}
        <div className={`grid ${canAccessFeature(effectiveRole, 'privateBetaCard', hasOrgContext) ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-3 sm:gap-4 mb-6 sm:mb-8`}>
          <Card className="bg-gradient-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-primary shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{stats.lessonsCreated}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Lessons Created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-secondary shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{stats.aiGenerations}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Enhancements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isIndividualUser && (
            <Card className="bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.membersActive}</p>
                    <p className="text-xs text-muted-foreground">Active Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {isIndividualUser && !canAccessFeature(effectiveRole, 'platformStatsCard', hasOrgContext) && (
            <Card className="bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Personal</p>
                    <p className="text-xs text-muted-foreground">Workspace</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {canAccessFeature(effectiveRole, 'platformStatsCard', hasOrgContext) && (
            <Card className="bg-gradient-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalPlatformUsers}</p>
                    <p className="text-xs text-muted-foreground">Platform Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Private Beta Card - SSOT access control */}
          {canAccessFeature(effectiveRole, 'privateBetaCard', hasOrgContext) && (
            <Card
              className="bg-gradient-card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowBetaHubModal(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Private Beta</p>
                    <p className="text-xs text-muted-foreground">Click to Manage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs - SSOT access control */}
        {/* MOBILE FIX: Use flex with overflow-x-auto for horizontal scroll on mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted p-1 rounded-lg mb-2 relative z-10">
            {canAccessTab(effectiveRole, 'enhance', hasOrgContext) && (
              <TabsTrigger value="enhance" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Enhance Lesson</span>
              </TabsTrigger>
            )}
            {canAccessTab(effectiveRole, 'library', hasOrgContext) && (
              <TabsTrigger value="library" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">My Lesson Library</span>
              </TabsTrigger>
            )}
            {canAccessTab(effectiveRole, 'members', hasOrgContext) && (
              <TabsTrigger value="members" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Members</span>
              </TabsTrigger>
            )}
            {canAccessTab(effectiveRole, 'analytics', hasOrgContext) && (
              <TabsTrigger value="analytics" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Beta Analytics</span>
              </TabsTrigger>
            )}
            {canAccessTab(effectiveRole, 'settings', hasOrgContext) && (
              <TabsTrigger value="settings" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* MOBILE FIX: Add relative z-0 to ensure content stays below tabs */}
          <TabsContent value="enhance" className="mt-6 relative z-0">
            <EnhanceLessonForm
                onLessonGenerated={(lesson) => {
                  setLastGeneratedLessonId(lesson?.id || null);
                  toast({
                    title: "Lesson Generated!",
                    description: "Review your lesson, then use Copy, Print, or Download when ready.",
                    duration: 6000,
                  });
                }}
                onExport={() => {
                  setTimeout(() => {
                    setShowBetaFeedbackModal(true);
                  }, 3000);
                }}
                organizationId={organization?.id}
                userPreferredAgeGroup={userProfile?.preferred_age_group || "Adults"}
                defaultDoctrine={organization?.default_doctrine || "SBC"}
                viewingLesson={selectedLesson}
                onClearViewing={() => {
                  setSelectedLesson(null);
                  setActiveTab("library");
                }}
              />
          </TabsContent>

          <TabsContent value="library" className="mt-6 relative z-0">
            <LessonLibrary
              onCreateNew={handleCreateLesson}
              onViewLesson={handleViewLesson}
            />
          </TabsContent>

          {/* Members Tab - SSOT access control */}
          <TabsContent value="members" className="mt-6 relative z-0">
            {canAccessTab(effectiveRole, 'members', hasOrgContext) && userProfile?.organization_id ? (
              <OrgMemberManagement
                organizationId={userProfile.organization_id}
                organizationName={currentOrgName || "Organization"}
                isLeader={userProfile?.organization_role === ORG_ROLES.leader || userProfile?.organization_role === ORG_ROLES.coLeader || isAdmin}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Loading organization data...
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab - SSOT access control */}
          {canAccessTab(effectiveRole, 'analytics', hasOrgContext) && (
            <TabsContent value="analytics" className="mt-6 relative z-0">
              <BetaAnalyticsDashboard />
            </TabsContent>
          )}

          <TabsContent value="settings" className="mt-6 relative z-0">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-card md:col-span-2">
                <CardHeader>
                  <CardTitle>Language Preferences</CardTitle>
                  <CardDescription>
                    Choose your preferred language for lesson plans and content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LanguageSelector />
                </CardContent>
              </Card>

              {!isIndividualUser && (
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>
                      Configure default doctrine and age group preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Default Doctrine</span>
                        <Badge variant="outline">
                          {organization?.default_doctrine || "SBC"}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowOrgSettingsModal(true)}
                      >
                        Modify Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    Manage your account and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!isIndividualUser && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Role</span>
                          <Badge variant="outline">{isAdmin ? 'Administrator' : 'Teacher'}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Organization</span>
                          <Badge variant="outline">{currentOrgName}</Badge>
                        </div>
                      </>
                    )}
                    {isIndividualUser && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mode</span>
                        <Badge variant="outline">Individual User</Badge>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowProfileModal(true)}
                    >
                      Update Profile
                    </Button>
                    {isIndividualUser && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowOrgSetup(true)}
                      >
                        Join an Organization
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer - SSOT Component */}
      <Footer />

      <Button
        variant="hero"
        size="lg"
        className="fixed bottom-6 right-6 shadow-glow z-40"
        onClick={handleFeedback}
      >
        <MessageSquare className="h-4 w-4" />
        Give Feedback
      </Button>

      <BetaFeedbackForm
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
      />

      <OrganizationSettingsModal
        open={showOrgSettingsModal}
        onOpenChange={setShowOrgSettingsModal}
      />

      <UserProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onProfileUpdated={handleProfileUpdated}
      />

      <BetaFeedbackModal
        open={showBetaFeedbackModal}
        onOpenChange={setShowBetaFeedbackModal}
        lessonId={lastGeneratedLessonId}
      />

      {/* Beta Hub Modal - SSOT access control */}
      {canAccessFeature(effectiveRole, 'betaHubModal', hasOrgContext) && (
        <BetaHubModal
          open={showBetaHubModal}
          onOpenChange={setShowBetaHubModal}
          lessonsCreated={stats.lessonsCreated}
          totalPlatformUsers={totalPlatformUsers}
          onNavigateToAnalytics={handleNavigateToAnalytics}
        />
      )}
    </div>
  );
}
