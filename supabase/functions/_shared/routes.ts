/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/routes.ts
 * Generated: 2025-12-13T19:59:06.601Z
 */
// SSOT MASTER: Frontend route definitions
// Backend mirror: supabase/functions/_shared/routes.ts
// Last updated: 2025-12-05

/**
 * Application route paths
 * Used for navigation and URL building throughout the app
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  AUTH: '/auth',
  SETUP: '/setup',
  SETUP_CHECKLIST: '/setup/checklist',
  SETUP_GUIDE: '/setup/guide',
  DOCS: '/docs',
  HELP: '/help',
  TRAINING: '/training',
  COMMUNITY: '/community',
  
  // Protected routes
  WORKSPACE: '/workspace',
  DASHBOARD: '/dashboard', // Redirects to WORKSPACE
  CREATE_LESSON: '/create',
  MY_LESSONS: '/lessons',
  ORG: '/org',
  ADMIN: '/admin',
  PREFERENCES_LENS: '/preferences/lens',
  BETA_SIGNUP: '/beta-signup',
  ADMIN_BETA_METRICS: '/admin/beta-metrics',
  
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
 * Build a complete invite URL for email links
 * @param baseUrl - The site base URL (e.g., https://lessonsparkusa.com)
 * @param token - The invite token UUID
 * @returns Complete invite URL
 */
export const buildInviteUrl = (baseUrl: string, token: string): string => {
  return `${baseUrl}${ROUTES.AUTH}?${AUTH_QUERY_PARAMS.INVITE_TOKEN}=${token}`;
};

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];

