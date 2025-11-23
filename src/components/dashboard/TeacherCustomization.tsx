import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen, User, Users, GraduationCap, Church, Globe, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { THEOLOGY_PROFILES } from "@/constants/theologyProfiles";

interface TeacherCustomizationProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export function TeacherCustomization({ onNext, onBack, initialData }: TeacherCustomizationProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [teachingStyle, setTeachingStyle] = useState(initialData?.teachingStyle || "");
  const [groupSize, setGroupSize] = useState(initialData?.groupSize || "");
  const [classroomSetting, setClassroomSetting] = useState(initialData?.classroomSetting || "");
  const [culturalBackground, setCulturalBackground] = useState(initialData?.culturalBackground || "");
  const [educationalBackground, setEducationalBackground] = useState(initialData?.educationalBackground || "");
  const [socioeconomicContext, setSocioeconomicContext] = useState(initialData?.socioeconomicContext || "");
  const [spiritualMaturityRange, setSpiritualMaturityRange] = useState(initialData?.spiritualMaturityRange || "");
  const [theologyProfileId, setTheologyProfileId] = useState(initialData?.theologyProfileId || "");
  const [additionalContext, setAdditionalContext] = useState(initialData?.additionalContext || "");

  // Load user's saved theology profile
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('theology_profile_id')
          .eq('id', user.id)
          .single();

        if (profile?.theology_profile_id && !initialData?.theologyProfileId) {
          setTheologyProfileId(profile.theology_profile_id);
        }
      }
    };

    loadUserProfile();
  }, [initialData]);

  const totalSteps = 6;

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Teaching Style
        if (!teachingStyle) {
          toast({
            variant: "destructive",
            title: "Selection Required",
            description: "Please select your teaching style preference",
          });
          return false;
        }
        break;
      case 2: // Class Context
        if (!groupSize || !classroomSetting) {
          toast({
            variant: "destructive",
            title: "Information Required",
            description: "Please provide group size and classroom setting",
          });
          return false;
        }
        break;
      case 3: // Pedagogy (optional, can skip)
        break;
      case 4: // Theology
        if (!theologyProfileId) {
          toast({
            variant: "destructive",
            title: "Selection Required",
            description: "Please select a theology profile",
          });
          return false;
        }
        break;
      case 5: // Resources (optional)
        break;
      case 6: // Context (optional)
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSaving(true);

    try {
      const customizationData = {
        teachingStyle,
        groupSize,
        classroomSetting,
        culturalBackground,
        educationalBackground,
        socioeconomicContext,
        spiritualMaturityRange,
        theologyProfileId,
        additionalContext: additionalContext.trim() || null,
      };

      // Save to user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            theology_profile_id: theologyProfileId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      toast({
        title: "Customization saved",
        description: "Your teaching preferences have been saved",
      });

      onNext(customizationData);
    } catch (error) {
      console.error('Error saving customization:', error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Teaching Style</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Select your preferred teaching approach to help us tailor lesson content and activities
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preferred Teaching Style *</Label>
              <Select value={teachingStyle} onValueChange={setTeachingStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teaching style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture-Based (Direct Instruction)</SelectItem>
                  <SelectItem value="discussion">Discussion-Led (Socratic Method)</SelectItem>
                  <SelectItem value="interactive">Interactive (Activities & Engagement)</SelectItem>
                  <SelectItem value="storytelling">Storytelling & Narrative</SelectItem>
                  <SelectItem value="expository">Expository (Verse-by-Verse)</SelectItem>
                  <SelectItem value="topical">Topical (Theme-Focused)</SelectItem>
                  <SelectItem value="mixed">Mixed/Flexible Approach</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Users className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Class Context</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Help us understand your teaching environment to optimize lesson materials
              </p>
            </div>

            <div className="space-y-2">
              <Label>Typical Group Size *</Label>
              <Select value={groupSize} onValueChange={setGroupSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (1-10 people)</SelectItem>
                  <SelectItem value="medium">Medium (11-25 people)</SelectItem>
                  <SelectItem value="large">Large (26-50 people)</SelectItem>
                  <SelectItem value="very-large">Very Large (51+ people)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Classroom Setting *</Label>
              <Select value={classroomSetting} onValueChange={setClassroomSetting}>
                <SelectTrigger>
                  <SelectValue placeholder="Select setting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traditional">Traditional Classroom</SelectItem>
                  <SelectItem value="home">Home/Living Room</SelectItem>
                  <SelectItem value="church-hall">Church Hall/Fellowship Room</SelectItem>
                  <SelectItem value="outdoor">Outdoor/Retreat Setting</SelectItem>
                  <SelectItem value="online">Online/Virtual</SelectItem>
                  <SelectItem value="hybrid">Hybrid (In-Person + Online)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <GraduationCap className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Pedagogy</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Optional: Provide context about your students' learning needs (can skip)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Learning Style Considerations (Optional)</Label>
              <Textarea
                placeholder="e.g., Visual learners, hands-on activities preferred, need simplified concepts..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Special Needs or Accommodations (Optional)</Label>
              <Textarea
                placeholder="e.g., ESL learners, hearing impaired, ADHD considerations..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Church className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Theology</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Select your Baptist theological tradition to shape lesson content and interpretation
              </p>
            </div>

            <div className="space-y-3">
              <Label>Baptist Theology Profile *</Label>
              <RadioGroup value={theologyProfileId} onValueChange={setTheologyProfileId}>
                {THEOLOGY_PROFILES.map((profile) => (
                  <div key={profile.id} className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent transition-colors">
                    <RadioGroupItem value={profile.id} id={profile.id} />
                    <div className="space-y-1 leading-none flex-1">
                      <Label htmlFor={profile.id} className="font-medium cursor-pointer">
                        {profile.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {profile.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Resources</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Optional: Specify your resource preferences (can skip)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preferred Curriculum Series (Optional)</Label>
              <Textarea
                placeholder="e.g., LifeWay's Gospel Project, Bible Studies for Life, Explore the Bible..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Technology/Media Preferences (Optional)</Label>
              <Textarea
                placeholder="e.g., Video clips, interactive presentations, printed materials only..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Globe className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Context</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Optional: Provide additional context about your students (can skip)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cultural Background</Label>
              <Select value={culturalBackground} onValueChange={setCulturalBackground}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary cultural context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urban">Urban</SelectItem>
                  <SelectItem value="suburban">Suburban</SelectItem>
                  <SelectItem value="rural">Rural</SelectItem>
                  <SelectItem value="international">International/Multicultural</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Educational Background</Label>
              <Select value={educationalBackground} onValueChange={setEducationalBackground}>
                <SelectTrigger>
                  <SelectValue placeholder="Select typical education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School or Less</SelectItem>
                  <SelectItem value="some-college">Some College</SelectItem>
                  <SelectItem value="college">College Graduates</SelectItem>
                  <SelectItem value="graduate">Graduate/Professional Degrees</SelectItem>
                  <SelectItem value="mixed">Mixed Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Socioeconomic Context</Label>
              <Select value={socioeconomicContext} onValueChange={setSocioeconomicContext}>
                <SelectTrigger>
                  <SelectValue placeholder="Select socioeconomic context" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working-class">Working Class</SelectItem>
                  <SelectItem value="middle-class">Middle Class</SelectItem>
                  <SelectItem value="upper-middle">Upper Middle Class</SelectItem>
                  <SelectItem value="affluent">Affluent</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Spiritual Maturity Range</Label>
              <Select value={spiritualMaturityRange} onValueChange={setSpiritualMaturityRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select spiritual maturity range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-believers">Primarily New Believers</SelectItem>
                  <SelectItem value="growing">Growing Christians</SelectItem>
                  <SelectItem value="mature">Mature Believers</SelectItem>
                  <SelectItem value="mixed">Mixed Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Context & Special Considerations</Label>
              <Textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Describe any unique aspects of your class, specific challenges, cultural considerations, or special circumstances that would help customize the lesson content..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Teacher Customization</CardTitle>
            <CardDescription>
              Help us personalize your lesson to your specific teaching context
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={isSaving}
          >
            {currentStep === totalSteps ? (
              isSaving ? "Saving..." : "Complete"
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}