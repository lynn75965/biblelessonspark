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
 * - Supports BOTH passage-based AND theme/focus-based lessons
 * - Moral valence pre-check (prevents inversion problem)
 * - Second-person devotional voice enforcement
 * - Target audience vocabulary adjustment
 * - Length-based word budgets
 * - Full theology profile guardrails
 * - Copyright-compliant Scripture handling
 * 
 * @version 1.1.0
 * @lastUpdated 2025-12-28
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SSOT Imports
import {
  getDevotionalTarget,
  getDevotionalLength,
  getDefaultDevotionalTarget,
  getDefaultDevotionalLength,
  generateCompleteDevotionalGuardrails,
  DEVOTIONAL_SECTIONS,
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
    const completeGuardrails = generateCompleteDevotionalGuardrails(
      target.id,
      length.id,
      theologyGuardrails,
      copyrightGuardrails
    );

    // ========================================================================
    // 5. BUILD PROMPT
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
      contentAnchor = `**Theme/Focus:** ${body.focused_topic}\n\n**Important:** Since no specific Scripture passage was provided, you must select an appropriate Scripture passage that best addresses this theme. State the passage you've selected clearly in the devotional.`;
      displayPassage = `Theme: ${body.focused_topic}`;
    }

    const systemPrompt = `You are a skilled devotional writer creating content for Baptist believers. Your writing speaks directly to the reader's heart, guiding them into personal reflection and prayer.

${completeGuardrails}

CRITICAL INSTRUCTIONS:
1. FIRST, analyze the Scripture passage (or theme) to identify its moral direction (virtue, cautionary, or complex)
2. LOCK that valence and maintain it throughout the devotional
3. Use second-person voice throughout ("you", "your")
4. Never use classroom or teaching language
5. End with a prayer prompt that flows naturally from the content
6. Respect the word count target: ${length.wordCountMin}-${length.wordCountMax} words total
${!hasPassage ? '\n7. IMPORTANT: Select an appropriate Scripture passage for the given theme and clearly identify it in your response.' : ''}`;

    const userPrompt = `Generate a ${length.label} devotional for ${target.label} audience based on:

${contentAnchor}

**Bible Version:** ${bibleVersion.name} (${bibleVersion.abbreviation})
**Theology Profile:** ${theologyProfile.name}

Please generate the devotional with these exact section headers:
1. **Contemporary Connection**
2. **Scripture in Context**
3. **Theological Insights**
4. **Reflection Questions**
5. **Prayer Prompt**

At the very beginning, before the sections, include:
**Title:** [A compelling, passage-specific title]
**Scripture:** [The Scripture reference being used]
**Detected Valence:** [virtue/cautionary/complex]

Then provide the five sections. Do not include word counts in the output.`;

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

    const generatedContent = anthropicData.content[0]?.text || "";
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

    // Extract detected valence
    const valenceMatch = generatedContent.match(/\*\*Detected Valence:\*\*\s*(virtue|cautionary|complex)/i);
    const detectedValence = valenceMatch ? valenceMatch[1].toLowerCase() : "complex";

    // Extract sections
    const extractSection = (content: string, sectionName: string): string => {
      const regex = new RegExp(`\\*\\*${sectionName}\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, "i");
      const match = content.match(regex);
      return match ? match[1].trim() : "";
    };

    const sectionContemporary = extractSection(generatedContent, "Contemporary Connection");
    const sectionScripture = extractSection(generatedContent, "Scripture in Context");
    const sectionTheological = extractSection(generatedContent, "Theological Insights");
    const sectionReflection = extractSection(generatedContent, "Reflection Questions");
    const sectionPrayer = extractSection(generatedContent, "Prayer Prompt");

    // Calculate word count
    const wordCount = generatedContent.split(/\s+/).filter(w => w.length > 0).length;

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
        section_contemporary_connection: sectionContemporary,
        section_scripture_in_context: sectionScripture,
        section_theological_insights: sectionTheological,
        section_reflection_questions: sectionReflection,
        section_prayer_prompt: sectionPrayer,
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
