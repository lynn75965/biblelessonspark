/**
 * Generate Modern Parable Edge Function
 * Phase 17.4: DevotionalSpark / LessonSparkUSA Parable Generator
 * 
 * Flow:
 * 1. Validate request
 * 2. Fetch relevant news from NewsData.io
 * 3. Extract parable "soil" from news
 * 4. Generate 7-step parable using Claude
 * 5. Save to database
 * 6. Return parable
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types
interface ParableRequest {
  bible_passage: string;
  focus_point?: string;
  audience_lens?: string;
  modern_setting?: string;
  word_count_target?: string;
  theology_profile?: string;
  bible_version?: string;
  lesson_id?: string;
}

interface NewsArticle {
  title: string;
  description: string;
  content: string;
  source_id: string;
  link: string;
}

interface ParableResponse {
  success: boolean;
  parable?: {
    id: string;
    parable_text: string;
    bible_passage: string;
    news_headline: string;
    news_source: string;
    word_count: number;
    generation_time_ms: number;
  };
  error?: string;
}

// Fetch news from NewsData.io
async function fetchRelevantNews(keywords: string[]): Promise<NewsArticle | null> {
  const apiKey = Deno.env.get("NEWSDATA_API_KEY");
  if (!apiKey) {
    console.error("NEWSDATA_API_KEY not configured");
    return null;
  }

  // Build search query from keywords
  const query = keywords.slice(0, 3).join(" OR ");
  
  // Categories that work well for parables (human interest, community, ethics)
  const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en&category=top,world,politics,business,health,lifestyle&size=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "success" && data.results && data.results.length > 0) {
      // Pick a random article from top 5 for variety
      const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
      const article = data.results[randomIndex];
      
      return {
        title: article.title || "",
        description: article.description || "",
        content: article.content || article.description || "",
        source_id: article.source_id || "unknown",
        link: article.link || "",
      };
    }
    
    console.log("No news articles found for keywords:", keywords);
    return null;
  } catch (error) {
    console.error("Error fetching news:", error);
    return null;
  }
}

// Extract keywords from Bible passage for news search
function extractKeywordsFromPassage(passage: string, focusPoint?: string): string[] {
  // Common biblical themes mapped to searchable news keywords
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
    
    // Family/Relationships
    "father": ["father", "parent", "family", "dad"],
    "son": ["son", "child", "youth", "family"],
    "brother": ["sibling", "family", "reconciliation"],
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
  };

  const keywords: string[] = [];
  const passageLower = passage.toLowerCase();
  const focusLower = (focusPoint || "").toLowerCase();
  const combined = passageLower + " " + focusLower;

  // Check for theme matches
  for (const [theme, newsKeywords] of Object.entries(themeKeywords)) {
    if (combined.includes(theme)) {
      keywords.push(...newsKeywords.slice(0, 2));
    }
  }

  // Default keywords if no matches
  if (keywords.length === 0) {
    keywords.push("community", "helping", "challenge", "decision");
  }

  // Deduplicate and limit
  return [...new Set(keywords)].slice(0, 5);
}

// Build the parable generation prompt
function buildParablePrompt(
  biblePassage: string,
  focusPoint: string,
  audienceLens: string,
  modernSetting: string,
  newsSummary: string,
  theologyProfile: string,
  bibleVersion: string,
  wordCountTarget: string
): string {
  const wordRanges: Record<string, string> = {
    brief: "200-300",
    standard: "300-400",
    detailed: "400-500",
  };

  const targetRange = wordRanges[wordCountTarget] || wordRanges.standard;

  return `You are crafting a Modern Parable in the style of Jesus' teaching.

BIBLE PASSAGE: ${biblePassage}
FOCUS POINT: ${focusPoint || "The central truth of this passage"}
AUDIENCE LENS: ${audienceLens || "General audience"}
MODERN SETTING: ${modernSetting || "Contemporary life"}
NEWS CONTEXT (use as "soil" for realism, not as the story itself): ${newsSummary}

THEOLOGY PROFILE: ${theologyProfile || "Baptist Core Beliefs"}
BIBLE VERSION FOR SCRIPTURE ANCHOR: ${bibleVersion || "KJV"}

Follow this 7-step structure EXACTLY:

1. HOOK (20-40 words): Open with ordinary life. "There was a [role] who [routine]." Use familiar settings and "type" characters, not detailed personalities. The listener should relax because it feels like real life.

2. TENSION (20-40 words): Introduce moral tension fast in 1-2 sentences. Something is "off" - unfairness, risk, shame, social threat, or spiritual danger. A parable is rarely "cute" - it should be uncomfortable.

3. ESCALATION (80-150 words): Move in 2-4 short, memorable beats.
   - Beat A: First response (often predictable)
   - Beat B: Complication (cost rises)
   - Beat C: Pressure moment (decision point)

4. REVERSAL (40-80 words): The "punch of the Kingdom." Either:
   - The wrong person is the hero
   - The expected person fails
   - Grace upsets fairness
   - Small becomes massive
   - The "smart" choice exposes heart-poverty

5. REVEAL (40-80 words): Name the heart condition being exposed - fear, pride, bitterness, envy, greed, self-righteousness, unforgiveness, complacency, control, or image management. This is the "why" behind the behavior.

6. RESPONSE (15-35 words): End with a Jesus-style question or call:
   - A question: "Which one acted as a neighbor?"
   - A warning: "So will it be..."
   - A call: "Go and do likewise."
   - An invitation: "He who has ears..."

7. SCRIPTURE ANCHOR (15-35 words): Close with a key phrase from ${biblePassage} using ${bibleVersion}. Let it land without explanation. This is the sharp edge that does the final cutting.

CRITICAL GUARDRAILS:
- ONE big idea only. If you can't summarize it in one sentence, simplify.
- Keep symbolism light. Let 80% be natural story detail.
- Make the "wrong" choice understandable, not cartoonish.
- NO partisan political language. Confront hearts across all tribes.
- DO NOT resolve all emotions neatly. Press for response.
- Do NOT mention the news article directly. Use it only as inspiration for realistic scenarios.
- Let Scripture do the final cutting.

TARGET LENGTH: ${targetRange} words total.

Write the parable now, with clear section breaks:`;
}

// Main handler
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

    // Parse request body
    const body: ParableRequest = await req.json();
    
    if (!body.bible_passage) {
      return new Response(
        JSON.stringify({ success: false, error: "Bible passage is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check usage limits (simplified - can be enhanced later)
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
    const keywords = extractKeywordsFromPassage(body.bible_passage, body.focus_point);
    console.log("Searching news with keywords:", keywords);
    
    const newsArticle = await fetchRelevantNews(keywords);
    
    let newsSummary = "A person in your community faces a difficult decision that will reveal what they truly value.";
    let newsHeadline = "Contemporary scenario";
    let newsSource = "generated";
    let newsUrl = "";

    if (newsArticle) {
      newsSummary = `${newsArticle.title}. ${newsArticle.description || newsArticle.content}`.slice(0, 500);
      newsHeadline = newsArticle.title;
      newsSource = newsArticle.source_id;
      newsUrl = newsArticle.link;
      console.log("Found news article:", newsHeadline);
    } else {
      console.log("No news found, using generic scenario");
    }

    // Build prompt and call Claude
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildParablePrompt(
      body.bible_passage,
      body.focus_point || "",
      body.audience_lens || "general",
      body.modern_setting || "general",
      newsSummary,
      body.theology_profile || "baptist-core-beliefs",
      body.bible_version || "kjv",
      body.word_count_target || "standard"
    );

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

    // Save to database
    const { data: savedParable, error: saveError } = await supabase
      .from("modern_parables")
      .insert({
        user_id: user.id,
        lesson_id: body.lesson_id || null,
        bible_passage: body.bible_passage,
        focus_point: body.focus_point,
        audience_lens: body.audience_lens || "general",
        modern_setting: body.modern_setting || "general",
        word_count_target: body.word_count_target || "standard",
        news_headline: newsHeadline,
        news_source: newsSource,
        news_summary: newsSummary.slice(0, 1000),
        news_url: newsUrl,
        parable_text: parableText,
        theology_profile: body.theology_profile,
        bible_version: body.bible_version || "kjv",
        word_count: wordCount,
        generation_time_ms: generationTimeMs,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving parable:", saveError);
      // Return the parable anyway, just log the save error
    }

    const response: ParableResponse = {
      success: true,
      parable: {
        id: savedParable?.id || "unsaved",
        parable_text: parableText,
        bible_passage: body.bible_passage,
        news_headline: newsHeadline,
        news_source: newsSource,
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
