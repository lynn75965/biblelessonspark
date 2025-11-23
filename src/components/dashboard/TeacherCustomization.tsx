import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
  { id: "lecture", label: "Lecture-Based" },
  { id: "discussion", label: "Discussion-Based" },
  { id: "interactive", label: "Interactive/Hands-On" },
  { id: "storytelling", label: "Storytelling" },
  { id: "socratic", label: "Socratic Method" },
];

const LESSON_LENGTHS = [
  { id: "30", label: "30 minutes" },
  { id: "45", label: "45 minutes" },
  { id: "60", label: "60 minutes" },
  { id: "90", label: "90 minutes" },
];

const ACTIVITY_TYPES = [
  { id: "crafts", label: "Crafts" },
  { id: "games", label: "Games" },
  { id: "music", label: "Music/Worship" },
  { id: "drama", label: "Drama/Role-play" },
  { id: "discussion", label: "Small Group Discussion" },
  { id: "memorization", label: "Scripture Memorization" },
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
                    {style.label}
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