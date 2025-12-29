/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/bibleVersions.ts
 * Generated: 2025-12-29T00:07:58.423Z
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
// =============================================================================

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  copyrightStatus: 'public_domain' | 'copyrighted';
  quoteType: 'direct' | 'paraphrase';
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
  // PUBLIC DOMAIN VERSIONS (Direct Quotation Permitted)
  // -------------------------------------------------------------------------
  {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    copyrightStatus: 'public_domain',
    quoteType: 'direct',
    copyrightHolder: null,
    copyrightNotice: null,
    displayOrder: 1,
    isDefault: false,
    description: 'The classic 1611 translation. Public domain - may be quoted freely.'
  },
  {
    id: 'web',
    name: 'World English Bible',
    abbreviation: 'WEB',
    copyrightStatus: 'public_domain',
    quoteType: 'direct',
    copyrightHolder: null,
    copyrightNotice: null,
    displayOrder: 2,
    isDefault: false,
    description: 'Modern English translation in public domain - may be quoted freely.'
  },

  // -------------------------------------------------------------------------
  // COPYRIGHTED VERSIONS (Paraphrase Only - No Direct Quotation)
  // -------------------------------------------------------------------------
  {
    id: 'nkjv',
    name: 'New King James Version',
    abbreviation: 'NKJV',
    copyrightStatus: 'copyrighted',
    quoteType: 'paraphrase',
    copyrightHolder: 'Thomas Nelson',
    copyrightNotice: 'Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.',
    displayOrder: 3,
    isDefault: false,
    description: 'Modern update of the KJV. Copyrighted - lessons will paraphrase rather than quote directly.'
  },
  {
    id: 'nasb',
    name: 'New American Standard Bible',
    abbreviation: 'NASB',
    copyrightStatus: 'copyrighted',
    quoteType: 'paraphrase',
    copyrightHolder: 'Lockman Foundation',
    copyrightNotice: 'Scripture quotations taken from the (NASB®) New American Standard Bible®, Copyright © 1960, 1971, 1977, 1995, 2020 by The Lockman Foundation. Used by permission. All rights reserved. lockman.org',
    displayOrder: 4,
    isDefault: true,
    description: 'Literal word-for-word translation. Copyrighted - lessons will paraphrase rather than quote directly.'
  },
  {
    id: 'esv',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    copyrightStatus: 'copyrighted',
    quoteType: 'paraphrase',
    copyrightHolder: 'Crossway',
    copyrightNotice: 'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.',
    displayOrder: 5,
    isDefault: false,
    description: 'Essentially literal translation. Copyrighted - lessons will paraphrase rather than quote directly.'
  },
  {
    id: 'niv',
    name: 'New International Version',
    abbreviation: 'NIV',
    copyrightStatus: 'copyrighted',
    quoteType: 'paraphrase',
    copyrightHolder: 'Biblica',
    copyrightNotice: 'Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.',
    displayOrder: 6,
    isDefault: false,
    description: 'Popular modern translation. Copyrighted - lessons will paraphrase rather than quote directly.'
  },
  {
    id: 'csb',
    name: 'Christian Standard Bible',
    abbreviation: 'CSB',
    copyrightStatus: 'copyrighted',
    quoteType: 'paraphrase',
    copyrightHolder: 'Holman Bible Publishers',
    copyrightNotice: 'Scripture quotations marked CSB have been taken from the Christian Standard Bible®, Copyright © 2017 by Holman Bible Publishers. Used by permission. Christian Standard Bible® and CSB® are federally registered trademarks of Holman Bible Publishers.',
    displayOrder: 7,
    isDefault: false,
    description: 'Balance of accuracy and readability. Copyrighted - lessons will paraphrase rather than quote directly.'
  },
  {
    id: 'nlt',
    name: 'New Living Translation',
    abbreviation: 'NLT',
    copyrightStatus: 'copyrighted',
    quoteType: 'paraphrase',
    copyrightHolder: 'Tyndale House Publishers',
    copyrightNotice: 'Scripture quotations marked NLT are taken from the Holy Bible, New Living Translation, copyright © 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved.',
    displayOrder: 8,
    isDefault: false,
    description: 'Thought-for-thought translation emphasizing clarity. Copyrighted - lessons will paraphrase rather than quote directly.'
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
  copyrightStatus: 'public_domain' | 'copyrighted';
}> {
  return getBibleVersionsSorted().map(v => ({
    id: v.id,
    name: v.name,
    abbreviation: v.abbreviation,
    description: v.description,
    copyrightStatus: v.copyrightStatus
  }));
}

// =============================================================================
// COPYRIGHT GUARDRAILS GENERATOR
// =============================================================================

/**
 * Generate copyright guardrails for AI prompt based on Bible version
 * Similar to generateTheologicalGuardrails() in theologyProfiles.ts
 */
export function generateCopyrightGuardrails(versionId: string): string {
  const version = getBibleVersion(versionId);

  if (!version) {
    // Default to KJV (public domain) if version not found
    const defaultVersion = getDefaultBibleVersion();
    return generateCopyrightGuardrails(defaultVersion.id);
  }

  if (version.copyrightStatus === 'public_domain') {
    // PUBLIC DOMAIN - Direct quotation permitted
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
    // COPYRIGHTED - Paraphrase only
    return `
## BIBLE VERSION & COPYRIGHT COMPLIANCE — MANDATORY

**Selected Version:** ${version.name} (${version.abbreviation})
**Copyright Status:** COPYRIGHTED by ${version.copyrightHolder}
**Quote Type:** PARAPHRASE ONLY

### ⚠️ CRITICAL COPYRIGHT RESTRICTIONS

🚫 **PROHIBITED - DO NOT:**
- Quote the ${version.abbreviation} text directly or verbatim
- Reproduce exact wording from the ${version.abbreviation}
- Use more than 3 consecutive words from the ${version.abbreviation} text
- Copy distinctive ${version.abbreviation} phrasing

✅ **REQUIRED - YOU MUST:**
- Paraphrase all Scripture content in your own words
- Reference verses by citation (e.g., "Romans 8:28 teaches...")
- Describe what the passage says without quoting it
- Use phrases like "The passage tells us..." or "Paul writes about..."

### PARAPHRASE TECHNIQUES

Instead of quoting, use these approaches:

1. **Summarize the meaning:**
   ❌ WRONG: "For God so loved the world that he gave his one and only Son"
   ✅ RIGHT: "John 3:16 reveals the heart of the gospel - God's love was so great that He sacrificed His Son for humanity's salvation."

2. **Reference without reproducing:**
   ❌ WRONG: "And we know that in all things God works for the good"
   ✅ RIGHT: "In Romans 8:28, Paul assures believers that God orchestrates all circumstances for their ultimate good."

3. **Describe the teaching:**
   ❌ WRONG: "I can do all things through Christ who strengthens me"
   ✅ RIGHT: "Philippians 4:13 teaches that believers find their strength and capability through their relationship with Christ."

### TEACHER GUIDANCE

When the lesson references Scripture:
- Encourage teachers to read directly from their own Bibles
- Provide verse references so teachers can quote from their personal copies
- Include phrases like "Have students turn to [verse] and read aloud"

### VERIFICATION CHECKLIST

Before outputting, verify:
☐ No verbatim ${version.abbreviation} quotations appear
☐ All Scripture content is paraphrased
☐ Verse references are provided for teacher/student lookup
☐ No more than 3 consecutive words match ${version.abbreviation} text
`;
  }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type BibleVersionId = typeof BIBLE_VERSIONS[number]['id'];
export type CopyrightStatus = 'public_domain' | 'copyrighted';
export type QuoteType = 'direct' | 'paraphrase';
