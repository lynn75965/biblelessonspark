import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Clock, Users, BookOpen, Copy, Download, Save, Printer, Upload, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLessons } from "@/hooks/useLessons";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { validateFileUpload, lessonFormSchema, type LessonFormData, isImageFile } from "@/lib/fileValidation";
import { AGE_GROUPS, getDefaultAgeGroupLabel } from "@/constants/ageGroups";
import { BIBLE_VERSIONS, getDefaultVersion } from "@/lib/bibleTranslations";
import { sanitizeLessonInput, sanitizeFileName } from "@/lib/inputSanitization";
import { logFileUploadEvent, logLessonEvent } from "@/lib/auditLogger";
import { TeacherCustomization, type TeacherPreferences, defaultPreferences } from "./TeacherCustomization";
import DebugPanel from "./DebugPanel";

interface EnhanceLessonFormProps {
  organizationId?: string;
  userPreferredAgeGroup?: string;
  defaultDoctrine?: string;
  viewingLesson?: any;
  onClearViewing?: () => void;
}

interface LessonContent {
  overview?: string;
  objectives?: string;
  scripture?: string;
  background?: string;
  opening?: string;
  teaching?: string;
  activities?: string;
  discussion?: string;
  applications?: string;
  assessment?: string;
  resources?: string;
  preparation?: string;
  fullContent?: string;
  activities_legacy?: Array<{
    title: string;
    duration_minutes?: number;
    materials?: string[];
    instructions: string;
  }>;
  discussion_prompts?: string[];
  applications_legacy?: string[];
}

export function EnhanceLessonForm({
  organizationId,
  userPreferredAgeGroup = getDefaultAgeGroupLabel(),
  defaultDoctrine = "SBC",
  viewingLesson,
  onClearViewing
}: EnhanceLessonFormProps) {
  const [enhancementType, setEnhancementType] = useState("curriculum");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session and upload tracking
  const [sessionId, setSessionId] = useState<string>('');
  const [uploadId, setUploadId] = useState<string>('');
  const [fileHash, setFileHash] = useState<string>('');
  const [sourceFilename, setSourceFilename] = useState<string>('');

  const [extractedContent, setExtractedContent] = useState<string | null>(null);
  const [extractedTopic, setExtractedTopic] = useState<string>('');
  const [extractedScripture, setExtractedScripture] = useState<string>('');

  // Job status states
  const [extractJobId, setExtractJobId] = useState<string>('');
  const [extractState, setExtractState] = useState<'idle' | 'queued' | 'processing' | 'done' | 'failed' | 'canceled'>('idle');
  const [extractProgress, setExtractProgress] = useState<number>(0);
  const [extractError, setExtractError] = useState<{ code: string; msg: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // âœ… FIXED: Separate passage and topic fields
  const [formData, setFormData] = useState({
    passage: "",
    topic: "",
    ageGroup: userPreferredAgeGroup,
    notes: "",
    bibleVersion: getDefaultVersion().id,
    theologicalPreference: "southern_baptist" as 'southern_baptist' | 'reformed_baptist' | 'independent_baptist',
    sbConfessionVersion: "bfm_1963" as 'bfm_1963' | 'bfm_2000'
  });

  const [rememberConfessionChoice, setRememberConfessionChoice] = useState(false);
  const [teacherPreferences, setTeacherPreferences] = useState<TeacherPreferences>(defaultPreferences);
  const [showCustomization, setShowCustomization] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'timeout' | 'success' | 'error'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');

  // Timer effect for generation progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGenerating || generationStatus === 'timeout') {
      if (generationStatus !== 'timeout') {
        setElapsedSeconds(0);
      }
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, generationStatus]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`
  };
  const [generatedContent, setGeneratedContent] = useState<LessonContent | null>(null);

  // Initialize from viewingLesson when provided
  useEffect(() => {
    if (viewingLesson) {
      setGeneratedContent({ fullContent: viewingLesson.original_text });
      setEnhancedResult({ viewing: true });
      setLessonTitle(viewingLesson.title || "");
    }
  }, [viewingLesson]);
  const [enhancedResult, setEnhancedResult] = useState<any | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const { toast } = useToast();
  const { createLesson } = useLessons();
  const { user } = useAuth();
  const { trackEvent, trackLessonCreated } = useAnalytics();

  // Verification marker
  useEffect(() => {
    console.log("âœ… VERIFIED_BUILD: EnhanceLessonForm FIXED version loaded");
    console.log("âœ… FIXED: Separate passage and topic fields");
    console.log("âœ… FIXED: Optional file upload");
    console.log("âœ… FIXED: Button enabled with passage/topic even without file");
  }, []);

  React.useEffect(() => {
    const fetchProfilePreferences = async () => {
      if (!user) return;

      const { supabase } = await import('@/integrations/supabase/client');
      const { data: profile } = await supabase
        .from('profiles')
        .select('sb_confession_version')
        .eq('id', user.id)
        .single();

      if (profile?.sb_confession_version) {
        setFormData(prev => ({
          ...prev,
          sbConfessionVersion: profile.sb_confession_version as 'bfm_1963' | 'bfm_2000'
        }));
      }
    };

    fetchProfilePreferences();
  }, [user]);

  const computeFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const parseTxtFile = async (file: File): Promise<{ topic: string; scripture: string; content: string }> => {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());

    const topic = lines[0]?.trim() || 'Untitled Lesson';
    const scripture = lines[1]?.trim() || '';
    const content = text;

    return { topic, scripture, content };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Cancel any in-flight extraction
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Generate new IDs
    const newSessionId = crypto.randomUUID();
    const newUploadId = crypto.randomUUID();
    const hash = await computeFileHash(file);
    const tempJobId = crypto.randomUUID();

    console.log('EXTRACT_START', {
      jobId: tempJobId,
      sessionId: newSessionId,
      uploadId: newUploadId,
      fileHash: hash,
      filename: file.name
    });

    // Reset all state
    setSessionId(newSessionId);
    setUploadId(newUploadId);
    setFileHash(hash);
    setSourceFilename(file.name);
    setExtractedContent(null);
    setExtractedTopic('');
    setExtractedScripture('');
    setEnhancedResult(null);
    setUploadedFile(file);
    setExtractState('queued');
    setExtractProgress(0);
    setExtractError(null);
    setExtractJobId(tempJobId);
    setIsExtracting(true);

    const startTime = Date.now();
    const timeoutDuration = 70000; // 70 seconds

    try {
      // Fast-path for .txt files < 2MB
      if (file.name.toLowerCase().endsWith('.txt') && file.size < 2 * 1024 * 1024) {
        setExtractState('processing');
        setExtractProgress(50);

        console.log('EXTRACT_PROGRESS', {
          jobId: tempJobId,
          sessionId: newSessionId,
          uploadId: newUploadId,
          fileHash: hash,
          filename: file.name,
          state: 'processing',
          progress: 50
        });

        const parsed = await parseTxtFile(file);

        // Check for timeout
        if (Date.now() - startTime > timeoutDuration) {
          throw new Error('Timeout exceeded');
        }

        console.log('EXTRACT_DONE', {
          jobId: tempJobId,
          sessionId: newSessionId,
          uploadId: newUploadId,
          fileHash: hash,
          filename: file.name
        });

        setExtractedContent(parsed.content);
        setExtractedTopic(parsed.topic);
        setExtractedScripture(parsed.scripture);
        setExtractState('done');
        setExtractProgress(100);
        setIsExtracting(false);
        toast({ title: "Text file processed successfully" });
        return;
      }

      // For other files, show error (OCR not fully implemented yet)
      console.log('EXTRACT_FAILED', {
        jobId: tempJobId,
        sessionId: newSessionId,
        uploadId: newUploadId,
        fileHash: hash,
        filename: file.name,
        error: { code: 'unsupported', msg: 'Only .txt files under 2MB are currently supported' }
      });

      setExtractError({ code: 'unsupported', msg: 'Only .txt files under 2MB are currently supported' });
      setExtractState('failed');
      setIsExtracting(false);
      toast({ title: "File not supported", description: "Please upload a .txt file under 2MB", variant: "destructive" });

    } catch (error) {
      console.error('Error processing file:', error);

      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      console.log('EXTRACT_FAILED', {
        jobId: tempJobId,
        sessionId: newSessionId,
        uploadId: newUploadId,
        fileHash: hash,
        filename: file.name,
        error: { code: 'unknown', msg: errorMsg }
      });

      setExtractError({ code: 'unknown', msg: errorMsg });
      setExtractState('failed');
      setIsExtracting(false);
      toast({ title: "Failed to process file", variant: "destructive" });
    }
  };

  const handleClearExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSessionId('');
    setUploadId('');
    setFileHash('');
    setSourceFilename('');
    setExtractedContent(null);
    setExtractedTopic('');
    setExtractedScripture('');
    setEnhancedResult(null);
    setUploadedFile(null);
    setExtractState('idle');
    setExtractProgress(0);
    setExtractError(null);
    setExtractJobId('');
    setIsExtracting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetryExtraction = () => {
    if (uploadedFile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // âœ… FIXED: New validation logic
  const isFormValid = () => {
    // Must have user authentication
    if (!user) return false;
    
    // Must have either passage, topic, OR extracted content
    const hasPassage = formData.passage.trim().length > 0;
    const hasTopic = formData.topic.trim().length > 0;
    const hasExtractedContent = extractedContent !== null && extractedContent.trim().length > 0;
    
    return hasPassage || hasTopic || hasExtractedContent;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate lessons",
        variant: "destructive",
      });
      return;
    }

    if (!formData.passage.trim() && !formData.topic.trim() && !extractedContent) {
      toast({
        title: "Missing input",
        description: "Please enter a passage, topic, or upload a file",
        variant: "destructive",
      });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const mode = extractedContent ? "enhance" : "generate";
      const passageOrTopic = formData.passage.trim() || formData.topic.trim();

      setIsGenerating(true);
      setEnhancedResult(null);

      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) throw new Error('Authentication required');

      const requestBody: any = {
        passage: formData.passage.trim(),
        topic: formData.topic.trim(),
        passageOrTopic,
        ageGroup: formData.ageGroup,
        notes: formData.notes,
        bibleVersion: formData.bibleVersion,
        enhancementType: mode,
        teacherPreferences,
        theologicalPreference: formData.theologicalPreference,
        sbConfessionVersion: formData.sbConfessionVersion,
      };

      if (extractedContent) {
        requestBody.extractedContent = extractedContent;
        requestBody.sessionId = sessionId;
        requestBody.uploadId = uploadId;
        requestBody.fileHash = fileHash;
        requestBody.sourceFile = sourceFilename;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-lesson?ts=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      console.log('LESSON_GENERATED', {
        jobId: result?.lesson?.id,
        mode,
        wordCount: result?.output?.teacher_plan?.wordCount,
        sectionCount: result?.output?.teacher_plan?.sectionCount
      });

      if (result.success) {
        setGeneratedContent(result.output?.teacher_plan);
        setLessonTitle(result.lesson?.title || '');
        setEnhancedResult({
          ...result,
          sessionId: result.sessionId,
          uploadId: result.uploadId,
          fileHash: result.fileHash,
        });

        toast({
          title: mode === "enhance" ? "Lesson enhanced successfully!" : "Lesson generated successfully!",
          description: `Your ${result.output?.teacher_plan?.sectionCount || 8}-section lesson is ready.`,
        });
      } else {
        throw new Error(result.error || 'Failed to generate lesson');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.log('Frontend timeout - server may still be processing');
        toast({
          title: "Request timed out",
          description: "Your lesson may still be generating. Check Lesson Library in 1-2 minutes.",
          variant: "default",
        });
      } else {
        console.error('Generation error:', error);
        toast({
          title: "Generation failed",
          description: error.message || "Please try again",
          variant: "destructive"
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };
                </Select>
              </div>
            </div>

            {formData.theologicalPreference === 'southern_baptist' && (
              <div>
                <Label htmlFor="sbConfessionVersion">BFM Version</Label>
                <RadioGroup
                  defaultValue={formData.sbConfessionVersion}
                  onValueChange={(value) => {
                    setFormData({ ...formData, sbConfessionVersion: value as 'bfm_1963' | 'bfm_2000' });
                    if (rememberConfessionChoice) {
                      // Save to profile
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bfm_1963" id="bfm_1963" />
                    <Label htmlFor="bfm_1963">BFM 1963</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bfm_2000" id="bfm_2000" />
                    <Label htmlFor="bfm_2000">BFM 2000</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Focus on grace, not works"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="customization"
                checked={showCustomization}
                onCheckedChange={(checked) => setShowCustomization(checked === true)}
              />
              <Label htmlFor="customization" className="text-sm font-medium leading-none cursor-pointer">
                Show Customization Options
              </Label>
            </div>

            {showCustomization && (
              <TeacherCustomization
                preferences={teacherPreferences}
                onPreferencesChange={setTeacherPreferences}
              />
            )}

            {/* âœ… FIXED: Button enabled when form is valid (passage OR topic OR file) */}
            <Button 
              type="submit" 
              disabled={isGenerating || generationStatus === 'timeout' || !isFormValid()} 
              className="w-full sm:w-auto" 
              size="lg"
            >
              {isGenerating || generationStatus === 'timeout' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden xs:inline">
                      {generationStatus === 'timeout' ? `Processing... ${formatTime(elapsedSeconds)}` : `Generating... ${formatTime(elapsedSeconds)}`}
                    </span>
                    <span className="xs:hidden">{formatTime(elapsedSeconds)}</span>
                  </>
                ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span className="hidden xs:inline">
                    {extractedContent ? "Enhance Curriculum" : "Generate Lesson"}
                  </span>
                  <span className="xs:hidden">
                    {extractedContent ? "Enhance" : "Generate"}
                  </span>
                </>
              )}
            </Button>

              {/* Generation Status Message */}
              {(generationStatus === 'generating' || generationStatus === 'timeout') && (
                <Alert className={`mt-4 ${generationStatus === 'timeout' ? 'border-amber-500 bg-amber-50' : 'border-blue-500 bg-blue-50'}`}>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {generationStatus === 'timeout' ? (
                      <span>
                        <strong>Still working!</strong> {generationMessage || 'Your lesson is being generated on the server. Check your Lesson Library in 1-2 minutes.'}
                      </span>
                    ) : (
                      <span>
                        <strong>Generating your lesson...</strong> This typically takes 2-3 minutes. Please don't close this page.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
          </form>
        </CardContent>
      </Card>

      {enhancedResult && (
        <Card className="w-full mt-4">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl">
              {extractedContent ? "Enhanced Lesson" : "Generated Lesson"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Your lesson content is ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            {generatedContent ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-lg sm:text-xl font-semibold">Overview</h2>
                  <p className="text-sm sm:text-base">{generatedContent.overview}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Objectives</h2>
                  <p>{generatedContent.objectives}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Scripture</h2>
                  <p>{generatedContent.scripture}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Background</h2>
                  <p>{generatedContent.background}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Opening</h2>
                  <p>{generatedContent.opening}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Teaching</h2>
                  <p>{generatedContent.teaching}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Activities</h2>
                  <p>{generatedContent.activities}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Discussion</h2>
                  <p>{generatedContent.discussion}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Applications</h2>
                  <p>{generatedContent.applications}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Assessment</h2>
                  <p>{generatedContent.assessment}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Resources</h2>
                  <p>{generatedContent.resources}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Preparation</h2>
                  <p>{generatedContent.preparation}</p>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Full Content</h2>
                  <pre className="whitespace-pre-wrap">{generatedContent.fullContent}</pre>
                </div>
              </>
            ) : (
              <p>No lesson content generated yet.</p>
            )}
          </CardContent>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 p-4 sm:p-6">
            <Button size="sm" onClick={handleSave} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleCopy} className="flex-1 sm:flex-none">
                <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Copy</span>
              </Button>
              <Button size="sm" onClick={handlePrint} className="flex-1 sm:flex-none">
                <Printer className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Print</span>
              </Button>
              <Button size="sm" onClick={handleDownload} className="flex-1 sm:flex-none">
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Download</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearForm} className="flex-1 sm:flex-none">
                <span className="text-xs sm:text-sm">Clear</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      <DebugPanel
        job={{
          jobId: extractJobId,
          sessionId,
          uploadId,
          fileHash,
          source: sourceFilename || 'manual_entry',
          state: extractState,
          progress: extractProgress
        }}
      />
    </div>
  );
}
