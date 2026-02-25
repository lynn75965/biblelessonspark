// =====================================================
// UI SYMBOLS - Single Source of Truth (SSOT)
// =====================================================
// Location: src/constants/uiSymbols.ts (FRONTEND MASTER)
// Backend Mirror: supabase/functions/_shared/uiSymbols.ts
// Purpose: Clean ASCII/Unicode symbols for consistent display
// Last Updated: 2025-01-15
// =====================================================
// ENCODING NOTE: These symbols replace corrupted UTF-8 sequences
// that display as garbled text (e.g. a*", a-") when file encoding breaks.
// =====================================================

/**
 * Standard UI symbols for consistent display across the application.
 * Use these instead of typing symbols directly to prevent encoding issues.
 */
export const UI_SYMBOLS = {
  // -----------------------------------------------------
  // SEPARATORS & PUNCTUATION
  // -----------------------------------------------------
  /** Bullet point separator (*) - Use between items: "Item1 * Item2" */
  BULLET: '*',
  
  /** Em dash (--) - Use for ranges or breaks: "faith--this salvation" */
  EM_DASH: '--',
  
  /** Ellipsis (\u2026) - Use for loading/truncation: "Loading\u2026" */
  ELLIPSIS: '\u2026',

  // -----------------------------------------------------
  // INDICATORS & STATUS
  // -----------------------------------------------------
  /** Check mark ([x]) - Use for feature lists, success states */
  CHECK: '[x]',
  
  /** Star (\u2605) - Use for favorites, defaults, ratings */
  STAR: '\u2605',
  
  /** Sparkles (\u2728) - Use for premium/special features */
  SPARKLES: '\u2728',

  // -----------------------------------------------------
  // PROMPT FORMATTING (Backend primarily)
  // -----------------------------------------------------
  /** Warning sign (\u26A0\uFE0F) - Use for important notices in prompts */
  WARNING: '\u26A0\uFE0F',
  
  /** Cross mark (\u274C) - Use for "wrong" examples in prompts */
  CROSS: '\u274C',
} as const;

// Type for symbol keys
export type UISymbolKey = keyof typeof UI_SYMBOLS;

// -----------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------

/**
 * Join items with bullet separator
 * @example joinWithBullet(['SBC', 'RB', 'IND']) => "SBC * RB * IND"
 */
export function joinWithBullet(items: string[]): string {
  return items.join(` ${UI_SYMBOLS.BULLET} `);
}

/**
 * Format "None" option for select dropdowns
 * @example formatNoneOption() => "-- None --"
 */
export function formatNoneOption(label: string = 'None'): string {
  return `${UI_SYMBOLS.EM_DASH} ${label} ${UI_SYMBOLS.EM_DASH}`;
}

/**
 * Format loading text with ellipsis
 * @example formatLoading('Loading') => "Loading\u2026"
 */
export function formatLoading(text: string): string {
  return `${text}${UI_SYMBOLS.ELLIPSIS}`;
}

/**
 * Format null/undefined as em dash for display
 * @example formatEmpty(null) => "--"
 */
export function formatEmpty(value: unknown): string {
  return value === null || value === undefined ? UI_SYMBOLS.EM_DASH : String(value);
}
