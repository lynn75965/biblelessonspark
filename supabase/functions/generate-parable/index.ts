/**
 * Generate Modern Parable Edge Function
 * Phase 17.4: SSOT-Compliant Revision
 * 
 * ARCHITECTURE: Frontend Drives Backend
 * - Frontend resolves all IDs to full objects from SSOT constants
 * - Frontend sends complete, resolved data
 * - Edge Function uses what it receives (no config lookups)
 * - Only DB operations: check limits, INSERT parable
 * 
 * @version 2.0.0
 * @lastUpdated 2025-12-20
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// CORS HEADERS
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// TYPE DEFINITIONS - REQUEST INTERFACE (Contract with Frontend)
// =============================================================================

/**
 * Resolved Theology Profile - Frontend sends full guardrails, not just ID
 * SSOT: src/constants/theologyProfiles.ts
 */
interface ResolvedTheologyProfile {
  id: string;
  name: string;
  guardrails: string;  // The actual doctrinal content for AI prompt
  description: string;
}

/**
 * Resolved Bible Version - Frontend sends copyright rules, not just ID
 * SSOT: src/constants/bibleVersions.ts
 */
interface ResolvedBibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  copyrightStatus: 'public_domain' | 'copyrighted';
  copyrightGuardrails: string;  // Generated rules for AI prompt
}

/**
 * Resolved Audience Lens - Frontend sends full details
 * SSOT: src/constants/parableConfig.ts
 */
interface ResolvedAudienceLens {
  id: string;
  name: string;
  description: string;
  heartCondition: string;
}

/**
 * Resolved Modern Setting - Frontend sends full details
 * SSOT: src/constants/parableConfig.ts
 */
interface ResolvedModernSetting {
  id: string;
  name: string;
  description: string;
  exampleRoles: string[];
}

/**
 * Resolved Word Count Target - Frontend sends actual min/max
 * SSOT: src/constants/parableConfig.ts
 */
interface ResolvedWordCountTarget {
  id: string;
  name: string;
  wordRange: { min: number; max: number };
}

/**
 * Resolved Age Group - Frontend sends vocabulary/conceptual details
 * SSOT: src/constants/ageGroups.ts
 */
interface ResolvedAgeGroup {
  id: string;
  name: string;
  vocabularyLevel: string;
  conceptualDepth: string;
}

/**
 * Parable Directive - Complete system instruction from frontend
 * SSOT: src/constants/parableDirectives.ts
 */
interface ParableDirective {
  id: 'standalone' | 'lessonspark';
  name: string;
  systemInstruction: string;
}

/**
 * SSOT-Compliant Parable Request
 * Frontend resolves ALL IDs to full objects before sending
 */
interface ParableRequest {
  // Either bible_passage OR focus_point required (or both)
  bible_passage?: string;
  focus_point?: string;
  
  // Parable context directive (standalone vs lessonspark)
  parable_directive: ParableDirective;
  
  // Resolved from SSOT constants (not just IDs)
  theology_profile: ResolvedTheologyProfile;
  bible_version: ResolvedBibleVersion;
  audience_lens: ResolvedAudienceLens;
  modern_setting: ResolvedModernSetting;
  word_count_target: ResolvedWordCountTarget;
  age_group: ResolvedAgeGroup;
  
  // Optional link to existing lesson
  lesson_id?: string;
}

/**
 * News article from NewsData.io
 */
interface NewsArticle {
  title: string;
  description: string;
  content: string;
  source_id: string;
  link: string;
  pubDate?: string;
  country?: string[];  // NewsData.io returns array of country codes
}

/**
 * Response structure
 */
interface ParableResponse {
  success: boolean;
  parable?: {
    id: string;
    parable_text: string;
    bible_passage?: string;  // Optional - may be generated from focus only
    focus_point?: string;    // Include focus point in response
    news_headline: string;
    news_source: string;
    news_url: string;
    news_date: string | null;      // Publication date for attribution
    news_location: string | null;  // Country/location for attribution
    word_count: number;
    generation_time_ms: number;
  };
  error?: string;
}

// =============================================================================
// NEWS FETCHING - Using Archive Endpoint for Historical Access
// =============================================================================

/**
 * Fetch news from NewsData.io
 * Tries FREE /news endpoint first (recent news), falls back to /archive if available
 */
async function fetchRelevantNews(keywords: string[]): Promise<NewsArticle | null> {
  const apiKey = Deno.env.get("NEWSDATA_API_KEY");
  if (!apiKey) {
    console.error("NEWSDATA_API_KEY not configured");
    return null;
  }

  // Build search query from keywords - use broader terms for better results
  const query = keywords.slice(0, 3).join(" OR ");
  
  // Try the FREE /news endpoint first (recent news - last 48 hours typically)
  const newsUrl = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en&size=10`;

  try {
    console.log("Fetching recent news:", { query, keywords });
    const response = await fetch(newsUrl);
    const data = await response.json();

    if (data.status === "success" && data.results && data.results.length > 0) {
      // Pick a random article from results for variety
      const randomIndex = Math.floor(Math.random() * Math.min(10, data.results.length));
      const article = data.results[randomIndex];
      
      console.log("Found news article:", article.title, "from", article.source_id);
      
      return {
        title: article.title || "",
        description: article.description || "",
        content: article.content || article.description || "",
        source_id: article.source_id || "unknown",
        link: article.link || "",
        pubDate: article.pubDate || "",
        country: article.country || [],
      };
    }
    
    // If no results from /news, try broader search with simpler terms
    console.log("No results from primary search, trying broader terms...");
    const fallbackKeywords = ["family", "community", "people", "helping"];
    const fallbackQuery = fallbackKeywords.slice(0, 2).join(" OR ");
    const fallbackUrl = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(fallbackQuery)}&language=en&category=lifestyle&size=10`;
    
    const fallbackResponse = await fetch(fallbackUrl);
    const fallbackData = await fallbackResponse.json();
    
    if (fallbackData.status === "success" && fallbackData.results && fallbackData.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(10, fallbackData.results.length));
      const article = fallbackData.results[randomIndex];
      
      console.log("Found fallback news article:", article.title);
      
      return {
        title: article.title || "",
        description: article.description || "",
        content: article.content || article.description || "",
        source_id: article.source_id || "unknown",
        link: article.link || "",
        pubDate: article.pubDate || "",
        country: article.country || [],
      };
    }
    
    console.log("No news articles found even with fallback");
    return null;
  } catch (error) {
    console.error("Error fetching news:", error);
    return null;
  }
}

/**
 * Convert ISO country codes to readable names
 */
const COUNTRY_NAMES: Record<string, string> = {
  us: "United States",
  gb: "United Kingdom",
  ca: "Canada",
  au: "Australia",
  nz: "New Zealand",
  ie: "Ireland",
  za: "South Africa",
  in: "India",
  sg: "Singapore",
  ph: "Philippines",
  ng: "Nigeria",
  ke: "Kenya",
  gh: "Ghana",
  // Add more as needed
};

function formatCountryCodes(codes: string[]): string {
  if (!codes || codes.length === 0) return "";
  
  const names = codes
    .slice(0, 2) // Limit to first 2 countries
    .map(code => COUNTRY_NAMES[code.toLowerCase()] || code.toUpperCase())
    .filter(Boolean);
  
  return names.join(", ");
}

/**
 * Extract keywords from Bible passage and/or focus point for news search
 * Handles cases where either passage or focus might be missing
 */
function extractKeywordsFromPassage(passage?: string, focusPoint?: string): string[] {
  const themeKeywords: Record<string, string[]> = {
    // Love/Compassion themes
    "love": ["charity", "compassion", "volunteer", "donation", "helping"],
    "neighbor": ["community", "neighbor", "local", "helping", "volunteer"],
    "forgive": ["reconciliation", "forgiveness", "apology", "healing"],
    "mercy": ["mercy", "pardon", "compassion", "relief"],
    
    // Faith/Trust themes
    "faith": ["trust", "hope", "perseverance", "courage"],
    "trust": ["trust", "confidence", "reliability", "faith"],
    "fear": ["anxiety", "worry", "courage", "overcoming"],
    "hope": ["hope", "optimism", "recovery", "comeback"],
    
    // Justice/Ethics themes
    "justice": ["justice", "fairness", "court", "rights"],
    "truth": ["truth", "honesty", "transparency", "integrity"],
    "righteous": ["ethics", "integrity", "moral", "honest"],
    
    // Provision/Wealth themes
    "money": ["wealth", "poverty", "economy", "financial"],
    "rich": ["wealthy", "billionaire", "success", "prosperity"],
    "poor": ["poverty", "homeless", "struggling", "hardship"],
    "give": ["donation", "charity", "generous", "giving"],
    
    // Family/Relationships - EXPANDED
    "father": ["father", "parent", "family", "dad"],
    "mother": ["mother", "parent", "family", "mom"],
    "son": ["son", "child", "youth", "family"],
    "daughter": ["daughter", "child", "family"],
    "brother": ["brothers", "siblings", "family", "brothers dispute"],
    "sister": ["sisters", "siblings", "family", "sisters conflict"],
    "sibling": ["siblings", "brothers", "sisters", "family conflict"],
    "rivalry": ["competition", "conflict", "dispute", "jealousy"],
    "prodigal": ["return", "reconciliation", "forgiveness", "family"],
    
    // Work/Service themes
    "servant": ["employee", "worker", "service", "dedication"],
    "master": ["employer", "boss", "leadership", "management"],
    "work": ["workplace", "job", "career", "employment"],
    "talent": ["skill", "talent", "ability", "potential"],
    
    // Community/Church themes
    "church": ["community", "congregation", "faith community"],
    "sheep": ["lost", "rescue", "search", "recovery"],
    "shepherd": ["leader", "pastor", "guide", "protector"],
    
    // Additional themes for focus-only generation
    "jealousy": ["jealousy", "envy", "competition", "resentment"],
    "envy": ["envy", "jealousy", "competition", "comparison"],
    "pride": ["arrogance", "humility", "success", "achievement"],
    "anger": ["conflict", "dispute", "confrontation", "resolution"],
    "grief": ["loss", "mourning", "healing", "support"],
    "anxiety": ["stress", "worry", "mental health", "coping"],
    "loneliness": ["isolation", "community", "connection", "friendship"],
    "patience": ["waiting", "perseverance", "endurance", "delay"],
    "gratitude": ["thankfulness", "appreciation", "blessing", "generosity"],
    "conflict": ["dispute", "disagreement", "resolution", "reconciliation"],
    "comparison": ["comparison", "competition", "jealousy", "self-worth"],
  };

  const keywords: string[] = [];
  const passageLower = (passage || "").toLowerCase();
  const focusLower = (focusPoint || "").toLowerCase();
  const combined = passageLower + " " + focusLower;

  for (const [theme, newsKeywords] of Object.entries(themeKeywords)) {
    if (combined.includes(theme)) {
      keywords.push(...newsKeywords.slice(0, 2));
    }
  }

  // If still no keywords, use generic family/community terms that always return results
  if (keywords.length === 0) {
    keywords.push("family", "community", "people", "helping");
  }

  return [...new Set(keywords)].slice(0, 5);
}

// =============================================================================
// PROMPT BUILDING - Uses Resolved Data from Frontend
// =============================================================================

/**
 * Build the parable generation prompt using RESOLVED data from frontend
 * No ID lookups - everything comes pre-resolved
 * Directive (standalone vs lessonspark) comes from frontend SSOT
 */
function buildParablePrompt(request: ParableRequest, newsSummary: string, newsDate: string | null, newsLocation: string | null, hasRealNews: boolean): string {
  const { 
    bible_passage,
    focus_point,
    parable_directive,
    theology_profile,
    bible_version,
    audience_lens,
    modern_setting,
    word_count_target,
    age_group,
  } = request;

  const targetRange = `${word_count_target.wordRange.min}-${word_count_target.wordRange.max}`;
  
  // Build attribution line ONLY if real news was found
  let attributionSection: string;
  if (hasRealNews && newsLocation) {
    const now = new Date();
    const monthYear = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    attributionSection = `=== ATTRIBUTION LINE (Include in output) ===
Inspired by real-life situations reported in ${monthYear} within ${newsLocation}.`;
  } else {
    // No real news found - don't include fake attribution
    attributionSection = `=== ATTRIBUTION ===
NOTE: No specific news source available. Do NOT include an attribution line in the output.
Create a timeless parable based on the focus/passage without referencing specific dates or locations.`;
  }

  // Handle passage vs focus-only scenarios
  const hasPassage = bible_passage && bible_passage.trim();
  const hasFocus = focus_point && focus_point.trim();
  
  let passageSection: string;
  let scriptureInstruction: string;
  
  // Build focus interpretation guidance
  const focusInterpretation = hasFocus ? `
CRITICAL FOCUS INTERPRETATION:
The focus point "${focus_point}" defines:
1. WHO the main characters must be (e.g., "sibling rivalry" = two siblings are the protagonists)
2. WHAT relationship conflict is central (e.g., "sibling rivalry" = conflict BETWEEN siblings, not involving parents)
3. The parable must show this specific dynamic between these specific people

Examples of correct interpretation:
- "sibling rivalry" → Story about TWO BROTHERS or TWO SISTERS who are jealous of each other
- "parent-child conflict" → Story about a PARENT and CHILD in disagreement
- "workplace jealousy" → Story about COWORKERS who are envious of each other
- "marital forgiveness" → Story about a HUSBAND and WIFE

DO NOT substitute other relationships. If the focus says "sibling," the main characters MUST be siblings.` : '';
  
  if (hasPassage && hasFocus) {
    // Both provided
    passageSection = `BIBLE PASSAGE: ${bible_passage}
FOCUS POINT: ${focus_point}
${focusInterpretation}`;
    scriptureInstruction = `End with Scripture from ${bible_passage} using ${bible_version.abbreviation} - no commentary after`;
  } else if (hasPassage) {
    // Passage only
    passageSection = `BIBLE PASSAGE: ${bible_passage}
FOCUS POINT: The central truth of this passage`;
    scriptureInstruction = `End with Scripture from ${bible_passage} using ${bible_version.abbreviation} - no commentary after`;
  } else {
    // Focus only - no specific passage
    passageSection = `FOCUS POINT: ${focus_point}
${focusInterpretation}

NOTE: No specific Bible passage provided. Select an appropriate Scripture that speaks to this focus.`;
    scriptureInstruction = `End with an appropriate Scripture that speaks to "${focus_point}" using ${bible_version.abbreviation} - no commentary after. Choose a passage that anchors the heart truth revealed in the parable.`;
  }

  return `${parable_directive.systemInstruction}

=============================================================================
SPECIFIC GENERATION CONTEXT
=============================================================================

=== PASSAGE & FOCUS ===
${passageSection}

${attributionSection}

=== AUDIENCE CONTEXT ===
AUDIENCE LENS: ${audience_lens.name} - ${audience_lens.description}
TARGET HEART CONDITION: ${audience_lens.heartCondition}
AGE GROUP: ${age_group.name}
VOCABULARY LEVEL: ${age_group.vocabularyLevel}
CONCEPTUAL DEPTH: ${age_group.conceptualDepth}

=== MODERN SETTING ===
SETTING: ${modern_setting.name} - ${modern_setting.description}
POSSIBLE ROLES: ${modern_setting.exampleRoles.join(", ")}

=== NEWS CONTEXT (for realism - do NOT mention directly) ===
Use this as "soil" for realistic scenarios. Never reference directly in output.
${newsSummary}

=== THEOLOGICAL GUARDRAILS ===
THEOLOGY PROFILE: ${theology_profile.name}
${theology_profile.guardrails}

=== BIBLE VERSION RULES ===
BIBLE VERSION: ${bible_version.name} (${bible_version.abbreviation})
${bible_version.copyrightGuardrails}

=== OUTPUT REQUIREMENTS ===
- TARGET LENGTH: ${targetRange} words total
- Use the exact 8-section structure from the directive above
- Include the attribution line at the beginning or end
- Match vocabulary to ${age_group.vocabularyLevel} level
- ${scriptureInstruction}

Generate the Modern Parable now:`;
}

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

/**
 * Validate the request has all required resolved fields
 */
function validateRequest(body: unknown): { valid: boolean; error?: string; request?: ParableRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Required: Either bible_passage OR focus_point (or both)
  const hasPassage = req.bible_passage && typeof req.bible_passage === 'string' && req.bible_passage.trim();
  const hasFocus = req.focus_point && typeof req.focus_point === 'string' && req.focus_point.trim();
  
  if (!hasPassage && !hasFocus) {
    return { valid: false, error: "Either bible_passage or focus_point is required (or both)" };
  }

  // Required: parable_directive (from SSOT - standalone or lessonspark)
  if (!req.parable_directive || typeof req.parable_directive !== 'object') {
    return { valid: false, error: "parable_directive must be a resolved object from SSOT constants" };
  }
  const pd = req.parable_directive as Record<string, unknown>;
  if (!pd.id || !pd.systemInstruction) {
    return { valid: false, error: "parable_directive must include id and systemInstruction" };
  }
  if (pd.id !== 'standalone' && pd.id !== 'lessonspark') {
    return { valid: false, error: "parable_directive.id must be 'standalone' or 'lessonspark'" };
  }

  // Required: theology_profile (resolved)
  if (!req.theology_profile || typeof req.theology_profile !== 'object') {
    return { valid: false, error: "theology_profile must be a resolved object (not just ID)" };
  }
  const tp = req.theology_profile as Record<string, unknown>;
  if (!tp.id || !tp.name || !tp.guardrails) {
    return { valid: false, error: "theology_profile must include id, name, and guardrails" };
  }

  // Required: bible_version (resolved)
  if (!req.bible_version || typeof req.bible_version !== 'object') {
    return { valid: false, error: "bible_version must be a resolved object (not just ID)" };
  }
  const bv = req.bible_version as Record<string, unknown>;
  if (!bv.id || !bv.name || !bv.copyrightGuardrails) {
    return { valid: false, error: "bible_version must include id, name, and copyrightGuardrails" };
  }

  // Required: audience_lens (resolved)
  if (!req.audience_lens || typeof req.audience_lens !== 'object') {
    return { valid: false, error: "audience_lens must be a resolved object" };
  }

  // Required: modern_setting (resolved)
  if (!req.modern_setting || typeof req.modern_setting !== 'object') {
    return { valid: false, error: "modern_setting must be a resolved object" };
  }

  // Required: word_count_target (resolved with wordRange)
  if (!req.word_count_target || typeof req.word_count_target !== 'object') {
    return { valid: false, error: "word_count_target must be a resolved object" };
  }
  const wct = req.word_count_target as Record<string, unknown>;
  if (!wct.wordRange || typeof wct.wordRange !== 'object') {
    return { valid: false, error: "word_count_target must include wordRange with min/max" };
  }

  // Required: age_group (resolved)
  if (!req.age_group || typeof req.age_group !== 'object') {
    return { valid: false, error: "age_group must be a resolved object" };
  }

  return { 
    valid: true, 
    request: body as ParableRequest 
  };
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateRequest(body);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const request = validation.request!;

    // Check usage limits (database operation - allowed)
    const { data: usageData } = await supabase
      .from("user_parable_usage")
      .select("parables_this_month")
      .eq("user_id", user.id)
      .single();

    const currentUsage = usageData?.parables_this_month || 0;
    const limit = 7; // Beta limit - matches lesson limit

    if (currentUsage >= limit) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `You have reached your monthly limit of ${limit} parables. Limit resets next month.` 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract keywords and fetch news
    const keywords = extractKeywordsFromPassage(request.bible_passage, request.focus_point);
    console.log("Searching news with keywords:", keywords);
    
    const newsArticle = await fetchRelevantNews(keywords);
    
    let newsSummary = "A person in your community faces a difficult decision that will reveal what they truly value.";
    let newsHeadline = "Contemporary scenario";
    let newsSource = "generated";
    let newsUrl = "";
    let newsDate: string | null = null;
    let newsLocation: string | null = null;
    let hasRealNews = false;

    if (newsArticle) {
      newsSummary = `${newsArticle.title}. ${newsArticle.description || newsArticle.content}`.slice(0, 500);
      newsHeadline = newsArticle.title;
      newsSource = newsArticle.source_id;
      newsUrl = newsArticle.link;
      newsDate = newsArticle.pubDate || null;
      // Convert country codes to readable format (e.g., ["us", "gb"] → "United States, United Kingdom")
      newsLocation = newsArticle.country && newsArticle.country.length > 0 
        ? formatCountryCodes(newsArticle.country) 
        : null;
      hasRealNews = true;
      console.log("Found news article:", newsHeadline, "Date:", newsDate, "Location:", newsLocation);
    } else {
      console.log("No news found, using generic scenario - no attribution line will be included");
    }

    // Build prompt using RESOLVED data (no lookups!)
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildParablePrompt(request, newsSummary, newsDate, newsLocation, hasRealNews);

    // Call Claude
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate parable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeResponse.json();
    const parableText = claudeData.content[0]?.text || "";
    
    if (!parableText) {
      return new Response(
        JSON.stringify({ success: false, error: "Empty response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate word count
    const wordCount = parableText.split(/\s+/).filter(Boolean).length;
    const generationTimeMs = Date.now() - startTime;

    // Save to database (database operation - allowed)
    const { data: savedParable, error: saveError } = await supabase
      .from("modern_parables")
      .insert({
        user_id: user.id,
        lesson_id: request.lesson_id || null,
        bible_passage: request.bible_passage,
        focus_point: request.focus_point,
        audience_lens: request.audience_lens.id,
        modern_setting: request.modern_setting.id,
        word_count_target: request.word_count_target.id,
        age_group: request.age_group.id,
        news_headline: newsHeadline,
        news_source: newsSource,
        news_summary: newsSummary.slice(0, 1000),
        news_url: newsUrl,
        news_date: newsDate,
        news_location: newsLocation,
        parable_text: parableText,
        theology_profile: request.theology_profile.id,
        bible_version: request.bible_version.id,
        word_count: wordCount,
        generation_time_ms: generationTimeMs,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving parable:", saveError);
      // Return the parable anyway, just log the save error
    }

    // Update usage count
    await supabase.rpc('increment_parable_usage', { p_user_id: user.id });

    const response: ParableResponse = {
      success: true,
      parable: {
        id: savedParable?.id || "unsaved",
        parable_text: parableText,
        bible_passage: request.bible_passage,
        focus_point: request.focus_point,
        news_headline: newsHeadline,
        news_source: newsSource,
        news_url: newsUrl,
        news_date: newsDate,
        news_location: newsLocation,
        word_count: wordCount,
        generation_time_ms: generationTimeMs,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-parable:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
