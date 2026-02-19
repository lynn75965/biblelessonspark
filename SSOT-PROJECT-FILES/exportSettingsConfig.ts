/**
 * Export Settings Configuration - SSOT
 *
 * Defines all admin-editable export formatting settings.
 * Defaults match EXPORT_SPACING in lessonStructure.ts.
 * Admin overrides stored in system_settings table (key: 'export_formatting').
 *
 * SSOT Chain:
 *   exportSettingsConfig.ts (defines what's editable + defaults)
 *   → useExportSettings.ts (admin panel read/write)
 *   → getActiveExportSpacing.ts (export utilities read merged values)
 *   → lessonStructure.ts EXPORT_SPACING (fallback defaults)
 */

// ============================================================
// Categories
// ============================================================

export const EXPORT_SETTING_CATEGORIES = {
  typography: {
    label: "Typography",
    description: "Font families and sizes for exported documents",
    order: 1,
  },
  spacing: {
    label: "Spacing",
    description: "Page margins and paragraph spacing",
    order: 2,
  },
  colors: {
    label: "Colors",
    description: "Text and accent colors (hex format)",
    order: 3,
  },
  labels: {
    label: "Labels & Text",
    description: "Footer text and section labels",
    order: 4,
  },
} as const;

export type ExportSettingCategory = keyof typeof EXPORT_SETTING_CATEGORIES;

// ============================================================
// Setting Type Definitions
// ============================================================

interface BaseSetting {
  key: string;
  label: string;
  description: string;
  category: ExportSettingCategory;
}

interface NumberSetting extends BaseSetting {
  type: "number";
  default: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

interface SelectSetting extends BaseSetting {
  type: "select";
  default: string;
  options: { value: string; label: string }[];
}

interface TextSetting extends BaseSetting {
  type: "text";
  default: string;
  maxLength: number;
}

interface ColorSetting extends BaseSetting {
  type: "color";
  default: string; // hex WITHOUT # prefix
}

export type ExportSetting = NumberSetting | SelectSetting | TextSetting | ColorSetting;

// ============================================================
// All Editable Settings
// ============================================================

export const EXPORT_SETTINGS: ExportSetting[] = [
  // ── Typography ──────────────────────────────────────────────
  {
    key: "font_primary",
    label: "Primary Font",
    description: "Main font for all exported content",
    category: "typography",
    type: "select",
    default: "Calibri",
    options: [
      { value: "Calibri", label: "Calibri (Modern, Clean)" },
      { value: "Georgia", label: "Georgia (Traditional, Serif)" },
      { value: "Times New Roman", label: "Times New Roman (Classic)" },
      { value: "Arial", label: "Arial (Simple, Sans-Serif)" },
      { value: "Garamond", label: "Garamond (Elegant, Serif)" },
      { value: "Palatino Linotype", label: "Palatino (Readable, Serif)" },
    ],
  },
  {
    key: "body_fontPt",
    label: "Body Text Size",
    description: "Size of main content text (recommended: 11pt for readability)",
    category: "typography",
    type: "number",
    default: 11,
    min: 9,
    max: 14,
    step: 0.5,
    unit: "pt",
  },
  {
    key: "title_fontPt",
    label: "Title Size",
    description: "Size of the lesson title",
    category: "typography",
    type: "number",
    default: 14,
    min: 12,
    max: 20,
    step: 1,
    unit: "pt",
  },
  {
    key: "sectionHeader_fontPt",
    label: "Section Header Size",
    description: 'Size of section headers (e.g., "Section 1: Lens + Lesson Overview")',
    category: "typography",
    type: "number",
    default: 14,
    min: 10,
    max: 18,
    step: 1,
    unit: "pt",
  },
  {
    key: "metadata_fontPt",
    label: "Metadata Size",
    description: "Size of metadata text (theological profile, passage info)",
    category: "typography",
    type: "number",
    default: 9,
    min: 7,
    max: 12,
    step: 0.5,
    unit: "pt",
  },
  {
    key: "footer_fontPt",
    label: "Footer Size",
    description: "Size of copyright/footer text",
    category: "typography",
    type: "number",
    default: 8,
    min: 6,
    max: 11,
    step: 0.5,
    unit: "pt",
  },
  {
    key: "teaser_fontPt",
    label: "Teaser Box Size",
    description: "Size of student teaser text",
    category: "typography",
    type: "number",
    default: 10,
    min: 8,
    max: 13,
    step: 0.5,
    unit: "pt",
  },
  {
    key: "body_lineHeight",
    label: "Line Height",
    description: "Line spacing multiplier (1.0 = single, 1.5 = one-and-a-half, 2.0 = double)",
    category: "typography",
    type: "number",
    default: 1.4,
    min: 1.0,
    max: 2.0,
    step: 0.1,
    unit: "×",
  },

  // ── Spacing ─────────────────────────────────────────────────
  {
    key: "margins_inches",
    label: "Page Margins",
    description: "Margin on all sides of the page",
    category: "spacing",
    type: "select",
    default: "0.5",
    options: [
      { value: "0.5", label: '0.5 inches (Compact)' },
      { value: "0.75", label: '0.75 inches (Standard)' },
      { value: "1.0", label: '1.0 inch (Wide)' },
    ],
  },
  {
    key: "sectionHeader_beforePt",
    label: "Space Before Section Headers",
    description: "Vertical space above each section header",
    category: "spacing",
    type: "number",
    default: 8,
    min: 2,
    max: 20,
    step: 1,
    unit: "pt",
  },
  {
    key: "sectionHeader_afterPt",
    label: "Space After Section Headers",
    description: "Vertical space below each section header",
    category: "spacing",
    type: "number",
    default: 4,
    min: 1,
    max: 12,
    step: 1,
    unit: "pt",
  },
  {
    key: "paragraph_afterPt",
    label: "Paragraph Spacing",
    description: "Space after each paragraph",
    category: "spacing",
    type: "number",
    default: 4,
    min: 1,
    max: 12,
    step: 1,
    unit: "pt",
  },

  // ── Colors ──────────────────────────────────────────────────
  {
    key: "colors_bodyText",
    label: "Body Text",
    description: "Main content text color",
    category: "colors",
    type: "color",
    default: "333333",
  },
  {
    key: "colors_teaserBg",
    label: "Teaser Background",
    description: "Student teaser box background",
    category: "colors",
    type: "color",
    default: "F0F7FF",
  },
  {
    key: "colors_teaserBorder",
    label: "Teaser Border",
    description: "Student teaser box border",
    category: "colors",
    type: "color",
    default: "3B82F6",
  },
  {
    key: "colors_teaserText",
    label: "Teaser Text",
    description: "Student teaser text color",
    category: "colors",
    type: "color",
    default: "2563EB",
  },
  {
    key: "colors_metaText",
    label: "Metadata Text",
    description: "Profile and passage info text",
    category: "colors",
    type: "color",
    default: "666666",
  },
  {
    key: "colors_footerText",
    label: "Footer Text",
    description: "Copyright/footer text color",
    category: "colors",
    type: "color",
    default: "999999",
  },
  {
    key: "colors_hrLine",
    label: "Horizontal Rule",
    description: "Section divider line color",
    category: "colors",
    type: "color",
    default: "CCCCCC",
  },

  // ── Labels & Text ───────────────────────────────────────────
  {
    key: "label_footerText",
    label: "Footer Text",
    description: "Text shown in document footer/copyright area",
    category: "labels",
    type: "text",
    default: "BibleLessonSpark.com",
    maxLength: 100,
  },
  {
    key: "label_teaserLabel",
    label: "Teaser Section Label",
    description: "Header label for the student teaser box",
    category: "labels",
    type: "text",
    default: "STUDENT TEASER",
    maxLength: 50,
  },
];

// ============================================================
// Helper Functions
// ============================================================

/** Get settings filtered by category */
export function getExportSettingsByCategory(
  category: ExportSettingCategory
): ExportSetting[] {
  return EXPORT_SETTINGS.filter((s) => s.category === category);
}

/** Get all default values as a flat key→value record */
export function getExportSettingDefaults(): Record<string, string | number> {
  const defaults: Record<string, string | number> = {};
  for (const setting of EXPORT_SETTINGS) {
    defaults[setting.key] = setting.default;
  }
  return defaults;
}

/** Find a setting definition by key */
export function getExportSettingByKey(key: string): ExportSetting | undefined {
  return EXPORT_SETTINGS.find((s) => s.key === key);
}

/** Database key used in system_settings table */
export const EXPORT_SETTINGS_DB_KEY = "export_formatting";
