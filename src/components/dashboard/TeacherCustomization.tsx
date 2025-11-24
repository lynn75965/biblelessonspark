import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TeacherCustomizationProps {
  teachingStyle: string;
  setTeachingStyle: (value: string) => void;
  lessonLength: string;
  setLessonLength: (value: string) => void;
  activityTypes: string[];
  setActivityTypes: (value: string[]) => void;
  language: string;
  setLanguage: (value: string) => void;
  classSetting: string;
  setClassSetting: (value: string) => void;
  learningEnvironment: string;
  setLearningEnvironment: (value: string) => void;
  studentExperience: string;
  setStudentExperience: (value: string) => void;
  culturalContext: string;
  setCulturalContext: (value: string) => void;
  specialNeeds: string;
  setSpecialNeeds: (value: string) => void;
  lessonSequence: string;
  setLessonSequence: (value: string) => void;
  assessmentStyle: string;
  setAssessmentStyle: (value: string) => void;
  disabled?: boolean;
}

const TEACHING_STYLES = [
  { id: "lecture", label: "Lecture-Based", tooltip: null },
  { id: "discussion", label: "Discussion-Based", tooltip: null },
  { id: "interactive", label: "Interactive/Hands-On", tooltip: null },
  { id: "storytelling", label: "Storytelling", tooltip: null },
  { id: "socratic", label: "Socratic Method", tooltip: "Teaching through asking probing questions that lead students to discover truth themselves, rather than directly telling them answers" },
  { id: "mixed", label: "Mixed", tooltip: null },
];

const LESSON_LENGTHS = [
  { id: "30", label: "30 minutes" },
  { id: "45", label: "45 minutes" },
  { id: "60", label: "60 minutes" },
  { id: "75", label: "75 minutes" },
  { id: "90", label: "90 minutes" },
];

const ACTIVITY_TYPES = [
  { id: "written", label: "Written reflection" },
  { id: "verbal", label: "Verbal interaction" },
  { id: "creative", label: "Creative arts" },
  { id: "drama", label: "Drama & role-play" },
  { id: "games", label: "Games & movement" },
  { id: "music", label: "Music & worship" },
  { id: "prayer", label: "Prayer practices" },
];

const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "spanish", label: "Spanish" },
  { id: "french", label: "French" },
];

const CLASS_SETTINGS = [
  { id: "small-group", label: "Small Group (3-12)" },
  { id: "large-group", label: "Large Group (13+)" },
  { id: "one-on-one", label: "One-on-One" },
  { id: "family", label: "Family Setting" },
  { id: "mixed", label: "Mixed Groups" },
];

const LEARNING_ENVIRONMENTS = [
  { id: "classroom", label: "Church Classroom" },
  { id: "fellowship-hall", label: "Fellowship Hall" },
  { id: "home", label: "Home Setting" },
  { id: "outdoor", label: "Outdoor/Nature" },
  { id: "virtual", label: "Virtual/Online" },
  { id: "mixed", label: "Mixed Environments" },
];

const STUDENT_EXPERIENCE_LEVELS = [
  { id: "new-believers", label: "New Believers" },
  { id: "growing", label: "Growing Christians" },
  { id: "mature", label: "Mature Christians" },
  { id: "seekers", label: "Seekers/Non-Believers" },
  { id: "mixed", label: "Mixed Experience Levels" },
];

const CULTURAL_CONTEXTS = [
  { id: "urban", label: "Urban" },
  { id: "suburban", label: "Suburban" },
  { id: "rural", label: "Rural" },
  { id: "international", label: "International" },
  { id: "multicultural", label: "Multicultural" },
  { id: "mixed", label: "Mixed Contexts" },
];

const SPECIAL_NEEDS = [
  { id: "none", label: "None" },
  { id: "learning-disabilities", label: "Learning Disabilities" },
  { id: "visual-impaired", label: "Visual Impairment" },
  { id: "hearing-impaired", label: "Hearing Impairment" },
  { id: "esl", label: "ESL/English Learners" },
  { id: "mobility", label: "Mobility Challenges" },
  { id: "mixed", label: "Mixed Needs" },
];

const LESSON_SEQUENCES = [
  { id: "single", label: "Single Lesson" },
  { id: "series", label: "Multi-Week Series" },
  { id: "workshop", label: "Workshop/Seminar" },
  { id: "retreat", label: "Retreat Session" },
  { id: "vbs", label: "VBS/Camp" },
];

const ASSESSMENT_STYLES = [
  { id: "discussion", label: "Informal Discussion" },
  { id: "written", label: "Written Reflection" },
  { id: "quiz", label: "Quiz/Test" },
  { id: "questionnaire", label: "Questionnaire" },
  { id: "presentation", label: "Student Presentation" },
  { id: "project", label: "Group Project" },
  { id: "observation", label: "Observation Only" },
];

export function TeacherCustomization({
  teachingStyle,
  setTeachingStyle,
  lessonLength,
  setLessonLength,
  activityTypes,
  setActivityTypes,
  language,
  setLanguage,
  classSetting,
  setClassSetting,
  learningEnvironment,
  setLearningEnvironment,
  studentExperience,
  setStudentExperience,
  culturalContext,
  setCulturalContext,
  specialNeeds,
  setSpecialNeeds,
  lessonSequence,
  setLessonSequence,
  assessmentStyle,
  setAssessmentStyle,
  disabled = false,
}: TeacherCustomizationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleActivityToggle = (activityId: string, checked: boolean) => {
    if (checked) {
      setActivityTypes([...activityTypes, activityId]);
    } else {
      setActivityTypes(activityTypes.filter(id => id !== activityId));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader 
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Lesson Customization (Optional)</CardTitle>
            <CardDescription>
              Personalize your lesson beyond what any published curriculum can provide
            </CardDescription>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teaching-style">Teaching Style</Label>
              <Select value={teachingStyle} onValueChange={setTeachingStyle} disabled={disabled}>
                <SelectTrigger id="teaching-style">
                  <SelectValue placeholder="Select teaching style" />
                </SelectTrigger>
                <SelectContent>
                  {TEACHING_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      <div className="flex items-center gap-2">
                        {style.label}
                        {style.tooltip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{style.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-length">Lesson Length</Label>
              <Select value={lessonLength} onValueChange={setLessonLength} disabled={disabled}>
                <SelectTrigger id="lesson-length">
                  <SelectValue placeholder="Select lesson length" />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_LENGTHS.map((length) => (
                    <SelectItem key={length.id} value={length.id}>
                      {length.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-setting">Class Setting</Label>
              <Select value={classSetting} onValueChange={setClassSetting} disabled={disabled}>
                <SelectTrigger id="class-setting">
                  <SelectValue placeholder="Select class setting" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_SETTINGS.map((setting) => (
                    <SelectItem key={setting.id} value={setting.id}>
                      {setting.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learning-environment">Learning Environment</Label>
              <Select value={learningEnvironment} onValueChange={setLearningEnvironment} disabled={disabled}>
                <SelectTrigger id="learning-environment">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_ENVIRONMENTS.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-experience">Student Experience Level</Label>
              <Select value={studentExperience} onValueChange={setStudentExperience} disabled={disabled}>
                <SelectTrigger id="student-experience">
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cultural-context">Cultural Context</Label>
              <Select value={culturalContext} onValueChange={setCulturalContext} disabled={disabled}>
                <SelectTrigger id="cultural-context">
                  <SelectValue placeholder="Select cultural context" />
                </SelectTrigger>
                <SelectContent>
                  {CULTURAL_CONTEXTS.map((context) => (
                    <SelectItem key={context.id} value={context.id}>
                      {context.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special-needs">Special Needs</Label>
              <Select value={specialNeeds} onValueChange={setSpecialNeeds} disabled={disabled}>
                <SelectTrigger id="special-needs">
                  <SelectValue placeholder="Select special needs" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIAL_NEEDS.map((need) => (
                    <SelectItem key={need.id} value={need.id}>
                      {need.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-sequence">Lesson Sequence</Label>
              <Select value={lessonSequence} onValueChange={setLessonSequence} disabled={disabled}>
                <SelectTrigger id="lesson-sequence">
                  <SelectValue placeholder="Select lesson sequence" />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_SEQUENCES.map((seq) => (
                    <SelectItem key={seq.id} value={seq.id}>
                      {seq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment-style">Assessment Style</Label>
              <Select value={assessmentStyle} onValueChange={setAssessmentStyle} disabled={disabled}>
                <SelectTrigger id="assessment-style">
                  <SelectValue placeholder="Select assessment style" />
                </SelectTrigger>
                <SelectContent>
                  {ASSESSMENT_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={disabled}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Activity Types</Label>
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITY_TYPES.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={activity.id}
                    checked={activityTypes.includes(activity.id)}
                    onCheckedChange={(checked) => 
                      handleActivityToggle(activity.id, checked as boolean)
                    }
                    disabled={disabled}
                  />
                  <label
                    htmlFor={activity.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {activity.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}