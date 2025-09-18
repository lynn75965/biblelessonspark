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

interface EnhanceLessonFormProps {
  organizationId?: string;
  defaultAgeGroup?: string;
  defaultDoctrine?: string;
}

interface LessonContent {
  activities: Array<{
    title: string;
    duration_minutes: number;
    materials: string[];
    instructions: string;
  }>;
  discussion_prompts: string[];
  applications: string[];
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
      
      // Sanitize extracted content if present
      const sanitizedExtractedContent = extractedContent ? sanitizeLessonInput(extractedContent) : '';
      
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
      // Mock lesson generation - replace with actual API call
      setTimeout(() => {
        const mockContent: LessonContent = {
          activities: [
            {
              title: "Scripture Memory Game",
              duration_minutes: 10,
              materials: ["Index cards", "Markers"],
              instructions: `Write key verses on index cards. Have ${formData.ageGroup.toLowerCase()} take turns drawing cards and reciting the verses. For ${formData.ageGroup === 'Kids' ? 'younger children, use actions' : formData.ageGroup === 'Youth' ? 'teens, make it competitive' : 'adults, focus on application'}. This activity reinforces biblical truth through repetition and ${formData.doctrineProfile === 'SBC' ? 'Southern Baptist' : formData.doctrineProfile === 'RB' ? 'Reformed' : 'Independent Baptist'} theological emphasis.`
            },
            {
              title: "Discussion Circle Activity",
              duration_minutes: 15,
              materials: ["Discussion questions", "Bible"],
              instructions: `Form a circle and discuss how the passage applies to daily life. Use age-appropriate questions that encourage ${formData.ageGroup.toLowerCase()} to think deeply about God's Word. Include Baptist perspective on personal relationship with Jesus Christ.`
            },
            {
              title: "Creative Expression",
              duration_minutes: 20,
              materials: ["Art supplies", "Paper"],
              instructions: `Have participants create visual representations of the lesson theme. This works well for all ages and helps reinforce learning through multiple senses.`
            }
          ],
          discussion_prompts: [
            `How does this passage reflect Baptist beliefs about ${formData.doctrineProfile === 'SBC' ? 'soul competency and priesthood of believers' : formData.doctrineProfile === 'RB' ? 'God\'s sovereignty and grace' : 'local church autonomy and biblical authority'}?`,
            `What practical steps can ${formData.ageGroup.toLowerCase()} take this week to apply these biblical truths?`,
            `How might someone who doesn't know Jesus respond to this passage, and how can we share the gospel?`,
            `What does this text teach us about God's character and His love for us?`,
            `How can we encourage one another to live out these biblical principles in our daily lives?`
          ],
          applications: [
            `Daily devotional reading: Encourage ${formData.ageGroup.toLowerCase()} to read this passage each morning and pray about its application.`,
            `Service opportunity: Identify ways to serve others that reflect the passage's teachings about Christian love and compassion.`,
            `Scripture memorization: Help everyone memorize key verses that capture the main theme of today's lesson.`,
            `Family discussion: Provide take-home materials for families to continue the conversation at home.`,
            `Prayer focus: Establish specific prayer requests related to living out this passage in practical ways.`,
            `Baptist heritage connection: Discuss how this passage has influenced Baptist theology and practice throughout history.`
          ]
        };
        
        setGeneratedContent(mockContent);
        const title = enhancementType === "curriculum" 
          ? `Enhanced Curriculum: ${uploadedFile?.name || formData.passageOrTopic}`
          : `Generated Lesson: ${formData.passageOrTopic}`;
        setLessonTitle(title);
        setIsGenerating(false);
        
        toast({
          title: enhancementType === "curriculum" ? "Curriculum enhanced successfully!" : "Lesson generated successfully!",
          description: "Your Baptist-aligned lesson content is ready to review and save.",
        });
      }, 2000);
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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };

  const handlePrint = () => {
    window.print();
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
            <Tabs defaultValue="activities" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="discussion">Discussion Prompts</TabsTrigger>
                <TabsTrigger value="applications">Modern Applications</TabsTrigger>
              </TabsList>

              <TabsContent value="activities" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Age-Appropriate Activities</h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(JSON.stringify(generatedContent.activities, null, 2))}>
                    <Copy className="h-3 w-3" />
                    Copy All
                  </Button>
                </div>
                <div className="space-y-4">
                  {generatedContent.activities.map((activity, index) => (
                    <Card key={index} className="bg-accent/20">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{activity.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activity.duration_minutes} min
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => handleCopy(JSON.stringify(activity, null, 2))}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Materials Needed:</h4>
                          <div className="flex flex-wrap gap-1">
                            {activity.materials.map((material, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Instructions:</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {activity.instructions}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="discussion" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Discussion Prompts</h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(generatedContent.discussion_prompts.join('\n\n'))}>
                    <Copy className="h-3 w-3" />
                    Copy All
                  </Button>
                </div>
                <div className="space-y-3">
                  {generatedContent.discussion_prompts.map((prompt, index) => (
                    <Card key={index} className="bg-accent/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Question {index + 1}
                              </Badge>
                            </div>
                            <p className="text-sm leading-relaxed">{prompt}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(prompt)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="applications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Modern Applications</h3>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(generatedContent.applications.join('\n\n'))}>
                    <Copy className="h-3 w-3" />
                    Copy All
                  </Button>
                </div>
                <div className="space-y-3">
                  {generatedContent.applications.map((application, index) => (
                    <Card key={index} className="bg-accent/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Application {index + 1}
                              </Badge>
                            </div>
                            <p className="text-sm leading-relaxed">{application}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(application)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}