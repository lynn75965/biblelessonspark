// SSOT MASTER: Dashboard tab configuration
// Controls tab behavior, labels, and navigation rules

export const DASHBOARD_TABS = {
  enhance: {
    value: "enhance",
    label: "Enhance Lesson",
    mobileLabel: "Enhance",
    clearViewingOnClick: true,  // Clear any viewed lesson when navigating here
  },
  library: {
    value: "library",
    label: "My Lesson Library",
    mobileLabel: "Library",
    clearViewingOnClick: false,
  },
  members: {
    value: "members",
    label: "Members",
    mobileLabel: "Members",
    clearViewingOnClick: false,
  },
  analytics: {
    value: "analytics",
    label: "Beta Analytics",
    mobileLabel: "Analytics",
    clearViewingOnClick: false,
  },
  settings: {
    value: "settings",
    label: "Settings",
    mobileLabel: "Settings",
    clearViewingOnClick: false,
  },
} as const;

export type DashboardTabKey = keyof typeof DASHBOARD_TABS;
export const DEFAULT_DASHBOARD_TAB: DashboardTabKey = "enhance";