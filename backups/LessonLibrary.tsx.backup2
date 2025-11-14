import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Users, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Plus,
  Download
} from "lucide-react";
import { useLessons, Lesson } from "@/hooks/useLessons";
import { AGE_GROUP_OPTIONS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface LessonDisplay extends Lesson {
  passage_or_topic: string;
  age_group: string;
  doctrine_profile: string;
  created_by_name: string;
  has_content: boolean;
  updated_at?: string;
}

interface LessonLibraryProps {
  onCreateNew?: () => void;
  onViewLesson?: (lesson: LessonDisplay) => void;
  onEditLesson?: (lesson: LessonDisplay) => void;
  onDuplicateLesson?: (lesson: LessonDisplay) => void;
  onDeleteLesson?: (lesson: LessonDisplay) => void;
}

export function LessonLibrary({
  onCreateNew,
  onViewLesson,
  onEditLesson, 
  onDuplicateLesson,
  onDeleteLesson
}: LessonLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [doctrineFilter, setDoctrineFilter] = useState<string>("all");
  
  const { lessons, loading, deleteLesson } = useLessons();
  const { toast } = useToast();

  // Transform lessons data for display
  const displayLessons: LessonDisplay[] = lessons.map(lesson => ({
    ...lesson,
    passage_or_topic: lesson.title || (lesson.filters?.passage_or_topic) || "Untitled Lesson",
    age_group: lesson.filters?.age_group || 'Mixed Groups',
    doctrine_profile: lesson.filters?.doctrine_profile || "SBC", 
    created_by_name: "Teacher", // Would come from profiles table join
    has_content: !!lesson.original_text,
    updated_at: lesson.created_at, // Use created_at as updated_at for now
  }));

  const filteredLessons = displayLessons.filter(lesson => {
    const matchesSearch = lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.passage_or_topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = ageFilter === "all" || lesson.age_group === ageFilter;
    const matchesDoctrine = doctrineFilter === "all" || lesson.doctrine_profile === doctrineFilter;
    
    return matchesSearch && matchesAge && matchesDoctrine;
  });

  const handleDelete = async (lesson: LessonDisplay) => {
    if (window.confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      await deleteLesson(lesson.id);
    }
  };

  const handleDuplicate = (lesson: LessonDisplay) => {
    toast({
      title: "Feature coming soon",
      description: "Lesson duplication will be available in the next update.",
    });
  };

  const getAgeGroupBadgeColor = (ageGroup: string) => {
    const colors: Record<string, string> = {
      "Preschoolers (Ages 3–5)": "bg-pink-100 text-pink-800 border-pink-200",
      "Elementary Kids (Ages 6–10)": "bg-green-100 text-green-800 border-green-200",
      "Preteens & Middle Schoolers (Ages 11–14)": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "High School Students (Ages 15–18)": "bg-blue-100 text-blue-800 border-blue-200",
      "College & Early Career (Ages 19–25)": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "Young Adults (Ages 26–35)": "bg-purple-100 text-purple-800 border-purple-200",
      "Mid-Life Adults (Ages 36–50)": "bg-violet-100 text-violet-800 border-violet-200",
      "Mature Adults (Ages 51–65)": "bg-amber-100 text-amber-800 border-amber-200",
      "Active Seniors (Ages 66–75)": "bg-orange-100 text-orange-800 border-orange-200",
      "Senior Adults (Ages 76+)": "bg-red-100 text-red-800 border-red-200",
      "Mixed Groups": "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[ageGroup] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getDoctrineBadgeColor = (doctrine: string) => {
    const colors = {
      SBC: "bg-primary-light text-primary border-primary/20",
      RB: "bg-secondary-light text-secondary border-secondary/20",
      IND: "bg-success-light text-success border-success/20"
    };
    return colors[doctrine as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">My Lessons</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your Baptist Bible study lessons and enhancements
          </p>
        </div>
        <Button variant="hero" onClick={onCreateNew} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span className="hidden xs:inline">Create New Lesson</span>
          <span className="xs:hidden">Create</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>

            {/* Age Group Filter */}
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-full sm:w-[140px] text-xs sm:text-sm">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {AGE_GROUP_OPTIONS.map(group => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Doctrine Filter */}
            <Select value={doctrineFilter} onValueChange={setDoctrineFilter}>
              <SelectTrigger className="w-full sm:w-[160px] text-xs sm:text-sm">
                <SelectValue placeholder="All Doctrines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctrines</SelectItem>
                <SelectItem value="SBC">Southern Baptist</SelectItem>
                <SelectItem value="RB">Reformed Baptist</SelectItem>
                <SelectItem value="IND">Independent Baptist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Advanced Filters Hint */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <strong>Coming in Pro:</strong> Advanced filters for Bible knowledge level, study focus (Historical Context, Word Study, Social Impact, Spiritual Growth), class duration, group size, and teaching style
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredLessons.length} of {lessons.length} lessons
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3 w-3" />
            Export All
          </Button>
        </div>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base line-clamp-2">{lesson.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {lesson.passage_or_topic}
                    </CardDescription>
                  </div>
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-primary shrink-0">
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge className={`${getAgeGroupBadgeColor(lesson.age_group)} text-xs`} variant="secondary">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="hidden sm:inline">{lesson.age_group}</span>
                    <span className="sm:hidden">{lesson.age_group.split(' ')[0]}</span>
                  </Badge>
                  <Badge className={getDoctrineBadgeColor(lesson.doctrine_profile)} variant="secondary">
                    {lesson.doctrine_profile}
                  </Badge>
                  {!lesson.has_content && (
                    <Badge variant="outline" className="text-warning border-warning/20 bg-warning-light">
                      Draft
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                {/* Meta Information */}
                <div className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    Created {formatDate(lesson.created_at)}
                  </div>
                  <div>
                    By {lesson.created_by_name}
                  </div>
                  {lesson.updated_at !== lesson.created_at && (
                    <div>
                      Updated {formatDate(lesson.updated_at)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="col-span-2 text-xs"
                    onClick={() => onViewLesson?.(lesson)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="hidden xs:inline">View</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => onEditLesson?.(lesson)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={() => handleDuplicate(lesson)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleDelete(lesson)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete Lesson
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="bg-gradient-card">
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {searchTerm || ageFilter !== "all" || doctrineFilter !== "all" 
                    ? "No lessons match your filters" 
                    : "No lessons yet"
                  }
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {searchTerm || ageFilter !== "all" || doctrineFilter !== "all"
                    ? "Try adjusting your search terms or filters to find the lessons you're looking for."
                    : "Create your first Baptist-enhanced Bible study lesson to get started."
                  }
                </p>
              </div>
              <Button variant="hero" onClick={onCreateNew}>
                <Plus className="h-4 w-4" />
                Create First Lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
