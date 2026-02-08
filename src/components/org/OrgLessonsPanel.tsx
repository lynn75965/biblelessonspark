/**
 * OrgLessonsPanel Component
 * 
 * Displays lessons created by organization members with:
 * - Lesson list with search/filter
 * - Funding source indicator (org pool vs personal account)
 * - View lesson modal
 * 
 * Phase 13.7: Added org_pool_consumed tracking for reimbursement identification
 * 
 * Phase 26: Lesson Visibility + Org Manager Override (February 2026)
 * - Visibility column: Private/Shared per lesson
 * - Org Manager Override: Can view Private lessons IF org-funded (org_pool_consumed = true)
 * - Personal-funded Private lessons are hidden from Org Manager
 * - Funding badges: 🟢 Pool, 🔵 Pack (Pack ready for future use)
 * - Transparency messages: Override notice on private org-funded lessons
 * 
 * SSOT: lessons.organization_id + lessons.org_pool_consumed + lessons.visibility
 * 
 * @location src/components/org/OrgLessonsPanel.tsx
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Search, 
  Eye, 
  Calendar, 
  User, 
  RefreshCw, 
  Building2, 
  Wallet,
  AlertCircle,
  CheckCircle2,
  Filter,
  Lock,
  Share2,
  ShieldAlert
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatLessonContentToHtml, LESSON_CONTENT_CONTAINER_CLASSES, LESSON_CONTENT_CONTAINER_STYLES } from "@/utils/formatLessonContent";

// ============================================================================
// TYPES
// ============================================================================

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
  organization_id: string | null;
  org_pool_consumed: boolean;
  visibility: 'private' | 'shared';
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

// ============================================================================
// FUNDING SOURCE CONSTANTS (Phase 26 — Funding Badges)
// ============================================================================

type FundingFilter = 'all' | 'org_pool' | 'personal';

const FUNDING_LABELS = {
  org_pool: {
    label: "Pool",
    description: "Lesson funded by organization subscription pool",
    icon: Building2,
    variant: "default" as const,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    dotColor: "🟢",
  },
  personal: {
    label: "Personal",
    description: "Member used personal account — consider reimbursement",
    icon: Wallet,
    variant: "secondary" as const,
    badgeClass: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    dotColor: "",
  },
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function OrgLessonsPanel({ organizationId, organizationName }: OrgLessonsPanelProps) {
  const [lessons, setLessons] = useState<OrgLesson[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fundingFilter, setFundingFilter] = useState<FundingFilter>("all");
  const [selectedLesson, setSelectedLesson] = useState<OrgLesson | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Get all member user_ids for this organization
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', organizationId);

      if (membersError) {
        console.error('Members query error:', membersError);
        setError(membersError.message);
        return;
      }

      const memberIds = membersData?.map(m => m.id) || [];
      
      // Build profile map from members query
      const map: ProfileMap = {};
      membersData?.forEach(p => { map[p.id] = { full_name: p.full_name }; });
      setProfileMap(map);

      if (memberIds.length === 0) {
        setLessons([]);
        setLoading(false);
        return;
      }

      // Step 2: Query lessons with organization_id set (org members' lessons)
      // Phase 26: Now includes visibility column for override logic
      const { data: lessonsData, error: lessonsError } = await supabase
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
          org_pool_consumed,
          visibility
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (lessonsError) {
        console.error('Lessons query error:', lessonsError);
        setError(lessonsError.message);
        return;
      }

      const fetchedLessons = (lessonsData as OrgLesson[]) || [];
      setLessons(fetchedLessons);
    } catch (err) {
      console.error('Error fetching org lessons:', err);
      setError('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchLessons(); 
  }, [organizationId]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getScripture = (lesson: OrgLesson): string => 
    lesson.filters?.bible_passage || 'N/A';
  
  const getAgeGroup = (lesson: OrgLesson): string => 
    lesson.metadata?.ageGroup || lesson.filters?.age_group || 'N/A';
  
  const getDisplayTitle = (lesson: OrgLesson): string => 
    lesson.title || lesson.filters?.focused_topic || 'Untitled';
  
  const getUserDisplay = (lesson: OrgLesson): string => 
    profileMap[lesson.user_id]?.full_name || 'Unknown';

  const getFundingSource = (lesson: OrgLesson): 'org_pool' | 'personal' => {
    // org_pool_consumed = true means org paid
    // org_pool_consumed = false (but organization_id set) means member used personal account
    return lesson.org_pool_consumed ? 'org_pool' : 'personal';
  };

  /**
   * Phase 26: Org Manager Override Logic
   * - Shared lessons: always visible to Org Manager
   * - Private + org-funded (org_pool_consumed = true): visible via override
   * - Private + personal-funded: NOT visible to Org Manager
   */
  const isVisibleToOrgManager = (lesson: OrgLesson): boolean => {
    if (lesson.visibility === 'shared') return true;
    if (lesson.visibility === 'private' && lesson.org_pool_consumed) return true;
    return false;
  };

  /**
   * Is this lesson being viewed via Org Manager Override?
   * (Private lesson that the org funded)
   */
  const isOverrideAccess = (lesson: OrgLesson): boolean => {
    return lesson.visibility === 'private' && lesson.org_pool_consumed;
  };

  // ============================================================================
  // FILTERING (Phase 26: applies visibility override logic)
  // ============================================================================

  // First apply visibility logic — only show what Org Manager should see
  const visibleLessons = lessons.filter(isVisibleToOrgManager);

  const filteredLessons = visibleLessons.filter(lesson => {
    // Text search filter
    const displayTitle = getDisplayTitle(lesson);
    const scripture = getScripture(lesson);
    const userName = getUserDisplay(lesson);
    const matchesSearch = 
      displayTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scripture.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase());

    // Funding source filter
    let matchesFunding = true;
    if (fundingFilter === 'org_pool') {
      matchesFunding = lesson.org_pool_consumed === true;
    } else if (fundingFilter === 'personal') {
      matchesFunding = lesson.org_pool_consumed === false;
    }

    return matchesSearch && matchesFunding;
  });

  // Calculate stats (based on visible lessons only)
  const orgPoolCount = visibleLessons.filter(l => l.org_pool_consumed === true).length;
  const personalCount = visibleLessons.filter(l => l.org_pool_consumed === false).length;
  const sharedCount = visibleLessons.filter(l => l.visibility === 'shared').length;
  const overrideCount = visibleLessons.filter(l => isOverrideAccess(l)).length;

  const handleViewLesson = (lesson: OrgLesson) => { 
    setSelectedLesson(lesson); 
    setShowViewModal(true); 
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
              <CardDescription>
                Lessons created by members of {organizationName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {filteredLessons.length} lessons
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchLessons}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
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

          {/* Funding Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold">{visibleLessons.length}</p>
              <p className="text-xs text-muted-foreground">Visible Lessons</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-700">{orgPoolCount}</p>
              <p className="text-xs text-muted-foreground">🟢 Org Pool</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{personalCount}</p>
              <p className="text-xs text-muted-foreground">Personal Account</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-600">{overrideCount}</p>
              <p className="text-xs text-muted-foreground">🔒 Override Access</p>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by title, passage, or author..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-9" 
              />
            </div>
            <Select value={fundingFilter} onValueChange={(v) => setFundingFilter(v as FundingFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by funding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lessons</SelectItem>
                <SelectItem value="org_pool">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    Org Pool Only
                  </div>
                </SelectItem>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-yellow-600" />
                    Personal Only
                  </div>
                </SelectItem>
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
              {searchTerm || fundingFilter !== 'all' 
                ? 'No lessons found matching your filters.' 
                : 'No lessons have been created yet.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Scripture</TableHead>
                    <TableHead className="hidden lg:table-cell">Author</TableHead>
                    <TableHead className="hidden sm:table-cell">Age Group</TableHead>
                    <TableHead>Funding</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => {
                    const fundingSource = getFundingSource(lesson);
                    const fundingConfig = FUNDING_LABELS[fundingSource];
                    const FundingIcon = fundingConfig.icon;
                    const override = isOverrideAccess(lesson);

                    return (
                      <TableRow key={lesson.id} className={override ? "bg-amber-50/30" : ""}>
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
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="text-xs">
                            {getAgeGroup(lesson)}
                          </Badge>
                        </TableCell>
                        {/* Funding Badge (Phase 26 — Item 11) */}
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline"
                                  className={`text-xs cursor-help ${fundingConfig.badgeClass}`}
                                >
                                  <FundingIcon className="h-3 w-3 mr-1" />
                                  {fundingConfig.dotColor && <span className="mr-0.5">{fundingConfig.dotColor}</span>}
                                  {fundingConfig.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[200px]">
                                <p className="text-sm">{fundingConfig.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        {/* Visibility Badge (Phase 26 — Item 10) */}
                        <TableCell>
                          {lesson.visibility === 'shared' ? (
                            <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300 bg-emerald-50">
                              <Share2 className="h-3 w-3 mr-1" />
                              Shared
                            </Badge>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-50 cursor-help">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Private
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[250px]">
                                  <p className="text-sm">This lesson has not been shared by the teacher. You have access because it was funded by your organization.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
                            title="View lesson"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Reimbursement Note */}
          {personalCount > 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    {personalCount} lesson{personalCount > 1 ? 's' : ''} used personal accounts
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    These members generated lessons when the org pool was empty. 
                    Consider reimbursing them or purchasing more lessons for your pool.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

                {/* Phase 26 — Transparency Message (Item 12): Override Notice */}
                {isOverrideAccess(selectedLesson) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">
                          🔒 This lesson has not been shared by the teacher.
                        </p>
                        <p className="text-amber-700 mt-1">
                          You have access because it was funded by your {organizationName} lesson pool.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Scripture:</span> {getScripture(selectedLesson)}
                  </div>
                  <div>
                    <span className="font-medium">Age Group:</span> {getAgeGroup(selectedLesson)}
                  </div>
                  <div>
                    <span className="font-medium">Created By:</span> {getUserDisplay(selectedLesson)}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {format(new Date(selectedLesson.created_at), 'PPP')}
                  </div>
                  <div>
                    <span className="font-medium">Source:</span> {selectedLesson.source_type || 'N/A'}
                  </div>
                  {selectedLesson.metadata?.wordCount && (
                    <div>
                      <span className="font-medium">Word Count:</span> {selectedLesson.metadata.wordCount.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Funding Source + Visibility Badges */}
                <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {/* Funding Badge */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Funding:</span>
                    {(() => {
                      const fundingSource = getFundingSource(selectedLesson);
                      const fundingConfig = FUNDING_LABELS[fundingSource];
                      const FundingIcon = fundingConfig.icon;
                      return (
                        <Badge 
                          variant="outline"
                          className={fundingConfig.badgeClass}
                        >
                          <FundingIcon className="h-3 w-3 mr-1" />
                          {fundingConfig.dotColor && <span className="mr-0.5">{fundingConfig.dotColor}</span>}
                          {fundingConfig.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  {/* Visibility Badge */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Visibility:</span>
                    {selectedLesson.visibility === 'shared' ? (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selectedLesson.org_pool_consumed 
                      ? "Organization paid for this lesson" 
                      : "Member used personal account"}
                  </span>
                </div>

                {/* Teaser */}
                {selectedLesson.metadata?.teaser && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Teaser:</h4>
                    <p className="text-sm text-muted-foreground italic">
                      {selectedLesson.metadata.teaser}
                    </p>
                  </div>
                )}

                {/* Lesson Content */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Lesson Content:</h4>
                  {selectedLesson.original_text ? (
                    <div 
                      className={LESSON_CONTENT_CONTAINER_CLASSES} 
                      style={LESSON_CONTENT_CONTAINER_STYLES} 
                      dangerouslySetInnerHTML={{ 
                        __html: formatLessonContentToHtml(selectedLesson.original_text) 
                      }} 
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
    </div>
  );
}
