/**
 * SIDEBAR CONFIGURATION
 * Single Source of Truth for sidebar navigation items by role
 *
 * ARCHITECTURE:
 * - Follows the exact SSOT pattern of navigationConfig.ts
 * - Defines which sidebar items each role sees, grouped into sections
 * - AppShell.tsx consumes this config
 * - Tab items switch dashboard tabs (no route navigation)
 * - Route items navigate to separate pages
 * - Action items trigger callbacks (profile modal, sign out)
 *
 * GOVERNING PRINCIPLE:
 * Every role lands on the lesson builder. The sidebar adds
 * role-appropriate tools alongside it. Nobody's preparation
 * work is ever displaced. Build Lesson is always first.
 *
 * CONDITIONAL SECTIONS:
 * Sections with `condition` set require runtime evaluation.
 * AppShell checks the condition and omits the section if not met.
 * - 'hasTeam': user is a lead teacher or accepted team member
 *   (from useTeachingTeam hook's hasTeam return value)
 *
 * CHANGELOG:
 * - March 22, 2026: Initial creation for ui-sidebar branch
 */

import {
  PenLine,
  BookOpen,
  Heart,
  Layers,
  Users,
  Building2,
  ShieldCheck,
  Wrench,
  CreditCard,
  CircleUser,
  LogOut,
  GraduationCap,
  LifeBuoy,
  CircleHelp,
  Gift,
  Hammer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLES, Role } from "./accessControl";
import { ROUTES } from "./routes";
import { DASHBOARD_TAB_VALUES } from "./routes";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  /** For tab-switching items -- maps to DASHBOARD_TAB_VALUES */
  tabValue?: string;
  /** For route-navigating items -- maps to ROUTES.* */
  route?: string;
  /** For onClick items (profile modal, sign out) */
  action?: 'openProfile' | 'signOut';
}

export interface SidebarSection {
  id: string;
  label: string;
  items: string[];
  /**
   * Optional runtime condition that must be true to show this section.
   * AppShell evaluates this against a conditions map passed at render time.
   * If omitted, section is always shown for roles that include it.
   */
  condition?: string;
}

// =============================================================================
// ITEM DEFINITIONS
// =============================================================================

export const SIDEBAR_ITEMS: Record<string, SidebarItem> = {
  buildLesson: {
    id: 'buildLesson',
    label: 'Build Lesson',
    icon: PenLine,
    description: 'Create a new Bible study lesson',
    tabValue: DASHBOARD_TAB_VALUES.BUILD,
  },
  lessonLibrary: {
    id: 'lessonLibrary',
    label: 'Lesson Library',
    icon: BookOpen,
    description: 'Browse and manage your lessons',
    tabValue: DASHBOARD_TAB_VALUES.LIBRARY,
  },
  devotionalLibrary: {
    id: 'devotionalLibrary',
    label: 'Devotional Library',
    icon: Heart,
    description: 'Browse and manage devotionals',
    tabValue: DASHBOARD_TAB_VALUES.DEVOTIONAL_LIBRARY,
  },
  seriesLibrary: {
    id: 'seriesLibrary',
    label: 'Series Library',
    icon: Layers,
    description: 'Browse and manage lesson series',
    tabValue: DASHBOARD_TAB_VALUES.SERIES_LIBRARY,
  },
  teachingTeam: {
    id: 'teachingTeam',
    label: 'Teaching Team',
    icon: Users,
    description: 'Share lessons with fellow teachers',
    route: ROUTES.TEACHING_TEAM,
  },
  orgManager: {
    id: 'orgManager',
    label: 'Organization Manager',
    icon: Building2,
    description: 'Manage your organization',
    route: ROUTES.ORG_MANAGER,
  },
  adminPanel: {
    id: 'adminPanel',
    label: 'Administrator Panel',
    icon: ShieldCheck,
    description: 'Platform-wide administration',
    route: ROUTES.ADMIN,
  },
  toolbeltAdmin: {
    id: 'toolbeltAdmin',
    label: 'Manage Toolbelt',
    icon: Wrench,
    description: 'Teacher Toolbelt administration',
    route: ROUTES.ADMIN_TOOLBELT,
  },
  pricing: {
    id: 'pricing',
    label: 'Pricing',
    icon: CreditCard,
    description: 'View plans and pricing',
    route: ROUTES.PRICING,
  },
  userProfile: {
    id: 'userProfile',
    label: 'User Profile',
    icon: CircleUser,
    description: 'Update your profile defaults',
    action: 'openProfile',
  },
  signOut: {
    id: 'signOut',
    label: 'Sign Out',
    icon: LogOut,
    description: 'Sign out of your account',
    action: 'signOut',
  },
  tutorials: {
    id: 'tutorials',
    label: 'Tutorials',
    icon: GraduationCap,
    description: 'Learn how to use BibleLessonSpark',
    route: ROUTES.TRAINING,
  },
  support: {
    id: 'support',
    label: 'Support',
    icon: LifeBuoy,
    description: 'Get help and support',
    route: ROUTES.HELP,
  },
  faqs: {
    id: 'faqs',
    label: 'FAQs',
    icon: CircleHelp,
    description: 'Frequently asked questions',
    route: ROUTES.FAQS,
  },
  bonuses: {
    id: 'bonuses',
    label: 'Resources',
    icon: Gift,
    description: 'Special resources for teachers',
    route: ROUTES.BONUSES,
  },
  moreTools: {
    id: 'moreTools',
    label: 'Teacher Tools',
    icon: Hammer,
    description: 'Additional teaching tools',
    route: ROUTES.MORE_TOOLS,
  },
} as const;

// =============================================================================
// SECTION DEFINITIONS
// =============================================================================

export const SIDEBAR_SECTIONS: Record<string, SidebarSection> = {
  buildAndPrepare: {
    id: 'buildAndPrepare',
    label: 'Build & Prepare',
    items: ['buildLesson', 'lessonLibrary', 'devotionalLibrary', 'seriesLibrary'],
  },
  myTeachingTeam: {
    id: 'myTeachingTeam',
    label: 'My Teaching Team',
    items: ['teachingTeam'],
  },
  myTeachingTeamConditional: {
    id: 'myTeachingTeamConditional',
    label: 'My Teaching Team',
    items: ['teachingTeam'],
    condition: 'hasTeam',
  },
  ministryOversight: {
    id: 'ministryOversight',
    label: 'Ministry Oversight',
    items: ['orgManager'],
  },
  platformAdmin: {
    id: 'platformAdmin',
    label: 'Platform Admin',
    items: ['adminPanel', 'toolbeltAdmin'],
  },
  account: {
    id: 'account',
    label: 'Account',
    items: ['pricing', 'userProfile'],
  },
  resources: {
    id: 'resources',
    label: '',
    items: ['tutorials', 'support', 'faqs', 'bonuses', 'moreTools', 'signOut'],
  },
} as const;

// =============================================================================
// ROLE-BASED SIDEBAR CONFIGURATION
// =============================================================================

/**
 * Defines which sidebar sections each role sees, in display order.
 *
 * - Build & Prepare is always first for every role (governing principle)
 * - individual uses myTeachingTeamConditional (condition: 'hasTeam')
 *   so solo teachers without a team do not see the section
 * - orgLeader and orgMember always see myTeachingTeam (unconditional)
 * - platformAdmin always sees everything
 */
export const SIDEBAR_BY_ROLE: Record<Role, string[]> = {
  [ROLES.platformAdmin]: [
    'buildAndPrepare',
    'myTeachingTeam',
    'ministryOversight',
    'platformAdmin',
    'account',
    'resources',
  ],
  [ROLES.orgLeader]: [
    'buildAndPrepare',
    'myTeachingTeam',
    'ministryOversight',
    'account',
    'resources',
  ],
  [ROLES.orgMember]: [
    'buildAndPrepare',
    'myTeachingTeam',
    'account',
    'resources',
  ],
  [ROLES.individual]: [
    'buildAndPrepare',
    'myTeachingTeamConditional',
    'account',
    'resources',
  ],
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Resolved section with full SidebarItem objects instead of ID strings
 */
export interface ResolvedSidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
  condition?: string;
}

/**
 * Get sidebar sections for a given role, with items resolved to full objects.
 * Sections with a `condition` are included in the result -- AppShell
 * evaluates the condition at render time and hides the section if not met.
 */
export function getSidebarForRole(role: Role): ResolvedSidebarSection[] {
  const sectionIds = SIDEBAR_BY_ROLE[role] || SIDEBAR_BY_ROLE[ROLES.individual];

  return sectionIds
    .map(sectionId => {
      const section = SIDEBAR_SECTIONS[sectionId];
      if (!section) return null;

      const resolvedItems = section.items
        .map(itemId => SIDEBAR_ITEMS[itemId])
        .filter(Boolean);

      return {
        id: section.id,
        label: section.label,
        items: resolvedItems,
        condition: section.condition,
      };
    })
    .filter(Boolean) as ResolvedSidebarSection[];
}

/**
 * Type guards for sidebar item behavior
 */
export function isSidebarTabItem(item: SidebarItem): boolean {
  return item.tabValue !== undefined;
}

export function isSidebarRouteItem(item: SidebarItem): boolean {
  return item.route !== undefined;
}

export function isSidebarActionItem(item: SidebarItem): boolean {
  return item.action !== undefined;
}
