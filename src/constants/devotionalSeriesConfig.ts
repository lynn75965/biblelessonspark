/**
 * Devotional Series SSOT
 * Single Source of Truth for Devotional Series feature (Phase C5)
 *
 * Architecture: Frontend drives backend
 * All user-facing strings for Devotional Series live here.
 * No hardcoded strings in the component.
 *
 * CREATED: March 2026 (Phase C5)
 */

// ============================================================================
// LIMITS
// ============================================================================

export const DEVOTIONAL_SERIES_LIMITS = {
  maxSeriesNameLength: 100,
  maxDescriptionLength: 300,
  /** Soft UI warning threshold -- not a hard cap */
  warningDevotionalCount: 20,
} as const;

// ============================================================================
// UI LABELS
// ============================================================================

export const DEVOTIONAL_SERIES_UI = {
  // Header
  pageTitle: 'My Devotionals',
  pageDescription: 'Browse and manage your generated devotionals',

  // Series section
  seriesSectionTitle: 'Devotional Series',
  newSeriesButton: 'New Devotional Series',
  ungroupedHeading: 'Ungrouped Devotionals',

  // Create modal
  createModalTitle: 'Create Devotional Series',
  createModalDescription: 'Group related devotionals into a named series for easy browsing.',
  seriesNameLabel: 'Series Name',
  seriesNamePlaceholder: 'e.g., Psalms of Comfort',
  seriesDescriptionLabel: 'Description (optional)',
  seriesDescriptionPlaceholder: 'Brief description of this devotional series...',
  createButton: 'Create Series',
  cancelButton: 'Cancel',

  // Add to series
  addToSeriesButton: 'Add to Series',
  addToSeriesTitle: 'Add to Devotional Series',
  addToSeriesDescription: 'Select a series for this devotional.',
  noSeriesAvailable: 'No series yet. Create one first.',

  // Series card
  devotionalCount: (count: number) => `${count} devotional${count !== 1 ? 's' : ''}`,
  expandButton: 'Devotionals',

  // Reorder
  moveUpTitle: 'Move up',
  moveDownTitle: 'Move down',

  // Remove from series
  removeFromSeries: 'Remove from Series',
  removeFromSeriesConfirm: 'Remove this devotional from its series? It will become ungrouped.',

  // Pin
  pinToTop: 'Pin to top',
  unpinSeries: 'Unpin series',
  moveToTopPin: 'Move to top',

  // Delete series
  deleteSeriesButton: 'Delete Series',
  deleteSeriesConfirm: 'Delete this series? Devotionals in this series will NOT be deleted \u2014 they will become ungrouped.',
  deleteSeriesTitle: 'Delete Series',

  // Toast messages
  seriesCreated: 'Devotional series created.',
  seriesDeleted: 'Series deleted. Devotionals are now ungrouped.',
  addedToSeries: 'Devotional added to series.',
  removedFromSeries: 'Devotional removed from series.',
  reorderFailed: 'Failed to reorder devotionals.',
  pinFailed: 'Failed to update pin.',

  // Validation
  nameRequired: 'Series name is required.',
  nameTooLong: (max: number) => `Series name must be ${max} characters or fewer.`,

  // Empty states
  noSeriesYet: 'No devotional series yet',
  noSeriesDescription: 'Create a devotional series to group related devotionals together.',
  noDevotionalsInSeries: 'No devotionals in this series yet.',
  noDevotionals: 'No devotionals yet',
  noDevotionalsDescription: 'Generate your first devotional from a lesson in your Lesson Library.',
  noFilterResults: 'No devotionals match your filters',
  noFilterResultsDescription: 'Try adjusting your search terms or filters.',
} as const;
