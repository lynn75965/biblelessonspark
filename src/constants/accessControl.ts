/**
 * ACCESS CONTROL CONSTANTS
 * Single Source of Truth for role-based feature visibility
 * 
 * ROLES:
 * - platformAdmin: Lynn (full platform access)
 * - orgLeader: Organization administrator (org-scoped access) [FUTURE]
 * - orgMember: Organization teacher (own lessons within org) [FUTURE]
 * - individual: Personal workspace user (own lessons only)
 * 
 * ARCHITECTURE:
 * - Frontend Drives Backend: These constants define UI visibility
 * - Backend enforces via RLS policies (separate but aligned)
 * - Update this file to change access rules across the platform
 */

// Role hierarchy (higher index = more access)
export const ROLES = {
  individual: 'individual',
  orgMember: 'orgMember',
  orgLeader: 'orgLeader',
  platformAdmin: 'platformAdmin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Tab visibility by role
export const TAB_ACCESS = {
  enhance: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
  library: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
  members: [ROLES.platformAdmin, ROLES.orgLeader], // Org context required
  analytics: [ROLES.platformAdmin], // Platform admin only
  settings: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
} as const;

export type TabKey = keyof typeof TAB_ACCESS;

// Feature visibility by role
export const FEATURE_ACCESS = {
  betaHubModal: [ROLES.platformAdmin], // Admin-only management
  privateBetaCard: [ROLES.platformAdmin], // Dashboard stat card
  platformStatsCard: [ROLES.platformAdmin], // Shows total platform users instead of Personal/Workspace
  orgSettings: [ROLES.platformAdmin, ROLES.orgLeader], // Org configuration
  memberManagement: [ROLES.platformAdmin, ROLES.orgLeader], // Add/remove members
  sharedFocus: [ROLES.orgLeader], // Set church-wide passage/theme [FUTURE]
  orgAnalytics: [ROLES.orgLeader], // Org-scoped analytics [FUTURE]
} as const;

export type FeatureKey = keyof typeof FEATURE_ACCESS;

// Context requirements (some features need org context)
export const REQUIRES_ORG_CONTEXT = {
  members: true,
  orgSettings: true,
  memberManagement: true,
  sharedFocus: true,
  orgAnalytics: true,
} as const;

/**
 * Check if a role has access to a tab
 */
export const canAccessTab = (role: Role, tab: TabKey, hasOrgContext: boolean = false): boolean => {
  const allowedRoles = TAB_ACCESS[tab];
  const hasRoleAccess = allowedRoles.includes(role);
  
  // Check if org context is required
  const needsOrg = REQUIRES_ORG_CONTEXT[tab as keyof typeof REQUIRES_ORG_CONTEXT] ?? false;
  
  if (needsOrg && !hasOrgContext) {
    return false;
  }
  
  return hasRoleAccess;
};

/**
 * Check if a role has access to a feature
 */
export const canAccessFeature = (role: Role, feature: FeatureKey, hasOrgContext: boolean = false): boolean => {
  const allowedRoles = FEATURE_ACCESS[feature];
  const hasRoleAccess = allowedRoles.includes(role);
  
  // Check if org context is required
  const needsOrg = REQUIRES_ORG_CONTEXT[feature as keyof typeof REQUIRES_ORG_CONTEXT] ?? false;
  
  if (needsOrg && !hasOrgContext) {
    return false;
  }
  
  return hasRoleAccess;
};

/**
 * Determine user's effective role
 */
export const getEffectiveRole = (
  isAdmin: boolean,
  hasOrganization: boolean,
  orgRole?: string | null
): Role => {
  if (isAdmin) {
    return ROLES.platformAdmin;
  }
  
  if (hasOrganization) {
    if (orgRole === 'leader' || orgRole === 'admin') {
      return ROLES.orgLeader;
    }
    return ROLES.orgMember;
  }
  
  return ROLES.individual;
};

