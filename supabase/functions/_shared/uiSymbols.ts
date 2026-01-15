// =====================================================
// UI SYMBOLS - Single Source of Truth (SSOT)
// =====================================================
// Location: supabase/functions/_shared/uiSymbols.ts (BACKEND MIRROR)
// Frontend Master: src/constants/uiSymbols.ts
// Purpose: Clean ASCII/Unicode symbols for consistent display
// Last Updated: 2025-01-15
// =====================================================
// ENCODING NOTE: These symbols replace corrupted UTF-8 sequences
// that display as â€¢, â€", …, etc. when file encoding breaks.
// =====================================================

/**
 * Standard UI symbols for consistent display across the application.
 * Use these instead of typing symbols directly to prevent encoding issues.
 */
export const UI_SYMBOLS = {
  // -----------------------------------------------------
  // SEPARATORS & PUNCTUATION
  // -----------------------------------------------------
  /** Bullet point separator (•) - Use between items: "Item1 • Item2" */
  BULLET: '•',
  
  /** Em dash (—) - Use for ranges or breaks: "faith—this salvation" */
  EM_DASH: '—',
  
  /** Ellipsis (…) - Use for loading/truncation: "Loading…" */
  ELLIPSIS: '…',

  // -----------------------------------------------------
  // INDICATORS & STATUS
  // -----------------------------------------------------
  /** Check mark (✓) - Use for feature lists, success states */
  CHECK: '✓',
  
  /** Star (★) - Use for favorites, defaults, ratings */
  STAR: '★',
  
  /** Sparkles (✨) - Use for premium/special features */
  SPARKLES: '✨',

  // -----------------------------------------------------
  // PROMPT FORMATTING (Backend primarily)
  // -----------------------------------------------------
  /** Warning sign (⚠️) - Use for important notices in prompts */
  WARNING: '⚠️',
  
  /** Cross mark (❌) - Use for "wrong" examples in prompts */
  CROSS: '❌',
} as const;

// Type for symbol keys
export type UISymbolKey = keyof typeof UI_SYMBOLS;

// -----------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------

/**
 * Join items with bullet separator
 * @example joinWithBullet(['SBC', 'RB', 'IND']) => "SBC • RB • IND"
 */
export function joinWithBullet(items: string[]): string {
  return items.join(` ${UI_SYMBOLS.BULLET} `);
}

/**
 * Format "None" option for select dropdowns
 * @example formatNoneOption() => "— None —"
 */
export function formatNoneOption(label: string = 'None'): string {
  return `${UI_SYMBOLS.EM_DASH} ${label} ${UI_SYMBOLS.EM_DASH}`;
}

/**
 * Format loading text with ellipsis
 * @example formatLoading('Loading') => "Loading…"
 */
export function formatLoading(text: string): string {
  return `${text}${UI_SYMBOLS.ELLIPSIS}`;
}

/**
 * Format null/undefined as em dash for display
 * @example formatEmpty(null) => "—"
 */
export function formatEmpty(value: unknown): string {
  return value === null || value === undefined ? UI_SYMBOLS.EM_DASH : String(value);
}
