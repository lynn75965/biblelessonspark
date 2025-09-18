import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Star, 
  Clock, 
  BookOpen, 
  MessageSquare,
  Heart,
  DollarSign,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  averageNPS: number;
  wouldPayPercentage: number;
  averageTimeSaved: number;
  engagementImproved: number;
  wouldRecommendPercentage: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalLessons: number;
  totalEnhancements: number;
  averageSessionTime: number;
}

export function BetaAnalyticsDashboard() {
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { user } = useAuth();

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch feedback statistics
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback')
        .select('rating, minutes_saved, engagement_improved, comments');

      if (feedbackError) throw feedbackError;

      // Process feedback data
      if (feedback && feedback.length > 0) {
        const ratings = feedback.filter(f => f.rating).map(f => f.rating);
        const npsScores: number[] = [];
        const wouldPayResponses: string[] = [];
        const wouldRecommendResponses: boolean[] = [];

        feedback.forEach(f => {
          if (f.comments) {
            try {
              const parsed = JSON.parse(f.comments);
              if (parsed.nps_score !== undefined) npsScores.push(parsed.nps_score);
              if (parsed.would_pay_for) wouldPayResponses.push(parsed.would_pay_for);
              if (parsed.would_recommend !== undefined) wouldRecommendResponses.push(parsed.would_recommend);
            } catch (e) {
              console.error('Error parsing comments:', e);
            }
          }
        });

        const averageRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;

        const averageNPS = npsScores.length > 0 
          ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length 
          : 0;

        const wouldPayPositive = wouldPayResponses.filter(r => 
          r === 'yes-definitely' || r === 'yes-probably'
        ).length;
        const wouldPayPercentage = wouldPayResponses.length > 0 
          ? (wouldPayPositive / wouldPayResponses.length) * 100 
          : 0;

        const wouldRecommendPositive = wouldRecommendResponses.filter(r => r === true).length;
        const wouldRecommendPercentage = wouldRecommendResponses.length > 0 
          ? (wouldRecommendPositive / wouldRecommendResponses.length) * 100 
          : 0;

        const timeSavedValues = feedback
          .filter(f => f.minutes_saved)
          .map(f => f.minutes_saved);
        const averageTimeSaved = timeSavedValues.length > 0 
          ? timeSavedValues.reduce((a, b) => a + b, 0) / timeSavedValues.length 
          : 0;

        const engagementImprovedCount = feedback
          .filter(f => f.engagement_improved === true).length;

        setFeedbackStats({
          totalFeedback: feedback.length,
          averageRating,
          averageNPS,
          wouldPayPercentage,
          averageTimeSaved,
          engagementImproved: engagementImprovedCount,
          wouldRecommendPercentage
        });
      }

      // Fetch user and lesson statistics
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, user_id, created_at');

      if (lessonsError) throw lessonsError;

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('user_id, event, created_at');

      if (eventsError) throw eventsError;

      // Process user statistics
      const uniqueUsers = new Set(lessons?.map(l => l.user_id) || []);
      const activeUsers = new Set(
        events?.filter(e => {
          const eventDate = new Date(e.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return eventDate >= weekAgo;
        }).map(e => e.user_id) || []
      );

      const enhancements = events?.filter(e => 
        e.event === 'lesson_enhanced' || e.event === 'lesson_created'
      ).length || 0;

      setUserStats({
        totalUsers: uniqueUsers.size,
        activeUsers: activeUsers.size,
        totalLessons: lessons?.length || 0,
        totalEnhancements: enhancements,
        averageSessionTime: 25 // Mock data - would calculate from session events
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const exportData = () => {
    const data = {
      feedbackStats,
      userStats,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lessonspark-beta-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading analytics...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Beta Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Insights from your beta user community
            {lastUpdated && (
              <span className="block text-sm mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats?.totalUsers || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Beta Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats?.activeUsers || 0}</p>
                    <p className="text-xs text-muted-foreground">Active This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats?.totalLessons || 0}</p>
                    <p className="text-xs text-muted-foreground">Lessons Created</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {feedbackStats?.averageRating ? feedbackStats.averageRating.toFixed(1) : '0.0'}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>How users are interacting with the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Weekly Active Rate</span>
                  <Badge variant="secondary">
                    {userStats?.totalUsers ? 
                      Math.round(((userStats.activeUsers / userStats.totalUsers) * 100)) : 0
                    }%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg Session Time</span>
                  <Badge variant="outline">{userStats?.averageSessionTime || 0} min</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Enhancements</span>
                  <Badge variant="outline">{userStats?.totalEnhancements || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Value Metrics</CardTitle>
                <CardDescription>How much value users are getting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Avg Time Saved</span>
                  <Badge variant="secondary">
                    {feedbackStats?.averageTimeSaved || 0} min/lesson
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Would Pay $19/mo</span>
                  <Badge variant={feedbackStats && feedbackStats.wouldPayPercentage > 50 ? "default" : "outline"}>
                    {feedbackStats?.wouldPayPercentage.toFixed(0) || 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Engagement Improved</span>
                  <Badge variant="secondary">{feedbackStats?.engagementImproved || 0} users</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Trends</CardTitle>
              <CardDescription>Placeholder for activity charts and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Activity Charts Coming Soon</h3>
              <p className="text-muted-foreground">
                Detailed engagement analytics will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* NPS and Satisfaction */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Net Promoter Score
                </CardTitle>
                <CardDescription>How likely users are to recommend us</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-primary">
                    {feedbackStats?.averageNPS.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Out of 10</div>
                  <Progress 
                    value={(feedbackStats?.averageNPS || 0) * 10} 
                    className="w-full mt-4"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Willingness to Pay
                </CardTitle>
                <CardDescription>Users willing to pay $19/month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-success">
                    {feedbackStats?.wouldPayPercentage.toFixed(0) || '0'}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Would pay for subscription
                  </div>
                  <Progress 
                    value={feedbackStats?.wouldPayPercentage || 0} 
                    className="w-full mt-4"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback Summary
              </CardTitle>
              <CardDescription>
                {feedbackStats?.totalFeedback || 0} feedback responses collected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{feedbackStats?.averageRating.toFixed(1) || '0.0'}</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{feedbackStats?.engagementImproved || 0}</div>
                  <div className="text-sm text-muted-foreground">Engagement Improved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{feedbackStats?.wouldRecommendPercentage.toFixed(0) || '0'}%</div>
                  <div className="text-sm text-muted-foreground">Would Recommend</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}