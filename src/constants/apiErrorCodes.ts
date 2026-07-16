/**
 * API Error Codes - SSOT
 * Used by both Edge Functions and frontend error handling
 */
export const API_ERROR_CODES = {
  LIMIT_REACHED: 'LIMIT_REACHED',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CAPACITY_UNAVAILABLE: 'CAPACITY_UNAVAILABLE',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
