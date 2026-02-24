// SSOT MASTER: Organization Manager/Admin Drill-Down configuration
// Controls sub-tab behavior, labels, and admin capabilities
// Used by: OrganizationManagement.tsx (Admin drill-down), OrgManager.tsx

import { FileText, Users, BookOpen, BarChart3, Target } from "lucide-react";

/**
 * Sub-tabs for organization drill-down view
 * Admin Panel: Full access to all tabs
 * Org Manager: Access based on role permissions
 */
export const ORG_DETAIL_TABS = {
  details: {
    value: "details",
    label: "Details",
    icon: FileText,
    description: "Organization name, denomination, status, description",
    adminOnly: false,
  },
  focus: {
    value: "focus",
    label: "Shared Focus",
    icon: Target,
    description: "Set church-wide passage or theme for coordinated study",
    adminOnly: false,
  },
  members: {
    value: "members",
    label: "Members",
    icon: Users,
    description: "View, add, remove members and change roles",
    adminOnly: false,
  },
  lessons: {
    value: "lessons",
    label: "Lessons",
    icon: BookOpen,
    description: "View lesson metadata and content",
    adminOnly: false,
  },
  analytics: {
    value: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Org-scoped metrics and usage data",
    adminOnly: false,
  },
} as const;

export type OrgDetailTabKey = keyof typeof ORG_DETAIL_TABS;
export const DEFAULT_ORG_DETAIL_TAB: OrgDetailTabKey = "details";

/**
 * Get ordered array of tabs for rendering
 */
export const getOrgDetailTabsArray = () => {
  return Object.values(ORG_DETAIL_TABS);
};
