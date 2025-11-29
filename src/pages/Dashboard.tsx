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

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
      const { data: profile } = await (await import('@/integrations/supabase/client')).supabase
        .from('profiles')
        .select('preferred_age_group')
        .eq('id', user.id)
        .single();

        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

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
      description: `Opening "${lesson.title}" for viewing.`,
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
      .select('preferred_age_group, org_setup_dismissed')
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

        <div className={`grid ${isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-3 sm:gap-4 mb-6 sm:mb-8`}>
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
          {isIndividualUser && (
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

          {/* Private Beta Card - Admin Only */}
          {isAdmin && (
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isIndividualUser ? 'grid-cols-3' : (isAdmin ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-3')}`}>
            <TabsTrigger value="enhance">
              <Sparkles className="h-4 w-4" />
              Enhance Lesson
            </TabsTrigger>
            <TabsTrigger value="library">
              <BookOpen className="h-4 w-4" />
              My Lessons
            </TabsTrigger>
            {!isIndividualUser && isAdmin && (
              <>
                <TabsTrigger value="members">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="h-4 w-4" />
                  Beta Analytics
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhance" className="mt-6">
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
                onClearViewing={() => setSelectedLesson(null)}
              />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <LessonLibrary
              onCreateNew={handleCreateLesson}
              onViewLesson={handleViewLesson}
            />
          </TabsContent>

          {!isIndividualUser && isAdmin && (
            <>
              <TabsContent value="members" className="mt-6">
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Organization Members</CardTitle>
                    <CardDescription>
                      Manage teachers and administrators for {currentOrgName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Member Management Coming Soon</h3>
                      <p className="text-muted-foreground mb-4">
                        Invite teachers, manage roles, and view member activity.
                      </p>
                      <Button variant="outline">
                        Preview Member Features
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <BetaAnalyticsDashboard />
              </TabsContent>
            </>
          )}

          <TabsContent value="settings" className="mt-6">
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

      {/* Beta Hub Modal - Admin Only */}
      <BetaHubModal
        open={showBetaHubModal}
        onOpenChange={setShowBetaHubModal}
        lessonsCreated={stats.lessonsCreated}
        onNavigateToAnalytics={handleNavigateToAnalytics}
      />
    </div>
  );
}
