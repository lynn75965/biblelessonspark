/**
 * ToolbeltUsageReport.tsx
 * Displays usage statistics for Teacher Toolbelt
 * Location: src/components/admin/toolbelt/ToolbeltUsageReport.tsx
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Calendar, Zap } from 'lucide-react';
import { TOOLBELT_TOOLS, TOOLBELT_THRESHOLDS, getUsageAlertColor } from '@/constants/toolbeltConfig';

interface UsageStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalTokens: number;
  byTool: Record<string, number>;
}

export function ToolbeltUsageReport() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  async function fetchUsageStats() {
    try {
      setLoading(true);
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch all usage data for the month
      const { data, error: fetchError } = await supabase
        .from('toolbelt_usage')
        .select('tool_id, tokens_used, created_at')
        .gte('created_at', startOfMonth)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Calculate stats
      const usageData = data || [];
      
      const todayCount = usageData.filter(r => r.created_at >= startOfDay).length;
      const weekCount = usageData.filter(r => r.created_at >= startOfWeek).length;
      const monthCount = usageData.length;
      const totalTokens = usageData.reduce((sum, r) => sum + (r.tokens_used || 0), 0);

      // Count by tool
      const byTool: Record<string, number> = {};
      usageData.forEach(r => {
        byTool[r.tool_id] = (byTool[r.tool_id] || 0) + 1;
      });

      setStats({
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        totalTokens,
        byTool,
      });
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      setError('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  }

  // Calculate threshold percentage
  const threshold = TOOLBELT_THRESHOLDS.monthlyCallLimit;
  const usagePercent = stats ? Math.round((stats.thisMonth / threshold) * 100) : 0;
  
  // Determine alert color
  const alertColorName = getUsageAlertColor(usagePercent);
  let alertColor = 'text-green-600 bg-green-50';
  let alertLabel = 'Normal';
  if (alertColorName === 'red') {
    alertColor = 'text-red-600 bg-red-50';
    alertLabel = 'Critical';
  } else if (alertColorName === 'yellow') {
    alertColor = 'text-yellow-600 bg-yellow-50';
    alertLabel = 'Warning';
  }

  // Estimate cost (rough estimate: ~$0.003 per 1K tokens for Claude)
  const estimatedCost = stats ? (stats.totalTokens / 1000) * 0.003 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Threshold Alert */}
      <Card className={alertColor}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5" />
              <div>
                <p className="font-semibold">Monthly Usage: {stats?.thisMonth || 0} / {threshold} calls</p>
                <p className="text-sm opacity-80">{usagePercent}% of monthly threshold</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/50">
              {alertLabel}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-2xl">{stats?.today || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">tool calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-2xl">{stats?.thisWeek || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">tool calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">{stats?.thisMonth || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">tool calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Est. Cost (Month)</CardDescription>
            <CardTitle className="text-2xl">${estimatedCost.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stats?.totalTokens?.toLocaleString() || 0} tokens</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage by Tool (This Month)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(TOOLBELT_TOOLS).map(([toolId, tool]) => {
              const count = stats?.byTool[toolId] || 0;
              const percent = stats?.thisMonth ? Math.round((count / stats.thisMonth) * 100) : 0;
              
              return (
                <div key={toolId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{tool.name}</span>
                    <span className="text-muted-foreground">{count} calls ({percent}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
