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
import { validateFileUpload, isImageFile } from "@/lib/fileValidation";
import { AGE_GROUP_OPTIONS, AGE_GROUP_DESCRIPTIONS, getDefaultAgeGroup } from "@/lib/constants";
import { BIBLE_VERSIONS, getDefaultVersion } from "@/lib/bibleTranslations";
import { sanitizeLessonInput, sanitizeFileName } from "@/lib/inputSanitization";
import { logFileUploadEvent, logLessonEvent } from "@/lib/auditLogger";
import { TeacherCustomization, type TeacherPreferences, defaultPreferences } from "./TeacherCustomization";
import DebugPanel from "./DebugPanel";

interface EnhanceLessonFormProps {
  organizationId?: string;
  userPreferredAgeGroup?: string;
  defaultDoctrine?: string;
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
  userPreferredAgeGroup = "Young Adults (Ages 26–35)",
  defaultDoctrine = "SBC"
}: EnhanceLessonFormProps) {
  const [enhancementType, setEnhancementType] = useState("curriculum");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sessionId, setSessionId] = useState<string>('');
  const [uploadId, setUploadId] = useState<string>('');
  const [fileHash, setFileHash] = useState<string>('');
  const [sourceFilename, setSourceFilename] = useState<string>('');

  const [extractedContent, setExtractedContent] = useState<string | null>(null);
  const [extractedTopic, setExtractedTopic] = useState<string>('');
  const [extractedScripture, setExtractedScripture] = useState<string>('');

  const [extractJobId, setExtractJobId] = useState<string>('');
  const [extractState, setExtractState] = useState<'idle' | 'queued' | 'processing' | 'done' | 'failed' | 'canceled'>('idle');
  const [extractProgress, setExtractProgress] = useState<number>(0);
  const [extractError, setExtractError] = useState<{ code: string; msg: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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
  const [generatedContent, setGeneratedContent] = useState<LessonContent | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<any | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const { toast } = useToast();
  const { createLesson } = useLessons();
  const { user } = useAuth();
  const { trackEvent, trackLessonCreated } = useAnalytics();

  useEffect(() => {
    console.log("✅ VERIFIED_BUILD: EnhanceLessonForm COMPLETE FINAL version");
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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const newSessionId = crypto.randomUUID();
    const newUploadId = crypto.randomUUID();
    const hash = await computeFileHash(file);
    const tempJobId = crypto.randomUUID();

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
    const timeoutDuration = 70000;

    try {
      if (file.name.toLowerCase().endsWith('.txt') && file.size < 2 * 1024 * 1024) {
        setExtractState('processing');
        setExtractProgress(50);

        const parsed = await parseTxtFile(file);

        if (Date.now() - startTime > timeoutDuration) {
          throw new Error('Timeout exceeded');
        }

        setExtractedContent(parsed.content);
        setExtractedTopic(parsed.topic);
        setExtractedScripture(parsed.scripture);
        setExtractState('done');
        setExtractProgress(100);
        setIsExtracting(false);
        toast({ title: "Text file processed successfully" });
        return;
      }

      setExtractError({ code: 'unsupported', msg: 'Only .txt files under 2MB are currently supported' });
      setExtractState('failed');
      setIsExtracting(false);
      toast({ title: "File not supported", description: "Please upload a .txt file under 2MB", variant: "destructive" });

    } catch (error) {
      console.error('Error processing file:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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

  const isFormValid = () => {
    if (!user) return false;
    
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

    const mode = extractedContent ? "enhance" : "generate";
    const passageOrTopic = formData.passage.trim() || formData.topic.trim();

    setIsGenerating(true);
    setEnhancedResult(null);

    try {
      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error('Authentication required');
      }

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

      const response = await fetch(`https://csdtqqddtoureffhtuuz.supabase.co/functions/v1/generate-lesson?ts=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

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
          description: "Your comprehensive lesson content is ready.",
        });
      } else {
        throw new Error(result.error || 'Failed to generate lesson');
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent || !user || !organizationId) {
      toast({
        title: "Missing data",
        description: "Please generate a lesson before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const lessonData = {
        title: lessonTitle,
        original_text: generatedContent.fullContent || "",
        source_type: extractedContent ? "enhanced" : "generated",
        upload_path: sourceFilename || null,
        filters: {
          overview: generatedContent.overview || "",
          objectives: generatedContent.objectives || "",
          scripture: generatedContent.scripture || "",
          background: generatedContent.background || "",
          opening: generatedContent.opening || "",
          teaching: generatedContent.teaching || "",
          activities: generatedContent.activities || "",
          discussion: generatedContent.discussion || "",
          applications: generatedContent.applications || "",
          assessment: generatedContent.assessment || "",
          resources: generatedContent.resources || "",
          preparation: generatedContent.preparation || "",
          passage: formData.passage,
          topic: formData.topic,
          age_group: formData.ageGroup,
          notes: formData.notes,
          bible_version: formData.bibleVersion,
          theological_preference: formData.theologicalPreference,
          sb_confession_version: formData.sbConfessionVersion,
          session_id: sessionId || null,
          upload_id: uploadId || null,
          file_hash: fileHash || null,
        },
        organization_id: organizationId || undefined,
      };

      const result = await createLesson(lessonData);

      if (result.data && !result.error) {
        trackLessonCreated(result.data.id);
        toast({
          title: "Lesson saved!",
          description: "Your lesson has been successfully saved.",
        });
        handleClearForm();
      } else {
        throw new Error(result.error?.message || "Failed to save lesson");
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    if (generatedContent?.fullContent) {
      navigator.clipboard.writeText(generatedContent.fullContent);
      toast({
        title: "Content copied!",
        description: "Full lesson content copied to clipboard.",
      });
    }
  };

  const handlePrint = () => {
    if (generatedContent?.fullContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
          <head>
            <title>${lessonTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 20px; }
              h2 { font-size: 18px; margin-top: 30px; margin-bottom: 10px; }
              p { margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h1>${lessonTitle}</h1>
            <pre>${generatedContent.fullContent}</pre>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const handleDownload = () => {
    if (generatedContent?.fullContent) {
      const blob = new Blob([generatedContent.fullContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeFileName(lessonTitle)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClearForm = () => {
    setGeneratedContent(null);
    setLessonTitle("");
    setFormData(prev => ({ ...prev, passage: "", topic: "" }));
  };

  return (
    <div className="w-full px-4 sm:px-0">
      <Card className="w-full">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">Generate Lesson</CardTitle>
          <CardDescription className="text-sm">
            Enter a passage or topic to generate a lesson, or upload a file to enhance existing curriculum.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="grid w-full gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passage" className="text-sm">Bible Passage <span className="text-muted-foreground">(Optional)</span></Label>
                <Input
                  type="text"
                  id="passage"
                  placeholder="e.g., Romans 12:1-2"
                  value={formData.passage}
                  onChange={(e) => setFormData({ ...formData, passage: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="topic" className="text-sm">Lesson Topic <span className="text-muted-foreground">(Optional)</span></Label>
                <Input
                  type="text"
                  id="topic"
                  placeholder="e.g., Living Sacrifices"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <Label className="text-sm font-medium mb-2 block">
                Optional: Upload Existing Curriculum to Enhance
              </Label>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="upload" className="text-xs sm:text-sm">
                    <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Upload File</span>
                    <span className="xs:hidden">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="text-xs sm:text-sm">
                    <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Paste Text</span>
                    <span className="xs:hidden">Paste</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-2">
                  <div className="grid gap-2">
                    <Input
                      id="upload"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".txt,.pdf,.docx,.doc"
                      disabled={isExtracting}
                    />
                    {isExtracting && (
                      <div className="flex items-center space-x-2">
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        <span>{extractState === 'queued' ? 'Queued' : 'Processing'} ({extractProgress}%)</span>
                        <Progress value={extractProgress} className="w-1/2" />
                        <Button variant="ghost" size="sm" onClick={handleClearExtraction}>
                          Cancel
                        </Button>
                      </div>
                    )}
                    {extractError && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {extractError.msg}
                          <div className="flex space-x-2 mt-2">
                            <Button size="sm" onClick={handleRetryExtraction}>
                              Try Again
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleClearExtraction}>
                              Clear
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    {extractedContent && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          File uploaded: {sourceFilename}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={handleClearExtraction}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="paste">
                  <div className="grid gap-2">
                    <Label htmlFor="curriculum">Curriculum Content</Label>
                    <Textarea
                      id="curriculum"
                      placeholder="Paste your curriculum content here..."
                      rows={4}
                      value={extractedContent || ""}
                      onChange={(e) => setExtractedContent(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ageGroup" className="text-sm">Age Group</Label>
                <Select value={formData.ageGroup} onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}>
                  <SelectTrigger id="ageGroup" className="text-sm sm:text-base">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUP_OPTIONS.map(group => (
                      <SelectItem key={group} value={group}>
                        <div className="flex flex-col">
                          <span>{group}</span>
                          <span className="text-xs text-muted-foreground">{AGE_GROUP_DESCRIPTIONS[group]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bibleVersion" className="text-sm">Bible Version</Label>
                <Select value={formData.bibleVersion} onValueChange={(value) => setFormData({ ...formData, bibleVersion: value })}>
                  <SelectTrigger id="bibleVersion" className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIBLE_VERSIONS.map(version => (
                      <SelectItem key={version.id} value={version.id}>
                        {version.abbreviation} - {version.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="theologicalPreference" className="text-sm">Theological Preference</Label>
                <Select value={formData.theologicalPreference} onValueChange={(value) => setFormData({ ...formData, theologicalPreference: value as 'southern_baptist' | 'reformed_baptist' | 'independent_baptist' })}>
                  <SelectTrigger id="theologicalPreference" className="text-sm sm:text-base">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="southern_baptist">Southern Baptist</SelectItem>
                    <SelectItem value="reformed_baptist">Reformed Baptist</SelectItem>
                    <SelectItem value="independent_baptist">Independent Baptist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.theologicalPreference === 'southern_baptist' && (
              <div>
                <Label htmlFor="sbConfessionVersion">BFM Version</Label>
                <RadioGroup
                  defaultValue={formData.sbConfessionVersion}
                  onValueChange={(value) => setFormData({ ...formData, sbConfessionVersion: value as 'bfm_1963' | 'bfm_2000' })}
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

            <Button 
              type="submit" 
              disabled={isGenerating || !isFormValid()} 
              className="w-full sm:w-auto" 
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden xs:inline">Generating...</span>
                  <span className="xs:hidden">...</span>
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
          </form>
        </CardContent>
      </Card>

      {enhancedResult && generatedContent && (
        <Card className="w-full mt-4">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl">
              {extractedContent ? "Enhanced Lesson" : "Generated Lesson"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Full Content</h2>
              <pre className="whitespace-pre-wrap">{generatedContent.fullContent}</pre>
            </div>
          </CardContent>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 p-4 sm:p-6">
            <Button size="sm" onClick={handleSave} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleCopy} className="flex-1 sm:flex-none">
                <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Copy
              </Button>
              <Button size="sm" onClick={handlePrint} className="flex-1 sm:flex-none">
                <Printer className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Print
              </Button>
              <Button size="sm" onClick={handleDownload} className="flex-1 sm:flex-none">
                <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Download
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearForm} className="flex-1 sm:flex-none">
                Clear
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