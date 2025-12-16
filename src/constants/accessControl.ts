/**
 * ACCESS CONTROL CONSTANTS
 * Single Source of Truth for role-based feature visibility
 * 
 * ROLES:
 * - platformAdmin: Lynn (full platform access)
 * - orgLeader: Organization administrator (org-scoped access)
 * - orgMember: Organization teacher (own lessons + view org lessons)
 * - individual: Personal workspace user (own lessons only)
 * 
 * ARCHITECTURE:
 * - Frontend Drives Backend: These constants define UI visibility
 * - Backend enforces via RLS policies (separate but aligned)
 * - Update this file to change access rules across the platform
 * 
 * DUAL ROLE SYSTEM:
 * - Database roles (app_role enum): admin, teacher, moderator = CAPABILITY
 * - Frontend roles (this file): platformAdmin, orgLeader, etc. = ACCESS SCOPE
 * - Mapping happens in getEffectiveRole()
 */

// =============================================================================
// ROLE DEFINITIONS
// =============================================================================

export const ROLES = {
  individual: 'individual',
  orgMember: 'orgMember',
  orgLeader: 'orgLeader',
  platformAdmin: 'platformAdmin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Display labels for roles (used in UI)
export const ROLE_LABELS: Record<Role, string> = {
  individual: 'Personal',
  orgMember: 'Member',
  orgLeader: 'Manager',
  platformAdmin: 'Manager',
} as const;

// Organization role values (stored in profiles.organization_role)
export const ORG_ROLES = {
  leader: 'leader',
  coLeader: 'co-leader',
  member: 'member',
} as const;

export type OrgRole = typeof ORG_ROLES[keyof typeof ORG_ROLES];

// =============================================================================
// TAB VISIBILITY
// =============================================================================

export const TAB_ACCESS = {
  enhance: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
  library: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
  members: [ROLES.platformAdmin, ROLES.orgLeader],
  analytics: [ROLES.platformAdmin],
  orgAnalytics: [ROLES.platformAdmin, ROLES.orgLeader],
  settings: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
} as const;

export type TabKey = keyof typeof TAB_ACCESS;

// =============================================================================
// FEATURE VISIBILITY
// =============================================================================

export const FEATURE_ACCESS = {
  // Platform Admin only
  betaHubModal: [ROLES.platformAdmin],
  privateBetaCard: [ROLES.platformAdmin],
  platformStatsCard: [ROLES.platformAdmin],
  platformAnalytics: [ROLES.platformAdmin],
  createOrganization: [ROLES.platformAdmin],
  approveOrgRequests: [ROLES.platformAdmin],
  manageBilling: [ROLES.platformAdmin],
  editAnyLesson: [ROLES.platformAdmin],
  addExistingUserToOrg: [ROLES.platformAdmin],
  
  // Platform Admin + Org Leader
  orgSettings: [ROLES.platformAdmin, ROLES.orgLeader],
  inviteOrgMembers: [ROLES.platformAdmin, ROLES.orgLeader],
  removeOrgMembers: [ROLES.platformAdmin, ROLES.orgLeader],
  promoteToCoLeader: [ROLES.platformAdmin, ROLES.orgLeader],
  setSharedFocus: [ROLES.platformAdmin, ROLES.orgLeader],
  viewOrgAnalytics: [ROLES.platformAdmin, ROLES.orgLeader],
  
  // Platform Admin + Org Leader + Org Member
  viewOrgMemberList: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember],
  viewOrgLessons: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember],
  
  // All authenticated users
  createLesson: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
  viewOwnLessons: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
  exportOwnLessons: [ROLES.platformAdmin, ROLES.orgLeader, ROLES.orgMember, ROLES.individual],
} as const;

export type FeatureKey = keyof typeof FEATURE_ACCESS;

// =============================================================================
// CONTEXT REQUIREMENTS
// =============================================================================

// Features that require organization context to function
export const REQUIRES_ORG_CONTEXT = {
  members: true,
  orgAnalytics: true,
  orgSettings: true,
  inviteOrgMembers: true,
  removeOrgMembers: true,
  promoteToCoLeader: true,
  setSharedFocus: true,
  viewOrgAnalytics: true,
  viewOrgMemberList: true,
  viewOrgLessons: true,
} as const;

// =============================================================================
// ACCESS CHECK FUNCTIONS
// =============================================================================

/**
 * Check if a role has access to a tab
 */
export const canAccessTab = (
  role: Role, 
  tab: TabKey, 
  hasOrgContext: boolean = false
): boolean => {
  const allowedRoles = TAB_ACCESS[tab];
  const hasRoleAccess = (allowedRoles as readonly Role[]).includes(role);
  
  const needsOrg = REQUIRES_ORG_CONTEXT[tab as keyof typeof REQUIRES_ORG_CONTEXT] ?? false;
  if (needsOrg && !hasOrgContext) {
    return false;
  }
  
  return hasRoleAccess;
};

/**
 * Check if a role has access to a feature
 */
export const canAccessFeature = (
  role: Role, 
  feature: FeatureKey, 
  hasOrgContext: boolean = false
): boolean => {
  const allowedRoles = FEATURE_ACCESS[feature];
  const hasRoleAccess = (allowedRoles as readonly Role[]).includes(role);
  
  const needsOrg = REQUIRES_ORG_CONTEXT[feature as keyof typeof REQUIRES_ORG_CONTEXT] ?? false;
  if (needsOrg && !hasOrgContext) {
    return false;
  }
  
  return hasRoleAccess;
};

/**
 * Determine user's effective frontend role based on database role and org context
 * 
 * MAPPING:
 * - Database 'admin' role -> platformAdmin (always)
 * - Database 'teacher/moderator' + org leader/co-leader -> orgLeader
 * - Database 'teacher/moderator' + org member -> orgMember
 * - Database 'teacher/moderator' + no org -> individual
 */
export const getEffectiveRole = (
  isAdmin: boolean,
  hasOrganization: boolean,
  orgRole?: string | null
): Role => {
  // Admin is always platformAdmin regardless of org context
  if (isAdmin) {
    return ROLES.platformAdmin;
  }
  
  // Check organization context
  if (hasOrganization && orgRole) {
    if (orgRole === ORG_ROLES.leader || orgRole === ORG_ROLES.coLeader) {
      return ROLES.orgLeader;
    }
    if (orgRole === ORG_ROLES.member) {
      return ROLES.orgMember;
    }
  }
  
  // Default to individual (no org context)
  return ROLES.individual;
};

/**
 * Check if a user can perform an action on another user within org context
 */
export const canManageOrgMember = (
  actorRole: Role,
  targetOrgRole: OrgRole | null
): boolean => {
  // Platform admin can manage anyone
  if (actorRole === ROLES.platformAdmin) {
    return true;
  }
  
  // Org leader can manage members and co-leaders (but not other leaders)
  if (actorRole === ROLES.orgLeader) {
    return targetOrgRole === ORG_ROLES.member || targetOrgRole === ORG_ROLES.coLeader;
  }
  
  // Org members cannot manage anyone
  return false;
};
