import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, BookOpen, Loader2 } from "lucide-react";
import { useEnhanceLesson } from "@/hooks/useEnhanceLesson";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { THEOLOGY_PROFILES } from "@/constants/theologyProfiles";
import { AGE_GROUPS } from "@/constants/ageGroups";
import { TeacherCustomization } from "./TeacherCustomization";
import { LessonExportButtons } from "./LessonExportButtons";

interface EnhanceLessonFormProps {
  onLessonGenerated?: (lesson: any) => void;
  organizationId?: string;
  userPreferredAgeGroup?: string;
  defaultDoctrine?: string;
  viewingLesson?: any;
  onClearViewing?: () => void;
}

const extractLessonTitle = (content: string): string | null => {
  if (!content) return null;
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?Lesson Title:?(?:\*\*)?\s*[""]?(.+?)[""]?\s*$/i);
    if (match) return match[1].replace(/[""\*]/g, "").trim();
  }
  return null;
};

export function EnhanceLessonForm({
  onLessonGenerated,
  organizationId,
  userPreferredAgeGroup,
  defaultDoctrine,
  viewingLesson,
  onClearViewing,
}: EnhanceLessonFormProps) {
  const [biblePassage, setBiblePassage] = useState("");
  const [focusedTopic, setFocusedTopic] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [notes, setNotes] = useState("");
  const [theologyProfileId, setTheologyProfileId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generateTeaser, setGenerateTeaser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);

  const [teachingStyle, setTeachingStyle] = useState("");
  const [lessonLength, setLessonLength] = useState("");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [language, setLanguage] = useState("english");
  const [classSetting, setClassSetting] = useState("");
  const [learningEnvironment, setLearningEnvironment] = useState("");
  const [studentExperience, setStudentExperience] = useState("");
  const [culturalContext, setCulturalContext] = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [lessonSequence, setLessonSequence] = useState("");
  const [assessmentStyle, setAssessmentStyle] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [educationExperience, setEducationExperience] = useState("");

  const { enhanceLesson, isEnhancing } = useEnhanceLesson();
  const { toast } = useToast();

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting || isEnhancing) {
      setGenerationProgress(0);
      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          // Slow down as we approach 99%
          if (prev >= 99) return 99;
          if (prev >= 96) return prev + 0.3; // Very slow final increment
          if (prev >= 90) return prev + 0.8;
          return prev + 1.2;
        });
      }, 1000);
    } else {
      setGenerationProgress(0);
    }
    return () => clearInterval(interval);
  }, [isSubmitting, isEnhancing]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!biblePassage && !focusedTopic) {
      toast({
        title: "Missing information",
        description: "Please provide either a Bible passage or a focused topic",
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
        bible_passage: biblePassage,
        focused_topic: focusedTopic,
        age_group: ageGroup,
        theology_profile_id: theologyProfileId,
        additional_notes: notes,
        teaching_style: teachingStyle,
        lesson_length: lessonLength,
        activity_types: activityTypes,
        language: language,
        class_setting: classSetting,
        learning_environment: learningEnvironment,
        student_experience: studentExperience,
        cultural_context: culturalContext,
        special_needs: specialNeeds,
        lesson_sequence: lessonSequence,
        assessment_style: assessmentStyle,
        learning_style: learningStyle,
        education_experience: educationExperience,
        generate_teaser: generateTeaser,
        uploaded_file: uploadedFile,
      };

      const result = await enhanceLesson(enhancementData);

      if (result) {
        setGeneratedLesson(result);
        if (onLessonGenerated) {
          onLessonGenerated(result);
        }
      }

      setGenerationProgress(100);
      setBiblePassage("");
      setFocusedTopic("");
      setAgeGroup("");
      setNotes("");
      setUploadedFile(null);
      setGenerateTeaser(false);
    } catch (error) {
      console.error("Error generating lesson:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentLesson = viewingLesson || generatedLesson?.lesson;
  const displayTitle = currentLesson ? (extractLessonTitle(currentLesson.original_text) || currentLesson.title || "Generated Lesson") : "Generated Lesson";

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Baptist-Enhanced Lesson
          </CardTitle>
          <CardDescription>Generate a theologically-sound Bible study lesson tailored to your class</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="passage">Bible Passage (Optional)</Label>
              <Input
                id="passage"
                placeholder="e.g., John 3:16-21"
                value={biblePassage}
                onChange={(e) => setBiblePassage(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Focused Topic or Theme (Optional)</Label>
              <Input
                id="topic"
                placeholder="e.g., 'Salvation through Faith' or 'God's Grace'"
                value={focusedTopic}
                onChange={(e) => setFocusedTopic(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age-group">Age Group *</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="theology-profile">Baptist Theology Profile *</Label>
              <Select value={theologyProfileId} onValueChange={setTheologyProfileId} disabled={isSubmitting}>
                <SelectTrigger id="theology-profile">
                  <SelectValue placeholder="Select theology profile" />
                </SelectTrigger>
                <SelectContent>
                  {THEOLOGY_PROFILES.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selected profile shapes AI generation to align with specific Baptist theological standards
              </p>
            </div>

            <TeacherCustomization
              teachingStyle={teachingStyle}
              setTeachingStyle={setTeachingStyle}
              lessonLength={lessonLength}
              setLessonLength={setLessonLength}
              activityTypes={activityTypes}
              setActivityTypes={setActivityTypes}
              language={language}
              setLanguage={setLanguage}
              classSetting={classSetting}
              setClassSetting={setClassSetting}
              learningEnvironment={learningEnvironment}
              setLearningEnvironment={setLearningEnvironment}
              studentExperience={studentExperience}
              setStudentExperience={setStudentExperience}
              culturalContext={culturalContext}
              setCulturalContext={setCulturalContext}
              specialNeeds={specialNeeds}
              setSpecialNeeds={setSpecialNeeds}
              lessonSequence={lessonSequence}
              setLessonSequence={setLessonSequence}
              assessmentStyle={assessmentStyle}
              setAssessmentStyle={setAssessmentStyle}
              learningStyle={learningStyle}
              setLearningStyle={setLearningStyle}
              educationExperience={educationExperience}
              setEducationExperience={setEducationExperience}
              disabled={isSubmitting}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific focus areas, cultural context, or teaching preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload Existing Curriculum (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                />
                {uploadedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    disabled={isSubmitting}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Upload PDF, DOCX, TXT, or JPG files (max 10MB)</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-teaser"
                checked={generateTeaser}
                onCheckedChange={(checked) => setGenerateTeaser(checked as boolean)}
                disabled={isSubmitting}
              />
              <label
                htmlFor="generate-teaser"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Generate Lesson Teaser (days before lesson build student anticipation without revealing content -
                suitable for post, text, email, or card)
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isEnhancing}>
              {isSubmitting || isEnhancing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Lesson Generating... {Math.round(generationProgress)}%</span>
                </div>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generate Lesson
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Display Generated or Viewing Lesson */}
      {currentLesson && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {displayTitle}
              </CardTitle>
              <div className="flex items-center gap-2">
                <LessonExportButtons
                  lesson={{
                    title: currentLesson.title || "Generated Lesson",
                    original_text: currentLesson.original_text || "",
                    metadata: currentLesson.metadata,
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (viewingLesson && onClearViewing) {
                      onClearViewing();
                    } else {
                      setGeneratedLesson(null);
                    }
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Teaser Section - Display prominently if present */}
            {currentLesson.metadata?.teaser && (
              <div className="mb-3 p-2.5 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-primary text-sm">Student Teaser (Pre-Lesson)</h3>
                </div>
                <p className="text-sm italic leading-tight">{currentLesson.metadata.teaser}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this with students via text, email, or social media days before class to build anticipation.
                </p>
              </div>
            )}

            <div className="prose-sm max-w-none">
              <div
                className="whitespace-pre-wrap text-sm bg-muted p-2.5 rounded-lg overflow-auto max-h-[600px]"
                style={{ lineHeight: '1.3' }}
                dangerouslySetInnerHTML={{
                  __html: (currentLesson.original_text || "")
                    .replace(/## (.*?)(?=\n|$)/g, '<h2 class="text-base font-bold mt-2 mb-1">$1</h2>')
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\n---\n/g, '<hr class="my-1.5 border-t border-muted-foreground/20">')
                    .replace(/•/g, "•")
                    .replace(/\n\n/g, "<br><br>")
                    .replace(/\n/g, "<br>"),
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
