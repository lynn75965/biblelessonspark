/**
 * Teacher Toolbelt Configuration
 * ===============================
 * 
 * SSOT for all Toolbelt functionality.
 * 
 * Location: src/constants/toolbeltConfig.ts
 * Backend mirror: supabase/functions/_shared/toolbeltConfig.ts
 * 
 * This file defines:
 * - Tool definitions (IDs, names, routes, descriptions)
 * - Form input configurations
 * - Voice guardrails (for Claude prompts)
 * - Theological guardrails
 * - Operational thresholds
 * - Email sequence structure
 * - Admin display configuration
 */

// ============================================================================
// TOOL IDENTIFIERS
// ============================================================================

export const TOOLBELT_TOOL_IDS = {
  LESSON_FIT: 'lesson-fit',
  LEFT_OUT: 'left-out',
  ONE_TRUTH: 'one-truth',
} as const;

export type ToolbeltToolId = typeof TOOLBELT_TOOL_IDS[keyof typeof TOOLBELT_TOOL_IDS];

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export interface ToolbeltToolDefinition {
  id: ToolbeltToolId;
  name: string;
  shortName: string;
  description: string;
  route: string;
  emailSubject: string;
  estimatedMinutes: number;
  headline: string;
}

export const TOOLBELT_TOOLS: Record<ToolbeltToolId, ToolbeltToolDefinition> = {
  'lesson-fit': {
    id: 'lesson-fit',
    name: 'Does This Lesson Fit My Class?',
    shortName: 'Lesson Fit',
    description: 'Helps name why a lesson feels mismatched before you start rewriting it.',
    route: '/toolbelt/lesson-fit',
    emailSubject: 'Your reflection from Does This Lesson Fit My Class?',
    estimatedMinutes: 2,
    headline: "Here's what your instincts are picking up",
  },
  'left-out': {
    id: 'left-out',
    name: 'What Can Be Left Out Safely?',
    shortName: 'Left Out Safely',
    description: 'Helps identify what is essential in a lesson and what can be set aside without guilt.',
    route: '/toolbelt/left-out-safely',
    emailSubject: 'Your reflection from What Can Be Left Out Safely?',
    estimatedMinutes: 3,
    headline: "Here's what your discernment is telling you",
  },
  'one-truth': {
    id: 'one-truth',
    name: 'One-Truth Focus Finder',
    shortName: 'Focus Finder',
    description: 'Helps clarify the central truth your lesson is meant to anchor.',
    route: '/toolbelt/one-truth',
    emailSubject: 'Your reflection from One-Truth Focus Finder',
    estimatedMinutes: 2,
    headline: "Here's the anchor your lesson is pointing toward",
  },
} as const;

// ============================================================================
// FORM INPUT OPTIONS
// ============================================================================

// Tool 1: Does This Lesson Fit My Class?
export const LESSON_FIT_OPTIONS = {
  bibleFamiliarity: [
    { value: 'new', label: 'New to Bible' },
    { value: 'some', label: 'Some familiarity' },
    { value: 'well-versed', label: 'Well-versed' },
  ],
  engagementLevel: [
    { value: 'high', label: 'High energy' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'mixed', label: 'Mixed' },
  ],
  timeAvailable: [
    { value: '20', label: '20 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60+ minutes' },
  ],
  teachingEnvironment: [
    { value: 'classroom', label: 'Classroom' },
    { value: 'living-room', label: 'Living room' },
    { value: 'large-group', label: 'Large group' },
    { value: 'outdoor', label: 'Outdoor' },
  ],
  concernsAboutLesson: [
    { value: 'too-much-content', label: 'Too much content' },
    { value: 'assumes-too-much', label: 'Assumes too much knowledge' },
    { value: 'wrong-tone', label: 'Wrong tone for my class' },
    { value: 'illustrations-wont-land', label: "Illustrations won't land" },
    { value: 'pace-doesnt-fit', label: "Pace doesn't fit" },
  ],
} as const;

// Tool 2: What Can Be Left Out Safely?
export const LEFT_OUT_OPTIONS = {
  feelsHeavy: [
    { value: 'background', label: 'Background information' },
    { value: 'cross-references', label: 'Cross-references' },
    { value: 'application-points', label: 'Application points' },
    { value: 'discussion-questions', label: 'Discussion questions' },
    { value: 'activities', label: 'Activities' },
  ],
  whenLessonsFull: [
    { value: 'rush', label: 'I rush through everything' },
    { value: 'skip-randomly', label: 'I skip things randomly' },
    { value: 'feel-guilty', label: 'I feel guilty about cutting' },
    { value: 'learners-disengage', label: 'Learners disengage' },
  ],
} as const;

// Tool 3: One-Truth Focus Finder
export const ONE_TRUTH_OPTIONS = {
  lessonFeels: [
    { value: 'scattered', label: 'Scattered' },
    { value: 'unclear', label: 'Unclear' },
    { value: 'too-broad', label: 'Too broad' },
    { value: 'almost-there', label: 'Almost there' },
  ],
} as const;

// ============================================================================
// FORM INPUT DEFINITIONS
// ============================================================================

export interface FormInputDefinition {
  id: string;
  type: 'select' | 'multiselect' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: readonly { value: string; label: string }[];
  maxLength?: number;
}

export const LESSON_FIT_INPUTS: FormInputDefinition[] = [
  {
    id: 'bibleFamiliarity',
    type: 'select',
    label: "Class familiarity with Bible",
    required: true,
    options: LESSON_FIT_OPTIONS.bibleFamiliarity,
  },
  {
    id: 'engagementLevel',
    type: 'select',
    label: 'Typical engagement level',
    required: true,
    options: LESSON_FIT_OPTIONS.engagementLevel,
  },
  {
    id: 'timeAvailable',
    type: 'select',
    label: 'Time available',
    required: true,
    options: LESSON_FIT_OPTIONS.timeAvailable,
  },
  {
    id: 'teachingEnvironment',
    type: 'select',
    label: 'Teaching environment',
    required: true,
    options: LESSON_FIT_OPTIONS.teachingEnvironment,
  },
  {
    id: 'concernsAboutLesson',
    type: 'multiselect',
    label: 'What concerns you about this lesson?',
    required: true,
    options: LESSON_FIT_OPTIONS.concernsAboutLesson,
  },
  {
    id: 'primaryWorry',
    type: 'textarea',
    label: 'What is your primary worry about teaching this lesson?',
    placeholder: 'Describe what feels off or heavy about this lesson...',
    required: true,
    maxLength: 500,
  },
];

export const LEFT_OUT_INPUTS: FormInputDefinition[] = [
  {
    id: 'mustBeUnderstood',
    type: 'textarea',
    label: 'What must be understood today?',
    placeholder: 'The one thing your class needs to walk away knowing...',
    required: true,
    maxLength: 500,
  },
  {
    id: 'hopeStaysNextWeek',
    type: 'textarea',
    label: 'What do you hope stays with them next week?',
    placeholder: 'The truth or idea you want them to remember...',
    required: true,
    maxLength: 500,
  },
  {
    id: 'feelsHeavy',
    type: 'multiselect',
    label: 'What feels heavy in this lesson?',
    required: true,
    options: LEFT_OUT_OPTIONS.feelsHeavy,
  },
  {
    id: 'whenLessonsFull',
    type: 'select',
    label: 'When lessons feel too full, what usually happens?',
    required: true,
    options: LEFT_OUT_OPTIONS.whenLessonsFull,
  },
  {
    id: 'concernsAboutSimplifying',
    type: 'textarea',
    label: 'What concerns you about simplifying?',
    placeholder: 'What holds you back from cutting content...',
    required: true,
    maxLength: 500,
  },
];

export const ONE_TRUTH_INPUTS: FormInputDefinition[] = [
  {
    id: 'scriptureScope',
    type: 'textarea',
    label: 'Scripture scope',
    placeholder: 'The passage or passages being taught (e.g., John 3:16-21)...',
    required: true,
    maxLength: 300,
  },
  {
    id: 'seemsMostCentral',
    type: 'textarea',
    label: 'What seems most central?',
    placeholder: 'What stands out to you as the main point...',
    required: true,
    maxLength: 500,
  },
  {
    id: 'wantLearnersToUnderstand',
    type: 'textarea',
    label: 'What do you want learners to understand?',
    placeholder: 'The "aha" you\'re hoping for...',
    required: true,
    maxLength: 500,
  },
  {
    id: 'lessonFeels',
    type: 'select',
    label: 'How does the lesson currently feel?',
    required: true,
    options: ONE_TRUTH_OPTIONS.lessonFeels,
  },
  {
    id: 'closestSummary',
    type: 'textarea',
    label: 'Your closest one-sentence summary',
    placeholder: 'Your best attempt at the anchor statement...',
    required: true,
    maxLength: 300,
  },
];

// ============================================================================
// VOICE GUARDRAILS (Embedded in Claude Prompts)
// ============================================================================

export const TOOLBELT_VOICE_GUARDRAILS = {
  role: `You are a pastoral mirror reflecting the teacher's own discernment back to them.
You are NOT a teacher telling them what to do.
You are NOT a consultant diagnosing their problem.
You are NOT a product pushing anything.
You are NOT an expert correcting their theology.

You ARE a mirror reflecting their own discernment back to them.
You ARE a voice of affirmation for work they're already doing.
You ARE a gentle presence that names patterns without prescribing solutions.`,

  toneRequirements: [
    'Pastoral: warm, gentle, caring',
    'Calm: no urgency, no exclamation points',
    'Dignity-preserving: never imply failure or inadequacy',
    'Non-judgmental: observations, not evaluations',
    'Warm: human, not clinical',
  ],

  prohibitions: [
    'Do NOT give prescriptive advice ("You should..." or "Try doing...")',
    'Do NOT diagnose problems ("Your issue is..." or "The problem is...")',
    'Do NOT mention BibleLessonSpark or any product',
    'Do NOT mention pricing, features, or subscriptions',
    'Do NOT take doctrinal positions on divisive topics',
    'Do NOT use bullet points or numbered lists in your output',
    'Do NOT ask questions in your output',
    'Do NOT imply the teacher is failing or needs to improve',
    'Do NOT use exclamation points',
  ],

  outputStructure: `Your response MUST follow this exact structure:

1. HEADLINE: Start with the tool's headline (provided in the prompt)

2. REFLECTIVE PARAGRAPHS (2-3 paragraphs):
   - Name patterns you observe in their input
   - Validate their feelings and instincts
   - Reflect their discernment back to them
   - Use phrases like "That instinct is worth honoring" or "What you're sensing matters"

3. CLOSING REASSURANCE (1 paragraph):
   - Affirm their attentiveness and care
   - Acknowledge the weight they carry
   - End with warmth and dignity

CRITICAL: Write in flowing prose paragraphs. No bullet points. No numbered lists. No questions.`,

  closingPhrases: [
    'The attentiveness that brought you here is itself a form of faithfulness.',
    'What you are sensing matters. That awareness is not failure—it is discernment.',
    'The care you bring to this work is evident. Trust what you are noticing.',
    'Your instincts are worth honoring. The fact that you paused to reflect says something important.',
    'The weight you carry for your class is real. So is the wisdom forming in that weight.',
  ],
} as const;

// ============================================================================
// THEOLOGICAL GUARDRAILS
// ============================================================================

export const TOOLBELT_THEOLOGICAL_GUARDRAILS = {
  baseline: 'Conservative Baptist baseline safe across all Baptist theology profiles',
  
  topicsToAvoid: [
    'Calvinism vs. Arminianism (election, free will)',
    'Cessationism vs. Continuationism (spiritual gifts)',
    'Specific end-times frameworks (pre-trib, post-trib, etc.)',
    'Mode of baptism disputes',
    'Church governance structures',
    'Political positions',
  ],

  topicsMayAffirm: [
    'The authority and sufficiency of Scripture',
    'The importance of faithful teaching',
    'The value of the teacher\'s discernment',
    'The dignity of the calling to teach',
    'God\'s presence in the teaching moment',
  ],
} as const;

// ============================================================================
// OPERATIONAL THRESHOLDS
// ============================================================================

export const TOOLBELT_THRESHOLDS = {
  /** Monthly API call limit before alerts */
  monthlyCallLimit: 1000,
  
  /** Maximum tokens per Claude API call */
  maxTokensPerCall: 1500,
  
  /** Alert threshold percentages */
  alertThresholds: {
    green: 70,   // 0-70% = green
    yellow: 90,  // 70-90% = yellow
    // 90-100% = red
  },
  
  /** Model to use for reflections */
  claudeModel: 'claude-sonnet-4-20250514',
} as const;

// ============================================================================
// EMAIL SEQUENCE CONFIGURATION
// ============================================================================

export const TOOLBELT_EMAIL_SEQUENCE = {
  /** Days after capture to send each email */
  schedule: [
    { order: 0, day: 0, description: 'Immediate: Reflection email' },
    { order: 1, day: 1, description: 'Day 1: Tool 1 value (lesson fit)' },
    { order: 2, day: 3, description: 'Day 3-4: Tool 2 value (left out)' },
    { order: 3, day: 7, description: 'Day 7: Tool 3 value (one truth)' },
    { order: 4, day: 14, description: 'Day 14: Teaching tip (value)' },
    { order: 5, day: 21, description: 'Day 21: Soft BLS bridge' },
    { order: 6, day: 30, description: 'Day 30: Final gentle invitation' },
  ],
  
  /** Signature for all emails */
  signature: 'Warmly,\nLynn',
  
  /** From address */
  fromEmail: 'noreply@biblelessonspark.com',
  
  /** Reply-to address */
  replyToEmail: 'support@biblelessonspark.com',
} as const;

// ============================================================================
// ADMIN DISPLAY CONFIGURATION
// ============================================================================

export const TOOLBELT_ADMIN_CONFIG = {
  /** Tabs in the Toolbelt Admin page */
  tabs: [
    { id: 'usage', label: 'Usage Report' },
    { id: 'emails', label: 'Email Sequences' },
    { id: 'captures', label: 'Email Captures' },
    { id: 'guardrails', label: 'Guardrails Status' },
  ],
  
  /** Guardrails status display */
  guardrailsDisplay: {
    theologicalBaseline: 'Conservative Baptist',
    voiceMode: 'Reflect, Don\'t Instruct',
    productMentions: 'Prohibited',
    doctrinalPositions: 'Prohibited',
  },
} as const;

// ============================================================================
// LANDING PAGE CONFIGURATION
// ============================================================================

export const TOOLBELT_LANDING_CONFIG = {
  headline: 'A Toolbelt for Faithful Bible Teachers',
  subheadline: 'Practical help for moments when teaching feels heavier than it should.',
  supportText: 'These tools are optional, free, and designed to support your judgment—not replace it.\nUse what helps. Leave the rest.',
  
  introHeading: 'Why This Toolbelt Exists',
  introText: `In the guide, we talked about the unseen work teachers already carry—adapting lessons, guarding faithfulness, and caring for real learners in real settings.

These short tools exist to help in specific moments, without adding to your workload. Each one is designed to address a common tension faithful teachers experience, quietly and respectfully.`,

  theologicalReassurance: 'BibleLessonSpark is built on the conviction that Scripture deserves clarity, teachers deserve support, and learners deserve understanding.\n\nThese tools exist to serve that calling—one small moment at a time.',
  
  softBridge: 'Some teachers eventually want a single workspace where preparation, clarity, and context come together.\n\nBibleLessonSpark exists for that—when and if it\'s helpful.',
} as const;

// ============================================================================
// ROUTES
// ============================================================================

export const TOOLBELT_ROUTES = {
  landing: '/toolbelt',
  lessonFit: '/toolbelt/lesson-fit',
  leftOut: '/toolbelt/left-out-safely',
  oneTruth: '/toolbelt/one-truth',
  admin: '/admin/toolbelt',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get tool definition by ID
 */
export function getToolById(toolId: ToolbeltToolId): ToolbeltToolDefinition {
  return TOOLBELT_TOOLS[toolId];
}

/**
 * Get all tools as an array
 */
export function getAllTools(): ToolbeltToolDefinition[] {
  return Object.values(TOOLBELT_TOOLS);
}

/**
 * Get form inputs for a specific tool
 */
export function getToolInputs(toolId: ToolbeltToolId): FormInputDefinition[] {
  switch (toolId) {
    case 'lesson-fit':
      return LESSON_FIT_INPUTS;
    case 'left-out':
      return LEFT_OUT_INPUTS;
    case 'one-truth':
      return ONE_TRUTH_INPUTS;
    default:
      return [];
  }
}

/**
 * Calculate usage alert color based on percentage
 */
export function getUsageAlertColor(usagePercent: number): 'green' | 'yellow' | 'red' {
  if (usagePercent <= TOOLBELT_THRESHOLDS.alertThresholds.green) {
    return 'green';
  } else if (usagePercent <= TOOLBELT_THRESHOLDS.alertThresholds.yellow) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Get a random closing phrase for reflections
 */
export function getRandomClosingPhrase(): string {
  const phrases = TOOLBELT_VOICE_GUARDRAILS.closingPhrases;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LessonFitFormData = {
  bibleFamiliarity: string;
  engagementLevel: string;
  timeAvailable: string;
  teachingEnvironment: string;
  concernsAboutLesson: string[];
  primaryWorry: string;
};

export type LeftOutFormData = {
  mustBeUnderstood: string;
  hopeStaysNextWeek: string;
  feelsHeavy: string[];
  whenLessonsFull: string;
  concernsAboutSimplifying: string;
};

export type OneTruthFormData = {
  scriptureScope: string;
  seemsMostCentral: string;
  wantLearnersToUnderstand: string;
  lessonFeels: string;
  closestSummary: string;
};
