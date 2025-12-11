import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search, Eye, Calendar, User, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface LessonMetadata {
  scripture_passage?: string;
  age_group?: string;
  ai_lesson_title?: string;
  [key: string]: any;
}

interface Lesson {
  id: string;
  title: string;
  original_text: string | null;
  source_type: string | null;
  filters: any;
  metadata: LessonMetadata | null;
  created_at: string;
  user_id: string;
  organization_id: string | null;
  profiles: {
    full_name: string | null;
  } | null;
  organizations: {
    name: string | null;
  } | null;
}

export function AllLessonsPanel() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Fetch all lessons with user and org info
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // NOTE: profiles table does NOT have email column - only full_name
        const { data, error: queryError } = await supabase
          .from('lessons')
          .select(`
            id,
            title,
            original_text,
            source_type,
            filters,
            metadata,
            created_at,
            user_id,
            organization_id,
            profiles (
              full_name
            ),
            organizations (
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (queryError) {
          console.error('Supabase query error:', queryError);
          setError(queryError.message);
          return;
        }
        
        console.log('Lessons fetched:', data?.length || 0);
        setLessons((data as any[]) || []);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  // Fetch organizations for filter
  useEffect(() => {
    const fetchOrgs = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      setOrganizations(data || []);
    };
    fetchOrgs();
  }, []);

  // Helper to extract metadata fields
  const getScripture = (lesson: Lesson): string => {
    return lesson.metadata?.scripture_passage || 
           lesson.filters?.scripture_passage || 
           'N/A';
  };

  const getAgeGroup = (lesson: Lesson): string => {
    return lesson.metadata?.age_group || 
           lesson.filters?.age_group || 
           'N/A';
  };

  const getDisplayTitle = (lesson: Lesson): string => {
    return lesson.metadata?.ai_lesson_title || 
           lesson.title || 
           'Untitled';
  };

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    const displayTitle = getDisplayTitle(lesson);
    const scripture = getScripture(lesson);
    
    const matchesSearch = 
      (displayTitle.toLowerCase()).includes(searchTerm.toLowerCase()) ||
      (lesson.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (scripture.toLowerCase()).includes(searchTerm.toLowerCase()) ||
      (lesson.profiles?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesOrg = filterOrg === "all" || 
      (filterOrg === "none" && !lesson.organization_id) ||
      lesson.organization_id === filterOrg;

    return matchesSearch && matchesOrg;
  });

  const handleViewLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowViewModal(true);
  };

  const getUserDisplay = (lesson: Lesson) => {
    if (lesson.profiles?.full_name) return lesson.profiles.full_name;
    return 'Unknown';
  };

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              All Platform Lessons
            </CardTitle>
            <CardDescription>
              View all lessons created by all users across the platform
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1 w-fit">
            {filteredLessons.length} lessons
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, passage, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterOrg} onValueChange={setFilterOrg}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              <SelectItem value="none">No Organization</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lessons Table */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading lessons...
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No lessons found matching your criteria.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Scripture</TableHead>
                  <TableHead className="hidden lg:table-cell">User</TableHead>
                  <TableHead className="hidden xl:table-cell">Organization</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-[200px] truncate">
                        {getDisplayTitle(lesson)}
                      </div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        {getScripture(lesson)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {getScripture(lesson)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{getUserDisplay(lesson)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {lesson.organizations?.name ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{lesson.organizations.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Personal</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(lesson.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewLesson(lesson)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* View Lesson Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedLesson ? getDisplayTitle(selectedLesson) : 'Lesson Details'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedLesson && (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Scripture:</span>{' '}
                    {getScripture(selectedLesson)}
                  </div>
                  <div>
                    <span className="font-medium">Age Group:</span>{' '}
                    {getAgeGroup(selectedLesson)}
                  </div>
                  <div>
                    <span className="font-medium">Created By:</span>{' '}
                    {getUserDisplay(selectedLesson)}
                  </div>
                  <div>
                    <span className="font-medium">Organization:</span>{' '}
                    {selectedLesson.organizations?.name || 'Personal'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {format(new Date(selectedLesson.created_at), 'PPP')}
                  </div>
                  <div>
                    <span className="font-medium">Source:</span>{' '}
                    {selectedLesson.source_type || 'N/A'}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Lesson Content:</h4>
                  {selectedLesson.original_text ? (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: selectedLesson.original_text }}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      No lesson content available.
                    </p>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}