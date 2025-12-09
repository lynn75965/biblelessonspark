// AUTO-GENERATED - DO NOT EDIT DIRECTLY
// Source: src/constants/routes.ts
// Sync command: npm run sync-constants
// Last synced: 2025-12-05

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
  DASHBOARD: '/dashboard',
  CREATE_LESSON: '/create',
  MY_LESSONS: '/lessons',
  ADMIN: '/admin',
  PREFERENCES_LENS: '/preferences/lens',
  BETA_SIGNUP: '/beta-signup',
  ADMIN_BETA_METRICS: '/admin/beta-metrics',
  
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
