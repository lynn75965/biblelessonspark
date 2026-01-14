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
  { key: 'tokens_total', label: 'Tokens', sortable: true },
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
  if (ms === null || ms === undefined) return 'â€”';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function getDurationColor(ms: number | null): string {
  if (ms === null) return 'text-muted-foreground';
  if (ms >= TIMEOUT_THRESHOLDS.critical) return 'text-destructive font-semibold';
  if (ms >= TIMEOUT_THRESHOLDS.warning) return 'text-amber-600';
  return 'text-primary';
}

// -----------------------------------------------------
// TOKEN DISPLAY HELPERS
// -----------------------------------------------------
export function formatTokens(count: number | null): string {
  if (count === null || count === undefined) return 'â€”';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

// -----------------------------------------------------
// API USAGE CONFIG
// -----------------------------------------------------
export const API_USAGE_CONFIG = {
  // Anthropic pricing per 1M tokens (as of Dec 2024)
  // Claude Sonnet 4: $3/1M input, $15/1M output
  pricing: {
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  // Warning thresholds
  thresholds: {
    rateLimitWarning: 1, // Any rate limits are concerning
    dailyCostWarning: 10, // $10/day warning
    dailyCostCritical: 50, // $50/day critical
  },
} as const;

export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * API_USAGE_CONFIG.pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * API_USAGE_CONFIG.pricing.outputPer1M;
  return inputCost + outputCost;
}

export function formatCost(amount: number): string {
  if (amount < 0.01) return '< $0.01';
  return `$${amount.toFixed(2)}`;
}

// -----------------------------------------------------
// SUMMARY CARD CONFIG
// -----------------------------------------------------
export const SUMMARY_CARDS = [
  { key: 'total', label: 'Total Generations', icon: 'Activity', colorClass: 'text-primary' },
  { key: 'completed', label: 'Completed', icon: 'CheckCircle', colorClass: 'text-primary' },
  { key: 'avgDuration', label: 'Avg Duration', icon: 'Clock', colorClass: 'text-blue-600' },
  { key: 'timeouts', label: 'Timeouts/Errors', icon: 'AlertTriangle', colorClass: 'text-amber-600' },
] as const;

// -----------------------------------------------------
// API USAGE CARDS CONFIG
// -----------------------------------------------------
export const API_USAGE_CARDS = [
  { key: 'activeNow', label: 'Active Now', icon: 'Loader', colorClass: 'text-blue-600' },
  { key: 'tokensToday', label: 'Tokens Today', icon: 'Zap', colorClass: 'text-purple-600' },
  { key: 'costToday', label: 'Est. Cost Today', icon: 'DollarSign', colorClass: 'text-primary' },
  { key: 'rateLimits', label: 'Rate Limit Hits', icon: 'AlertOctagon', colorClass: 'text-destructive' },
] as const;

// -----------------------------------------------------
// DEVICE BREAKDOWN CONFIG
// -----------------------------------------------------
export const DEVICE_BREAKDOWN = {
  showPercentages: true,
  colorScheme: {
    desktop: 'bg-blue-500',
    tablet: 'bg-primary',
    mobile: 'bg-secondary',
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
