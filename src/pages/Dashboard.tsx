import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { DASHBOARD_TABS } from "@/constants/dashboardConfig";
import { CreditsDisplay } from "@/components/dashboard/CreditsDisplay";
import { EnhanceLessonForm } from "@/components/dashboard/EnhanceLessonForm";
import { LessonLibrary } from "@/components/dashboard/LessonLibrary";
import { UserProfileModal } from "@/components/dashboard/UserProfileModal";
import LanguageSelector from "@/components/settings/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Sparkles,
  Settings,
  MessageSquare,
  UserCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BetaFeedbackModal } from "@/components/BetaFeedbackModal";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useLessons } from "@/hooks/useLessons";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { FEEDBACK_TRIGGER } from '@/constants/feedbackConfig';
// ============================================================================
// USE FOCUS IMPORTS
// ============================================================================
import { useOrgSharedFocus } from "@/hooks/useOrgSharedFocus";
import { ActiveFocusBanner, type FocusApplicationData } from "@/components/org/ActiveFocusBanner";

export default function Dashboard() {
  const [showBetaFeedbackModal, setShowBetaFeedbackModal] = useState(false);
  const [lastGeneratedLessonId, setLastGeneratedLessonId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState("enhance");
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, loading: creditsLoading } = useCredits();
  const { settings } = useSystemSettings();
  const { lessons, loading: lessonsLoading } = useLessons();
  const { trackFeatureUsed, trackLessonViewed } = useAnalytics();
  const [userProfile, setUserProfile] = useState<any>(null);

  // ============================================================================
  // USE FOCUS STATE & HOOK
  // ============================================================================
  const { focusData, hasActiveFocus, focusStatus } = useOrgSharedFocus();
  const [focusDataToApply, setFocusDataToApply] = useState<FocusApplicationData | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_age_group, organization_role, organization_id, theology_profile_id')
          .eq('id', user.id)
          .single();

        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Personal stats only - MY lessons
  const stats = {
    lessonsCreated: lessons.length,
    aiGenerations: lessons.length * 3
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
    setShowBetaFeedbackModal(true);
  };

  const handleTabChange = (tabValue: string) => {
    const tabKey = tabValue as keyof typeof DASHBOARD_TABS;
    const tabConfig = DASHBOARD_TABS[tabKey];
    if (tabConfig?.clearViewingOnClick) {
      setSelectedLesson(null);
    }
    setActiveTab(tabValue);
  };

  const handleProfileUpdated = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_age_group, organization_role, organization_id')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // ============================================================================
  // USE FOCUS HANDLER
  // ============================================================================
  const handleUseFocus = (data: FocusApplicationData) => {
    setFocusDataToApply(data);
    // Switch to enhance tab if not already there
    setActiveTab("enhance");
    // Clear any viewing lesson so form is fresh
    setSelectedLesson(null);
    
    toast({
      title: "Focus Applied",
      description: `${focusData.organizationName || "Organization"} defaults applied to your lesson form`,
    });
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header WITHOUT org name - this is Personal Workspace */}
      <Header isAuthenticated hideOrgContext />

      <main className="container py-4 sm:py-6 px-4 sm:px-6 flex-1">
        {/* Welcome Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Welcome back, <span className="gradient-text">{userName}!</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Your Personal Bible Study Workspace
                </p>
              </div>
            </div>
          </div>
          {settings.show_credits_block && <CreditsDisplay balance={balance} loading={creditsLoading} />}
        </div>

        {/* ================================================================== */}
        {/* ACTIVE FOCUS BANNER - Shows when org has active shared focus */}
        {/* ================================================================== */}
        {hasActiveFocus && focusData.activeFocus && focusStatus && (
          <ActiveFocusBanner
            focus={focusData.activeFocus}
            status={focusStatus}
            organizationName={focusData.organizationName || "Your Organization"}
            defaultBibleVersion={focusData.defaultBibleVersion}
            defaultDoctrine={focusData.defaultDoctrine}
            onUseFocus={handleUseFocus}
            dismissible
          />
        )}

        {/* Stats Cards - Personal Only */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-primary shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{stats.lessonsCreated}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">My Lessons</p>
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
        </div>

        {/* Tabs - Personal Workspace Only */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted p-1 rounded-lg mb-2 relative z-10">
            <TabsTrigger 
              value="enhance" 
              onClick={() => DASHBOARD_TABS.enhance?.clearViewingOnClick && setSelectedLesson(null)} 
              className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Enhance Lesson</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">My Lesson Library</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Enhance Lesson Tab */}
          <TabsContent value="enhance" className="mt-6 relative z-0">
            <EnhanceLessonForm
              onLessonGenerated={(lesson) => {
                setLastGeneratedLessonId(lesson?.id || null);
                // Clear focus data after lesson is generated so it doesn't re-apply
                setFocusDataToApply(null);
                toast({
                  title: "Lesson Generated!",
                  description: "Review your lesson, then use Copy, Print, or Download when ready.",
                  duration: 6000,
                });
              }}
              onExport={() => {
                setTimeout(() => setShowBetaFeedbackModal(true), FEEDBACK_TRIGGER.exportDelayMs);
              }}
              organizationId={userProfile?.organization_id}
              userPreferredAgeGroup={userProfile?.preferred_age_group || "youngadult"}
              defaultDoctrine="SBC"
              viewingLesson={selectedLesson}
              onClearViewing={() => {
                setSelectedLesson(null);
                setActiveTab("library");
              }}
              initialFocusData={focusDataToApply || undefined}
            />
          </TabsContent>

          {/* My Lesson Library Tab */}
          <TabsContent value="library" className="mt-6 relative z-0">
            <LessonLibrary
              onCreateNew={handleCreateLesson}
              onViewLesson={handleViewLesson}
            />
          </TabsContent>

          {/* Settings Tab */}
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

              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    Manage your account and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Workspace</span>
                      <Badge variant="outline">Personal</Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowProfileModal(true)}
                    >
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Feedback Button - Compact on mobile, small on desktop */}
      <Button
        variant="hero"
        size="sm"
        className="fixed bottom-4 right-4 shadow-glow z-40 px-3 py-2 text-xs sm:text-sm"
        onClick={handleFeedback}
      >
        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline ml-1">Feedback</span>
      </Button>

      {/* Modals */}
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
    </div>
  );
}
