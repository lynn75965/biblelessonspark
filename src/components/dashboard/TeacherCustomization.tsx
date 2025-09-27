import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Users, 
  Clock, 
  Building2, 
  BookOpen, 
  Brain, 
  Target, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw
} from "lucide-react";

export interface TeacherPreferences {
  // Teacher Profile
  teachingStyle: string;
  classroomManagement: string;
  techIntegration: string;
  assessmentPreference: string;
  
  // Class Context
  classSize: string;
  meetingFrequency: string;
  sessionDuration: string;
  physicalSpace: string;
  specialNeeds: string[];
  
  // Pedagogical Preferences  
  learningStyles: string[];
  engagementLevel: string;
  discussionFormat: string;
  activityComplexity: string;
  
  // Theological Customization
  bibleTranslation: string;
  theologicalEmphasis: string;
  applicationFocus: string;
  depthLevel: string;
  
  // Resource Preferences
  handoutStyle: string;
  visualAidPreference: string;
  takehomeMaterials: string[];
  preparationTime: string;
  
  // Cultural Context
  culturalBackground: string;
  socioeconomicContext: string;
  educationalBackground: string;
  spiritualMaturity: string;
  
  // Custom Notes
  additionalContext: string;
}

interface TeacherCustomizationProps {
  preferences: TeacherPreferences;
  onPreferencesChange: (preferences: TeacherPreferences) => void;
  onSaveProfile?: (preferences: TeacherPreferences, profileName: string) => void;
  savedProfiles?: Array<{ name: string; preferences: TeacherPreferences }>;
  onLoadProfile?: (preferences: TeacherPreferences) => void;
}

const defaultPreferences: TeacherPreferences = {
  teachingStyle: "mixed",
  classroomManagement: "relaxed_interactive",
  techIntegration: "medium",
  assessmentPreference: "informal_discussion",
  classSize: "medium",
  meetingFrequency: "weekly",
  sessionDuration: "60min",
  physicalSpace: "traditional_classroom",
  specialNeeds: [],
  learningStyles: ["visual", "auditory"],
  engagementLevel: "highly_interactive",
  discussionFormat: "small_groups",
  activityComplexity: "moderate",
  bibleTranslation: "ESV",
  theologicalEmphasis: "expository",
  applicationFocus: "personal_growth",
  depthLevel: "detailed_study",
  handoutStyle: "detailed_notes",
  visualAidPreference: "basic_graphics",
  takehomeMaterials: ["summary_sheets", "reflection_questions"],
  preparationTime: "moderate",
  culturalBackground: "suburban",
  socioeconomicContext: "mixed",
  educationalBackground: "mixed",
  spiritualMaturity: "mixed",
  additionalContext: ""
};

export function TeacherCustomization({
  preferences,
  onPreferencesChange,
  onSaveProfile,
  savedProfiles = [],
  onLoadProfile
}: TeacherCustomizationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileName, setProfileName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const steps = [
    { id: "teacher", title: "Teaching Style", icon: User },
    { id: "class", title: "Class Context", icon: Users },
    { id: "pedagogy", title: "Pedagogy", icon: Brain },
    { id: "theology", title: "Theology", icon: BookOpen },
    { id: "resources", title: "Resources", icon: Settings },
    { id: "culture", title: "Context", icon: Building2 }
  ];

  const updatePreference = (key: keyof TeacherPreferences, value: any) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const updateArrayPreference = (key: keyof TeacherPreferences, item: string, checked: boolean) => {
    const currentArray = (preferences[key] as string[]) || [];
    const newArray = checked 
      ? [...currentArray, item]
      : currentArray.filter(i => i !== item);
    updatePreference(key, newArray);
  };

  const resetToDefaults = () => {
    onPreferencesChange(defaultPreferences);
  };

  const handleSaveProfile = () => {
    if (profileName.trim() && onSaveProfile) {
      onSaveProfile(preferences, profileName.trim());
      setProfileName("");
      setShowSaveDialog(false);
    }
  };

  const renderTeacherStyleStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Teaching Style</Label>
          <Select value={preferences.teachingStyle} onValueChange={(value) => updatePreference("teachingStyle", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interactive_discussion">Interactive/Discussion-based</SelectItem>
              <SelectItem value="lecture_heavy">Lecture-heavy</SelectItem>
              <SelectItem value="activity_focused">Activity-focused</SelectItem>
              <SelectItem value="mixed">Mixed approach</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Classroom Management</Label>
          <Select value={preferences.classroomManagement} onValueChange={(value) => updatePreference("classroomManagement", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal_structured">Formal structured</SelectItem>
              <SelectItem value="relaxed_interactive">Relaxed interactive</SelectItem>
              <SelectItem value="small_group_focused">Small group focused</SelectItem>
              <SelectItem value="large_group_focused">Large group focused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Technology Integration</Label>
          <Select value={preferences.techIntegration} onValueChange={(value) => updatePreference("techIntegration", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High-tech (digital tools, apps)</SelectItem>
              <SelectItem value="medium">Medium-tech (basic AV)</SelectItem>
              <SelectItem value="low">Low-tech (traditional methods)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Assessment Preference</Label>
          <Select value={preferences.assessmentPreference} onValueChange={(value) => updatePreference("assessmentPreference", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal_testing">Formal testing</SelectItem>
              <SelectItem value="informal_discussion">Informal discussion</SelectItem>
              <SelectItem value="creative_projects">Creative projects</SelectItem>
              <SelectItem value="peer_evaluation">Peer evaluation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderClassContextStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Class Size</Label>
          <Select value={preferences.classSize} onValueChange={(value) => updatePreference("classSize", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (5-15 people)</SelectItem>
              <SelectItem value="medium">Medium (16-30 people)</SelectItem>
              <SelectItem value="large">Large (31-50 people)</SelectItem>
              <SelectItem value="extra_large">Extra Large (50+ people)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Meeting Frequency</Label>
          <Select value={preferences.meetingFrequency} onValueChange={(value) => updatePreference("meetingFrequency", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="intensive">Intensive (multiple days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Session Duration</Label>
          <Select value={preferences.sessionDuration} onValueChange={(value) => updatePreference("sessionDuration", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30min">30 minutes</SelectItem>
              <SelectItem value="45min">45 minutes</SelectItem>
              <SelectItem value="60min">60 minutes</SelectItem>
              <SelectItem value="90min">90 minutes</SelectItem>
              <SelectItem value="2hours">2+ hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Physical Space</Label>
          <Select value={preferences.physicalSpace} onValueChange={(value) => updatePreference("physicalSpace", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="traditional_classroom">Traditional classroom</SelectItem>
              <SelectItem value="fellowship_hall">Fellowship hall</SelectItem>
              <SelectItem value="outdoor_setting">Outdoor setting</SelectItem>
              <SelectItem value="home_environment">Home environment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Special Needs Considerations (Select all that apply)</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "learning_disabilities", label: "Learning disabilities" },
            { id: "physical_limitations", label: "Physical limitations" },
            { id: "language_barriers", label: "Language barriers" },
            { id: "attention_challenges", label: "Attention challenges" }
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={item.id}
                checked={preferences.specialNeeds.includes(item.id)}
                onCheckedChange={(checked) => updateArrayPreference("specialNeeds", item.id, checked as boolean)}
              />
              <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPedagogyStep = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Learning Style Accommodation (Select all that apply)</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "visual", label: "Visual learners" },
            { id: "auditory", label: "Auditory learners" },
            { id: "kinesthetic", label: "Kinesthetic learners" },
            { id: "reading_writing", label: "Reading/writing learners" }
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={item.id}
                checked={preferences.learningStyles.includes(item.id)}
                onCheckedChange={(checked) => updateArrayPreference("learningStyles", item.id, checked as boolean)}
              />
              <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Engagement Level Desired</Label>
          <Select value={preferences.engagementLevel} onValueChange={(value) => updatePreference("engagementLevel", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="highly_interactive">Highly interactive</SelectItem>
              <SelectItem value="moderately_interactive">Moderately interactive</SelectItem>
              <SelectItem value="primarily_receptive">Primarily receptive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Discussion Format</Label>
          <Select value={preferences.discussionFormat} onValueChange={(value) => updatePreference("discussionFormat", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="large_group">Large group</SelectItem>
              <SelectItem value="small_groups">Small groups</SelectItem>
              <SelectItem value="pairs">Pairs</SelectItem>
              <SelectItem value="individual_reflection">Individual reflection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Activity Complexity</Label>
          <Select value={preferences.activityComplexity} onValueChange={(value) => updatePreference("activityComplexity", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple/Basic</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="advanced">Advanced/Complex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderTheologyStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Bible Translation Preference</Label>
          <Select value={preferences.bibleTranslation} onValueChange={(value) => updatePreference("bibleTranslation", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ESV">ESV</SelectItem>
              <SelectItem value="NIV">NIV</SelectItem>
              <SelectItem value="NASB">NASB</SelectItem>
              <SelectItem value="KJV">KJV</SelectItem>
              <SelectItem value="CSB">CSB</SelectItem>
              <SelectItem value="NKJV">NKJV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Theological Emphasis</Label>
          <Select value={preferences.theologicalEmphasis} onValueChange={(value) => updatePreference("theologicalEmphasis", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expository">Expository</SelectItem>
              <SelectItem value="topical">Topical</SelectItem>
              <SelectItem value="narrative">Narrative</SelectItem>
              <SelectItem value="character_study">Character study</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Application Focus</Label>
          <Select value={preferences.applicationFocus} onValueChange={(value) => updatePreference("applicationFocus", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal_growth">Personal growth</SelectItem>
              <SelectItem value="community_service">Community service</SelectItem>
              <SelectItem value="evangelism">Evangelism</SelectItem>
              <SelectItem value="discipleship">Discipleship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Depth Level</Label>
          <Select value={preferences.depthLevel} onValueChange={(value) => updatePreference("depthLevel", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="survey_overview">Survey/Overview</SelectItem>
              <SelectItem value="detailed_study">Detailed study</SelectItem>
              <SelectItem value="deep_theological">Deep theological exploration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderResourcesStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Handout Style</Label>
          <Select value={preferences.handoutStyle} onValueChange={(value) => updatePreference("handoutStyle", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal_text">Minimal text</SelectItem>
              <SelectItem value="detailed_notes">Detailed notes</SelectItem>
              <SelectItem value="interactive_worksheets">Interactive worksheets</SelectItem>
              <SelectItem value="digital_resources">Digital resources</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Visual Aid Preference</Label>
          <Select value={preferences.visualAidPreference} onValueChange={(value) => updatePreference("visualAidPreference", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="basic_graphics">Basic graphics</SelectItem>
              <SelectItem value="rich_multimedia">Rich multimedia</SelectItem>
              <SelectItem value="interactive_presentations">Interactive presentations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Preparation Time Available</Label>
          <Select value={preferences.preparationTime} onValueChange={(value) => updatePreference("preparationTime", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">Minimal (15-30 min)</SelectItem>
              <SelectItem value="moderate">Moderate (30-60 min)</SelectItem>
              <SelectItem value="extensive">Extensive (60+ min)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Take-home Materials (Select all that apply)</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "summary_sheets", label: "Summary sheets" },
            { id: "reflection_questions", label: "Reflection questions" },
            { id: "action_items", label: "Action items" },
            { id: "additional_readings", label: "Additional readings" }
          ].map((item) => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={item.id}
                checked={preferences.takehomeMaterials.includes(item.id)}
                onCheckedChange={(checked) => updateArrayPreference("takehomeMaterials", item.id, checked as boolean)}
              />
              <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContextStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Cultural Background</Label>
          <Select value={preferences.culturalBackground} onValueChange={(value) => updatePreference("culturalBackground", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urban">Urban</SelectItem>
              <SelectItem value="suburban">Suburban</SelectItem>
              <SelectItem value="rural">Rural</SelectItem>
              <SelectItem value="international">International</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Socioeconomic Context</Label>
          <Select value={preferences.socioeconomicContext} onValueChange={(value) => updatePreference("socioeconomicContext", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_collar">Blue collar</SelectItem>
              <SelectItem value="white_collar">White collar</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="economically_disadvantaged">Economically disadvantaged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Educational Background</Label>
          <Select value={preferences.educationalBackground} onValueChange={(value) => updatePreference("educationalBackground", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_school">High school</SelectItem>
              <SelectItem value="some_college">Some college</SelectItem>
              <SelectItem value="college_graduates">College graduates</SelectItem>
              <SelectItem value="advanced_degrees">Advanced degrees</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Spiritual Maturity Range</Label>
          <Select value={preferences.spiritualMaturity} onValueChange={(value) => updatePreference("spiritualMaturity", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new_believers">New believers</SelectItem>
              <SelectItem value="growing_christians">Growing Christians</SelectItem>
              <SelectItem value="mature_believers">Mature believers</SelectItem>
              <SelectItem value="mixed">Mixed levels</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="additional-context" className="text-sm font-medium">Additional Context & Special Considerations</Label>
        <Textarea
          id="additional-context"
          placeholder="Describe any unique aspects of your class, specific challenges, cultural considerations, or special circumstances that would help customize the lesson content..."
          value={preferences.additionalContext}
          onChange={(e) => updatePreference("additionalContext", e.target.value)}
          className="min-h-[120px]"
        />
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderTeacherStyleStep();
      case 1: return renderClassContextStep();
      case 2: return renderPedagogyStep();
      case 3: return renderTheologyStep();
      case 4: return renderResourcesStep();
      case 5: return renderContextStep();
      default: return renderTeacherStyleStep();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Profile Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Teacher Customization Profile
              </CardTitle>
              <CardDescription>
                Configure detailed preferences for personalized lesson generation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              {savedProfiles.length > 0 && (
                <Select onValueChange={(value) => {
                  const profile = savedProfiles.find(p => p.name === value);
                  if (profile && onLoadProfile) {
                    onLoadProfile(profile.preferences);
                  }
                }}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Load saved profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedProfiles.map((profile) => (
                      <SelectItem key={profile.name} value={profile.name}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <Button
                    key={step.id}
                    variant={currentStep === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStep(index)}
                    className="flex items-center gap-2"
                  >
                    <StepIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </Button>
                );
              })}
            </div>
            <Badge variant="secondary">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>
          
          <Separator className="my-6" />
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {onSaveProfile && (
                <div className="flex items-center gap-2">
                  {showSaveDialog ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Profile name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-40"
                      />
                      <Button size="sm" onClick={handleSaveProfile} disabled={!profileName.trim()}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { defaultPreferences };