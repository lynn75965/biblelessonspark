// SSOT MASTER: Dashboard tab configuration
// Controls tab behavior, labels, and navigation rules
//
// ARCHITECTURE: Dashboard.tsx imports labels from this file.
// DO NOT hardcode tab labels in Dashboard.tsx — always use DASHBOARD_TABS.*.label
//
// ACTIVE TABS (February 2026): enhance, library, devotionalLibrary
// Settings tab was removed Feb 14, 2026 (profile moved to modal in Header.tsx)
// Members/Analytics tabs are in org-manager, not dashboard workspace

export const DASHBOARD_TEXT = {
  greeting: "Welcome,",
  subtitle: "Your Personal Bible Study Workspace",
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
