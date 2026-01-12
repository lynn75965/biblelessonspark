/**
 * CORS Configuration (SSOT)
 * 
 * Single Source of Truth for allowed origins across all Edge Functions.
 * Add new origins here when deploying to new environments.
 * 
 * @module _shared/corsConfig
 */

// ============================================================================
// ALLOWED ORIGINS
// ============================================================================

/**
 * Production origins - always allowed
 */
export const PRODUCTION_ORIGINS = [
  'https://lessonsparkusa.com',
  'https://www.lessonsparkusa.com',
] as const;

/**
 * Development origins - allowed for local testing
 * These can be disabled in production by setting ALLOW_DEV_ORIGINS=false
 */
export const DEVELOPMENT_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
] as const;

/**
 * White-label / Enterprise origins
 * Add customer domains here as they are onboarded
 */
export const WHITELABEL_ORIGINS: string[] = [
  // 'https://lessons.customerchurch.org',
  // 'https://biblestudy.baptistconvention.org',
];

// ============================================================================
// CORS HEADERS GENERATOR
// ============================================================================

/**
 * Get all allowed origins based on environment
 */
export function getAllowedOrigins(allowDevOrigins: boolean = true): string[] {
  const origins: string[] = [...PRODUCTION_ORIGINS, ...WHITELABEL_ORIGINS];
  
  if (allowDevOrigins) {
    origins.push(...DEVELOPMENT_ORIGINS);
  }
  
  return origins;
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string, allowDevOrigins: boolean = true): boolean {
  const allowedOrigins = getAllowedOrigins(allowDevOrigins);
  return allowedOrigins.includes(origin);
}

/**
 * Generate CORS headers for a request
 * Returns headers with the appropriate Access-Control-Allow-Origin
 * 
 * @param requestOrigin - The origin from the request headers
 * @param allowDevOrigins - Whether to allow development origins (default: true)
 * @returns CORS headers object
 */
export function getCorsHeaders(
  requestOrigin: string | null,
  allowDevOrigins: boolean = true
): Record<string, string> {
  const allowedOrigins = getAllowedOrigins(allowDevOrigins);
  
  // Use the request origin if it's in our allowed list, otherwise use production default
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : PRODUCTION_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

/**
 * Generate CORS headers from a Request object
 * Convenience wrapper for Edge Functions
 * 
 * @param req - The incoming Request object
 * @returns CORS headers object
 */
export function getCorsHeadersFromRequest(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowDevOrigins = Deno.env.get('ALLOW_DEV_ORIGINS') !== 'false';
  return getCorsHeaders(origin, allowDevOrigins);
}
