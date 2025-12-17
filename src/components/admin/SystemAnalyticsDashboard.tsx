import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  BookOpen,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  TrendingUp,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Activity,
  AlertTriangle,
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatLessonContentToHtml, LESSON_CONTENT_CONTAINER_CLASSES, LESSON_CONTENT_CONTAINER_STYLES } from "@/utils/formatLessonContent";
import {
  METRICS_DISPLAY,
  METRICS_COLUMNS,
  STATUS_BADGES,
  formatDuration,
  getDurationColor,
} from '@/constants/metricsViewerConfig';

// -----------------------------------------------------
// TYPES - User Analytics
// -----------------------------------------------------
interface UserWithStats {
  id: string;
  email: string;
  full_name: string | null;
  beta_participant: boolean;
  created_at: string;
  lesson_count: number;
  last_lesson_date: string | null;
}

interface UserLesson {
  id: string;
  title: string;
  original_text: string | null;
  scripture_passage: string | null;
  age_group: string | null;
  theology_profile_id: string | null;
  bible_version: string | null;
  created_at: string;
  updated_at: string;
}

interface PlatformStats {
  totalUsers: number;
  totalLessons: number;
  activeUsersThisWeek: number;
  avgLessonsPerUser: number;
}

// -----------------------------------------------------
// TYPES - Generation Metrics
// -----------------------------------------------------
interface MetricsRecord {
  id: string;
  user_id: string;
  device_type: string;
  browser: string | null;
  os: string | null;
  generation_duration_ms: number | null;
  status: string;
  sections_requested: number;
  sections_generated: number | null;
  error_message: string | null;
  created_at: string;
}

interface MetricsSummary {
  total: number;
  completed: number;
  timeouts: number;
  errors: number;
  avgDuration: number | null;
  deviceBreakdown: Record<string, number>;
}

// -----------------------------------------------------
// DEVICE ICON COMPONENT
// -----------------------------------------------------
const DeviceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    case 'desktop':
      return <Monitor className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

// -----------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------
export function SystemAnalyticsDashboard() {
  const { toast } = useToast();
  
  // User Analytics State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalLessons: 0,
    activeUsersThisWeek: 0,
    avgLessonsPerUser: 0,
  });

  // User Lessons Dialog State
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [userLessons, setUserLessons] = useState<UserLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [userLessonsDialogOpen, setUserLessonsDialogOpen] = useState(false);

  // Lesson Content Dialog State
  const [selectedLesson, setSelectedLesson] = useState<UserLesson | null>(null);
  const [lessonViewDialogOpen, setLessonViewDialogOpen] = useState(false);

  // User Sorting State
  const [sortField, setSortField] = useState<'lesson_count' | 'last_lesson_date' | 'created_at'>('lesson_count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Generation Metrics State
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsRecord[]>([]);
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummary>({
    total: 0,
    completed: 0,
    timeouts: 0,
    errors: 0,
    avgDuration: null,
    deviceBreakdown: {},
  });
  const [metricsSortField, setMetricsSortField] = useState<string>('created_at');
  const [metricsSortDirection, setMetricsSortDirection] = useState<'asc' | 'desc'>('desc');

  // -----------------------------------------------------
  // DATA FETCHING - User Analytics
  // -----------------------------------------------------
  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users_with_stats');

      if (error) throw error;

      const usersWithStats: UserWithStats[] = (data || []).map((row: any) => ({
        id: row.id,
        email: row.email || 'No email',
        full_name: row.full_name,
        beta_participant: row.beta_participant || false,
        created_at: row.created_at,
        lesson_count: Number(row.lesson_count) || 0,
        last_lesson_date: row.last_lesson_date,
      }));

      setUsers(usersWithStats);

      const totalUsers = usersWithStats.length;
      const totalLessons = usersWithStats.reduce((sum, u) => sum + u.lesson_count, 0);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const activeUsersThisWeek = usersWithStats.filter(u =>
        u.last_lesson_date && new Date(u.last_lesson_date) >= oneWeekAgo
      ).length;

      const avgLessonsPerUser = totalUsers > 0
        ? Math.round((totalLessons / totalUsers) * 10) / 10
        : 0;

      setPlatformStats({
        totalUsers,
        totalLessons,
        activeUsersThisWeek,
        avgLessonsPerUser,
      });

    } catch (error) {
      console.error('Error fetching user analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load user analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // DATA FETCHING - Generation Metrics
  // -----------------------------------------------------
  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('generation_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(METRICS_DISPLAY.defaultLimit);

      if (error) throw error;

      setMetrics(data || []);

      const records = data || [];
      const completed = records.filter(r => r.status === 'completed');
      const timeouts = records.filter(r => r.status === 'timeout');
      const errors = records.filter(r => r.status === 'error');

      const completedDurations = completed
        .map(r => r.generation_duration_ms)
        .filter((d): d is number => d !== null);

      const avgDuration = completedDurations.length > 0
        ? Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length)
        : null;

      const deviceBreakdown: Record<string, number> = {};
      records.forEach(r => {
        const device = r.device_type || 'unknown';
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
      });

      setMetricsSummary({
        total: records.length,
        completed: completed.length,
        timeouts: timeouts.length,
        errors: errors.length,
        avgDuration,
        deviceBreakdown,
      });

    } catch (error) {
      console.error('Error fetching generation metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load generation metrics.',
        variant: 'destructive',
      });
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchUserLessons = async (userId: string) => {
    setLessonsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_lessons_admin', { _user_id: userId });

      if (error) throw error;
      setUserLessons(data || []);
    } catch (error) {
      console.error('Error fetching user lessons:', error);
      toast({
        title: "Error",
        description: "Failed to load user's lessons.",
        variant: "destructive",
      });
    } finally {
      setLessonsLoading(false);
    }
  };

  // -----------------------------------------------------
  // INITIAL DATA LOAD
  // -----------------------------------------------------
  useEffect(() => {
    fetchUserData();
    fetchMetrics();
  }, []);

  // -----------------------------------------------------
  // EVENT HANDLERS
  // -----------------------------------------------------
  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchUserData(), fetchMetrics()]).finally(() => {
      setRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Analytics data updated.",
      });
    });
  };

  const handleViewUserLessons = (user: UserWithStats) => {
    setSelectedUser(user);
    setUserLessonsDialogOpen(true);
    fetchUserLessons(user.id);
  };

  const handleViewLessonContent = (lesson: UserLesson) => {
    setSelectedLesson(lesson);
    setLessonViewDialogOpen(true);
  };

  const handleSort = (field: 'lesson_count' | 'last_lesson_date' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleMetricsSort = (field: string) => {
    if (metricsSortField === field) {
      setMetricsSortDirection(metricsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setMetricsSortField(field);
      setMetricsSortDirection('desc');
    }
  };

  // -----------------------------------------------------
  // SORTING LOGIC
  // -----------------------------------------------------
  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;

    if (sortField === 'lesson_count') {
      comparison = a.lesson_count - b.lesson_count;
    } else if (sortField === 'last_lesson_date') {
      const dateA = a.last_lesson_date ? new Date(a.last_lesson_date).getTime() : 0;
      const dateB = b.last_lesson_date ? new Date(b.last_lesson_date).getTime() : 0;
      comparison = dateA - dateB;
    } else if (sortField === 'created_at') {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const sortedMetrics = [...metrics].sort((a, b) => {
    let comparison = 0;
    const aVal = a[metricsSortField as keyof MetricsRecord];
    const bVal = b[metricsSortField as keyof MetricsRecord];

    if (metricsSortField === 'created_at') {
      comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
    } else if (metricsSortField === 'generation_duration_ms') {
      comparison = ((aVal as number) || 0) - ((bVal as number) || 0);
    } else if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    }

    return metricsSortDirection === 'asc' ? comparison : -comparison;
  });

  // -----------------------------------------------------
  // HELPER COMPONENTS
  // -----------------------------------------------------
  const SortIcon = ({ field, currentField, direction }: { field: string; currentField: string; direction: 'asc' | 'desc' }) => {
    if (currentField !== field) return null;
    return direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // -----------------------------------------------------
  // LOADING STATE
  // -----------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------
  return (
    <div className="space-y-8">
      {/* ================================================= */}
      {/* SECTION 1: USER ANALYTICS */}
      {/* ================================================= */}
      
      {/* Platform Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{platformStats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{platformStats.totalLessons}</p>
            <p className="text-xs text-muted-foreground">Total Lessons</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{platformStats.activeUsersThisWeek}</p>
            <p className="text-xs text-muted-foreground">Active This Week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{platformStats.avgLessonsPerUser}</p>
            <p className="text-xs text-muted-foreground">Avg Lessons/User</p>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Platform Users
              </CardTitle>
              <CardDescription>
                View all users and their lesson activity
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">Beta</TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('lesson_count')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Lessons
                      <SortIcon field="lesson_count" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('last_lesson_date')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Last Lesson
                      <SortIcon field="last_lesson_date" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Joined
                      <SortIcon field="created_at" currentField={sortField} direction={sortDirection} />
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.full_name || 'No name'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.beta_participant ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={user.lesson_count > 0 ? "default" : "outline"}>
                          {user.lesson_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatDate(user.last_lesson_date)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUserLessons(user)}
                          disabled={user.lesson_count === 0}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Lessons
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ================================================= */}
      {/* SECTION 2: GENERATION METRICS */}
      {/* ================================================= */}
      
      {/* Section Header */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <Activity className="h-5 w-5" />
          Generation Performance Metrics
        </h2>
      </div>

      {/* Generation Metrics Summary Cards */}
      {metricsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{metricsSummary.total}</p>
                <p className="text-xs text-muted-foreground">Total Generations</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{metricsSummary.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{formatDuration(metricsSummary.avgDuration)}</p>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="text-2xl font-bold">{metricsSummary.timeouts + metricsSummary.errors}</p>
                <p className="text-xs text-muted-foreground">Timeouts/Errors</p>
              </CardContent>
            </Card>
          </div>

          {/* Device Breakdown */}
          <Card className="bg-gradient-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Device Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(metricsSummary.deviceBreakdown).map(([device, count]) => (
                  <div key={device} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <DeviceIcon type={device} />
                    <span className="capitalize">{device}</span>
                    <Badge variant="secondary">{count}</Badge>
                    {metricsSummary.total > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((count / metricsSummary.total) * 100)}%)
                      </span>
                    )}
                  </div>
                ))}
                {Object.keys(metricsSummary.deviceBreakdown).length === 0 && (
                  <p className="text-muted-foreground text-sm">No device data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generation History Table */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Generation History
                </CardTitle>
                <CardDescription>
                  Recent lesson generation metrics (last {METRICS_DISPLAY.defaultLimit})
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {METRICS_COLUMNS.map(col => (
                        <TableHead
                          key={col.key}
                          className={col.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                          onClick={() => col.sortable && handleMetricsSort(col.key)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {col.sortable && <SortIcon field={col.key} currentField={metricsSortField} direction={metricsSortDirection} />}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMetrics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={METRICS_COLUMNS.length} className="text-center py-8 text-muted-foreground">
                          No generation metrics found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedMetrics.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm">
                            {format(new Date(record.created_at), METRICS_DISPLAY.dateFormat)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DeviceIcon type={record.device_type} />
                              <span className="capitalize">{record.device_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{record.browser || '—'}</TableCell>
                          <TableCell>{record.os || '—'}</TableCell>
                          <TableCell className={getDurationColor(record.generation_duration_ms)}>
                            {formatDuration(record.generation_duration_ms)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGES[record.status]?.variant || 'outline'}>
                              {STATUS_BADGES[record.status]?.label || record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {record.sections_generated ?? '—'}/{record.sections_requested}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* ================================================= */}
      {/* DIALOGS */}
      {/* ================================================= */}

      {/* User Lessons Dialog */}
      <Dialog open={userLessonsDialogOpen} onOpenChange={setUserLessonsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedUser?.full_name || selectedUser?.email}'s Lesson Library
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {selectedUser?.email}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {selectedUser?.lesson_count} lessons
              </span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {lessonsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : userLessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No lessons found for this user</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userLessons.map((lesson) => (
                  <Card 
                    key={lesson.id} 
                    className="bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleViewLessonContent(lesson)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate flex items-center gap-2">
                            {lesson.title || 'Untitled Lesson'}
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {lesson.scripture_passage && (
                              <Badge variant="outline" className="text-xs">
                                {lesson.scripture_passage}
                              </Badge>
                            )}
                            {lesson.age_group && (
                              <Badge variant="secondary" className="text-xs">
                                {lesson.age_group}
                              </Badge>
                            )}
                            {lesson.bible_version && (
                              <Badge variant="secondary" className="text-xs">
                                {lesson.bible_version.toUpperCase()}
                              </Badge>
                            )}
                            {lesson.theology_profile_id && (
                              <Badge variant="secondary" className="text-xs">
                                {lesson.theology_profile_id.replace(/-/g, ' ')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                          <div className="flex items-center gap-1 justify-end">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(lesson.created_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lesson Content View Dialog */}
      <Dialog open={lessonViewDialogOpen} onOpenChange={setLessonViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedLesson?.title || 'Lesson Details'}
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
                    <span className="font-medium">Bible Version:</span>{' '}
                    {selectedLesson.bible_version?.toUpperCase() || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Theology Profile:</span>{' '}
                    {selectedLesson.theology_profile_id?.replace(/-/g, ' ') || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {formatDateTime(selectedLesson.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>{' '}
                    {formatDateTime(selectedLesson.updated_at)}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Lesson Content:</h4>
                  {selectedLesson.original_text ? (
                    <div
                      className={LESSON_CONTENT_CONTAINER_CLASSES}
                      style={LESSON_CONTENT_CONTAINER_STYLES}
                      dangerouslySetInnerHTML={{ __html: formatLessonContentToHtml(selectedLesson.original_text) }}
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
