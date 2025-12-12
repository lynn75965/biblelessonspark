// =====================================================
// SYSTEM SETTINGS - Single Source of Truth
// =====================================================
// Location: src/constants/systemSettings.ts (MASTER)
// Mirror: supabase/functions/_shared/systemSettings.ts
// DO NOT EDIT MIRROR DIRECTLY - Run: npm run sync-constants
// =====================================================
//
// This file defines ALL system settings for the platform.
// The database stores only key + value.
// Labels, descriptions, types, and defaults live HERE.
// =====================================================

// -----------------------------------------------------
// SETTING CATEGORIES
// -----------------------------------------------------
export const SETTING_CATEGORIES = {
  program: {
    id: 'program',
    label: 'Program Status',
    description: 'Control platform mode and phase information',
    order: 1,
  },
  visibility: {
    id: 'visibility',
    label: 'Visibility',
    description: 'Control what features and pages are visible to users',
    order: 2,
  },
  system: {
    id: 'system',
    label: 'System',
    description: 'Platform-wide system controls',
    order: 3,
  },
} as const;

export type SettingCategory = keyof typeof SETTING_CATEGORIES;

// -----------------------------------------------------
// SETTING TYPES
// -----------------------------------------------------
export const SETTING_TYPES = {
  toggle: 'toggle',
  select: 'select',
  text: 'text',
} as const;

export type SettingType = typeof SETTING_TYPES[keyof typeof SETTING_TYPES];

// -----------------------------------------------------
// SETTING DEFINITIONS
// -----------------------------------------------------
export const SYSTEM_SETTINGS = {
  // === PROGRAM CATEGORY ===
  program_status: {
    key: 'program_status',
    category: 'program',
    type: 'select',
    label: 'Program Status',
    description: 'Controls beta-specific UI and behavior across the platform',
    options: [
      { value: 'beta', label: 'Beta Mode' },
      { value: 'production', label: 'Production Mode' },
    ],
    defaultValue: 'beta',
    order: 1,
  },
  current_phase: {
    key: 'current_phase',
    category: 'program',
    type: 'text',
    label: 'Current Phase',
    description: 'Displayed in beta UI (e.g., "Private Beta", "Public Beta")',
    defaultValue: 'Private Beta',
    order: 2,
  },
  target_launch: {
    key: 'target_launch',
    category: 'program',
    type: 'text',
    label: 'Target Launch',
    description: 'Target launch date shown to beta users',
    defaultValue: 'Q1 2026',
    order: 3,
  },

  // === VISIBILITY CATEGORY ===
  show_join_beta_button: {
    key: 'show_join_beta_button',
    category: 'visibility',
    type: 'toggle',
    label: 'Show Join Beta Button',
    description: 'Display "Join Beta" button on landing page',
    defaultValue: true,
    order: 1,
  },
  show_pricing: {
    key: 'show_pricing',
    category: 'visibility',
    type: 'toggle',
    label: 'Show Pricing Page',
    description: 'Display pricing information to users',
    defaultValue: false,
    order: 2,
  },
  show_credits_block: {
    key: 'show_credits_block',
    category: 'visibility',
    type: 'toggle',
    label: 'Show Credits Block',
    description: 'Display credits/usage block in user dashboard',
    defaultValue: false,
    order: 3,
  },

  // === SYSTEM CATEGORY ===
  maintenance_mode: {
    key: 'maintenance_mode',
    category: 'system',
    type: 'toggle',
    label: 'Maintenance Mode',
    description: 'When enabled, shows maintenance message to all non-admin users',
    defaultValue: false,
    order: 1,
  },
} as const;

export type SettingKey = keyof typeof SYSTEM_SETTINGS;

// -----------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------

export function getSettingsByCategory(category: SettingCategory) {
  return Object.values(SYSTEM_SETTINGS)
    .filter(setting => setting.category === category)
    .sort((a, b) => a.order - b.order);
}

export function getDefaultValue(key: SettingKey): string | boolean {
  return SYSTEM_SETTINGS[key].defaultValue;
}

export function getAllDefaults(): Record<SettingKey, string | boolean> {
  const defaults: Record<string, string | boolean> = {};
  for (const [key, setting] of Object.entries(SYSTEM_SETTINGS)) {
    defaults[key] = setting.defaultValue;
  }
  return defaults as Record<SettingKey, string | boolean>;
}

export function isValidValue(key: SettingKey, value: unknown): boolean {
  const setting = SYSTEM_SETTINGS[key];
  
  if (setting.type === 'toggle') {
    return typeof value === 'boolean';
  }
  
  if (setting.type === 'select' && 'options' in setting) {
    return setting.options.some(opt => opt.value === value);
  }
  
  if (setting.type === 'text') {
    return typeof value === 'string';
  }
  
  return false;
}

export const VALID_SETTING_KEYS = Object.keys(SYSTEM_SETTINGS) as SettingKey[];
