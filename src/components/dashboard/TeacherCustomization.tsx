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

export function TeacherCustomization({
  teachingStyle,
  setTeachingStyle,
  lessonLength,
  setLessonLength,
  activityTypes,
  setActivityTypes,
  language,
  setLanguage,
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
        </CardContent>
      )}
    </Card>
  );
}