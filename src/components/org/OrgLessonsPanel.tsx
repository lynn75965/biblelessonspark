import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search, Eye, Calendar, User, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatLessonContentToHtml, LESSON_CONTENT_CONTAINER_CLASSES, LESSON_CONTENT_CONTAINER_STYLES } from "@/utils/formatLessonContent";

interface OrgLesson {
  id: string;
  title: string | null;
  original_text: string | null;
  source_type: string | null;
  filters: {
    bible_passage?: string;
    age_group?: string;
    focused_topic?: string;
    [key: string]: any;
  } | null;
  metadata: {
    ageGroup?: string;
    teaser?: string;
    wordCount?: number;
    theologyProfile?: string;
    [key: string]: any;
  } | null;
  created_at: string;
  user_id: string;
}

interface ProfileMap {
  [userId: string]: {
    full_name: string | null;
  };
}

interface OrgLessonsPanelProps {
  organizationId: string;
  organizationName: string;
}

export function OrgLessonsPanel({ organizationId, organizationName }: OrgLessonsPanelProps) {
  const [lessons, setLessons] = useState<OrgLesson[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<OrgLesson | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`id, title, original_text, source_type, filters, metadata, created_at, user_id`)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (lessonsError) {
        console.error('Lessons query error:', lessonsError);
        setError(lessonsError.message);
        return;
      }

      const fetchedLessons = (lessonsData as OrgLesson[]) || [];
      setLessons(fetchedLessons);

      const uniqueUserIds = [...new Set(fetchedLessons.map(l => l.user_id).filter(Boolean))];
      if (uniqueUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', uniqueUserIds);

        if (!profilesError && profilesData) {
          const map: ProfileMap = {};
          profilesData.forEach(p => { map[p.id] = { full_name: p.full_name }; });
          setProfileMap(map);
        }
      }
    } catch (err) {
      console.error('Error fetching org lessons:', err);
      setError('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLessons(); }, [organizationId]);

  const getScripture = (lesson: OrgLesson): string => lesson.filters?.bible_passage || 'N/A';
  const getAgeGroup = (lesson: OrgLesson): string => lesson.metadata?.ageGroup || lesson.filters?.age_group || 'N/A';
  const getDisplayTitle = (lesson: OrgLesson): string => lesson.title || lesson.filters?.focused_topic || 'Untitled';
  const getUserDisplay = (lesson: OrgLesson): string => profileMap[lesson.user_id]?.full_name || 'Unknown';

  const filteredLessons = lessons.filter(lesson => {
    const displayTitle = getDisplayTitle(lesson);
    const scripture = getScripture(lesson);
    const userName = getUserDisplay(lesson);
    return displayTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scripture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewLesson = (lesson: OrgLesson) => { setSelectedLesson(lesson); setShowViewModal(true); };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Organization Lessons
              </CardTitle>
              <CardDescription>Lessons created by members of {organizationName}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">{filteredLessons.length} lessons</Badge>
              <Button variant="outline" size="sm" onClick={fetchLessons}>
                <RefreshCw className="h-4 w-4 mr-2" />Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
              <strong>Error:</strong> {error}
            </div>
          )}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title, passage, or user..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading lessons...</div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{searchTerm ? 'No lessons found matching your search.' : 'No lessons have been created yet.'}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Scripture</TableHead>
                    <TableHead className="hidden lg:table-cell">Author</TableHead>
                    <TableHead className="hidden sm:table-cell">Age Group</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[200px] truncate">{getDisplayTitle(lesson)}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{getScripture(lesson)}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{getScripture(lesson)}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="flex items-center gap-1"><User className="h-3 w-3 text-muted-foreground" /><span className="text-sm">{getUserDisplay(lesson)}</span></div></TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge variant="secondary" className="text-xs">{getAgeGroup(lesson)}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{format(new Date(lesson.created_at), 'MMM d, yyyy')}</div></TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => handleViewLesson(lesson)} title="View lesson"><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader><DialogTitle>{selectedLesson ? getDisplayTitle(selectedLesson) : 'Lesson Details'}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedLesson && (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Scripture:</span> {getScripture(selectedLesson)}</div>
                  <div><span className="font-medium">Age Group:</span> {getAgeGroup(selectedLesson)}</div>
                  <div><span className="font-medium">Created By:</span> {getUserDisplay(selectedLesson)}</div>
                  <div><span className="font-medium">Created:</span> {format(new Date(selectedLesson.created_at), 'PPP')}</div>
                  <div><span className="font-medium">Source:</span> {selectedLesson.source_type || 'N/A'}</div>
                  {selectedLesson.metadata?.wordCount && (<div><span className="font-medium">Word Count:</span> {selectedLesson.metadata.wordCount.toLocaleString()}</div>)}
                </div>
                {selectedLesson.metadata?.teaser && (<div className="border-t pt-4"><h4 className="font-medium mb-2">Teaser:</h4><p className="text-sm text-muted-foreground italic">{selectedLesson.metadata.teaser}</p></div>)}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Lesson Content:</h4>
                  {selectedLesson.original_text ? (<div className={LESSON_CONTENT_CONTAINER_CLASSES} style={LESSON_CONTENT_CONTAINER_STYLES} dangerouslySetInnerHTML={{ __html: formatLessonContentToHtml(selectedLesson.original_text) }} />) : (<p className="text-muted-foreground italic">No lesson content available.</p>)}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
