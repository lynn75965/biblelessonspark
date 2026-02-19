/**
 * BrandingProvider - SSOT Color System
 * =====================================
 * 
 * SSOT ARCHITECTURE:
 *   1. branding.ts defines ALL colors (SINGLE SOURCE OF TRUTH)
 *   2. generateTailwindCSSVariables() converts colors to CSS
 *   3. This component injects that CSS into the document head
 *   4. Tailwind reads the CSS variables
 *   
 * To change colors: Edit ONLY src/config/branding.ts
 * 
 * Location: src/components/BrandingProvider.tsx
 */

import { useEffect, ReactNode } from 'react';
import { 
  generateTailwindCSSVariables, 
  BRANDING, 
  COLOR_ADJUSTMENTS,
  hexToHsl, 
  adjustLightness 
} from '@/config/branding';

// =============================================================================
// TYPES
// =============================================================================

interface TenantBranding {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  name?: string;
  logoUrl?: string | null;
}

interface BrandingProviderProps {
  children: ReactNode;
  tenantBranding?: TenantBranding;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BASE_STYLE_ID = 'biblelessonspark-base-theme';
const TENANT_STYLE_ID = 'biblelessonspark-tenant-overrides';

/**
 * Tenant override uses COLOR_ADJUSTMENTS from branding.ts (SSOT)
 * This ensures tenant color variants match the base theme calculations exactly.
 */

// =============================================================================
// COMPONENT
// =============================================================================

export function BrandingProvider({ children, tenantBranding }: BrandingProviderProps) {
  
  // Inject base theme CSS from branding.ts (SSOT)
  useEffect(() => {
    let styleElement = document.getElementById(BASE_STYLE_ID) as HTMLStyleElement | null;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = BASE_STYLE_ID;
      // Insert at beginning of head so tenant overrides can come after
      document.head.insertBefore(styleElement, document.head.firstChild);
    }
    
    // Generate CSS from branding.ts (SSOT)
    styleElement.textContent = generateTailwindCSSVariables();
    
    
    return () => {
      // Don't remove on unmount - theme should persist
    };
  }, []);

  // Handle tenant overrides (white-label)
  useEffect(() => {
    // Remove any existing tenant overrides
    const existingTenantStyle = document.getElementById(TENANT_STYLE_ID);
    if (existingTenantStyle) {
      existingTenantStyle.remove();
    }

    // If no tenant branding, we're done
    if (!tenantBranding) return;

    // Check if tenant has custom colors different from SSOT defaults
    const hasCustomPrimary = tenantBranding.primaryColor && 
      tenantBranding.primaryColor.toLowerCase() !== BRANDING.colors.primary.DEFAULT.toLowerCase();
    const hasCustomSecondary = tenantBranding.secondaryColor && 
      tenantBranding.secondaryColor.toLowerCase() !== BRANDING.colors.secondary.DEFAULT.toLowerCase();

    // Only inject if tenant has different colors
    if (!hasCustomPrimary && !hasCustomSecondary) {
      return;
    }

    // Create tenant override styles
    const tenantStyle = document.createElement('style');
    tenantStyle.id = TENANT_STYLE_ID;
    
    const overrides: string[] = [];

    if (hasCustomPrimary && tenantBranding.primaryColor) {
      const hsl = hexToHsl(tenantBranding.primaryColor);
      overrides.push(`
  /* Tenant Primary Override */
  --primary: ${hsl};
  --primary-hover: ${adjustLightness(hsl, COLOR_ADJUSTMENTS.hover.primaryHover)};
  --primary-light: ${adjustLightness(hsl, COLOR_ADJUSTMENTS.light.primaryLight)};
  --success: ${hsl};
  --ring: ${hsl};`);
    }

    if (hasCustomSecondary && tenantBranding.secondaryColor) {
      const hsl = hexToHsl(tenantBranding.secondaryColor);
      overrides.push(`
  /* Tenant Secondary Override */
  --secondary: ${hsl};
  --secondary-hover: ${adjustLightness(hsl, COLOR_ADJUSTMENTS.hover.secondaryHover)};
  --secondary-light: ${adjustLightness(hsl, COLOR_ADJUSTMENTS.light.secondaryLight)};
  --warning: ${hsl};
  --accent: ${hsl};`);
    }

    tenantStyle.textContent = `
/* Tenant Branding Override: ${tenantBranding.name || 'Custom'} */
:root {${overrides.join('')}
}`;

    document.head.appendChild(tenantStyle);


    return () => {
      const el = document.getElementById(TENANT_STYLE_ID);
      if (el) el.remove();
    };
  }, [tenantBranding]);

  return <>{children}</>;
}

export default BrandingProvider;
