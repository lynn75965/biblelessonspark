import { useState } from "react";
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
import { Sparkles, Clock, Users, BookOpen, Copy, Download, Save, Printer, Upload, FileText, AlertTriangle } from "lucide-react";
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
  defaultAgeGroup?: string;
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
  defaultAgeGroup = "Young Adults", 
  defaultDoctrine = "SBC" 
}: EnhanceLessonFormProps) {
  const [enhancementType, setEnhancementType] = useState("curriculum");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState("");
  const [formData, setFormData] = useState({
    passageOrTopic: "",
    ageGroup: defaultAgeGroup,
    doctrineProfile: defaultDoctrine,
    notes: ""
  });
  
  const [teacherPreferences, setTeacherPreferences] = useState<TeacherPreferences>(defaultPreferences);
  const [showCustomization, setShowCustomization] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<Array<{ name: string; preferences: TeacherPreferences }>>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<LessonContent | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const { toast } = useToast();
  const { createLesson } = useLessons();
  const { user } = useAuth();
  const { trackEvent, trackLessonCreated } = useAnalytics();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validation = validateFileUpload(file);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      });
      logFileUploadEvent(user.id, file.name, file.size, false, { error: validation.error });
      e.target.value = ''; // Clear the input
      return;
    }

    // Sanitize filename
    const sanitizedName = sanitizeFileName(file.name);
    
    setUploadedFile(file);
    logFileUploadEvent(user.id, sanitizedName, file.size, true);
    
    // Mock content extraction with sanitization
    const mockExtractedContent = sanitizeLessonInput(`Extracted content from ${sanitizedName}:\n\nLesson Topic: The Good Samaritan\nScripture: Luke 10:25-37\n\nMain Points:\n1. Love your neighbor as yourself\n2. Show compassion to those in need\n3. Actions speak louder than words\n\nActivity Ideas:\n- Role play the parable\n- Discuss what it means to be a neighbor`);
    
    setExtractedContent(mockExtractedContent);
    setFormData(prev => ({ ...prev, passageOrTopic: "Luke 10:25-37 - The Good Samaritan" }));
    
    toast({
      title: "File uploaded successfully",
      description: `${sanitizedName} has been processed and content extracted.`,
    });
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

    setIsGenerating(true);

    try {
      // Sanitize extracted content if present
      const sanitizedExtractedContent = extractedContent ? sanitizeLessonInput(extractedContent) : '';
      
      // Get auth token
      const { data: { session } } = await (await import('@/integrations/supabase/client')).supabase.auth.getSession();
      const authToken = session?.access_token;
      
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Call the comprehensive lesson generation API
      const response = await fetch(`https://csdtqqddtoureffhtuuz.supabase.co/functions/v1/generate-lesson`, {
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
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setGeneratedContent(result.content);
        setLessonTitle(result.title);
        setIsGenerating(false);
        
        toast({
          title: enhancementType === "curriculum" ? "Curriculum enhanced successfully!" : "Lesson generated successfully!",
          description: "Your comprehensive lesson content is ready to review and save.",
        });
      } else {
        throw new Error(result.error || 'Failed to generate lesson');
      }
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Enhancement failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!generatedContent || !user) {
      toast({
        title: "Cannot save lesson",
        description: "Please generate content first and ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    const lessonData = {
      title: lessonTitle,
      original_text: extractedContent || formData.passageOrTopic,
      source_type: enhancementType,
      organization_id: organizationId,
      filters: {
        age_group: formData.ageGroup,
        doctrine_profile: formData.doctrineProfile,
        passage_or_topic: formData.passageOrTopic,
        notes: formData.notes,
        generated_content: generatedContent
      }
    };

    const result = await createLesson(lessonData);
    if (result.error) {
      toast({
        title: "Error saving lesson",
        description: "Failed to save your lesson. Please try again.",
        variant: "destructive",
      });
    } else {
      // Track successful lesson creation
      trackLessonCreated(result.data?.id || '', {
        enhancementType,
        ageGroup: formData.ageGroup,
        doctrineProfile: formData.doctrineProfile
      });
      
      toast({
        title: "Lesson saved successfully!",
        description: "Your lesson has been added to your library.",
      });
    }
  };

  const handleCopy = (content?: string) => {
    const textToCopy = content || generatedContent?.fullContent || 'No content to copy';
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveProfile = (preferences: TeacherPreferences, profileName: string) => {
    setSavedProfiles(prev => [...prev.filter(p => p.name !== profileName), { name: profileName, preferences }]);
    setTeacherPreferences(preferences);
  };

  const handleLoadProfile = (preferences: TeacherPreferences) => {
    setTeacherPreferences(preferences);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Enhancement Form */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Enhance Your Lesson</CardTitle>
              <CardDescription>
                Generate Baptist-aligned activities, discussion prompts, and applications for your Bible study
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Enhancement Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Choose Your Enhancement Type</Label>
              <RadioGroup 
                value={enhancementType} 
                onValueChange={setEnhancementType}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent">
                  <RadioGroupItem value="curriculum" id="curriculum" />
                  <div className="flex-1">
                    <Label htmlFor="curriculum" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Option 1: Curriculum Enhancement</div>
                        <div className="text-sm text-muted-foreground">Upload existing lesson materials to enhance and adapt</div>
                      </div>
                    </Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent">
                  <RadioGroupItem value="generation" id="generation" />
                  <div className="flex-1">
                    <Label htmlFor="generation" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Option 2: Lesson Generation</div>
                        <div className="text-sm text-muted-foreground">Create new lessons from scripture passages or topics</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Curriculum Enhancement Option */}
            {enhancementType === "curriculum" && (
              <div className="space-y-4 border rounded-lg p-4 bg-accent/5">
                 <div className="space-y-2">
                   <Label htmlFor="file-upload">Upload Curriculum File or Photo</Label>
                   <Input
                     id="file-upload"
                     type="file"
                     accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.gif,.webp"
                     onChange={handleFileUpload}
                     className="cursor-pointer"
                     disabled={isProcessing}
                   />
                   <div className="text-xs text-muted-foreground">
                     Supported formats: PDF, Word documents, Text files, JPG/PNG photos of curriculum materials (Max 10 MB)
                   </div>
                   <Alert>
                     <AlertTriangle className="h-4 w-4" />
                     <AlertDescription>
                       Only upload files from trusted sources. Files are automatically scanned for security.
                       {isProcessing && " Processing file, please wait..."}
                     </AlertDescription>
                   </Alert>
                 </div>
                
                {extractedContent && (
                  <div className="space-y-2">
                    <Label>Extracted Content Preview</Label>
                    <Textarea
                      value={extractedContent}
                      onChange={(e) => setExtractedContent(e.target.value)}
                      className="min-h-[120px]"
                      placeholder="Content will be extracted from your uploaded file..."
                    />
                     <div className="text-xs text-muted-foreground">
                       Review and edit the extracted content before enhancement
                       {uploadedFile && isImageFile(uploadedFile) && " (extracted using OCR from image)"}
                     </div>
                  </div>
                )}
              </div>
            )}

            {/* Lesson Generation Option */}
            {enhancementType === "generation" && (
              <div className="space-y-2 border rounded-lg p-4 bg-accent/5">
                <Label htmlFor="passage">Scripture Passage or Topic</Label>
                <Input
                  id="passage"
                  placeholder="e.g., John 3:16-21 or Salvation by Grace"
                  value={formData.passageOrTopic}
                  onChange={(e) => setFormData(prev => ({...prev, passageOrTopic: e.target.value}))}
                />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Age Group */}
              <div className="space-y-2">
                <Label htmlFor="age-group">Age Group</Label>
                <Select value={formData.ageGroup} onValueChange={(value) => setFormData(prev => ({...prev, ageGroup: value}))}>
                  <SelectTrigger id="age-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preschoolers">Preschoolers (Ages 3-5)</SelectItem>
                    <SelectItem value="Elementary">Elementary (Ages 6-12)</SelectItem>
                    <SelectItem value="Middle School">Middle School (Ages 11-14)</SelectItem>
                    <SelectItem value="High School">High School (Ages 15-18)</SelectItem>
                    <SelectItem value="College & Career">College & Career (Ages 19-25)</SelectItem>
                    <SelectItem value="Young Adults">Young Adults (Ages 26-35)</SelectItem>
                    <SelectItem value="Mid-Life Adults">Mid-Life Adults (Ages 36-50)</SelectItem>
                    <SelectItem value="Mature Adults">Mature Adults (Ages 51-65)</SelectItem>
                    <SelectItem value="Active Seniors">Active Seniors (Ages 66-75)</SelectItem>
                    <SelectItem value="Senior Adults">Senior Adults (Ages 76+)</SelectItem>
                    <SelectItem value="Mixed Groups">Mixed Groups (Multi-generational)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Doctrine Profile */}
              <div className="space-y-2">
                <Label htmlFor="doctrine">Doctrinal Profile</Label>
                <Select value={formData.doctrineProfile} onValueChange={(value) => setFormData(prev => ({...prev, doctrineProfile: value}))}>
                  <SelectTrigger id="doctrine">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SBC">Southern Baptist Convention</SelectItem>
                    <SelectItem value="RB">Reformed Baptist</SelectItem>
                    <SelectItem value="IND">Independent Baptist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teacher Customization Toggle */}
            <div className="space-y-4 border rounded-lg p-4 bg-accent/5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Teacher Customization</Label>
                  <p className="text-sm text-muted-foreground">Configure detailed preferences for personalized lesson generation</p>
                </div>
                <Button
                  type="button"
                  variant={showCustomization ? "default" : "outline"}
                  onClick={() => setShowCustomization(!showCustomization)}
                >
                  {showCustomization ? "Hide" : "Customize"}
                </Button>
              </div>
              
              {showCustomization && (
                <TeacherCustomization
                  preferences={teacherPreferences}
                  onPreferencesChange={setTeacherPreferences}
                  onSaveProfile={handleSaveProfile}
                  savedProfiles={savedProfiles}
                  onLoadProfile={handleLoadProfile}
                />
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Special focus areas, class dynamics, or specific needs..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                💡 <strong>Coming in Pro:</strong> Advanced filters for Bible knowledge level, study focus, class duration, and teaching style preferences
              </p>
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              disabled={isGenerating || isProcessing || (enhancementType === "generation" && !formData.passageOrTopic)}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Processing File...
                </>
              ) : isGenerating ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  {enhancementType === "curriculum" ? "Enhancing Curriculum..." : "Generating Lesson..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {enhancementType === "curriculum" ? "Enhance Curriculum" : "Generate Lesson"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent && (
        <Card className="bg-gradient-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {lessonTitle}
                </CardTitle>
                <CardDescription>
                  Enhanced for {formData.ageGroup} • {formData.doctrineProfile} Doctrine
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="teaching">Teaching</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="full">Full Lesson</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-4">
                  {generatedContent.overview && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Lesson Overview</h3>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed">{generatedContent.overview}</p>
                      </div>
                    </Card>
                  )}
                  
                  {generatedContent.objectives && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Learning Objectives</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.objectives}</div>
                      </div>
                    </Card>
                  )}
                  
                  {generatedContent.scripture && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Key Scripture</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.scripture}</div>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="teaching" className="space-y-4">
                <div className="space-y-4">
                  {generatedContent.background && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Theological Background</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.background}</div>
                      </div>
                    </Card>
                  )}
                  
                  {generatedContent.teaching && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Main Teaching Content</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.teaching}</div>
                      </div>
                    </Card>
                  )}
                  
                  {generatedContent.opening && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Opening Activities</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.opening}</div>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="activities" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Interactive Activities</h3>
                  <div className="prose prose-sm max-w-none">
                    {generatedContent.activities ? (
                      <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.activities}</div>
                    ) : generatedContent.activities_legacy?.length ? (
                      <div className="space-y-4">
                        {generatedContent.activities_legacy.map((activity, index) => (
                          <div key={index} className="border-l-4 border-primary pl-4">
                            <h4 className="font-medium text-lg mb-2">{activity.title}</h4>
                            {activity.duration_minutes && (
                              <p className="text-sm text-muted-foreground mb-2">
                                Duration: {activity.duration_minutes} minutes
                              </p>
                            )}
                            {activity.materials && activity.materials.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium mb-1">Materials needed:</p>
                                <ul className="text-sm list-disc list-inside text-muted-foreground">
                                  {activity.materials.map((material, i) => (
                                    <li key={i}>{material}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <p className="text-sm leading-relaxed">{activity.instructions}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No activities generated.</p>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="discussion" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Discussion Questions</h3>
                  <div className="prose prose-sm max-w-none">
                    {generatedContent.discussion ? (
                      <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.discussion}</div>
                    ) : generatedContent.discussion_prompts?.length ? (
                      <div className="space-y-3">
                        {generatedContent.discussion_prompts.map((prompt, index) => (
                          <div key={index} className="border-l-4 border-primary pl-4">
                            <p className="text-sm leading-relaxed">{prompt}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No discussion questions generated.</p>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="applications" className="space-y-4">
                <div className="space-y-4">
                  {generatedContent.applications && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Life Applications</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.applications}</div>
                      </div>
                    </Card>
                  )}
                  
                  {generatedContent.assessment && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Assessment Methods</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.assessment}</div>
                      </div>
                    </Card>
                  )}
                  
                  {generatedContent.resources && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Take-Home Resources</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.resources}</div>
                      </div>
                    </Card>
                  )}
                  
                  {generatedContent.preparation && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Teacher Preparation</h3>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed">{generatedContent.preparation}</div>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="full" className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Complete Lesson Plan</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleCopy()}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy All
                      </Button>
                      <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none print:text-black">
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {generatedContent.fullContent || 'Complete lesson content not available.'}
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}