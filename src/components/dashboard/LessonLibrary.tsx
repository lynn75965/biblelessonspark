/**
 * LessonLibrary Component
 * Browse and manage saved Baptist Bible study lessons
 * 
 * SSOT Compliance:
 * - AGE_GROUPS imported from @/constants/ageGroups
 * - getTheologyProfileOptions() used for dropdown (respects displayOrder)
 * - getDefaultTheologyProfile() used for fallback default
 * - getTheologyProfile() used for display name lookup
 * - Filter dropdowns generated dynamically from constants
 * - Badge colors keyed by ID (order-independent, fully SSOT-compliant)
 * 
 * Phase 19: DevotionalSpark Integration
 * - Sparkle button passes LESSON settings to devotional generator
 * - Devotional inherits lesson's theology_profile, age_group, bible_version
 * - Supports both passage-based AND theme/focus-based lessons
 * - User can override Target (audience) and Length in the devotional generator
 * 
 * Phase 26: Lesson Visibility Status (February 2026)
 * - Private/Shared toggle per lesson card
 * - Private is permanent default; teacher must explicitly share
 * - ?? Private = only the creator can see it
 * - ?? Shared = creator + Org Manager + linked Teaching Team
 * 
 * Phase 27: Teaching Team Lessons (February 2026)
 * - "My Lessons" / "Team Lessons" scope toggle (visible only when user has a team)
 * - Team Lessons shows shared lessons from all team members (read-only)
 * - Author name displayed on team lesson cards
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findMatchingBooks } from "@/constants/bibleBooks";
import { FORM_STYLING } from "@/constants/formConfig";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2, Search, BookOpen, Users, Heart, Lock, Share2, User, ListPlus, Shapes, Plus, Loader2, Layers, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLessons } from "@/hooks/useLessons";
import { useTeachingTeam } from "@/hooks/useTeachingTeam";
import { useSeriesManager } from "@/hooks/useSeriesManager";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useSubscription } from "@/hooks/useSubscription";
import { hasFeatureAccess, getUpgradePrompt } from "@/constants/featureFlags";
import { useToast } from "@/hooks/use-toast";
import { UpgradePromptModal } from "@/components/subscription/UpgradePromptModal";
import { ROUTES } from "@/constants/routes";
import { LESSON_LIBRARY_TEXT } from "@/constants/dashboardConfig";
import { Lesson, LESSONS_TABLE } from "@/constants/contracts";
import { SERIES_LIMITS } from "@/constants/seriesConfig";
import { AGE_GROUPS } from "@/constants/ageGroups";
import { getTheologyProfile, getTheologyProfileOptions, getDefaultTheologyProfile, getProfileBadgeClass, DEFAULT_BADGE_CLASS } from "@/constants/theologyProfiles";
import { AUDIENCE_ROLES } from "@/constants/audienceConfig";
import { LESSON_SHAPES } from "@/constants/lessonShapeProfiles";
import {
  buildCascadeInfo,
  buildDeleteConfirmation,
  buildDeleteSuccessToast,
} from "@/utils/lessonDeletion";

// ============================================================================
// INTERFACES
// ============================================================================

interface LessonLibraryProps {
  onViewLesson?: (lesson: any) => void;
  onCreateNew?: () => void;
  organizationId?: string;
}

interface LessonDisplay extends Lesson {
  ai_lesson_title: string | null;
  extracted_passage: string | null;
  bible_passage: string | null;
  focused_topic: string | null;
  passage_or_topic: string;
  age_group: string;
  theology_profile_id: string;
  bible_version_id: string;
  created_by_name: string;
  has_content: boolean;
  updated_at?: string;
  /** Phase 27: true if this lesson belongs to a team member (read-only) */
  isTeamLesson?: boolean;
  /** Shepherding B3: true if this is a group (org pool / shared) lesson shown
   *  read-only in the Shepherd scope. Carries isTeamLesson:true as well so it
   *  reuses the existing read-only treatment. */
  isShepherdLesson?: boolean;
  /** Phase 27: display name of the lesson author (for team lessons) */
  authorName?: string;
}

// ============================================================================
// SSOT-DERIVED BADGE COLORS
// Colors keyed by profile ID - fully SSOT compliant, order-independent
// ============================================================================

// Session B (May 2026): client-side pagination for the Lesson Library card grid.
// Architectural choice: useLessons fetches all rows so EnhanceLessonForm,
// useSeriesManager, and reshapeChildrenByParent retain full visibility into
// the user's library. Pagination slices filteredLessons for display only.
const LESSONS_PER_PAGE = 15;

const AGE_GROUP_BADGE_COLOR_MAP: Record<string, string> = {
  "preschool": "bg-pink-100 text-pink-800 border-pink-200",
  "elementary": "bg-blue-100 text-blue-800 border-accent/50",
  "preteen": "bg-purple-100 text-purple-800 border-purple-200",
  "highschool": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "college": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "youngadult": "bg-teal-100 text-teal-800 border-teal-200",
  "midlife": "bg-primary/10 text-green-800 border-primary/30",
  "experienced": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "activesenior": "bg-orange-100 text-orange-800 border-orange-200",
  "senior": "bg-red-100 text-red-800 border-destructive/30",
  "mixed": "bg-muted text-foreground border-border",
};

// SSOT: Theology badge colors now served by getProfileBadgeClass() from theologyProfiles.ts

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const extractLessonTitle = (content: string): string | null => {
  if (!content) return null;
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?Lesson Title:?(?:\*\*)?\s*[""]?(.+?)[""]?\s*$/i);
    if (match) return match[1].replace(/[""\*]/g, "").trim();
  }
  return null;
};

/**
 * Extract Primary Scripture from lesson content
 * Handles multiple formats:
 * - "Primary Scripture: John 3:16"
 * - "Primary Scripture Passage: John 3:16"
 * - "**Primary Scripture:** John 3:16"
 * - "**Primary Scripture Passage:** John 3:16"
 */
const extractPrimaryScripture = (content: string): string | null => {
  if (!content) return null;
  const lines = content.split("\n");
  for (const line of lines) {
    // Match both "Primary Scripture:" and "Primary Scripture Passage:"
    const match = line.match(/^(?:\*\*)?Primary Scripture(?:\s+Passage)?:?(?:\*\*)?\s*[""]?(.+?)[""]?\s*$/i);
    if (match) return match[1].replace(/[""\*]/g, "").trim();
  }
  return null;
};

/**
 * Transform a raw lesson row into LessonDisplay format
 * Used for both user's own lessons and team lessons
 */
const transformToDisplay = (
  lesson: any,
  options?: { isTeamLesson?: boolean; isShepherdLesson?: boolean; authorName?: string }
): LessonDisplay => {
  const filters = lesson.filters as Record<string, any> | null;
  const aiGeneratedTitle = extractLessonTitle(lesson.original_text || "");
  const userInputPassage = filters?.bible_passage || null;
  const userInputTopic = filters?.focused_topic || null;

  // Extract Primary Scripture Passage(s) from lesson content (Section 1)
  // Handles both same-line and next-line formats, singular and plural
  const rawText = lesson.original_text || "";
  const sameLineMatch = rawText.match(/\*\*Primary Scripture Passages?:\*\*[ \t]+(.+)/i);
  const nextLineMatch = rawText.match(/\*\*Primary Scripture Passages?:\*\*[ \t]*\n+[ \t]*(.+)/i);
  const extractedPassage = sameLineMatch
    ? sameLineMatch[1].replace(/\*\*/g, '').trim()
    : nextLineMatch ? nextLineMatch[1].replace(/\*\*/g, '').trim() : null;

  return {
    ...lesson,
    ai_lesson_title: aiGeneratedTitle,
    extracted_passage: extractedPassage,
    bible_passage: userInputPassage,
    focused_topic: userInputTopic,
    passage_or_topic: lesson.title || filters?.passageOrTopic || "Untitled Lesson",
    age_group: filters?.age_group || AGE_GROUPS[AGE_GROUPS.length - 1].id,
    theology_profile_id: filters?.theology_profile_id || getDefaultTheologyProfile().id,
    bible_version_id: filters?.bible_version_id || "kjv",
    created_by_name: options?.authorName || "Teacher",
    has_content: !!lesson.original_text,
    updated_at: lesson.created_at,
    isTeamLesson: options?.isTeamLesson || false,
    isShepherdLesson: options?.isShepherdLesson || false,
    authorName: options?.authorName || undefined,
  };
};

/**
 * A lesson reads as "shared" when its visibility flag is 'shared' OR it was
 * funded by the org pool -- pool-funded lessons are automatically group-visible
 * (Option B), so My Lessons shows them as Shared, never Private/locked.
 */
const lessonIsShared = (l: {
  visibility?: string | null;
  org_pool_consumed?: boolean | null;
}): boolean => l.visibility === "shared" || !!l.org_pool_consumed;

// ============================================================================
// COMPONENT
// ============================================================================

export function LessonLibrary({ onViewLesson, onCreateNew, organizationId }: LessonLibraryProps) {
  const navigate = useNavigate();
  const [searchPassage, setSearchPassage] = useState("");
  const [showPassageSuggestions, setShowPassageSuggestions] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");

  // Phase 27: Scope toggle and team lessons state
  const [scope, setScope] = useState<"my" | "team" | "shepherd">("my");
  const [teamLessons, setTeamLessons] = useState<LessonDisplay[]>([]);
  const [teamLessonsLoading, setTeamLessonsLoading] = useState(false);
  // Shepherding B3: the group's lessons (pool-funded + shared), read-only.
  const [shepherdLessons, setShepherdLessons] = useState<LessonDisplay[]>([]);
  const [shepherdLessonsLoading, setShepherdLessonsLoading] = useState(false);

  const { lessons, loading, deleteLesson, updateLessonVisibility, refetch: refreshLessons } = useLessons();
  const { hasTeam, team, members, fetchTeamLessons } = useTeachingTeam();
  const { hasOrganization } = useOrganization();
  const { tier } = useSubscription();
  const { toast } = useToast();
  const canUseDevotional = hasFeatureAccess(tier, 'devotional');
  const { allSeries, fetchAllSeries, linkLessonToSeries, createSeries, isCreating } = useSeriesManager();
  const [addToSeriesOpenId, setAddToSeriesOpenId] = useState<string | null>(null);
  const seriesPopoverRef = useRef<HTMLDivElement>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [addingToSeries, setAddingToSeries] = useState(false);
  const [showCreateSeriesModal, setShowCreateSeriesModal] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [newSeriesLessonCount, setNewSeriesLessonCount] = useState(SERIES_LIMITS.defaultLessons);

  // Session B: pagination state -- client-side slice of filteredLessons.
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch series list on mount for "Add to Series" dropdown
  useEffect(() => { fetchAllSeries(); }, []);

  // Rule #22 a11y: dismiss the card-level Add-to-Series popover when the
  // user clicks anywhere outside it. Mirrors the EnhanceLessonForm pattern.
  useEffect(() => {
    if (!addToSeriesOpenId) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        seriesPopoverRef.current &&
        !seriesPopoverRef.current.contains(e.target as Node)
      ) {
        setAddToSeriesOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [addToSeriesOpenId]);

  // Session B: any filter or scope change snaps the user back to page 1.
  useEffect(() => {
    setCurrentPage(0);
  }, [searchPassage, searchTitle, ageFilter, profileFilter, scope]);

  // Transform user's own lessons for display.
  // Reshape rows (reshape_of IS NOT NULL) are NOT shown as standalone cards
  // in the browse grid. They remain in the database and are surfaced inline
  // on the parent card via the reshapeChildrenByParent map below.
  const displayLessons: LessonDisplay[] = lessons
    .filter((lesson) => !lesson.reshape_of)
    .map((lesson) => transformToDisplay(lesson, { isTeamLesson: false }));

  // Build parent -> reshape children map from the unfiltered lessons array.
  // Session A surfaces these as "View Reshaped" expanders beneath each parent
  // card. Session B will replace the inline expander with proper navigation.
  const reshapeChildrenByParent = new Map<string, Lesson[]>();
  for (const l of lessons) {
    if (l.reshape_of) {
      const existing = reshapeChildrenByParent.get(l.reshape_of) || [];
      existing.push(l);
      reshapeChildrenByParent.set(l.reshape_of, existing);
    }
  }

  // Phase 27: Fetch team lessons when scope switches to "team"
  useEffect(() => {
    if (scope === "team" && hasTeam) {
      loadTeamLessons();
    }
  }, [scope, hasTeam]);

  // Shepherding B3: fetch the group's lessons when scope switches to "shepherd".
  useEffect(() => {
    if (scope === "shepherd" && hasOrganization) {
      loadShepherdLessons();
    }
  }, [scope, hasOrganization]);

  const loadTeamLessons = async () => {
    setTeamLessonsLoading(true);
    try {
      const { data, error } = await fetchTeamLessons();
      if (error) {
        console.error("Error loading team lessons:", error);
        setTeamLessons([]);
        return;
      }

      // Build a map of user_id ? display_name from team members + lead
      const nameMap: Record<string, string> = {};
      if (team) {
        // Lead teacher name -- look up from members or use team info
        // For members, we have display_name in the enriched data
        members.forEach((m) => {
          if (m.display_name) nameMap[m.user_id] = m.display_name;
          else if (m.email) nameMap[m.user_id] = m.email;
        });
      }

      // Prefer the author name resolved server-side by get_team_lessons
      // (author_name). The local nameMap cannot resolve the LEAD's name for a
      // member viewer (members[] holds only non-lead rows), so the resolver value
      // is authoritative; nameMap and a generic label remain as fallbacks.
      const transformed = (data || []).map((lesson: any) =>
        transformToDisplay(lesson, {
          isTeamLesson: true,
          authorName: lesson.author_name || nameMap[lesson.user_id] || "Team Member",
        })
      );
      setTeamLessons(transformed);
    } catch (err) {
      console.error("Error loading team lessons:", err);
      setTeamLessons([]);
    } finally {
      setTeamLessonsLoading(false);
    }
  };

  // Shepherding B3: load the group's pool-funded + shared lessons. The resolver
  // (get_org_pool_lessons) already returns original_text + metadata, so the
  // read-only viewer needs no extra round-trip. Rows are mapped to the lesson
  // shape so transformToDisplay resolves id / passage / age / content correctly.
  const loadShepherdLessons = async () => {
    setShepherdLessonsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_org_pool_lessons");
      if (error) {
        console.error("Error loading shepherd lessons:", error);
        setShepherdLessons([]);
        return;
      }
      const transformed = (data || []).map((row: any) =>
        transformToDisplay(
          {
            id: row.lesson_id,
            user_id: row.user_id,
            title: row.title,
            original_text: row.original_text,
            created_at: row.created_at,
            visibility: row.visibility,
            filters: {
              bible_passage: row.bible_passage,
              age_group: row.age_group,
              theology_profile_id: row.theology_profile,
            },
            metadata: row.metadata,
          },
          {
            isTeamLesson: true,
            isShepherdLesson: true,
            authorName: row.author_name || "Group Member",
          }
        )
      );
      setShepherdLessons(transformed);
    } catch (err) {
      console.error("Error loading shepherd lessons:", err);
      setShepherdLessons([]);
    } finally {
      setShepherdLessonsLoading(false);
    }
  };

  // Choose which lessons to display based on scope
  const activeLessons =
    scope === "team" ? teamLessons : scope === "shepherd" ? shepherdLessons : displayLessons;

  // Unified scope-loading flag for the loading/grid/empty guards.
  const scopeLoading =
    (scope === "team" && teamLessonsLoading) ||
    (scope === "shepherd" && shepherdLessonsLoading);

  // Filter lessons
  const filteredLessons = activeLessons.filter((lesson) => {
    const matchesPassage = !searchPassage || lesson.bible_passage?.toLowerCase().includes(searchPassage.toLowerCase());
    const matchesTitle = !searchTitle || lesson.title?.toLowerCase().includes(searchTitle.toLowerCase());
    const matchesAge = ageFilter === "all" || lesson.age_group === ageFilter;
    const matchesProfile = profileFilter === "all" || lesson.theology_profile_id === profileFilter;
    return matchesPassage && matchesTitle && matchesAge && matchesProfile;
  });

  // Session B: client-side pagination. safePage guards against the case
  // where deleting the last card on the final page would otherwise leave
  // currentPage pointing past the new end.
  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / LESSONS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const pagedLessons = filteredLessons.slice(
    safePage * LESSONS_PER_PAGE,
    safePage * LESSONS_PER_PAGE + LESSONS_PER_PAGE,
  );

  const getAgeGroupBadgeColor = (ageGroup: string): string => {
    return AGE_GROUP_BADGE_COLOR_MAP[ageGroup] || DEFAULT_BADGE_CLASS;
  };

  const getProfileBadgeColor = (profileId: string): string => {
    return getProfileBadgeClass(profileId);
  };

  const getProfileDisplayName = (profileId: string): string => {
    const profile = getTheologyProfile(profileId);
    return profile ? profile.name : profileId;
  };

  const getAgeGroupShortLabel = (ageGroup: string): string => {
    const ag = AGE_GROUPS.find((a) => a.id === ageGroup);
    if (ag) return ag.label.split(" ")[0];
    return ageGroup.split(" ")[0];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /**
   * Session C: cascade-aware delete. Builds the dialog from already-
   * loaded lessons + allSeries (no extra Supabase fetch). Sequence:
   * 1. Compose CascadeInfo (reshape children + series name).
   * 2. Single window.confirm with every applicable warning (Rule DEL2).
   * 3. Hook deletes children first, then parent (Rule DEL3), with one
   *    state update (Rule DEL4).
   * 4. Specific success toast per case (Rule DEL6).
   */
  const handleDelete = async (lesson: Lesson) => {
    const info = buildCascadeInfo(lesson, lessons, allSeries);
    const message = buildDeleteConfirmation(info);
    if (!window.confirm(message)) return;

    const childrenIds = info.reshapeChildren.map((c) => c.id);
    const { success } = await deleteLesson(lesson.id, { childrenIds });
    if (success) toast(buildDeleteSuccessToast(info));
  };

  /**
   * Toggle lesson visibility between Private and Shared (Phase 26)
   * Private is permanent default. Teacher must explicitly share.
   */
  const handleToggleVisibility = async (lesson: LessonDisplay) => {
    const newVisibility = lesson.visibility === 'shared' ? 'private' : 'shared';
    await updateLessonVisibility(lesson.id, newVisibility);
  };

  /**
   * Navigate to devotional generator with LESSON's settings
   * SSOT: Lesson settings flow to devotional generator as defaults
   * Supports both passage-based AND theme/focus-based lessons
   * User can override Target and Length in DevotionalGenerator
   */
  const handleGenerateDevotional = (lesson: LessonDisplay) => {
    const params = new URLSearchParams({
      context: "teaching",
      lessonId: lesson.id,
      lessonTitle: lesson.ai_lesson_title || lesson.title || "Untitled",
    });
    
    // Pass passage if available
    if (lesson.bible_passage) {
      params.set("passage", lesson.bible_passage);
    }
    
    // Pass theme/focus if available (for theme-based lessons)
    if (lesson.focused_topic) {
      params.set("theme", lesson.focused_topic);
    }
    
    // Pass inherited settings
    if (lesson.theology_profile_id) params.set("theologyProfile", lesson.theology_profile_id);
    if (lesson.age_group) params.set("ageGroup", lesson.age_group);
    if (lesson.bible_version_id) params.set("bibleVersion", lesson.bible_version_id);
    
    navigate(`/devotionals?${params.toString()}`);
  };

  const handleAddToSeries = async (lessonId: string, seriesId: string) => {
    setAddingToSeries(true);
    try {
      // Query actual max position for this series
      const { data: maxRow } = await supabase
        .from(LESSONS_TABLE)
        .select('series_lesson_number')
        .eq('series_id', seriesId)
        .order('series_lesson_number', { ascending: false })
        .limit(1)
        .single();

      const nextPosition = (maxRow?.series_lesson_number ?? 0) + 1;
      const success = await linkLessonToSeries(lessonId, seriesId, nextPosition);

      if (success) {
        const series = allSeries.find(s => s.id === seriesId);
        toast({
          title: "Added to series",
          description: `Lesson added as #${nextPosition} in "${series?.series_name || 'series'}".`,
        });
        refreshLessons();
      } else {
        toast({
          title: "Error",
          description: "Failed to add lesson to series. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error adding lesson to series:", err);
      toast({
        title: "Error",
        description: "Failed to add lesson to series.",
        variant: "destructive",
      });
    } finally {
      setAddingToSeries(false);
      setAddToSeriesOpenId(null);
    }
  };

  const handleCreateSeries = async () => {
    const result = await createSeries(newSeriesName, newSeriesLessonCount);
    if (result) {
      setShowCreateSeriesModal(false);
      setNewSeriesName("");
      setNewSeriesLessonCount(SERIES_LIMITS.defaultLessons);
      fetchAllSeries();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {scope === "team"
                  ? `${team?.name || "Team"} Lessons`
                  : scope === "shepherd"
                    ? "Shepherd Lessons"
                    : "My Lesson Library"}
              </CardTitle>
              <CardDescription>
                {scope === "team"
                  ? "Shared lessons from your teaching team members"
                  : scope === "shepherd"
                    ? "Pool-funded and shared lessons from your Shepherding group"
                    : "Browse and manage your Baptist Bible study lessons"}
              </CardDescription>
            </div>

            {/* Scope Toggle -- shown when the user has a team and/or a
                Shepherding org. My Lessons always; Team gated on hasTeam;
                Shepherd Lessons gated on org membership (B3). */}
            {(hasTeam || hasOrganization) && (
              <div className="flex bg-muted rounded-lg p-1 shrink-0 ml-4">
                <Button
                  variant={scope === "my" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setScope("my")}
                  className={`text-xs px-3 ${scope === "my" ? "" : "text-muted-foreground"}`}
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  My Lessons
                </Button>
                {hasTeam && (
                  <Button
                    variant={scope === "team" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setScope("team")}
                    className={`text-xs px-3 ${scope === "team" ? "" : "text-muted-foreground"}`}
                  >
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Team Lessons
                  </Button>
                )}
                {hasOrganization && (
                  <Button
                    variant={scope === "shepherd" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setScope("shepherd")}
                    className={`text-xs px-3 ${scope === "shepherd" ? "" : "text-muted-foreground"}`}
                  >
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    Shepherd Lessons
                  </Button>
                )}
              </div>
            )}

            <Button
              onClick={() => setShowCreateSeriesModal(true)}
              size="sm"
              className="gap-1.5 shrink-0 ml-2"
            >
              <Plus className="h-4 w-4" />
              New Lesson Series
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Bible Passage"
                value={searchPassage}
                onChange={(e) => {
                  setSearchPassage(e.target.value);
                  setShowPassageSuggestions(e.target.value.length >= FORM_STYLING.autocompleteMinChars);
                }}
                onFocus={() => setShowPassageSuggestions(searchPassage.length >= FORM_STYLING.autocompleteMinChars)}
                onBlur={() => setTimeout(() => setShowPassageSuggestions(false), 150)}
                className="pl-10"
                autoComplete="off"
              />
              {showPassageSuggestions && findMatchingBooks(searchPassage, 5, FORM_STYLING.autocompleteMinChars).length > 0 && (
                <div className={FORM_STYLING.autocompleteDropdown}>
                  {findMatchingBooks(searchPassage, 5, FORM_STYLING.autocompleteMinChars).map((book) => (
                    <div
                      key={book}
                      className={FORM_STYLING.autocompleteItem}
                      onMouseDown={() => {
                        setSearchPassage(book);
                        setShowPassageSuggestions(false);
                      }}
                    >
                      {book}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lesson Title"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {AGE_GROUPS.map((ageGroup) => (
                  <SelectItem key={ageGroup.id} value={ageGroup.id}>
                    {ageGroup.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={profileFilter} onValueChange={setProfileFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Theology Profiles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Theology Profiles</SelectItem>
                {getTheologyProfileOptions().map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scope Lessons Loading State (team or shepherd) */}
      {scopeLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Lessons Grid */}
      {!scopeLoading && filteredLessons.length > 0 ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {pagedLessons.map((lesson) => (
            <Card key={lesson.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg mb-1 line-clamp-2 text-foreground dark:text-[#e8f0e8] group-hover:text-primary transition-colors">
                      {lesson.title || lesson.bible_passage || lesson.focused_topic || 'Untitled Lesson'}
                    </CardTitle>
                    {(lesson.extracted_passage || lesson.bible_passage || lesson.focused_topic) && (
                      <CardDescription className="text-xs sm:text-sm line-clamp-1 text-muted-foreground dark:text-[#a8c0a8]">
                        {lesson.extracted_passage || lesson.bible_passage || lesson.focused_topic}
                      </CardDescription>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                  <Badge className={`${getAgeGroupBadgeColor(lesson.age_group)} dark:bg-[#3d5a3d] dark:text-[#e8f0e8] dark:border-[#4d6a4d] text-xs`} variant="secondary">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="hidden sm:inline">{lesson.age_group}</span>
                    <span className="sm:hidden">{getAgeGroupShortLabel(lesson.age_group)}</span>
                  </Badge>
                  <Badge className={getProfileBadgeColor(lesson.theology_profile_id)} variant="secondary">
                    {getProfileDisplayName(lesson.theology_profile_id)}
                  </Badge>
                  {/* Visibility Badge (Phase 26) -- only on user's own lessons */}
                  {!lesson.isTeamLesson && (
                    <Badge
                      variant="outline"
                      className={
                        lessonIsShared(lesson)
                          ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                          : "text-muted-foreground border-border bg-muted/50"
                      }
                    >
                      {lessonIsShared(lesson) ? (
                        <>
                          <Share2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          Shared
                        </>
                      ) : (
                        <>
                          <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          Private
                        </>
                      )}
                    </Badge>
                  )}
                  {/* Phase 27: Author badge for team lessons */}
                  {lesson.isTeamLesson && lesson.authorName && (
                    <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                      <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                      {lesson.authorName}
                    </Badge>
                  )}
                  {!lesson.has_content && (
                    <Badge variant="outline" className="text-warning border-warning/20 bg-warning-light">
                      Draft
                    </Badge>
                  )}
                  {/* Shape badge: only on actual reshape rows. Original lessons
                      are not shaped even if the legacy flow wrote shape_id onto
                      the parent row. The reshape_of guard makes shape identity
                      a property of reshape children only. */}
                  {lesson.shape_id && lesson.reshape_of && (
                    <Badge variant="outline" className="text-yellow-700 border-yellow-400 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-950/20 text-xs">
                      <Shapes className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" aria-hidden="true" />
                      {LESSON_SHAPES.find(s => s.id === lesson.shape_id)?.shortName || 'Reshaped'}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-[#8aa88a] mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Created {formatDate(lesson.created_at)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button data-tour="library-view-button" onClick={() => onViewLesson?.(lesson)} className="flex-1" size="sm">
                    <Eye className="h-4 w-4 mr-1.5" />
                    View
                  </Button>
                  {/* Visibility Toggle (Phase 26) -- only on user's own lessons.
                      Pool-funded lessons are group-visible automatically (Option
                      B): their status is Shared and not user-togglable. */}
                  {!lesson.isTeamLesson && (
                    lesson.org_pool_consumed ? (
                      <Button
                        onClick={() =>
                          toast({
                            title: "Shared with your group",
                            description:
                              "Pool-funded lessons are automatically visible to your Shepherd Group.",
                          })
                        }
                        variant="outline"
                        size="sm"
                        aria-disabled="true"
                        className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                        title="Shared with your Shepherd Group pool (automatic)"
                        aria-label="Shared with your Shepherd Group pool"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleToggleVisibility(lesson)}
                        variant="outline"
                        size="sm"
                        className={
                          lesson.visibility === 'shared'
                            ? "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                            : "hover:bg-muted hover:text-foreground"
                        }
                        title={lesson.visibility === 'shared' ? "Set to Private" : "Share with Org Leaders"}
                      >
                        {lesson.visibility === 'shared' ? (
                          <Share2 className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </Button>
                    )
                  )}
                  {/* Devotional button -- only on user's own lessons with content */}
                  {!lesson.isTeamLesson && lesson.has_content && (
                    canUseDevotional ? (
                      <Button
                        onClick={() => handleGenerateDevotional(lesson)}
                        variant="outline"
                        size="sm"
                        className="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                        title="Generate a devotional from this lesson"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          toast({
                            title: "Personal Plan Required",
                            description: getUpgradePrompt(tier, 'devotional'),
                          });
                          setShowUpgradeModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="opacity-50 hover:opacity-75"
                        title={getUpgradePrompt(tier, 'devotional')}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    )
                  )}
                  {/* Delete -- only on user's own lessons */}
                  {!lesson.isTeamLesson && (
                    <Button
                      onClick={() => handleDelete(lesson)}
                      variant="outline"
                      size="sm"
                      aria-label={
                        lesson.reshape_of
                          ? "Delete this reshape permanently"
                          : "Delete this lesson permanently"
                      }
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                  {/* Add to Series -- only own lessons not already in a series.
                      Rule #22 a11y: aria-expanded/haspopup on trigger, role="menu"
                      on popover, role="menuitem" on each option, Escape closes
                      and returns focus to the trigger, click-outside dismisses
                      (see useEffect above). Mirrors EnhanceLessonForm pattern. */}
                  {!lesson.isTeamLesson && !lesson.series_id && allSeries.length > 0 && (
                    <div className="relative">
                      <Button
                        id={`series-trigger-${lesson.id}`}
                        onClick={() => setAddToSeriesOpenId(addToSeriesOpenId === lesson.id ? null : lesson.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape' && addToSeriesOpenId === lesson.id) {
                            setAddToSeriesOpenId(null);
                            document.getElementById(`series-trigger-${lesson.id}`)?.focus();
                          }
                        }}
                        variant="outline"
                        size="sm"
                        disabled={addingToSeries}
                        aria-label="Add to series"
                        aria-expanded={addToSeriesOpenId === lesson.id}
                        aria-haspopup="menu"
                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      >
                        <ListPlus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      {addToSeriesOpenId === lesson.id && (
                        <div
                          ref={seriesPopoverRef}
                          role="menu"
                          aria-label="Select a series"
                          aria-labelledby={`series-trigger-${lesson.id}`}
                          className="absolute right-0 top-full mt-1 z-50 w-56 rounded-md border bg-popover p-1 shadow-md"
                        >
                          <p aria-hidden="true" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Add to series:</p>
                          {allSeries.map((series) => (
                            <button
                              key={series.id}
                              role="menuitem"
                              onClick={() => handleAddToSeries(lesson.id, series.id)}
                              disabled={addingToSeries}
                              className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors truncate"
                            >
                              {series.series_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Series badge -- shown when lesson is already in a series */}
                  {lesson.series_id && (
                    <Badge
                      variant="outline"
                      className="text-blue-700 border-blue-300 bg-blue-50 text-xs cursor-pointer hover:bg-blue-100 transition-colors"
                      title={allSeries.find(s => s.id === lesson.series_id)?.series_name || ''}
                      onClick={() => navigate(ROUTES.DASHBOARD, { state: { tab: 'series-library', expandSeriesId: lesson.series_id } })}
                    >
                      <BookOpen className="h-2.5 w-2.5 mr-1" />
                      In Series
                    </Badge>
                  )}
                </div>

                {/* Reshape children links (Session A reshape-as-lesson rows).
                    Clicking opens the FULL viewer (EnhanceLessonForm via
                    onViewLesson) so the reshape has identical access to
                    Edit, Add to Series, Copy, Download, Email, Publish,
                    DevotionalSpark, and every other lesson action.
                    When the parent has 2+ reshapes of the same shape, labels
                    are numbered ("Story-Driven 1", "Story-Driven 2") in
                    created_at-ascending order so the user can distinguish
                    them. Single reshapes keep the bare shape label. */}
                {(() => {
                  const children = reshapeChildrenByParent.get(lesson.id) || [];
                  const sorted = [...children].sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  );
                  const shapeTotals = new Map<string, number>();
                  for (const c of sorted) {
                    const sid = c.shape_id ?? '';
                    shapeTotals.set(sid, (shapeTotals.get(sid) || 0) + 1);
                  }
                  const shapeRunningIndex = new Map<string, number>();
                  return sorted.map((child) => {
                    const sid = child.shape_id ?? '';
                    const idx = (shapeRunningIndex.get(sid) || 0) + 1;
                    shapeRunningIndex.set(sid, idx);
                    const shape = LESSON_SHAPES.find(s => s.id === child.shape_id);
                    const total = shapeTotals.get(sid) || 1;
                    const suffix = total > 1 ? ` ${idx}` : '';
                    const childShapeName = `${shape?.shortName || 'Reshaped'}${suffix}`;
                    const childShapeFullName = `${shape?.name || 'Reshaped Version'}${suffix}`;
                    return (
                      <div key={child.id} className="mt-3">
                        <button
                          onClick={() => onViewLesson?.(child)}
                          aria-label={`Open reshaped lesson: ${childShapeFullName}`}
                          className="flex items-center gap-1.5 text-xs text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 underline-offset-2 hover:underline transition-colors cursor-pointer"
                        >
                          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                          View Reshaped ({childShapeName})
                        </button>
                      </div>
                    );
                  });
                })()}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Session B: Previous/Next pagination. Hidden when everything
            fits on one page. aria-disabled keeps buttons focusable at
            boundaries (Rule #22). aria-live announces page changes. */}
        {filteredLessons.length > LESSONS_PER_PAGE && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              aria-disabled={safePage === 0 || undefined}
              aria-label="Previous page"
              className={safePage === 0 ? "opacity-60 cursor-not-allowed" : ""}
            >
              Previous
            </Button>
            <span aria-live="polite" className="text-sm text-muted-foreground">
              Page {safePage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-disabled={safePage >= totalPages - 1 || undefined}
              aria-label="Next page"
              className={safePage >= totalPages - 1 ? "opacity-60 cursor-not-allowed" : ""}
            >
              Next
            </Button>
          </div>
        )}
        </>
      ) : !scopeLoading ? (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            {(() => {
              // SSOT copy (dashboardConfig.ts LESSON_LIBRARY_TEXT). Three zero-
              // result variants: active filters, empty team scope, or a truly
              // empty library.
              const hasFilters =
                searchPassage || searchTitle || ageFilter !== "all" || profileFilter !== "all";
              const copy = hasFilters
                ? LESSON_LIBRARY_TEXT.emptyFiltered
                : scope === "team"
                  ? LESSON_LIBRARY_TEXT.emptyTeam
                  : scope === "shepherd"
                    ? LESSON_LIBRARY_TEXT.emptyShepherd
                    : LESSON_LIBRARY_TEXT.emptyDefault;
              return (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{copy.heading}</h3>
                  <p className="text-muted-foreground max-w-md">{copy.subtext}</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      ) : null}
      <Dialog open={showCreateSeriesModal} onOpenChange={setShowCreateSeriesModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Lesson Series</DialogTitle>
            <DialogDescription>
              Create a series to organize multiple lessons around a unified teaching theme or passage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Series Name</label>
              <Input
                placeholder="e.g. Romans: The Gospel of Grace"
                value={newSeriesName}
                onChange={(e) => setNewSeriesName(e.target.value)}
                maxLength={SERIES_LIMITS.maxSeriesNameLength}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Total Lessons</label>
              <Select
                value={String(newSeriesLessonCount)}
                onValueChange={(v) => setNewSeriesLessonCount(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: SERIES_LIMITS.maxLessons - SERIES_LIMITS.minLessons + 1 },
                    (_, i) => i + SERIES_LIMITS.minLessons,
                  ).map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} lessons</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{"2\u201313 lessons per series"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSeriesModal(false)}>Cancel</Button>
            <Button onClick={handleCreateSeries} disabled={isCreating || !newSeriesName.trim()}>
              {isCreating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create Series
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="feature_teaser"
      />
    </div>
  );
}
