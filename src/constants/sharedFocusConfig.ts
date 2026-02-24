/**
 * Shared Focus Configuration - SSOT
 * 
 * Controls org-wide passage/theme assignments for coordinated Bible study.
 * Org Leaders can set church-wide focus that teachers see when generating lessons.
 * 
 * Architecture: Frontend drives backend
 * This file syncs to: supabase/functions/_shared/sharedFocusConfig.ts
 * 
 * CREATED: December 2025
 */

import { Calendar, BookOpen, Lightbulb } from "lucide-react";

// ============================================================================
// FOCUS TYPE OPTIONS
// ============================================================================

export const FOCUS_TYPES = {
  passage: {
    id: "passage",
    label: "Scripture Passage",
    description: "Assign a specific Bible passage for all teachers",
    icon: BookOpen,
    requiresPassage: true,
    requiresTheme: false,
  },
  theme: {
    id: "theme", 
    label: "Theme/Topic",
    description: "Assign a theme or topic without specific passage",
    icon: Lightbulb,
    requiresPassage: false,
    requiresTheme: true,
  },
  both: {
    id: "both",
    label: "Passage + Theme",
    description: "Assign both a passage and a unifying theme",
    icon: Calendar,
    requiresPassage: true,
    requiresTheme: true,
  },
} as const;

export type FocusTypeKey = keyof typeof FOCUS_TYPES;
export const FOCUS_TYPE_VALUES = Object.keys(FOCUS_TYPES) as FocusTypeKey[];

// ============================================================================
// VALIDATION RULES (matches validation.ts)
// ============================================================================

export const SHARED_FOCUS_VALIDATION = {
  PASSAGE_MAX_LENGTH: 200,
  THEME_MAX_LENGTH: 200,
  NOTES_MAX_LENGTH: 1000,
  MAX_DATE_RANGE_DAYS: 90, // Max 3 months per focus period
} as const;

// ============================================================================
// STATUS OPTIONS
// ============================================================================

export const FOCUS_STATUS = {
  active: {
    id: "active",
    label: "Active",
    description: "Currently in effect",
    badgeVariant: "default" as const,
  },
  upcoming: {
    id: "upcoming", 
    label: "Upcoming",
    description: "Scheduled for future dates",
    badgeVariant: "secondary" as const,
  },
  past: {
    id: "past",
    label: "Past",
    description: "Date range has ended",
    badgeVariant: "outline" as const,
  },
} as const;

export type FocusStatusKey = keyof typeof FOCUS_STATUS;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine focus status based on date range
 */
export function getFocusStatus(startDate: string, endDate: string): FocusStatusKey {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to start of day for accurate comparison
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "active";
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: "short", 
    day: "numeric",
    year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined
  };
  
  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", { ...options, year: "numeric" });
  
  return `${startStr} - ${endStr}`;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) {
    return { valid: false, error: "End date must be on or after start date" };
  }
  
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > SHARED_FOCUS_VALIDATION.MAX_DATE_RANGE_DAYS) {
    return { valid: false, error: `Date range cannot exceed ${SHARED_FOCUS_VALIDATION.MAX_DATE_RANGE_DAYS} days` };
  }
  
  return { valid: true };
}

// ============================================================================
// INTERFACE
// ============================================================================

export interface SharedFocus {
  id: string;
  organization_id: string;
  focus_type: FocusTypeKey;
  passage: string | null;
  theme: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_SHARED_FOCUS: Omit<SharedFocus, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'> = {
  focus_type: "passage",
  passage: null,
  theme: null,
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week default
  notes: null,
};
