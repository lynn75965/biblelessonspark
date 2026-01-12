/**
 * EnhanceLessonForm Component
 * Main form for generating Baptist-enhanced Bible study lessons
 *
 * Updated: January 2026
 * - ACCORDION REDESIGN: Steps now collapse/expand for focused user experience
 * - Step 1: Choose Your Scripture (expanded by default for new users)
 * - Step 2: Set Your Teaching Context (unlocks after Step 1 complete)
 * - Step 3: Customize Your Style (unlocks after Step 2 complete)
 * - Welcome banner for first-time users
 * - Watch Video links in each step header
 * - Completion indicators (checkmarks) for finished steps
 * - Brand colors matching landing page (gold accents, teal buttons/badges)
 * - Bible Version selection with copyright-aware guardrails
 * - Mobile responsiveness fixes
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, BookOpen, Loader2, Star, Upload, Type, ArrowLeft, ChevronDown, ChevronRight, Play, Check, Lock, Eye } from "lucide-react";
import { useEnhanceLesson } from "@/hooks/useEnhanceLesson";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { UpgradePromptModal } from "@/components/subscription/UpgradePromptModal";
import { useTeacherProfiles, TeacherPreferenceProfile } from "@/hooks/useTeacherProfiles";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getTheologyProfileOptions, getDefaultTheologyProfile, getTheologyProfile } from "@/constants/theologyProfiles";
import { AGE_GROUPS, getAgeGroupById } from "@/constants/ageGroups";
import { findMatchingBooks } from "@/constants/bibleBooks";
import { FORM_STYLING } from "@/constants/formConfig";
import { getBibleVersionOptions, getDefaultBibleVersion, getBibleVersion } from "@/constants/bibleVersions";
import { ALLOWED_FILE_TYPES } from "@/lib/fileValidation";
import { API_ERROR_CODES } from "@/constants/apiErrorCodes";
import { TeacherPreferences } from "@/constants/teacherPreferences";
import { FREE_TIER_SECTION_NUMBERS, PRICING_DISPLAY } from "@/constants/pricingConfig";
import { getVideo, hasVideoUrl } from "@/constants/helpVideos";
import { TeacherCustomization } from "./TeacherCustomization";
import { LessonExportButtons } from "./LessonExportButtons";
import { FocusApplicationData } from "@/components/org/ActiveFocusBanner";
import { normalizeLegacyContent } from "@/utils/formatLessonContent";

// ============================================================================
// INTERFACES
// ============================================================================

interface EnhanceLessonFormProps {
  onLessonGenerated?: (lesson: any) => void;
  onExport?: () => void;
  onRequestFeedback?: () => void;
  organizationId?: string;
  userPreferredAgeGroup?: string;
  defaultDoctrine?: string;
  viewingLesson?: any;
  onClearViewing?: () => void;
  initialFocusData?: FocusApplicationData;
  lessonCount?: number; // Used to conditionally show welcome banner for new users only
}

// ============================================================================
// BRAND STYLING COMPONENTS
// ============================================================================

// Gold accent text for headers (matches landing page)
const GoldAccent = ({ children }: { children: React.ReactNode }) => (
  <span className="text-amber-500">{children}</span>
);

// Step badge component - prominent teal pill with border
const StepBadge = ({ number, isComplete }: { number: number; isComplete?: boolean }) => (
  <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold shadow-md border-2 ${
    isComplete 
      ? "bg-green-500 text-white border-green-600" 
      : "bg-sky-500 text-white border-sky-600"
  }`}>
    {isComplete ? <Check className="h-4 w-4 mr-1" /> : null}
    STEP {number}
  </span>
);

// ============================================================================
// ACCORDION STEP COMPONENT
// ============================================================================

interface AccordionStepProps {
  stepNumber: number;
  title: React.ReactNode;
  description: string;
  isExpanded: boolean;
  isComplete: boolean;
  isLocked: boolean;
  completeSummary?: string;
  videoUrl?: string;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionStep = ({
  stepNumber,
  title,
  description,
  isExpanded,
  isComplete,
  isLocked,
  completeSummary,
  videoUrl,
  onToggle,
  children,
}: AccordionStepProps) => {
  return (
    <Card className={`border shadow-sm transition-all duration-200 ${isLocked ? "opacity-60" : ""}`}>
      {/* Clickable Header */}
      <CardHeader 
        className={`pb-3 cursor-pointer select-none ${isLocked ? "cursor-not-allowed" : "hover:bg-muted/50"}`}
        onClick={() => !isLocked && onToggle()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Expand/Collapse Icon */}
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <StepBadge number={stepNumber} isComplete={isComplete} />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Watch Video Link */}
            {videoUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(videoUrl, "_blank");
                }}
              >
                <Play className="h-3 w-3" />
                Watch
              </Button>
            )}
            
            {/* Completion/Lock Indicator */}
            {isComplete && !isExpanded && (
              <span className="text-green-600 text-sm font-medium">✓ Done</span>
            )}
            {isLocked && (
              <span className="text-muted-foreground text-sm">🔒</span>
            )}
          </div>
        </div>
        
        <div className="ml-10 mt-2">
          <CardTitle className="text-lg text-slate-800">{title}</CardTitle>
          {/* Show description when collapsed, or summary when complete and collapsed */}
          {!isExpanded && (
            <CardDescription className="mt-1">
              {isComplete && completeSummary ? completeSummary : description}
            </CardDescription>
          )}
          {isExpanded && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        
        {/* Edit button when collapsed and complete */}
        {!isExpanded && isComplete && (
          <div className="ml-10 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              Edit
            </Button>
          </div>
        )}
      </CardHeader>
      
      {/* Expandable Content */}
      {isExpanded && !isLocked && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

// ============================================================================
// HELPERS
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

// Parse lesson content into sections for Full/Free toggle display
interface LessonSection {
  sectionNumber: number;
  title: string;
  content: string;
  isFreeTier: boolean;
}

const parseLessonSections = (content: string, freeSections: number[]): LessonSection[] => {
  if (!content) return [];
  
  const sections: LessonSection[] = [];
  
  // Match section header formats - MUST have "Section" keyword OR "##" prefix
  // This prevents matching numbered questions like "1. Paul says..."
  // Valid: "Section 1: Title" or "## 1. Title" or "## Section 1:" or "**Section 1:**"
  // Invalid: "1. Question text" (no Section keyword or ##)
  const sectionRegex = /(?:^|\n)(?:\*\*)?(?:(?:##\s*)?Section\s*|##\s*)(\d+)[\.\:\-\s]+([^\n\*]+?)(?:\*\*)?(?=\n)/gi;
  
  let match;
  const matches: { index: number; sectionNumber: number; title: string; fullMatch: string }[] = [];
  
  // Find all section headers
  while ((match = sectionRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      sectionNumber: parseInt(match[1], 10),
      title: match[2].trim().replace(/\*+$/, ''), // Remove trailing asterisks
      fullMatch: match[0]
    });
  }
  
  // Extract content for each section
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    const startIndex = currentMatch.index;
    const endIndex = nextMatch ? nextMatch.index : content.length;
    
    const sectionContent = content.slice(startIndex, endIndex).trim();
    
    sections.push({
      sectionNumber: currentMatch.sectionNumber,
      title: currentMatch.title,
      content: sectionContent,
      isFreeTier: freeSections.includes(currentMatch.sectionNumber)
    });
  }
  
  // If no sections found, return the whole content as section 0
  if (sections.length === 0 && content.trim()) {
    sections.push({
      sectionNumber: 0,
      title: "Lesson Content",
      content: content,
      isFreeTier: true
    });
  }
  
  return sections;
};

// Format section content for display (remove header line since we display it separately)
const formatSectionContent = (content: string): string => {
  // First normalize legacy content (## headers → **bold:**, 1. → **1.**)
  const normalized = normalizeLegacyContent(content);
  return normalized
    // Remove section header line in various formats
    .replace(/^(?:\*\*)?(?:##\s*)?(?:Section\s*)?\d+[\.\:\-\s]+[^\n]+\n?/i, '')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n---\n/g, '<hr class="my-1.5 border-t border-muted-foreground/20">')
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>")
    .trim();
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EnhanceLessonForm({
  onLessonGenerated,
  onExport,
  onRequestFeedback,
  organizationId,
  userPreferredAgeGroup,
  defaultDoctrine,
  viewingLesson,
  onClearViewing,
  initialFocusData,
  lessonCount = 0,
}: EnhanceLessonFormProps) {
  // ============================================================================
  // ACCORDION STATE
  // ============================================================================
  
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<1 | 2 | 3>(1);

  // ============================================================================
  // LESSON VIEW MODE TOGGLE (Full vs Free comparison)
  // ============================================================================
  
  const [lessonViewMode, setLessonViewMode] = useState<"full" | "free">("free");

  // Free tier shows only sections 1, 5, 8
  // Free tier sections - imported from SSOT (pricingConfig.ts)
  const FREE_SECTIONS = FREE_TIER_SECTION_NUMBERS;

  // ============================================================================
  // STEP 1: LESSON CONTENT STATE
  // ============================================================================

  const [contentInputType, setContentInputType] = useState<"curriculum" | "passage" | "topic">("passage");
  const [biblePassage, setBiblePassage] = useState("");
  const [showBibleSuggestions, setShowBibleSuggestions] = useState(false);
  const [focusedTopic, setFocusedTopic] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState<string | null>(null);
  const [pastedContent, setPastedContent] = useState<string>("");
  const [curriculumInputMode, setCurriculumInputMode] = useState<"file" | "paste">("file");
  const [isExtracting, setIsExtracting] = useState(false);

  // ============================================================================
  // STEP 2: AUDIENCE STATE
  // ============================================================================

  const [ageGroup, setAgeGroup] = useState("");
  const [theologyProfileId, setTheologyProfileId] = useState(getDefaultTheologyProfile().id);
  const [bibleVersionId, setBibleVersionId] = useState(getDefaultBibleVersion().id);

  // ============================================================================
  // STEP 3: CUSTOMIZATION STATE (13 profile fields)
  // ============================================================================

  const [teachingStyle, setTeachingStyle] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [lessonLength, setLessonLength] = useState("");
  const [classSetting, setClassSetting] = useState("");
  const [learningEnvironment, setLearningEnvironment] = useState("");
  const [studentExperience, setStudentExperience] = useState("");
  const [educationExperience, setEducationExperience] = useState("");
  const [culturalContext, setCulturalContext] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [lessonSequence, setLessonSequence] = useState("");
  const [assessmentStyle, setAssessmentStyle] = useState("");
  const [language, setLanguage] = useState("english");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);

  // Part of Series position (NOT saved in profile)
  const [lessonNumber, setLessonNumber] = useState(1);
  const [totalLessons, setTotalLessons] = useState(3);

  // Currently loaded profile ID
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

  // ============================================================================
  // ADDITIONAL FORM STATE
  // ============================================================================

  const [notes, setNotes] = useState("");
  const [generateTeaser, setGenerateTeaser] = useState(false);
  const [includeLiturgical, setIncludeLiturgical] = useState(false);
  const [includeCultural, setIncludeCultural] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);

  // ============================================================================
  // STEP COMPLETION DETECTION
  // ============================================================================

  const isStep1Complete = (): boolean => {
    if (contentInputType === "curriculum") {
      return (curriculumInputMode === "paste" && pastedContent.trim().length > 0) ||
             (curriculumInputMode === "file" && extractedContent !== null);
    }
    return biblePassage.trim().length > 0 || focusedTopic.trim().length > 0;
  };

  const isStep2Complete = (): boolean => {
    return ageGroup !== "" && theologyProfileId !== "" && bibleVersionId !== "";
  };

  const isStep3Complete = (): boolean => {
    // Step 3 is optional, so we consider it complete if at least lesson length is set
    // or if the user has a profile loaded
    return lessonLength !== "" || currentProfileId !== null;
  };

  // Generate summary text for collapsed steps
  const getStep1Summary = (): string => {
    if (contentInputType === "curriculum") {
      if (curriculumInputMode === "paste" && pastedContent.trim()) {
        return `Pasted content (${pastedContent.length} chars)`;
      }
      if (curriculumInputMode === "file" && extractedContent) {
        return `Uploaded file (${extractedContent.length} chars)`;
      }
    }
    const parts = [];
    if (biblePassage.trim()) parts.push(biblePassage.trim());
    if (focusedTopic.trim()) parts.push(`"${focusedTopic.trim()}"`);
    return parts.join(" • ") || "";
  };

  const getStep2Summary = (): string => {
    const parts = [];
    if (ageGroup) {
      const group = getAgeGroupById(ageGroup);
      parts.push(group?.label || ageGroup);
    }
    if (theologyProfileId) {
      const profile = getTheologyProfile(theologyProfileId);
      parts.push(profile?.shortName || profile?.name || "");
    }
    if (bibleVersionId) {
      const version = getBibleVersion(bibleVersionId);
      parts.push(version?.abbreviation || "");
    }
    return parts.filter(Boolean).join(" • ");
  };

  const getStep3Summary = (): string => {
    const parts = [];
    if (teachingStyle) parts.push(teachingStyle);
    if (learningStyle) parts.push(learningStyle);
    if (lessonLength) parts.push(lessonLength);
    return parts.filter(Boolean).join(" • ") || "Optional customizations";
  };

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { enhanceLesson, isEnhancing } = useEnhanceLesson();
  const {
    tier,
    lessonsUsed: subLessonsUsed,
    lessonsLimit: subLessonsLimit,
    sectionsAllowed,
    canGenerate,
    resetDate,
    checkCanGenerate,
    incrementUsage,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const {
    isLimitReached,
    lessonsUsed,
    lessonsAllowed,
    hoursUntilReset,
    errorMessage: rateLimitError,
    refreshRateLimit,
  } = useRateLimit();
  const { toast } = useToast();

  // Teacher Profiles Hook
  const {
    profiles,
    defaultProfile,
    isLoading: isLoadingProfiles,
    isSaving: isSavingProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    refreshProfiles,
  } = useTeacherProfiles();

  // Generate accept attribute from SSOT constant
  const fileAcceptTypes = ALLOWED_FILE_TYPES.join(",");

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  // Load a profile's preferences into form fields
  const loadProfileIntoForm = useCallback((profile: TeacherPreferenceProfile) => {
    const prefs = profile.preferences;
    setTeachingStyle(prefs.teachingStyle || "");
    setLearningStyle(prefs.learningStyle || "");
    setLessonLength(prefs.lessonLength || "");
    setClassSetting(prefs.groupSize || "");
    setLearningEnvironment(prefs.learningEnvironment || "");
    setStudentExperience(prefs.studentExperience || "");
    setEducationExperience(prefs.educationExperience || "");
    setCulturalContext(prefs.culturalContext || "");
    setSpecialNeeds(prefs.specialNeeds || "");
    setLessonSequence(prefs.lessonSequence || "");
    setAssessmentStyle(prefs.assessmentStyle || "");
    setLanguage(prefs.language || "english");
    setActivityTypes(prefs.activityTypes || []);
    setCurrentProfileId(profile.id);

    // Reset series position when loading profile
    setLessonNumber(1);
    setTotalLessons(3);
  }, []);

  // Auto-load default profile on mount
  useEffect(() => {
    if (defaultProfile && !currentProfileId) {
      loadProfileIntoForm(defaultProfile);
    }
  }, [defaultProfile, currentProfileId, loadProfileIntoForm]);

  // Handle profile load from dropdown
  const handleLoadProfile = useCallback(
    (profile: TeacherPreferenceProfile) => {
      loadProfileIntoForm(profile);
      toast({
        title: "Profile loaded",
        description: `"${profile.profile_name}" preferences applied`,
      });
    },
    [loadProfileIntoForm, toast]
  );

  // Handle save profile
  const handleSaveProfile = useCallback(
    async (name: string, preferences: TeacherPreferences, isDefault: boolean) => {
      const result = await createProfile(name, preferences, isDefault);
      if (result) {
        setCurrentProfileId(result.id);
      }
      return result;
    },
    [createProfile]
  );

  // Handle update profile
  const handleUpdateProfile = useCallback(
    async (id: string, name: string, preferences: TeacherPreferences, isDefault: boolean) => {
      const success = await updateProfile(id, name, preferences, isDefault);
      return success;
    },
    [updateProfile]
  );

  // Handle delete profile
  const handleDeleteProfile = useCallback(
    async (id: string) => {
      const success = await deleteProfile(id);
      if (success && currentProfileId === id) {
        setCurrentProfileId(null);
      }
      return success;
    },
    [deleteProfile, currentProfileId]
  );

  // ============================================================================
  // USER PROFILE FETCH (for default theology)
  // ============================================================================

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("theology_profile_id")
          .eq("id", user.id)
          .single();

        if (profile?.theology_profile_id) {
          setTheologyProfileId(profile.theology_profile_id);
        }
      }
    };

    fetchUserProfile();
  }, []);

  // ============================================================================
  // APPLY FOCUS DATA FROM ORGANIZATION SHARED FOCUS
  // ============================================================================

  useEffect(() => {
    if (initialFocusData) {
      // Apply BOTH passage AND theme if provided
      if (initialFocusData.passage) {
        setContentInputType("passage");
        setBiblePassage(initialFocusData.passage);
      }
      if (initialFocusData.theme) {
        setFocusedTopic(initialFocusData.theme);
        // If no passage, switch to topic mode
        if (!initialFocusData.passage) {
          setContentInputType("topic");
        }
      }

      // Apply Bible version if provided
      if (initialFocusData.bibleVersionId) {
        setBibleVersionId(initialFocusData.bibleVersionId);
      }

      // Apply theology profile if provided
      if (initialFocusData.theologyProfileId) {
        setTheologyProfileId(initialFocusData.theologyProfileId);
      }
    }
  }, [initialFocusData]);

  // ============================================================================
  // PROGRESS TIMER
  // ============================================================================

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting || isEnhancing) {
      setGenerationProgress(0);
      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 99) return 99;
          if (prev >= 96) return prev + 0.3;
          if (prev >= 90) return prev + 0.8;
          return prev + 1.2;
        });
      }, 1000);
    } else {
      setGenerationProgress(0);
    }
    return () => clearInterval(interval);
  }, [isSubmitting, isEnhancing]);

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);
    setExtractedContent(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error("Authentication required");
      }

      const supabaseUrl = "https://hphebzdftpjbiudpfcrs.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/extract-lesson`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`Extraction failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.extractedText) {
        setExtractedContent(result.extractedText);
        toast({
          title: "File processed successfully",
          description: `Extracted ${result.extractedText.length} characters from ${file.name}`,
        });
      } else {
        throw new Error(result.error || "Failed to extract content");
      }
    } catch (error: any) {
      console.error("File extraction error:", error);
      setUploadedFile(null);
      setExtractedContent(null);
      toast({
        title: "File processing failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCurriculumModeChange = (mode: "file" | "paste") => {
    setCurriculumInputMode(mode);
    if (mode === "paste") {
      setUploadedFile(null);
      setExtractedContent(null);
    } else {
      setPastedContent("");
    }
  };

  const getEffectiveContent = (): string | null => {
    if (contentInputType !== "curriculum") return null;
    if (curriculumInputMode === "paste" && pastedContent.trim()) {
      return pastedContent.trim();
    }
    if (curriculumInputMode === "file" && extractedContent) {
      return extractedContent;
    }
    return null;
  };

  const clearCurriculumContent = () => {
    setUploadedFile(null);
    setExtractedContent(null);
    setPastedContent("");
  };

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveContent = getEffectiveContent();
    const effectivePassage = biblePassage;
    const effectiveTopic = focusedTopic;

    if (!effectivePassage && !effectiveTopic && !effectiveContent) {
      toast({
        title: "Missing information",
        description: "Please provide a Bible passage, focused topic, or curriculum content",
        variant: "destructive",
      });
      return;
    }

    if (!ageGroup) {
      toast({
        title: "Missing information",
        description: "Please select an age group",
        variant: "destructive",
      });
      return;
    }

    if (!theologyProfileId) {
      toast({
        title: "Missing information",
        description: "Please select a theology profile",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const enhancementData = {
        bible_passage: effectivePassage,
        focused_topic: effectiveTopic,
        age_group: ageGroup,
        theology_profile_id: theologyProfileId,
        bible_version_id: bibleVersionId,
        additional_notes: notes,
        teaching_style: teachingStyle,
        learning_style: learningStyle,
        lesson_length: lessonLength,
        class_setting: classSetting,
        learning_environment: learningEnvironment,
        student_experience: studentExperience,
        education_experience: educationExperience,
        cultural_context: culturalContext,
        special_needs: specialNeeds,
        lesson_sequence: lessonSequence,
        lesson_number: lessonSequence === "part_of_series" ? lessonNumber : null,
        total_lessons: lessonSequence === "part_of_series" ? totalLessons : null,
        assessment_style: assessmentStyle,
        language: language,
        activity_types: activityTypes,
        generate_teaser: generateTeaser,
        include_liturgical: includeLiturgical,
        include_cultural: includeCultural,
        uploaded_file: curriculumInputMode === "file" ? uploadedFile : null,
        extracted_content: effectiveContent,
      };

      const result = await enhanceLesson(enhancementData);

      // Check for limit reached
      if (result.code === API_ERROR_CODES.LIMIT_REACHED) {
        setShowUpgradeModal(true);
        return;
      }

      if (result.success && result.data) {
        setGeneratedLesson(result.data);
        if (onLessonGenerated) {
          onLessonGenerated(result.data);
        }
        refreshRateLimit();
      }

      setGenerationProgress(100);
      setBiblePassage("");
      setFocusedTopic("");
      setAgeGroup("");
      setNotes("");
      setUploadedFile(null);
      setExtractedContent(null);
      setPastedContent("");
      setGenerateTeaser(false);
      setContentInputType("passage");

      // Reset series position but keep profile loaded
      setLessonNumber(1);
    } catch (error) {
      console.error("Error generating lesson:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const currentLesson = viewingLesson || generatedLesson?.lesson;
  const displayTitle = currentLesson
    ? extractLessonTitle(currentLesson.original_text) || currentLesson.title || "Generated Lesson"
    : "Generated Lesson";

  // Step completion states
  const step1Complete = isStep1Complete();
  const step2Complete = isStep2Complete();
  const step3Complete = isStep3Complete();

  return (
    <>
      {/* Main Form Container */}
      <div className="w-full space-y-4">
        {/* ================================================================ */}
        {/* VIEWER MODE: When viewing a saved lesson from Library */}
        {/* ================================================================ */}
        {viewingLesson ? (
          <>
            {/* Viewer Header - MOBILE FIX: flex-wrap + flex-shrink-0 on icon */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => onClearViewing?.()}
                className="mb-4 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Lesson Library
              </Button>
              <h1 className="text-2xl font-bold text-slate-800 flex flex-wrap items-center gap-x-2 gap-y-1">
                <BookOpen className="h-6 w-6 text-sky-500 flex-shrink-0" />
                <span className="break-words">{displayTitle}</span>
              </h1>
              <p className="text-slate-600 mt-1">
                Viewing saved lesson from your library
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Welcome Banner for NEW Users Only (0 lessons) */}
            {lessonCount === 0 && !step1Complete && !step2Complete && (
              <div className="bg-gradient-to-r from-sky-50 to-amber-50 border border-sky-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <h3 className="font-semibold text-slate-800">Welcome! Create your first lesson in 3 simple steps.</h3>
                    <p className="text-sm text-slate-600 mt-1">Estimated time: 3 minutes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Returning User Tip (optional - shows occasionally for users with lessons) */}
            {lessonCount > 0 && lessonCount % 5 === 0 && !step1Complete && (
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-sky-700">
                  💡 <strong>Tip:</strong> Try exploring a different book of the Bible or a passage you haven't taught before!
                </p>
              </div>
            )}
          </>
        )}

        {/* ================================================================ */}
        {/* CREATION FORM: Only show when NOT viewing a saved lesson */}
        {/* ================================================================ */}
        {!viewingLesson && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ================================================================ */}
          {/* STEP 1: Choose Your Scripture (Accordion) */}
          {/* ================================================================ */}
          <AccordionStep
            stepNumber={1}
            title={<>Choose Your <GoldAccent>Scripture</GoldAccent></>}
            description="Enter a Bible passage or paste content from your existing curriculum. This becomes the foundation of your lesson."
            isExpanded={expandedStep === 1}
            isComplete={step1Complete}
            isLocked={false}
            completeSummary={getStep1Summary()}
            videoUrl={getVideo('step1')?.url || undefined}
            onToggle={() => setExpandedStep(1)}
          >
            <div className="space-y-4">
              {/* Radio selection for content type */}
              <RadioGroup
                value={contentInputType}
                onValueChange={(value) =>
                  setContentInputType(value as "curriculum" | "passage" | "topic")
                }
                className="space-y-3"
                disabled={isSubmitting || isExtracting}
              >
                {/* Option 1: Upload/Paste Curriculum */}
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="curriculum" id="content-curriculum" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="content-curriculum" className="font-medium cursor-pointer">
                      Upload or paste existing curriculum
                    </Label>
                    {contentInputType === "curriculum" && (
                      <div className="mt-3 pl-0 space-y-3">
                        {/* Toggle between file upload and paste */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={curriculumInputMode === "file" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCurriculumModeChange("file")}
                            disabled={isSubmitting || isExtracting}
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload File
                          </Button>
                          <Button
                            type="button"
                            variant={curriculumInputMode === "paste" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCurriculumModeChange("paste")}
                            disabled={isSubmitting || isExtracting}
                            className="flex items-center gap-2"
                          >
                            <Type className="h-4 w-4" />
                            Paste Text
                          </Button>
                        </div>

                        {/* File Upload Mode - MOBILE FIX: flex-col on mobile */}
                        {curriculumInputMode === "file" && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Supports PDF, TXT, JPG, JPEG, PNG (&lt;10MB). For Word docs, save as
                              PDF first.
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <Input
                                type="file"
                                accept={fileAcceptTypes}
                                onChange={handleFileChange}
                                disabled={isSubmitting || isExtracting}
                                className="cursor-pointer flex-1 min-w-0"
                              />
                              {uploadedFile && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={clearCurriculumContent}
                                  disabled={isSubmitting || isExtracting}
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                            {/* MOBILE FIX: break-words on extraction message */}
                            {isExtracting && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                                <span className="break-words">Extracting content (may take 60-90 seconds for PDFs)...</span>
                              </div>
                            )}
                            {extractedContent && (
                              <div className="text-sm text-green-600">
                                ✓ File content extracted ({extractedContent.length} characters)
                              </div>
                            )}
                          </div>
                        )}

                        {/* Paste Text Mode */}
                        {curriculumInputMode === "paste" && (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Paste your existing lesson content here..."
                              value={pastedContent}
                              onChange={(e) => setPastedContent(e.target.value)}
                              disabled={isSubmitting}
                              rows={5}
                              className="font-mono text-sm"
                            />
                            {/* MOBILE FIX: flex-wrap on pasted content row */}
                            {pastedContent.trim() && (
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm text-green-600">
                                  ✓ {pastedContent.length} characters entered
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPastedContent("")}
                                  disabled={isSubmitting}
                                >
                                  Clear
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 2: Bible Passage */}
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="passage" id="content-passage" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="content-passage" className="font-medium cursor-pointer">
                      Start from a Bible passage
                    </Label>
                    {(contentInputType === "passage" || contentInputType === "topic") && (
                      <div className="mt-2 relative">
                        <Input
                          className={FORM_STYLING.biblePassageInput}
                          placeholder="e.g., John 3:16-21"
                          value={biblePassage}
                          onChange={(e) => {
                            setBiblePassage(e.target.value);
                            setShowBibleSuggestions(e.target.value.length >= FORM_STYLING.autocompleteMinChars);
                          }}
                          onFocus={() => setShowBibleSuggestions(biblePassage.length >= FORM_STYLING.autocompleteMinChars)}
                          onBlur={() => setTimeout(() => setShowBibleSuggestions(false), 150)}
                          disabled={isSubmitting}
                          autoComplete="off"
                        />
                        {showBibleSuggestions && findMatchingBooks(biblePassage, 5, FORM_STYLING.autocompleteMinChars).length > 0 && (
                          <div className={FORM_STYLING.autocompleteDropdown}>
                            {findMatchingBooks(biblePassage, 5, FORM_STYLING.autocompleteMinChars).map((book) => (
                              <div
                                key={book}
                                className={FORM_STYLING.autocompleteItem}
                                onMouseDown={() => {
                                  setBiblePassage(book + " ");
                                  setShowBibleSuggestions(false);
                                }}
                              >
                                {book}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 3: Topic/Theme */}
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="topic" id="content-topic" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="content-topic" className="font-medium cursor-pointer">
                      Start from a topic or theme
                    </Label>
                    {(contentInputType === "passage" || contentInputType === "topic") && (
                      <div className="mt-2">
                        <Input
                          placeholder="e.g., 'Salvation through Faith' or 'God's Grace'"
                          value={focusedTopic}
                          onChange={(e) => setFocusedTopic(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </RadioGroup>

              {/* Continue Button */}
              {step1Complete && (
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => setExpandedStep(2)}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    Continue to Step 2 →
                  </Button>
                </div>
              )}
            </div>
          </AccordionStep>

          {/* ================================================================ */}
          {/* STEP 2: Set Your Teaching Context (Accordion) */}
          {/* ================================================================ */}
          <AccordionStep
            stepNumber={2}
            title={<>Set Your <GoldAccent>Teaching Context</GoldAccent></>}
            description="Tell us about your class — age group, theology profile, and Bible version. We'll tailor the lesson to fit."
            isExpanded={expandedStep === 2}
            isComplete={step2Complete}
            isLocked={!step1Complete}
            completeSummary={getStep2Summary()}
            videoUrl={getVideo('step2')?.url || undefined}
            onToggle={() => step1Complete && setExpandedStep(2)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age Group */}
                <div className="space-y-2">
                  <Label htmlFor="age-group">
                    Age Group <span className="text-red-500">*</span>
                  </Label>
                  <Select value={ageGroup} onValueChange={setAgeGroup} disabled={isSubmitting}>
                    <SelectTrigger id="age-group">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_GROUPS.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Age Group Description - helps user understand their selection */}
                  {ageGroup && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1 p-2 bg-muted/50 rounded-md">
                      {getAgeGroupById(ageGroup)?.description}
                    </p>
                  )}
                </div>

                {/* Theology Profile */}
                <div className="space-y-2">
                  <Label htmlFor="theology-profile">
                    Baptist Theology Profile <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={theologyProfileId}
                    onValueChange={setTheologyProfileId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="theology-profile">
                      <SelectValue placeholder="Select theology profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTheologyProfileOptions().map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Profile Summary - helps user understand their selection */}
                  {theologyProfileId && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1 p-2 bg-muted/50 rounded-md">
                      {getTheologyProfile(theologyProfileId)?.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Bible Version - Full width below the 2-column grid */}
              <div className="space-y-2">
                <Label htmlFor="bible-version">
                  Bible Version <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={bibleVersionId}
                  onValueChange={setBibleVersionId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="bible-version">
                    <SelectValue placeholder="Select Bible version" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBibleVersionOptions().map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.name} ({version.abbreviation})
                        {version.copyrightStatus === 'public_domain' && (
                          <span className="ml-2 text-xs text-green-600">• Direct quotes</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Version Description - helps user understand copyright implications */}
                {bibleVersionId && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1 p-2 bg-muted/50 rounded-md">
                    {getBibleVersion(bibleVersionId)?.description}
                  </p>
                )}
              </div>

              {/* Continue Button */}
              {step2Complete && (
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => setExpandedStep(3)}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    Continue to Step 3 →
                  </Button>
                </div>
              )}
            </div>
          </AccordionStep>

          {/* ================================================================ */}
          {/* STEP 3: Customize Your Style */}
          {/* Note: TeacherCustomization has its own collapsible header, so we */}
          {/* only show/hide it based on step completion, not wrap in accordion */}
          {/* ================================================================ */}
          {step1Complete && step2Complete && (
            <TeacherCustomization
              isExpanded={expandedStep === 3}
              onToggleExpand={() => setExpandedStep(expandedStep === 3 ? 2 : 3)}
              teachingStyle={teachingStyle}
              setTeachingStyle={setTeachingStyle}
              learningStyle={learningStyle}
              setLearningStyle={setLearningStyle}
              lessonLength={lessonLength}
              setLessonLength={setLessonLength}
              classSetting={classSetting}
              setClassSetting={setClassSetting}
              learningEnvironment={learningEnvironment}
              setLearningEnvironment={setLearningEnvironment}
              studentExperience={studentExperience}
              setStudentExperience={setStudentExperience}
              educationExperience={educationExperience}
              setEducationExperience={setEducationExperience}
              culturalContext={culturalContext}
              setCulturalContext={setCulturalContext}
              specialNeeds={specialNeeds}
              setSpecialNeeds={setSpecialNeeds}
              lessonSequence={lessonSequence}
              setLessonSequence={setLessonSequence}
              assessmentStyle={assessmentStyle}
              setAssessmentStyle={setAssessmentStyle}
              language={language}
              setLanguage={setLanguage}
              activityTypes={activityTypes}
              setActivityTypes={setActivityTypes}
              lessonNumber={lessonNumber}
              setLessonNumber={setLessonNumber}
              totalLessons={totalLessons}
              setTotalLessons={setTotalLessons}
              profiles={profiles}
              currentProfileId={currentProfileId}
              onSaveProfile={handleSaveProfile}
              onUpdateProfile={handleUpdateProfile}
              onLoadProfile={handleLoadProfile}
              onClearProfile={() => setCurrentProfileId(null)}
              onDeleteProfile={handleDeleteProfile}
              isSavingProfile={isSavingProfile}
              disabled={isSubmitting}
            />
          )}
          
          {/* Locked Step 3 placeholder when prerequisites not met */}
          {(!step1Complete || !step2Complete) && (
            <Card className="border shadow-sm opacity-60">
              <CardHeader className="pb-3 cursor-not-allowed">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    <StepBadge number={3} />
                  </div>
                  <span className="text-muted-foreground text-sm">🔒</span>
                </div>
                <div className="ml-10 mt-2">
                  <CardTitle className="text-lg text-slate-800">
                    Customize Your <GoldAccent>Style</GoldAccent>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Fine-tune how the lesson matches your teaching personality and your students' learning preferences.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* ================================================================ */}
          {/* ADDITIONAL OPTIONS (Notes + Teaser) */}
          {/* ================================================================ */}
          <Card className="border shadow-sm">
            <CardContent className="pt-6 space-y-4">
              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <p className="text-sm text-muted-foreground">
                  Add specific requests — describe your focus or primary thought
                </p>
                <Textarea
                  id="notes"
                  placeholder="Any specific focus areas, cultural context, or teaching preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              {/* Generate Lesson Teaser */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="generate-teaser"
                  checked={generateTeaser}
                  onCheckedChange={(checked) => setGenerateTeaser(checked as boolean)}
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="generate-teaser"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Generate Lesson Teaser
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Build anticipation before you teach (perfect for emails, texts, or social media)
                  </p>
                </div>
              </div>

              {/* Seasonal Theme Options - Hidden for now
              <div className="pt-3 border-t space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Optional Seasonal Themes
                </p>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="include-liturgical"
                    checked={includeLiturgical}
                    onCheckedChange={(checked) => setIncludeLiturgical(checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor="include-liturgical"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Include Liturgical Calendar Themes
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Weave themes from the Christian calendar (Advent, Lent, Easter, Pentecost) when seasonally appropriate
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="include-cultural"
                    checked={includeCultural}
                    onCheckedChange={(checked) => setIncludeCultural(checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor="include-cultural"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Include Cultural Season Themes
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Connect lessons to cultural occasions (Mother's Day, Father's Day, Thanksgiving, Back to School) when timely
                    </p>
                  </div>
                </div>
              </div>
              */}
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* SUBMIT SECTION */}
          {/* ================================================================ */}
          <div className="space-y-3">
            {/* Mobile Warning - Only visible on small screens */}
            <div className="block sm:hidden p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 text-center">
                <span className="font-semibold">📱 Mobile users:</span> Keep your screen on during generation (60-90 seconds). For best results, use desktop.
              </p>
            </div>

            {/* Rate Limit Indicator */}
            <div
              className={`text-sm text-center p-2 rounded-lg ${
                isLimitReached ? "bg-destructive/10 text-destructive" : "bg-muted"
              }`}
            >
              {isLimitReached ? (
                <span>
                  Limit reached — resets in {hoursUntilReset} hour
                  {hoursUntilReset === 1 ? "" : "s"}
                </span>
              ) : (
                <span>
                  {subLessonsUsed} of {subLessonsLimit} lessons used this month
                </span>
              )}
            </div>

            {/* Generate Button */}
            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600"
              size="lg"
              disabled={isSubmitting || isEnhancing || isLimitReached || isExtracting || !step1Complete || !step2Complete}
            >
              {isSubmitting || isEnhancing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Lesson... {Math.round(generationProgress)}%</span>
                </div>
              ) : isExtracting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting file content...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate My Lesson
                </>
              )}
            </Button>

            {/* Generation Warning */}
            <p className="text-xs text-center text-amber-600">
              Warning: Must remain on this page until lesson is fully generated
            </p>

            {/* Readiness indicator */}
            {(!step1Complete || !step2Complete) && (
              <p className="text-xs text-center text-muted-foreground">
                Complete Steps 1 and 2 to generate your lesson
              </p>
            )}
          </div>
        </form>
        )}
      </div>

      {/* ================================================================ */}
      {/* GENERATED LESSON DISPLAY */}
      {/* ================================================================ */}
      {currentLesson && (
        <Card className={viewingLesson ? "" : "mt-6"}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex flex-wrap items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-500 flex-shrink-0" />
                <span className="break-words">{displayTitle}</span>
              </CardTitle>
              {/* MOBILE FIX: flex-wrap on button container */}
              <div className="flex flex-wrap items-center gap-2">
                {onRequestFeedback && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRequestFeedback}
                    className="gap-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                  >
                    <Star className="h-4 w-4 fill-yellow-400" />
                    Rate This Lesson
                  </Button>
                )}
                <LessonExportButtons
                  onExport={onExport}
                  lesson={{
                    title: currentLesson.title || "Generated Lesson",
                    original_text: currentLesson.original_text || "",
                    metadata: currentLesson.metadata,
                  }}
                />
                <Button
                  variant={viewingLesson ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (viewingLesson && onClearViewing) {
                      onClearViewing();
                    } else {
                      setGeneratedLesson(null);
                    }
                  }}
                  className={viewingLesson ? "gap-2" : ""}
                >
                  {viewingLesson ? (
                    <>
                      <ArrowLeft className="h-4 w-4" />
                      Back to Library
                    </>
                  ) : (
                    "Close"
                  )}
                </Button>
              </div>
            </div>

            {/* ============================================================ */}
            {/* FULL LESSON / FREE LESSON TOGGLE */}
            {/* ============================================================ */}
            <div className="mt-4 p-3 bg-gradient-to-r from-sky-50 to-amber-50 border border-sky-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-sky-600" />
                  <span className="text-sm font-medium text-slate-700">Preview Mode:</span>
                </div>
                <div className="flex rounded-lg border border-sky-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLessonViewMode("full")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      lessonViewMode === "full"
                        ? "bg-sky-500 text-white"
                        : "bg-white text-slate-600 hover:bg-sky-50"
                    }`}
                  >
                    Full Lesson (8 sections)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonViewMode("free")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      lessonViewMode === "free"
                        ? "bg-amber-500 text-white"
                        : "bg-white text-slate-600 hover:bg-amber-50"
                    }`}
                  >
                    What Free Looks Like
                  </button>
                </div>
              </div>
              {lessonViewMode === "free" && (
                <p className="text-xs text-amber-700 mt-2">
                  Showing sections 1, 5, and 8 only — this is what free accounts receive after complimentary lessons expire.
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Teaser Section - Only show in Full mode */}
            {currentLesson.metadata?.teaser && lessonViewMode === "full" && (
              <div className="mb-3 p-2.5 bg-sky-50 border border-sky-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-sky-500" />
                  <h3 className="font-semibold text-sky-700 text-sm">
                    Student Teaser (Pre-Lesson)
                  </h3>
                </div>
                <p className="text-sm italic leading-tight">{currentLesson.metadata.teaser}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share with students via text, email, or social media before class.
                </p>
              </div>
            )}

            {/* Teaser - Locked indicator in Free mode */}
            {currentLesson.metadata?.teaser && lessonViewMode === "free" && (
              <div className="mb-3 p-2.5 bg-slate-100 border border-slate-300 rounded-lg opacity-60">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-500">
                    Student Teaser — Premium Feature
                  </span>
                </div>
              </div>
            )}

            {/* Lesson Content - Section by Section */}
            <div className="prose-sm max-w-none space-y-3">
              {(() => {
                const sections = parseLessonSections(currentLesson.original_text || "", FREE_SECTIONS);
                
                // If no structured sections found, show original content
                if (sections.length === 1 && sections[0].sectionNumber === 0) {
                  return (
                    <div
                      className="whitespace-pre-wrap text-sm bg-muted p-2.5 rounded-lg overflow-auto max-h-[600px]"
                      style={{ lineHeight: "1.3" }}
                      dangerouslySetInnerHTML={{
                        __html: normalizeLegacyContent(currentLesson.original_text || "")
                          .replace(/## (.*?)(?=\n|$)/g, '<h2 class="text-base font-bold mt-2 mb-1">$1</h2>')
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n---\n/g, '<hr class="my-1.5 border-t border-muted-foreground/20">')
                          .replace(/\n\n/g, "<br><br>")
                          .replace(/\n/g, "<br>"),
                      }}
                    />
                  );
                }

                // Render sections with toggle logic
                return sections.map((section) => {
                  const isVisible = lessonViewMode === "full" || section.isFreeTier;
                  
                  if (isVisible) {
                    // Show full section
                    return (
                      <div
                        key={section.sectionNumber}
                        className="bg-muted p-3 rounded-lg"
                      >
                        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold">
                            {section.sectionNumber}
                          </span>
                          {section.title}
                          {section.isFreeTier && lessonViewMode === "free" && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ Included in Free
                            </span>
                          )}
                        </h3>
                        <div
                          className="whitespace-pre-wrap text-sm overflow-auto"
                          style={{ lineHeight: "1.4" }}
                          dangerouslySetInnerHTML={{
                            __html: formatSectionContent(section.content),
                          }}
                        />
                      </div>
                    );
                  } else {
                    // Show locked/collapsed section
                    return (
                      <div
                        key={section.sectionNumber}
                        className="bg-slate-50 border border-slate-200 p-4 rounded-lg"
                      >
                        <h3 className="text-base font-medium text-slate-500 flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400 text-white text-xs font-bold">
                            {section.sectionNumber}
                          </span>
                          <Lock className="h-4 w-4 text-slate-400" />
                          {section.title}
                        </h3>
                        <p className="text-sm text-slate-500 mb-2">
                          This section includes valuable teaching content to deepen your lesson.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(ROUTES.PRICING)}
                          className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline"
                        >
                          ? See what the full lesson includes
                        </button>
                      </div>
                    );
                  }
                });
              })()}
            </div>

            {/* Upgrade CTA - Only show in Free mode */}
            {lessonViewMode === "free" && (
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-sky-50 border border-amber-200 rounded-lg">
                <div className="text-center">
                  <h4 className="font-semibold text-slate-800 mb-2">
                    This is what free accounts receive after your {PRICING_DISPLAY.free.complimentaryFullLessons} complimentary lessons.
                  </h4>
                  <p className="text-sm text-slate-600 mb-4">
                    You'll still get the overview, teaching script, and student handout—but you'll miss the theological deep-dive, activities, and discussion questions that make lessons complete.
                  </p>
                  <Button 
                    type="button"
                    onClick={() => navigate(ROUTES.PRICING)}
                    className="bg-amber-500 hover:bg-amber-600 text-white">
                    {PRICING_DISPLAY.personal.upgradeButton} — {PRICING_DISPLAY.personal.ctaFull}
                  </Button>
                </div>
              </div>
            )}

            {/* Export buttons at bottom */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pt-4 border-t">
              <span className="text-sm text-muted-foreground mr-2">Export:</span>
              <LessonExportButtons
                onExport={onExport}
                lesson={{
                  title: currentLesson.title || "Generated Lesson",
                  original_text: currentLesson.original_text || "",
                  metadata: currentLesson.metadata,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="limit_reached"
      />
    </>
  );
}
