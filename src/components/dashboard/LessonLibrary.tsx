import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Trash2, Search, BookOpen, Users } from "lucide-react";
import { useLessons } from "@/hooks/useLessons";
import { Lesson } from "@/types/lesson";
import { getTheologyProfile } from "@/constants/theologyProfiles";

interface LessonLibraryProps {
  onViewLesson?: (lesson: any) => void;
  organizationId?: string;
}

interface LessonDisplay extends Lesson {
  ai_lesson_title: string | null;
  bible_passage: string | null;
  passage_or_topic: string;
  age_group: string;
  theology_profile_id: string;
  created_by_name: string;
  has_content: boolean;
  updated_at?: string;
}

const extractLessonTitle = (content: string): string | null => {
  if (!content) return null;
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?Lesson Title:?(?:\*\*)?\s*[""]?(.+?)[""]?\s*$/i);
    if (match) return match[1].replace(/[""\*]/g, "").trim();
  }
  return null;
};

const extractPrimaryScripture = (content: string): string | null => {
  if (!content) return null;
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?Primary Scripture:?(?:\*\*)?\s*[""]?(.+?)[""]?\s*$/i);
    if (match) return match[1].replace(/[""\*]/g, "").trim();
  }
  return null;
};

export function LessonLibrary({ onViewLesson, organizationId }: LessonLibraryProps) {
  const [searchPassage, setSearchPassage] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [profileFilter, setProfileFilter] = useState<string>("all");

  const { lessons, loading, deleteLesson } = useLessons();

  const displayLessons: LessonDisplay[] = lessons.map((lesson) => {
    const metadata = lesson.metadata as Record<string, any> | null;
    const filters = lesson.filters as Record<string, any> | null;
    
    const aiGeneratedTitle = extractLessonTitle(lesson.original_text || "");
    const aiGeneratedScripture = extractPrimaryScripture(lesson.original_text || "");
    const userInputPassage = filters?.bible_passage || null;

    return {
      ...lesson,
      ai_lesson_title: aiGeneratedTitle,
      bible_passage: userInputPassage || aiGeneratedScripture,
      passage_or_topic: lesson.title || filters?.passageOrTopic || "Untitled Lesson",
      age_group: metadata?.ageGroup || filters?.ageGroup || "Mixed Groups",
      theology_profile_id: metadata?.theologyProfileId || filters?.theologyProfileId || "southern-baptist-bfm-2000",
      created_by_name: "Teacher",
      has_content: !!lesson.original_text,
      updated_at: lesson.created_at,
    };
  });

  const filteredLessons = displayLessons.filter((lesson) => {
    const matchesPassage = !searchPassage || lesson.bible_passage?.toLowerCase().includes(searchPassage.toLowerCase());
    const matchesTitle = !searchTitle || lesson.ai_lesson_title?.toLowerCase().includes(searchTitle.toLowerCase());
    const matchesAge = ageFilter === "all" || lesson.age_group === ageFilter;
    const matchesProfile = profileFilter === "all" || lesson.theology_profile_id === profileFilter;
    return matchesPassage && matchesTitle && matchesAge && matchesProfile;
  });

  const getAgeGroupBadgeColor = (ageGroup: string) => {
    const colors: Record<string, string> = {
      "Preschoolers (Ages 3-5)": "bg-pink-100 text-pink-800 border-pink-200",
      "Elementary Kids (Ages 6-10)": "bg-blue-100 text-blue-800 border-blue-200",
      "Preteens & Middle Schoolers (Ages 11-14)": "bg-purple-100 text-purple-800 border-purple-200",
      "High School Students (Ages 15-18)": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "College & Early Career (Ages 19-25)": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "Young Adults (Ages 26-35)": "bg-teal-100 text-teal-800 border-teal-200",
      "Mid-Life Adults (Ages 36-50)": "bg-green-100 text-green-800 border-green-200",
      "Experienced Adults (Ages 51-65)": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Active Seniors (Ages 66-75)": "bg-orange-100 text-orange-800 border-orange-200",
      "Senior Adults (Ages 76+)": "bg-red-100 text-red-800 border-red-200",
      "Mixed Groups": "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[ageGroup] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getProfileBadgeColor = (profileId: string) => {
    const colors: Record<string, string> = {
      "southern-baptist-bfm-2000": "bg-primary-light text-primary border-primary/20",
      "southern-baptist-bfm-1963": "bg-primary-light text-primary border-primary/20",
      "reformed-baptist": "bg-secondary-light text-secondary border-secondary/20",
      "independent-baptist": "bg-success-light text-success border-success/20",
    };
    return colors[profileId] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getProfileDisplayName = (profileId: string) => {
    const profile = getTheologyProfile(profileId);
    return profile ? profile.name : profileId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (lessonId: string) => {
    if (window.confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      await deleteLesson(lessonId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Lesson Library</CardTitle>
          <CardDescription>Browse and manage your Baptist Bible study lessons</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Single Row with All Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Bible Passage Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Bible Passage"
                value={searchPassage}
                onChange={(e) => setSearchPassage(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Title Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lesson Title"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Age Group Filter */}
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="Preschoolers (Ages 3-5)">Preschoolers</SelectItem>
                <SelectItem value="Elementary Kids (Ages 6-10)">Elementary</SelectItem>
                <SelectItem value="Preteens & Middle Schoolers (Ages 11-14)">Preteens</SelectItem>
                <SelectItem value="High School Students (Ages 15-18)">High School</SelectItem>
                <SelectItem value="College & Early Career (Ages 19-25)">College</SelectItem>
                <SelectItem value="Young Adults (Ages 26-35)">Young Adults</SelectItem>
                <SelectItem value="Mid-Life Adults (Ages 36-50)">Mid-Life</SelectItem>
                <SelectItem value="Experienced Adults (Ages 51-65)">Experienced Adults</SelectItem>
                <SelectItem value="Active Seniors (Ages 66-75)">Active Seniors</SelectItem>
                <SelectItem value="Senior Adults (Ages 76+)">Seniors</SelectItem>
                <SelectItem value="Mixed Groups">Mixed</SelectItem>
              </SelectContent>
            </Select>

            {/* Theology Profile Filter */}
            <Select value={profileFilter} onValueChange={setProfileFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Theology Profiles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Theology Profiles</SelectItem>
                <SelectItem value="southern-baptist-bfm-2000">Southern Baptist (BF&M 2000)</SelectItem>
                <SelectItem value="southern-baptist-bfm-1963">Southern Baptist (BF&M 1963)</SelectItem>
                <SelectItem value="reformed-baptist">Reformed Baptist</SelectItem>
                <SelectItem value="independent-baptist">Independent Baptist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lessons Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {lesson.ai_lesson_title || lesson.title || lesson.passage_or_topic}
                    </CardTitle>
                    {lesson.bible_passage && (
                      <CardDescription className="text-xs sm:text-sm line-clamp-1">
                        Bible Passage: {lesson.bible_passage}
                      </CardDescription>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                  <Badge className={`${getAgeGroupBadgeColor(lesson.age_group)} text-xs`} variant="secondary">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="hidden sm:inline">{lesson.age_group}</span>
                    <span className="sm:hidden">{lesson.age_group.split(" ")[0]}</span>
                  </Badge>
                  <Badge className={getProfileBadgeColor(lesson.theology_profile_id)} variant="secondary">
                    {getProfileDisplayName(lesson.theology_profile_id)}
                  </Badge>
                  {!lesson.has_content && (
                    <Badge variant="outline" className="text-warning border-warning/20 bg-warning-light">
                      Draft
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    Created {formatDate(lesson.created_at)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={() => onViewLesson?.(lesson)} className="flex-1" size="sm">
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDelete(lesson.id)}
                    variant="outline"
                    size="sm"
                    className="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {searchPassage || searchTitle || ageFilter !== "all" || profileFilter !== "all"
                  ? "No lessons match your filters"
                  : "No lessons yet"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchPassage || searchTitle || ageFilter !== "all" || profileFilter !== "all"
                  ? "Try adjusting your search terms or filters to find the lessons you're looking for."
                  : "Create your first Baptist-enhanced Bible study lesson to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
