/**
 * LessonSparkUSA Constants - Tenant Configuration
 *
 * SINGLE SOURCE OF TRUTH for tenant/white-label configuration.
 * This is Tier 1 (Supreme/Foundational).
 *
 * GOVERNANCE: Only admin can modify tenant settings.
 * Database table: tenant_config
 */

// =============================================================================
// TYPE DEFINITIONS (Nested structure for organized access)
// =============================================================================

export type TenantConfig = {
  tenantId: string;

  branding: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };

  uiText: {
    appTitle: string;
    tagline: string;
    primaryCta: string;
  };

  features: {
    devotionals: boolean;
    pdfExport: boolean;
    whiteLabel: boolean;
  };
};

// Database row type (snake_case as stored in Supabase)
export interface TenantConfigRow {
  id: string;
  tenant_id: string;
  brand_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  app_title: string;
  tagline: string;
  primary_cta: string;
  feature_devotionals: boolean;
  feature_pdf_export: boolean;
  feature_white_label: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_TENANT_ID = "lessonsparkusa";

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  tenantId: DEFAULT_TENANT_ID,

  branding: {
    name: "LessonSparkUSA",
    logoUrl: null,
    primaryColor: "#E4572E",
    secondaryColor: "#1F2937",
    fontFamily: "Inter",
  },

  uiText: {
    appTitle: "LessonSparkUSA",
    tagline: "Teach the way God equipped you to teach",
    primaryCta: "Create Lesson",
  },

  features: {
    devotionals: true,
    pdfExport: true,
    whiteLabel: false,
  },
};

// =============================================================================
// FONT OPTIONS (for Admin UI dropdown)
// =============================================================================

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Modern)" },
  { value: "system-ui", label: "System Default" },
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia (Serif)" },
  { value: "Times New Roman", label: "Times New Roman" },
] as const;

// =============================================================================
// COLOR PRESETS (for Admin UI)
// =============================================================================

export const COLOR_PRESETS = {
  primary: [
    { value: "#E4572E", label: "LessonSpark Orange" },
    { value: "#2563EB", label: "Baptist Blue" },
    { value: "#059669", label: "Ministry Green" },
    { value: "#7C3AED", label: "Royal Purple" },
    { value: "#DC2626", label: "Classic Red" },
  ],
  secondary: [
    { value: "#1F2937", label: "Charcoal" },
    { value: "#374151", label: "Slate" },
    { value: "#1E3A5F", label: "Navy" },
    { value: "#064E3B", label: "Forest" },
    { value: "#4B5563", label: "Gray" },
  ],
} as const;

// =============================================================================
// FEATURE FLAG DEFINITIONS
// =============================================================================

export const FEATURE_FLAGS = [
  {
    key: "devotionals" as const,
    dbKey: "feature_devotionals" as const,
    label: "Enable Devotionals",
    description: "Allow users to generate devotional content",
  },
  {
    key: "pdfExport" as const,
    dbKey: "feature_pdf_export" as const,
    label: "Enable PDF Export",
    description: "Allow users to export lessons as PDF",
  },
  {
    key: "whiteLabel" as const,
    dbKey: "feature_white_label" as const,
    label: "White Label Mode",
    description: "Remove LessonSparkUSA branding for enterprise clients",
  },
] as const;

// =============================================================================
// MAPPING FUNCTIONS (Database ↔ Frontend)
// =============================================================================

/**
 * Convert database row (snake_case) to frontend config (nested structure)
 */
export function mapRowToConfig(row: TenantConfigRow): TenantConfig {
  return {
    tenantId: row.tenant_id,
    branding: {
      name: row.brand_name,
      logoUrl: row.logo_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      fontFamily: row.font_family,
    },
    uiText: {
      appTitle: row.app_title,
      tagline: row.tagline,
      primaryCta: row.primary_cta,
    },
    features: {
      devotionals: row.feature_devotionals,
      pdfExport: row.feature_pdf_export,
      whiteLabel: row.feature_white_label,
    },
  };
}

/**
 * Convert frontend config (nested) to database row (snake_case)
 * For updates - excludes id, created_at, updated_at
 */
export function mapConfigToRow(config: TenantConfig): Omit<TenantConfigRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    tenant_id: config.tenantId,
    brand_name: config.branding.name,
    logo_url: config.branding.logoUrl,
    primary_color: config.branding.primaryColor,
    secondary_color: config.branding.secondaryColor,
    font_family: config.branding.fontFamily,
    app_title: config.uiText.appTitle,
    tagline: config.uiText.tagline,
    primary_cta: config.uiText.primaryCta,
    feature_devotionals: config.features.devotionals,
    feature_pdf_export: config.features.pdfExport,
    feature_white_label: config.features.whiteLabel,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function validateTenantConfig(config: TenantConfig): string[] {
  const errors: string[] = [];

  if (!config.branding.name.trim()) {
    errors.push("Brand name cannot be empty");
  }

  if (!config.uiText.appTitle.trim()) {
    errors.push("App title cannot be empty");
  }

  if (!isValidHexColor(config.branding.primaryColor)) {
    errors.push("Primary color must be a valid hex color (e.g., #E4572E)");
  }

  if (!isValidHexColor(config.branding.secondaryColor)) {
    errors.push("Secondary color must be a valid hex color (e.g., #1F2937)");
  }

  return errors;
}

// =============================================================================
// CSS VARIABLE HELPERS
// =============================================================================

export function applyTenantStyles(config: TenantConfig): void {
  document.documentElement.style.setProperty("--tenant-primary", config.branding.primaryColor);
  document.documentElement.style.setProperty("--tenant-secondary", config.branding.secondaryColor);
  document.documentElement.style.setProperty("--tenant-font", config.branding.fontFamily);
}

export const CSS_VARIABLES = {
  primary: "--tenant-primary",
  secondary: "--tenant-secondary",
  font: "--tenant-font",
} as const;

// =============================================================================
// TENANT ID RESOLUTION
// =============================================================================

/**
 * Resolve tenant ID from hostname
 * Example:
 *   lessonsparkusa.com        -> lessonsparkusa
 *   firstbaptist.lessonsparkusa.com -> firstbaptist
 */
export function resolveTenantFromHost(host: string): string {
  const parts = host.split(".");
  // If subdomain exists (3+ parts), use first part
  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }
  return DEFAULT_TENANT_ID;
}