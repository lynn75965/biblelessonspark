// =====================================================
// METRICS VIEWER CONFIG - Single Source of Truth
// =====================================================
// Location: src/constants/metricsViewerConfig.ts (MASTER)
// Purpose: Display settings for admin Generation Metrics panel
// Last Updated: 2025-12-17
// =====================================================

import { TIMEOUT_THRESHOLDS } from './generationMetrics';

// -----------------------------------------------------
// DISPLAY SETTINGS
// -----------------------------------------------------
export const METRICS_DISPLAY = {
  defaultLimit: 50,
  maxLimit: 200,
  refreshIntervalMs: 60000, // 1 minute auto-refresh
  dateFormat: 'MMM d, yyyy h:mm a',
} as const;

// -----------------------------------------------------
// TABLE COLUMNS
// -----------------------------------------------------
export const METRICS_COLUMNS = [
  { key: 'created_at', label: 'Date/Time', sortable: true },
  { key: 'device_type', label: 'Device', sortable: true },
  { key: 'browser', label: 'Browser', sortable: true },
  { key: 'os', label: 'OS', sortable: true },
  { key: 'generation_duration_ms', label: 'Duration', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'sections_generated', label: 'Sections', sortable: false },
] as const;

// -----------------------------------------------------
// STATUS BADGES
// -----------------------------------------------------
export const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  started: { variant: 'outline', label: 'Started' },
  completed: { variant: 'default', label: 'Completed' },
  timeout: { variant: 'destructive', label: 'Timeout' },
  error: { variant: 'destructive', label: 'Error' },
};

// -----------------------------------------------------
// DEVICE ICONS (Lucide icon names for reference)
// -----------------------------------------------------
export const DEVICE_ICON_MAP: Record<string, string> = {
  mobile: 'Smartphone',
  tablet: 'Tablet',
  desktop: 'Monitor',
  unknown: 'HelpCircle',
};

// -----------------------------------------------------
// DURATION DISPLAY HELPERS
// -----------------------------------------------------
export function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function getDurationColor(ms: number | null): string {
  if (ms === null) return 'text-muted-foreground';
  if (ms >= TIMEOUT_THRESHOLDS.critical) return 'text-red-600 font-semibold';
  if (ms >= TIMEOUT_THRESHOLDS.warning) return 'text-amber-600';
  return 'text-green-600';
}

// -----------------------------------------------------
// SUMMARY CARD CONFIG
// -----------------------------------------------------
export const SUMMARY_CARDS = [
  { key: 'total', label: 'Total Generations', icon: 'Activity', colorClass: 'text-primary' },
  { key: 'completed', label: 'Completed', icon: 'CheckCircle', colorClass: 'text-green-600' },
  { key: 'avgDuration', label: 'Avg Duration', icon: 'Clock', colorClass: 'text-blue-600' },
  { key: 'timeouts', label: 'Timeouts/Errors', icon: 'AlertTriangle', colorClass: 'text-amber-600' },
] as const;

// -----------------------------------------------------
// DEVICE BREAKDOWN CONFIG
// -----------------------------------------------------
export const DEVICE_BREAKDOWN = {
  showPercentages: true,
  colorScheme: {
    desktop: 'bg-blue-500',
    tablet: 'bg-green-500',
    mobile: 'bg-amber-500',
    unknown: 'bg-gray-400',
  },
} as const;

// -----------------------------------------------------
// FILTER OPTIONS (for future use)
// -----------------------------------------------------
export const FILTER_OPTIONS = {
  statuses: ['all', 'completed', 'timeout', 'error', 'started'] as const,
  devices: ['all', 'desktop', 'tablet', 'mobile', 'unknown'] as const,
  timeRanges: [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'all', label: 'All time' },
  ],
} as const;
