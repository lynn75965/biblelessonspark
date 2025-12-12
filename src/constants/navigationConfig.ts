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
 */

import { Shield, Building2, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { ROLES, Role } from "./accessControl";

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

export const ROUTES = {
  admin: '/admin',
  org: '/org',
  workspace: '/workspace',
  account: '/account',
  home: '/',
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
  orgManager: {
    id: 'orgManager',
    label: 'Organization Manager',
    route: NAV_ROUTES.org,
    icon: Building2,
    description: 'Manage your organization',
    dividerAfter: false,
  },
  workspace: {
    id: 'workspace',
    label: 'My Workspace',
    route: NAV_ROUTES.workspace,
    icon: LayoutDashboard,
    description: 'Your personal lessons',
    dividerAfter: true,
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    route: NAV_ROUTES.account,
    icon: Settings,
    description: 'Account settings',
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
 */
export const MENU_BY_ROLE: Record<Role, string[]> = {
  [ROLES.platformAdmin]: [
    'adminPanel',
    'orgManager',
    'workspace',
    'settings',
    'signOut',
  ],
  [ROLES.orgLeader]: [
    'orgManager',
    'workspace',
    'settings',
    'signOut',
  ],
  [ROLES.orgMember]: [
    'workspace',
    'settings',
    'signOut',
  ],
  [ROLES.individual]: [
    'workspace',
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


