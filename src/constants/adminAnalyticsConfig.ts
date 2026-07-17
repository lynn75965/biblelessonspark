// ============================================================
// BibleLessonSpark - ADMIN GROWTH/ANALYTICS DISPLAY CONFIG (SSOT)
// Location: src/constants/adminAnalyticsConfig.ts
//
// Single source of truth for every label, tab name, date-window option,
// and row-limit used by the read-only Admin Panel Growth/Analytics views:
//   - src/components/ConversionFunnelPanel.tsx  (conversion_events)
//   - src/components/CapacityHealthPanel.tsx    (capacity_events)
//
// Event-type/source vocabularies are hand-mirrored from two places that
// cannot be imported directly into the Vite frontend bundle:
//   - ConversionEventType IS importable (src/constants/conversionEvents.ts
//     is already a frontend SSOT file) and is re-used here directly.
//   - CapacitySource / CapacityEventType live in
//     supabase/functions/_shared/capacityEvents.ts, which is Deno
//     edge-function land -- hand-mirrored below, same cross-runtime
//     documented pattern as the capacity_events table's SQL CHECK
//     constraints (see that migration's comments). Update both places
//     together when a new source or event type is added.
//
// No hex colors live here -- chart colors come from BRANDING.colors.* via
// the CHART_COLORS_SSOT pattern established in EnrollmentAnalyticsPanel.tsx.
// ============================================================

import { CONVERSION_EVENT_TYPES, type ConversionEventType } from './conversionEvents';

// ============================================================
// CAPACITY EVENT VOCABULARY (hand-mirrored, see header comment)
// ============================================================

export type CapacitySource =
  | 'generate-lesson'
  | 'generate-devotional'
  | 'generate-parable'
  | 'extract-lesson';

export type CapacityEventType =
  | 'quota_denied_failclosed'
  | 'quota_denied'
  | 'rate_limited'
  | 'truncated'
  | 'anthropic_terminal_failure';

// ============================================================
// TAB LABELS
// ============================================================

export const ADMIN_ANALYTICS_TAB_LABELS = {
  conversionFunnel: 'Conversion Funnel',
  system: 'System',
  capacity: 'Capacity',
} as const;

// ============================================================
// DATE WINDOW
// ============================================================

export const DATE_WINDOW_OPTIONS: ReadonlyArray<{ value: 7 | 30; label: string }> = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
];

export const DEFAULT_DATE_WINDOW_DAYS: 7 | 30 = 7;

// Defensive cap on rows pulled per panel fetch -- see B7/B8 volume analysis
// in the Growth/Analytics design proposal. Both events tables only write on
// rejection/decision paths (not per-generation), so 5000 rows comfortably
// covers even a real surge across the 30-day window.
export const ADMIN_ANALYTICS_ROW_LIMIT = 5000;

// Rendered in place of a rate/percentage when its denominator is zero.
// \u2014 is an em dash -- ASCII guard rule (CLAUDE.md Rule #16): never a
// literal Unicode character in source.
export const RATE_UNAVAILABLE_DISPLAY = '\u2014';

// ============================================================
// CONVERSION EVENT LABELS + ORDER (Growth -> Conversion Funnel)
// ============================================================

export const CONVERSION_EVENT_LABELS: Record<ConversionEventType, string> = {
  [CONVERSION_EVENT_TYPES.UPGRADE_PROMPT_IMPRESSION]: 'Prompt Shown',
  [CONVERSION_EVENT_TYPES.UPGRADE_CLICK]: 'Upgrade Clicked',
  [CONVERSION_EVENT_TYPES.UPGRADE_DECLINED]: 'Declined',
  [CONVERSION_EVENT_TYPES.CHECKOUT_STARTED]: 'Checkout Started',
};

// Fixed left-to-right funnel order for the stage bar chart.
export const FUNNEL_STAGE_ORDER: ConversionEventType[] = [
  CONVERSION_EVENT_TYPES.UPGRADE_PROMPT_IMPRESSION,
  CONVERSION_EVENT_TYPES.UPGRADE_CLICK,
  CONVERSION_EVENT_TYPES.UPGRADE_DECLINED,
  CONVERSION_EVENT_TYPES.CHECKOUT_STARTED,
];

// trigger_source values emitted by UpgradePromptModal.tsx (its `trigger` prop).
export const TRIGGER_SOURCE_LABELS: Record<string, string> = {
  limit_reached: 'Limit Reached',
  feature_teaser: 'Feature Teaser',
  manual: 'Manual',
  devotionalLibrary: 'Devotional Library',
  seriesLibrary: 'Series Library',
  teachingTeam: 'Teaching Team',
};

export const UNSPECIFIED_TRIGGER_SOURCE_LABEL = 'Unspecified';

// ============================================================
// CAPACITY EVENT LABELS + ORDER (Analytics -> Capacity)
// ============================================================

export const CAPACITY_EVENT_LABELS: Record<CapacityEventType, string> = {
  rate_limited: 'Rate Limited',
  quota_denied: 'Quota Denied',
  quota_denied_failclosed: 'Fail-Closed Denial',
  truncated: 'Truncated',
  anthropic_terminal_failure: 'Generation Failure',
};

export const CAPACITY_EVENT_ORDER: CapacityEventType[] = [
  'rate_limited',
  'quota_denied',
  'quota_denied_failclosed',
  'truncated',
  'anthropic_terminal_failure',
];

export const CAPACITY_SOURCE_LABELS: Record<CapacitySource, string> = {
  'generate-lesson': 'Lesson Generator',
  'generate-devotional': 'Devotional Generator',
  'generate-parable': 'Parable Generator',
  'extract-lesson': 'Lesson Extractor',
};

export const CAPACITY_SOURCE_ORDER: CapacitySource[] = [
  'generate-lesson',
  'generate-devotional',
  'generate-parable',
  'extract-lesson',
];

// ============================================================
// PANEL COPY
// ============================================================

export const CONVERSION_FUNNEL_COPY = {
  cardTitle: 'Conversion Funnel',
  cardDescription: 'Upgrade-prompt impressions, clicks, declines, and checkout starts.',
  funnelSectionTitle: 'Funnel Stages',
  trendSectionTitle: 'Daily Trend: Impressions vs. Checkout Started',
  triggerSectionTitle: 'Impressions by Trigger Source',
  clickThroughRateLabel: 'Click-Through Rate',
  clickThroughRateHint: 'Upgrade clicks / prompt impressions',
  checkoutRateLabel: 'Checkout Rate',
  checkoutRateHint: 'Checkouts started / upgrade clicks',
  emptyState: 'No events in this window.',
  errorState: 'Unable to load conversion funnel data.',
  loadingLabel: 'Loading conversion funnel data...',
  refreshButtonLabel: 'Refresh',
  refreshAriaLabel: 'Refresh conversion funnel data',
  dateWindowAriaLabel: 'Conversion funnel date window',
  countAxisLabel: 'Events',
} as const;

export const CAPACITY_HEALTH_COPY = {
  cardTitle: 'Capacity Health',
  cardDescription: 'Quota denials, rate limits, truncation, and generation failures across all generators.',
  eventsBySourceSectionTitle: 'Events by Source',
  truncationSectionTitle: 'Truncation by Source',
  failureTrendSectionTitle: 'Generation Failures (Daily)',
  quotaDeniedStatLabel: 'Quota Denied Events',
  quotaDeniedStatHint: 'Raw count -- no reliable denominator available',
  failClosedStatLabel: 'Fail-Closed Denials',
  failClosedStatHint: 'System anomaly, not normal capacity pressure -- investigate if nonzero',
  emptyState: 'No events in this window.',
  errorState: 'Unable to load capacity health data.',
  loadingLabel: 'Loading capacity health data...',
  refreshButtonLabel: 'Refresh',
  refreshAriaLabel: 'Refresh capacity health data',
  dateWindowAriaLabel: 'Capacity health date window',
  countAxisLabel: 'Events',
} as const;
