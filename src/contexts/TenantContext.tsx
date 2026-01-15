/**
 * TenantContext - Provides tenant configuration throughout the app
 * 
 * ARCHITECTURE: Imports types and defaults from SSOT (tenantConfig.ts)
 */

import React, { createContext, useContext } from "react";
import {
  TenantConfig,
  DEFAULT_TENANT_CONFIG,
} from "@/config/tenantConfig";

// =============================================================================
// CONTEXT
// =============================================================================

const TenantContext = createContext<TenantConfig>(DEFAULT_TENANT_CONFIG);

// =============================================================================
// HOOK
// =============================================================================

export function useTenant(): TenantConfig {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface TenantProviderProps {
  children: React.ReactNode;
  config: TenantConfig;
}

export function TenantProvider({ children, config }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={config}>
      {children}
    </TenantContext.Provider>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { TenantContext };
export type { TenantConfig };
