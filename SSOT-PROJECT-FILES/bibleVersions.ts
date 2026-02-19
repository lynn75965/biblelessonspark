/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/bibleVersions.ts
 * Generated: 2026-02-19
 */
// =============================================================================
// BIBLE VERSIONS - Single Source of Truth (SSOT)
// =============================================================================
// Location: src/constants/bibleVersions.ts (MASTER)
// Mirror: supabase/functions/_shared/bibleVersions.ts (AUTO-GENERATED)
//
// MODIFICATION RULES:
// 1. ONLY edit this file (the frontend master)
// 2. Run `npm run sync-constants` to update backend mirror
// 3. NEVER edit the backend mirror directly
//
// UPDATED: February 2026
// - Added Amplified Bible (AMP) as 9th version (Lockman Foundation, same fair use as NASB)
// - Changed all versions to allow direct quotation (up to 10 verses per lesson)
// - Added usageHint for user-friendly copyright guidance
// - All copyrighted versions now within fair use thresholds
// =============================================================================

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  copyrightStatus: 'public_domain' | 'copyrighted';
  quoteType: 'direct' | 'paraphrase';
  usageHint: string; // User-friendly guidance shown in dropdowns
  copyrightHolder: string | null;
  copyrightNotice: string | null;
  displayOrder: number;
  isDefault: boolean;
  description: string;
}

// =============================================================================
// BIBLE VERSIONS DATA
// =============================================================================

export const BIBLE_VERSIONS: BibleVersion[] = [
  // -------------------------------------------------------------------------
  // PUBLIC DOMAIN VERSIONS (Unlimited Quotation)
  // -------------------------------------------------------------------------
  {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    copyrightStatus: 'public_domain',
    quoteType: 'direct',
    usageHint: '✓ Quote freely — public domain, no limits',
    copyrightHolder: null,
    copyrightNotice: null,
    displayOrder: 1,
    isDefault: false,
    description: 'The classic 1611 translation. Public domain — quote any length freely.'
  },
  {
    id: 'web',
    name: 'World English Bible',
    abbreviation: 'WEB',
    copyrightStatus: 'public_domain',
    quoteType: 'direct',
    usageHint: '✓ Quote freely — public domain, no limits',
    copyrightHolder: null,
    copyrightNotice: null,
    displayOrder: 2,
    isDefault: false,
    description: 'Modern English translation in public domain — quote any length freely.'
  },

  // -------------------------------------------------------------------------
  // COPYRIGHTED VERSIONS (Direct Quotation — Up to 10 Verses Per Lesson)
  // -------------------------------------------------------------------------
  {
    id: 'nkjv',
    name: 'New King James Version',
    abbreviation: 'NKJV',
    copyrightStatus: 'copyrighted',
    quoteType: 'direct',
    usageHint: '✓ Quote directly — up to 10 verses per lesson',
    copyrightHolder: 'Thomas Nelson',
    copyrightNotice: 'Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.',
    displayOrder: 3,
    isDefault: false,
    description: 'Modern update of the KJV. Direct quotation permitted within fair use guidelines.'
  },
  {
    id: 'nasb',
    name: 'New American Standard Bible',
    abbreviation: 'NASB',
    copyrightStatus: 'copyrighted',
    quoteType: 'direct',
    usageHint: '✓ Quote directly — up to 10 verses per lesson',
    copyrightHolder: 'Lockman Foundation',
    copyrightNotice: 'Scripture quotations taken from the (NASB®) New American Standard Bible®, Copyright © 1960, 1971, 1977, 1995, 2020 by The Lockman Foundation. Used by permission. All rights reserved. lockman.org',
    displayOrder: 4,
    isDefault: true,
    description: 'Literal word-for-word translation. Direct quotation permitted within fair use guidelines.'
  },
  {
    id: 'esv',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    copyrightStatus: 'copyrighted',
    quoteType: 'direct',
    usageHint: '✓ Quote directly — up to 10 verses per lesson',
    copyrightHolder: 'Crossway',
    copyrightNotice: 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.',
    displayOrder: 5,
    isDefault: false,
    description: 'Essentially literal translation. Direct quotation permitted within fair use guidelines.'
  },
  {
    id: 'niv',
    name: 'New International Version',
    abbreviation: 'NIV',
    copyrightStatus: 'copyrighted',
    quoteType: 'direct',
    usageHint: '✓ Quote directly — up to 10 verses per lesson',
    copyrightHolder: 'Biblica',
    copyrightNotice: 'Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.',
    displayOrder: 6,
    isDefault: false,
    description: 'Popular modern translation. Direct quotation permitted within fair use guidelines.'
  },
  {
    id: 'csb',
    name: 'Christian Standard Bible',
    abbreviation: 'CSB',
    copyrightStatus: 'copyrighted',
    quoteType: 'direct',
    usageHint: '✓ Quote directly — up to 10 verses per lesson',
    copyrightHolder: 'Holman Bible Publishers',
    copyrightNotice: 'Scripture quotations marked CSB have been taken from the Christian Standard Bible®, Copyright © 2017 by Holman Bible Publishers. Used by permission. Christian Standard Bible® and CSB® are federally registered trademarks of Holman Bible Publishers.',
    displayOrder: 7,
    isDefault: false,
    description: 'Balance of accuracy and readability. Direct quotation permitted within fair use guidelines.'
  },
  {
    id: 'nlt',
    name: 'New Living Translation',
    abbreviation: 'NLT',
    copyrightStatus: 'copyrighted',
    quoteType: 'direct',
    usageHint: '✓ Quote directly — up to 10 verses per lesson',
    copyrightHolder: 'Tyndale House Publishers',
    copyrightNotice: 'Scripture quotations marked NLT are taken from the Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved.',
    displayOrder: 8,
    isDefault: false,
    description: 'Thought-for-thought translation emphasizing clarity. Direct quotation permitted within fair use guidelines.'
  },
  {
    id: 'amp',
    name: 'Amplified Bible',
    abbreviation: 'AMP',
    copyrightStatus: 'copyrighted',
    quoteType: 'direct',
    usageHint: '✓ Quote directly — up to 10 verses per lesson',
    copyrightHolder: 'The Lockman Foundation',
    copyrightNotice: 'Scripture quotations taken from the Amplified® Bible (AMP), Copyright © 2015 by The Lockman Foundation. Used by permission. www.lockman.org',
    displayOrder: 9,
    isDefault: false,
    description: 'Expanded translation with inline amplifications for deeper meaning. Direct quotation permitted within fair use guidelines.'
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a Bible version by ID
 */
export function getBibleVersion(id: string): BibleVersion | undefined {
  return BIBLE_VERSIONS.find(v => v.id === id);
}

/**
 * Get the default Bible version (NASB)
 */
export function getDefaultBibleVersion(): BibleVersion {
  const defaultVersion = BIBLE_VERSIONS.find(v => v.isDefault);
  if (!defaultVersion) {
    throw new Error('No default Bible version configured');
  }
  return defaultVersion;
}

/**
 * Get all Bible versions sorted by displayOrder
 */
export function getBibleVersionsSorted(): BibleVersion[] {
  return [...BIBLE_VERSIONS].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get Bible version options for dropdowns (user-facing subset)
 */
export function getBibleVersionOptions(): Array<{
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  usageHint: string;
  copyrightStatus: 'public_domain' | 'copyrighted';
}> {
  return getBibleVersionsSorted().map(v => ({
    id: v.id,
    name: v.name,
    abbreviation: v.abbreviation,
    description: v.description,
    usageHint: v.usageHint,
    copyrightStatus: v.copyrightStatus
  }));
}

// =============================================================================
// COPYRIGHT GUARDRAILS GENERATOR
// =============================================================================

/**
 * Generate copyright guardrails for AI prompt based on Bible version
 * Updated January 2026: All versions now allow direct quotation
 */
export function generateCopyrightGuardrails(versionId: string): string {
  const version = getBibleVersion(versionId);

  if (!version) {
    // Default to NASB if version not found
    const defaultVersion = getDefaultBibleVersion();
    return generateCopyrightGuardrails(defaultVersion.id);
  }

  if (version.copyrightStatus === 'public_domain') {
    // PUBLIC DOMAIN - Unlimited quotation permitted
    return `
## BIBLE VERSION & COPYRIGHT COMPLIANCE

**Selected Version:** ${version.name} (${version.abbreviation})
**Copyright Status:** PUBLIC DOMAIN

### QUOTATION RULES

✅ **PERMITTED - Direct Quotation:**
- You MAY quote Scripture passages directly and verbatim
- You MAY include extended quotations of any length
- You MAY reproduce the exact wording of the ${version.abbreviation}
- No attribution notice required (public domain)

### FORMATTING REQUIREMENTS

When quoting Scripture:
- Use quotation marks for inline quotes
- Use block quotes for passages of 3+ verses
- Always include verse references (e.g., John 3:16)
- Use the ${version.abbreviation} text faithfully

### EXAMPLE FORMAT

Inline: Jesus said, "For God so loved the world, that he gave his only begotten Son" (John 3:16, KJV).

Block quote:
> "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
> — John 3:16 (${version.abbreviation})
`;
  } else {
    // COPYRIGHTED - Direct quotation permitted (up to 10 verses)
    return `
## BIBLE VERSION & COPYRIGHT COMPLIANCE

**Selected Version:** ${version.name} (${version.abbreviation})
**Copyright Status:** COPYRIGHTED by ${version.copyrightHolder}
**Quote Type:** DIRECT QUOTATION PERMITTED (within fair use)

### QUOTATION RULES

✅ **PERMITTED - Direct Quotation (Up to 10 Verses Per Lesson):**
- You MAY quote Scripture passages directly and verbatim
- Keep direct quotations to approximately 10 verses or fewer per lesson
- This is well within the publisher's fair use threshold (500+ verses allowed)
- Always include verse references

### FORMATTING REQUIREMENTS

When quoting Scripture:
- Use quotation marks for inline quotes
- Use block quotes for passages of 3+ verses
- Always include verse references (e.g., Romans 8:28)
- Use the ${version.abbreviation} text faithfully

### EXAMPLE FORMAT

Inline: Paul writes, "And we know that in all things God works for the good of those who love him" (Romans 8:28, ${version.abbreviation}).

Block quote:
> "And we know that in all things God works for the good of those who love him, who have been called according to his purpose."
> — Romans 8:28 (${version.abbreviation})

### COPYRIGHT NOTICE (Auto-included in lesson footer)
${version.copyrightNotice}

### TEACHER GUIDANCE
- Teachers may read additional passages directly from their own Bibles
- Provide verse references so teachers can expand quotations as needed
- The lesson's Scripture quotations are within fair use guidelines
`;
  }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type BibleVersionId = typeof BIBLE_VERSIONS[number]['id'];
export type CopyrightStatus = 'public_domain' | 'copyrighted';
export type QuoteType = 'direct' | 'paraphrase';
