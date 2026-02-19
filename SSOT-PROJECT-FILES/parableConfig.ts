/**
 * Modern Parable Generator Configuration
 * SSOT for DevotionalSpark / BibleLessonSpark Parable Generator
 * 
 * Based on Jesus' parable teaching patterns:
 * - Hook (ordinary life) → Tension → Escalation → Reversal → Reveal → Response → Anchor
 * 
 * @version 1.0.0
 * @lastUpdated 2025-12-20
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ParableStep {
  id: string;
  name: string;
  order: number;
  description: string;
  promptGuidance: string;
  wordRange: { min: number; max: number };
}

export interface AudienceLens {
  id: string;
  name: string;
  description: string;
  heartCondition: string;
  displayOrder: number;
}

export interface ModernSetting {
  id: string;
  name: string;
  description: string;
  exampleRoles: string[];
  displayOrder: number;
}

export interface HeartCondition {
  id: string;
  name: string;
  description: string;
  scripturalExample: string;
}

export interface NewsExtractionFramework {
  id: string;
  name: string;
  promptQuestion: string;
  order: number;
}

export interface WordCountTarget {
  id: string;
  name: string;
  description: string;
  wordRange: { min: number; max: number };
  isDefault: boolean;
}

export interface ParableTierLimit {
  tierId: string;
  parablesPerMonth: number;
  description: string;
}

// =============================================================================
// THE 7-STEP PARABLE STRUCTURE (Jesus' Teaching Pattern)
// =============================================================================

export const PARABLE_STEPS: readonly ParableStep[] = [
  {
    id: 'hook',
    name: 'Hook',
    order: 1,
    description: 'Ordinary life opening that feels like real life, not a sermon',
    promptGuidance: 'Open with a familiar, concrete setting everyone recognizes. Use "type" characters (a father, a manager, a neighbor), not detailed personalities. Keep it 1-2 sentences. The listener should relax because it feels like real life.',
    wordRange: { min: 20, max: 40 },
  },
  {
    id: 'tension',
    name: 'Tension',
    order: 2,
    description: 'Introduce moral tension fast - something is "off"',
    promptGuidance: 'Introduce an ethical problem quickly in 1-2 sentences. The tension should be moral/ethical, not merely emotional. Examples: unfairness, risk, shame, social threat, spiritual danger. A parable is rarely "cute" - it should be uncomfortable.',
    wordRange: { min: 20, max: 40 },
  },
  {
    id: 'escalation',
    name: 'Escalation',
    order: 3,
    description: '2-4 beats of rising stakes: action → complication → pressure',
    promptGuidance: 'Move in 2-4 short, memorable beats. Beat A: first response (often predictable). Beat B: complication (cost rises). Beat C: pressure moment (decision point). Keep it retellable - short escalation makes it memorable.',
    wordRange: { min: 80, max: 150 },
  },
  {
    id: 'reversal',
    name: 'Reversal',
    order: 4,
    description: 'The Kingdom twist - unexpected hero or exposed heart',
    promptGuidance: 'This is the "punch of the Kingdom." Options: (1) The wrong person is the hero, (2) The expected person fails, (3) Grace upsets fairness, (4) Small becomes massive, (5) The "smart" choice exposes heart-poverty. The reversal should expose what the listener truly loves or trusts.',
    wordRange: { min: 40, max: 80 },
  },
  {
    id: 'reveal',
    name: 'Reveal',
    order: 5,
    description: 'Heart diagnosis - name what was really going on underneath',
    promptGuidance: 'In one paragraph, name the heart condition being exposed: fear, pride, image management, bitterness, control, love of comfort, love of money, desire to be praised. This is the "why" behind the behavior.',
    wordRange: { min: 40, max: 80 },
  },
  {
    id: 'response',
    name: 'Response',
    order: 6,
    description: 'Jesus-style question or call to action',
    promptGuidance: 'End with one of these patterns: (1) A question: "Which one acted as a neighbor?" (2) A warning: "So will it be..." (3) A call to action: "Go and do likewise." (4) A hidden invitation: "He who has ears..." Parables press for response, not merely inform.',
    wordRange: { min: 15, max: 35 },
  },
  {
    id: 'anchor',
    name: 'Scripture Anchor',
    order: 7,
    description: 'Close with the passage\'s "knife edge" - let Scripture do the cutting',
    promptGuidance: 'Quote or paraphrase a key phrase from the Bible passage and let it land. This is the sharp edge that does the final cutting. Do not explain it - let it stand on its own.',
    wordRange: { min: 15, max: 35 },
  },
] as const;

// =============================================================================
// AUDIENCE LENSES (Who needs this parable most?)
// =============================================================================

export const AUDIENCE_LENSES: readonly AudienceLens[] = [
  {
    id: 'anxious-parents',
    name: 'Anxious Parents',
    description: 'Parents worried about their children\'s safety, future, or faith',
    heartCondition: 'fear',
    displayOrder: 1,
  },
  {
    id: 'busy-volunteers',
    name: 'Busy Volunteers',
    description: 'Church workers stretched thin, tempted to resent serving',
    heartCondition: 'bitterness',
    displayOrder: 2,
  },
  {
    id: 'resentful-workers',
    name: 'Resentful Workers',
    description: 'Employees feeling overlooked, underpaid, or unappreciated',
    heartCondition: 'envy',
    displayOrder: 3,
  },
  {
    id: 'success-driven',
    name: 'Success-Driven Professionals',
    description: 'Achievers whose identity is tied to performance and recognition',
    heartCondition: 'pride',
    displayOrder: 4,
  },
  {
    id: 'comfortable-believers',
    name: 'Comfortable Believers',
    description: 'Christians settled into routine faith, avoiding risk or sacrifice',
    heartCondition: 'complacency',
    displayOrder: 5,
  },
  {
    id: 'grudge-holders',
    name: 'Grudge Holders',
    description: 'Those struggling to forgive a specific person or offense',
    heartCondition: 'unforgiveness',
    displayOrder: 6,
  },
  {
    id: 'financially-anxious',
    name: 'Financially Anxious',
    description: 'People gripped by worry about money, provision, or security',
    heartCondition: 'anxiety',
    displayOrder: 7,
  },
  {
    id: 'self-righteous',
    name: 'Self-Righteous Religious',
    description: 'Those confident in their own moral standing before God',
    heartCondition: 'self-righteousness',
    displayOrder: 8,
  },
  {
    id: 'spiritually-exhausted',
    name: 'Spiritually Exhausted',
    description: 'Believers burned out from trying to earn God\'s favor',
    heartCondition: 'works-righteousness',
    displayOrder: 9,
  },
  {
    id: 'isolated-individuals',
    name: 'Isolated Individuals',
    description: 'Those who have pulled away from community and accountability',
    heartCondition: 'isolation',
    displayOrder: 10,
  },
  {
    id: 'general',
    name: 'General Audience',
    description: 'Broad application without specific targeting',
    heartCondition: 'various',
    displayOrder: 99,
  },
] as const;

// =============================================================================
// MODERN SETTINGS (Where does this parable take place?)
// =============================================================================

export const MODERN_SETTINGS: readonly ModernSetting[] = [
  {
    id: 'workplace',
    name: 'Workplace',
    description: 'Office, factory, remote work, or professional environment',
    exampleRoles: ['manager', 'employee', 'coworker', 'CEO', 'intern'],
    displayOrder: 1,
  },
  {
    id: 'neighborhood',
    name: 'Neighborhood',
    description: 'Residential community, HOA, apartment complex',
    exampleRoles: ['neighbor', 'HOA president', 'landlord', 'renter', 'homeowner'],
    displayOrder: 2,
  },
  {
    id: 'school',
    name: 'School',
    description: 'K-12, college campus, or educational setting',
    exampleRoles: ['teacher', 'student', 'principal', 'parent', 'coach'],
    displayOrder: 3,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Hospital, clinic, doctor\'s office, or caregiving',
    exampleRoles: ['doctor', 'nurse', 'patient', 'caregiver', 'family member'],
    displayOrder: 4,
  },
  {
    id: 'local-government',
    name: 'Local Government',
    description: 'City council, courts, civic meetings, public services',
    exampleRoles: ['mayor', 'council member', 'citizen', 'judge', 'public servant'],
    displayOrder: 5,
  },
  {
    id: 'social-media',
    name: 'Social Media / Technology',
    description: 'Online interactions, viral content, digital relationships',
    exampleRoles: ['influencer', 'commenter', 'content creator', 'follower', 'moderator'],
    displayOrder: 6,
  },
  {
    id: 'family',
    name: 'Family & Home',
    description: 'Household dynamics, parenting, extended family',
    exampleRoles: ['parent', 'child', 'spouse', 'sibling', 'grandparent'],
    displayOrder: 7,
  },
  {
    id: 'church',
    name: 'Church Community',
    description: 'Congregational life, small groups, ministry teams',
    exampleRoles: ['pastor', 'deacon', 'volunteer', 'new member', 'longtime member'],
    displayOrder: 8,
  },
  {
    id: 'community-crisis',
    name: 'Community Crisis',
    description: 'Disaster response, community need, local tragedy',
    exampleRoles: ['victim', 'first responder', 'volunteer', 'bystander', 'organizer'],
    displayOrder: 9,
  },
  {
    id: 'financial',
    name: 'Financial / Business',
    description: 'Money decisions, debt, investment, business dealings',
    exampleRoles: ['debtor', 'creditor', 'investor', 'business owner', 'customer'],
    displayOrder: 10,
  },
] as const;

// =============================================================================
// HEART CONDITIONS (What is being exposed/healed?)
// =============================================================================

export const HEART_CONDITIONS: readonly HeartCondition[] = [
  {
    id: 'fear',
    name: 'Fear',
    description: 'Anxiety, worry, lack of trust in God\'s provision or protection',
    scripturalExample: 'Martha worried about many things (Luke 10:41)',
  },
  {
    id: 'pride',
    name: 'Pride',
    description: 'Self-exaltation, need for recognition, comparing oneself to others',
    scripturalExample: 'Pharisee praying about himself (Luke 18:11)',
  },
  {
    id: 'bitterness',
    name: 'Bitterness',
    description: 'Resentment, holding onto past hurts, refusing to let go',
    scripturalExample: 'Elder brother\'s anger (Luke 15:28)',
  },
  {
    id: 'envy',
    name: 'Envy',
    description: 'Jealousy over others\' blessings, feeling cheated by fairness',
    scripturalExample: 'Workers grumbling about equal pay (Matthew 20:11)',
  },
  {
    id: 'greed',
    name: 'Greed',
    description: 'Love of money, hoarding, finding security in possessions',
    scripturalExample: 'Rich fool building bigger barns (Luke 12:18)',
  },
  {
    id: 'self-righteousness',
    name: 'Self-Righteousness',
    description: 'Confidence in one\'s own moral standing, looking down on others',
    scripturalExample: 'Pharisee thanking God he\'s not like others (Luke 18:11)',
  },
  {
    id: 'unforgiveness',
    name: 'Unforgiveness',
    description: 'Refusal to forgive, demanding payment for wrongs done',
    scripturalExample: 'Unforgiving servant (Matthew 18:28)',
  },
  {
    id: 'complacency',
    name: 'Complacency',
    description: 'Spiritual laziness, avoiding risk, comfortable Christianity',
    scripturalExample: 'Servant who buried his talent (Matthew 25:25)',
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    description: 'Worry about tomorrow, lack of contentment, striving',
    scripturalExample: 'Worry about what to eat or wear (Matthew 6:31)',
  },
  {
    id: 'control',
    name: 'Control',
    description: 'Need to manage outcomes, inability to trust God\'s plan',
    scripturalExample: 'Rich young ruler\'s conditions (Mark 10:22)',
  },
  {
    id: 'image-management',
    name: 'Image Management',
    description: 'Performing for others, caring more about appearance than reality',
    scripturalExample: 'Praying on street corners (Matthew 6:5)',
  },
  {
    id: 'works-righteousness',
    name: 'Works-Righteousness',
    description: 'Trying to earn God\'s favor through performance',
    scripturalExample: 'Elder brother\'s "I never disobeyed" (Luke 15:29)',
  },
  {
    id: 'isolation',
    name: 'Isolation',
    description: 'Withdrawing from community, avoiding accountability',
    scripturalExample: 'Lost sheep wandering alone (Luke 15:4)',
  },
] as const;

// =============================================================================
// NEWS EXTRACTION FRAMEWORK (How to convert news to parable "soil")
// =============================================================================

export const NEWS_EXTRACTION_FRAMEWORK: readonly NewsExtractionFramework[] = [
  {
    id: 'need-wound',
    name: 'Need / Wound',
    promptQuestion: 'What human pain or need is present in this situation?',
    order: 1,
  },
  {
    id: 'choice',
    name: 'Choice',
    promptQuestion: 'What decision divides right from wrong in this story?',
    order: 2,
  },
  {
    id: 'cost',
    name: 'Cost',
    promptQuestion: 'What would obedience to God\'s way cost here?',
    order: 3,
  },
  {
    id: 'excuse',
    name: 'Excuse',
    promptQuestion: 'What would be the most believable justification to disobey?',
    order: 4,
  },
  {
    id: 'reversal-candidate',
    name: 'Reversal Candidate',
    promptQuestion: 'Who is the least-expected person or group to do the right thing?',
    order: 5,
  },
  {
    id: 'kingdom-outcome',
    name: 'Kingdom Outcome',
    promptQuestion: 'What does God-honoring action look like in this moment?',
    order: 6,
  },
] as const;

// =============================================================================
// WORD COUNT TARGETS
// =============================================================================

export const WORD_COUNT_TARGETS: readonly WordCountTarget[] = [
  {
    id: 'brief',
    name: 'Brief',
    description: 'Quick illustration for time-limited settings',
    wordRange: { min: 200, max: 300 },
    isDefault: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced length for most teaching contexts',
    wordRange: { min: 300, max: 400 },
    isDefault: true,
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'Rich narrative for extended teaching or devotional use',
    wordRange: { min: 400, max: 500 },
    isDefault: false,
  },
] as const;

// =============================================================================
// TIER LIMITS (Parables per month by subscription tier)
// =============================================================================

export const PARABLE_TIER_LIMITS: readonly ParableTierLimit[] = [
  {
    tierId: 'free',
    parablesPerMonth: 3,
    description: 'Free tier - 3 parables per month',
  },
  {
    tierId: 'basic',
    parablesPerMonth: 10,
    description: 'Basic tier - 10 parables per month',
  },
  {
    tierId: 'standard',
    parablesPerMonth: 30,
    description: 'Standard tier - 30 parables per month',
  },
  {
    tierId: 'premium',
    parablesPerMonth: -1, // unlimited
    description: 'Premium tier - Unlimited parables',
  },
] as const;

// =============================================================================
// GUARDRAILS (Inherited from BibleLessonSpark)
// =============================================================================

export const PARABLE_GUARDRAILS = {
  // Content guardrails
  singlePointOnly: true, // One big idea only - not 12 hidden meanings
  lightSymbolism: true, // Let 80% be natural story detail
  noVillainCartoons: true, // Make the "wrong" choice understandable
  noPartisanLanguage: true, // Confront hearts, not political tribes
  endWithResponse: true, // Press for response, don't resolve neatly
  scriptureDoesTheCutting: true, // Let the closing verse be the sharp edge
  
  // Style guardrails
  avoidAllegory: true, // If you can't summarize in one sentence, it's allegory
  avoidMoralizing: true, // Show, don't tell
  avoidDateSpecifics: true, // News is "soil" not the story itself
  
  // Theological guardrails (inherited from BibleLessonSpark)
  inheritTheologyProfile: true, // Use user's selected theology profile
  inheritBibleVersion: true, // Use user's selected Bible version
  inheritCopyrightGuardrails: true, // Public domain vs paraphrase rules
} as const;

// =============================================================================
// PROMPT TEMPLATE (For Edge Function)
// =============================================================================

export const PARABLE_PROMPT_TEMPLATE = `You are crafting a Modern Parable in the style of Jesus' teaching.

BIBLE PASSAGE: {bible_passage}
FOCUS POINT: {focus_point}
AUDIENCE LENS: {audience_lens}
MODERN SETTING: {modern_setting}
NEWS CONTEXT: {news_summary}

THEOLOGY PROFILE: {theology_profile}
BIBLE VERSION: {bible_version}

Follow this 7-step structure:

1. HOOK (20-40 words): Open with ordinary life. "There was a [role] who [routine]."
2. TENSION (20-40 words): Introduce moral tension fast. Something is "off."
3. ESCALATION (80-150 words): 2-4 beats of rising stakes. Action → Complication → Pressure.
4. REVERSAL (40-80 words): The Kingdom twist. Unexpected hero OR exposed heart.
5. REVEAL (40-80 words): Name the heart condition being exposed.
6. RESPONSE (15-35 words): End with a Jesus-style question or call.
7. SCRIPTURE ANCHOR (15-35 words): Close with the passage's "knife edge."

CRITICAL GUARDRAILS:
- ONE big idea only. If you can't summarize in one sentence, simplify.
- Keep symbolism light. Let 80% be natural story detail.
- Make the "wrong" choice understandable, not cartoonish.
- NO partisan political language. Confront hearts across all tribes.
- DO NOT resolve all emotions neatly. Press for response.
- Let Scripture do the final cutting.

TARGET LENGTH: {word_count_target} words total.

Write the parable now:`;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getParableStepById(id: string): ParableStep | undefined {
  return PARABLE_STEPS.find(step => step.id === id);
}

export function getAudienceLensById(id: string): AudienceLens | undefined {
  return AUDIENCE_LENSES.find(lens => lens.id === id);
}

export function getModernSettingById(id: string): ModernSetting | undefined {
  return MODERN_SETTINGS.find(setting => setting.id === id);
}

export function getHeartConditionById(id: string): HeartCondition | undefined {
  return HEART_CONDITIONS.find(condition => condition.id === id);
}

export function getWordCountTargetById(id: string): WordCountTarget | undefined {
  return WORD_COUNT_TARGETS.find(target => target.id === id);
}

export function getDefaultWordCountTarget(): WordCountTarget {
  return WORD_COUNT_TARGETS.find(target => target.isDefault) || WORD_COUNT_TARGETS[1];
}

export function getParableLimitByTier(tierId: string): number {
  const tier = PARABLE_TIER_LIMITS.find(t => t.tierId === tierId);
  return tier?.parablesPerMonth ?? 3; // Default to free tier
}

export function getAudienceLensesSorted(): readonly AudienceLens[] {
  return [...AUDIENCE_LENSES].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getModernSettingsSorted(): readonly ModernSetting[] {
  return [...MODERN_SETTINGS].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Build the news extraction prompt for Claude to analyze a news article
 */
export function buildNewsExtractionPrompt(newsArticle: string): string {
  const questions = NEWS_EXTRACTION_FRAMEWORK
    .sort((a, b) => a.order - b.order)
    .map(f => `${f.order}. ${f.name}: ${f.promptQuestion}`)
    .join('\n');
  
  return `Analyze this news article as "soil" for a Modern Parable.

NEWS ARTICLE:
${newsArticle}

Extract the following elements:
${questions}

Respond in JSON format:
{
  "needWound": "...",
  "choice": "...",
  "cost": "...",
  "excuse": "...",
  "reversalCandidate": "...",
  "kingdomOutcome": "..."
}`;
}

/**
 * Calculate total word range for a parable
 */
export function calculateParableWordRange(): { min: number; max: number } {
  return PARABLE_STEPS.reduce(
    (acc, step) => ({
      min: acc.min + step.wordRange.min,
      max: acc.max + step.wordRange.max,
    }),
    { min: 0, max: 0 }
  );
}
