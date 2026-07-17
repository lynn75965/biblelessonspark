// ============================================================
// BibleLessonSpark - CAPACITY HEALTH PANEL (B8 read-only view)
// Location: src/components/CapacityHealthPanel.tsx
//
// Admin Panel -> Analytics -> Capacity. Direct authenticated read of
// capacity_events (RLS: admin_full_access only -- see
// supabase/migrations/20260716200000_create_capacity_events.sql). This
// table has no user-facing SELECT policy, so this panel is the only reader.
// Read-only: no writes, no exports, no realtime subscription.
//
// All labels/copy sourced from src/constants/adminAnalyticsConfig.ts.
// Chart colors sourced from BRANDING.colors.* per the CHART_COLORS_SSOT
// pattern established in EnrollmentAnalyticsPanel.tsx.
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { RefreshCw, Activity, AlertCircle, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BRANDING } from '@/config/branding';
import {
  type CapacitySource,
  CAPACITY_EVENT_LABELS,
  CAPACITY_EVENT_ORDER,
  CAPACITY_SOURCE_LABELS,
  CAPACITY_SOURCE_ORDER,
  CAPACITY_HEALTH_COPY,
  DATE_WINDOW_OPTIONS,
  DEFAULT_DATE_WINDOW_DAYS,
  ADMIN_ANALYTICS_ROW_LIMIT,
} from '@/constants/adminAnalyticsConfig';

// SSOT: Chart Colors -- derived from brand colors, same pattern as
// EnrollmentAnalyticsPanel.tsx's CHART_COLORS_SSOT.
const CHART_COLORS_SSOT = {
  primary: BRANDING.colors.primary.DEFAULT,
  primaryLight: BRANDING.colors.primary.light,
  secondary: BRANDING.colors.secondary.DEFAULT,
  secondaryDark: BRANDING.colors.secondary.dark,
  accent: BRANDING.colors.accent.DEFAULT,
  burgundy: BRANDING.colors.burgundy.DEFAULT,
  muted: BRANDING.colors.text.light,
};

const CHART_COLORS = [
  CHART_COLORS_SSOT.primary,
  CHART_COLORS_SSOT.secondary,
  CHART_COLORS_SSOT.burgundy,
  CHART_COLORS_SSOT.accent,
  CHART_COLORS_SSOT.secondaryDark,
];

// Suppresses "0" labels on grouped/multi-bucket charts so a mostly-quiet
// window doesn't get plastered with zero labels.
const nonZeroLabel = (value: number) => (value === 0 ? '' : String(value));

interface CapacityEventRow {
  source: string;
  event_type: string;
  created_at: string;
}

export function CapacityHealthPanel() {
  const [rows, setRows] = useState<CapacityEventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<7 | 30>(DEFAULT_DATE_WINDOW_DAYS);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
      const { data, error: fetchError } = await supabase
        .from('capacity_events')
        .select('source, event_type, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(ADMIN_ANALYTICS_ROW_LIMIT);

      if (fetchError) throw fetchError;
      setRows(data || []);
    } catch (err) {
      console.error('Error fetching capacity health data:', err);
      setError(CAPACITY_HEALTH_COPY.errorState);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Event-type counts grouped by source (one row per source, one field per event type)
  const eventsBySourceData = useMemo(() => {
    const bySource: Record<string, Record<string, number>> = {};
    CAPACITY_SOURCE_ORDER.forEach((source) => {
      bySource[source] = {};
      CAPACITY_EVENT_ORDER.forEach((eventType) => {
        bySource[source][eventType] = 0;
      });
    });
    rows.forEach((row) => {
      const sourceCounts = bySource[row.source];
      if (sourceCounts && sourceCounts[row.event_type] !== undefined) {
        sourceCounts[row.event_type] += 1;
      }
    });
    return CAPACITY_SOURCE_ORDER.map((source) => ({
      name: CAPACITY_SOURCE_LABELS[source as CapacitySource],
      ...bySource[source],
    }));
  }, [rows]);

  // Truncated count per source
  const truncatedBySourceData = useMemo(() => {
    return eventsBySourceData.map((entry, index) => ({
      name: entry.name as string,
      value: (entry.truncated as number) ?? 0,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [eventsBySourceData]);

  // Daily anthropic_terminal_failure trend
  const failureTrendData = useMemo(() => {
    const bucketMap: Record<string, number> = {};
    const order: string[] = [];

    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = format(d, 'yyyy-MM-dd');
      bucketMap[key] = 0;
      order.push(key);
    }

    rows.forEach((row) => {
      if (row.event_type !== 'anthropic_terminal_failure') return;
      const key = format(new Date(row.created_at), 'yyyy-MM-dd');
      if (bucketMap[key] !== undefined) bucketMap[key] += 1;
    });

    return order.map((key) => ({
      label: format(new Date(key), 'MMM d'),
      value: bucketMap[key],
    }));
  }, [rows, windowDays]);

  const quotaDeniedCount = useMemo(
    () => rows.filter((row) => row.event_type === 'quota_denied').length,
    [rows],
  );
  const failClosedCount = useMemo(
    () => rows.filter((row) => row.event_type === 'quota_denied_failclosed').length,
    [rows],
  );

  const hasData = rows.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden="true" />
            {CAPACITY_HEALTH_COPY.cardTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="sr-only" aria-live="polite">{CAPACITY_HEALTH_COPY.loadingLabel}</p>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" aria-hidden="true" />
              {CAPACITY_HEALTH_COPY.cardTitle}
            </CardTitle>
            <CardDescription>{CAPACITY_HEALTH_COPY.cardDescription}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              value={String(windowDays)}
              onValueChange={(value) => {
                if (value) setWindowDays(Number(value) as 7 | 30);
              }}
              aria-label={CAPACITY_HEALTH_COPY.dateWindowAriaLabel}
            >
              {DATE_WINDOW_OPTIONS.map((option) => (
                <ToggleGroupItem key={option.value} value={String(option.value)} aria-label={option.label}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              aria-label={CAPACITY_HEALTH_COPY.refreshAriaLabel}
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              {CAPACITY_HEALTH_COPY.refreshButtonLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg border border-destructive/50 text-destructive text-sm flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {!error && !hasData && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p className="font-medium">{CAPACITY_HEALTH_COPY.emptyState}</p>
          </div>
        )}

        {!error && hasData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-secondary">{quotaDeniedCount}</div>
                <div className="text-sm text-muted-foreground">{CAPACITY_HEALTH_COPY.quotaDeniedStatLabel}</div>
                <div className="text-xs text-muted-foreground mt-1">{CAPACITY_HEALTH_COPY.quotaDeniedStatHint}</div>
              </div>
              <div
                className={cn(
                  'rounded-lg p-4 text-center border',
                  failClosedCount > 0 ? 'bg-destructive/10 border-destructive/50' : 'bg-muted/50 border-transparent',
                )}
                role={failClosedCount > 0 ? 'alert' : undefined}
              >
                <div className="flex items-center justify-center gap-2">
                  <ShieldAlert
                    className={cn('h-5 w-5', failClosedCount > 0 ? 'text-destructive' : 'text-muted-foreground')}
                    aria-hidden="true"
                  />
                  <div className={cn('text-3xl font-bold', failClosedCount > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                    {failClosedCount}
                  </div>
                </div>
                <div className="text-sm font-medium">{CAPACITY_HEALTH_COPY.failClosedStatLabel}</div>
                <div className="text-xs text-muted-foreground mt-1">{CAPACITY_HEALTH_COPY.failClosedStatHint}</div>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{CAPACITY_HEALTH_COPY.eventsBySourceSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventsBySourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      allowDecimals={false}
                      label={{ value: CAPACITY_HEALTH_COPY.countAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <Tooltip />
                    <Legend />
                    {CAPACITY_EVENT_ORDER.map((eventType, index) => (
                      <Bar
                        key={eventType}
                        dataKey={eventType}
                        name={CAPACITY_EVENT_LABELS[eventType]}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      >
                        <LabelList dataKey={eventType} position="top" formatter={nonZeroLabel} style={{ fontSize: 10 }} />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{CAPACITY_HEALTH_COPY.truncationSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={truncatedBySourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      allowDecimals={false}
                      label={{ value: CAPACITY_HEALTH_COPY.countAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" name={CAPACITY_EVENT_LABELS.truncated}>
                      <LabelList dataKey="value" position="top" />
                      {truncatedBySourceData.map((entry, index) => (
                        <Cell key={`truncated-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{CAPACITY_HEALTH_COPY.failureTrendSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={failureTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={CAPACITY_EVENT_LABELS.anthropic_terminal_failure}
                      stroke={CHART_COLORS_SSOT.burgundy}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    >
                      <LabelList dataKey="value" position="top" formatter={nonZeroLabel} style={{ fontSize: 10 }} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
