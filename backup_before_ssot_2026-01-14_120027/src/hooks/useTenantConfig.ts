/**
 * useTenantConfig - Hook to load tenant configuration from database
 * 
 * ARCHITECTURE:
 * - Fetches from tenant_config table
 * - Uses mapRowToConfig() from SSOT (tenantConfig.ts)
 * - Falls back to DEFAULT_TENANT_CONFIG if no row exists
 * - Provides loading state for initial fetch
 * 
 * USAGE:
 * Called once at App.tsx level, passed to TenantProvider.
 * Components then use useTenant() to access the config.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  TenantConfig,
  TenantConfigRow,
  DEFAULT_TENANT_CONFIG,
  DEFAULT_TENANT_ID,
  mapRowToConfig,
} from '@/constants/tenantConfig';

interface UseTenantConfigResult {
  config: TenantConfig;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Load tenant configuration from database.
 * 
 * @param tenantId - Optional tenant ID. Defaults to DEFAULT_TENANT_ID for single-tenant mode.
 * @returns Object containing config, loading state, error, and refetch function.
 */
export function useTenantConfig(tenantId?: string): UseTenantConfigResult {
  const [config, setConfig] = useState<TenantConfig>(DEFAULT_TENANT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const effectiveTenantId = tenantId || DEFAULT_TENANT_ID;

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tenant_config')
        .select('*')
        .eq('tenant_id', effectiveTenantId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching tenant config:', fetchError);
        setError(new Error(fetchError.message));
        // Fall back to defaults on error
        setConfig(DEFAULT_TENANT_CONFIG);
        return;
      }

      if (data) {
        // Map database row to nested config structure
        const mappedConfig = mapRowToConfig(data as TenantConfigRow);
        setConfig(mappedConfig);
      } else {
        // No row exists - use defaults
        // This is normal for new installations
        console.info('No tenant_config row found, using defaults');
        setConfig(DEFAULT_TENANT_CONFIG);
      }
    } catch (err) {
      console.error('Unexpected error loading tenant config:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setConfig(DEFAULT_TENANT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [effectiveTenantId]);

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  };
}

/**
 * Lightweight version that returns just the config.
 * Useful when you don't need loading/error states.
 * Still provides reactivity - will update when database changes.
 */
export function useTenantConfigValue(tenantId?: string): TenantConfig {
  const { config } = useTenantConfig(tenantId);
  return config;
}
