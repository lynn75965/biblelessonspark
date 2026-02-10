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
 * - 🔒 Private = only the creator can see it
 * - 👁 Shared = creator + Org Manager + linked Teaching Team
 * 
 * Phase 27: Teaching Team Lessons (February 2026)
 * - "My Lessons" / "Team Lessons" scope toggle (visible only when user has a team)
 * - Team Lessons shows shared lessons from all team members (read-only)
 * - Author name displayed on team lesson cards
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findMatchingBooks } from "@/constants/bibleBooks";
import { FORM_STYLING } from "@/constants/formConfig";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2, Search, BookOpen, Users, Sparkles, Lock, Share2, User } from "lucide-react";
import { useLessons } from "@/hooks/useLessons";
import { useTeachingTeam } from "@/hooks/useTeachingTeam";
import { Lesson } from "@/constants/contracts";
import { AGE_GROUPS } from "@/constants/ageGroups";
import { getTheologyProfile, getTheologyProfileOptions, getDefaultTheologyProfile } from "@/constants/theologyProfiles";

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
  /** Phase 27: display name of the lesson author (for team lessons) */
  authorName?: string;
}

// ============================================================================
// SSOT-DERIVED BADGE COLORS
// Colors keyed by profile ID - fully SSOT compliant, order-independent
// ============================================================================

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

const THEOLOGY_BADGE_COLOR_MAP: Record<string, string> = {
  "baptist-core-beliefs": "bg-amber-100 text-amber-800 border-amber-200",
  "southern-baptist-bfm-1963": "bg-primary-light text-primary border-primary/20",
  "southern-baptist-bfm-2000": "bg-primary-light text-primary border-primary/20",
  "national-baptist-convention": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "independent-baptist": "bg-blue-100 text-blue-800 border-accent/50",
  "missionary-baptist": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "general-baptist": "bg-teal-100 text-teal-800 border-teal-200",
  "free-will-baptist": "bg-violet-100 text-violet-800 border-violet-200",
  "primitive-baptist": "bg-rose-100 text-rose-800 border-rose-200",
  "reformed-baptist": "bg-secondary-light text-secondary border-secondary/20",
};

const DEFAULT_BADGE_COLOR = "bg-muted text-foreground border-border";

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
  options?: { isTeamLesson?: boolean; authorName?: string }
): LessonDisplay => {
  const filters = lesson.filters as Record<string, any> | null;
  const aiGeneratedTitle = extractLessonTitle(lesson.original_text || "");
  const aiGeneratedScripture = extractPrimaryScripture(lesson.original_text || "");
  const userInputPassage = filters?.bible_passage || null;
  const userInputTopic = filters?.focused_topic || null;

  return {
    ...lesson,
    ai_lesson_title: aiGeneratedTitle,
    bible_passage: userInputPassage || aiGeneratedScripture,
    focused_topic: userInputTopic,
    passage_or_topic: lesson.title || filters?.passageOrTopic || "Untitled Lesson",
    age_group: filters?.age_group || AGE_GROUPS[AGE_GROUPS.length - 1].id,
    theology_profile_id: filters?.theology_profile_id || getDefaultTheologyProfile().id,
    bible_version_id: filters?.bible_version_id || "kjv",
    created_by_name: options?.authorName || "Teacher",
    has_content: !!lesson.original_text,
    updated_at: lesson.created_at,
    isTeamLesson: options?.isTeamLesson || false,
    authorName: options?.authorName || undefined,
  };
};

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
  const [scope, setScope] = useState<"my" | "team">("my");
  const [teamLessons, setTeamLessons] = useState<LessonDisplay[]>([]);
  const [teamLessonsLoading, setTeamLessonsLoading] = useState(false);

  const { lessons, loading, deleteLesson, updateLessonVisibility } = useLessons();
  const { hasTeam, team, members, fetchTeamLessons } = useTeachingTeam();

  // Transform user's own lessons for display
  const displayLessons: LessonDisplay[] = lessons.map((lesson) =>
    transformToDisplay(lesson, { isTeamLesson: false })
  );

  // Phase 27: Fetch team lessons when scope switches to "team"
  useEffect(() => {
    if (scope === "team" && hasTeam) {
      loadTeamLessons();
    }
  }, [scope, hasTeam]);

  const loadTeamLessons = async () => {
    setTeamLessonsLoading(true);
    try {
      const { data, error } = await fetchTeamLessons();
      if (error) {
        console.error("Error loading team lessons:", error);
        setTeamLessons([]);
        return;
      }

      // Build a map of user_id → display_name from team members + lead
      const nameMap: Record<string, string> = {};
      if (team) {
        // Lead teacher name — look up from members or use team info
        // For members, we have display_name in the enriched data
        members.forEach((m) => {
          if (m.display_name) nameMap[m.user_id] = m.display_name;
          else if (m.email) nameMap[m.user_id] = m.email;
        });
      }

      const transformed = (data || []).map((lesson: any) =>
        transformToDisplay(lesson, {
          isTeamLesson: true,
          authorName: nameMap[lesson.user_id] || "Team Member",
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

  // Choose which lessons to display based on scope
  const activeLessons = scope === "team" ? teamLessons : displayLessons;

  // Filter lessons
  const filteredLessons = activeLessons.filter((lesson) => {
    const matchesPassage = !searchPassage || lesson.bible_passage?.toLowerCase().includes(searchPassage.toLowerCase());
    const matchesTitle = !searchTitle || lesson.ai_lesson_title?.toLowerCase().includes(searchTitle.toLowerCase());
    const matchesAge = ageFilter === "all" || lesson.age_group === ageFilter;
    const matchesProfile = profileFilter === "all" || lesson.theology_profile_id === profileFilter;
    return matchesPassage && matchesTitle && matchesAge && matchesProfile;
  });

  const getAgeGroupBadgeColor = (ageGroup: string): string => {
    return AGE_GROUP_BADGE_COLOR_MAP[ageGroup] || DEFAULT_BADGE_COLOR;
  };

  const getProfileBadgeColor = (profileId: string): string => {
    return THEOLOGY_BADGE_COLOR_MAP[profileId] || DEFAULT_BADGE_COLOR;
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

  const handleDelete = async (lessonId: string) => {
    if (window.confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      await deleteLesson(lessonId);
    }
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
      context: "lessonspark",
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
                {scope === "team" ? `${team?.name || "Team"} Lessons` : "My Lesson Library"}
              </CardTitle>
              <CardDescription>
                {scope === "team"
                  ? "Shared lessons from your teaching team members"
                  : "Browse and manage your Baptist Bible study lessons"}
              </CardDescription>
            </div>

            {/* Phase 27: Scope Toggle — only visible when user has a team */}
            {hasTeam && (
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
                <Button
                  variant={scope === "team" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setScope("team")}
                  className={`text-xs px-3 ${scope === "team" ? "" : "text-muted-foreground"}`}
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Team Lessons
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

      {/* Team Lessons Loading State */}
      {scope === "team" && teamLessonsLoading && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Lessons Grid */}
      {!(scope === "team" && teamLessonsLoading) && filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {lesson.ai_lesson_title || lesson.title || lesson.passage_or_topic}
                    </CardTitle>
                    {lesson.bible_passage && (
                      <CardDescription className="text-xs sm:text-sm line-clamp-1">
                        Bible Passage: {lesson.bible_passage}
                      </CardDescription>
                    )}
                    {!lesson.bible_passage && lesson.focused_topic && (
                      <CardDescription className="text-xs sm:text-sm line-clamp-1">
                        Theme: {lesson.focused_topic}
                      </CardDescription>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                  <Badge className={`${getAgeGroupBadgeColor(lesson.age_group)} text-xs`} variant="secondary">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="hidden sm:inline">{lesson.age_group}</span>
                    <span className="sm:hidden">{getAgeGroupShortLabel(lesson.age_group)}</span>
                  </Badge>
                  <Badge className={getProfileBadgeColor(lesson.theology_profile_id)} variant="secondary">
                    {getProfileDisplayName(lesson.theology_profile_id)}
                  </Badge>
                  {/* Visibility Badge (Phase 26) — only on user's own lessons */}
                  {!lesson.isTeamLesson && (
                    <Badge
                      variant="outline"
                      className={
                        lesson.visibility === 'shared'
                          ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                          : "text-muted-foreground border-border bg-muted/50"
                      }
                    >
                      {lesson.visibility === 'shared' ? (
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
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Created {formatDate(lesson.created_at)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button data-tour="library-view-button" onClick={() => onViewLesson?.(lesson)} className="flex-1" size="sm">
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                  {/* Visibility Toggle (Phase 26) — only on user's own lessons */}
                  {!lesson.isTeamLesson && (
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
                        <Share2 className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  {/* Devotional button — only on user's own lessons with content */}
                  {!lesson.isTeamLesson && lesson.has_content && (
                    <Button
                      onClick={() => handleGenerateDevotional(lesson)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                      title="Generate a devotional from this lesson"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {/* Delete — only on user's own lessons */}
                  {!lesson.isTeamLesson && (
                    <Button
                      onClick={() => handleDelete(lesson.id)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !(scope === "team" && teamLessonsLoading) ? (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {searchPassage || searchTitle || ageFilter !== "all" || profileFilter !== "all"
                  ? "No lessons match your filters"
                  : scope === "team"
                    ? "No shared lessons from your team"
                    : "No lessons yet"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchPassage || searchTitle || ageFilter !== "all" || profileFilter !== "all"
                  ? "Try adjusting your search terms or filters to find the lessons you're looking for."
                  : scope === "team"
                    ? "When your team members share lessons, they will appear here."
                    : "Create your first Baptist-enhanced Bible study lesson to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
