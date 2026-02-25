/**
 * useBranding Hook
 * =================
 * 
 * Fetches and caches branding configuration from the database.
 * Provides fallback values for resilience during loading/errors.
 * 
 * Location: src/hooks/useBranding.ts
 * 
 * USAGE:
 *   const { branding, isLoading, error } = useBranding();
 *   <h1>{branding.appName}</h1>
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BRANDING, BrandingConfig } from '@/config/branding';
import { ROUTES } from "@/constants/routes";

// ============================================================================
// FALLBACK BRANDING (used during loading or if database fetch fails)
// ============================================================================
// This ensures the app never breaks, even if branding can't be loaded

const FALLBACK_BRANDING: BrandingConfig = BRANDING;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_KEY = 'biblelessonspark_branding';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CachedBranding {
  data: BrandingConfig;
  timestamp: number;
}

function getCachedBranding(): BrandingConfig | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedBranding = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - parsed.timestamp < CACHE_DURATION_MS) {
      return parsed.data;
    }
    
    // Cache expired
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedBranding(data: BrandingConfig): void {
  try {
    const cached: CachedBranding = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded)
  }
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export interface UseBrandingResult {
  /** The branding configuration (never null - uses fallback if needed) */
  branding: BrandingConfig;
  /** True while fetching from database */
  isLoading: boolean;
  /** Error message if fetch failed (branding will still have fallback values) */
  error: string | null;
  /** True if using cached or fallback data (not fresh from database) */
  isStale: boolean;
  /** Force refresh from database */
  refresh: () => Promise<void>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useBranding(organizationId?: string | null): UseBrandingResult {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    // Try to get from cache on initial render
    return getCachedBranding() || FALLBACK_BRANDING;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(true);

  const fetchBranding = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the database function
      const { data, error: rpcError } = await supabase.rpc('get_branding_config', {
        p_organization_id: organizationId || null,
      });
      
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      
      if (data) {
        const config = data as BrandingConfig;
        setBranding(config);
        setCachedBranding(config);
        setIsStale(false);
      } else {
        // No data returned - use fallback
        console.warn('No branding config found in database, using fallback');
        setBranding(FALLBACK_BRANDING);
        setIsStale(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load branding';
      console.error('Error fetching branding:', message);
      setError(message);
      // Keep using cached or fallback branding
      setIsStale(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [organizationId]);

  const refresh = async () => {
    localStorage.removeItem(CACHE_KEY);
    await fetchBranding();
  };

  return {
    branding,
    isLoading,
    error,
    isStale,
    refresh,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get full page title with app name
 */
export function getPageTitle(branding: BrandingConfig, pageTitle?: string): string {
  if (!pageTitle) return branding.appName;
  return `${pageTitle} | ${branding.appName}`;
}

/**
 * Get copyright notice with current year
 */
export function getCopyrightNotice(branding: BrandingConfig): string {
  const currentYear = new Date().getFullYear();
  const startYear = branding.legal.copyrightYear;
  const yearRange = startYear === String(currentYear)
    ? startYear
    : `${startYear}-${currentYear}`;
  return `\u00A9 ${yearRange} ${branding.legal.copyrightHolder}. All rights reserved.`;
}

/**
 * Get formatted "From" field for emails
 */
export function getEmailFrom(branding: BrandingConfig): string {
  return `${branding.email.fromName} <${branding.email.fromEmail}>`;
}

/**
 * Get email subject with placeholders replaced
 */
export function getEmailSubject(
  branding: BrandingConfig,
  templateKey: keyof BrandingConfig['email']['subjects'],
  replacements: Record<string, string> = {}
): string {
  let subject = branding.email.subjects[templateKey];
  
  Object.entries(replacements).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  return subject;
}

/**
 * Get formatted address
 */
export function getFormattedAddress(branding: BrandingConfig): string {
  const addr = branding.contact.address;
  const line2 = addr.line2 ? `, ${addr.line2}` : '';
  return `${addr.line1}${line2}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default useBranding;

// Also export the fallback for testing/Edge Functions
export { FALLBACK_BRANDING };

