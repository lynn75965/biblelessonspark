// ============================================================================
// SSOT: Organization Configuration
// BibleLessonSpark - Master Definition
// Database columns store data; THIS FILE defines valid values and rules
// ============================================================================
// ARCHITECTURE PRINCIPLE: "The Lego Block"
// Every organization is a sovereign, self-contained unit with identical
// internal structure. parent_org_id is merely the connector stud that
// describes how blocks CHOOSE to relate, never how they're REQUIRED to behave.
// This mirrors Baptist ecclesiology: autonomous bodies in voluntary cooperation.
// ============================================================================

// ----------------------------------------------------------------------------
// WELL-KNOWN ORGANIZATION IDS
// ----------------------------------------------------------------------------

/** Private Beta org - invitation only testers */
export const PRIVATE_BETA_ORG_ID = '00cf6e5e-fa0d-4077-b64d-bce5ee822ff9';

/** Public Beta org - self-enrollment when platform is in public_beta mode */
export const PUBLIC_BETA_ORG_ID = '9a5da69e-adf2-4661-8833-197940c255e0';

// ----------------------------------------------------------------------------
// ORGANIZATION TYPES
// ----------------------------------------------------------------------------
// LEGO-PURE PRINCIPLE: org_type is an INFORMATIONAL LABEL for display and
// admin filtering. No application logic should branch on org_type.
// Every block has identical internal structure regardless of its type label.
// ----------------------------------------------------------------------------

export const ORG_TYPES = {
  beta_program: {
    id: 'beta_program',
    label: 'Beta Program',
    description: 'Beta testing program organization',
    rateLimit: { lessonsPerDay: 3 },
  },
  church: {
    id: 'church',
    label: 'Church',
    description: 'Local church organization',
    rateLimit: null, // Uses subscription tier limits
  },
  association: {
    id: 'association',
    label: 'Association',
    description: 'Baptist association or regional network of churches',
    rateLimit: null,
  },
  network: {
    id: 'network',
    label: 'Network',
    description: 'Church planting network, mission network, or ministry network',
    rateLimit: null,
  },
  ministry: {
    id: 'ministry',
    label: 'Ministry',
    description: 'Sub-church ministry team (children, youth, adult, etc.)',
    rateLimit: null,
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Convention, denomination, or large institutional organization',
    rateLimit: null,
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
// Depth supports the full Baptist structure:
//   Level 1: Convention / Network / Standalone Church
//   Level 2: Association / Regional Group / Church (under convention)
//   Level 3: Church (under association) / Ministry (under standalone church)
//   Level 4: Ministry (under church under association)
// ----------------------------------------------------------------------------

export const ORG_HIERARCHY = {
  maxDepth: 4,
  levelNames: {
    1: 'Organization',
    2: 'Sub-Organization',
    3: 'Group',
    4: 'Team',
  } as Record<number, string>,
} as const;

// ----------------------------------------------------------------------------
// CHILD ORG CREATION RULES
// ----------------------------------------------------------------------------
// Who can create child organizations under a parent?
// - Platform Admin: can create child orgs under ANY organization
// - Parent Org Manager: can create child orgs under THEIR OWN org only
// - All other roles: cannot create child orgs
// ----------------------------------------------------------------------------

export const CHILD_ORG_CREATION = {
  allowedCreators: ['platform_admin', 'parent_org_manager'] as const,
  // Parent Org Manager can only create children under their own org
  // Platform Admin can create children under any org
  // Depth validation: new child must not exceed maxDepth
} as const;

export type ChildOrgCreator = typeof CHILD_ORG_CREATION.allowedCreators[number];

// ----------------------------------------------------------------------------
// PARENT VISIBILITY BOUNDARY
// ----------------------------------------------------------------------------
// What summary data does a parent Org Manager see about child orgs?
// PRINCIPLE: Aggregates yes, individual data no.
// The parent sees the HEALTH of the block, not the ACTIVITY of people inside it.
// ----------------------------------------------------------------------------

export const PARENT_VISIBILITY = {
  /** Data visible to parent Org Manager about each child org */
  allowed: [
    'org_name',
    'org_manager_name',
    'member_count',
    'lessons_this_month',
    'pool_percent_remaining',
    'subscription_tier',
    'shared_focus_title',
    'health_status',
  ] as const,

  /** Data NEVER visible to parent Org Manager - privacy boundary */
  denied: [
    'individual_member_names',
    'individual_lesson_titles',
    'individual_lesson_content',
    'individual_teacher_activity',
    'individual_usage_patterns',
  ] as const,
} as const;

// ----------------------------------------------------------------------------
// CHILD ORG HEALTH INDICATORS
// ----------------------------------------------------------------------------
// "Lights on top of each Lego block" - parent sees health at a glance.
// No authority is exercised. This is awareness, not control.
// Pastoral shepherding, not institutional governance.
// ----------------------------------------------------------------------------

export const CHILD_ORG_HEALTH = {
  statuses: {
    healthy: {
      id: 'healthy',
      label: 'Active',
      color: '#22c55e', // green-500
      description: 'Generating lessons regularly, pool adequate',
    },
    attention: {
      id: 'attention',
      label: 'Needs Attention',
      color: '#eab308', // yellow-500
      description: 'Reduced activity or low pool',
    },
    critical: {
      id: 'critical',
      label: 'Inactive',
      color: '#ef4444', // red-500
      description: 'No recent activity or pool nearly depleted',
    },
  },

  thresholds: {
    /** Lesson generation recency */
    lessonActivity: {
      greenMaxDays: 14,   // Lessons within last 14 days = healthy
      yellowMaxDays: 30,  // No lessons in 14-30 days = attention
      // > 30 days = critical
    },
    /** Pool remaining percentage */
    poolRemaining: {
      greenMinPercent: 25,  // Pool > 25% = healthy
      yellowMinPercent: 10, // Pool 10-25% = attention
      // < 10% = critical
    },
    /** Subscription status override */
    subscriptionPastDue: true, // past_due subscription = always critical
  },
} as const;

export type HealthStatus = keyof typeof CHILD_ORG_HEALTH.statuses;

/**
 * Derive health status from child org metrics.
 * Worst condition wins (most severe status applies).
 */
export const deriveHealthStatus = (metrics: {
  daysSinceLastLesson: number | null;
  poolPercentRemaining: number | null;
  subscriptionStatus: string | null;
}): HealthStatus => {
  const { daysSinceLastLesson, poolPercentRemaining, subscriptionStatus } = metrics;
  const t = CHILD_ORG_HEALTH.thresholds;

  // Subscription past_due is always critical
  if (subscriptionStatus === 'past_due') return 'critical';

  let worst: HealthStatus = 'healthy';

  // Check lesson activity
  if (daysSinceLastLesson !== null) {
    if (daysSinceLastLesson > t.lessonActivity.yellowMaxDays) {
      worst = 'critical';
    } else if (daysSinceLastLesson > t.lessonActivity.greenMaxDays) {
      worst = worst === 'critical' ? 'critical' : 'attention';
    }
  }

  // Check pool remaining
  if (poolPercentRemaining !== null) {
    if (poolPercentRemaining < t.poolRemaining.yellowMinPercent) {
      worst = 'critical';
    } else if (poolPercentRemaining < t.poolRemaining.greenMinPercent) {
      worst = worst === 'critical' ? 'critical' : 'attention';
    }
  }

  return worst;
};

// ----------------------------------------------------------------------------
// SHARED FOCUS INHERITANCE
// ----------------------------------------------------------------------------
// A parent org can PUBLISH a Shared Focus. Child orgs can SEE it.
// They CHOOSE whether to adopt it. Pure suggestion, never enforcement.
// This is exactly how Baptist associations work: the DOM recommends a study,
// each church decides independently whether to follow that recommendation.
// ----------------------------------------------------------------------------

export const SHARED_FOCUS_INHERITANCE = {
  /** Parent publishes; children see a banner with option to adopt */
  mode: 'voluntary' as const,
  /** Adopting copies the focus into child's own Shared Focus (one-time, not live sync) */
  adoptBehavior: 'copy' as const,
  /** Child can modify or ignore adopted focus freely after adoption */
  childCanOverride: true,
  /** Parent dashboard shows adoption status per child (informational only) */
  parentSeesAdoptionStatus: true,
} as const;

// ----------------------------------------------------------------------------
// DISCONNECT RULES
// ----------------------------------------------------------------------------
// Any child block can detach at any time. Nothing breaks.
// Baptist autonomy honored completely.
// ----------------------------------------------------------------------------

export const DISCONNECT_RULES = {
  /** Setting parent_org_id to null disconnects the child */
  method: 'set_parent_null' as const,
  /** What happens to the child org on disconnect */
  childImpact: {
    members: 'unchanged',
    pool: 'unchanged',
    lessons: 'unchanged',
    subscription: 'unchanged',
    sharedFocus: 'unchanged',
    branding: 'unchanged',
  } as const,
  /** What happens to the parent org on disconnect */
  parentImpact: {
    dashboardCard: 'removed',
    visibilityIntoChild: 'removed',
  } as const,
  /** Who can initiate disconnect */
  initiators: ['child_org_manager', 'parent_org_manager', 'platform_admin'] as const,
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

/**
 * Check if a new child org would be within the max depth.
 * @param parentLevel - The org_level of the intended parent
 * @returns true if a child can be created under this parent
 */
export const isWithinMaxDepth = (parentLevel: number): boolean => {
  return parentLevel < ORG_HIERARCHY.maxDepth;
};

/**
 * Calculate the org_level for a new organization.
 * @param parentOrgId - Parent org ID (null = top-level)
 * @param parentLevel - The org_level of the parent (if known)
 * @returns The level for the new org
 */
export const getOrgLevel = (parentOrgId: string | null, parentLevel?: number): number => {
  if (!parentOrgId) return 1;
  return (parentLevel ?? 1) + 1;
};

/**
 * Get the display name for a hierarchy level.
 * @param level - The org_level number
 * @returns Human-readable level name
 */
export const getLevelName = (level: number): string => {
  return ORG_HIERARCHY.levelNames[level] ?? `Level ${level}`;
};

/**
 * Check if a user role can create child orgs.
 * @param role - 'platform_admin' or 'parent_org_manager'
 * @returns true if this role can create child orgs
 */
export const canCreateChildOrg = (role: string): boolean => {
  return (CHILD_ORG_CREATION.allowedCreators as readonly string[]).includes(role);
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
    allowedOrgTypes: ORG_TYPE_IDS, // All types allowed in production
    allowedBetaLevels: ['private', 'public'] as BetaAccessLevel[],
    requiresOrgMembership: false,
    tierEnforcement: true,
    allSectionsForAll: false,
  },
} as const;

export type PlatformMode = keyof typeof PLATFORM_MODE_ACCESS;
