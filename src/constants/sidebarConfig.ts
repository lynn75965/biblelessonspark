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
 * Sections may carry an optional `condition`. AppShell evaluates it
 * against a conditions map passed at render time and omits the section
 * if not met. No section currently uses one -- Teaching Team is shown to
 * every role via the unconditional `myTeachingTeam` section and gated only
 * at the item level by `tierGate: 'paid_only'`. The mechanism is retained
 * for future use.
 *
 * CHANGELOG:
 * - March 22, 2026: Initial creation for ui-sidebar branch
 * - June 14, 2026: individual role moved from the conditional
 *   `myTeachingTeamConditional` section (condition: 'hasTeam') to the
 *   unconditional `myTeachingTeam` section. The condition created a
 *   chicken-and-egg trap: a paid teacher with no team yet could never
 *   reach /teaching-team to create one. Orphaned conditional section removed.
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
  Printer,
  Megaphone,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLES, Role } from "./accessControl";
import { ROUTES } from "./routes";
import { DASHBOARD_TAB_VALUES } from "./routes";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Tier gating for sidebar items:
 * - 'always': visible and active for all tiers
 * - 'paid_only': visible for all but grayed + locked for free users
 * - 'hidden_free': hidden entirely from free users
 */
export type NavItemTierGate = 'always' | 'paid_only' | 'hidden_free';

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  /** For tab-switching items -- maps to DASHBOARD_TAB_VALUES */
  tabValue?: string;
  /** For route-navigating items -- maps to ROUTES.* */
  route?: string;
  /** For onClick items (profile modal, sign out, upgrade modal) */
  action?: 'openProfile' | 'signOut' | 'openUpgradeModal';
  /** Tier-based visibility gating -- defaults to 'always' if omitted */
  tierGate?: NavItemTierGate;
  /**
   * Per-item upgrade-modal opening copy shown when a free-tier user
   * clicks this locked sidebar item. Read by UpgradePromptModal when
   * trigger === item.id. Governed by CLAUDE.md Copy Governance.
   */
  lockedCopy?: string;
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
    tierGate: 'always',
  },
  lessonLibrary: {
    id: 'lessonLibrary',
    label: 'Lesson Library',
    icon: BookOpen,
    description: 'Browse and manage your lessons',
    tabValue: DASHBOARD_TAB_VALUES.LIBRARY,
    tierGate: 'always',
  },
  devotionalLibrary: {
    id: 'devotionalLibrary',
    label: 'Devotional Library',
    icon: Heart,
    description: 'Browse and manage devotionals',
    tabValue: DASHBOARD_TAB_VALUES.DEVOTIONAL_LIBRARY,
    tierGate: 'paid_only',
    lockedCopy: "Your group's faith doesn't pause on Monday. DevotionalSpark follows them all week -- connecting Sunday's lesson to Tuesday's life.",
  },
  seriesLibrary: {
    id: 'seriesLibrary',
    label: 'Series Library',
    icon: Layers,
    description: 'Browse and manage lesson series',
    tabValue: DASHBOARD_TAB_VALUES.SERIES_LIBRARY,
    tierGate: 'paid_only',
    lockedCopy: "One lesson teaches a truth. A series builds a disciple. Plan weeks ahead and let your group see where you're taking them.",
  },
  parableGenerator: {
    id: 'parableGenerator',
    label: 'Parable Generator',
    icon: Sparkles,
    description: 'Generate modern parables in the teaching style of Jesus',
    route: ROUTES.TOOLBELT_PARABLES,
    tierGate: 'paid_only',
    lockedCopy: "A lesson explains the truth. A parable makes it unforgettable. Teach the way Jesus did -- in stories your group will still be turning over on Tuesday.",
  },
  publishing: {
    id: 'publishing',
    label: 'Publishing',
    icon: Printer,
    description: 'Print and share your lessons, devotionals, and series',
    route: ROUTES.PUBLISH,
    tierGate: 'always',
  },
  teachingTeam: {
    id: 'teachingTeam',
    label: 'Teaching Team',
    icon: Users,
    description: 'Share lessons with fellow teachers',
    route: ROUTES.TEACHING_TEAM,
    tierGate: 'paid_only',
    lockedCopy: "Moses had Aaron. Paul had Timothy. You were never meant to lead alone. Invite your co-teachers and carry this together.",
  },
  orgManager: {
    id: 'orgManager',
    label: 'Organization Manager',
    icon: Building2,
    description: 'Manage your organization',
    route: ROUTES.ORG_MANAGER,
    tierGate: 'hidden_free',
  },
  adminPanel: {
    id: 'adminPanel',
    label: 'Administrator Panel',
    icon: ShieldCheck,
    description: 'Platform-wide administration',
    route: ROUTES.ADMIN,
    tierGate: 'always',
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    description: 'Review and approve outbound content',
    route: ROUTES.ADMIN_MARKETING,
    tierGate: 'always',
  },
  toolbeltAdmin: {
    id: 'toolbeltAdmin',
    label: 'Manage Toolbelt',
    icon: Wrench,
    description: 'Teacher Toolbelt administration',
    route: ROUTES.ADMIN_TOOLBELT,
    tierGate: 'always',
  },
  pricing: {
    id: 'pricing',
    label: 'Pricing',
    icon: CreditCard,
    description: 'View plans and pricing',
    action: 'openUpgradeModal',
    tierGate: 'always',
  },
  userProfile: {
    id: 'userProfile',
    label: 'User Profile',
    icon: CircleUser,
    description: 'Update your profile defaults',
    action: 'openProfile',
    tierGate: 'always',
  },
  signOut: {
    id: 'signOut',
    label: 'Sign Out',
    icon: LogOut,
    description: 'Sign out of your account',
    action: 'signOut',
    tierGate: 'always',
  },
  tutorials: {
    id: 'tutorials',
    label: 'Tutorials',
    icon: GraduationCap,
    description: 'Learn how to use BibleLessonSpark',
    route: ROUTES.TRAINING,
    tierGate: 'always',
  },
  support: {
    id: 'support',
    label: 'Support',
    icon: LifeBuoy,
    description: 'Get help and support',
    route: ROUTES.HELP,
    tierGate: 'always',
  },
  faqs: {
    id: 'faqs',
    label: 'FAQs',
    icon: CircleHelp,
    description: 'Frequently asked questions',
    route: ROUTES.FAQS,
    tierGate: 'always',
  },
  bonuses: {
    id: 'bonuses',
    label: 'Resources',
    icon: Gift,
    description: 'Special resources for teachers',
    route: ROUTES.BONUSES,
    tierGate: 'hidden_free',
  },
  moreTools: {
    id: 'moreTools',
    label: 'Teacher Tools',
    icon: Hammer,
    description: 'Additional teaching tools',
    route: ROUTES.MORE_TOOLS,
    tierGate: 'hidden_free',
  },
} as const;

// =============================================================================
// SECTION DEFINITIONS
// =============================================================================

export const SIDEBAR_SECTIONS: Record<string, SidebarSection> = {
  buildAndPrepare: {
    id: 'buildAndPrepare',
    label: 'Build & Prepare',
    items: ['buildLesson', 'lessonLibrary', 'devotionalLibrary', 'seriesLibrary', 'parableGenerator', 'publishing'],
  },
  myTeachingTeam: {
    id: 'myTeachingTeam',
    label: 'My Teaching Team',
    items: ['teachingTeam'],
  },
  ministryOversight: {
    id: 'ministryOversight',
    label: 'Ministry Oversight',
    items: ['orgManager'],
  },
  platformAdmin: {
    id: 'platformAdmin',
    label: 'Platform Admin',
    items: ['adminPanel', 'toolbeltAdmin', 'marketing'],
  },
  account: {
    id: 'account',
    label: 'Account',
    items: ['userProfile', 'tutorials', 'faqs', 'support', 'pricing', 'signOut'],
  },
  extras: {
    id: 'extras',
    label: '',
    items: ['bonuses', 'moreTools'],
  },
} as const;

// =============================================================================
// ROLE-BASED SIDEBAR CONFIGURATION
// =============================================================================

/**
 * Defines which sidebar sections each role sees, in display order.
 *
 * - Build & Prepare is always first for every role (governing principle)
 * - every role uses the unconditional myTeachingTeam section; free users
 *   see Teaching Team grayed + locked (tierGate: 'paid_only'), paid users
 *   see it active and can create a team + invite up to MAX_TEAM_MEMBERS
 * - platformAdmin always sees everything
 */
export const SIDEBAR_BY_ROLE: Record<Role, string[]> = {
  [ROLES.platformAdmin]: [
    'buildAndPrepare',
    'myTeachingTeam',
    'ministryOversight',
    'extras',
    'platformAdmin',
    'account',
  ],
  [ROLES.orgLeader]: [
    'buildAndPrepare',
    'myTeachingTeam',
    'ministryOversight',
    'account',
    'extras',
  ],
  [ROLES.orgMember]: [
    'buildAndPrepare',
    'myTeachingTeam',
    'account',
    'extras',
  ],
  [ROLES.individual]: [
    'buildAndPrepare',
    'myTeachingTeam',
    'account',
    'extras',
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
