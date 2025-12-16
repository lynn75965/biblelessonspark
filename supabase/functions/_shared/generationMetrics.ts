/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/generationMetrics.ts
 * Generated: 2025-12-16T20:54:50.041Z
 */
﻿// =====================================================
// GENERATION METRICS - Single Source of Truth
// =====================================================
// Location: src/constants/generationMetrics.ts (MASTER)
// Mirror: supabase/functions/_shared/generationMetrics.ts
// DO NOT EDIT MIRROR DIRECTLY - Run: npm run sync-constants
// Last Updated: 2025-12-07
// =====================================================

// Device types detected from user-agent
export const DEVICE_TYPES = ['mobile', 'tablet', 'desktop', 'unknown'] as const;
export type DeviceType = typeof DEVICE_TYPES[number];

// Generation status values
export const GENERATION_STATUSES = ['started', 'completed', 'timeout', 'error'] as const;
export type GenerationStatus = typeof GENERATION_STATUSES[number];

// Connection types (from Network Information API)
export const CONNECTION_TYPES = ['slow-2g', '2g', '3g', '4g', 'wifi', 'ethernet', 'unknown'] as const;
export type ConnectionType = typeof CONNECTION_TYPES[number];

// For database CHECK constraints
export const VALID_DEVICE_TYPES = DEVICE_TYPES as readonly string[];
export const VALID_GENERATION_STATUSES = GENERATION_STATUSES as readonly string[];
export const VALID_CONNECTION_TYPES = CONNECTION_TYPES as readonly string[];

// Metrics record interface
export interface GenerationMetricsRecord {
  id?: string;
  user_id: string;
  lesson_id?: string;
  organization_id?: string;
  
  // Device info
  user_agent?: string;
  device_type: DeviceType;
  browser?: string;
  os?: string;
  
  // Timing
  generation_start: string;
  generation_end?: string;
  generation_duration_ms?: number;
  
  // Request context
  tier_requested: string;
  sections_requested: number;
  sections_generated?: number;
  
  // Outcome
  status: GenerationStatus;
  error_message?: string;
  
  // Network
  connection_type?: ConnectionType;
  
  created_at?: string;
}

// User-agent parsing helpers
export function parseDeviceType(userAgent: string): DeviceType {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (/ipad|tablet|playbook|silk/.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) {
    return 'mobile';
  }
  
  if (/android/.test(ua)) {
    return 'tablet';
  }
  
  if (/windows|macintosh|linux/.test(ua)) {
    return 'desktop';
  }
  
  return 'unknown';
}

export function parseBrowser(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (/edg/.test(ua)) return 'Edge';
  if (/chrome/.test(ua) && !/chromium/.test(ua)) return 'Chrome';
  if (/safari/.test(ua) && !/chrome/.test(ua)) return 'Safari';
  if (/firefox/.test(ua)) return 'Firefox';
  if (/opera|opr/.test(ua)) return 'Opera';
  if (/msie|trident/.test(ua)) return 'Internet Explorer';
  
  return 'unknown';
}

export function parseOS(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
  if (/android/.test(ua)) return 'Android';
  if (/windows/.test(ua)) return 'Windows';
  if (/macintosh|mac os/.test(ua)) return 'macOS';
  if (/linux/.test(ua)) return 'Linux';
  if (/cros/.test(ua)) return 'Chrome OS';
  
  return 'unknown';
}

// Timeout thresholds (in milliseconds)
export const TIMEOUT_THRESHOLDS = {
  warning: 60000,
  critical: 90000,
  absolute: 120000
} as const;

export function isTimeoutRisk(durationMs: number): 'none' | 'warning' | 'critical' {
  if (durationMs >= TIMEOUT_THRESHOLDS.critical) return 'critical';
  if (durationMs >= TIMEOUT_THRESHOLDS.warning) return 'warning';
  return 'none';
}
