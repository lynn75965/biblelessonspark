/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/freshnessOptions.ts
 * Generated: 2025-12-16T03:11:03.203Z
 */
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
 * CREATED: December 2025
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
// FRESHNESS ELEMENTS
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
 */
export interface FreshnessSuggestions {
  openingHook: string;
  illustrationType: string;
  teachingAngle: string;
  activityFormat: string;
  applicationContext: string;
  closingChallenge: string;
  generatedAt: string;
}

/**
 * Select fresh elements for a lesson, avoiding recently used ones
 */
export function selectFreshElements(
  recentSuggestions: FreshnessSuggestions[] = [],
  maxHistory: number = 5
): FreshnessSuggestions {
  const relevantHistory = recentSuggestions.slice(0, maxHistory);
  
  const pickFresh = (elementId: string, historyKey: keyof FreshnessSuggestions): string => {
    const element = FRESHNESS_ELEMENTS.find(e => e.id === elementId);
    if (!element) return '';
    
    const recentlyUsed = new Set(
      relevantHistory.map(s => s[historyKey]).filter(Boolean)
    );
    
    const available = element.variations.filter(v => !recentlyUsed.has(v));
    const pool = available.length > 0 ? available : [...element.variations];
    
    return pool[Math.floor(Math.random() * pool.length)];
  };
  
  return {
    openingHook: pickFresh('openingHooks', 'openingHook'),
    illustrationType: pickFresh('illustrations', 'illustrationType'),
    teachingAngle: pickFresh('teachingAngles', 'teachingAngle'),
    activityFormat: pickFresh('activityFormats', 'activityFormat'),
    applicationContext: pickFresh('applicationContexts', 'applicationContext'),
    closingChallenge: pickFresh('closingChallenges', 'closingChallenge'),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Build prompt instructions from freshness suggestions
 */
export function buildFreshnessSuggestionsPrompt(
  suggestions: FreshnessSuggestions,
  mode: string = 'fresh'
): string {
  if (mode !== 'fresh') return '';
  
  return `
-------------------------------------------------------------------------------
FRESHNESS DIRECTIVES (Vary Your Approach)
-------------------------------------------------------------------------------

For THIS lesson, use these specific approaches to ensure variety:

- OPENING HOOK: Use a "${suggestions.openingHook}" approach
- ILLUSTRATION STYLE: Feature a "${suggestions.illustrationType}" as your main example
- TEACHING ANGLE: Emphasize a "${suggestions.teachingAngle}" perspective
- ACTIVITY FORMAT: Include a "${suggestions.activityFormat}" in Section 6
- APPLICATION CONTEXT: Focus applications on "${suggestions.applicationContext}"
- CLOSING CHALLENGE: End with a "${suggestions.closingChallenge}"

Follow these while maintaining theological accuracy and age-appropriateness.
`;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FreshnessModeId = typeof FRESHNESS_MODES[number]["id"];
export type LiturgicalSeasonId = typeof LITURGICAL_SEASONS[number]["id"];
export type CulturalSeasonId = typeof CULTURAL_SEASONS[number]["id"];
export type FreshnessElementId = typeof FRESHNESS_ELEMENTS[number]["id"];
