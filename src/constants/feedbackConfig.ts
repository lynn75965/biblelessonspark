// ============================================================================
// SSOT: Feedback Configuration
// ============================================================================
// ARCHITECTURE CHANGE: Questions are now stored in the database and managed
// via Admin Panel (FeedbackQuestionsManager.tsx)
//
// This file now contains:
// - Mode toggle (beta vs production)
// - Shared form styles
// - Analytics display configuration
// - Type definitions
//
// To modify survey questions: Use Admin Panel â†’ Beta Feedback Questions
// ============================================================================

// ----------------------------------------------------------------------------
// FEEDBACK MODE TOGGLE
// ----------------------------------------------------------------------------
// Change this to 'production' after beta concludes (December 18, 2025)
// This switches analytics views and the is_beta_feedback flag on submissions

export type FeedbackMode = 'beta' | 'production';

export const CURRENT_FEEDBACK_MODE: FeedbackMode = 'production';

// Beta period dates
export const BETA_PERIOD = {
  startDate: '2025-12-08',
  endDate: '2025-12-18',
  isActive: () => {
    const now = new Date();
    const start = new Date(BETA_PERIOD.startDate);
    const end = new Date(BETA_PERIOD.endDate + 'T23:59:59');
    return now >= start && now <= end;
  },
} as const;

// ----------------------------------------------------------------------------
// FEEDBACK TRIGGER TIMING
// ----------------------------------------------------------------------------
export const FEEDBACK_TRIGGER = {
  exportDelayMs: 3000,  // 3 second delay after export before showing feedback
} as const;

// ----------------------------------------------------------------------------
// FEEDBACK SOURCE (SSOT - Frontend Drives Backend)
// ----------------------------------------------------------------------------
// Where the feedback originated from
// Database CHECK constraint mirrors these values

export const FEEDBACK_SOURCE = {
  FORM: 'form',           // "Give Feedback" button in UI
  POST_EXPORT: 'post_export',  // Quick rating prompt after lesson export
} as const;

export type FeedbackSource = typeof FEEDBACK_SOURCE[keyof typeof FEEDBACK_SOURCE];

// ----------------------------------------------------------------------------
// FEEDBACK CATEGORY (SSOT - Frontend Drives Backend)
// ----------------------------------------------------------------------------
// Type/purpose of the feedback submission
// Database CHECK constraint mirrors these values

export const FEEDBACK_CATEGORY = {
  BUG_REPORT: 'bug_report',
  FEATURE_REQUEST: 'feature_request',
  GENERAL_FEEDBACK: 'general_feedback',
  LESSON_RATING: 'lesson_rating',  // Quick post-export ratings
} as const;

export type FeedbackCategory = typeof FEEDBACK_CATEGORY[keyof typeof FEEDBACK_CATEGORY];

// Category display labels for UI
export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  [FEEDBACK_CATEGORY.BUG_REPORT]: 'Bug Report',
  [FEEDBACK_CATEGORY.FEATURE_REQUEST]: 'Feature Request',
  [FEEDBACK_CATEGORY.GENERAL_FEEDBACK]: 'General Feedback',
  [FEEDBACK_CATEGORY.LESSON_RATING]: 'Lesson Rating',
};

// ----------------------------------------------------------------------------
// FORM STYLING (Shared by all feedback forms)
// ----------------------------------------------------------------------------

export const FEEDBACK_FORM_STYLES = {
  containerClass: 'space-y-6 p-6',
  sectionClass: 'space-y-4',
  questionClass: 'text-sm font-medium text-foreground',
  descriptionClass: 'text-xs text-muted-foreground mt-1',
  starActiveColor: '#f59e0b',
  starInactiveColor: '#d1d5db',
  npsButtonClass: 'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border-2 transition-all text-xs sm:text-sm font-medium',
  npsSelectedClass: 'bg-primary text-white border-primary',
  npsUnselectedClass: 'bg-card text-muted-foreground border-border hover:border-primary',
} as const;

// ----------------------------------------------------------------------------
// ANALYTICS SUMMARY CARDS
// ----------------------------------------------------------------------------
// These define what stats cards to show in the analytics dashboard

export const BETA_SUMMARY_CARDS = [
  {
    key: 'totalFeedback',
    label: 'Total Responses',
    icon: 'MessageSquare',
    format: 'number' as const,
  },
  {
    key: 'averageRating',
    label: 'Average Rating',
    icon: 'Star',
    format: 'decimal' as const,
    suffix: ' / 5',
  },
  {
    key: 'averageNPS',
    label: 'Average NPS',
    icon: 'TrendingUp',
    format: 'decimal' as const,
    suffix: ' / 10',
  },
  {
    key: 'wouldPayPercentage',
    label: 'Would Pay',
    icon: 'DollarSign',
    format: 'percent' as const,
  },
  {
    key: 'avgMinutesSaved',
    label: 'Avg Time Saved',
    icon: 'Clock',
    format: 'number' as const,
    suffix: ' min',
  },
  {
    key: 'easeOfUsePositive',
    label: 'Easy to Use',
    icon: 'ThumbsUp',
    format: 'percent' as const,
  },
] as const;

export const PRODUCTION_SUMMARY_CARDS = [
  {
    key: 'totalFeedback',
    label: 'Total Feedback',
    icon: 'MessageSquare',
    format: 'number' as const,
  },
  {
    key: 'averageRating',
    label: 'Average Rating',
    icon: 'Star',
    format: 'decimal' as const,
    suffix: ' / 5',
  },
  {
    key: 'qualityExcellentPercentage',
    label: 'Excellent Quality',
    icon: 'Award',
    format: 'percent' as const,
  },
  {
    key: 'theologicalAccuratePercentage',
    label: 'Theologically Accurate',
    icon: 'BookOpen',
    format: 'percent' as const,
  },
  {
    key: 'ageAppropriatePercentage',
    label: 'Age Appropriate',
    icon: 'Users',
    format: 'percent' as const,
  },
  {
    key: 'issuesCount',
    label: 'Issues Reported',
    icon: 'AlertTriangle',
    format: 'number' as const,
  },
] as const;

export const ANALYTICS_SUMMARY_CARDS = CURRENT_FEEDBACK_MODE === 'beta'
  ? BETA_SUMMARY_CARDS
  : PRODUCTION_SUMMARY_CARDS;

// ----------------------------------------------------------------------------
// ANALYTICS RESPONSE TABLE COLUMNS
// ----------------------------------------------------------------------------

export const BETA_RESPONSE_TABLE_COLUMNS = [
  { key: 'submitted_at', label: 'Date', width: '120px', sortable: true },
  { key: 'user_email', label: 'Tester', width: '180px', sortable: true },
  { key: 'rating', label: 'Rating', width: '80px', sortable: true },
  { key: 'ease_of_use', label: 'Ease of Use', width: '100px', sortable: true },
  { key: 'lesson_quality', label: 'Quality', width: '100px', sortable: true },
  { key: 'nps_score', label: 'NPS', width: '60px', sortable: true },
  { key: 'would_pay_for', label: 'Would Pay', width: '100px', sortable: true },
  { key: 'minutes_saved', label: 'Time Saved', width: '100px', sortable: true },
  { key: 'positive_comments', label: 'Best Feature', width: '200px', sortable: false },
  { key: 'improvement_suggestions', label: 'Improvements', width: '200px', sortable: false },
  { key: 'ui_issues', label: 'UI Issues', width: '200px', sortable: false },
] as const;

export const PRODUCTION_RESPONSE_TABLE_COLUMNS = [
  { key: 'submitted_at', label: 'Date', width: '120px', sortable: true },
  { key: 'user_email', label: 'User', width: '180px', sortable: true },
  { key: 'rating', label: 'Rating', width: '80px', sortable: true },
  { key: 'lesson_quality', label: 'Quality', width: '120px', sortable: true },
  { key: 'theological_accuracy', label: 'Theology', width: '120px', sortable: true },
  { key: 'age_appropriateness', label: 'Age Fit', width: '100px', sortable: true },
  { key: 'used_in_class', label: 'Used', width: '80px', sortable: true },
  { key: 'has_issue', label: 'Issue?', width: '80px', sortable: true },
  { key: 'comments', label: 'Comments', width: '200px', sortable: false },
] as const;

export const RESPONSE_TABLE_COLUMNS = CURRENT_FEEDBACK_MODE === 'beta'
  ? BETA_RESPONSE_TABLE_COLUMNS
  : PRODUCTION_RESPONSE_TABLE_COLUMNS;

// ----------------------------------------------------------------------------
// ANALYTICS CHARTS CONFIGURATION
// ----------------------------------------------------------------------------

export const BETA_ANALYTICS_CHARTS = {
  ratingDistribution: {
    title: 'Overall Rating Distribution',
    description: 'How testers rated their experience',
    type: 'bar' as const,
    dataKey: 'rating',
  },
  easeOfUseDistribution: {
    title: 'Ease of Use',
    description: 'How easy was it to create lessons?',
    type: 'pie' as const,
    dataKey: 'ease_of_use',
  },
  lessonQualityDistribution: {
    title: 'Lesson Quality',
    description: 'Quality of generated content',
    type: 'pie' as const,
    dataKey: 'lesson_quality',
  },
  npsDistribution: {
    title: 'NPS Score Distribution',
    description: 'Promoters, Passives, and Detractors',
    type: 'pie' as const,
    dataKey: 'nps_score',
  },
  timeSavedDistribution: {
    title: 'Time Saved',
    description: 'Preparation time saved',
    type: 'pie' as const,
    dataKey: 'minutes_saved',
  },
  wouldPayDistribution: {
    title: 'Subscription Interest',
    description: 'Willingness to pay',
    type: 'pie' as const,
    dataKey: 'would_pay_for',
  },
} as const;

export const PRODUCTION_ANALYTICS_CHARTS = {
  ratingDistribution: {
    title: 'Lesson Ratings',
    description: 'How users rate their lessons',
    type: 'bar' as const,
    dataKey: 'rating',
  },
  qualityDistribution: {
    title: 'Content Quality',
    description: 'Lesson quality assessments',
    type: 'pie' as const,
    dataKey: 'lesson_quality',
  },
  theologicalAccuracyDistribution: {
    title: 'Theological Accuracy',
    description: 'Alignment with traditions',
    type: 'pie' as const,
    dataKey: 'theological_accuracy',
  },
  ageAppropriatenessDistribution: {
    title: 'Age Appropriateness',
    description: 'Content suitability',
    type: 'pie' as const,
    dataKey: 'age_appropriateness',
  },
} as const;

export const ANALYTICS_CHARTS = CURRENT_FEEDBACK_MODE === 'beta'
  ? BETA_ANALYTICS_CHARTS
  : PRODUCTION_ANALYTICS_CHARTS;

// ----------------------------------------------------------------------------
// DATE FILTER OPTIONS
// ----------------------------------------------------------------------------

export const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'custom', label: 'Custom Range' },
] as const;

// ----------------------------------------------------------------------------
// EXPORT CONFIGURATION
// ----------------------------------------------------------------------------

export const EXPORT_CONFIG = {
  filename: CURRENT_FEEDBACK_MODE === 'beta' 
    ? 'lessonspark_beta_feedback' 
    : 'lessonspark_user_feedback',
  includeTimestamp: true,
  dateFormat: 'YYYY-MM-DD HH:mm',
} as const;

// ----------------------------------------------------------------------------
// TYPE EXPORTS
// ----------------------------------------------------------------------------

export type DateFilterValue = typeof DATE_FILTER_OPTIONS[number]['value'];
export type AnalyticsChartKey = keyof typeof ANALYTICS_CHARTS;

// Database question type (returned from get_feedback_questions RPC)
export interface FeedbackQuestion {
  id: string;
  questionKey: string;
  columnName: string;
  label: string;
  description: string | null;
  placeholder: string | null;
  type: 'stars' | 'nps' | 'select' | 'boolean' | 'textarea';
  options: Array<{ value: any; label: string; color?: string }> | null;
  required: boolean;
  minValue: number | null;
  maxValue: number | null;
  maxLength: number | null;
  displayOrder: number;
}

// Feedback response type (from database)
export interface FeedbackResponse {
  id: string;
  user_id: string;
  lesson_id: string | null;
  is_beta_feedback: boolean;
  submitted_at: string;
  user_email?: string;
  // All possible columns - populated based on questions answered
  rating?: number;
  nps_score?: number;
  ease_of_use?: string;
  lesson_quality?: string;
  would_pay_for?: string;
  would_recommend?: boolean;
  minutes_saved?: number;
  positive_comments?: string;
  improvement_suggestions?: string;
  ui_issues?: string;
  theological_accuracy?: string;
  age_appropriateness?: boolean;
  used_in_class?: boolean;
  comments?: string;
  has_issue?: boolean;
  issue_details?: string;
}

// Beta analytics stats
export interface BetaFeedbackStats {
  totalFeedback: number;
  averageRating: number;
  averageNPS: number;
  wouldPayPercentage: number;
  avgMinutesSaved: number;
  easeOfUsePositive: number;
  promoters: number;
  passives: number;
  detractors: number;
  ratingDistribution: Record<string, number>;
  easeOfUseDistribution: Record<string, number>;
  lessonQualityDistribution: Record<string, number>;
  timeSavedDistribution: Record<string, number>;
  wouldPayDistribution: Record<string, number>;
}

// Production analytics stats
export interface ProductionFeedbackStats {
  totalFeedback: number;
  averageRating: number;
  qualityExcellentPercentage: number;
  theologicalAccuratePercentage: number;
  ageAppropriatePercentage: number;
  issuesCount: number;
  ratingDistribution: Record<string, number>;
  qualityDistribution: Record<string, number>;
  theologicalAccuracyDistribution: Record<string, number>;
}

export type FeedbackStats = typeof CURRENT_FEEDBACK_MODE extends 'beta'
  ? BetaFeedbackStats
  : ProductionFeedbackStats;
