/**
 * SSOT: Security & Events Configuration
 * Location: src/constants/securityConfig.ts
 * 
 * This file defines all security monitoring and event tracking configuration.
 * Components read from here - no hardcoded values in components.
 * 
 * SSOT COMPLIANCE:
 * - Frontend constant is the source of truth
 * - Backend RLS enforces access rules
 * - Components import and use these values
 */

// =============================================================================
// EVENT CATEGORIES
// =============================================================================

export const EVENT_CATEGORIES = {
  security: {
    id: 'security',
    label: 'Security Events',
    description: 'Role changes, access attempts, authentication events',
    events: ['security_role_changed', 'security_login_failed', 'security_access_denied'],
    icon: 'Shield',
    color: 'destructive',
  },
  activity: {
    id: 'activity',
    label: 'User Activity',
    description: 'Page views, feature usage, navigation',
    events: ['page_view', 'feature_used'],
    icon: 'Activity',
    color: 'default',
  },
  lessons: {
    id: 'lessons',
    label: 'Lesson Events',
    description: 'Lesson creation, viewing, export actions',
    events: ['lesson_created', 'lesson_viewed', 'lesson_downloaded', 'lesson_copied', 'lesson_printed'],
    icon: 'BookOpen',
    color: 'primary',
  },
  feedback: {
    id: 'feedback',
    label: 'Feedback Events',
    description: 'User feedback submissions',
    events: ['feedback_submitted'],
    icon: 'MessageSquare',
    color: 'secondary',
  },
} as const;

export type EventCategoryId = keyof typeof EVENT_CATEGORIES;

// =============================================================================
// DISPLAY CONFIGURATION
// =============================================================================

export const SECURITY_DISPLAY = {
  // Admin Security Tab settings
  admin: {
    defaultLimit: 50,
    maxLimit: 200,
    showAllUsers: true,
    showUserEmail: true,
    defaultCategories: ['security', 'lessons', 'feedback'] as EventCategoryId[],
    refreshInterval: 30000, // 30 seconds
  },
  // Individual user view (if needed later)
  user: {
    defaultLimit: 20,
    maxLimit: 50,
    showAllUsers: false,
    showUserEmail: false,
    defaultCategories: ['lessons', 'activity'] as EventCategoryId[],
    refreshInterval: 60000, // 60 seconds
  },
} as const;

// =============================================================================
// EVENT TYPE METADATA
// =============================================================================

export const EVENT_METADATA: Record<string, { 
  label: string; 
  description: string; 
  severity: 'info' | 'warning' | 'critical';
}> = {
  // Security events
  security_role_changed: {
    label: 'Role Changed',
    description: 'User role was modified',
    severity: 'warning',
  },
  security_login_failed: {
    label: 'Login Failed',
    description: 'Failed authentication attempt',
    severity: 'warning',
  },
  security_access_denied: {
    label: 'Access Denied',
    description: 'Unauthorized access attempt',
    severity: 'critical',
  },
  // Activity events
  page_view: {
    label: 'Page View',
    description: 'User viewed a page',
    severity: 'info',
  },
  feature_used: {
    label: 'Feature Used',
    description: 'User interacted with a feature',
    severity: 'info',
  },
  // Lesson events
  lesson_created: {
    label: 'Lesson Created',
    description: 'New lesson was generated',
    severity: 'info',
  },
  lesson_viewed: {
    label: 'Lesson Viewed',
    description: 'Lesson was opened for viewing',
    severity: 'info',
  },
  lesson_downloaded: {
    label: 'Lesson Downloaded',
    description: 'Lesson was exported/downloaded',
    severity: 'info',
  },
  lesson_copied: {
    label: 'Lesson Copied',
    description: 'Lesson content was copied',
    severity: 'info',
  },
  lesson_printed: {
    label: 'Lesson Printed',
    description: 'Lesson was sent to print',
    severity: 'info',
  },
  // Feedback events
  feedback_submitted: {
    label: 'Feedback Submitted',
    description: 'User submitted feedback',
    severity: 'info',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all event types for specified categories
 */
export function getEventsForCategories(categoryIds: EventCategoryId[]): string[] {
  return categoryIds.flatMap(id => EVENT_CATEGORIES[id]?.events || []);
}

/**
 * Get category for a specific event type
 */
export function getCategoryForEvent(eventType: string): EventCategoryId | null {
  for (const [categoryId, category] of Object.entries(EVENT_CATEGORIES)) {
    if (category.events.includes(eventType)) {
      return categoryId as EventCategoryId;
    }
  }
  return null;
}

/**
 * Get display metadata for an event type
 */
export function getEventMetadata(eventType: string) {
  return EVENT_METADATA[eventType] || {
    label: eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: 'Event recorded',
    severity: 'info' as const,
  };
}

/**
 * Get severity color class
 */
export function getSeverityColor(severity: 'info' | 'warning' | 'critical'): string {
  switch (severity) {
    case 'critical': return 'text-destructive bg-red-50';
    case 'warning': return 'text-amber-600 bg-amber-50';
    default: return 'text-muted-foreground bg-muted/50';
  }
}
