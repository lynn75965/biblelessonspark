/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/devotionalConfig.ts
 * Generated: 2026-01-28T22:25:06.627Z
 */
/**
 * DEVOTIONALSPARK CONFIGURATION - Single Source of Truth (SSOT)
 * 
 * Location: src/constants/devotionalConfig.ts (MASTER)
 * Mirror: supabase/functions/_shared/devotionalConfig.ts (AUTO-GENERATED)
 * 
 * MODIFICATION RULES:
 * 1. ONLY edit this file (the frontend master)
 * 2. Run `npm run sync-constants` to update backend mirror
 * 3. NEVER edit the backend mirror directly
 * 
 * PURPOSE:
 * DevotionalSpark generates personal devotionals anchored to lessons.
 * Unlike lessons (classroom instruction), devotionals speak directly
 * to the reader's heart in second-person voice.
 * 
 * GUARDRAILS (Hidden from user):
 * - Theology Profile: Inherited from lesson
 * - Bible Version: Inherited from lesson (always paraphrase)
 * - Age-Appropriate Vocabulary: Inherited, overridable via Target
 * - Devotional Voice: Second-person direct address
 * - Moral Valence: Pre-check on passage interpretation
 * 
 * USER OPTIONS (Visible):
 * - Target: Preschool, Children, Youth, Adult
 * - Length: 3 min, 5 min, 10 min
 * 
 * @version 1.0.0
 * @lastUpdated 2025-12-28
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface DevotionalTarget {
  id: string;
  label: string;
  description: string;
  vocabularyLevel: 'simple' | 'moderate' | 'advanced';
  displayOrder: number;
  isDefault: boolean;
  /** Maps to ageGroups.ts IDs for vocabulary inheritance */
  ageGroupMapping: string[];
}

export interface DevotionalLength {
  id: string;
  label: string;
  minutes: number;
  wordCountMin: number;
  wordCountMax: number;
  displayOrder: number;
  isDefault: boolean;
  description: string;
}

export interface DevotionalSection {
  id: string;
  name: string;
  displayOrder: number;
  purpose: string;
  wordBudgetPercent: number;
}

export interface DevotionalGuardrails {
  voiceRequirements: string[];
  contentProhibitions: string[];
  moralValenceRules: string[];
}

// ============================================================================
// DEVOTIONAL TARGETS (User-Visible Selection)
// ============================================================================

export const DEVOTIONAL_TARGETS: DevotionalTarget[] = [
  {
    id: 'preschool',
    label: 'Preschool',
    description: 'Parent reads aloud to child (ages 3-5)',
    vocabularyLevel: 'simple',
    displayOrder: 1,
    isDefault: false,
    ageGroupMapping: ['preschool']
  },
  {
    id: 'children',
    label: 'Children',
    description: 'Child reads independently or with parent (ages 6-10)',
    vocabularyLevel: 'simple',
    displayOrder: 2,
    isDefault: false,
    ageGroupMapping: ['elementary']
  },
  {
    id: 'youth',
    label: 'Youth',
    description: 'Teen personal devotion (ages 11-18)',
    vocabularyLevel: 'moderate',
    displayOrder: 3,
    isDefault: false,
    ageGroupMapping: ['preteen', 'highschool']
  },
  {
    id: 'adult',
    label: 'Adult',
    description: 'Standard devotional reading (ages 19+)',
    vocabularyLevel: 'advanced',
    displayOrder: 4,
    isDefault: true,
    ageGroupMapping: ['college', 'youngadult', 'midlife', 'experienced', 'activesenior', 'senior']
  }
];

// ============================================================================
// DEVOTIONAL LENGTHS (User-Visible Selection)
// ============================================================================

export const DEVOTIONAL_LENGTHS: DevotionalLength[] = [
  {
    id: 'short',
    label: '3 minutes',
    minutes: 3,
    wordCountMin: 400,
    wordCountMax: 500,
    displayOrder: 1,
    isDefault: false,
    description: 'Quick devotion, social media, daily text'
  },
  {
    id: 'medium',
    label: '5 minutes',
    minutes: 5,
    wordCountMin: 700,
    wordCountMax: 900,
    displayOrder: 2,
    isDefault: true,
    description: 'Standard devotional, email newsletter'
  },
  {
    id: 'long',
    label: '10 minutes',
    minutes: 10,
    wordCountMin: 1200,
    wordCountMax: 1500,
    displayOrder: 3,
    isDefault: false,
    description: 'Deeper reflection, small group supplement'
  }
];

// ============================================================================
// DEVOTIONAL STRUCTURE (5 Sections)
// ============================================================================

export const DEVOTIONAL_SECTIONS: DevotionalSection[] = [
  {
    id: 'contemporary-connection',
    name: 'Contemporary Connection',
    displayOrder: 1,
    purpose: 'Hook the reader with a relatable modern scenario or question',
    wordBudgetPercent: 15
  },
  {
    id: 'scripture-in-context',
    name: 'Scripture in Context',
    displayOrder: 2,
    purpose: 'Explain what the passage meant to its original audience',
    wordBudgetPercent: 25
  },
  {
    id: 'theological-insights',
    name: 'Theological Insights',
    displayOrder: 3,
    purpose: 'Draw out timeless truths from multiple angles',
    wordBudgetPercent: 30
  },
  {
    id: 'reflection-questions',
    name: 'Reflection Questions',
    displayOrder: 4,
    purpose: 'Personal application prompts for self-examination',
    wordBudgetPercent: 15
  },
  {
    id: 'prayer-prompt',
    name: 'Prayer Prompt',
    displayOrder: 5,
    purpose: 'Guide the reader into responsive prayer',
    wordBudgetPercent: 15
  }
];

// ============================================================================
// DEVOTIONAL GUARDRAILS (Hidden - Backend Only)
// ============================================================================

export const DEVOTIONAL_GUARDRAILS: DevotionalGuardrails = {
  voiceRequirements: [
    'Use second-person direct address ("you", "your")',
    'Speak to the reader\'s heart, not a classroom',
    'Never use third-person instructional voice',
    'Never include teacher transcripts or classroom language',
    'Never reference "students", "class", or "group discussion"',
    'Write as if speaking directly to one person before God'
  ],
  contentProhibitions: [
    'Classroom activity instructions',
    'Teacher preparation notes',
    'Group discussion facilitation',
    'Handout or worksheet references',
    'Lesson plan structure',
    'Assessment or evaluation language'
  ],
  moralValenceRules: [
    'Identify the passage\'s moral direction before generating content',
    'Virtue passages require encouragement and aspiration themes',
    'Cautionary passages require warning and repentance themes',
    'Never invert moral valence (do not condemn virtue or celebrate vice)',
    'Match Scripture references to the passage\'s moral direction',
    'Judgment texts (Isaiah 14, Revelation condemnations) only for cautionary passages'
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a devotional target by ID
 */
export function getDevotionalTarget(id: string): DevotionalTarget | undefined {
  return DEVOTIONAL_TARGETS.find(target => target.id === id);
}

/**
 * Get the default devotional target (Adult)
 */
export function getDefaultDevotionalTarget(): DevotionalTarget {
  return DEVOTIONAL_TARGETS.find(target => target.isDefault) || DEVOTIONAL_TARGETS[3];
}

/**
 * Get targets sorted by display order
 */
export function getDevotionalTargetsSorted(): DevotionalTarget[] {
  return [...DEVOTIONAL_TARGETS].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get a devotional length by ID
 */
export function getDevotionalLength(id: string): DevotionalLength | undefined {
  return DEVOTIONAL_LENGTHS.find(length => length.id === id);
}

/**
 * Get the default devotional length (5 minutes)
 */
export function getDefaultDevotionalLength(): DevotionalLength {
  return DEVOTIONAL_LENGTHS.find(length => length.isDefault) || DEVOTIONAL_LENGTHS[1];
}

/**
 * Get lengths sorted by display order
 */
export function getDevotionalLengthsSorted(): DevotionalLength[] {
  return [...DEVOTIONAL_LENGTHS].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get user-facing target options for dropdowns
 */
export function getDevotionalTargetOptions(): Array<{
  id: string;
  label: string;
  description: string;
  isDefault: boolean;
}> {
  return getDevotionalTargetsSorted().map(target => ({
    id: target.id,
    label: target.label,
    description: target.description,
    isDefault: target.isDefault
  }));
}

/**
 * Get user-facing length options for dropdowns
 */
export function getDevotionalLengthOptions(): Array<{
  id: string;
  label: string;
  description: string;
  isDefault: boolean;
}> {
  return getDevotionalLengthsSorted().map(length => ({
    id: length.id,
    label: length.label,
    description: length.description,
    isDefault: length.isDefault
  }));
}

/**
 * Map lesson age group to devotional target
 * Used when inheriting from lesson - finds appropriate target for vocabulary
 */
export function mapAgeGroupToTarget(ageGroupId: string): DevotionalTarget {
  for (const target of DEVOTIONAL_TARGETS) {
    if (target.ageGroupMapping.includes(ageGroupId)) {
      return target;
    }
  }
  // Default to adult if no mapping found
  return getDefaultDevotionalTarget();
}

/**
 * Calculate word budget for each section based on total word count
 */
export function calculateSectionWordBudgets(totalWords: number): Record<string, { min: number; max: number }> {
  const budgets: Record<string, { min: number; max: number }> = {};
  
  for (const section of DEVOTIONAL_SECTIONS) {
    const baseWords = Math.round(totalWords * (section.wordBudgetPercent / 100));
    budgets[section.id] = {
      min: Math.round(baseWords * 0.85),
      max: Math.round(baseWords * 1.15)
    };
  }
  
  return budgets;
}

// ============================================================================
// GUARDRAILS GENERATOR (For AI Prompt Injection)
// ============================================================================

/**
 * Generate the devotional voice guardrails block for AI prompt injection
 * This ensures devotional output maintains personal, second-person voice
 */
export function generateDevotionalVoiceGuardrails(): string {
  return `
## DEVOTIONAL VOICE GUARDRAILS - MANDATORY COMPLIANCE

### VOICE REQUIREMENTS
${DEVOTIONAL_GUARDRAILS.voiceRequirements.map(req => `- ${req}`).join('\n')}

### CONTENT PROHIBITIONS
The generated devotional MUST NOT contain:
${DEVOTIONAL_GUARDRAILS.contentProhibitions.map(prohibition => `- ${prohibition}`).join('\n')}

### DISTINCTION FROM LESSONS
A DEVOTIONAL is NOT a lesson. Key differences:
| Devotional | Lesson |
|------------|--------|
| Second-person ("you") | Third-person instructional |
| Personal quiet time | Classroom setting |
| Reader before God | Teacher with students |
| 5-15 minutes reading | 30-90 minutes instruction |
| Prayer response | Activity and assessment |

### VERIFICATION CHECKLIST
Before outputting, verify:
- [ ] All content uses "you/your" direct address
- [ ] No classroom or teaching language present
- [ ] No activity instructions or group references
- [ ] Content flows toward prayer response
- [ ] Tone is warm, personal, and devotional
`;
}

/**
 * Generate the moral valence guardrails block for AI prompt injection
 * This prevents the inversion problem seen in parable generation
 */
export function generateMoralValenceGuardrails(): string {
  return `
## MORAL VALENCE GUARDRAILS - CRITICAL

### PRE-GENERATION ANALYSIS (Do this FIRST)
Before generating ANY content, analyze the Scripture passage:

1. **Identify Moral Direction:**
   - VIRTUE: Passage celebrates righteousness, faith, love, obedience, etc.
   - CAUTIONARY: Passage warns against sin, pride, unbelief, disobedience, etc.
   - COMPLEX: Passage contains both elements in tension

2. **Lock Valence:**
   Once identified, the devotional MUST maintain this valence throughout.

### VALENCE RULES
${DEVOTIONAL_GUARDRAILS.moralValenceRules.map(rule => `- ${rule}`).join('\n')}

### EXAMPLES OF CORRECT VALENCE MATCHING

**VIRTUE PASSAGE (John 3:16 - God's love):**
- Contemporary Connection: Story of sacrificial love
- Theological Insight: The depth of God's giving nature
- Prayer Prompt: Gratitude and worship
- WRONG: Condemning the reader for not loving enough

**CAUTIONARY PASSAGE (Proverbs 16:18 - Pride before fall):**
- Contemporary Connection: Example of humbled arrogance
- Theological Insight: Why God opposes the proud
- Prayer Prompt: Confession and humility
- WRONG: Celebrating self-confidence

### SCRIPTURE MATCHING RULES
- Judgment texts (Isaiah 14, Ezekiel 28, Revelation warnings) = Cautionary passages ONLY
- Grace texts (Romans 8, Ephesians 2, Psalm 23) = Virtue/encouragement passages
- NEVER pair judgment Scripture with virtue stories
- NEVER pair grace Scripture with condemnation themes

### VERIFICATION
Before outputting, verify:
- [ ] Passage moral direction identified
- [ ] All content maintains consistent valence
- [ ] Supporting Scripture matches primary passage valence
- [ ] No inversion of moral direction occurred
`;
}

/**
 * Generate the target-specific vocabulary guardrails
 */
export function generateTargetGuardrails(targetId: string): string {
  const target = getDevotionalTarget(targetId) || getDefaultDevotionalTarget();
  
  const vocabularyGuidance: Record<string, string> = {
    simple: `
### VOCABULARY LEVEL: SIMPLE (${target.label})
- Use short sentences (8-12 words average)
- One idea per sentence
- Concrete, tangible words over abstract concepts
- Avoid theological jargon entirely
- Use everyday words a young child would understand
- Repetition aids comprehension
- Questions should be yes/no or simple choice`,
    
    moderate: `
### VOCABULARY LEVEL: MODERATE (${target.label})
- Use clear, direct sentences (12-18 words average)
- Introduce theological terms with brief explanations
- Balance concrete examples with emerging abstraction
- Acknowledge real-world complexity without overwhelming
- Questions can require reflection but not advanced reasoning`,
    
    advanced: `
### VOCABULARY LEVEL: ADVANCED (${target.label})
- Full vocabulary range appropriate
- Theological terms used with precision
- Abstract concepts explored in depth
- Nuanced application to complex life situations
- Questions can probe deep self-examination`
  };
  
  return `
## TARGET AUDIENCE GUARDRAILS

**Selected Target:** ${target.label}
**Description:** ${target.description}
${vocabularyGuidance[target.vocabularyLevel]}
`;
}

/**
 * Generate the length-specific structure guardrails
 */
export function generateLengthGuardrails(lengthId: string): string {
  const length = getDevotionalLength(lengthId) || getDefaultDevotionalLength();
  const budgets = calculateSectionWordBudgets((length.wordCountMin + length.wordCountMax) / 2);
  
  return `
## LENGTH GUARDRAILS

**Selected Length:** ${length.label} (${length.minutes} minute read)
**Word Count Target:** ${length.wordCountMin}-${length.wordCountMax} words

### SECTION WORD BUDGETS

| Section | Words |
|---------|-------|
${DEVOTIONAL_SECTIONS.map(section => 
  `| ${section.name} | ${budgets[section.id].min}-${budgets[section.id].max} |`
).join('\n')}

### PACING GUIDANCE
${length.id === 'short' ? 
  '- Be concise and focused\n- One key insight only\n- 2-3 reflection questions maximum\n- Brief prayer prompt' :
  length.id === 'medium' ?
  '- Standard devotional depth\n- 2-3 theological insights\n- 3-4 reflection questions\n- Developed prayer prompt' :
  '- Allow for deeper exploration\n- Multiple theological angles\n- 4-5 reflection questions with follow-ups\n- Extended prayer with multiple prompts'
}
`;
}

/**
 * Generate complete devotional guardrails for AI prompt
 * Combines all guardrail generators into single injection block
 */
export function generateCompleteDevotionalGuardrails(
  targetId: string,
  lengthId: string,
  theologyGuardrails: string,
  copyrightGuardrails: string
): string {
  return `
# DEVOTIONALSPARK GENERATION GUARDRAILS

${generateDevotionalVoiceGuardrails()}

${generateMoralValenceGuardrails()}

${generateTargetGuardrails(targetId)}

${generateLengthGuardrails(lengthId)}

${theologyGuardrails}

${copyrightGuardrails}

---
## FINAL OUTPUT STRUCTURE

Generate the devotional with these exact section headers:

1. **Contemporary Connection**
2. **Scripture in Context**
3. **Theological Insights**
4. **Reflection Questions**
5. **Prayer Prompt**

Each section should respect the word budgets specified above.
Do NOT include word counts in the output.
`;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DevotionalTargetId = typeof DEVOTIONAL_TARGETS[number]['id'];
export type DevotionalLengthId = typeof DEVOTIONAL_LENGTHS[number]['id'];
export type VocabularyLevel = 'simple' | 'moderate' | 'advanced';

// ============================================================================
// VERSION
// ============================================================================

export const DEVOTIONAL_CONFIG_VERSION = '1.0.0';
