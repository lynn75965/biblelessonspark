// ============================================================================
// SSOT: Organization Configuration
// LessonSparkUSA - Master Definition
// Database columns store data; THIS FILE defines valid values and rules
// ============================================================================

// ----------------------------------------------------------------------------
// ORGANIZATION TYPES
// ----------------------------------------------------------------------------

export const ORG_TYPES = {
  beta_program: {
    id: 'beta_program',
    label: 'Beta Program',
    description: 'Beta testing program organization',
    allowSubOrgs: false,
    rateLimit: { lessonsPerDay: 3 },
  },
  church: {
    id: 'church',
    label: 'Church',
    description: 'Local church organization',
    allowSubOrgs: true,
    rateLimit: null, // Uses subscription tier limits
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Convention, association, or large organization',
    allowSubOrgs: true,
    rateLimit: null, // Uses subscription tier limits
  },
} as const;

export type OrgType = keyof typeof ORG_TYPES;

export const ORG_TYPE_IDS = Object.keys(ORG_TYPES) as OrgType[];

// ----------------------------------------------------------------------------
// BETA ACCESS LEVELS
// ----------------------------------------------------------------------------

export const BETA_ACCESS_LEVELS = {
  private: {
    id: 'private',
    label: 'Private Beta',
    description: 'Invitation only - admin must approve',
    openEnrollment: false,
  },
  public: {
    id: 'public',
    label: 'Public Beta',
    description: 'Open enrollment - anyone can join',
    openEnrollment: true,
  },
} as const;

export type BetaAccessLevel = keyof typeof BETA_ACCESS_LEVELS;

export const BETA_ACCESS_LEVEL_IDS = Object.keys(BETA_ACCESS_LEVELS) as BetaAccessLevel[];

// ----------------------------------------------------------------------------
// ORGANIZATION HIERARCHY
// ----------------------------------------------------------------------------

export const ORG_HIERARCHY = {
  maxDepth: 2,
  levelNames: {
    1: 'Organization',
    2: 'Sub-Organization',
  } as Record<number, string>,
} as const;

// ----------------------------------------------------------------------------
// VALIDATION FUNCTIONS
// ----------------------------------------------------------------------------

export const isValidOrgType = (type: string): type is OrgType => {
  return type in ORG_TYPES;
};

export const isValidBetaAccessLevel = (level: string): level is BetaAccessLevel => {
  return level in BETA_ACCESS_LEVELS;
};

export const canHaveSubOrgs = (type: OrgType): boolean => {
  return ORG_TYPES[type].allowSubOrgs;
};

export const isWithinMaxDepth = (parentLevel: number): boolean => {
  return parentLevel < ORG_HIERARCHY.maxDepth;
};

export const getOrgLevel = (parentOrgId: string | null, parentLevel?: number): number => {
  if (!parentOrgId) return 1;
  return (parentLevel ?? 1) + 1;
};

// ----------------------------------------------------------------------------
// PLATFORM MODE BEHAVIOR
// ----------------------------------------------------------------------------

export const PLATFORM_MODE_ACCESS = {
  private_beta: {
    allowedOrgTypes: ['beta_program'] as OrgType[],
    allowedBetaLevels: ['private'] as BetaAccessLevel[],
    requiresOrgMembership: true,
    tierEnforcement: false,
    allSectionsForAll: true,
  },
  public_beta: {
    allowedOrgTypes: ['beta_program'] as OrgType[],
    allowedBetaLevels: ['private', 'public'] as BetaAccessLevel[],
    requiresOrgMembership: true,
    tierEnforcement: false,
    allSectionsForAll: true,
  },
  production: {
    allowedOrgTypes: ['beta_program', 'church', 'enterprise'] as OrgType[],
    allowedBetaLevels: ['private', 'public'] as BetaAccessLevel[],
    requiresOrgMembership: false,
    tierEnforcement: true,
    allSectionsForAll: false,
  },
} as const;

export type PlatformMode = keyof typeof PLATFORM_MODE_ACCESS;
