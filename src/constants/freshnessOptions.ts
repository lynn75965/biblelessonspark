/**
 * Freshness Options SSOT
 * Single Source of Truth for Perpetual Freshness feature (Phase 15)
 *
 * Architecture: Frontend drives backend
 * This file syncs to: supabase/functions/_shared/freshnessOptions.ts
 *
 * PURPOSE: Ensure every lesson generation produces meaningfully different content,
 * even for the same passage with the same settings.
 *
 * PRINCIPLE: Same structure (Tier 1), fresh content every time (Tier 3)
 * 
 * CRITICAL: User's Step 3 customization choices ALWAYS take priority over
 * freshness suggestions. Freshness only varies elements the user didn't specify.
 *
 * CREATED: December 2025
 * UPDATED: January 2026 - Comprehensive Perpetual Freshness Implementation
 *   - Added teaser freshness elements and selection
 *   - Added series style metadata for Consistent Style Mode
 *   - Made freshness CUSTOMIZATION-AWARE (respects Step 3 choices)
 *   - Added teaser content guardrails (no topic reveal)
 */

// ============================================================================
// OPTION INTERFACES
// ============================================================================

export interface FreshnessModeOption {
  id: string;
  label: string;
  description: string;
  isDefault: boolean;
}

export interface LiturgicalSeason {
  id: string;
  name: string;
  description: string;
  themes: readonly string[];
  typicalDates: string;
  color?: string; // Liturgical color for visual reference
}

export interface FreshnessElement {
  id: string;
  name: string;
  description: string;
  variations: readonly string[];
}

// NOTE: User customization fields are defined in teacherCustomizationOptions.ts (SSOT)
// This file does NOT duplicate those definitions. Instead, selectFreshElements()
// accepts simple boolean flags indicating which elements to skip.

// ============================================================================
// FRESHNESS MODES
// ============================================================================

/**
 * FRESHNESS MODE OPTIONS
 * Default: 'fresh' - Always generate varied content
 * Alternative: 'consistent' - User requests similar style to previous generations
 */
export const FRESHNESS_MODES: FreshnessModeOption[] = [
  {
    id: "fresh",
    label: "Fresh & Varied",
    description: "Generate unique content with varied illustrations, examples, and teaching angles each time",
    isDefault: true
  },
  {
    id: "consistent",
    label: "Consistent Style",
    description: "Maintain similar teaching approach and illustration style across lessons (useful for series)",
    isDefault: false
  }
] as const;

// ============================================================================
// LITURGICAL CALENDAR SEASONS
// Comprehensive Christian calendar awareness for Baptist contexts
// ============================================================================

export const LITURGICAL_SEASONS: LiturgicalSeason[] = [
  {
    id: "advent",
    name: "Advent",
    description: "Season of anticipation and preparation for Christ's coming - both His birth and return",
    themes: ["hope", "preparation", "anticipation", "prophecy fulfilled", "waiting on God", "light in darkness", "Messianic expectation"],
    typicalDates: "Four Sundays before Christmas through Christmas Eve",
    color: "purple"
  },
  {
    id: "christmas",
    name: "Christmas / Christmastide",
    description: "Celebration of the Incarnation - God becoming flesh to dwell among us",
    themes: ["incarnation", "Emmanuel", "joy", "light of the world", "gift of salvation", "humility of Christ", "worship"],
    typicalDates: "December 25 through Epiphany (January 6) - 12 days",
    color: "white"
  },
  {
    id: "epiphany",
    name: "Epiphany",
    description: "Manifestation of Christ to the Gentiles - His light revealed to all nations",
    themes: ["revelation", "mission to all peoples", "light to the nations", "worship from afar", "seeking Christ", "baptism of Jesus", "first miracles"],
    typicalDates: "January 6 through start of Lent",
    color: "green"
  },
  {
    id: "lent",
    name: "Lent",
    description: "Season of penitence, fasting, and preparation for Easter - 40 days reflecting Christ's wilderness",
    themes: ["repentance", "self-examination", "spiritual discipline", "wilderness testing", "sacrifice", "prayer and fasting", "turning from sin"],
    typicalDates: "Ash Wednesday through Holy Saturday (40 weekdays + Sundays)",
    color: "purple"
  },
  {
    id: "holyWeek",
    name: "Holy Week",
    description: "Final week of Lent commemorating Christ's Passion - from triumphal entry to burial",
    themes: ["suffering servant", "sacrificial love", "redemption", "the cross", "obedience unto death", "atonement", "Christ's finished work"],
    typicalDates: "Palm Sunday through Holy Saturday",
    color: "purple"
  },
  {
    id: "easter",
    name: "Easter / Eastertide",
    description: "Celebration of Christ's resurrection and victory over death - the heart of the Gospel",
    themes: ["resurrection", "victory over death", "new life in Christ", "hope", "transformation", "empty tomb", "risen Lord", "Great Commission"],
    typicalDates: "Easter Sunday through Pentecost (50 days)",
    color: "white"
  },
  {
    id: "pentecost",
    name: "Pentecost",
    description: "Coming of the Holy Spirit and birth of the Church",
    themes: ["Holy Spirit", "power for witness", "birth of the Church", "spiritual gifts", "unity in diversity", "bold proclamation", "missions"],
    typicalDates: "50 days after Easter (single day, then Ordinary Time begins)",
    color: "red"
  },
  {
    id: "ordinaryTime",
    name: "Ordinary Time",
    description: "Seasons of growth, discipleship, and kingdom living between major celebrations",
    themes: ["discipleship", "spiritual growth", "kingdom living", "faithful service", "stewardship", "community", "sanctification"],
    typicalDates: "Periods between Epiphany and Lent; Pentecost through Advent",
    color: "green"
  },
  {
    id: "kingdomtide",
    name: "Kingdomtide",
    description: "Focus on Christ's reign and kingdom work - observed in some Baptist traditions",
    themes: ["kingdom of God", "reign of Christ", "justice and mercy", "mission and evangelism", "stewardship", "Christ the King", "eschatological hope"],
    typicalDates: "Late summer through Christ the King Sunday (last Sunday before Advent)",
    color: "green"
  }
] as const;

// ============================================================================
// SECULAR/CULTURAL SEASONS (For contextual awareness)
// ============================================================================

export const CULTURAL_SEASONS = [
  {
    id: "newYear",
    name: "New Year",
    themes: ["new beginnings", "fresh start", "resolutions", "God's faithfulness", "looking forward"],
    typicalDates: "Late December through early January"
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    themes: ["love", "relationships", "God's love", "loving others", "marriage"],
    typicalDates: "Early-mid February"
  },
  {
    id: "mothersDay",
    name: "Mother's Day",
    themes: ["motherhood", "family", "honor", "nurturing", "Proverbs 31"],
    typicalDates: "Second Sunday in May"
  },
  {
    id: "fathersDay",
    name: "Father's Day",
    themes: ["fatherhood", "family leadership", "spiritual fathers", "God as Father"],
    typicalDates: "Third Sunday in June"
  },
  {
    id: "independence",
    name: "Independence Day (US)",
    themes: ["freedom", "gratitude", "nation", "responsibility", "spiritual freedom"],
    typicalDates: "July 4th weekend"
  },
  {
    id: "laborDay",
    name: "Labor Day",
    themes: ["work", "rest", "vocation", "serving others", "dignity of labor"],
    typicalDates: "First Monday in September"
  },
  {
    id: "backToSchool",
    name: "Back to School",
    themes: ["learning", "growth", "wisdom", "new seasons", "preparation"],
    typicalDates: "August-September"
  },
  {
    id: "thanksgiving",
    name: "Thanksgiving",
    themes: ["gratitude", "provision", "contentment", "generosity", "praise"],
    typicalDates: "Fourth Thursday in November"
  }
] as const;

// ============================================================================
// LESSON FRESHNESS ELEMENTS
// Categories where Claude should vary its approach for perpetual freshness
// ============================================================================

export const FRESHNESS_ELEMENTS: FreshnessElement[] = [
  {
    id: "illustrations",
    name: "Illustrations & Stories",
    description: "Varied examples to illuminate the same theological truth",
    variations: [
      "personal life application story",
      "historical example from church history",
      "contemporary real-world scenario",
      "nature/creation parallel",
      "cross-reference to another Bible narrative",
      "missionary or ministry story",
      "testimonial approach",
      "hypothetical situation",
      "cultural observation"
    ]
  },
  {
    id: "teachingAngles",
    name: "Teaching Angles",
    description: "Different pedagogical approaches to the same passage",
    variations: [
      "evangelistic emphasis (gospel presentation)",
      "discipleship focus (spiritual growth)",
      "apologetic approach (defending faith)",
      "narrative/story-driven exposition",
      "doctrinal/theological exposition",
      "practical life application",
      "devotional/worship focus",
      "missional/outreach emphasis",
      "character study approach"
    ]
  },
  {
    id: "openingHooks",
    name: "Opening Hooks",
    description: "Varied ways to capture attention at lesson start",
    variations: [
      "thought-provoking question",
      "engaging story or anecdote",
      "surprising fact or statistic",
      "relevant quotation",
      "current event connection",
      "personal reflection prompt",
      "object lesson preview",
      "problem/tension statement",
      "imagine/picture this scenario"
    ]
  },
  {
    id: "activityFormats",
    name: "Activity Formats",
    description: "Different activity types for the same learning objective",
    variations: [
      "small group discussion",
      "individual written reflection",
      "role play or dramatization",
      "creative expression (art, poetry)",
      "Scripture memory exercise",
      "prayer practice",
      "service project planning",
      "case study analysis",
      "paired sharing",
      "whole-group interactive"
    ]
  },
  {
    id: "applicationContexts",
    name: "Application Contexts",
    description: "Different life settings for applying biblical truth",
    variations: [
      "family/home relationships",
      "workplace scenarios",
      "church community life",
      "personal devotional life",
      "community outreach",
      "friendships and peer relationships",
      "finances and stewardship",
      "digital/online life",
      "school/academic setting",
      "civic/community engagement"
    ]
  },
  {
    id: "closingChallenges",
    name: "Closing Challenges",
    description: "Different ways to send students out with action",
    variations: [
      "specific weekly challenge",
      "prayer commitment",
      "accountability partner task",
      "journaling prompt",
      "practical action step",
      "conversation to have",
      "habit to develop",
      "thing to give up or start",
      "person to serve or bless"
    ]
  }
] as const;

// ============================================================================
// TEASER FRESHNESS ELEMENTS
// Ensure Student Teasers vary in style while maintaining felt-need focus
// CRITICAL: Teasers must NOT reveal lesson content
// ============================================================================

export const TEASER_FRESHNESS_ELEMENTS: FreshnessElement[] = [
  {
    id: "teaserOpeningStyle",
    name: "Teaser Opening Style",
    description: "Different ways to hook attention - MUST NOT reveal lesson topic",
    variations: [
      "rhetorical question about universal experience",
      "bold statement that creates tension",
      "relatable everyday scenario",
      "provocative challenge to assumptions",
      "empathetic observation about shared struggles",
      "curiosity gap that demands resolution",
      "direct personal address with emotional hook",
      "contrast statement (what people think vs reality)",
      "sensory/emotional moment description"
    ]
  },
  {
    id: "teaserEmotionalAngle",
    name: "Teaser Emotional Angle",
    description: "The felt need or emotion the teaser taps into",
    variations: [
      "longing for purpose or meaning",
      "fear of missing something important",
      "desire for belonging or connection",
      "tension between what is and what should be",
      "curiosity about unanswered questions",
      "frustration with inadequate answers",
      "hope for something better",
      "restlessness or holy discontent",
      "weight of unresolved guilt or shame",
      "desire for clarity in confusion"
    ]
  },
  {
    id: "teaserSignoffStyle",
    name: "Teaser Signoff Style",
    description: "Different ways to close with compelling invitation",
    variations: [
      "warm invitation (let's explore this together)",
      "mystery continuation (you might be surprised)",
      "promise of clarity (I think you'll find some answers)",
      "connection emphasis (bring your questions)",
      "anticipation builder (this conversation is worth having)",
      "gentle challenge (you might see things differently)",
      "solidarity statement (you're not alone in wondering)"
    ]
  }
] as const;

// ============================================================================
// TEASER CONTENT GUARDRAILS (SSOT)
// Prevent content bleeding - teasers must NOT reveal lesson content
// ============================================================================

/**
 * TEASER CONTENT GUARDRAILS
 * 
 * These guardrails prevent the AI from "leaking" lesson content into teasers
 * through subtle hints, historical references, or specificity markers.
 * 
 * PRINCIPLE: A well-crafted teaser should be so generic that it could apply
 * to dozens of different lessons. The reader should NOT be able to guess
 * what the lesson is about.
 */
export const TEASER_CONTENT_GUARDRAILS = {
  /**
   * PROHIBITED TIMEFRAME REFERENCES
   * These hint at specific historical periods in biblical narrative
   */
  prohibitedTimeframes: [
    "two thousand years",
    "thousands of years",
    "centuries ago",
    "ancient times",
    "in the beginning",
    "since creation",
    "from the start",
    "throughout history",
    "for millennia",
    "since time began",
    "long ago",
    "in biblical times",
    "in Jesus' day",
    "first century"
  ],

  /**
   * PROHIBITED IMPACT/SIGNIFICANCE STATEMENTS
   * These telegraph that the lesson covers something "important"
   */
  prohibitedImpactStatements: [
    "changed the world",
    "transformed history",
    "changed everything",
    "most important",
    "greatest question",
    "ultimate answer",
    "life-changing",
    "world-changing",
    "history-making",
    "pivotal moment",
    "turning point",
    "fundamental truth",
    "core of everything",
    "everything depends on",
    "the key to",
    "the secret to"
  ],

  /**
   * PROHIBITED SPECIFICITY MARKERS
   * These implicitly reveal the passage type or topic
   */
  prohibitedSpecificityMarkers: [
    "conversation",
    "meal",
    "table",
    "bread",
    "wine",
    "cup",
    "water",
    "garden",
    "cross",
    "tomb",
    "mountain",
    "boat",
    "storm",
    "fish",
    "shepherd",
    "father",
    "son",
    "king",
    "kingdom",
    "temple",
    "sacrifice"
  ],

  /**
   * PROHIBITED THEOLOGICAL HINTS
   * These reveal doctrinal content even without naming it
   */
  prohibitedTheologicalHints: [
    "what makes you different",
    "fundamentally different",
    "uniquely human",
    "unlike any other",
    "your true identity",
    "who you really are",
    "why you exist",
    "your purpose",
    "eternal",
    "forever",
    "destiny",
    "saved",
    "redeemed",
    "forgiven",
    "clean",
    "new life",
    "born again",
    "transformed"
  ],

  /**
   * PROHIBITED OPENER FORMULAS
   * Overused patterns that should be avoided
   */
  prohibitedOpenerFormulas: [
    "Ever wonder",
    "Ever feel",
    "Ever notice",
    "Have you ever",
    "Did you ever",
    "Do you ever",
    "What if I told you",
    "Imagine if",
    "Picture this:"
  ],

  /**
   * APPROVED UNIVERSAL FELT-NEED THEMES
   * These are broad enough to apply to ANY lesson
   */
  approvedUniversalThemes: [
    "feeling like something is missing",
    "wanting to belong somewhere",
    "searching for clarity in confusion",
    "wrestling with difficult questions",
    "noticing a gap between how things are and how they should be",
    "feeling restless or unsettled",
    "wondering if there's more to life",
    "struggling to find words for deep feelings",
    "noticing patterns that don't quite add up",
    "experiencing moments that demand explanation",
    "carrying weight that's hard to name",
    "sensing there's a conversation worth having"
  ]
} as const;

/**
 * Generate teaser content guardrails for prompt injection
 * Returns formatted string for Claude's system prompt
 */
export function generateTeaserContentGuardrails(): string {
  const timeframes = TEASER_CONTENT_GUARDRAILS.prohibitedTimeframes
    .map(t => `"${t}"`)
    .join(', ');
  
  const impacts = TEASER_CONTENT_GUARDRAILS.prohibitedImpactStatements
    .map(t => `"${t}"`)
    .join(', ');
  
  const specificity = TEASER_CONTENT_GUARDRAILS.prohibitedSpecificityMarkers
    .map(t => `"${t}"`)
    .join(', ');
  
  const theological = TEASER_CONTENT_GUARDRAILS.prohibitedTheologicalHints
    .map(t => `"${t}"`)
    .join(', ');
  
  const openers = TEASER_CONTENT_GUARDRAILS.prohibitedOpenerFormulas
    .map(t => `"${t}"`)
    .join(', ');
  
  const approved = TEASER_CONTENT_GUARDRAILS.approvedUniversalThemes
    .map(t => `• ${t}`)
    .join('\n');

  return `
🚨 ABSOLUTE CONTENT BLEEDING PREVENTION 🚨

The teaser MUST be so generic that it could apply to DOZENS of different lessons.
A reader should NOT be able to guess what the lesson topic is from the teaser.

PROHIBITED - DO NOT USE ANY OF THESE:

1. TIMEFRAME REFERENCES (reveal historical period):
   ${timeframes}

2. IMPACT/SIGNIFICANCE CLAIMS (telegraph importance):
   ${impacts}

3. SPECIFICITY MARKERS (implicitly reveal passage type):
   ${specificity}

4. THEOLOGICAL HINTS (reveal doctrine without naming it):
   ${theological}

5. OVERUSED OPENER FORMULAS:
   ${openers}

APPROVED UNIVERSAL THEMES (use these patterns instead):
${approved}

SELF-CHECK BEFORE OUTPUTTING TEASER:
Ask yourself: "Could this teaser work for a lesson on Genesis 1, John 3, Romans 8, 
Psalm 23, or the Sermon on the Mount?" If it only fits ONE of those, it's too specific.
The teaser should be INTERCHANGEABLE across many different lessons.
`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the default freshness mode
 */
export function getDefaultFreshnessMode(): FreshnessModeOption {
  return FRESHNESS_MODES.find(m => m.isDefault) || FRESHNESS_MODES[0];
}

/**
 * Get freshness mode by ID
 */
export function getFreshnessMode(id: string): FreshnessModeOption | undefined {
  return FRESHNESS_MODES.find(m => m.id === id);
}

/**
 * Determine the current liturgical season based on a date
 * Note: This is approximate - exact dates vary by year
 */
export function getCurrentLiturgicalSeason(date: Date = new Date()): LiturgicalSeason {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  
  // Simple approximations (production would use proper liturgical calendar calculations)
  // December 25 - January 5: Christmas
  if ((month === 11 && day >= 25) || (month === 0 && day <= 5)) {
    return LITURGICAL_SEASONS.find(s => s.id === "christmas")!;
  }
  
  // January 6 - varies: Epiphany (until ~Feb)
  if (month === 0 && day >= 6) {
    return LITURGICAL_SEASONS.find(s => s.id === "epiphany")!;
  }
  
  // Approximately 4 Sundays before Dec 25: Advent
  if (month === 11 && day < 25) {
    return LITURGICAL_SEASONS.find(s => s.id === "advent")!;
  }
  
  // Late November: Kingdomtide / Christ the King
  if (month === 10 && day >= 20) {
    return LITURGICAL_SEASONS.find(s => s.id === "kingdomtide")!;
  }
  
  // March-April (approximate): Lent/Easter
  // This is highly simplified - real calculation requires Easter date
  if (month === 3) {
    // April - likely Easter season
    if (day <= 7) {
      return LITURGICAL_SEASONS.find(s => s.id === "holyWeek")!;
    }
    return LITURGICAL_SEASONS.find(s => s.id === "easter")!;
  }
  
  if (month === 2 && day >= 15) {
    // Late March - likely Lent
    return LITURGICAL_SEASONS.find(s => s.id === "lent")!;
  }
  
  // May-June: Post-Easter / Pentecost
  if (month === 4 || (month === 5 && day <= 15)) {
    return LITURGICAL_SEASONS.find(s => s.id === "pentecost")!;
  }
  
  // Default: Ordinary Time
  return LITURGICAL_SEASONS.find(s => s.id === "ordinaryTime")!;
}

/**
 * Get relevant cultural season based on date
 */
export function getCurrentCulturalSeason(date: Date = new Date()): typeof CULTURAL_SEASONS[number] | null {
  const month = date.getMonth();
  const day = date.getDate();
  
  // New Year: Dec 28 - Jan 7
  if ((month === 11 && day >= 28) || (month === 0 && day <= 7)) {
    return CULTURAL_SEASONS.find(s => s.id === "newYear")!;
  }
  
  // Valentine's: Feb 7-14
  if (month === 1 && day >= 7 && day <= 14) {
    return CULTURAL_SEASONS.find(s => s.id === "valentines")!;
  }
  
  // Mother's Day: Second Sunday in May (approximate: May 8-14)
  if (month === 4 && day >= 8 && day <= 14) {
    return CULTURAL_SEASONS.find(s => s.id === "mothersDay")!;
  }
  
  // Father's Day: Third Sunday in June (approximate: June 15-21)
  if (month === 5 && day >= 15 && day <= 21) {
    return CULTURAL_SEASONS.find(s => s.id === "fathersDay")!;
  }
  
  // Independence Day: July 1-4
  if (month === 6 && day >= 1 && day <= 4) {
    return CULTURAL_SEASONS.find(s => s.id === "independence")!;
  }
  
  // Labor Day: First Monday in Sept (approximate: Sept 1-7)
  if (month === 8 && day >= 1 && day <= 7) {
    return CULTURAL_SEASONS.find(s => s.id === "laborDay")!;
  }
  
  // Back to School: Aug 1 - Sept 15
  if ((month === 7) || (month === 8 && day <= 15)) {
    return CULTURAL_SEASONS.find(s => s.id === "backToSchool")!;
  }
  
  // Thanksgiving: Nov 20-28
  if (month === 10 && day >= 20 && day <= 28) {
    return CULTURAL_SEASONS.find(s => s.id === "thanksgiving")!;
  }
  
  return null;
}

/**
 * Get a random variation from a freshness element
 */
export function getRandomVariation(elementId: string): string | null {
  const element = FRESHNESS_ELEMENTS.find(e => e.id === elementId);
  if (!element) return null;
  const randomIndex = Math.floor(Math.random() * element.variations.length);
  return element.variations[randomIndex];
}

/**
 * Get all variations for a freshness element
 */
export function getElementVariations(elementId: string): readonly string[] {
  const element = FRESHNESS_ELEMENTS.find(e => e.id === elementId);
  return element?.variations || [];
}

/**
 * Build freshness context string for Claude prompt
 * @param date - Current date for seasonal awareness
 * @param mode - "fresh" for varied content, "consistent" for series continuity
 * @param includeLiturgical - Whether to include Christian calendar themes (opt-in)
 * @param includeCultural - Whether to include cultural season themes (opt-in)
 */
export function buildFreshnessContext(
  date: Date = new Date(), 
  mode: string = "fresh",
  includeLiturgical: boolean = false,
  includeCultural: boolean = false
): string {
  const isFreshMode = mode === "fresh";
  
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Always include current date
  let context = `
CURRENT DATE: ${dateStr}
`;

  // Liturgical context - OPT-IN ONLY
  if (includeLiturgical) {
    const liturgicalSeason = getCurrentLiturgicalSeason(date);
    context += `
LITURGICAL CALENDAR CONTEXT (User Requested):
Season: ${liturgicalSeason.name}
${liturgicalSeason.description}
Seasonal Themes to Weave In: ${liturgicalSeason.themes.join(', ')}
`;
  }

  // Cultural context - OPT-IN ONLY
  if (includeCultural) {
    const culturalSeason = getCurrentCulturalSeason(date);
    if (culturalSeason) {
      context += `
CULTURAL SEASON CONTEXT (User Requested):
Occasion: ${culturalSeason.name}
Relevant Themes to Incorporate: ${culturalSeason.themes.join(', ')}
`;
    }
  }

  // ALWAYS include freshness variation instructions (perpetual freshness)
  if (isFreshMode) {
    context += `
FRESHNESS MODE: ACTIVE
You MUST vary your approach each time by:
- Using different illustrations and stories than previous generations
- Rotating through different teaching angles
- Never repeating the same opening hook for the same passage
- Varying activity formats and application contexts
- Using fresh closing challenges
`;
  }

  return context;
}

// ============================================================================
// PHASE 15.5: FRESHNESS TRACKING HELPERS
// ============================================================================

/**
 * Freshness suggestions structure stored in lesson metadata
 * NOTE: null values indicate the user specified this in Step 3 customization
 */
export interface FreshnessSuggestions {
  openingHook: string | null;
  illustrationType: string | null;
  teachingAngle: string | null;
  activityFormat: string | null;
  applicationContext: string | null;
  closingChallenge: string | null;
  generatedAt: string;
  // Track which elements were skipped due to user customization
  skippedDueToCustomization: string[];
}

/**
 * Teaser freshness suggestions structure
 */
export interface TeaserFreshnessSuggestions {
  openingStyle: string;
  emotionalAngle: string;
  signoffStyle: string;
  generatedAt: string;
}

/**
 * Select fresh elements for a lesson, avoiding recently used ones
 * 
 * SSOT COMPLIANCE: This function uses simple boolean flags instead of
 * a customization interface. The edge function (which owns the integration)
 * determines which flags to set based on teacher's Step 3 choices.
 * This keeps freshnessOptions.ts independent of teacherCustomizationOptions.ts.
 * 
 * @param recentSuggestions - Array of suggestions from user's recent lessons
 * @param maxHistory - How many recent lessons to consider (default 5)
 * @param skipTeachingAngle - True if teacher specified teaching style in Step 3
 * @param skipActivityFormat - True if teacher specified activity types in Step 3
 * @param skipApplicationContext - True if teacher specified class setting/environment in Step 3
 */
export function selectFreshElements(
  recentSuggestions: FreshnessSuggestions[] = [],
  maxHistory: number = 5,
  skipTeachingAngle: boolean = false,
  skipActivityFormat: boolean = false,
  skipApplicationContext: boolean = false
): FreshnessSuggestions {
  const relevantHistory = recentSuggestions.slice(0, maxHistory);
  const skippedElements: string[] = [];
  
  const pickFresh = (elementId: string, historyKey: keyof FreshnessSuggestions): string | null => {
    const element = FRESHNESS_ELEMENTS.find(e => e.id === elementId);
    if (!element) return null;
    
    // Get recently used values for this element
    const recentlyUsed = new Set(
      relevantHistory
        .map(s => s[historyKey])
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
    );
    
    // Filter to available (not recently used) variations
    const available = element.variations.filter(v => !recentlyUsed.has(v));
    
    // If all variations have been used recently, reset and use any
    const pool = available.length > 0 ? available : [...element.variations];
    
    // Random selection from pool
    return pool[Math.floor(Math.random() * pool.length)];
  };
  
  // =========================================================================
  // CUSTOMIZATION-AWARE SELECTION
  // Teacher's Step 3 choices ALWAYS take priority over freshness suggestions
  // =========================================================================
  
  // Teaching Angle: Skip if teacher specified teaching style
  let teachingAngle: string | null = null;
  if (skipTeachingAngle) {
    skippedElements.push('teachingAngles');
    // Teacher's teaching style preference is honored - don't override
  } else {
    teachingAngle = pickFresh('teachingAngles', 'teachingAngle');
  }
  
  // Activity Format: Skip if teacher specified activity types
  let activityFormat: string | null = null;
  if (skipActivityFormat) {
    skippedElements.push('activityFormats');
    // Teacher selected specific activity types - don't override
  } else {
    activityFormat = pickFresh('activityFormats', 'activityFormat');
  }
  
  // Application Context: Skip if teacher specified class setting or learning environment
  let applicationContext: string | null = null;
  if (skipApplicationContext) {
    skippedElements.push('applicationContexts');
    // Teacher's class/environment setting implies application context
  } else {
    applicationContext = pickFresh('applicationContexts', 'applicationContext');
  }
  
  // Opening Hook: Always varied (no Step 3 field controls this)
  const openingHook = pickFresh('openingHooks', 'openingHook');
  
  // Illustration Type: Always varied (no Step 3 field controls this)
  const illustrationType = pickFresh('illustrations', 'illustrationType');
  
  // Closing Challenge: Always varied (no Step 3 field controls this)
  const closingChallenge = pickFresh('closingChallenges', 'closingChallenge');
  
  return {
    openingHook,
    illustrationType,
    teachingAngle,
    activityFormat,
    applicationContext,
    closingChallenge,
    generatedAt: new Date().toISOString(),
    skippedDueToCustomization: skippedElements
  };
}

/**
 * Select fresh teaser elements, avoiding recently used ones
 * @param recentTeaserSuggestions - Array of teaser suggestions from user's recent lessons
 * @param maxHistory - How many recent teasers to consider (default 5)
 */
export function selectFreshTeaserElements(
  recentTeaserSuggestions: TeaserFreshnessSuggestions[] = [],
  maxHistory: number = 5
): TeaserFreshnessSuggestions {
  const relevantHistory = recentTeaserSuggestions.slice(0, maxHistory);
  
  const pickFreshTeaser = (elementId: string, historyKey: keyof TeaserFreshnessSuggestions): string => {
    const element = TEASER_FRESHNESS_ELEMENTS.find(e => e.id === elementId);
    if (!element) return '';
    
    const recentlyUsed = new Set(
      relevantHistory.map(s => s[historyKey]).filter(Boolean)
    );
    
    const available = element.variations.filter(v => !recentlyUsed.has(v));
    const pool = available.length > 0 ? available : [...element.variations];
    
    return pool[Math.floor(Math.random() * pool.length)];
  };
  
  return {
    openingStyle: pickFreshTeaser('teaserOpeningStyle', 'openingStyle'),
    emotionalAngle: pickFreshTeaser('teaserEmotionalAngle', 'emotionalAngle'),
    signoffStyle: pickFreshTeaser('teaserSignoffStyle', 'signoffStyle'),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Build prompt instructions from freshness suggestions
 * This tells Claude EXACTLY what approaches to use for THIS lesson
 * Only includes directives for elements NOT specified by user in Step 3
 */
export function buildFreshnessSuggestionsPrompt(
  suggestions: FreshnessSuggestions,
  mode: string = 'fresh'
): string {
  if (mode !== 'fresh') return '';
  
  // Build directives only for non-null suggestions
  const directives: string[] = [];
  
  if (suggestions.openingHook) {
    directives.push(`• OPENING HOOK: Use a "${suggestions.openingHook}" approach`);
  }
  
  if (suggestions.illustrationType) {
    directives.push(`• ILLUSTRATION STYLE: Feature a "${suggestions.illustrationType}" as your main example`);
  }
  
  if (suggestions.teachingAngle) {
    directives.push(`• TEACHING ANGLE: Emphasize a "${suggestions.teachingAngle}" perspective`);
  }
  
  if (suggestions.activityFormat) {
    directives.push(`• ACTIVITY FORMAT: Include a "${suggestions.activityFormat}" in Section 6`);
  }
  
  if (suggestions.applicationContext) {
    directives.push(`• APPLICATION CONTEXT: Focus applications on "${suggestions.applicationContext}"`);
  }
  
  if (suggestions.closingChallenge) {
    directives.push(`• CLOSING CHALLENGE: End with a "${suggestions.closingChallenge}"`);
  }
  
  if (directives.length === 0) {
    return ''; // All elements were specified by user customization
  }
  
  // Note which elements are honoring user's Step 3 choices
  let customizationNote = '';
  if (suggestions.skippedDueToCustomization.length > 0) {
    customizationNote = `
(Note: The following elements are using the teacher's Step 3 customization choices 
instead of freshness suggestions: ${suggestions.skippedDueToCustomization.join(', ')})
`;
  }
  
  return `
-------------------------------------------------------------------------------
FRESHNESS DIRECTIVES (MANDATORY - Vary Your Approach)
-------------------------------------------------------------------------------

For THIS lesson, use these specific approaches to ensure variety:

${directives.join('\n')}
${customizationNote}
These directives are MANDATORY where specified. Follow them while maintaining 
theological accuracy and age-appropriateness. The teacher's Step 3 customization 
choices always take priority over freshness suggestions.
`;
}

/**
 * Build prompt instructions for teaser freshness
 * This tells Claude EXACTLY what style to use for THIS teaser
 */
export function buildTeaserFreshnessPrompt(
  suggestions: TeaserFreshnessSuggestions
): string {
  return `
TEASER STYLE DIRECTIVES (MANDATORY):
• OPENING STYLE: Use a "${suggestions.openingStyle}" approach - NOT "Ever wonder/feel/notice"
• EMOTIONAL ANGLE: Tap into "${suggestions.emotionalAngle}"
• SIGNOFF STYLE: Close with a "${suggestions.signoffStyle}" approach
`;
}

// ============================================================================
// CONSISTENT STYLE MODE - SERIES SUPPORT
// ============================================================================

/**
 * Style metadata captured from a lesson for series consistency
 */
export interface SeriesStyleMetadata {
  openingHookType: string;
  illustrationType: string;
  teachingAngle: string;
  activityFormat: string;
  applicationContext: string;
  closingChallengeType: string;
  toneDescriptor: string;
  capturedFromLessonId: string;
  capturedAt: string;
}

/**
 * Build consistent style context for series lessons
 * This tells Claude to MATCH a previously established style
 */
export function buildConsistentStyleContext(
  styleMetadata: SeriesStyleMetadata
): string {
  return `
-------------------------------------------------------------------------------
CONSISTENT STYLE MODE: ACTIVE (Series Lesson)
-------------------------------------------------------------------------------

You MUST match the established series style from Lesson 1:

• OPENING HOOK TYPE: Use a "${styleMetadata.openingHookType}" approach (same as Lesson 1)
• ILLUSTRATION STYLE: Feature "${styleMetadata.illustrationType}" examples (same as Lesson 1)
• TEACHING ANGLE: Maintain the "${styleMetadata.teachingAngle}" perspective
• ACTIVITY FORMAT: Use "${styleMetadata.activityFormat}" style activities
• APPLICATION CONTEXT: Focus on "${styleMetadata.applicationContext}" applications
• CLOSING CHALLENGE: End with a "${styleMetadata.closingChallengeType}" challenge
• TONE: Maintain a "${styleMetadata.toneDescriptor}" tone throughout

This ensures continuity across all lessons in this series.
Do NOT vary these elements - keep them consistent with the established style.
`;
}

/**
 * Prompt addition to extract style metadata from a generated lesson
 * Used when generating Lesson 1 of a series with Consistent Style Mode
 */
export function buildStyleExtractionPrompt(): string {
  return `

STYLE METADATA EXTRACTION (For Series Continuity):
After generating this lesson, identify and report the style choices you made:

At the very end of your response, add this section:
---STYLE_METADATA---
OPENING_HOOK_TYPE: [describe the type of opening hook used]
ILLUSTRATION_TYPE: [describe the main illustration style]
TEACHING_ANGLE: [describe the teaching perspective]
ACTIVITY_FORMAT: [describe the activity format used]
APPLICATION_CONTEXT: [describe the application focus area]
CLOSING_CHALLENGE_TYPE: [describe the type of closing challenge]
TONE_DESCRIPTOR: [2-3 words describing the overall tone]
---END_STYLE_METADATA---

This metadata will be used to maintain consistency in subsequent series lessons.
`;
}

/**
 * Parse style metadata from generated lesson content
 */
export function parseStyleMetadata(lessonContent: string, lessonId: string): SeriesStyleMetadata | null {
  const metadataMatch = lessonContent.match(/---STYLE_METADATA---([\s\S]*?)---END_STYLE_METADATA---/);
  if (!metadataMatch) return null;
  
  const metadataBlock = metadataMatch[1];
  
  const extractValue = (key: string): string => {
    const regex = new RegExp(`${key}:\\s*(.+?)(?:\\n|$)`, 'i');
    const match = metadataBlock.match(regex);
    return match ? match[1].trim() : '';
  };
  
  return {
    openingHookType: extractValue('OPENING_HOOK_TYPE'),
    illustrationType: extractValue('ILLUSTRATION_TYPE'),
    teachingAngle: extractValue('TEACHING_ANGLE'),
    activityFormat: extractValue('ACTIVITY_FORMAT'),
    applicationContext: extractValue('APPLICATION_CONTEXT'),
    closingChallengeType: extractValue('CLOSING_CHALLENGE_TYPE'),
    toneDescriptor: extractValue('TONE_DESCRIPTOR'),
    capturedFromLessonId: lessonId,
    capturedAt: new Date().toISOString()
  };
}

/**
 * Remove style metadata block from lesson content for display
 */
export function removeStyleMetadataFromContent(lessonContent: string): string {
  return lessonContent.replace(/---STYLE_METADATA---[\s\S]*?---END_STYLE_METADATA---/, '').trim();
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FreshnessModeId = typeof FRESHNESS_MODES[number]["id"];
export type LiturgicalSeasonId = typeof LITURGICAL_SEASONS[number]["id"];
export type CulturalSeasonId = typeof CULTURAL_SEASONS[number]["id"];
export type FreshnessElementId = typeof FRESHNESS_ELEMENTS[number]["id"];
export type TeaserFreshnessElementId = typeof TEASER_FRESHNESS_ELEMENTS[number]["id"];
