/**
 * NAVIGATION CONFIGURATION
 * Single Source of Truth for header menu items by role
 *
 * ARCHITECTURE:
 * - Defines which menu items each role sees
 * - Header.tsx consumes this config
 * - Routes must exist in App.tsx
 *
 * TERMINOLOGY:
 * - Administrator = platformAdmin (Lynn only)
 * - Organization Manager = orgLeader (church leaders)
 * - Organization Member = orgMember
 * - Individual User = individual
 *
 * CHANGELOG:
 * - Jan 29, 2026: Added toolbeltAdmin for Teacher Toolbelt management
 * - Feb 9, 2026: Added teachingTeam for Phase 27 Teaching Team
 */

import { Shield, Building2, LayoutDashboard, Settings, LogOut, Sparkles, CreditCard, Wrench, Users } from "lucide-react";
import { ROLES, Role } from "./accessControl";
import { ROUTES as APP_ROUTES } from "./routes";

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

const NAV_ROUTES = {
  admin: APP_ROUTES.ADMIN,
  org: APP_ROUTES.ORG,
  workspace: APP_ROUTES.DASHBOARD,
  parables: APP_ROUTES.PARABLES,
  pricing: APP_ROUTES.PRICING,
  account: APP_ROUTES.ACCOUNT,
  toolbeltAdmin: APP_ROUTES.ADMIN_TOOLBELT,
  teachingTeam: APP_ROUTES.TEACHING_TEAM,
} as const;

// =============================================================================
// MENU ITEM DEFINITIONS
// =============================================================================

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon: typeof Shield;
  description?: string;
  dividerAfter?: boolean;
}

export const NAVIGATION_ITEMS: Record<string, NavigationItem> = {
  adminPanel: {
    id: 'adminPanel',
    label: 'Administrator Panel',
    route: NAV_ROUTES.admin,
    icon: Shield,
    description: 'Platform-wide administration',
    dividerAfter: false,
  },
  toolbeltAdmin: {
    id: 'toolbeltAdmin',
    label: 'Manage Toolbelt',
    route: NAV_ROUTES.toolbeltAdmin,
    icon: Wrench,
    description: 'Teacher Toolbelt administration',
    dividerAfter: false,
  },
  orgManager: {
    id: 'orgManager',
    label: 'Organization Manager',
    route: NAV_ROUTES.org,
    icon: Building2,
    description: 'Manage your organization',
    dividerAfter: false,
  },
  teachingTeam: {
    id: 'teachingTeam',
    label: 'Teaching Team',
    route: NAV_ROUTES.teachingTeam,
    icon: Users,
    description: 'Share lessons with fellow teachers',
    dividerAfter: false,
  },
  workspace: {
    id: 'workspace',
    label: 'My Workspace',
    route: NAV_ROUTES.workspace,
    icon: LayoutDashboard,
    description: 'Your personal lessons',
    dividerAfter: false,
  },
  parables: {
    id: 'parables',
    label: 'Parable Generator',
    route: NAV_ROUTES.parables,
    icon: Sparkles,
    description: 'Create modern parables',
    dividerAfter: false,
  },
  pricing: {
    id: 'pricing',
    label: 'Pricing',
    route: NAV_ROUTES.pricing,
    icon: CreditCard,
    description: 'View plans and pricing',
    dividerAfter: true,
  },
  settings: {
    id: 'settings',
    label: 'User Profile',
    route: '', // Handled by onClick in Header.tsx — opens UserProfileModal directly
    icon: Settings,
    description: 'Update your profile defaults',
    dividerAfter: true,
  },
  signOut: {
    id: 'signOut',
    label: 'Sign Out',
    route: '', // Handled by onClick, not navigation
    icon: LogOut,
    description: 'Sign out of your account',
    dividerAfter: false,
  },
} as const;

// =============================================================================
// ROLE-BASED MENU CONFIGURATION
// =============================================================================

/**
 * Defines which menu items each role sees, in display order
 * NOTE: 'parables' is defined but not included in any role menu (hidden feature)
 */
export const MENU_BY_ROLE: Record<Role, string[]> = {
  [ROLES.platformAdmin]: [
    'adminPanel',
    'toolbeltAdmin',
    'orgManager',
    'teachingTeam',
    'workspace',
    'pricing',
    'settings',
    'signOut',
  ],
  [ROLES.orgLeader]: [
    'orgManager',
    'teachingTeam',
    'workspace',
    'pricing',
    'settings',
    'signOut',
  ],
  [ROLES.orgMember]: [
    'teachingTeam',
    'workspace',
    'pricing',
    'settings',
    'signOut',
  ],
  [ROLES.individual]: [
    'teachingTeam',
    'workspace',
    'pricing',
    'settings',
    'signOut',
  ],
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get navigation items for a given role
 */
export const getNavigationForRole = (role: Role): NavigationItem[] => {
  const itemIds = MENU_BY_ROLE[role] || MENU_BY_ROLE[ROLES.individual];
  return itemIds.map(id => NAVIGATION_ITEMS[id]).filter(Boolean);
};

/**
 * Check if a role has access to a specific navigation item
 */
export const canAccessNavItem = (role: Role, itemId: string): boolean => {
  const allowedItems = MENU_BY_ROLE[role] || [];
  return allowedItems.includes(itemId);
};


