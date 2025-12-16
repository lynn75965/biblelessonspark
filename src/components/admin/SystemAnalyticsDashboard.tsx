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
  FileText,
  Download,
  Clock,
  TrendingUp,
  User,
  Mail,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Types - SSOT: uses beta_participant to match database column name
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
  scripture_passage: string | null;
  age_group: string | null;
  theology_profile_id: string | null;
  bible_version: string | null;
  created_at: string;
  updated_at: string;
}

// Platform stats summary
interface PlatformStats {
  totalUsers: number;
  totalLessons: number;
  activeUsersThisWeek: number;
  avgLessonsPerUser: number;
}

export function SystemAnalyticsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalLessons: 0,
    activeUsersThisWeek: 0,
    avgLessonsPerUser: 0,
  });
  
  // Selected user for viewing lessons
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [userLessons, setUserLessons] = useState<UserLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'lesson_count' | 'last_lesson_date' | 'created_at'>('lesson_count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchData = async () => {
    try {
      // Use SECURITY DEFINER function to get all users with stats (admin only)
      const { data, error } = await supabase.rpc('get_all_users_with_stats');

      if (error) throw error;

      // Map RPC results to component state - SSOT: uses beta_participant
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

      // Calculate platform stats from the data
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
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserLessons = async (userId: string) => {
    setLessonsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, scripture_passage, age_group, theology_profile_id, bible_version, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    toast({
      title: "Refreshing",
      description: "Loading latest analytics data...",
    });
  };

  const handleViewLessons = (user: UserWithStats) => {
    setSelectedUser(user);
    setDialogOpen(true);
    fetchUserLessons(user.id);
  };

  const handleSort = (field: 'lesson_count' | 'last_lesson_date' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort users
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

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 inline ml-1" /> : 
      <ChevronDown className="h-4 w-4 inline ml-1" />;
  };

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Overview Card */}
      <Card className="bg-gradient-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Platform Overview
            </CardTitle>
            <CardDescription>
              All users and lesson activity across the platform
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{platformStats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{platformStats.totalLessons}</p>
              <p className="text-xs text-muted-foreground">Total Lessons</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{platformStats.activeUsersThisWeek}</p>
              <p className="text-xs text-muted-foreground">Active This Week</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{platformStats.avgLessonsPerUser}</p>
              <p className="text-xs text-muted-foreground">Avg Lessons/User</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Users Table */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Users ({users.length})
          </CardTitle>
          <CardDescription>
            Click "View Lessons" to see any user's lesson library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">User</TableHead>
                  <TableHead className="text-center">Beta Tester</TableHead>
                  <TableHead 
                    className="text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('lesson_count')}
                  >
                    Lessons <SortIcon field="lesson_count" />
                  </TableHead>
                  <TableHead 
                    className="text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('last_lesson_date')}
                  >
                    Last Active <SortIcon field="last_lesson_date" />
                  </TableHead>
                  <TableHead 
                    className="text-center cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('created_at')}
                  >
                    Joined <SortIcon field="created_at" />
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
                          onClick={() => handleViewLessons(user)}
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

      {/* User Lessons Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  <Card key={lesson.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">
                            {lesson.title || 'Untitled Lesson'}
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
    </div>
  );
}
