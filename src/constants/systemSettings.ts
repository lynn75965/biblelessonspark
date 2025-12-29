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
  current_phase: {
    key: 'current_phase',
    category: 'program',
    type: 'select',
    label: 'Platform Mode',
    description: 'Controls platform behavior and display across the application',
    options: [
      { value: 'private_beta', label: 'Private Beta' },
      { value: 'public_beta', label: 'Public Beta' },
      { value: 'production', label: 'Production' },
    ],
    defaultValue: 'private_beta',
    order: 1,
  },
  target_launch: {
    key: 'target_launch',
    category: 'program',
    type: 'text',
    label: 'Target Launch',
    description: 'Target launch date shown to beta users',
    defaultValue: 'Q1 2026',
    order: 2,
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
    defaultValue: true,
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

// -----------------------------------------------------
// BEHAVIOR HELPERS
// -----------------------------------------------------

export function isBetaMode(currentPhase: string): boolean {
  return currentPhase === 'private_beta' || currentPhase === 'public_beta';
}

export function getPhaseDisplayLabel(currentPhase: string): string {
  const setting = SYSTEM_SETTINGS.current_phase;
  const option = setting.options.find(opt => opt.value === currentPhase);
  return option?.label || 'Unknown';
}

