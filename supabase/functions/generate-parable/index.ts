/// <reference lib="deno.ns" />

/**
 * generate-parable Edge Function
 * LessonSparkUSA Modern Parable Generator
 * 
 * COMPLETE REWRITE addressing all 39 identified errors:
 * - Anonymous access with IP-based 3/day limit (standalone only)
 * - Authenticated access with 7/month limit
 * - Admin bypass for unlimited access
 * - Context detection from parable_directive.id
 * - LessonSpark lesson loading from lessons.filters (SSOT)
 * - Full object properties used in prompt (guardrails, heartCondition, etc.)
 * - NewsData.io integration (FREE tier /api/1/news, 48-hour window)
 * - Correct database column names and string ID storage
 * 
 * @version 3.0.0
 * @updated 2025-12-24
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// TYPES
// =============================================================================

interface ParableRequest {
  bible_passage?: string;
  focus_point?: string;
  parable_directive: {
    id: 'standalone' | 'lessonspark';
    name: string;
    systemInstruction: string;
  };
  theology_profile: {
    id: string;
    name: string;
    guardrails: string;
    description: string;
  };
  bible_version: {
    id: string;
    name: string;
    abbreviation: string;
    copyrightStatus: 'public_domain' | 'copyrighted';
    copyrightGuardrails: string;
  };
  audience_lens: {
    id: string;
    name: string;
    description: string;
    heartCondition: string;
  };
  modern_setting: {
    id: string;
    name: string;
    description: string;
    exampleRoles: string[];
  };
  word_count_target: {
    id: string;
    name: string;
    wordRange: { min: number; max: number };
  };
  age_group: {
    id: string;
    name: string;
    vocabularyLevel: string;
    conceptualDepth: string;
  };
  lesson_id?: string;
}

interface NewsArticle {
  title: string;
  description: string;
  content: string;
  source_id: string;
  link: string;
  pubDate: string;
  country: string[];
}

interface LessonFilters {
  theology_profile_id?: string;
  bible_version_id?: string;
  age_group?: string;
  bible_passage?: string;
  focused_topic?: string;
}

// =============================================================================
// CORS HEADERS
// =============================================================================

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }
  // Fallback - this may be the proxy IP
  return "unknown";
}

function billingPeriodStartISO(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)).toISOString();
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

// =============================================================================
// DIRECTIVES (Embedded from parableDirectives.ts)
// =============================================================================

const STANDALONE_DIRECTIVE = `STAND-ALONE CLAUDE SYSTEM INSTRUCTION
(Distinct from LessonSparkUSA)

1. Purpose of This Product

You are generating Modern Parables as a stand-alone spiritual reflection product.

This product is:
- not a lesson system
- not classroom-oriented
- not structured for teaching aids
- not multi-age adapted
- not tied to LessonSparkUSA outputs

It is designed for:
- personal reflection
- devotional reading
- short-form sharing
- heart examination

The tone is quiet, reflective, and searching, not instructional.

2. Core Distinction from LessonSparkUSA (Non-Negotiable)

LessonSparkUSA = structured teaching environment
Modern Parables (stand-alone) = contemplative narrative

Therefore:
- No teaching scaffolding
- No discussion prompts
- No age targeting
- No metadata
- No editorial explanations
- No "teacher usefulness" bias

The parable must stand on its own.

3. Fixed Jesus-Style Structure

(Do not rename, reorder, or merge sections)

Every Modern Parable must use these section labels, in this order:

**A Scene from Everyday Life**
(Intent: recognition)
Introduce ordinary modern life. No moral framing. No Scripture language.

**A Moment of Offense or Loss**
(Intent: discomfort)
A believable relational, emotional, or moral rupture.

**The Struggle of the Human Heart**
(Intent: justification)
Show reasoning that makes self-protection feel right.

**The Turning of the Will**
(Intent: decision)
A quiet, costly internal choice.

**The Unexpected Way of Grace**
(Intent: reversal)
Mercy, restraint, forgiveness, or generosity that contradicts instinct.

**The Matter of the Heart Revealed**
(Intent: exposure)
Name the heart issue using biblical categories (pride, fear, mercy, humility).

**The Question That Searches the Listener**
(Intent: self-examination)
One or two probing questions. No answers supplied.

**The Scripture That Anchors the Truth**
(Intent: authority)
One Scripture. Scripture closes the parable. No commentary afterward.

4. Modern Attribution Rule (Required)

Each parable must include one subtle attribution line, either at the beginning or end:

Inspired by real-life situations reported in MM—YYYY within [general locale].

Rules:
- Month—Year only
- Geographic region only
- No media names
- No real people or organizations
- Parable must remain timeless if attribution is removed

This attribution exists only to ensure freshness, not commentary.

5. Perpetual Freshness Requirements

(Mandatory, enforced silently)

Freshness must come from variation, not novelty.

You must vary:
- setting
- relationship type
- surface conflict
- narrative pacing
- sentence structure

You must never vary:
- section structure
- theological trajectory
- heart logic
- Scripture placement
- overall length range

Prohibited staleness:
- repeated metaphors
- recycled emotional arcs
- formulaic phrasing
- predictable reversals

6. Tone and Language Rules

- Plain, restrained language
- No preaching
- No moral conclusions
- No modern self-help vocabulary
- No psychological diagnosis
- No cultural commentary

Write as if Jesus were speaking quietly to attentive listeners, not addressing a crowd.

7. Theological Guardrails

- Scripture confirms the story; the story does not reinterpret Scripture
- Grace is costly, not permissive
- Mercy does not deny wrongdoing
- Obedience is not reduced to emotional relief
- God's character is implied, not explained

8. Prohibited Practices (Hard Stops)

You must not:
- explain symbolism
- summarize lessons
- include applications
- offer resolutions
- add teaching commentary
- reference LessonSparkUSA
- adapt for classrooms

9. Single-Truth Rule

Each parable must reveal one heart truth only.

If more than one emerges, revise until one remains.

10. Final Silent Validation (Required)

Before output, confirm:
- Does this feel like something Jesus could tell today?
- Does the listener recognize themselves before understanding the meaning?
- Does grace interrupt instinct?
- Does Scripture end the parable without explanation?

If any answer is no, revise before output.

11. Output Instruction

Output only the parable, using:
- the exact section labels
- the attribution line
- no meta commentary
- no explanations

Closing Instruction:
Stand-alone Modern Parables are not lessons.
They are invitations.
Speak softly. Let the heart listen. Let Scripture speak last.`;

const LESSONSPARK_DIRECTIVE = `MASTER CLAUDE SYSTEM INSTRUCTION
Modern Parables with Perpetual Freshness
(Authoritative — Non-Negotiable)

1. Your Role and Scope

You are generating Modern Parables for LessonSparkUSA.

A Modern Parable is:
- a short narrative rooted in ordinary modern life
- shaped after the teaching style of Jesus
- designed to reveal the human heart
- anchored in Scripture
- suitable for volunteer Bible teachers, lay leaders, and church settings

You are not writing:
- sermons
- devotionals with commentary
- moral essays
- news analysis
- allegories with explained symbols

You are writing parable mirrors — stories that allow the listener to recognize themselves before recognizing the lesson.

2. Non-Negotiable Structural Framework

(This structure must never change)

Every Modern Parable must appear in this exact order using these section labels.
You may vary the wording inside each section, but never the intent.

**A Scene from Everyday Life**
Jesus-style intent: Disarm the listener with familiarity.
Introduce an ordinary modern setting (family, work, community, relationships).
Use realistic, everyday roles.
Do not use spiritual language.
Do not explain meaning.

**A Moment of Offense or Loss**
Jesus-style intent: Awaken moral discomfort.
Introduce a believable offense, loss, or threat.
The listener should sympathize with the offended party.
Avoid exaggeration or villain caricatures.

**The Struggle of the Human Heart**
Jesus-style intent: Expose what feels justified.
Show internal reasoning, fears, and pressures.
Include socially reinforcing voices ("others advised," "friends said").
Make retaliation, control, or withdrawal feel reasonable.
Do not moralize or quote Scripture.

**The Turning of the Will**
Jesus-style intent: Reveal the decisive heart choice.
Present a clear internal decision point.
The choice must involve real cost.
Avoid emotional catharsis language.
The decision should surprise but remain believable.

**The Unexpected Way of Grace**
Jesus-style intent: Overturn worldly logic.
Show restraint, mercy, forgiveness, or generosity.
Grace must feel costly, not convenient.
Do not resolve all consequences neatly.

**The Matter of the Heart Revealed**
Jesus-style intent: Name the true issue beneath the issue.
Reveal the heart condition (pride, fear, hardness, compassion, humility).
Use biblical heart language, not therapeutic identity language.
Do not over-explain.

**The Question That Searches the Listener**
Jesus-style intent: Force self-examination, not agreement.
Ask 1–2 probing questions.
No yes/no questions.
No rhetorical answers.
Questions must turn the story outward toward the listener.

**The Scripture That Anchors the Truth**
Jesus-style intent: Let God's Word close the parable.
Include one Scripture (or a short passage).
Scripture must be last.
No commentary after Scripture.
Introduce with a brief framing line only if necessary.

3. Modern Attribution Rule

(Perpetual Freshness without News Commentary)

Each Modern Parable must include one attribution line at the top or bottom:

Inspired by real-life situations reported in MM—YYYY within [general locale].

Rules:
- Month—Year only (MM—YYYY)
- Geographic reference only (city/region/state/country)
- Never name news outlets
- Never name real people or organizations
- The parable must remain timeless even if the attribution is removed

This attribution exists to:
- ground the parable in modern reality
- ensure freshness and variety
- prevent recycled phrasing

4. Perpetual Freshness Requirements

(Mandatory for every output)

Freshness must come from variation, not novelty.

You MUST vary:
- setting (workplace, family, community, etc.)
- relational dynamic (parent/child, employer/employee, peers, neighbors)
- surface conflict
- language rhythm and sentence structure

You MUST NOT vary:
- section order
- heart trajectory
- theological integrity
- Scripture anchoring
- overall length range

Prohibited "staleness indicators":
- repeating sentence patterns
- identical emotional arcs
- reused metaphors
- predictable phrasing like "everyone was shocked" or "in that moment"

5. Theological Guardrails (LessonSparkUSA Alignment)

- Scripture interprets the story, not the story interpreting Scripture
- Mercy, humility, repentance, and compassion must align with biblical teaching
- Avoid modern moral relativism
- Avoid prosperity or self-actualization framing
- Do not present grace as endorsement of sin
- Do not reduce obedience to emotional well-being

6. Prohibited Practices (Hard Stops)

You must NOT:
- explain the parable's symbolism
- preach or apply mid-story
- reference political ideologies
- moralize news events
- end with "the moral is"
- flatten the parable into a lesson summary
- resolve all consequences neatly

7. Single-Point Integrity Rule

Every Modern Parable must drive toward one dominant heart truth.

If more than one lesson emerges, revise until one remains.

8. Final Validation Checklist

(Run silently before output)

Before delivering the parable, confirm:
- Does this sound like something Jesus could plausibly tell today?
- Does the listener recognize themselves before recognizing the lesson?
- Is the grace shown costly and counter-cultural?
- Does Scripture seal the truth without explanation?
- Does the structure remain intact from start to finish?

If any answer is no, revise before output.

9. Output Instruction

When generating a Modern Parable:
- Use the exact section labels above
- Include the attribution line
- Maintain consistent length and tone
- Deliver the parable only — no meta commentary

Closing Instruction:
Modern Parables are not teaching tools first — they are mirrors.
Your task is not to persuade, but to reveal.
Let the story do the work. Let Scripture have the final word.`;

// =============================================================================
// ANONYMOUS DEFAULTS (Applied silently)
// =============================================================================

const ANONYMOUS_DEFAULTS = {
  theology_profile: {
    id: 'baptist-core-beliefs',
    name: 'Baptist Core Beliefs',
    guardrails: '', // No guardrails sent for anonymous
    description: 'Core Baptist theological convictions'
  },
  bible_version: {
    id: 'web',
    name: 'World English Bible',
    abbreviation: 'WEB',
    copyrightStatus: 'public_domain' as const,
    copyrightGuardrails: '' // No guardrails sent for anonymous
  }
};

// =============================================================================
// ANONYMOUS USAGE TRACKING (IP-based, 3/day limit)
// =============================================================================

async function checkAnonymousLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  ipAddress: string,
  dailyLimit = 3,
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const today = todayDateString();

  // Check current usage
  const { data: row, error: selErr } = await supabaseAdmin
    .from("anonymous_parable_usage")
    .select("parable_count")
    .eq("ip_address", ipAddress)
    .eq("usage_date", today)
    .maybeSingle();

  if (selErr) {
    console.error("Anonymous usage select error:", selErr);
    // On error, allow the request (fail open for better UX)
    return { allowed: true, used: 0, remaining: dailyLimit };
  }

  const used = Number(row?.parable_count ?? 0);

  if (used >= dailyLimit) {
    return { allowed: false, used, remaining: 0 };
  }

  // Increment or insert
  if (!row) {
    // First parable today from this IP
    const { error: insErr } = await supabaseAdmin
      .from("anonymous_parable_usage")
      .insert({
        ip_address: ipAddress,
        usage_date: today,
        parable_count: 1,
      });

    if (insErr) {
      console.error("Anonymous usage insert error:", insErr);
    }

    return { allowed: true, used: 1, remaining: dailyLimit - 1 };
  }

  // Increment existing
  const nextUsed = used + 1;
  const { error: updErr } = await supabaseAdmin
    .from("anonymous_parable_usage")
    .update({ parable_count: nextUsed })
    .eq("ip_address", ipAddress)
    .eq("usage_date", today);

  if (updErr) {
    console.error("Anonymous usage update error:", updErr);
  }

  return { allowed: true, used: nextUsed, remaining: Math.max(0, dailyLimit - nextUsed) };
}

// =============================================================================
// AUTHENTICATED USAGE TRACKING (7/month limit)
// =============================================================================

async function checkAuthenticatedLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  monthlyLimit = 7,
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const periodStart = billingPeriodStartISO();

  const { data: row, error: selErr } = await supabaseAdmin
    .from("user_parable_usage")
    .select("parables_this_month")
    .eq("user_id", userId)
    .gte("billing_period_start", periodStart)
    .maybeSingle();

  if (selErr) {
    console.error("Usage select error:", selErr);
    throw new Error(`usage_select_failed: ${selErr.message}`);
  }

  const used = Number(row?.parables_this_month ?? 0);

  if (used >= monthlyLimit) {
    return { allowed: false, used, limit: monthlyLimit, remaining: 0 };
  }

  if (!row) {
    // First parable this billing period
    const { error: insErr } = await supabaseAdmin
      .from("user_parable_usage")
      .upsert({
        user_id: userId,
        billing_period_start: periodStart,
        parables_this_month: 1,
      }, { onConflict: "user_id" });

    if (insErr) {
      console.error("Usage insert error:", insErr);
      throw new Error(`usage_insert_failed: ${insErr.message}`);
    }

    return { allowed: true, used: 1, limit: monthlyLimit, remaining: monthlyLimit - 1 };
  }

  // Increment existing count
  const nextUsed = used + 1;

  const { error: updErr } = await supabaseAdmin
    .from("user_parable_usage")
    .update({ parables_this_month: nextUsed })
    .eq("user_id", userId);

  if (updErr) {
    console.error("Usage update error:", updErr);
    throw new Error(`usage_update_failed: ${updErr.message}`);
  }

  return { allowed: true, used: nextUsed, limit: monthlyLimit, remaining: Math.max(0, monthlyLimit - nextUsed) };
}

// =============================================================================
// NEWS FETCHING (NewsData.io FREE tier - 48 hour window)
// =============================================================================

async function fetchRelevantNews(keywords: string[]): Promise<NewsArticle | null> {
  const apiKey = Deno.env.get("NEWSDATA_API_KEY");
  if (!apiKey) {
    console.log("NEWSDATA_API_KEY not configured - skipping news fetch");
    return null;
  }

  // Build search query from keywords
  const query = keywords.slice(0, 3).join(" OR ");
  
  // FREE tier uses /api/1/news (recent 48 hours)
  const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en&size=10`;

  try {
    console.log("Fetching news:", { query, keywords: keywords.slice(0, 3) });
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "success" && data.results && data.results.length > 0) {
      // Pick a random article for variety
      const randomIndex = Math.floor(Math.random() * Math.min(10, data.results.length));
      const article = data.results[randomIndex];
      
      console.log("Found news article:", article.title?.substring(0, 50));
      
      return {
        title: article.title || "",
        description: article.description || "",
        content: article.content || article.description || "",
        source_id: article.source_id || "news",
        link: article.link || "",
        pubDate: article.pubDate || "",
        country: article.country || [],
      };
    }
    
    console.log("No news articles found for keywords:", keywords);
    return null;
  } catch (error) {
    console.error("Error fetching news:", error);
    return null;
  }
}

function extractKeywordsFromPassage(passage: string, focusPoint?: string): string[] {
  const keywords: string[] = [];
  
  // Extract meaningful words from focus point
  if (focusPoint) {
    const focusWords = focusPoint
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['the', 'and', 'for', 'that', 'with', 'from', 'this', 'have', 'been'].includes(w));
    keywords.push(...focusWords.slice(0, 3));
  }
  
  // Map common biblical themes to news-searchable terms
  const themeMap: Record<string, string[]> = {
    'forgive': ['reconciliation', 'forgiveness', 'apology'],
    'prodigal': ['family reunion', 'reconciliation', 'return home'],
    'love': ['compassion', 'kindness', 'charity'],
    'faith': ['trust', 'belief', 'hope'],
    'grace': ['mercy', 'second chance', 'forgiveness'],
    'pride': ['humility', 'ego', 'arrogance'],
    'fear': ['courage', 'anxiety', 'worry'],
    'money': ['wealth', 'poverty', 'generosity'],
    'neighbor': ['community', 'helping others', 'kindness'],
    'servant': ['service', 'helping', 'volunteer'],
  };

  // Check for theme matches
  const passageLower = (passage + ' ' + (focusPoint || '')).toLowerCase();
  for (const [theme, searchTerms] of Object.entries(themeMap)) {
    if (passageLower.includes(theme)) {
      keywords.push(...searchTerms);
      break;
    }
  }

  // Ensure we have at least some keywords
  if (keywords.length === 0) {
    keywords.push('kindness', 'community', 'family');
  }

  // Deduplicate and limit
  return [...new Set(keywords)].slice(0, 5);
}

// =============================================================================
// LESSON LOADING (For LessonSpark context - SSOT from database)
// =============================================================================

async function loadLessonContext(
  supabaseAdmin: ReturnType<typeof createClient>,
  lessonId: string,
): Promise<LessonFilters | null> {
  const { data, error } = await supabaseAdmin
    .from("lessons")
    .select("filters")
    .eq("id", lessonId)
    .single();

  if (error) {
    console.error("Error loading lesson:", error);
    return null;
  }

  if (!data?.filters) {
    console.log("Lesson has no filters:", lessonId);
    return null;
  }

  // Extract relevant fields from filters JSONB
  const filters = data.filters as LessonFilters;
  return {
    theology_profile_id: filters.theology_profile_id,
    bible_version_id: filters.bible_version_id,
    age_group: filters.age_group,
    bible_passage: filters.bible_passage,
    focused_topic: filters.focused_topic,
  };
}

// =============================================================================
// PROMPT BUILDER (Uses full object properties)
// =============================================================================

function buildParablePrompt(
  payload: ParableRequest,
  news: NewsArticle | null,
  isAnonymous: boolean,
): string {
  const biblePassage = payload.bible_passage || "Not specified";
  const focusPoint = payload.focus_point || "General application";
  
  // Extract display values from objects
  const audienceLens = payload.audience_lens?.name || "General Audience";
  const heartCondition = payload.audience_lens?.heartCondition || "various";
  const modernSetting = payload.modern_setting?.name || "Family & Home";
  const exampleRoles = payload.modern_setting?.exampleRoles?.join(", ") || "family members";
  const wordCountMin = payload.word_count_target?.wordRange?.min || 300;
  const wordCountMax = payload.word_count_target?.wordRange?.max || 400;
  const ageGroup = payload.age_group?.name || "Adults";
  const vocabularyLevel = payload.age_group?.vocabularyLevel || "moderate";
  const conceptualDepth = payload.age_group?.conceptualDepth || "developing";
  
  // For authenticated users, include guardrails
  const theologyName = payload.theology_profile?.name || "Baptist Core Beliefs";
  const theologyGuardrails = !isAnonymous && payload.theology_profile?.guardrails 
    ? `\n\nTHEOLOGICAL GUARDRAILS:\n${payload.theology_profile.guardrails}` 
    : "";
  
  const bibleVersionName = payload.bible_version?.name || "World English Bible";
  const bibleVersionAbbr = payload.bible_version?.abbreviation || "WEB";
  const copyrightGuardrails = !isAnonymous && payload.bible_version?.copyrightGuardrails
    ? `\n\nSCRIPTURE QUOTATION GUIDELINES:\n${payload.bible_version.copyrightGuardrails}`
    : "";

  // News context
  let newsContext = "No specific news story available. Create a timeless scenario based on common human experiences.";
  if (news) {
    const newsDate = news.pubDate ? new Date(news.pubDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recent";
    const newsLocation = news.country?.length > 0 ? news.country[0] : "United States";
    newsContext = `NEWS INSPIRATION (use as "soil" for modern setting, not as the story itself):
Headline: ${news.title}
Summary: ${news.description || news.content?.substring(0, 200)}
Time: ${newsDate}
Location: ${newsLocation}

Use this real-world context to ground your parable in modern reality. Do NOT retell the news story. Extract the human situation and create an original parable.`;
  }

  return `Generate a Modern Parable based on the following:

BIBLE PASSAGE: ${biblePassage}
FOCUS POINT: ${focusPoint}

TARGET AUDIENCE: ${ageGroup}
- Vocabulary Level: ${vocabularyLevel}
- Conceptual Depth: ${conceptualDepth}

AUDIENCE LENS (heart condition to address): ${audienceLens}
- Heart Condition: ${heartCondition}

MODERN SETTING: ${modernSetting}
- Example Roles to Consider: ${exampleRoles}

THEOLOGY: ${theologyName}
BIBLE VERSION FOR SCRIPTURE QUOTES: ${bibleVersionName} (${bibleVersionAbbr})

TARGET LENGTH: ${wordCountMin}-${wordCountMax} words
${theologyGuardrails}
${copyrightGuardrails}

${newsContext}

Follow the 8-section structure exactly as specified in your system instructions.
Use vocabulary and conceptual depth appropriate for ${ageGroup} (${vocabularyLevel}).
Ensure Scripture quotes use ${bibleVersionAbbr} text.

Write the parable now:`;
}

// =============================================================================
// LLM PROVIDER (Anthropic primary, OpenAI fallback)
// =============================================================================

async function generateParableWithProvider(
  systemInstruction: string,
  userPrompt: string,
  maxTokens = 1500,
  temperature = 0.7,
): Promise<string> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  if (anthropicKey) {
    const model = "claude-sonnet-4-5-20250929";
    
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemInstruction,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Anthropic API error:", resp.status, t);
      throw new Error(`anthropic_failed: ${resp.status} ${t}`);
    }

    const j = await resp.json();
    const text =
      j?.content?.find?.((c: any) => c?.type === "text")?.text ??
      j?.content?.[0]?.text ??
      "";
    if (!text) throw new Error("anthropic_empty_response");
    return text;
  }

  if (openaiKey) {
    const model = "gpt-4o-mini";
    
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("OpenAI API error:", resp.status, t);
      throw new Error(`openai_failed: ${resp.status} ${t}`);
    }

    const j = await resp.json();
    const text = j?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("openai_empty_response");
    return text;
  }

  throw new Error("no_llm_provider_configured");
}

// =============================================================================
// DATABASE INSERT (Authenticated users only - stores STRING IDs)
// =============================================================================

async function saveParable(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  payload: ParableRequest,
  parableText: string,
  news: NewsArticle | null,
  generationTimeMs: number,
): Promise<string> {
  const parableId = generateUUID();
  const wordCount = countWords(parableText);
  const now = new Date().toISOString();

  // Extract STRING IDs from objects for database storage
  const insertData = {
    id: parableId,
    user_id: userId,
    lesson_id: payload.lesson_id || null,
    bible_passage: payload.bible_passage || "",
    focus_point: payload.focus_point || null,
    // Store STRING IDs, not objects
    audience_lens: payload.audience_lens?.id || "general",
    modern_setting: payload.modern_setting?.id || "family",
    word_count_target: payload.word_count_target?.id || "standard",
    age_group: payload.age_group?.id || null,
    theology_profile: payload.theology_profile?.id || null,
    bible_version: payload.bible_version?.id || "web",
    parable_text: parableText,
    word_count: wordCount,
    generation_time_ms: generationTimeMs,
    // News fields
    news_headline: news?.title || "Contemporary scenario",
    news_source: news?.source_id || "generated",
    news_summary: news?.description || "A person in your community faces a decision that reveals what they truly value.",
    news_url: news?.link || "",
    news_date: news?.pubDate || null,
    news_location: news?.country?.[0] || null,
    created_at: now,
    updated_at: now,
  };

  const { error: insertErr } = await supabaseAdmin
    .from("modern_parables")
    .insert(insertData);

  if (insertErr) {
    console.error("Parable insert error:", insertErr);
    throw new Error(`parable_insert_failed: ${insertErr.message}`);
  }

  return parableId;
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const startTime = Date.now();

  // Environment check
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ success: false, error: "Server not configured" }, 500);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Parse payload
  let payload: ParableRequest;
  try {
    payload = await req.json();
  } catch {
    return json({ success: false, error: "Invalid request body" }, 400);
  }

  // Determine context from parable_directive.id
  const context = payload.parable_directive?.id || "standalone";
  
  // Check authentication
  const token = getBearerToken(req);
  let user: any = null;
  let isAnonymous = true;

  if (token) {
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (!userErr && userRes?.user) {
      user = userRes.user;
      isAnonymous = false;
    }
  }

  // =========================================================================
  // CONTEXT VALIDATION
  // =========================================================================
  
  // LessonSpark context requires authentication
  if (context === "lessonspark") {
    if (isAnonymous) {
      return json({ 
        success: false, 
        error: "Login required for lesson integration" 
      }, 401);
    }
    
    if (!payload.lesson_id) {
      return json({ 
        success: false, 
        error: "lesson_id is required for lessonspark context" 
      }, 400);
    }
  }

  // =========================================================================
  // ANONYMOUS FLOW
  // =========================================================================
  
  if (isAnonymous) {
    const ipAddress = getClientIP(req);
    console.log("Anonymous request from IP:", ipAddress);
    
    // Check daily limit (3/day)
    const anonUsage = await checkAnonymousLimit(supabaseAdmin, ipAddress, 3);
    
    if (!anonUsage.allowed) {
      return json({
        success: false,
        error: "Daily limit reached. You can generate more parables tomorrow, or create a free account for additional access.",
      }, 429);
    }

    try {
      // Apply anonymous defaults
      payload.theology_profile = ANONYMOUS_DEFAULTS.theology_profile;
      payload.bible_version = ANONYMOUS_DEFAULTS.bible_version;
      
      // Select directive (always standalone for anonymous)
      const systemInstruction = STANDALONE_DIRECTIVE;

      // Fetch news
      const keywords = extractKeywordsFromPassage(
        payload.bible_passage || "",
        payload.focus_point
      );
      const news = await fetchRelevantNews(keywords);

      // Build prompt
      const userPrompt = buildParablePrompt(payload, news, true);

      // Generate parable
      console.log("Generating parable for anonymous user");
      const parableText = await generateParableWithProvider(systemInstruction, userPrompt);
      const generationTimeMs = Date.now() - startTime;

      // Return without saving (anonymous parables are not stored)
      return json({
        success: true,
        parable: {
          parable_text: parableText,
          bible_passage: payload.bible_passage || "",
          news_headline: news?.title || "Contemporary scenario",
          news_source: news?.source_id || "generated",
          news_url: news?.link || "",
          news_date: news?.pubDate || null,
          news_location: news?.country?.[0] || null,
          word_count: countWords(parableText),
          generation_time_ms: generationTimeMs,
        },
        anonymous: true,
        usage: { 
          used: anonUsage.used, 
          limit: 3,
          remaining: anonUsage.remaining,
          limit_type: "daily"
        },
      });

    } catch (err) {
      console.error("Error generating anonymous parable:", err);
      const message = err instanceof Error ? err.message : "Internal error";
      return json({ success: false, error: message }, 500);
    }
  }

  // =========================================================================
  // AUTHENTICATED FLOW
  // =========================================================================
  
  const role = (user.app_metadata as any)?.role ?? null;
  const isAdmin = role === "admin";

  try {
    // ADMIN BYPASS - skip usage limits
    if (!isAdmin) {
      const monthlyLimit = Number(Deno.env.get("PARABLE_MONTHLY_LIMIT") ?? "7");
      const usage = await checkAuthenticatedLimit(supabaseAdmin, user.id, monthlyLimit);

      if (!usage.allowed) {
        return json({
          success: false,
          error: `You have reached your monthly limit of ${usage.limit} parables. Limit resets next month.`,
          usage: { used: usage.used, limit: usage.limit, remaining: usage.remaining },
        }, 429);
      }
    }

    // Load lesson context if LessonSpark (SSOT from database)
    if (context === "lessonspark" && payload.lesson_id) {
      const lessonContext = await loadLessonContext(supabaseAdmin, payload.lesson_id);
      if (lessonContext) {
        console.log("Loaded lesson context:", lessonContext);
        // Lesson context provides authoritative values
        // (Frontend payload used as fallback for non-lesson fields)
        if (lessonContext.bible_passage) {
          payload.bible_passage = lessonContext.bible_passage;
        }
        if (lessonContext.focused_topic) {
          payload.focus_point = lessonContext.focused_topic;
        }
        // Note: theology_profile_id, bible_version_id, age_group from lesson
        // would need to be resolved to full objects - for now, frontend provides these
      }
    }

    // Select directive based on context
    const systemInstruction = context === "lessonspark" 
      ? LESSONSPARK_DIRECTIVE 
      : STANDALONE_DIRECTIVE;

    // Fetch news
    const keywords = extractKeywordsFromPassage(
      payload.bible_passage || "",
      payload.focus_point
    );
    const news = await fetchRelevantNews(keywords);

    // Build prompt with full guardrails
    const userPrompt = buildParablePrompt(payload, news, false);

    // Generate parable
    console.log("Generating parable for authenticated user:", user.id);
    const parableText = await generateParableWithProvider(systemInstruction, userPrompt);
    const generationTimeMs = Date.now() - startTime;

    // Save to database
    const parableId = await saveParable(
      supabaseAdmin,
      user.id,
      payload,
      parableText,
      news,
      generationTimeMs
    );

    // Get updated usage for response
    const periodStart = billingPeriodStartISO();
    const { data: usageData } = await supabaseAdmin
      .from("user_parable_usage")
      .select("parables_this_month")
      .eq("user_id", user.id)
      .gte("billing_period_start", periodStart)
      .maybeSingle();
    
    const monthlyLimit = Number(Deno.env.get("PARABLE_MONTHLY_LIMIT") ?? "7");
    const currentUsed = usageData?.parables_this_month ?? 1;

    return json({
      success: true,
      parable: {
        id: parableId,
        parable_text: parableText,
        bible_passage: payload.bible_passage || "",
        news_headline: news?.title || "Contemporary scenario",
        news_source: news?.source_id || "generated",
        news_url: news?.link || "",
        news_date: news?.pubDate || null,
        news_location: news?.country?.[0] || null,
        word_count: countWords(parableText),
        generation_time_ms: generationTimeMs,
      },
      usage: isAdmin 
        ? { bypassed: true, role: "admin" }
        : { used: currentUsed, limit: monthlyLimit, remaining: Math.max(0, monthlyLimit - currentUsed) },
    });

  } catch (err) {
    console.error("Error generating parable:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ success: false, error: message }, 500);
  }
});
