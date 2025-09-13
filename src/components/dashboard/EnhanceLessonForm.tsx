import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, Users, BookOpen, Copy, Download, Save, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  defaultAgeGroup = "Adults", 
  defaultDoctrine = "SBC" 
}: EnhanceLessonFormProps) {
  const [formData, setFormData] = useState({
    passageOrTopic: "",
    ageGroup: defaultAgeGroup,
    doctrineProfile: defaultDoctrine,
    notes: ""
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<LessonContent | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setLessonTitle(`${formData.passageOrTopic} - ${formData.ageGroup} Study`);
        setIsGenerating(false);
        
        toast({
          title: "Lesson enhanced successfully!",
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

  const handleSave = () => {
    // Save to lessons table
    toast({
      title: "Lesson saved!",
      description: "Your lesson has been saved to your library.",
    });
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* Passage/Topic */}
              <div className="space-y-2">
                <Label htmlFor="passage">Scripture Passage or Topic</Label>
                <Input
                  id="passage"
                  placeholder="e.g., John 3:16-21 or Salvation by Grace"
                  value={formData.passageOrTopic}
                  onChange={(e) => setFormData(prev => ({...prev, passageOrTopic: e.target.value}))}
                  required
                />
              </div>

              {/* Age Group */}
              <div className="space-y-2">
                <Label htmlFor="age-group">Age Group</Label>
                <Select value={formData.ageGroup} onValueChange={(value) => setFormData(prev => ({...prev, ageGroup: value}))}>
                  <SelectTrigger id="age-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kids">Kids (5-12)</SelectItem>
                    <SelectItem value="Youth">Youth (13-18)</SelectItem>
                    <SelectItem value="Adults">Adults (19-64)</SelectItem>
                    <SelectItem value="Seniors">Seniors (65+)</SelectItem>
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
              </div>
            </div>

            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              disabled={isGenerating || !formData.passageOrTopic}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Generating Baptist-Aligned Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enhance Lesson
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
                  <Badge variant="outline">{generatedContent.activities.length} activities</Badge>
                </div>
                
                <div className="space-y-4">
                  {generatedContent.activities.map((activity, index) => (
                    <Card key={index} className="border border-border/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{activity.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3" />
                              {activity.duration_minutes} min
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleCopy(`${activity.title}\n\nMaterials: ${activity.materials.join(', ')}\n\nInstructions: ${activity.instructions}`)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Materials needed:</p>
                          <p className="text-sm text-muted-foreground">{activity.materials.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Instructions:</p>
                          <p className="text-sm text-muted-foreground">{activity.instructions}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="discussion" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Discussion Prompts</h3>
                  <Badge variant="outline">{generatedContent.discussion_prompts.length} prompts</Badge>
                </div>
                
                <div className="space-y-3">
                  {generatedContent.discussion_prompts.map((prompt, index) => (
                    <Card key={index} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-muted-foreground flex-1">{prompt}</p>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopy(prompt)}
                          >
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
                  <Badge variant="outline">{generatedContent.applications.length} applications</Badge>
                </div>
                
                <div className="space-y-3">
                  {generatedContent.applications.map((application, index) => (
                    <Card key={index} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-muted-foreground flex-1">{application}</p>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopy(application)}
                          >
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