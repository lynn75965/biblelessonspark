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

interface Lesson {
  id: string;
  title: string;
  ai_lesson_title: string | null;
  scripture_passage: string | null;
  age_group: string | null;
  created_at: string;
  user_id: string;
  organization_id: string | null;
  original_text: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
  organizations: {
    name: string | null;
  } | null;
}

export function AllLessonsPanel() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Fetch all lessons with user and org info
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select(`
            id,
            title,
            ai_lesson_title,
            scripture_passage,
            age_group,
            created_at,
            user_id,
            organization_id,
            original_text,
            profiles!lessons_user_id_fkey (
              full_name,
              email
            ),
            organizations (
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLessons((data as any[]) || []);
      } catch (error) {
        console.error('Error fetching lessons:', error);
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

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = 
      (lesson.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lesson.ai_lesson_title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lesson.scripture_passage?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lesson.profiles?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
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
    if (lesson.profiles?.email) return lesson.profiles.email.split('@')[0];
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
                        {lesson.ai_lesson_title || lesson.title || 'Untitled'}
                      </div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        {lesson.scripture_passage || 'No passage'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {lesson.scripture_passage || 'N/A'}
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
              {selectedLesson?.ai_lesson_title || selectedLesson?.title || 'Lesson Details'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedLesson && (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Scripture:</span>{' '}
                    {selectedLesson.scripture_passage || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Age Group:</span>{' '}
                    {selectedLesson.age_group || 'N/A'}
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
