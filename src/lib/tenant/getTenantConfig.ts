/**
 * Tenant Configuration Loader
 * 
 * ARCHITECTURE: Imports types and defaults from SSOT (tenantConfig.ts)
 * Uses existing Supabase client from integrations
 */

import { supabase } from "@/integrations/supabase/client";
import {
  TenantConfig,
  TenantConfigRow,
  DEFAULT_TENANT_CONFIG,
  mapRowToConfig,
  resolveTenantFromHost,
} from "@/constants/tenantConfig";

// =============================================================================
// CACHE (simple in-memory for client-side)
// =============================================================================

const tenantCache = new Map<string, TenantConfig>();

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Get tenant configuration from database or cache
 * Falls back to defaults if not found
 */
export async function getTenantConfig(host: string): Promise<TenantConfig> {
  const tenantId = resolveTenantFromHost(host);

  // Check cache first
  if (tenantCache.has(tenantId)) {
    return tenantCache.get(tenantId)!;
  }

  try {
    const { data, error } = await supabase
      .from("tenant_config")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (error || !data) {
      console.warn(`No tenant config found for "${tenantId}", using defaults`);
      tenantCache.set(tenantId, DEFAULT_TENANT_CONFIG);
      return DEFAULT_TENANT_CONFIG;
    }

    // Map database row to frontend config using SSOT function
    const config = mapRowToConfig(data as TenantConfigRow);
    
    // Cache it
    tenantCache.set(tenantId, config);
    
    return config;

  } catch (err) {
    console.error("Error fetching tenant config:", err);
    return DEFAULT_TENANT_CONFIG;
  }
}

/**
 * Clear the tenant cache (useful after admin updates)
 */
export function clearTenantCache(): void {
  tenantCache.clear();
}

/**
 * Re-export types from SSOT for convenience
 */
export type { TenantConfig };