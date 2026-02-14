import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { BRANDING } from "@/config/branding";
import { DASHBOARD_TABS } from "@/constants/dashboardConfig";
import { WORKSPACE_QUERY_PARAMS, WORKSPACE_TABS } from "@/constants/routes";
import { UsageDisplay } from "@/components/dashboard/UsageDisplay";
import { EnhanceLessonForm } from "@/components/dashboard/EnhanceLessonForm";
import { LessonLibrary } from "@/components/dashboard/LessonLibrary";
import { DevotionalLibrary } from "@/components/dashboard/DevotionalLibrary";
import { UserProfileModal } from "@/components/dashboard/UserProfileModal";
import { PublicBetaPromptBanner } from "@/components/dashboard/PublicBetaPromptBanner";
import { WorkspaceSettingsPanel } from "@/components/workspace/WorkspaceSettingsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Sparkles,
  Settings,
  MessageSquare,
  UserCircle,
  HelpCircle,
  PlayCircle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BetaFeedbackModal } from "@/components/BetaFeedbackModal";
import { useAuth } from "@/hooks/useAuth";
import { useLessons } from "@/hooks/useLessons";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { FEEDBACK_TRIGGER } from '@/constants/feedbackConfig';
import { useOrgSharedFocus } from "@/hooks/useOrgSharedFocus";
import { ActiveFocusBanner, type FocusApplicationData } from "@/components/org/ActiveFocusBanner";

// Help Video System (January 6, 2026)
// Configuration in BRANDING.helpVideos controls visibility
import { useHelpVideo } from "@/hooks/useHelpVideo";
import { VideoModal } from "@/components/help/VideoModal";
import { shouldShowHelpBanner, shouldShowFloatingButton } from "@/constants/helpVideos";

// Public Beta Prompt Banner added (January 1, 2026)

export default function Dashboard() {
  // STATE DECLARATIONS
  const [showBetaFeedbackModal, setShowBetaFeedbackModal] = useState(false);
  const [lastGeneratedLessonId, setLastGeneratedLessonId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState("enhance");
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [focusDataToApply, setFocusDataToApply] = useState<FocusApplicationData | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // HOOKS
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const { lessons, loading: lessonsLoading } = useLessons();
  const { trackFeatureUsed, trackLessonViewed } = useAnalytics();
  const { focusData, hasActiveFocus, focusStatus } = useOrgSharedFocus();

  // Help Video Hook - respects BRANDING.helpVideos.enabled
  const { 
    showVideo, 
    setShowVideo, 
    currentVideo, 
    triggerHelp,
    hasBeenSeen,
    isEnabled: helpVideosEnabled
  } = useHelpVideo({ 
    disabled: activeTab !== 'enhance' || selectedLesson !== null 
  });

  // Handle URL query parameters (SSOT: routes.ts)
  useEffect(() => {
    const tabParam = searchParams.get(WORKSPACE_QUERY_PARAMS.TAB);
    const viewLessonId = searchParams.get(WORKSPACE_QUERY_PARAMS.VIEW_LESSON);
    
    const validTabs = Object.values(WORKSPACE_TABS);
    if (tabParam && validTabs.includes(tabParam as any)) {
      setActiveTab(tabParam);
    }
    
    if (viewLessonId && lessons.length > 0) {
      const lessonToView = lessons.find((l: any) => l.id === viewLessonId);
      if (lessonToView) {
        setSelectedLesson(lessonToView);
        setActiveTab("enhance");
        toast({
          title: "Opening source lesson",
          description: `Opening "${lessonToView.ai_lesson_title || lessonToView.title}"`,
        });
      }
    }
  }, [searchParams, lessons, toast]);

  // Load user profile
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

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const stats = {
    lessonsCreated: lessons.length,
    aiGenerations: lessons.length * 3
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

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
    await loadUserProfile();
  };

  const handleUseFocus = (data: FocusApplicationData) => {
    setFocusDataToApply(data);
    setActiveTab("enhance");
    setSelectedLesson(null);
    toast({
      title: "Focus Applied",
      description: `${focusData.organizationName || "Organization"} defaults applied to your lesson form`,
    });
  };

  // Callback when user joins Public Beta - refresh profile to update org status
  const handleBetaEnrollmentComplete = async () => {
    await loadUserProfile();
  };

  // Handle banner dismiss
  const handleDismissBanner = () => {
    setBannerDismissed(true);
    // Also mark video as seen so it doesn't auto-play
    if (currentVideo) {
      localStorage.setItem(currentVideo.storageKey, 'true');
    }
  };

  // Help video visibility checks (respects BRANDING.helpVideos settings)
  const showHelpBanner = helpVideosEnabled && 
    shouldShowHelpBanner() && 
    activeTab === 'enhance' && 
    !selectedLesson && 
    !hasBeenSeen && 
    !bannerDismissed;

  const showFloatingHelp = helpVideosEnabled && 
    shouldShowFloatingButton() && 
    activeTab === 'enhance' && 
    !selectedLesson;

  return (
    <div className={BRANDING.layout.pageWrapper}>
      <Header isAuthenticated hideOrgContext />
      <main className={`container ${BRANDING.layout.containerPadding} ${BRANDING.layout.mainContent}`}>
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
          <UsageDisplay />
        </div>

        {/* Public Beta Prompt Banner - shows for orphan users in public_beta mode */}
        <PublicBetaPromptBanner
          userOrgId={userProfile?.organization_id || null}
          onEnrollmentComplete={handleBetaEnrollmentComplete}
        />

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
              <span className="hidden sm:inline">Lesson Library</span>
            </TabsTrigger>
            <TabsTrigger value="devotional-library" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Devotional Library</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhance" className="mt-6 relative z-0">
            {/* Help Banner - Only shows when BRANDING.helpVideos.enabled = true */}
            {showHelpBanner && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                      <PlayCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">New here? Learn how to create your first lesson</p>
                      <p className="text-sm text-blue-700">Watch a quick 60-second walkthrough</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={triggerHelp}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Watch Video
                    </Button>
                    <Button
                      onClick={handleDismissBanner}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <EnhanceLessonForm
              onLessonGenerated={(lesson) => {
                setLastGeneratedLessonId(lesson?.id || null);
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

          <TabsContent value="library" className="mt-6 relative z-0">
            <LessonLibrary
              onCreateNew={handleCreateLesson}
              onViewLesson={handleViewLesson}
            />
          </TabsContent>

          <TabsContent value="devotional-library" className="mt-6 relative z-0">
            <DevotionalLibrary />
          </TabsContent>

          <TabsContent value="settings" className="mt-6 relative z-0">
            {/* User Profile Card — opens expanded Profile modal */}
            <Card className="bg-gradient-card mb-6">
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Your identity and personal defaults — Bible version, theology profile, language</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workspace</span>
                    <Badge variant="outline">Personal</Badge>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setShowProfileModal(true)}>
                    Update Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Settings — lesson defaults, teaching context, export, notifications */}
            <WorkspaceSettingsPanel />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      {/* Floating Help Button - Only shows when BRANDING.helpVideos.enabled = true */}
      {showFloatingHelp && (
        <Button
          onClick={triggerHelp}
          size="icon"
          className="fixed bottom-4 left-4 h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-40"
          title="How to Create a Lesson"
        >
          <HelpCircle className="h-6 w-6" />
          <span className="sr-only">Help</span>
        </Button>
      )}

      <Button
        variant="hero"
        size="sm"
        className="fixed bottom-4 right-4 shadow-glow z-40 px-3 py-2 text-xs sm:text-sm"
        onClick={handleFeedback}
      >
        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline ml-1">Feedback</span>
      </Button>

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

      {/* Help Video Modal - Only renders when help videos are enabled */}
      {helpVideosEnabled && (
        <VideoModal
          open={showVideo}
          onClose={() => setShowVideo(false)}
          video={currentVideo}
        />
      )}
    </div>
  );
}




