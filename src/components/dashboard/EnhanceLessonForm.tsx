/**
 * EnhanceLessonForm Component
 * Main form for generating Baptist-enhanced Bible study lessons
 *
 * Updated: December 2025
 * - Redesigned with 3-step card layout
 * - Step 1: What Lesson Are You Teaching? (radio selection for content input)
 * - Step 2: Who Are You Teaching? (age group + theology + Bible version)
 * - Step 3: Personalize Your Lesson (TeacherCustomization - collapsible)
 * - Brand colors matching landing page (gold accents, teal buttons/badges)
 * - Bible Version selection with copyright-aware guardrails
 * - Mobile responsiveness fixes (December 4, 2025)
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
import { Sparkles, BookOpen, Loader2, Star, Upload, Type, ArrowLeft } from "lucide-react";
import { useEnhanceLesson } from "@/hooks/useEnhanceLesson";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useTeacherProfiles, TeacherPreferenceProfile } from "@/hooks/useTeacherProfiles";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getTheologyProfileOptions, getDefaultTheologyProfile, getTheologyProfile } from "@/constants/theologyProfiles";
import { AGE_GROUPS, getAgeGroupById } from "@/constants/ageGroups";
import { findMatchingBooks } from "@/constants/bibleBooks";
import { FORM_STYLING } from "@/constants/formConfig";
import { getBibleVersionOptions, getDefaultBibleVersion, getBibleVersion } from "@/constants/bibleVersions";
import { ALLOWED_FILE_TYPES } from "@/lib/fileValidation";
import { TeacherPreferences } from "@/constants/teacherPreferences";
import { TeacherCustomization } from "./TeacherCustomization";
import { LessonExportButtons } from "./LessonExportButtons";
import { FocusApplicationData } from "@/components/org/ActiveFocusBanner";
import { FocusApplicationData } from "@/components/org/ActiveFocusBanner";

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
}

// ============================================================================
// BRAND STYLING COMPONENTS
// ============================================================================

// Gold accent text for headers (matches landing page)
const GoldAccent = ({ children }: { children: React.ReactNode }) => (
  <span className="text-amber-500">{children}</span>
);

// Step badge component (teal pill matching landing page "How It Works")
const StepBadge = ({ number }: { number: number }) => (
  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500 text-white">
    STEP {number}
  </span>
);

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
}: EnhanceLessonFormProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { enhanceLesson, isEnhancing } = useEnhanceLesson();
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
      // Apply passage or theme based on what's provided
      if (initialFocusData.passage) {
        setContentInputType("passage");
        setBiblePassage(initialFocusData.passage);
      } else if (initialFocusData.theme) {
        setContentInputType("topic");
        setFocusedTopic(initialFocusData.theme);
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
    const effectivePassage = contentInputType === "passage" ? biblePassage : "";
    const effectiveTopic = contentInputType === "topic" ? focusedTopic : "";

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
        uploaded_file: curriculumInputMode === "file" ? uploadedFile : null,
        extracted_content: effectiveContent,
      };

      const result = await enhanceLesson(enhancementData);

      if (result) {
        setGeneratedLesson(result);
        if (onLessonGenerated) {
          onLessonGenerated(result);
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
            {/* Page Header - Create Mode - MOBILE FIX: flex-wrap + span wrapper */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <Sparkles className="h-6 w-6 text-sky-500 flex-shrink-0" />
                <span>Create Baptist-Enhanced <GoldAccent>Lesson</GoldAccent></span>
              </h1>
              <p className="text-slate-600 mt-1">
                Generate a theologically-sound Bible study lesson tailored to your class
              </p>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/* CREATION FORM: Only show when NOT viewing a saved lesson */}
        {/* ================================================================ */}
        {!viewingLesson && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ================================================================ */}
          {/* STEP 1: What Lesson Are You Teaching? */}
          {/* ================================================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <StepBadge number={1} />
              </div>
              <CardTitle className="text-lg text-slate-800">
                What <GoldAccent>Lesson</GoldAccent> Are You Teaching?
              </CardTitle>
              <CardDescription>Choose one way to describe your lesson content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    {contentInputType === "passage" && (
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
                    {contentInputType === "topic" && (
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
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* STEP 2: Who Are You Teaching? */}
          {/* ================================================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <StepBadge number={2} />
              </div>
              <CardTitle className="text-lg text-slate-800">
                Who Are You <GoldAccent>Teaching</GoldAccent>?
              </CardTitle>
              <CardDescription>Select your audience, theological tradition, and Bible version</CardDescription>
            </CardHeader>
            <CardContent>
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
              <div className="space-y-2 mt-4">
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
            </CardContent>
          </Card>

          {/* ================================================================ */}
          {/* STEP 3: Personalize Your Lesson (TeacherCustomization) */}
          {/* ================================================================ */}
          <TeacherCustomization
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
                  {lessonsUsed} of {lessonsAllowed} lessons used (24-hour period)
                </span>
              )}
            </div>

            {/* Generate Button */}
            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600"
              size="lg"
              disabled={isSubmitting || isEnhancing || isLimitReached || isExtracting}
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
                  Generate Lesson
                </>
              )}
            </Button>

            {/* Generation Warning */}
            <p className="text-xs text-center text-amber-600">
              ⚠️ Must remain on this page until lesson is fully generated
            </p>
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
          </CardHeader>
          <CardContent>
            {/* Teaser Section */}
            {currentLesson.metadata?.teaser && (
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

            {/* Lesson Content */}
            <div className="prose-sm max-w-none">
              <div
                className="whitespace-pre-wrap text-sm bg-muted p-2.5 rounded-lg overflow-auto max-h-[600px] md:[&::-webkit-scrollbar]:w-4 md:[&::-webkit-scrollbar-track]:bg-gray-200 md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-sky-400 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:border-2 md:[&::-webkit-scrollbar-thumb]:border-gray-200 hover:md:[&::-webkit-scrollbar-thumb]:bg-sky-500"
                style={{ lineHeight: "1.3", scrollbarWidth: "thick", scrollbarColor: "#38bdf8 #e5e7eb" }}
                dangerouslySetInnerHTML={{
                  __html: (currentLesson.original_text || "")
                    .replace(
                      /## (.*?)(?=\n|$)/g,
                      '<h2 class="text-base font-bold mt-2 mb-1">$1</h2>'
                    )
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(
                      /\n---\n/g,
                      '<hr class="my-1.5 border-t border-muted-foreground/20">'
                    )
                    .replace(/\x95/g, "\x95")
                    .replace(/\n\n/g, "<br><br>")
                    .replace(/\n/g, "<br>"),
                }}
              />
            </div>

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
    </>
  );
}

