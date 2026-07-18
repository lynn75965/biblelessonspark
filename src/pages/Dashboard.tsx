import { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { DASHBOARD_TABS, DASHBOARD_TEXT } from "@/constants/dashboardConfig";
import { ROUTES, DASHBOARD_QUERY_PARAMS, DASHBOARD_TAB_VALUES } from "@/constants/routes";
import { UsageDisplay } from "@/components/dashboard/UsageDisplay";
import { MemberPoolStatusBanner } from "@/components/org/MemberPoolStatusBanner";
import { EnhanceLessonForm } from "@/components/dashboard/EnhanceLessonForm";
import { LessonLibrary } from "@/components/dashboard/LessonLibrary";
import { DevotionalLibrary } from "@/components/dashboard/DevotionalLibrary";
import { SeriesLibrary } from "@/components/dashboard/SeriesLibrary";
import { PublicBetaPromptBanner } from "@/components/dashboard/PublicBetaPromptBanner";
import { TeamInvitationBanner } from "@/components/dashboard/TeamInvitationBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen,
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
import { supabase } from "@/integrations/supabase/client";
import { FEEDBACK_TRIGGER } from '@/constants/feedbackConfig';
import { useTeachingTeam } from "@/hooks/useTeachingTeam";
import { useOrgSharedFocus } from "@/hooks/useOrgSharedFocus";
import { useOrganization } from "@/hooks/useOrganization";
import { ActiveFocusBanner, type FocusApplicationData } from "@/components/org/ActiveFocusBanner";
import { useHelpVideo } from "@/hooks/useHelpVideo";
import { VideoModal } from "@/components/help/VideoModal";
import { shouldShowHelpBanner, shouldShowFloatingButton } from "@/constants/helpVideos";
import { UserProfile, ViewingLesson } from "@/constants/contracts";

// Public Beta Prompt Banner added (January 1, 2026)

/** Sidebar/series-library navigation state passed via react-router's
 *  location.state. Added 2026-07-18 (no-explicit-any batch 1). */
export interface DashboardLocationState {
  tab?: string;
  viewLessonId?: string;
  origin?: string;
  originSeriesId?: string;
}

type DashboardUserProfile = Pick<
  UserProfile,
  'preferred_age_group' | 'organization_role' | 'organization_id' | 'theology_profile_id'
>;

export default function Dashboard() {
  // STATE DECLARATIONS
  const location = useLocation();
  const initialTab = (location.state as DashboardLocationState | null)?.tab || DASHBOARD_TAB_VALUES.BUILD;
  const [showBetaFeedbackModal, setShowBetaFeedbackModal] = useState(false);
  const feedbackSubmittedRef = useRef(false);
  const [lastGeneratedLessonId, setLastGeneratedLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedLesson, setSelectedLesson] = useState<ViewingLesson | null>(null);
  const [buildLessonKey, setBuildLessonKey] = useState(0);
  const [viewOrigin, setViewOrigin] = useState<string | null>(null);
  const [originSeriesId, setOriginSeriesId] = useState<string | null>(null);
  const [pendingViewLessonId, setPendingViewLessonId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<DashboardUserProfile | null>(null);
  const [focusDataToApply, setFocusDataToApply] = useState<FocusApplicationData | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // HOOKS
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const { lessons, loading: lessonsLoading } = useLessons();
  const { focusData, hasActiveFocus, focusStatus } = useOrgSharedFocus();
  const { hasTeam, pendingInvitation, acceptInvitation, declineInvitation } = useTeachingTeam();
  // Org members draw lessons from their organization's pool (the generate-lesson
  // backend grants any org member 'personal' tier access from the pool). Surface
  // that pool here instead of the personal "Free" usage card, which only reads the
  // member's own (still-free) subscription and misrepresents their real access.
  const { organization, hasOrganization, loading: orgLoading } = useOrganization();

  // Teaching Team invitation banner handlers. A confirmed Accept navigates the
  // new member to /teaching-team -- this remounts AppShell so its useTeachingTeam
  // instance refetches, the sidebar unlocks, and the page shows team-shared
  // lessons. Decline just clears the banner and stays on the dashboard.
  const handleAcceptInvite = async () => {
    const joined = await acceptInvitation();
    if (joined) navigate(ROUTES.TEACHING_TEAM);
  };
  const handleDeclineInvite = async () => {
    await declineInvitation();
  };

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

  // Respond to sidebar tab navigation and Series Library lesson view via location.state
  useEffect(() => {
    const state = location.state as DashboardLocationState | null;
    if (!state) return;

    const validTabs = Object.values(DASHBOARD_TAB_VALUES);
    if (state.tab && (validTabs as readonly string[]).includes(state.tab)) {
      setActiveTab(state.tab);
      // Sidebar tab nav (no viewLessonId): clear any viewing-lesson state so
      // the tab opens fresh. Matches handleTabChange's clearViewingOnClick.
      if (!state.viewLessonId) {
        setSelectedLesson(null);
        setViewOrigin(null);
        setOriginSeriesId(null);
        if (state.tab === 'enhance') setBuildLessonKey(k => k + 1);
      }
    }

    // Series Library lesson view: resolve lesson from state
    if (state.viewLessonId) {
      setPendingViewLessonId(state.viewLessonId);
      setViewOrigin(state.origin || null);
      setOriginSeriesId(state.originSeriesId || null);
      // Clear state so refresh does not re-trigger
      window.history.replaceState({}, '');
    }
  }, [location]);

  // Resolve pending lesson view once lessons are loaded
  useEffect(() => {
    if (!pendingViewLessonId || lessons.length === 0) return;
    const lessonToView = lessons.find((l) => l.id === pendingViewLessonId);
    if (lessonToView) {
      setSelectedLesson(lessonToView);
      setActiveTab("enhance");
      setPendingViewLessonId(null);
    }
  }, [pendingViewLessonId, lessons]);

  // Handle URL query parameters (SSOT: routes.ts)
  useEffect(() => {
    const tabParam = searchParams.get(DASHBOARD_QUERY_PARAMS.TAB);
    const viewLessonId = searchParams.get(DASHBOARD_QUERY_PARAMS.VIEW_LESSON);

    const validTabs = Object.values(DASHBOARD_TAB_VALUES);
    if (tabParam && (validTabs as readonly string[]).includes(tabParam)) {
      setActiveTab(tabParam);
    }

    if (viewLessonId && lessons.length > 0) {
      const lessonToView = lessons.find((l) => l.id === viewLessonId);
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

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const handleCreateLesson = () => {
    setActiveTab("enhance");
  };

  const handleViewLesson = async (lesson: ViewingLesson) => {
    setActiveTab("enhance");

    // Shepherd (org pool / shared) lessons arrive from get_org_pool_lessons WITH
    // their full body (original_text + metadata), so -- unlike team lessons --
    // no resolver round-trip is needed. Open them in the same read-only viewer
    // (isTeamLesson:true drives read-only; export stays available).
    if (lesson?.isShepherdLesson) {
      setSelectedLesson({
        id: lesson.id,
        user_id: lesson.user_id,
        title: lesson.title,
        original_text: lesson.original_text,
        filters: lesson.filters,
        metadata: lesson.metadata,
        visibility: lesson.visibility,
        created_at: lesson.created_at,
        isTeamLesson: true,
        authorName: lesson.authorName,
      });
      toast({
        title: "Opening lesson",
        description: `Opening "${lesson.title || "lesson"}" for viewing.`,
      });
      return;
    }

    // Team lessons arrive from get_team_lessons WITHOUT their body (original_text
    // is null in the list payload -- FACT A blocks a client read of a teammate's
    // row). Fetch the full content past lessons RLS via get_team_lesson
    // (SECURITY DEFINER, migration 20260616160000) before opening the read-only
    // viewer. Owner lessons already carry their own content.
    if (lesson?.isTeamLesson) {
      const { data, error } = await supabase.rpc('get_team_lesson', {
        p_lesson_id: lesson.id,
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        toast({
          title: "Unable to open lesson",
          description: "This shared lesson is no longer available.",
          variant: "destructive",
        });
        return;
      }
      setSelectedLesson({
        id: row.lesson_id,
        user_id: row.user_id,
        title: row.title,
        original_text: row.original_text,
        filters: row.filters,
        metadata: row.metadata,
        visibility: row.visibility,
        created_at: row.created_at,
        isTeamLesson: true,
        authorName: row.author_name,
      });
      toast({
        title: "Opening lesson",
        description: `Opening "${row.title || "lesson"}" for viewing.`,
      });
      return;
    }

    setSelectedLesson(lesson);
    toast({
      title: "Opening lesson",
      description: `Opening "${lesson.ai_lesson_title || lesson.title}" for viewing.`,
    });
  };

  const handleFeedback = () => {
    setShowBetaFeedbackModal(true);
  };

  const handleTabChange = (tabValue: string) => {
    const tabKey = tabValue as keyof typeof DASHBOARD_TABS;
    const tabConfig = DASHBOARD_TABS[tabKey];
    if (tabConfig?.clearViewingOnClick) {
      setSelectedLesson(null);
      if (tabValue === 'enhance') setBuildLessonKey(k => k + 1);
    }
    setActiveTab(tabValue);
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
    <AppShell
      conditions={{ hasTeam }}
    >
        {/* Teaching Team invitation -- shown at the very top when the logged-in
            user has a pending invite (resolved past RLS by get_my_teaching_team). */}
        {pendingInvitation && (
          <TeamInvitationBanner
            invitation={pendingInvitation}
            onAccept={handleAcceptInvite}
            onDecline={handleDeclineInvite}
          />
        )}

        <div className="flex flex-col gap-4 mb-6 sm:mb-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Greeting (left) */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <UserCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {DASHBOARD_TEXT.greeting} <span className="gradient-text">{userName}!</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {DASHBOARD_TEXT.subtitle}
              </p>
            </div>
          </div>

          {/* Lesson usage -- responsive by design:
              - mobile (<640): full-width, stacked (cards can't sit side by side
                legibly on a phone; stacking is the most usable layout there)
              - tablet/sm+ : side by side, right-aligned (cards shrink to fit)
              - laptop/desktop/lg+: the pair sits to the RIGHT of the greeting
              Personal usage is RIGHTMOST for everyone (unaffiliated = right
              margin); the additive Shepherd pool sits to its LEFT. */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-end lg:shrink-0">
            {!orgLoading && hasOrganization && organization && (
              <div className="w-full sm:flex-1 sm:max-w-xs">
                <MemberPoolStatusBanner
                  organizationId={organization.id}
                  organizationName={organization.name}
                />
              </div>
            )}
            <div className="w-full sm:flex-1 sm:max-w-xs">
              <UsageDisplay />
            </div>
          </div>
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

          <TabsContent value="enhance" className="mt-6 data-[state=inactive]:hidden" forceMount>
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

            {/* Pending lesson view: show spinner instead of form to prevent flash */}
            {pendingViewLessonId && !selectedLesson ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : (
            <EnhanceLessonForm
              onLessonGenerated={(lesson) => {
                setLastGeneratedLessonId(lesson?.id || null);
                setFocusDataToApply(null);
                toast({
                  title: "Lesson Generated!",
                  description: "Review your lesson, then use Copy or Download when ready.",
                  duration: 6000,
                });
                // First-lesson feedback prompt (server-authoritative eligibility)
                supabase.rpc('should_show_feedback_popup').then(({ data, error }) => {
                  if (error) {
                    console.error('Failed to check feedback popup eligibility:', error);
                    return;
                  }
                  if (data) {
                    setTimeout(() => setShowBetaFeedbackModal(true), FEEDBACK_TRIGGER.exportDelayMs);
                  }
                });
              }}
              onExport={() => {
                // Feedback prompt moved to onLessonGenerated (server-authoritative eligibility)
              }}
              organizationId={userProfile?.organization_id}
              userPreferredAgeGroup={userProfile?.preferred_age_group || "youngadult"}
              defaultDoctrine="SBC"
              viewingLesson={selectedLesson}
              viewingOrigin={viewOrigin}
              onClearViewing={() => {
                setSelectedLesson(null);
                setViewOrigin(null);
                if (viewOrigin === 'series' && originSeriesId) {
                  navigate(ROUTES.DASHBOARD, { state: { tab: 'series-library', expandSeriesId: originSeriesId } });
                } else {
                  setActiveTab("library");
                }
                setOriginSeriesId(null);
              }}
              onLessonContentUpdated={(lessonId, updates) => {
                setSelectedLesson((prev) =>
                  prev && prev.id === lessonId ? { ...prev, ...updates } : prev
                );
              }}
              initialFocusData={focusDataToApply || undefined}
              buildLessonKey={buildLessonKey}
            />
            )}
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <LessonLibrary
              onCreateNew={handleCreateLesson}
              onViewLesson={handleViewLesson}
            />
          </TabsContent>

          <TabsContent value="devotional-library" className="mt-6">
            <DevotionalLibrary />
          </TabsContent>

          <TabsContent value="series-library" className="mt-6">
            <SeriesLibrary />
          </TabsContent>
</Tabs>

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


      <BetaFeedbackModal
        open={showBetaFeedbackModal}
        onOpenChange={(open) => {
          if (!open && !feedbackSubmittedRef.current) {
            // Dismissed without submitting -- a dismissal is a permanent "no".
            supabase.rpc('dismiss_feedback_popup').then(({ error }) => {
              if (error) console.error('Failed to record feedback popup dismissal:', error);
            });
          }
          feedbackSubmittedRef.current = false;
          setShowBetaFeedbackModal(open);
        }}
        onSubmitted={() => {
          feedbackSubmittedRef.current = true;
          // Suppression is derived server-side from the feedback row's
          // existence (should_show_feedback_popup) -- nothing to persist here.
        }}
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
    </AppShell>
  );
}




