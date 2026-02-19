// SSOT MASTER: Frontend route definitions
// Backend mirror: supabase/functions/_shared/routes.ts
// Last updated: 2026-02-11

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
  CREATE_LESSON: '/create',
  MY_LESSONS: '/lessons',
  ORG: '/org',
  ADMIN: '/admin',
  ADMIN_TOOLBELT: '/admin/toolbelt',
  PREFERENCES_LENS: '/preferences/lens',
  BETA_SIGNUP: '/beta-signup',
  ADMIN_BETA_METRICS: '/admin/beta-metrics',
  ACCOUNT: '/account',
  
  // Legal routes
  PRIVACY: '/privacy-policy',
  TERMS: '/terms-of-service',
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
 */
export const DASHBOARD_TAB_VALUES = {
  ENHANCE: 'enhance',
  LIBRARY: 'library',
  DEVOTIONAL_LIBRARY: 'devotional-library',
  SETTINGS: 'settings',
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




