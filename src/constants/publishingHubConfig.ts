// ============================================================================
// PUBLISHING HUB CONFIGURATION - SSOT
// Location: src/constants/publishingHubConfig.ts
//
// Single source of truth for all Publishing Hub UI strings, defaults,
// and content type definitions. No hardcoded strings in the page component.
//
// Consumers:
//   - src/pages/PublishingHub.tsx
// ============================================================================

import {
  SERIES_EXPORT_DEFAULT_FONT,
  SERIES_EXPORT_DEFAULT_COLOR_SCHEME,
} from "@/constants/seriesExportConfig";

// ============================================================================
// CONTENT TYPES
// ============================================================================

export const PUBLISHING_HUB_CONTENT_TYPES = {
  LESSONS: 'lessons',
  DEVOTIONALS: 'devotionals',
  SERIES: 'series',
} as const;

export type PublishingContentType =
  (typeof PUBLISHING_HUB_CONTENT_TYPES)[keyof typeof PUBLISHING_HUB_CONTENT_TYPES];

// ============================================================================
// FORMATS
// ============================================================================

export const PUBLISHING_HUB_FORMATS = {
  FULL_PAGE: 'pdf',
  DOCX: 'docx',
} as const;

export type PublishingFormat =
  (typeof PUBLISHING_HUB_FORMATS)[keyof typeof PUBLISHING_HUB_FORMATS];

// ============================================================================
// DEFAULTS
// ============================================================================

export const PUBLISHING_HUB_DEFAULTS = {
  contentType: PUBLISHING_HUB_CONTENT_TYPES.LESSONS as PublishingContentType,
  format: PUBLISHING_HUB_FORMATS.FULL_PAGE as PublishingFormat,
  fontId: SERIES_EXPORT_DEFAULT_FONT,
  colorSchemeId: SERIES_EXPORT_DEFAULT_COLOR_SCHEME,
} as const;

// ============================================================================
// LOCAL STORAGE
// ============================================================================

export const PUBLISHING_HUB_STORAGE_KEY = 'bls-publishing-hub-prefs';

// ============================================================================
// UI STRINGS
// ============================================================================

export const PUBLISHING_HUB_UI = {
  pageTitle: 'Publishing',
  pageSubtitle: 'Select content, choose your format, and download.',
  // Tab labels
  tabLessons: 'Lessons',
  tabDevotionals: 'Devotionals',
  tabSeries: 'Series',
  // Coming soon
  comingSoon: 'Coming soon',
  comingSoonDescription: 'This content type will be available in a future update.',
  // Content selector
  selectPrompt: 'Select a lesson to begin',
  // Section labels
  fontLabel: 'Body Font',
  colorSchemeLabel: 'Color Scheme',
  colorSchemeNote: 'Applies to headings and decorative elements.',
  formatLabel: 'File Format',
  previewLabel: 'Preview',
  previewNote: 'Preview reflects your font and color scheme selections.',
  // Format labels and descriptions
  formatPdfLabel: 'PDF Document',
  formatPdfDescription: 'Recommended for printing',
  formatDocxLabel: 'Word Document (.docx)',
  formatDocxDescription: 'Opens in Word, Google Docs, LibreOffice',
  // Buttons
  downloadButton: 'Download',
  downloadingButton: 'Downloading...',
  // Empty state
  emptyLessons: 'No lessons yet. Build your first lesson to get started.',
  // Devotionals tab
  devotionalsTabLabel: 'Devotionals',
  noDevotionals: 'No devotionals yet',
  loadingDevotionals: 'Loading devotionals...',
  selectDevotionalPrompt: 'Select a devotional to begin',
  // Series tab
  seriesTabLabel: 'Series',
  noSeries: 'No series yet',
  loadingSeries: 'Loading series...',
  selectSeriesPrompt: 'Select a series to begin',
  // Layout (series)
  layoutLabel: 'Layout',
  includeGroupHandout: 'Include Group Handout',
  // Toasts
  toastPdfSuccess: 'PDF downloaded',
  toastDocxSuccess: 'Document downloaded',
  toastExportError: 'Export failed',
  toastExportErrorDescription: 'Unable to export. Please try again.',
  // Loading
  loadingLessons: 'Loading lessons...',
  // Economical Print
  economicalPrintLabel: 'Economical Print',
  economicalPrintDescription: 'Reduced margins and font size for fewer pages and less ink \u2014 benefit for home printing',
  // Full Size Preview
  previewFullSizeButton: 'Preview Full Size',
  previewZoomHint: 'For best accuracy, set your browser zoom to 100% \u2014 press Ctrl+0 (numeral) in Windows or Cmd+0 (numeral) in Mac.',
  previewModalInstruction: 'This preview shows your lesson at full print size. What you see here is what will print. For best accuracy, set your browser zoom to 100% \u2014 press Ctrl+0 (numeral) in Windows or Cmd+0 (numeral) in Mac.',
  closePreview: 'Close Preview',
  // Search
  searchPlaceholder: 'Search...',
  searchLessonsPlaceholder: 'Search lessons...',
  searchDevotionalsPlaceholder: 'Search devotionals...',
  searchSeriesPlaceholder: 'Search series...',
  // Series preview
  seriesLessonCount: (n: number) => n === 1 ? '1 lesson in this series' : n + ' lessons in this series',
  seriesLoadingLessons: 'Loading lesson list...',
  // Series format constraints
  seriesFormatPdfOnly: 'PDF only for this layout',
  // Series completion status
  seriesComplete: 'Complete',
  seriesInProgress: 'In Progress',
  seriesEmpty: 'Empty',
  // ePub export
  epubButton:          'Download ePub',
  epubButtonWorking:   'Generating ePub...',
  epubDescription:     'For Kindle, Apple Books, and other e-readers',
  epubNoContent:       'No content found for this series.',
} as const;
