// ============================================================
// BibleLessonSpark - CONVERSION FUNNEL PANEL (B7 read-only view)
// Location: src/components/ConversionFunnelPanel.tsx
//
// Admin Panel -> Growth -> Conversion Funnel. Direct authenticated read of
// conversion_events (RLS: admin_full_access covers SELECT for has_role
// admin -- see supabase/migrations/20260716180000_create_conversion_events.sql).
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
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { BRANDING } from '@/config/branding';
import { CONVERSION_EVENT_TYPES, type ConversionEventType } from '@/constants/conversionEvents';
import {
  CONVERSION_EVENT_LABELS,
  FUNNEL_STAGE_ORDER,
  TRIGGER_SOURCE_LABELS,
  UNSPECIFIED_TRIGGER_SOURCE_LABEL,
  CONVERSION_FUNNEL_COPY,
  DATE_WINDOW_OPTIONS,
  DEFAULT_DATE_WINDOW_DAYS,
  ADMIN_ANALYTICS_ROW_LIMIT,
  RATE_UNAVAILABLE_DISPLAY,
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

interface ConversionEventRow {
  event_type: string;
  trigger_source: string | null;
  created_at: string;
}

export function ConversionFunnelPanel() {
  const [rows, setRows] = useState<ConversionEventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState<7 | 30>(DEFAULT_DATE_WINDOW_DAYS);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
      const { data, error: fetchError } = await supabase
        .from('conversion_events')
        .select('event_type, trigger_source, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(ADMIN_ANALYTICS_ROW_LIMIT);

      if (fetchError) throw fetchError;
      setRows(data || []);
    } catch (err) {
      console.error('Error fetching conversion funnel data:', err);
      setError(CONVERSION_FUNNEL_COPY.errorState);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [windowDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Funnel stage counts, fixed left-to-right order
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    FUNNEL_STAGE_ORDER.forEach((stage) => {
      counts[stage] = 0;
    });
    rows.forEach((row) => {
      if (counts[row.event_type] !== undefined) counts[row.event_type] += 1;
    });
    return FUNNEL_STAGE_ORDER.map((stage, index) => ({
      stage,
      name: CONVERSION_EVENT_LABELS[stage as ConversionEventType],
      value: counts[stage],
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [rows]);

  // Daily trend: impressions vs checkout_started, one bucket per day in window
  const trendData = useMemo(() => {
    const bucketMap: Record<string, { impressions: number; checkouts: number }> = {};
    const order: string[] = [];

    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = format(d, 'yyyy-MM-dd');
      bucketMap[key] = { impressions: 0, checkouts: 0 };
      order.push(key);
    }

    rows.forEach((row) => {
      const key = format(new Date(row.created_at), 'yyyy-MM-dd');
      const bucket = bucketMap[key];
      if (!bucket) return;
      if (row.event_type === CONVERSION_EVENT_TYPES.UPGRADE_PROMPT_IMPRESSION) bucket.impressions += 1;
      if (row.event_type === CONVERSION_EVENT_TYPES.CHECKOUT_STARTED) bucket.checkouts += 1;
    });

    return order.map((key) => ({
      label: format(new Date(key), 'MMM d'),
      impressions: bucketMap[key].impressions,
      checkouts: bucketMap[key].checkouts,
    }));
  }, [rows, windowDays]);

  // Impressions by trigger_source
  const triggerData = useMemo(() => {
    const counts: Record<string, number> = {};
    rows
      .filter((row) => row.event_type === CONVERSION_EVENT_TYPES.UPGRADE_PROMPT_IMPRESSION)
      .forEach((row) => {
        const key = row.trigger_source || '__unspecified';
        counts[key] = (counts[key] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([key, value], index) => ({
        name: key === '__unspecified' ? UNSPECIFIED_TRIGGER_SOURCE_LABEL : (TRIGGER_SOURCE_LABELS[key] || key),
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const impressionsCount = funnelData.find((f) => f.stage === CONVERSION_EVENT_TYPES.UPGRADE_PROMPT_IMPRESSION)?.value ?? 0;
  const clicksCount = funnelData.find((f) => f.stage === CONVERSION_EVENT_TYPES.UPGRADE_CLICK)?.value ?? 0;
  const checkoutsCount = funnelData.find((f) => f.stage === CONVERSION_EVENT_TYPES.CHECKOUT_STARTED)?.value ?? 0;

  const clickThroughRate = impressionsCount > 0
    ? `${((clicksCount / impressionsCount) * 100).toFixed(1)}%`
    : RATE_UNAVAILABLE_DISPLAY;
  const checkoutRate = clicksCount > 0
    ? `${((checkoutsCount / clicksCount) * 100).toFixed(1)}%`
    : RATE_UNAVAILABLE_DISPLAY;

  const hasData = rows.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            {CONVERSION_FUNNEL_COPY.cardTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="sr-only" aria-live="polite">{CONVERSION_FUNNEL_COPY.loadingLabel}</p>
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
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
              {CONVERSION_FUNNEL_COPY.cardTitle}
            </CardTitle>
            <CardDescription>{CONVERSION_FUNNEL_COPY.cardDescription}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              value={String(windowDays)}
              onValueChange={(value) => {
                if (value) setWindowDays(Number(value) as 7 | 30);
              }}
              aria-label={CONVERSION_FUNNEL_COPY.dateWindowAriaLabel}
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
              aria-label={CONVERSION_FUNNEL_COPY.refreshAriaLabel}
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              {CONVERSION_FUNNEL_COPY.refreshButtonLabel}
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
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
            <p className="font-medium">{CONVERSION_FUNNEL_COPY.emptyState}</p>
          </div>
        )}

        {!error && hasData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-primary">{clickThroughRate}</div>
                <div className="text-sm text-muted-foreground">{CONVERSION_FUNNEL_COPY.clickThroughRateLabel}</div>
                <div className="text-xs text-muted-foreground mt-1">{CONVERSION_FUNNEL_COPY.clickThroughRateHint}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-secondary">{checkoutRate}</div>
                <div className="text-sm text-muted-foreground">{CONVERSION_FUNNEL_COPY.checkoutRateLabel}</div>
                <div className="text-xs text-muted-foreground mt-1">{CONVERSION_FUNNEL_COPY.checkoutRateHint}</div>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{CONVERSION_FUNNEL_COPY.funnelSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      allowDecimals={false}
                      label={{ value: CONVERSION_FUNNEL_COPY.countAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" name={CONVERSION_FUNNEL_COPY.countAxisLabel}>
                      <LabelList dataKey="value" position="top" />
                      {funnelData.map((entry, index) => (
                        <Cell key={`funnel-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{CONVERSION_FUNNEL_COPY.trendSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      name={CONVERSION_EVENT_LABELS[CONVERSION_EVENT_TYPES.UPGRADE_PROMPT_IMPRESSION]}
                      stroke={CHART_COLORS_SSOT.primary}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="checkouts"
                      name={CONVERSION_EVENT_LABELS[CONVERSION_EVENT_TYPES.CHECKOUT_STARTED]}
                      stroke={CHART_COLORS_SSOT.burgundy}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{CONVERSION_FUNNEL_COPY.triggerSectionTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {triggerData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{CONVERSION_FUNNEL_COPY.emptyState}</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(200, triggerData.length * 40)}>
                    <BarChart data={triggerData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" name={CONVERSION_FUNNEL_COPY.countAxisLabel}>
                        <LabelList dataKey="value" position="right" />
                        {triggerData.map((entry, index) => (
                          <Cell key={`trigger-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
