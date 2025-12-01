import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, BookOpen, Loader2, Star } from "lucide-react";
import { useEnhanceLesson } from "@/hooks/useEnhanceLesson";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { THEOLOGY_PROFILES } from "@/constants/theologyProfiles";
import { AGE_GROUPS } from "@/constants/ageGroups";
import { TeacherCustomization } from "./TeacherCustomization";
import { LessonExportButtons } from "./LessonExportButtons";

interface EnhanceLessonFormProps {
  onLessonGenerated?: (lesson: any) => void;
  onExport?: () => void;
  onRequestFeedback?: () => void;
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
  onExport,
  onRequestFeedback,
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
  const [extractedContent, setExtractedContent] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
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
  const { isLimitReached, lessonsUsed, lessonsAllowed, hoursUntilReset, errorMessage: rateLimitError, refreshRateLimit } = useRateLimit();
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

  // FIXED: handleFileChange now extracts content from uploaded file
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
      formDataToSend.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('Authentication required');
      }

      const supabaseUrl = "https://hphebzdftpjbiudpfcrs.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/extract-lesson`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
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
        throw new Error(result.error || 'Failed to extract content');
      }
    } catch (error: any) {
      console.error('File extraction error:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!biblePassage && !focusedTopic && !extractedContent) {
      toast({
        title: "Missing information",
        description: "Please provide a Bible passage, focused topic, or upload a curriculum file",
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
        extracted_content: extractedContent,
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
            {/* 1. Upload Existing Curriculum - MOVED TO TOP */}
            <div className="space-y-2">
              <Label htmlFor="file">Upload Existing Curriculum (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Upload any bible study curriculum (pdf, text, docx, jpg or jpeg files or images. &lt;10mb). We'll enhance it with deeper Baptist theological insights.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg"
                  onChange={handleFileChange}
                  disabled={isSubmitting || isExtracting}
                  className="cursor-pointer"
                />
                {uploadedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setUploadedFile(null); setExtractedContent(null); }}
                    disabled={isSubmitting || isExtracting}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {isExtracting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting content from file...</span>
                </div>
              )}
              {extractedContent && (
                <div className="text-sm text-green-600">
                  ? File content extracted ({extractedContent.length} characters)
                </div>
              )}
            </div>

            {/* 2. Bible Passage */}
            <div className="space-y-2">
              <Label htmlFor="passage">Bible Passage (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Enter the primary Scripture reference for your lesson (e.g., John 3:16-21). Leave blank if included in uploaded curriculum.
              </p>
              <Input
                id="passage"
                placeholder="e.g., John 3:16-21"
                value={biblePassage}
                onChange={(e) => setBiblePassage(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* 3. Focused Topic or Theme */}
            <div className="space-y-2">
              <Label htmlFor="topic">Focused Topic or Theme (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Enter general terms and your primary thought will be conveyed throughout the lesson.
              </p>
              <Input
                id="topic"
                placeholder="e.g., 'Salvation through Faith' or 'God's Grace'"
                value={focusedTopic}
                onChange={(e) => setFocusedTopic(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* 4. Age Group */}
            <div className="space-y-2">
              <Label htmlFor="age-group">Age Group *</Label>
              <p className="text-sm text-muted-foreground">
                Everything will be age appropriate -- subject matter, vocabulary, activities, timing sequences, interests, illustrations -- everything.
              </p>
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

            {/* 5. Baptist Theology Profile */}
            <div className="space-y-2">
              <Label htmlFor="theology-profile">Baptist Theology Profile *</Label>
              <p className="text-sm text-muted-foreground">
                Choose your church's theological tradition. This ensures doctrinal alignment with your congregation.
              </p>
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
            </div>

            {/* 6. Lesson Customization */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Personalize your lesson with your own teaching style, your own class description and we will generate a lesson built just for you and those you teach.
              </p>
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
            </div>

            {/* 7. Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Add specific requests -- describe your focus or primary thought -- we'll deliver it clearly and plainly throughout the lesson
              </p>
              <Textarea
                id="notes"
                placeholder="Any specific focus areas, cultural context, or teaching preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            {/* 8. Generate Lesson Teaser */}
            <div className="space-y-2">
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
                  Generate Lesson Teaser
                </label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Send days before you teach; build anticipation and expectation to hear God speak into their lives. (perfect for emails, texts, or social media)
              </p>
            </div>

            {/* Rate Limit Indicator */}
            <div className={`text-sm text-center p-2 rounded-lg mb-3 ${isLimitReached ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
              {isLimitReached ? (
                <span>Limit reached - resets in {hoursUntilReset} hour{hoursUntilReset === 1 ? "" : "s"}</span>
              ) : (
                <span>{lessonsUsed} of {lessonsAllowed} lessons used {hoursUntilReset ? `(resets in ${hoursUntilReset} hours)` : "(24-hour period)"}</span>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isEnhancing || isLimitReached || isExtracting}>
              {isSubmitting || isEnhancing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Lesson Generating... {Math.round(generationProgress)}%</span>
                </div>
              ) : isExtracting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting file content...</span>
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
                    .replace(/\x95/g, "\x95")
                    .replace(/\n\n/g, "<br><br>")
                    .replace(/\n/g, "<br>"),
                }}
              />
            </div>
            {/* Export buttons at bottom for convenience */}
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
