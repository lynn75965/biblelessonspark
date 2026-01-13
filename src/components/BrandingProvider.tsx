/**
 * BrandingProvider - Runtime CSS Variable Injection with Tenant Support
 * =====================================================================
 * 
 * This component injects CSS variables from branding.ts into the document head,
 * with support for tenant/white-label overrides from the Admin Panel.
 * 
 * Location: src/components/BrandingProvider.tsx
 * 
 * ARCHITECTURE (SSOT with Tenant Override):
 *   1. branding.ts provides BASE brand colors (BibleLessonSpark defaults)
 *   2. TenantConfig can OVERRIDE primary/secondary colors via Admin Panel
 *   3. Final CSS variables = base + tenant overrides
 * 
 * USAGE:
 *   // In main.tsx - BrandingProvider wraps TenantProvider
 *   <BrandingProvider tenantBranding={tenant.branding}>
 *     <TenantProvider config={tenant}>
 *       <App />
 *     </TenantProvider>
 *   </BrandingProvider>
 * 
 * WHITE-LABEL FLOW:
 *   1. Default tenant (biblelessonspark) → uses branding.ts colors
 *   2. Custom tenant (e.g., firstbaptist) → Admin Panel colors override primary/secondary
 */

import { useEffect, ReactNode } from 'react';
import { generateTailwindCSSVariables, hexToHsl } from '@/config/branding';

// =============================================================================
// TYPES
// =============================================================================

interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  name?: string;
  logoUrl?: string | null;
}

interface BrandingProviderProps {
  children: ReactNode;
  /**
   * Optional tenant branding overrides from Admin Panel.
   * When provided, these colors replace the base branding.ts values.
   */
  tenantBranding?: TenantBranding;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STYLE_ID = 'biblelessonspark-brand-variables';
const TENANT_OVERRIDE_STYLE_ID = 'biblelessonspark-tenant-overrides';

// Default colors from branding.ts (for comparison to detect custom tenant)
const DEFAULT_PRIMARY = '#3D5C3D';
const DEFAULT_SECONDARY = '#D4A74B';

// =============================================================================
// COMPONENT
// =============================================================================

export function BrandingProvider({ children, tenantBranding }: BrandingProviderProps) {
  useEffect(() => {
    // -------------------------------------------------------------------------
    // Step 1: Inject base CSS variables from branding.ts
    // -------------------------------------------------------------------------
    let baseStyleElement = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    
    if (!baseStyleElement) {
      baseStyleElement = document.createElement('style');
      baseStyleElement.id = STYLE_ID;
      document.head.appendChild(baseStyleElement);
    }
    
    // Generate and inject base CSS variables from branding.ts SSOT
    baseStyleElement.textContent = generateTailwindCSSVariables();

    // -------------------------------------------------------------------------
    // Step 2: Apply tenant overrides if custom colors are set
    // -------------------------------------------------------------------------
    let tenantStyleElement = document.getElementById(TENANT_OVERRIDE_STYLE_ID) as HTMLStyleElement | null;
    
    if (tenantBranding) {
      const hasCustomPrimary = tenantBranding.primaryColor && 
        tenantBranding.primaryColor.toLowerCase() !== DEFAULT_PRIMARY.toLowerCase();
      const hasCustomSecondary = tenantBranding.secondaryColor && 
        tenantBranding.secondaryColor.toLowerCase() !== DEFAULT_SECONDARY.toLowerCase();
      
      if (hasCustomPrimary || hasCustomSecondary) {
        // Create override style element if needed
        if (!tenantStyleElement) {
          tenantStyleElement = document.createElement('style');
          tenantStyleElement.id = TENANT_OVERRIDE_STYLE_ID;
          document.head.appendChild(tenantStyleElement);
        }
        
        // Generate tenant override CSS
        tenantStyleElement.textContent = generateTenantOverrides(tenantBranding);
        
        console.log('[BrandingProvider] Tenant overrides applied:', {
          primary: hasCustomPrimary ? tenantBranding.primaryColor : '(default)',
          secondary: hasCustomSecondary ? tenantBranding.secondaryColor : '(default)',
        });
      } else {
        // No custom colors - remove any existing override element
        if (tenantStyleElement) {
          tenantStyleElement.remove();
        }
      }
    }

    // -------------------------------------------------------------------------
    // Cleanup on unmount
    // -------------------------------------------------------------------------
    return () => {
      const baseEl = document.getElementById(STYLE_ID);
      const tenantEl = document.getElementById(TENANT_OVERRIDE_STYLE_ID);
      if (baseEl) baseEl.remove();
      if (tenantEl) tenantEl.remove();
    };
  }, [tenantBranding]);

  return <>{children}</>;
}

// =============================================================================
// HELPER: Generate Tenant Override CSS
// =============================================================================

/**
 * Generate CSS that overrides base branding with tenant-specific colors.
 * Only overrides primary and secondary (the colors exposed in Admin Panel).
 */
function generateTenantOverrides(branding: TenantBranding): string {
  const overrides: string[] = [];
  
  // Override primary color if custom
  if (branding.primaryColor && branding.primaryColor.toLowerCase() !== DEFAULT_PRIMARY.toLowerCase()) {
    const primaryHsl = hexToHsl(branding.primaryColor);
    const primaryLight = adjustLightness(primaryHsl, 10);
    
    overrides.push(`
  /* Tenant Primary Color Override */
  --primary: ${primaryHsl};
  --primary-hover: ${primaryLight};
  --primary-light: ${adjustLightness(primaryHsl, 65)};
  --success: ${primaryHsl};
  --ring: ${primaryHsl};
    `);
  }
  
  // Override secondary color if custom
  if (branding.secondaryColor && branding.secondaryColor.toLowerCase() !== DEFAULT_SECONDARY.toLowerCase()) {
    const secondaryHsl = hexToHsl(branding.secondaryColor);
    const secondaryDark = adjustLightness(secondaryHsl, -6);
    
    overrides.push(`
  /* Tenant Secondary Color Override */
  --secondary: ${secondaryHsl};
  --secondary-hover: ${secondaryDark};
  --secondary-light: ${adjustLightness(secondaryHsl, 39)};
  --warning: ${secondaryHsl};
  --accent: ${secondaryHsl};
    `);
  }
  
  // Override font if custom
  if (branding.fontFamily && branding.fontFamily !== '"Inter", system-ui, sans-serif') {
    overrides.push(`
  /* Tenant Font Override */
  --font-primary: ${branding.fontFamily};
    `);
  }
  
  if (overrides.length === 0) {
    return '';
  }
  
  return `
/* ============================================
 * TENANT BRANDING OVERRIDES
 * Generated from Admin Panel settings
 * These override base branding.ts values
 * ============================================ */
:root {
${overrides.join('\n')}
}
  `.trim();
}

/**
 * Adjust lightness of an HSL color string
 * (Duplicated here to avoid circular dependency with branding.ts)
 */
function adjustLightness(hsl: string, adjustment: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return hsl;
  
  const h = parseInt(parts[1]);
  const s = parseInt(parts[2]);
  let l = parseInt(parts[3]) + adjustment;
  
  // Clamp lightness to valid range
  l = Math.max(0, Math.min(100, l));
  
  return `${h} ${s}% ${l}%`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default BrandingProvider;
