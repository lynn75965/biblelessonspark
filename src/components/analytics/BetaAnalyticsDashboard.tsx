// ============================================================================
// BetaAnalyticsDashboard.tsx
// ============================================================================
// Analytics dashboard for beta feedback - reads from SSOT config
// Features: Trial Management, Summary cards, charts, individual response viewer, CSV export
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  MessageSquare, Star, TrendingUp, DollarSign,
  Clock, ThumbsUp, Download, RefreshCw, Calendar,
  Gift, AlertTriangle, X, Loader2, Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import {
  ANALYTICS_CHARTS,
  ANALYTICS_SUMMARY_CARDS,
  RESPONSE_TABLE_COLUMNS,
  DATE_FILTER_OPTIONS,
  EXPORT_CONFIG,
  CURRENT_FEEDBACK_MODE,
  type FeedbackResponse,
  type DateFilterValue,
  type BetaFeedbackStats,
} from '@/constants/feedbackConfig';
import { BRANDING } from '@/config/branding';

// ============================================================================
// SSOT: Chart Colors (derived from brand colors)
// These must be hex values for Recharts compatibility
// ============================================================================
const CHART_COLORS_SSOT = {
  // Semantic chart colors based on brand palette
  primary: BRANDING.colors.primary.DEFAULT,
  secondary: BRANDING.colors.secondary.DEFAULT,
  accent: BRANDING.colors.accent.DEFAULT,
  destructive: BRANDING.colors.burgundy.DEFAULT,
  muted: BRANDING.colors.text.light,

  // Scale colors for ratings/distributions (green to red spectrum)
  scale: {
    excellent: BRANDING.colors.primary.DEFAULT,    // Forest green
    good: BRANDING.colors.primary.light,           // Light green
    moderate: BRANDING.colors.secondary.DEFAULT,   // Gold/warning
    poor: BRANDING.colors.secondary.dark,          // Dark gold
    critical: BRANDING.colors.burgundy.DEFAULT,    // Burgundy/error
  },

  // NPS-specific colors
  nps: {
    promoter: BRANDING.colors.primary.DEFAULT,     // Forest green
    passive: BRANDING.colors.secondary.DEFAULT,    // Gold
    detractor: BRANDING.colors.burgundy.DEFAULT,   // Burgundy
  },
};

// Array of colors for generic charts
const CHART_COLORS = [
  CHART_COLORS_SSOT.scale.excellent,
  CHART_COLORS_SSOT.scale.good,
  CHART_COLORS_SSOT.scale.moderate,
  CHART_COLORS_SSOT.scale.poor,
  CHART_COLORS_SSOT.scale.critical,
];

const NPS_COLORS = CHART_COLORS_SSOT.nps;

// ============================================================================
// SSOT: Badge Styling Classes (using semantic Tailwind classes)
// ============================================================================
const BADGE_STYLES = {
  // NPS score badges
  nps: {
    promoter: 'bg-primary/10 text-primary',
    passive: 'bg-secondary/20 text-secondary-foreground',
    detractor: 'bg-destructive/10 text-destructive',
  },

  // Ease of use badges
  easeOfUse: {
    'very-easy': 'bg-primary/10 text-primary',
    'easy': 'bg-primary/20 text-primary',
    'moderate': 'bg-secondary/20 text-secondary-foreground',
    'difficult': 'bg-destructive/10 text-destructive',
    'very-difficult': 'bg-destructive/20 text-destructive',
  },

  // Quality badges
  quality: {
    'excellent': 'bg-primary/10 text-primary',
    'good': 'bg-primary/20 text-primary',
    'fair': 'bg-secondary/20 text-secondary-foreground',
    'poor': 'bg-destructive/10 text-destructive',
  },

  // Default fallback
  default: 'bg-muted text-muted-foreground',
};

// ============================================================================
// SSOT: Beta Trial Management Configuration
// ============================================================================
const BETA_TRIAL_CONFIG = {
  enabled: true,

  // Preset date options for quick selection
  presetDates: [
    { value: 7, label: '1 week from today' },
    { value: 14, label: '2 weeks from today' },
    { value: 30, label: '1 month from today' },
    { value: 60, label: '2 months from today' },
    { value: 90, label: '3 months from today' },
  ],

  defaultPresetIndex: 2, // 1 month

  // UI Text (SSOT for white-label customization)
  ui: {
    cardTitle: 'Beta Trial Management',
    cardDescription: 'Manage trial access for all beta testers. Extend or set a new expiration date for all users with active trials.',

    // Stats display
    statsTitle: 'Current Trial Status',
    activeTrialsLabel: 'Active Trials',
    expiringTrialsLabel: 'Expiring in 7 days',
    noTrialLabel: 'No Active Trial',

    // Extend action
    extendButtonText: 'Extend All Trials',
    extendDialogTitle: 'Extend All Beta Trials',
    extendDialogDescription: 'Set a new expiration date for all users who currently have an active trial.',
    newExpirationLabel: 'New Expiration Date:',
    presetLabel: 'Quick Select',
    customDateLabel: 'Or choose a specific date',
    affectedUsersLabel: 'Users affected:',

    // Confirmation
    cancelButton: 'Cancel',
    confirmButton: 'Extend All Trials',
    confirmingButton: 'Extending...',

    // Success/Error
    successTitle: 'Trials Extended',
    successDescription: (count: number, date: string) =>
      `Successfully extended trials for ${count} user${count === 1 ? '' : 's'} until ${date}.`,
    errorTitle: 'Error',
    errorDescription: 'Failed to extend trials. Please try again.',

    // Revoke all action
    revokeAllButtonText: 'Revoke All Trials',
    revokeAllDialogTitle: 'Revoke All Trials',
    revokeAllDialogDescription: 'This will immediately remove trial access from all users. They will lose access to full lessons.',
    revokeAllConfirmButton: 'Revoke All',
    revokeAllSuccessTitle: 'Trials Revoked',
    revokeAllSuccessDescription: (count: number) =>
      `Successfully revoked trials for ${count} user${count === 1 ? '' : 's'}.`,
  },
};

const TRIAL_UI = BETA_TRIAL_CONFIG.ui;
const TRIAL_PRESETS = BETA_TRIAL_CONFIG.presetDates;

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  ThumbsUp,
};

// ============================================================================
// Types
// ============================================================================
interface TrialStats {
  active_trials: number;
  expiring_soon: number;
  no_trial: number;
  total_users: number;
}

// ============================================================================
// Component
// ============================================================================
export function BetaAnalyticsDashboard() {
  const [stats, setStats] = useState<BetaFeedbackStats | null>(null);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('submitted_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Trial management state
  const [trialStats, setTrialStats] = useState<TrialStats | null>(null);
  const [trialStatsLoading, setTrialStatsLoading] = useState(true);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>(
    TRIAL_PRESETS[BETA_TRIAL_CONFIG.defaultPresetIndex].value.toString()
  );
  const [trialCustomDate, setTrialCustomDate] = useState<string>('');

  const { toast } = useToast();

  // --------------------------------------------------------------------------
  // Fetch trial statistics
  // --------------------------------------------------------------------------
  const fetchTrialStats = async () => {
    setTrialStatsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_trial_stats');

      if (error) {
        console.error('Error fetching trial stats:', error);
        setTrialStats({ active_trials: 0, expiring_soon: 0, no_trial: 0, total_users: 0 });
      } else {
        const stats = Array.isArray(data) ? data[0] : data;
        setTrialStats(stats);
      }
    } catch (err) {
      console.error('Error:', err);
      setTrialStats({ active_trials: 0, expiring_soon: 0, no_trial: 0, total_users: 0 });
    } finally {
      setTrialStatsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Calculate the new expiration date based on selection
  // --------------------------------------------------------------------------
  const getNewExpirationDate = (): Date => {
    if (trialCustomDate) {
      return new Date(trialCustomDate);
    }
    const days = parseInt(selectedPreset) || TRIAL_PRESETS[BETA_TRIAL_CONFIG.defaultPresetIndex].value;
    return addDays(new Date(), days);
  };

  // --------------------------------------------------------------------------
  // Handle bulk extend
  // --------------------------------------------------------------------------
  const handleBulkExtend = async () => {
    setExtending(true);
    try {
      const newExpiration = getNewExpirationDate();

      const { data, error } = await supabase.rpc('bulk_extend_trials', {
        p_new_expiration: newExpiration.toISOString(),
        p_extend_mode: 'active_only'
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      const count = result?.affected_count || 0;

      toast({
        title: TRIAL_UI.successTitle,
        description: TRIAL_UI.successDescription(Number(count), format(newExpiration, 'MMMM d, yyyy')),
      });

      setExtendDialogOpen(false);
      setTrialCustomDate('');
      setSelectedPreset(TRIAL_PRESETS[BETA_TRIAL_CONFIG.defaultPresetIndex].value.toString());
      await fetchTrialStats();
    } catch (err) {
      console.error('Error extending trials:', err);
      toast({
        title: TRIAL_UI.errorTitle,
        description: TRIAL_UI.errorDescription,
        variant: 'destructive',
      });
    } finally {
      setExtending(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handle bulk revoke
  // --------------------------------------------------------------------------
  const handleBulkRevoke = async () => {
    setRevoking(true);
    try {
      const { data, error } = await supabase.rpc('bulk_revoke_trials');
      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      const count = result?.affected_count || 0;

      toast({
        title: TRIAL_UI.revokeAllSuccessTitle,
        description: TRIAL_UI.revokeAllSuccessDescription(Number(count)),
      });

      setRevokeDialogOpen(false);
      await fetchTrialStats();
    } catch (err) {
      console.error('Error revoking trials:', err);
      toast({
        title: TRIAL_UI.errorTitle,
        description: TRIAL_UI.errorDescription,
        variant: 'destructive',
      });
    } finally {
      setRevoking(false);
    }
  };

  // Calculate date range
  const getDateRange = (): { start: string | null; end: string | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case 'today':
        return { start: today.toISOString(), end: new Date(today.getTime() + 86400000).toISOString() };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 86400000);
        return { start: yesterday.toISOString(), end: today.toISOString() };
      case 'last7days':
        return { start: new Date(today.getTime() - 7 * 86400000).toISOString(), end: now.toISOString() };
      case 'last30days':
        return { start: new Date(today.getTime() - 30 * 86400000).toISOString(), end: now.toISOString() };
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek.toISOString(), end: now.toISOString() };
      case 'lastWeek':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 7);
        return { start: lastWeekStart.toISOString(), end: lastWeekEnd.toISOString() };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate).toISOString() : null,
          end: customEndDate ? new Date(customEndDate + 'T23:59:59').toISOString() : null
        };
      default:
        return { start: null, end: null };
    }
  };

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dateRange = getDateRange();

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_feedback_analytics', {
          p_mode: CURRENT_FEEDBACK_MODE,
          p_start_date: dateRange.start,
          p_end_date: dateRange.end,
        });

      if (statsError) throw statsError;
      setStats(statsData as BetaFeedbackStats);

      // Fetch individual responses
      const viewName = CURRENT_FEEDBACK_MODE === 'beta' ? 'beta_feedback_view' : 'production_feedback_view';

      let query = supabase
        .from(viewName)
        .select('*')
        .order(sortColumn, { ascending: sortDirection === 'asc' });

      if (dateRange.start) query = query.gte('submitted_at', dateRange.start);
      if (dateRange.end) query = query.lte('submitted_at', dateRange.end);

      const { data: responsesData, error: responsesError } = await query;

      if (responsesError) {
        // Fallback to direct table query
        const { data: fallbackData } = await supabase
          .from('feedback')
          .select('*')
          .eq('is_beta_feedback', CURRENT_FEEDBACK_MODE === 'beta')
          .order(sortColumn, { ascending: sortDirection === 'asc' });
        setResponses((fallbackData || []) as FeedbackResponse[]);
      } else {
        setResponses((responsesData || []) as FeedbackResponse[]);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, customStartDate, customEndDate, sortColumn, sortDirection]);

  useEffect(() => {
    if (BETA_TRIAL_CONFIG.enabled) {
      fetchTrialStats();
    }
  }, []);

  // Chart data transformations
  const ratingChartData = useMemo(() => {
    if (!stats?.ratingDistribution) return [];
    return Object.entries(stats.ratingDistribution).map(([rating, count]) => ({
      rating: `${rating} Star${rating !== '1' ? 's' : ''}`,
      count: count as number,
      fill: CHART_COLORS[parseInt(rating) - 1],
    }));
  }, [stats]);

  const npsChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Promoters (9-10)', value: stats.promoters, fill: NPS_COLORS.promoter },
      { name: 'Passives (7-8)', value: stats.passives, fill: NPS_COLORS.passive },
      { name: 'Detractors (0-6)', value: stats.detractors, fill: NPS_COLORS.detractor },
    ].filter(d => d.value > 0);
  }, [stats]);

  const easeOfUseChartData = useMemo(() => {
    if (!stats?.easeOfUseDistribution) return [];
    const labels: Record<string, string> = {
      'very-easy': 'Very Easy',
      'easy': 'Easy',
      'moderate': 'Moderate',
      'difficult': 'Difficult',
      'very-difficult': 'Very Difficult',
    };
    const colors: Record<string, string> = {
      'very-easy': CHART_COLORS_SSOT.scale.excellent,
      'easy': CHART_COLORS_SSOT.scale.good,
      'moderate': CHART_COLORS_SSOT.scale.moderate,
      'difficult': CHART_COLORS_SSOT.scale.poor,
      'very-difficult': CHART_COLORS_SSOT.scale.critical,
    };
    return Object.entries(stats.easeOfUseDistribution)
      .map(([key, count]) => ({
        name: labels[key] || key,
        value: count as number,
        fill: colors[key] || CHART_COLORS_SSOT.muted,
      }))
      .filter(d => d.value > 0);
  }, [stats]);

  const lessonQualityChartData = useMemo(() => {
    if (!stats?.lessonQualityDistribution) return [];
    const labels: Record<string, string> = {
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor',
    };
    const colors: Record<string, string> = {
      'excellent': CHART_COLORS_SSOT.scale.excellent,
      'good': CHART_COLORS_SSOT.scale.good,
      'fair': CHART_COLORS_SSOT.scale.moderate,
      'poor': CHART_COLORS_SSOT.scale.critical,
    };
    return Object.entries(stats.lessonQualityDistribution)
      .map(([key, count]) => ({
        name: labels[key] || key,
        value: count as number,
        fill: colors[key] || CHART_COLORS_SSOT.muted,
      }))
      .filter(d => d.value > 0);
  }, [stats]);

  const wouldPayChartData = useMemo(() => {
    if (!stats?.wouldPayDistribution) return [];
    const labels: Record<string, string> = {
      'yes-definitely': 'Yes, definitely',
      'yes-probably': 'Yes, probably',
      'maybe': 'Maybe',
      'no': 'No',
    };
    const colors: Record<string, string> = {
      'yes-definitely': CHART_COLORS_SSOT.scale.excellent,
      'yes-probably': CHART_COLORS_SSOT.scale.good,
      'maybe': CHART_COLORS_SSOT.scale.moderate,
      'no': CHART_COLORS_SSOT.scale.critical,
    };
    return Object.entries(stats.wouldPayDistribution)
      .map(([key, count]) => ({
        name: labels[key] || key,
        value: count as number,
        fill: colors[key] || CHART_COLORS_SSOT.muted,
      }))
      .filter(d => d.value > 0);
  }, [stats]);

  const timeSavedChartData = useMemo(() => {
    if (!stats?.timeSavedDistribution) return [];
    const labels: Record<string, string> = { '15': '15 min', '30': '30 min', '60': '1 hour', '120': '2+ hours' };
    return Object.entries(stats.timeSavedDistribution)
      .map(([time, count], index) => ({
        name: labels[time] || time,
        value: count as number,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .filter(d => d.value > 0);
  }, [stats]);

  // CSV Export
  const handleExport = () => {
    if (responses.length === 0) return;

    const headers = RESPONSE_TABLE_COLUMNS.map(col => col.label).join(',');
    const rows = responses.map(response =>
      RESPONSE_TABLE_COLUMNS.map(col => {
        const value = response[col.key as keyof FeedbackResponse];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return value;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = EXPORT_CONFIG.includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
    a.href = url;
    a.download = `${EXPORT_CONFIG.filename}${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format cell value
  const formatCellValue = (key: string, value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return '-';

    switch (key) {
      case 'submitted_at':
        return new Date(value as string).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
      case 'rating':
        return (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            {value}
          </div>
        );
      case 'nps_score':
        const nps = value as number;
        const npsStyle = nps >= 9 ? BADGE_STYLES.nps.promoter
          : nps >= 7 ? BADGE_STYLES.nps.passive
          : BADGE_STYLES.nps.detractor;
        return <Badge className={npsStyle}>{nps}</Badge>;
      case 'ease_of_use':
        const easeStyle = BADGE_STYLES.easeOfUse[value as keyof typeof BADGE_STYLES.easeOfUse] || BADGE_STYLES.default;
        return <Badge className={easeStyle}>{value}</Badge>;
      case 'lesson_quality':
        const qualityStyle = BADGE_STYLES.quality[value as keyof typeof BADGE_STYLES.quality] || BADGE_STYLES.default;
        return <Badge className={qualityStyle}>{value}</Badge>;
      case 'minutes_saved':
        const labels: Record<number, string> = { 15: '15 min', 30: '30 min', 60: '1 hour', 120: '2+ hrs' };
        return labels[value as number] || `${value} min`;
      case 'would_pay_for':
        return value;
      case 'positive_comments':
      case 'improvement_suggestions':
      case 'ui_issues':
        const text = value as string;
        return text.length > 50 ? `${text.substring(0, 50)}...` : text;
      default:
        return String(value);
    }
  };

  // Loading state
  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ANALYTICS_SUMMARY_CARDS.map((card) => (
            <Card key={card.key}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ====================================================================
          BETA TRIAL MANAGEMENT CARD
          ==================================================================== */}
      {BETA_TRIAL_CONFIG.enabled && (
        <Card className="bg-gradient-card border-secondary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-secondary" />
              {TRIAL_UI.cardTitle}
            </CardTitle>
            <CardDescription>{TRIAL_UI.cardDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trial Statistics */}
            <div className="space-y-3">
              <Label className="text-base font-medium">{TRIAL_UI.statsTitle}</Label>
              {trialStatsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading statistics...
                </div>
              ) : trialStats ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-primary/5 border border-primary/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{trialStats.active_trials}</div>
                    <div className="text-xs text-primary">{TRIAL_UI.activeTrialsLabel}</div>
                  </div>
                  <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-secondary-foreground">{trialStats.expiring_soon}</div>
                    <div className="text-xs text-secondary-foreground">{TRIAL_UI.expiringTrialsLabel}</div>
                  </div>
                  <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-foreground">{trialStats.no_trial}</div>
                    <div className="text-xs text-muted-foreground">{TRIAL_UI.noTrialLabel}</div>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-accent-foreground">{trialStats.total_users}</div>
                    <div className="text-xs text-muted-foreground">Total Users</div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => setExtendDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
                disabled={!trialStats || trialStats.active_trials === 0}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {TRIAL_UI.extendButtonText}
              </Button>
              <Button
                onClick={() => setRevokeDialogOpen(true)}
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                disabled={!trialStats || trialStats.active_trials === 0}
              >
                <X className="h-4 w-4 mr-2" />
                {TRIAL_UI.revokeAllButtonText}
              </Button>
              <Button
                onClick={fetchTrialStats}
                variant="ghost"
                size="sm"
                disabled={trialStatsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${trialStatsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">
          {CURRENT_FEEDBACK_MODE === 'beta' ? 'Beta Feedback Analytics' : 'User Feedback Analytics'}
        </h2>
        <div className="flex items-center gap-3">
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilterValue)}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm" />
              <span>to</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm" />
            </div>
          )}

          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={responses.length === 0}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {ANALYTICS_SUMMARY_CARDS.map((card) => {
          const Icon = ICON_MAP[card.icon];
          const value = stats?.[card.key as keyof BetaFeedbackStats];

          let displayValue: string;
          if (value === undefined || value === null) displayValue = '-';
          else if (card.format === 'percent') displayValue = `${value}%`;
          else if (card.format === 'decimal') displayValue = typeof value === 'number' ? value.toFixed(1) : String(value);
          else displayValue = String(value);

          return (
            <Card key={card.key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  {Icon && <Icon className="h-4 w-4" />}
                  {card.label}
                </div>
                <div className="text-2xl font-bold">
                  {displayValue}
                  {card.suffix && <span className="text-sm font-normal text-muted-foreground">{card.suffix}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="responses">Individual Responses ({responses.length})</TabsTrigger>
        </TabsList>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Rating Distribution</CardTitle>
                <CardDescription>Star ratings from beta users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ratingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Responses">
                      {ratingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ease of Use */}
            <Card>
              <CardHeader>
                <CardTitle>Ease of Use</CardTitle>
                <CardDescription>How easy was it to create lessons?</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={easeOfUseChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {easeOfUseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lesson Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Lesson Content Quality</CardTitle>
                <CardDescription>Quality of generated content</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={lessonQualityChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {lessonQualityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* NPS Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>NPS Score Distribution</CardTitle>
                <CardDescription>Promoters, Passives, and Detractors</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={npsChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                      paddingAngle={5} dataKey="value" labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {npsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Would Pay */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Interest</CardTitle>
                <CardDescription>Willingness to pay for subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={wouldPayChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {wouldPayChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Time Saved */}
            <Card>
              <CardHeader>
                <CardTitle>Time Saved</CardTitle>
                <CardDescription>Preparation time saved</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={timeSavedChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {timeSavedChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Responses Tab */}
        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Individual Feedback Responses</CardTitle>
              <CardDescription>
                Click column headers to sort. Showing {responses.length} response{responses.length !== 1 ? 's' : ''}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {RESPONSE_TABLE_COLUMNS.map((col) => (
                        <TableHead
                          key={col.key}
                          style={{ width: col.width, minWidth: col.width }}
                          className={col.sortable ? 'cursor-pointer hover:bg-muted' : ''}
                          onClick={() => {
                            if (col.sortable) {
                              if (sortColumn === col.key) {
                                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortColumn(col.key);
                                setSortDirection('desc');
                              }
                            }
                          }}
                        >
                          {col.label}
                          {sortColumn === col.key && (
                            <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={RESPONSE_TABLE_COLUMNS.length} className="text-center py-8 text-muted-foreground">
                          No feedback responses found for the selected date range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      responses.map((response) => (
                        <TableRow key={response.id}>
                          {RESPONSE_TABLE_COLUMNS.map((col) => (
                            <TableCell
                              key={col.key}
                              className={['positive_comments', 'improvement_suggestions', 'ui_issues'].includes(col.key) ? 'max-w-[200px] truncate' : ''}
                              title={['positive_comments', 'improvement_suggestions', 'ui_issues'].includes(col.key)
                                ? (response[col.key as keyof FeedbackResponse] as string) || ''
                                : undefined
                              }
                            >
                              {formatCellValue(col.key, response[col.key as keyof FeedbackResponse])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====================================================================
          EXTEND ALL TRIALS DIALOG
          ==================================================================== */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {TRIAL_UI.extendDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {TRIAL_UI.extendDialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preset Selection */}
            <div className="space-y-2">
              <Label>{TRIAL_UI.presetLabel}</Label>
              <Select
                value={selectedPreset}
                onValueChange={(val) => {
                  setSelectedPreset(val);
                  setTrialCustomDate('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIAL_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value.toString()}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date */}
            <div className="space-y-2">
              <Label>{TRIAL_UI.customDateLabel}</Label>
              <Input
                type="date"
                value={trialCustomDate}
                onChange={(e) => {
                  setTrialCustomDate(e.target.value);
                  if (e.target.value) {
                    setSelectedPreset('');
                  }
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Preview */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="text-sm">
                <span className="text-muted-foreground">{TRIAL_UI.newExpirationLabel}</span>{' '}
                <strong>{format(getNewExpirationDate(), 'MMMM d, yyyy')}</strong>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{TRIAL_UI.affectedUsersLabel}</span>{' '}
                <Badge variant="secondary">{trialStats?.active_trials || 0} users</Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExtendDialogOpen(false);
                setTrialCustomDate('');
                setSelectedPreset(TRIAL_PRESETS[BETA_TRIAL_CONFIG.defaultPresetIndex].value.toString());
              }}
              disabled={extending}
            >
              {TRIAL_UI.cancelButton}
            </Button>
            <Button
              onClick={handleBulkExtend}
              disabled={extending}
              className="bg-primary hover:bg-primary/90"
            >
              {extending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {TRIAL_UI.confirmingButton}
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  {TRIAL_UI.confirmButton}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================================
          REVOKE ALL TRIALS CONFIRMATION
          ==================================================================== */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {TRIAL_UI.revokeAllDialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {TRIAL_UI.revokeAllDialogDescription}
              <div className="mt-3">
                <Badge variant="secondary">{trialStats?.active_trials || 0} users will be affected</Badge>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>{TRIAL_UI.cancelButton}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkRevoke}
              disabled={revoking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {revoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                TRIAL_UI.revokeAllConfirmButton
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BetaAnalyticsDashboard;
