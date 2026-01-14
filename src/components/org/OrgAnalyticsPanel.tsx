import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, BookOpen, Calendar, UserCheck, RefreshCw, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrgAnalyticsPanelProps {
  organizationId: string;
  organizationName: string;
  betaMode?: boolean;
  betaStartDate?: string | null;
}

interface OrgStats {
  totalMembers: number;
  totalLessons: number;
  lessonsThisMonth: number;
  activeAuthors: number;
  betaMembers: number;
}

export function OrgAnalyticsPanel({ 
  organizationId, 
  organizationName,
  betaMode = false,
  betaStartDate
}: OrgAnalyticsPanelProps) {
  const [stats, setStats] = useState<OrgStats>({
    totalMembers: 0,
    totalLessons: 0,
    lessonsThisMonth: 0,
    activeAuthors: 0,
    betaMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get first day of current month
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Query 1: Total members
      const { count: memberCount, error: memberError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (memberError) throw memberError;

      // Query 2: Total lessons
      const { count: lessonCount, error: lessonError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (lessonError) throw lessonError;

      // Query 3: Lessons this month
      const { count: monthlyCount, error: monthlyError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', firstOfMonth);

      if (monthlyError) throw monthlyError;

      // Query 4: Active authors (distinct user_ids who created lessons)
      const { data: authorData, error: authorError } = await supabase
        .from('lessons')
        .select('user_id')
        .eq('organization_id', organizationId);

      if (authorError) throw authorError;

      const uniqueAuthors = new Set(authorData?.map(l => l.user_id).filter(Boolean));

      // Query 5: Beta members count
      let betaMemberCount = 0;
      if (betaMode) {
        const { count, error: betaError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('joined_during_beta', true);
        
        if (!betaError) {
          betaMemberCount = count || 0;
        }
      }

      setStats({
        totalMembers: memberCount || 0,
        totalLessons: lessonCount || 0,
        lessonsThisMonth: monthlyCount || 0,
        activeAuthors: uniqueAuthors.size,
        betaMembers: betaMemberCount,
      });
    } catch (err) {
      console.error('Error fetching org analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [organizationId, betaMode]);

  const statCards = [
    { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'text-blue-500' },
    { label: 'Total Lessons', value: stats.totalLessons, icon: BookOpen, color: 'text-primary' },
    { label: 'Lessons This Month', value: stats.lessonsThisMonth, icon: Calendar, color: 'text-purple-500' },
    { label: 'Active Authors', value: stats.activeAuthors, icon: UserCheck, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Beta Program Status Card */}
      {betaMode && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Rocket className="h-5 w-5" />
              Beta Program Active
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              This organization is currently running a beta program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-secondary hover:bg-secondary mt-1">Active</Badge>
              </div>
              {betaStartDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">{new Date(betaStartDate).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Beta Testers</p>
                <p className="font-medium">{stats.betaMembers} members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Card */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Organization Analytics
              </CardTitle>
              <CardDescription>Usage metrics for {organizationName}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
              <strong>Error:</strong> {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                        <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
