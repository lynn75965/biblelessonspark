/**
 * GENERATE-DEVOTIONAL Edge Function
 * 
 * Generates personal devotionals anchored to lessons using Claude AI.
 * 
 * SSOT Compliance:
 * - Imports from _shared/devotionalConfig.ts
 * - Imports from _shared/theologyProfiles.ts
 * - Imports from _shared/bibleVersions.ts
 * 
 * Key Features:
 * - DevotionalSpark Signature Voice (Jan 2026 v2.1)
 * - Creates space for reader-induced insight
 * - Length-based experiential differentiation (3/5/10 min)
 * - Moral valence guardrails (prevents inversion)
 * - Light acknowledgment of God's abiding presence
 * - Direct Scripture quotation with proper citation
 * - Prayer always personal (I/me) and ends with Jesus
 * 
 * @version 2.1.0
 * @lastUpdated 2026-01-27
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SSOT Imports
import {
  getDevotionalTarget,
  getDevotionalLength,
  getDefaultDevotionalTarget,
  getDefaultDevotionalLength,
} from "../_shared/devotionalConfig.ts";

import {
  getTheologyProfile,
  getDefaultTheologyProfile,
  generateTheologicalGuardrails,
} from "../_shared/theologyProfiles.ts";

import {
  getBibleVersion,
  getDefaultBibleVersion,
  generateCopyrightGuardrails,
} from "../_shared/bibleVersions.ts";

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// TYPES
// ============================================================================

interface DevotionalRequest {
  // Content anchors - at least one required
  bible_passage?: string | null;
  focused_topic?: string | null;
  
  // User selections
  target_id?: string;
  length_id?: string;
  
  // Inherited from lesson (hidden)
  theology_profile_id?: string;
  bible_version_id?: string;
  age_group_id?: string;
  
  // Source lesson reference
  source_lesson_id?: string;
  lesson_title?: string;
}

interface DevotionalResponse {
  success: boolean;
  devotional?: {
    id: string;
    title: string;
    content: string;
    bible_passage: string;
    target_id: string;
    length_id: string;
    word_count: number;
    detected_valence: string;
  };
  error?: string;
  code?: string;
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build target audience instructions
 */
function buildTargetInstructions(targetId: string): string {
  const instructions: Record<string, string> = {
    preschool: `TARGET AUDIENCE: Preschool

- Written for a parent or teacher to read aloud to a young child
- Simple vocabulary, short sentences
- Concrete imagery (no abstractions)
- Warm, story-like narrative flow
- Prayer: simple, 1-2 sentences, words a child might echo
- Prayer ends with simple reference to Jesus (e.g., "Thank You for Jesus who loves me. Amen.")`,

    children: `TARGET AUDIENCE: Children

- At a child's reading level OR for parent/teacher to read
- Clear, accessible language
- Relatable moments from a child's world
- Prayer: uses words children understand
- Prayer ends with reference to Jesus in child-friendly language`,

    youth: `TARGET AUDIENCE: Youth

- Smooth, conversational tone that respects teen intelligence
- Acknowledges real struggles without being dramatic
- Creates space for their own reflection
- Prayer: honest, personal, avoids churchy clichés
- Prayer ends with genuine reference to Jesus and His work`,

    adult: `TARGET AUDIENCE: Adult

- Smooth, insightful prose—never pedantic
- Creates space for reader-induced insight
- Trusts the reader to bring their own experience
- Prayer: deeply personal (I/me), honest before God
- Prayer ends with varied, meaningful reference to Jesus and His finished work`
  };

  return instructions[targetId] || instructions.adult;
}

/**
 * Build length-specific instructions
 */
function buildLengthInstructions(lengthId: string, wordMin: number, wordMax: number): string {
  const instructions: Record<string, string> = {
    short: `LENGTH: 3-MINUTE DEVOTION (${wordMin}-${wordMax} words)

PURPOSE: Anchor the Heart
FEEL: A quiet moment. A single truth that stays.

REQUIREMENTS:
- ONE insight only—if you have two, choose the stronger
- ONE Scripture passage, clearly cited
- Minimal narrative; no extended context
- NO reflection questions
- Prayer: 2-3 sentences, personal (I/me), ends with Jesus

RHYTHM:
- Short sentences
- Open with a moment that creates recognition
- Let Scripture land gently
- Close with prayer that feels earned

DESIRED EFFECT: The reader carries one truth into the day.`,

    medium: `LENGTH: 5-MINUTE DEVOTION (${wordMin}-${wordMax} words)

PURPOSE: Shape the Daily Posture
FEEL: A companion for the morning. Space to breathe.

REQUIREMENTS:
- ONE theme, gently unfolded
- ONE primary Scripture with clear citation
- Light context only when it serves understanding
- 1-2 reflective movements (not listed points)
- Prayer: personal (I/me), unhurried, ends with Jesus

RHYTHM:
- Conversational flow, varied sentence length
- Open with human experience (universal, not hypothetical)
- Scripture illuminates rather than instructs
- Reflection invites rather than directs
- Prayer feels like it grew from what came before

DESIRED EFFECT: Spiritual steadiness. Attentiveness to God through the day.`,

    long: `LENGTH: 10-MINUTE DEVOTION (${wordMin}-${wordMax} words)

PURPOSE: Form the Inner Life
FEEL: Unhurried. Space to sit and be formed.

REQUIREMENTS:
- ONE theme explored from different angles
- Scripture with thoughtful context; clear citation
- Room for honesty and depth
- Reflection questions OR extended reflective space
- Prayer: contemplative, personal (I/me), ends with Jesus

RHYTHM:
- Rich but not dense
- Sentences that breathe
- Movement between observation and reflection
- Scripture engaged with care, not just quoted
- Prayer that brings the reader before God with all they've been pondering

DESIRED EFFECT: Stillness. Strengthened faith. Silence feels natural after reading.`
  };

  return instructions[lengthId] || instructions.medium;
}

/**
 * Build the complete system prompt with all anchor points
 */
function buildSystemPrompt(
  theologyGuardrails: string,
  copyrightGuardrails: string,
  targetInstructions: string,
  lengthInstructions: string,
  theologyProfileName: string
): string {
  return `You are generating a DevotionalSpark devotional that accompanies a BibleLessonSpark lesson.

Your role is NOT to teach or explain. The lesson has been taught. You help the reader internalize and live out its truth through reflective writing.

================================================================================
DEVOTIONALSPARK VOICE — THE HEART OF IT
================================================================================

Write with warmth, insight, and trust in the reader.

YOUR APPROACH:
- Create SPACE for the reader to bring their own experience
- Use universal human moments, not hypothetical "you probably felt..." scenarios
- Short sentences. Conversational rhythm. Prose that breathes.
- Smooth and insightful, never pedantic or structured
- Scripture illuminates—it doesn't drive an outline
- The reader should feel accompanied, not instructed

WHAT YOU MUST NOT DO:
- Do NOT fabricate first-person experiences ("I remember when...")
- Do NOT presume to know the reader's specific experience ("Perhaps you felt...")
- Do NOT lecture or teach
- Do NOT use bullet points or numbered lists in the devotion body
- Do NOT use "we" to insert yourself into the reader's life
- Do NOT create dense, academic paragraphs

WHAT YOU MAY DO:
- Describe universal human moments the reader recognizes
- Use "we" ONLY for genuine community ("we who have been found by grace...")
- Let observations open doors the reader walks through with their own story

EXAMPLE — WRONG (presumptuous):
"Perhaps it was the first time you prayed in a crowded restaurant, or spoke naturally about your faith to a curious neighbor..."

EXAMPLE — RIGHT (creates space):
"There's a weight that lifts when shame finally loosens its grip. Not all at once—just a conversation that flows easier, a truth spoken simply because it's true."

The reader supplies their own memory. You open the door; they walk through.

================================================================================
THE ABIDING PRESENCE OF GOD — LIGHT TOUCH
================================================================================

The reader is not alone. God is present. Acknowledge this with care:

- Woven through, not announced
- Felt, not proclaimed
- Aligned with ${theologyProfileName} tradition
- Aligned with what the Scripture reveals about God's character

CALIBRATION BY VALENCE:
- VIRTUE passages: presence as comfort, nearness ("You are held." / "Grace has arrived.")
- CAUTIONARY passages: presence as holy witness, mercy within truth ("He sees." / "Mercy still.")
- COMPLEX passages: presence in the tension ("Even here, not alone.")

NEVER: "God is RIGHT HERE with you NOW!" — this is overstatement.
The reader should finish aware they've been in God's presence because the reflection drew them there.

================================================================================
PRAYER — PERSONAL, ENDS WITH JESUS
================================================================================

CRITICAL REQUIREMENTS:

1. Prayer is PERSONAL: Use "I" and "me," not "we" and "us"
   - The reader prays as an individual before God
   - Not a collective gathered in prayer

2. Prayer is EARNED: It flows naturally from the reflection
   - Not appended or formulaic
   - Feels like the only right response to what came before

3. Prayer ALWAYS ends with reference to Jesus and His work
   - Varied, not ritualistic—different each time
   - Warm, not cold or abrupt
   - Never just "Amen" without acknowledging Christ

EXAMPLES OF PRAYER ENDINGS (vary these):
- "...through Jesus, whose grace found me when I had nothing to offer. Amen."
- "...because the cross already spoke what my words cannot. Amen."
- "...in the name of Jesus, who finished what I could never begin. Amen."
- "...through Christ, who stands even now as my advocate. Amen."
- "...because of Jesus, who was never ashamed to call me His own. Amen."
- "...through the One who carried what I could not. Amen."

================================================================================
MORAL VALENCE GUARDRAIL — CRITICAL
================================================================================

BEFORE WRITING:
1. Analyze the Scripture passage
2. Determine valence: VIRTUE / CAUTIONARY / COMPLEX
3. Hold that valence throughout—never invert

| Valence    | Scripture Type                        | Theme Direction                              |
|------------|---------------------------------------|----------------------------------------------|
| VIRTUE     | Grace, love, faith, promise passages  | Encouragement, hope, gratitude               |
| CAUTIONARY | Warning, judgment, conviction passages | Confession, humility, honest reckoning       |
| COMPLEX    | Passages with both elements           | Nuanced reflection honoring both dimensions  |

HARD RULES:
- Grace texts (Romans 8, Psalm 23, Ephesians 2) = VIRTUE only
- Judgment texts (Isaiah 14, Ezekiel 28) = CAUTIONARY only
- NEVER pair grace Scripture with guilt/condemnation themes
- NEVER pair judgment Scripture with celebration themes

================================================================================
THEOLOGY GUARDRAILS
================================================================================

${theologyGuardrails}

================================================================================
SCRIPTURE HANDLING
================================================================================

${copyrightGuardrails}

- Quote Scripture DIRECTLY from the selected version
- Always cite: book, chapter, verse, and version abbreviation
- Scripture illuminates—let it land, don't explain it to death
- Keep within fair use (~10 verses or fewer)
- Copyright notice will be auto-appended

================================================================================
${targetInstructions}
================================================================================

================================================================================
${lengthInstructions}
================================================================================

================================================================================
OUTPUT FORMAT
================================================================================

**Title:** [Compelling, passage-specific title]
**Scripture:** [Book Chapter:Verse(s)] ([Version abbreviation])

[Flowing devotional prose — NO section headers]

[Scripture woven naturally with clear citation]

[Reflection appropriate to length]

[Prayer: personal, earned, ends with Jesus]

PROHIBITIONS:
- No section headers
- No bullet points or numbered lists
- No "Detected Valence" in output
- No word count mentions
- No "In today's lesson..." or lesson references

================================================================================
FINAL CHECK
================================================================================

Before output, confirm:
□ Does the opening create space rather than presume?
□ Is the Scripture clearly cited?
□ Does the valence hold throughout?
□ Is the tone smooth and insightful, not pedantic?
□ Is God's presence felt lightly?
□ Is the prayer personal (I/me)?
□ Does the prayer end with Jesus?
□ Would this feel like reflection, not instruction?

If any answer is NO → revise.`;
}

/**
 * Build the user prompt
 */
function buildUserPrompt(
  lengthLabel: string,
  targetLabel: string,
  contentAnchor: string,
  bibleVersionName: string,
  bibleVersionAbbrev: string,
  theologyProfileName: string,
  lessonTitle: string | null,
  hasPassage: boolean
): string {
  let lessonContext = "";
  if (lessonTitle) {
    lessonContext = `
LESSON CONTEXT — FOR YOUR AWARENESS ONLY (never reference in output):
- Lesson Title: ${lessonTitle}

The reader should RESPOND to the lesson's truth, not revisit it.
Never say "In today's lesson..." or reference the lesson directly.
`;
  }

  const passageNote = !hasPassage 
    ? `\n\nSince no specific Scripture passage was provided, select an appropriate passage for this theme and state it clearly in the Scripture line.`
    : "";

  return `Generate a ${lengthLabel} devotional for ${targetLabel} audience.

${contentAnchor}

**Bible Version:** ${bibleVersionName} (${bibleVersionAbbrev})
**Theology Profile:** ${theologyProfileName}
${lessonContext}
Remember:
- Create space for reader-induced insight
- Smooth, conversational prose—no section headers
- Scripture quoted directly with clear citation
- Prayer is personal (I/me) and ends with reference to Jesus${passageNote}`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[generate-devotional] Request received");

  try {
    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[generate-devotional] No authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    if (!anthropicApiKey) {
      console.error("[generate-devotional] ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "API key not configured", code: "CONFIG_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token for auth check
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      console.error("[generate-devotional] User auth failed:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-devotional] User authenticated:", user.id);

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // 2. USAGE LIMIT CHECK
    // ========================================================================

    console.log("[generate-devotional] Checking usage limit");
    
    const { data: limitData, error: limitError } = await supabase
      .rpc("check_devotional_limit", { p_user_id: user.id });

    if (limitError) {
      console.error("[generate-devotional] Limit check error:", limitError.message);
      // Fail open - allow generation if limit check fails
    } else {
      const limitResult = Array.isArray(limitData) ? limitData[0] : limitData;
      console.log("[generate-devotional] Limit check result:", limitResult);
      
      if (limitResult && !limitResult.can_generate) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Monthly devotional limit reached",
            code: "LIMIT_REACHED",
            devotionals_used: limitResult.devotionals_used,
            devotionals_limit: limitResult.devotionals_limit,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ========================================================================
    // 3. PARSE REQUEST
    // ========================================================================

    const body: DevotionalRequest = await req.json();
    console.log("[generate-devotional] Request body:", JSON.stringify(body, null, 2));

    // Validate: Need either passage OR theme
    const hasPassage = body.bible_passage && body.bible_passage.trim().length > 0;
    const hasTheme = body.focused_topic && body.focused_topic.trim().length > 0;

    if (!hasPassage && !hasTheme) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Either a Bible passage or theme/focus is required", 
          code: "INVALID_REQUEST" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve options with defaults
    const target = getDevotionalTarget(body.target_id || "") || getDefaultDevotionalTarget();
    const length = getDevotionalLength(body.length_id || "") || getDefaultDevotionalLength();
    const theologyProfile = getTheologyProfile(body.theology_profile_id || "") || getDefaultTheologyProfile();
    const bibleVersion = getBibleVersion(body.bible_version_id || "") || getDefaultBibleVersion();

    console.log("[generate-devotional] Resolved options:", {
      target: target.id,
      length: length.id,
      theologyProfile: theologyProfile.id,
      bibleVersion: bibleVersion.id,
      hasPassage,
      hasTheme,
    });

    // ========================================================================
    // 4. BUILD GUARDRAILS
    // ========================================================================

    const theologyGuardrails = generateTheologicalGuardrails(theologyProfile.id);
    const copyrightGuardrails = generateCopyrightGuardrails(bibleVersion.id);
    const targetInstructions = buildTargetInstructions(target.id);
    const lengthInstructions = buildLengthInstructions(length.id, length.wordCountMin, length.wordCountMax);

    // ========================================================================
    // 5. BUILD PROMPTS
    // ========================================================================

    // Build content anchor description
    let contentAnchor = "";
    let displayPassage = "";

    if (hasPassage && hasTheme) {
      contentAnchor = `**Scripture Passage:** ${body.bible_passage}\n**Theme/Focus:** ${body.focused_topic}`;
      displayPassage = `${body.bible_passage} (${body.focused_topic})`;
    } else if (hasPassage) {
      contentAnchor = `**Scripture Passage:** ${body.bible_passage}`;
      displayPassage = body.bible_passage!;
    } else {
      contentAnchor = `**Theme/Focus:** ${body.focused_topic}`;
      displayPassage = `Theme: ${body.focused_topic}`;
    }

    const systemPrompt = buildSystemPrompt(
      theologyGuardrails,
      copyrightGuardrails,
      targetInstructions,
      lengthInstructions,
      theologyProfile.name
    );

    const userPrompt = buildUserPrompt(
      length.label,
      target.label,
      contentAnchor,
      bibleVersion.name,
      bibleVersion.abbreviation,
      theologyProfile.name,
      body.lesson_title || null,
      hasPassage
    );

    console.log("[generate-devotional] Calling Anthropic API");

    // ========================================================================
    // 6. CALL ANTHROPIC API
    // ========================================================================

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          { role: "user", content: userPrompt }
        ],
        system: systemPrompt,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("[generate-devotional] Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "AI generation failed", code: "AI_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicData = await anthropicResponse.json();
    console.log("[generate-devotional] Anthropic response received");

    let generatedContent = anthropicData.content[0]?.text || "";
    const tokensInput = anthropicData.usage?.input_tokens || 0;
    const tokensOutput = anthropicData.usage?.output_tokens || 0;

    // ========================================================================
    // 7. PARSE GENERATED CONTENT
    // ========================================================================

    // Extract title
    const titleMatch = generatedContent.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : `Devotional: ${displayPassage}`;

    // Extract scripture reference (may be different from input if theme-based)
    const scriptureMatch = generatedContent.match(/\*\*Scripture:\*\*\s*(.+?)(?:\n|$)/);
    const extractedScripture = scriptureMatch ? scriptureMatch[1].trim() : displayPassage;

    // Detect valence internally (for database tracking only - not shown to user)
    const contentLower = generatedContent.toLowerCase();
    let detectedValence = "complex"; // default
    const virtueIndicators = ["grace", "love", "hope", "peace", "joy", "comfort", "held", "blessing", "promise", "faith"];
    const cautionaryIndicators = ["warning", "caution", "conviction", "humble", "repent", "confess", "judgment", "holy"];
    
    let virtueScore = 0;
    let cautionaryScore = 0;
    virtueIndicators.forEach(word => { if (contentLower.includes(word)) virtueScore++; });
    cautionaryIndicators.forEach(word => { if (contentLower.includes(word)) cautionaryScore++; });
    
    if (virtueScore > cautionaryScore + 2) detectedValence = "virtue";
    else if (cautionaryScore > virtueScore + 2) detectedValence = "cautionary";

    // Calculate word count
    const wordCount = generatedContent.split(/\s+/).filter(w => w.length > 0).length;

    // Append copyright notice if Bible version requires it
    if (bibleVersion.copyrightNotice && !generatedContent.includes(bibleVersion.copyrightNotice)) {
      generatedContent = generatedContent + "\n\n---\n\n*" + bibleVersion.copyrightNotice + "*";
    }

    const generationDuration = Date.now() - startTime;

    // ========================================================================
    // 8. SAVE TO DATABASE
    // ========================================================================

    console.log("[generate-devotional] Saving to database");

    const { data: devotional, error: insertError } = await supabase
      .from("devotionals")
      .insert({
        user_id: user.id,
        source_lesson_id: body.source_lesson_id || null,
        bible_passage: extractedScripture,
        target_id: target.id,
        length_id: length.id,
        theology_profile_id: theologyProfile.id,
        bible_version_id: bibleVersion.id,
        age_group_id: body.age_group_id || null,
        title: title,
        content: generatedContent,
        word_count: wordCount,
        generation_duration_ms: generationDuration,
        anthropic_model: "claude-sonnet-4-20250514",
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        detected_valence: detectedValence,
        status: "completed",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[generate-devotional] Database insert error:", insertError.message);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save devotional", code: "DB_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // 9. INCREMENT USAGE
    // ========================================================================

    console.log("[generate-devotional] Incrementing usage");
    
    const { error: usageError } = await supabase
      .rpc("increment_devotional_usage", { p_user_id: user.id });

    if (usageError) {
      console.error("[generate-devotional] Usage increment error:", usageError.message);
      // Non-fatal - devotional was generated successfully
    }

    // ========================================================================
    // 10. RETURN SUCCESS
    // ========================================================================

    console.log("[generate-devotional] Success! Duration:", generationDuration, "ms");

    return new Response(
      JSON.stringify({
        success: true,
        devotional: {
          id: devotional.id,
          title: title,
          content: generatedContent,
          bible_passage: extractedScripture,
          target_id: target.id,
          length_id: length.id,
          word_count: wordCount,
          detected_valence: detectedValence,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-devotional] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
