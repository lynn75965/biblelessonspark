import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Clock, Users, BookOpen, Copy, Download, Save, Printer, Upload, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLessons } from "@/hooks/useLessons";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { validateFileUpload, lessonFormSchema, type LessonFormData, isImageFile } from "@/lib/fileValidation";
import { sanitizeLessonInput, sanitizeFileName } from "@/lib/inputSanitization";
import { logFileUploadEvent, logLessonEvent } from "@/lib/auditLogger";
import { TeacherCustomization, type TeacherPreferences, defaultPreferences } from "./TeacherCustomization";

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
  // Legacy support
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
  userPreferredAgeGroup = "Young Adults", 
  defaultDoctrine = "SBC" 
}: EnhanceLessonFormProps) {
  const [enhancementType, setEnhancementType] = useState("curriculum");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Session and upload tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [enhancementJobId, setEnhancementJobId] = useState<string | null>(null);
  
  const [extractedContent, setExtractedContent] = useState("");
  const [extractedTopic, setExtractedTopic] = useState<string | null>(null);
  const [extractedScripture, setExtractedScripture] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<"idle" | "processing" | "complete">("idle");
  
  const [formData, setFormData] = useState({
    passageOrTopic: "",
    ageGroup: userPreferredAgeGroup,
    doctrineProfile: defaultDoctrine,
    notes: "",
    theologicalPreference: "southern_baptist" as 'southern_baptist' | 'reformed_baptist' | 'independent_baptist',
    sbConfessionVersion: "bfm_2000" as 'bfm_1963' | 'bfm_2000'
  });
  
  const [rememberConfessionChoice, setRememberConfessionChoice] = useState(false);
  
  const [teacherPreferences, setTeacherPreferences] = useState<TeacherPreferences>(defaultPreferences);
  const [showCustomization, setShowCustomization] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<Array<{ name: string; preferences: TeacherPreferences }>>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<LessonContent | null>(null);
  const [enhancedResult, setEnhancedResult] = useState<any | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const { toast } = useToast();
  const { createLesson } = useLessons();
  const { user } = useAuth();
  const { trackEvent, trackLessonCreated } = useAnalytics();
  
  // Fetch saved confession version from profile on mount
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Generate unique session and upload IDs - clear ALL previous state
    const newSessionId = crypto.randomUUID();
    const newUploadId = crypto.randomUUID();
    setSessionId(newSessionId);
    setUploadId(newUploadId);
    setEnhancementJobId(null);
    setEnhancedResult(null);
    setExtractedContent("");
    setExtractedTopic(null);
    setExtractedScripture(null);
    setSourceFile(null);
    setExtractionStatus("processing");
    setUploadedFile(null);
    setFormData(prev => ({ ...prev, passageOrTopic: "" }));
    setGeneratedContent(null);

    // Validate file
    const validation = validateFileUpload(file);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      logFileUploadEvent(user.id, file.name, file.size, false, { error: validation.error });
      setExtractionStatus("idle");
      e.target.value = '';
      return;
    }

    // Sanitize filename
    const sanitizedName = sanitizeFileName(file.name);
    setUploadedFile(file);
    setSourceFile(sanitizedName);
    logFileUploadEvent(user.id, sanitizedName, file.size, true);

    console.log('UPLOAD_DONE', { sessionId: newSessionId, uploadId: newUploadId, sourceFile: sanitizedName });

    try {
      // For image files, use OCR
      if (isImageFile(file)) {
        const formData = new FormData();
        formData.append('image', file);

        const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
        const authToken = session?.access_token;

        const ocrResponse = await fetch(
          `https://csdtqqddtoureffhtuuz.supabase.co/functions/v1/ocr-image?ts=${Date.now()}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePath: `${user.id}/${newUploadId}/${sanitizedName}`,
              uploadId: newUploadId,
              sessionId: newSessionId,
            }),
            cache: 'no-store',
          }
        );

        if (!ocrResponse.ok) {
          throw new Error('OCR processing failed');
        }

        const ocrResult = await ocrResponse.json();
        
        console.log('EXTRACT_DONE', { 
          uploadId: ocrResult.uploadId, 
          sessionId: ocrResult.sessionId, 
          sourceFile: ocrResult.sourceFile 
        });

        // Race condition guard: only update if this is still the current upload
        if (newUploadId === uploadId && newSessionId === sessionId) {
          const extractedText = sanitizeLessonInput(ocrResult.text || '');
          
          // Parse topic and scripture from extracted text
          const topicMatch = extractedText.match(/(?:Topic|Lesson|Title):\s*(.+?)(?:\n|$)/i);
          const scriptureMatch = extractedText.match(/(?:Scripture|Passage|Reference):\s*(.+?)(?:\n|$)/i);
          
          setExtractedContent(extractedText);
          setExtractedTopic(topicMatch ? topicMatch[1].trim() : null);
          setExtractedScripture(scriptureMatch ? scriptureMatch[1].trim() : null);
          
          if (scriptureMatch) {
            setFormData(prev => ({ ...prev, passageOrTopic: scriptureMatch[1].trim() }));
          }
        }
      } else {
        // For text files, read directly
        const reader = new FileReader();
        reader.onload = (event) => {
          // Race condition guard
          if (newUploadId !== uploadId || newSessionId !== sessionId) return;

          const text = event.target?.result as string;
          const sanitizedText = sanitizeLessonInput(text);
          
          // Parse topic and scripture
          const topicMatch = sanitizedText.match(/(?:Topic|Lesson|Title):\s*(.+?)(?:\n|$)/i);
          const scriptureMatch = sanitizedText.match(/(?:Scripture|Passage|Reference):\s*(.+?)(?:\n|$)/i);
          
          setExtractedContent(sanitizedText);
          setExtractedTopic(topicMatch ? topicMatch[1].trim() : null);
          setExtractedScripture(scriptureMatch ? scriptureMatch[1].trim() : null);
          
          if (scriptureMatch) {
            setFormData(prev => ({ ...prev, passageOrTopic: scriptureMatch[1].trim() }));
          }
          
          setExtractionStatus("complete");
        };
        reader.readAsText(file);
        return; // Exit early for text files
      }

      setExtractionStatus("complete");
      
      toast({
        title: "File processed successfully",
        description: `${sanitizedName} has been extracted.`,
      });
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractionStatus("idle");
      toast({
        title: "Extraction failed",
        description: "Could not extract content from the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !sessionId || !uploadId) {
      toast({
        title: "Authentication required",
        description: "Please sign in and upload a file to generate lessons",
        variant: "destructive",
      });
      return;
    }

    // Validate form data with Zod
    try {
      const validatedData = lessonFormSchema.parse({
        passageOrTopic: formData.passageOrTopic,
        ageGroup: formData.ageGroup,
        doctrineProfile: formData.doctrineProfile,
        notes: formData.notes,
      });

      // Additional validation for curriculum enhancement
      if (enhancementType === "curriculum" && !uploadedFile && !extractedContent) {
        toast({
          title: "Missing Curriculum",
          description: "Please upload a curriculum file to enhance",
          variant: "destructive",
        });
        return;
      }
      
      if (enhancementType === "generation" && !validatedData.passageOrTopic.trim()) {
        toast({
          title: "Missing Information", 
          description: "Please enter a scripture passage or topic",
          variant: "destructive",
        });
        return;
      }

      setIsGenerating(true);
      setEnhancedResult(null); // Clear previous result
      
      // Log lesson generation attempt
      logLessonEvent('create', user.id, undefined, {
        enhancementType,
        ageGroup: validatedData.ageGroup,
        doctrineProfile: validatedData.doctrineProfile,
        hasFile: !!uploadedFile,
      });

    } catch (validationError: any) {
      toast({
        title: "Invalid input",
        description: validationError.errors?.[0]?.message || "Please check your input and try again",
        variant: "destructive",
      });
      return;
    }

    try {
      // Sanitize extracted content if present
      const sanitizedExtractedContent = extractedContent ? sanitizeLessonInput(extractedContent) : '';
      
      // Get auth token
      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      const authToken = session?.access_token;
      
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Call the comprehensive lesson generation API with cache busting and session tracking
      const response = await fetch(`https://csdtqqddtoureffhtuuz.supabase.co/functions/v1/generate-lesson?ts=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          passageOrTopic: formData.passageOrTopic,
          ageGroup: formData.ageGroup,
          doctrineProfile: formData.doctrineProfile,
          notes: formData.notes,
          enhancementType,
          extractedContent: sanitizedExtractedContent,
          teacherPreferences,
          theologicalPreference: formData.theologicalPreference,
          sbConfessionVersion: formData.sbConfessionVersion,
          // Session tracking
          sessionId,
          uploadId,
          sourceFile,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('ENHANCE_STARTED', { 
        jobId: result?.lesson?.id, 
        uploadId: result?.uploadId, 
        sessionId: result?.sessionId 
      });

      // Race-proof: Only set result if IDs match current session
      if (result.sessionId === sessionId && result.uploadId === uploadId) {
        if (result.success) {
          setGeneratedContent(result.output?.teacher_plan);
          setLessonTitle(result.lesson?.title || '');
          setEnhancementJobId(result.lesson?.id);
          setEnhancedResult({
            ...result,
            sessionId: result.sessionId,
            uploadId: result.uploadId,
          });

          console.log('ENHANCE_RESULT', {
            jobId: result.lesson?.id,
            uploadId: result.uploadId,
            sessionId: result.sessionId,
            source: sourceFile,
          });
          
          // Save confession version to profile if checkbox is checked
          if (rememberConfessionChoice && formData.theologicalPreference === 'southern_baptist') {
            const { supabase } = await import('@/integrations/supabase/client');
            await supabase
              .from('profiles')
              .update({ sb_confession_version: formData.sbConfessionVersion })
              .eq('id', user.id);
          }
          
          toast({
            title: enhancementType === "curriculum" ? "Curriculum enhanced successfully!" : "Lesson generated successfully!",
            description: "Your comprehensive lesson content is ready to review and save.",
          });
        } else {
          throw new Error(result.error || 'Failed to generate lesson');
        }
      } else {
        console.warn('Stale response ignored', { 
          responseSession: result?.sessionId, 
          currentSession: sessionId 
        });
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement failed",
        description: error.message || "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !generatedContent) {
      toast({
        title: "Save Failed",
        description: "You must be logged in to save lessons.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: savedLesson } = await createLesson({
        title: lessonTitle || "Enhanced Lesson",
        original_text: extractedContent || formData.passageOrTopic,
        source_type: enhancementType,
        organization_id: organizationId,
        filters: {
          ...formData,
          sessionId,
          uploadId,
          sourceFile,
        }
      });

      if (savedLesson?.id) {
        trackLessonCreated(savedLesson.id, {});
      }

      toast({
        title: "Lesson Saved",
        description: "Your enhanced lesson has been saved to your library.",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent?.fullContent) {
      toast({
        title: "Copy Failed",
        description: "No content to copy.",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard
      .writeText(generatedContent.fullContent)
      .then(() => {
        toast({
          title: "Content Copied",
          description: "The lesson content has been copied to your clipboard.",
        });
        trackEvent("lesson_copied");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Copy Failed",
          description: "Failed to copy content to clipboard.",
          variant: "destructive",
        });
      });
  };

  const handlePrint = () => {
    if (!generatedContent?.fullContent) {
      toast({
        title: "Print Failed",
        description: "No content to print.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Lesson</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              h1 { font-size: 24px; margin-bottom: 20px; }
              h2 { font-size: 20px; margin-top: 30px; margin-bottom: 10px; }
              p { font-size: 16px; margin-bottom: 10px; }
              /* Add more styles as needed */
            </style>
          </head>
          <body>
            <h1>Enhanced Lesson</h1>
            <div>${generatedContent.fullContent}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      trackEvent("lesson_printed");
    } else {
      toast({
        title: "Print Failed",
        description: "Failed to open print window. Please check your browser settings.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!generatedContent?.fullContent) {
      toast({
        title: "Download Failed",
        description: "No content to download.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([generatedContent.fullContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lessonTitle || "enhanced_lesson"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    trackEvent("lesson_downloaded");
  };

  const handleClearForm = () => {
    setUploadedFile(null);
    setSessionId(null);
    setUploadId(null);
    setEnhancementJobId(null);
    setEnhancedResult(null);
    setExtractedContent("");
    setExtractedTopic(null);
    setExtractedScripture(null);
    setSourceFile(null);
    setExtractionStatus("idle");
    setFormData({
      passageOrTopic: "",
      ageGroup: userPreferredAgeGroup,
      doctrineProfile: defaultDoctrine,
      notes: "",
      theologicalPreference: "southern_baptist",
      sbConfessionVersion: "bfm_2000"
    });
    setGeneratedContent(null);
    setLessonTitle("");
    
    // Also reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Log verification marker
  React.useEffect(() => {
    console.log("✅ VERIFIED_BUILD: enhancement bound to current uploadId/sessionId");
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle>Enhance Your Lesson</CardTitle>
          <CardDescription>
            Upload a curriculum file to enhance with Baptist-aligned activities and applications
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <Label htmlFor="file-upload">Upload Curriculum File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={isProcessing || isGenerating}
              />
              
              {/* Debug instrumentation */}
              {sessionId && uploadId && (
                <div className="text-xs text-muted-foreground/60 mt-1 font-mono">
                  UI sessionId: {sessionId.slice(0, 8)}... | uploadId: {uploadId.slice(0, 8)}...
                  {enhancementJobId && ` | jobId: ${enhancementJobId.slice(0, 8)}...`}
                  {sourceFile && ` | source: ${sourceFile}`}
                </div>
              )}
              
              {/* Extraction Preview */}
              {extractionStatus === "processing" && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing file...</span>
                  </div>
                </div>
              )}
              
              {extractionStatus === "complete" && extractedContent && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Extracted Content Preview</div>
                    {sourceFile && (
                      <Badge variant="outline" className="text-xs">
                        {sourceFile}
                      </Badge>
                    )}
                  </div>
                  {extractedTopic && (
                    <div className="text-sm">
                      <span className="font-medium">Topic:</span> {extractedTopic}
                    </div>
                  )}
                  {extractedScripture && (
                    <div className="text-sm">
                      <span className="font-medium">Scripture:</span> {extractedScripture}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-2">
                    {extractedContent.slice(0, 200)}...
                  </div>
                </div>
              )}
            </div>

            {/* Enhancement Type */}
            <div className="space-y-2">
              <Label>Enhancement Type</Label>
              <Tabs defaultValue="curriculum" className="w-full" onValueChange={(value) => setEnhancementType(value)}>
                <TabsList>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="generation">Generation</TabsTrigger>
                </TabsList>
                <TabsContent value="curriculum">
                  Enhance an existing curriculum file.
                </TabsContent>
                <TabsContent value="generation">
                  Generate a new lesson plan from scratch.
                </TabsContent>
              </Tabs>
            </div>

            {/* Passage or Topic */}
            <div className="space-y-2">
              <Label htmlFor="passageOrTopic">
                {enhancementType === "curriculum" ? "Scripture Passage" : "Scripture Passage or Topic"}
              </Label>
              <Input
                id="passageOrTopic"
                type="text"
                placeholder="e.g., John 3:16 or The Good Shepherd"
                value={formData.passageOrTopic}
                onChange={(e) => setFormData({ ...formData, passageOrTopic: e.target.value })}
                disabled={isGenerating}
              />
            </div>

            {/* Age Group */}
            <div className="space-y-2">
              <Label htmlFor="ageGroup">Age Group</Label>
              <Select value={formData.ageGroup} onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}>
                <SelectTrigger id="ageGroup">
                  <SelectValue placeholder="Select an age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preschoolers">Preschoolers (3-5)</SelectItem>
                  <SelectItem value="Elementary">Elementary (6-11)</SelectItem>
                  <SelectItem value="Middle School">Middle School (12-14)</SelectItem>
                  <SelectItem value="High School">High School (15-18)</SelectItem>
                  <SelectItem value="College & Career">College & Career (18-25)</SelectItem>
                  <SelectItem value="Young Adults">Young Adults (26-35)</SelectItem>
                  <SelectItem value="Mid-Life Adults">Mid-Life Adults (36-55)</SelectItem>
                  <SelectItem value="Mature Adults">Mature Adults (56-70)</SelectItem>
                  <SelectItem value="Active Seniors">Active Seniors (70+)</SelectItem>
                  <SelectItem value="Senior Adults">Senior Adults (70+)</SelectItem>
                  <SelectItem value="Mixed Groups">Mixed Groups (Multi-generational)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Doctrine Profile */}
            <div className="space-y-2">
              <Label>Doctrine Profile</Label>
              <RadioGroup defaultValue={formData.doctrineProfile} onValueChange={(value) => setFormData({ ...formData, doctrineProfile: value })} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SBC" id="sbc" className="bg-secondary" />
                  <Label htmlFor="sbc">Southern Baptist Convention</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RB" id="rb" className="bg-secondary" />
                  <Label htmlFor="rb">Regular Baptist</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="IND" id="ind" className="bg-secondary" />
                  <Label htmlFor="ind">Independent Baptist</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Theological Preference */}
            <div className="space-y-2">
              <Label>Theological Lens</Label>
              <Select value={formData.theologicalPreference} onValueChange={(value) => setFormData({ ...formData, theologicalPreference: value as 'southern_baptist' | 'reformed_baptist' | 'independent_baptist' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a theological lens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="southern_baptist">Southern Baptist</SelectItem>
                  <SelectItem value="reformed_baptist">Reformed Baptist</SelectItem>
                  <SelectItem value="independent_baptist">Independent Baptist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Southern Baptist Confession Version */}
            {formData.theologicalPreference === "southern_baptist" && (
              <div className="space-y-2">
                <Label>Southern Baptist Confession Version</Label>
                <Select value={formData.sbConfessionVersion} onValueChange={(value) => setFormData({ ...formData, sbConfessionVersion: value as 'bfm_1963' | 'bfm_2000' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a confession version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bfm_1963">Baptist Faith & Message 1963</SelectItem>
                    <SelectItem value="bfm_2000">Baptist Faith & Message 2000</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2 mt-2">
                  <Input type="checkbox" id="rememberConfession" checked={rememberConfessionChoice} onChange={(e) => setRememberConfessionChoice(e.target.checked)} className="h-4 w-4" />
                  <Label htmlFor="rememberConfession" className="text-sm">Remember this choice for future lessons</Label>
                </div>
              </div>
            )}

            {/* Teacher Customization */}
            <div className="space-y-2">
              <Label>Teacher Customization</Label>
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowCustomization(!showCustomization)}>
                <Users className="mr-2 h-4 w-4" />
                {showCustomization ? "Hide Customization" : "Show Customization"}
              </Button>
              {showCustomization && (
                <TeacherCustomization
                  preferences={teacherPreferences}
                  onPreferencesChange={setTeacherPreferences}
                />
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any specific instructions or requirements for the lesson"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isGenerating}
              />
            </div>

            <Button 
              type="submit" 
              disabled={
                isGenerating || 
                !formData.passageOrTopic || 
                (enhancementType === 'curriculum' && !extractedContent) ||
                (enhancementType === 'curriculum' && extractionStatus === 'processing') ||
                !sessionId ||
                !uploadId
              }
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enhance Curriculum
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Enhanced Lesson Result Card - only show if IDs match */}
      {enhancedResult && 
       enhancedResult.sessionId === sessionId && 
       enhancedResult.uploadId === uploadId && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {extractedTopic ? `Enhanced Lesson: ${extractedTopic}` : 'Enhanced Lesson'}
            </CardTitle>
            {extractedScripture && (
              <p className="text-sm text-muted-foreground">
                {extractedScripture}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">
              Source: {sourceFile}
            </div>
            <p className="text-sm">
              Your enhanced lesson has been generated and saved to your library.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Show waiting state if processing */}
      {isGenerating && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for current enhancement...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
