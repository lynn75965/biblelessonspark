import { useState } from "react";
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

interface Lesson {
  id: string;
  title: string;
  passage_or_topic: string;
  age_group: 'Preschoolers' | 'Elementary' | 'Middle School' | 'High School' | 'College & Career' | 'Young Adults' | 'Mid-Life Adults' | 'Mature Adults' | 'Active Seniors' | 'Senior Adults' | 'Mixed Groups';
  doctrine_profile: 'SBC' | 'RB' | 'IND';
  created_at: string;
  updated_at: string;
  created_by_name: string;
  has_content: boolean;
}

interface LessonLibraryProps {
  onCreateNew?: () => void;
  onViewLesson?: (lesson: Lesson) => void;
  onEditLesson?: (lesson: Lesson) => void;
  onDuplicateLesson?: (lesson: Lesson) => void;
  onDeleteLesson?: (lesson: Lesson) => void;
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

  // Mock lessons data - replace with actual API call
  const [lessons] = useState<Lesson[]>([
    {
      id: "1",
      title: "John 3:16-21 - High School Study",
      passage_or_topic: "John 3:16-21",
      age_group: "High School",
      doctrine_profile: "SBC",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
      created_by_name: "Pastor Johnson",
      has_content: true
    },
    {
      id: "2", 
      title: "Salvation by Grace - Young Adults",
      passage_or_topic: "Ephesians 2:8-10",
      age_group: "Young Adults",
      doctrine_profile: "RB",
      created_at: "2024-01-10T14:20:00Z",
      updated_at: "2024-01-12T09:15:00Z",
      created_by_name: "Teacher Smith",
      has_content: true
    },
    {
      id: "3",
      title: "The Good Shepherd - Elementary",
      passage_or_topic: "John 10:11-16",
      age_group: "Elementary",
      doctrine_profile: "IND",
      created_at: "2024-01-08T16:45:00Z",
      updated_at: "2024-01-08T16:45:00Z",
      created_by_name: "Mrs. Davis",
      has_content: false
    }
  ]);

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lesson.passage_or_topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = ageFilter === "all" || lesson.age_group === ageFilter;
    const matchesDoctrine = doctrineFilter === "all" || lesson.doctrine_profile === doctrineFilter;
    
    return matchesSearch && matchesAge && matchesDoctrine;
  });

  const getAgeGroupBadgeColor = (ageGroup: string) => {
    const colors = {
      Preschoolers: "bg-pink-100 text-pink-800 border-pink-200",
      Elementary: "bg-green-100 text-green-800 border-green-200",
      "Middle School": "bg-cyan-100 text-cyan-800 border-cyan-200",
      "High School": "bg-blue-100 text-blue-800 border-blue-200", 
      "College & Career": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "Young Adults": "bg-purple-100 text-purple-800 border-purple-200",
      "Mid-Life Adults": "bg-violet-100 text-violet-800 border-violet-200",
      "Mature Adults": "bg-amber-100 text-amber-800 border-amber-200",
      "Active Seniors": "bg-orange-100 text-orange-800 border-orange-200",
      "Senior Adults": "bg-red-100 text-red-800 border-red-200",
      "Mixed Groups": "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[ageGroup as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Lessons</h2>
          <p className="text-muted-foreground">
            Manage your Baptist Bible study lessons and enhancements
          </p>
        </div>
        <Button variant="hero" onClick={onCreateNew}>
          <Plus className="h-4 w-4" />
          Create New Lesson
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons by title or passage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Age Group Filter */}
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="Preschoolers">Preschoolers (3-5)</SelectItem>
                <SelectItem value="Elementary">Elementary (6-12)</SelectItem>
                <SelectItem value="Middle School">Middle School (11-14)</SelectItem>
                <SelectItem value="High School">High School (15-18)</SelectItem>
                <SelectItem value="College & Career">College & Career (19-25)</SelectItem>
                <SelectItem value="Young Adults">Young Adults (26-35)</SelectItem>
                <SelectItem value="Mid-Life Adults">Mid-Life Adults (36-50)</SelectItem>
                <SelectItem value="Mature Adults">Mature Adults (51-65)</SelectItem>
                <SelectItem value="Active Seniors">Active Seniors (66-75)</SelectItem>
                <SelectItem value="Senior Adults">Senior Adults (76+)</SelectItem>
                <SelectItem value="Mixed Groups">Mixed Groups</SelectItem>
              </SelectContent>
            </Select>

            {/* Doctrine Filter */}
            <Select value={doctrineFilter} onValueChange={setDoctrineFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-2">{lesson.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {lesson.passage_or_topic}
                    </CardDescription>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shrink-0">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getAgeGroupBadgeColor(lesson.age_group)} variant="secondary">
                    <Users className="h-3 w-3" />
                    {lesson.age_group}
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

              <CardContent className="space-y-4">
                {/* Meta Information */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onViewLesson?.(lesson)}
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditLesson?.(lesson)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDuplicateLesson?.(lesson)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDeleteLesson?.(lesson)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
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