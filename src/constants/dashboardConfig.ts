// SSOT MASTER: Dashboard tab configuration
// Controls tab behavior, labels, and navigation rules
//
// ARCHITECTURE: Dashboard.tsx imports labels from this file.
// DO NOT hardcode tab labels in Dashboard.tsx -- always use DASHBOARD_TABS.*.label
//
// ACTIVE TABS (February 2026): enhance, library, devotionalLibrary
// Settings tab was removed Feb 14, 2026 (profile moved to modal in Header.tsx)
// Members/Analytics tabs are in org-manager, not dashboard workspace

export const DASHBOARD_TEXT = {
  greeting: "Welcome,",
  subtitle: "Your Personal Bible Study Workspace",
} as const;

// SSOT for LessonLibrary copy: the three zero-result empty-state variants plus
// the lesson-fetch error toast. Moved here June 6, 2026 from inline strings in
// LessonLibrary.tsx and useLessons.tsx so the copy is editable in one place.
// loadError mirrors the genuine-fetch-error toast (unchanged wording); it fires
// only on a real Supabase error after a silent one-time retry, never on a
// zero-row result.
export const LESSON_LIBRARY_TEXT = {
  emptyDefault: {
    heading: "Your Lesson Library is Empty",
    subtext: "Build your first lesson using Step 1 above.",
  },
  emptyFiltered: {
    heading: "No lessons match your filters",
    subtext: "Try adjusting your search terms or filters to find the lessons you're looking for.",
  },
  emptyTeam: {
    heading: "No shared lessons from your team",
    subtext: "When your team members share lessons, they will appear here.",
  },
  loadError: {
    title: "Error loading lessons",
    description: "Failed to load your lessons. Please try again.",
  },
} as const;

export const DASHBOARD_TABS = {
  enhance: {
    value: "enhance",
    label: "Build Lesson",
    mobileLabel: "Enhance",
    clearViewingOnClick: true,  // Clear any viewed lesson when navigating here
  },
  library: {
    value: "library",
    label: "Lesson Library",
    mobileLabel: "Library",
    clearViewingOnClick: false,
  },
  devotionalLibrary: {
    value: "devotional-library",
    label: "Devotional Library",
    mobileLabel: "Devotional",
    clearViewingOnClick: false,
  },
} as const;

export type DashboardTabKey = keyof typeof DASHBOARD_TABS;
export const DEFAULT_DASHBOARD_TAB: DashboardTabKey = "enhance";
