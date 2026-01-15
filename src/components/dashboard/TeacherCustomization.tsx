/**
 * TeacherCustomization Component
 * Renders the 13 teacher preference fields with profile management
 *
 * Architecture: Imports all options from SSOT (teacherPreferences.ts)
 * Features:
 *   - Step badge styling matching landing page brand
 *   - Smart Collapse: Expanded if user has profiles, collapsed for new users
 *   - Profile dropdown to load saved profiles
 *   - Save This Profile button with modal
 *   - Part of Series: Shows Lesson X of Y inputs (appears LAST in grid)
 *
 * Updated: December 2025
 *   - Gold accent on header text
 *   - Teal step badge
 *   - Lesson Sequence moved to last position
 *   - Mobile responsiveness fixes (December 4, 2025)
 */

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Info, Save, Trash2, Loader2, Play } from "lucide-react";
import { FORM_STYLING } from "@/constants/formConfig";
import { getVideo } from "@/constants/helpVideos";

// SSOT Imports
import {
  TEACHING_STYLES,
  LEARNING_STYLES,
  LESSON_LENGTHS,
  GROUP_SIZES,
  LEARNING_ENVIRONMENTS,
  STUDENT_EXPERIENCE_LEVELS,
  EDUCATION_EXPERIENCES,
  CULTURAL_CONTEXTS,
  SPECIAL_NEEDS_OPTIONS,
  LESSON_SEQUENCE_OPTIONS,
  ASSESSMENT_STYLES,
  LANGUAGE_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  TeacherPreferences,
} from "@/constants/teacherPreferences";

import { TeacherPreferenceProfile } from "@/hooks/useTeacherProfiles";
import { UI_SYMBOLS, formatNoneOption } from "@/constants/uiSymbols";

// ============================================================================
// BRAND STYLING COMPONENTS
// ============================================================================

// Gold accent text for headers (matches landing page)
const GoldAccent = ({ children }: { children: React.ReactNode }) => (
  <span className="text-amber-500">{children}</span>
);

// Step badge component (teal pill matching landing page "How It Works")
const StepBadge = ({ number }: { number: number }) => (
  <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold bg-accent text-white shadow-md border-2 border-accent">
    STEP {number}
  </span>
);

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface TeacherCustomizationProps {
  // SSOT: Expansion controlled by parent (EnhanceLessonForm)
  isExpanded: boolean;
  onToggleExpand: () => void;
  // Field values and setters (13 profile fields)
  teachingStyle: string;
  setTeachingStyle: (value: string) => void;
  learningStyle: string;
  setLearningStyle: (value: string) => void;
  lessonLength: string;
  setLessonLength: (value: string) => void;
  classSetting: string;
  setClassSetting: (value: string) => void;
  learningEnvironment: string;
  setLearningEnvironment: (value: string) => void;
  studentExperience: string;
  setStudentExperience: (value: string) => void;
  educationExperience: string;
  setEducationExperience: (value: string) => void;
  culturalContext: string;
  setCulturalContext: (value: string) => void;
  specialNeeds: string;
  setSpecialNeeds: (value: string) => void;
  lessonSequence: string;
  setLessonSequence: (value: string) => void;
  assessmentStyle: string;
  setAssessmentStyle: (value: string) => void;
  language: string;
  setLanguage: (value: string) => void;
  activityTypes: string[];
  setActivityTypes: (value: string[]) => void;

  // Part of Series position (NOT saved in profile)
  lessonNumber: number;
  setLessonNumber: (value: number) => void;
  totalLessons: number;
  setTotalLessons: (value: number) => void;

  // Freshness mode (only relevant for series)
  freshnessMode: string;
  setFreshnessMode: (value: string) => void;

  // Profile management
  profiles: TeacherPreferenceProfile[];
  currentProfileId: string | null;
  onSaveProfile: (name: string, preferences: TeacherPreferences, isDefault: boolean) => Promise<TeacherPreferenceProfile | null>;
  onUpdateProfile: (id: string, name: string, preferences: TeacherPreferences, isDefault: boolean) => Promise<boolean>;
  onLoadProfile: (profile: TeacherPreferenceProfile) => void;
  onClearProfile: () => void;
  onDeleteProfile: (id: string) => Promise<boolean>;
  isSavingProfile: boolean;

  disabled?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TeacherCustomization({
  isExpanded,
  onToggleExpand,
  teachingStyle,
  setTeachingStyle,
  learningStyle,
  setLearningStyle,
  lessonLength,
  setLessonLength,
  classSetting,
  setClassSetting,
  learningEnvironment,
  setLearningEnvironment,
  studentExperience,
  setStudentExperience,
  educationExperience,
  setEducationExperience,
  culturalContext,
  setCulturalContext,
  specialNeeds,
  setSpecialNeeds,
  lessonSequence,
  setLessonSequence,
  assessmentStyle,
  setAssessmentStyle,
  language,
  setLanguage,
  activityTypes,
  setActivityTypes,
  lessonNumber,
  setLessonNumber,
  totalLessons,
  setTotalLessons,
  freshnessMode,
  setFreshnessMode,
  profiles,
  currentProfileId,
  onSaveProfile,
  onUpdateProfile,
  onLoadProfile,
  onClearProfile,
  onDeleteProfile,
  isSavingProfile,
  disabled = false,
}: TeacherCustomizationProps) {
  // SSOT: isExpanded is now controlled by parent via props

  // Save modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveProfileName, setSaveProfileName] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Update expansion when profiles load
  useEffect(() => {
    // SSOT: Expansion now controlled by parent
  }, [profiles.length]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleActivityToggle = (activityId: string, checked: boolean) => {
    if (checked) {
      setActivityTypes([...activityTypes, activityId]);
    } else {
      setActivityTypes(activityTypes.filter((id) => id !== activityId));
    }
  };

  const handleProfileSelect = (profileId: string) => {
    if (profileId === "__none__") {
      onClearProfile();
      return;
    }
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      onLoadProfile(profile);
    }
  };

  const getCurrentPreferences = (): TeacherPreferences => ({
    teachingStyle,
    learningStyle,
    lessonLength,
    groupSize: classSetting,
    learningEnvironment,
    studentExperience,
    educationExperience,
    culturalContext,
    specialNeeds,
    assessmentStyle,
    language,
    lessonSequence,
    activityTypes,
  });

  const handleOpenSaveModal = () => {
    // If currently viewing a profile, pre-fill for update
    if (currentProfileId) {
      const currentProfile = profiles.find((p) => p.id === currentProfileId);
      if (currentProfile) {
        setSaveProfileName(currentProfile.profile_name);
        setSaveAsDefault(currentProfile.is_default);
        setIsUpdatingExisting(true);
      }
    } else {
      setSaveProfileName("");
      setSaveAsDefault(profiles.length === 0); // First profile defaults to default
      setIsUpdatingExisting(false);
    }
    setShowSaveModal(true);
  };

  const handleSaveProfile = async () => {
    const preferences = getCurrentPreferences();

    if (isUpdatingExisting && currentProfileId) {
      const success = await onUpdateProfile(currentProfileId, saveProfileName, preferences, saveAsDefault);
      if (success) {
        setShowSaveModal(false);
      }
    } else {
      const result = await onSaveProfile(saveProfileName, preferences, saveAsDefault);
      if (result) {
        setShowSaveModal(false);
      }
    }
  };

  const handleDeleteProfile = async (id: string) => {
    const success = await onDeleteProfile(id);
    if (success) {
      setDeleteConfirmId(null);
    }
  };

  const handleLessonNumberChange = (value: string) => {
    const num = parseInt(value, 10);
    if (num >= 1 && num <= totalLessons) {
      setLessonNumber(num);
    }
  };

  const handleTotalLessonsChange = (value: string) => {
    const num = parseInt(value, 10);
    if (num >= 2 && num <= 7) {
      setTotalLessons(num);
      // Adjust lesson number if it exceeds new total
      if (lessonNumber > num) {
        setLessonNumber(num);
      }
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card className="w-full border shadow-sm">
      <CardHeader
        className="cursor-pointer hover:bg-accent/50 transition-colors pb-3"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StepBadge number={3} />
            </div>
            <CardTitle className="text-lg text-foreground">
              <GoldAccent>Personalize</GoldAccent> Your Lesson
            </CardTitle>
            <CardDescription className="text-amber-700 font-medium">
              Check off each one below to describe your teaching environment
            </CardDescription>
            <CardDescription className="text-muted-foreground text-xs mt-1">
              Hint: You can save up to 7 profiles — choose a saved profile & it preloads
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {/* Watch Video Link - Only shows when video URL is configured (SSOT) */}
            {getVideo('step3')?.url && (
              <a
                href={getVideo('step3')?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-sky-600 hover:text-accent hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Play className="h-3 w-3" />
                <span>Watch</span>
              </a>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-4">
          {/* Profile Management Row */}
          <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
            {profiles.length > 0 && (
              <div className="flex items-center gap-2">
                <Label htmlFor="profile-select" className="text-sm whitespace-nowrap">
                  Load Profile:
                </Label>
                <Select
                  value={currentProfileId || "__none__"}
                  onValueChange={handleProfileSelect}
                  disabled={disabled || isSavingProfile}
                >
                  <SelectTrigger id="profile-select" className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select a profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" className="text-muted-foreground">
                      — None —
                    </SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.profile_name}
                        {profile.is_default && ` ${UI_SYMBOLS.STAR}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {currentProfileId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirmId(currentProfileId)}
                    disabled={disabled || isSavingProfile}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            <div className="flex-1" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenSaveModal}
              disabled={disabled || isSavingProfile}
              className="gap-2"
            >
              {isSavingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save This Profile
            </Button>
          </div>

          {/* 12 Profile Fields - Responsive Grid (1 col mobile, 2 col desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Teaching Style */}
            <div className="space-y-2">
              <Label htmlFor="teaching-style">Teaching Style</Label>
              <Select value={teachingStyle} onValueChange={setTeachingStyle} disabled={disabled}>
                <SelectTrigger id="teaching-style" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select teaching style" />
                </SelectTrigger>
                <SelectContent>
                  {TEACHING_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      <div className="flex items-center gap-2">
                        {style.label}
                        {style.tooltip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[250px]">
                                <p>{style.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Learning Style */}
            <div className="space-y-2">
              <Label htmlFor="learning-style">Learning Style</Label>
              <Select value={learningStyle} onValueChange={setLearningStyle} disabled={disabled}>
                <SelectTrigger id="learning-style" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select learning style" />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lesson Length */}
            <div className="space-y-2">
              <Label htmlFor="lesson-length">Lesson Length</Label>
              <Select value={lessonLength} onValueChange={setLessonLength} disabled={disabled}>
                <SelectTrigger id="lesson-length" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select lesson length" />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_LENGTHS.map((length) => (
                    <SelectItem key={length.id} value={length.id}>
                      {length.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group Size */}
            <div className="space-y-2">
              <Label htmlFor="group-size">Group Size</Label>
              <Select value={classSetting} onValueChange={setClassSetting} disabled={disabled}>
                <SelectTrigger id="group-size" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select group size" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_SIZES.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Learning Environment */}
            <div className="space-y-2">
              <Label htmlFor="learning-environment">Learning Environment</Label>
              <Select value={learningEnvironment} onValueChange={setLearningEnvironment} disabled={disabled}>
                <SelectTrigger id="learning-environment" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_ENVIRONMENTS.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="student-experience">Student Experience Level</Label>
              <Select value={studentExperience} onValueChange={setStudentExperience} disabled={disabled}>
                <SelectTrigger id="student-experience" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Education Experience */}
            <div className="space-y-2">
              <Label htmlFor="education-experience">Education Experience</Label>
              <Select value={educationExperience} onValueChange={setEducationExperience} disabled={disabled}>
                <SelectTrigger id="education-experience" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_EXPERIENCES.map((edu) => (
                    <SelectItem key={edu.id} value={edu.id}>
                      {edu.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cultural Context */}
            <div className="space-y-2">
              <Label htmlFor="cultural-context">Cultural Context</Label>
              <Select value={culturalContext} onValueChange={setCulturalContext} disabled={disabled}>
                <SelectTrigger id="cultural-context" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select cultural context" />
                </SelectTrigger>
                <SelectContent>
                  {CULTURAL_CONTEXTS.map((context) => (
                    <SelectItem key={context.id} value={context.id}>
                      {context.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Special Needs */}
            <div className="space-y-2">
              <Label htmlFor="special-needs">Special Needs</Label>
              <Select value={specialNeeds} onValueChange={setSpecialNeeds} disabled={disabled}>
                <SelectTrigger id="special-needs" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select special needs" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIAL_NEEDS_OPTIONS.map((need) => (
                    <SelectItem key={need.id} value={need.id}>
                      {need.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assessment Style */}
            <div className="space-y-2">
              <Label htmlFor="assessment-style">Assessment Style</Label>
              <Select value={assessmentStyle} onValueChange={setAssessmentStyle} disabled={disabled}>
                <SelectTrigger id="assessment-style" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select assessment style" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={disabled}>
                <SelectTrigger id="language" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lesson Sequence (LAST in grid) */}
            <div className="space-y-2">
              <Label htmlFor="lesson-sequence">Lesson Sequence</Label>
              <Select value={lessonSequence} onValueChange={setLessonSequence} disabled={disabled}>
                <SelectTrigger id="lesson-sequence" className={FORM_STYLING.selectMaxWidth}>
                  <SelectValue placeholder="Select lesson sequence" />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_SEQUENCE_OPTIONS.map((seq) => (
                    <SelectItem key={seq.id} value={seq.id}>
                      {seq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Part of Series: Lesson X of Y (appears right after grid when selected) */}
          {lessonSequence === "part_of_series" && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <Label className="text-sm font-medium mb-3 block">Series Position</Label>
              <div className="flex items-center gap-3">
                <span className="text-sm">Lesson</span>
                <Input
                  type="number"
                  min={1}
                  max={totalLessons}
                  value={lessonNumber}
                  onChange={(e) => handleLessonNumberChange(e.target.value)}
                  disabled={disabled}
                  className="w-16 text-center"
                />
                <span className="text-sm">of</span>
                <Input
                  type="number"
                  min={2}
                  max={7}
                  value={totalLessons}
                  onChange={(e) => handleTotalLessonsChange(e.target.value)}
                  disabled={disabled}
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground">(max 7 lessons per series)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Each lesson in the series uses 1 credit. Position is not saved in your profile.
              </p>

              {/* Consistent Style Mode - only for series */}
              <div className="flex items-start space-x-2 mt-4 pt-3 border-t">
                <Checkbox
                  id="consistent-style"
                  checked={freshnessMode === "consistent"}
                  onCheckedChange={(checked) => 
                    setFreshnessMode(checked ? "consistent" : "fresh")
                  }
                  disabled={disabled}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="consistent-style"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Consistent Style Mode
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Lessons will maintain similar teaching approach (useful for series)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Types (checkboxes at end) */}
          <div className="space-y-2">
            <Label>Activity Types</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACTIVITY_TYPE_OPTIONS.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={activity.id}
                    checked={activityTypes.includes(activity.id)}
                    onCheckedChange={(checked) => handleActivityToggle(activity.id, checked as boolean)}
                    disabled={disabled}
                  />
                  <label
                    htmlFor={activity.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {activity.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}

      {/* Save Profile Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isUpdatingExisting ? "Update Profile" : "Save Profile"}
            </DialogTitle>
            <DialogDescription>
              {isUpdatingExisting
                ? "Update this profile with your current customization settings."
                : "Save your current customization settings as a reusable profile."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Profile Name</Label>
              <Input
                id="profile-name"
                placeholder="e.g., Sunday Adult Class"
                value={saveProfileName}
                onChange={(e) => setSaveProfileName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Maximum 50 characters. {profiles.length}/7 profiles used.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="set-as-default"
                checked={saveAsDefault}
                onCheckedChange={(checked) => setSaveAsDefault(checked as boolean)}
              />
              <label
                htmlFor="set-as-default"
                className="text-sm font-medium leading-none"
              >
                Set as default profile (auto-loads when opening form)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSaveModal(false)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={!saveProfileName.trim() || isSavingProfile}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isUpdatingExisting ? (
                "Update Profile"
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {profiles.find((p) => p.id === deleteConfirmId)?.profile_name}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteProfile(deleteConfirmId)}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
