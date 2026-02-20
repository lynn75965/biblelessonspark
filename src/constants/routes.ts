// SSOT MASTER: Frontend route definitions
// Backend mirror: supabase/functions/_shared/routes.ts
// Last updated: 2026-02-20

/**
 * Application route paths
 * Used for navigation and URL building throughout the app
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  AUTH: '/auth',
  PRICING: '/pricing',
  SETUP: '/setup',
  SETUP_CHECKLIST: '/setup/checklist',
  SETUP_GUIDE: '/setup/guide',
  DOCS: '/docs',
  HELP: '/help',
  TRAINING: '/training',
  COMMUNITY: '/community',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  ORG: '/org',
  ADMIN: '/admin',
  ADMIN_TOOLBELT: '/admin/toolbelt',
  PREFERENCES_LENS: '/preferences/lens',
  BETA_SIGNUP: '/beta-signup',
  ADMIN_BETA_METRICS: '/admin/beta-metrics',
  ACCOUNT: '/account',
  PARABLES: '/parables',
  DEVOTIONALS: '/devotionals',
  
  // Organization routes
  ORG_SETUP: '/org/setup',
  ORG_SUCCESS: '/org/success',
  ORG_MANAGER: '/org-manager',
  // Teaching Team
  TEACHING_TEAM: '/teaching-team',
  // Legal routes
  PRIVACY: '/legal/privacy',
  TERMS: '/legal/terms',
  COOKIE: '/legal/cookie',
} as const;

/**
 * Query parameter keys used in authentication flows
 */
export const AUTH_QUERY_PARAMS = {
  INVITE_TOKEN: 'invite',
  REDIRECT: 'redirect',
  ERROR: 'error',
} as const;
/**
 * Query parameter keys used in dashboard navigation
 */
export const DASHBOARD_QUERY_PARAMS = {
  TAB: 'tab',
  VIEW_LESSON: 'viewLesson',
  SESSION_ID: 'session_id',
} as const;

/**
 * Valid dashboard tab values
 * NOTE: BUILD value is 'enhance' for URL backward-compatibility.
 * Display label "Build Lesson" lives in dashboardConfig.ts (SSOT).
 * Settings tab removed Feb 14, 2026 - profile moved to modal.
 */
export const DASHBOARD_TAB_VALUES = {
  BUILD: 'enhance',
  LIBRARY: 'library',
  DEVOTIONAL_LIBRARY: 'devotional-library',
} as const;

/**
 * Build a complete invite URL for email links
 * @param baseUrl - The site base URL (e.g., https://biblelessonspark.com)
 * @param token - The invite token UUID
 * @returns Complete invite URL
 */
export const buildInviteUrl = (baseUrl: string, token: string): string => {
  return `${baseUrl}${ROUTES.AUTH}?${AUTH_QUERY_PARAMS.INVITE_TOKEN}=${token}`;
};

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];
