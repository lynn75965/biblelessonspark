/**
 * TOOLBELT-REFLECT Edge Function
 * 
 * Generates pastoral reflections for Teacher Toolbelt tools using Claude AI.
 * 
 * SSOT Compliance:
 * - Imports from _shared/toolbeltConfig.ts
 * 
 * Key Features:
 * - No authentication required (public tools)
 * - Voice guardrails embedded in prompts
 * - Theological guardrails (conservative Baptist baseline)
 * - Logs usage to toolbelt_usage table
 * - Session-only results (never persists user inputs)
 * 
 * Voice Philosophy:
 * - Reflect, don't instruct
 * - Affirm, don't diagnose
 * - Pastoral tone always
 * - No BLS product mentions
 * 
 * @version 1.0.0
 * @lastUpdated 2026-01-28
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SSOT Imports
import {
  TOOLBELT_TOOLS,
  TOOLBELT_VOICE_GUARDRAILS,
  TOOLBELT_THEOLOGICAL_GUARDRAILS,
  TOOLBELT_THRESHOLDS,
  type ToolbeltToolId,
} from "../_shared/toolbeltConfig.ts";

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

interface ReflectRequest {
  tool_id: ToolbeltToolId;
  session_id: string;
  form_data: Record<string, unknown>;
}

interface ReflectResponse {
  success: boolean;
  reflection?: string;
  tool_name?: string;
  error?: string;
  code?: string;
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build the system prompt with voice and theological guardrails
 */
function buildSystemPrompt(): string {
  const voice = TOOLBELT_VOICE_GUARDRAILS;
  const theology = TOOLBELT_THEOLOGICAL_GUARDRAILS;

  return `${voice.role}

================================================================================
TONE REQUIREMENTS
================================================================================

${voice.toneRequirements.map(t => `- ${t}`).join('\n')}

================================================================================
ABSOLUTE PROHIBITIONS
================================================================================

${voice.prohibitions.map(p => `- ${p}`).join('\n')}

================================================================================
OUTPUT STRUCTURE
================================================================================

${voice.outputStructure}

================================================================================
THEOLOGICAL GUARDRAILS
================================================================================

Baseline: ${theology.baseline}

TOPICS YOU MUST AVOID (do not take positions on):
${theology.topicsToAvoid.map(t => `- ${t}`).join('\n')}

TOPICS YOU MAY AFFIRM:
${theology.topicsMayAffirm.map(t => `- ${t}`).join('\n')}

================================================================================
CLOSING PHRASES (Use one of these or something similar)
================================================================================

${voice.closingPhrases.map(p => `- "${p}"`).join('\n')}

================================================================================
CRITICAL REMINDERS
================================================================================

1. Write ONLY in flowing prose paragraphs. NO bullet points. NO numbered lists.
2. Do NOT ask any questions in your response.
3. Do NOT give advice or prescribe solutions.
4. Do NOT mention BibleLessonSpark or any product.
5. Reflect what the teacher is already sensing. Validate their discernment.
6. Keep your response to 2-3 reflective paragraphs plus a closing paragraph.
7. The teacher is NOT failing. They are paying attention. Honor that.`;
}

/**
 * Build user prompt for Lesson Fit tool
 */
function buildLessonFitPrompt(formData: Record<string, unknown>): string {
  const tool = TOOLBELT_TOOLS['lesson-fit'];
  
  return `A Bible teacher is using the "${tool.name}" reflection tool.

They have shared the following about their situation:

CLASS CONTEXT:
- Bible familiarity: ${formData.bibleFamiliarity || 'Not specified'}
- Engagement level: ${formData.engagementLevel || 'Not specified'}
- Time available: ${formData.timeAvailable || 'Not specified'} minutes
- Teaching environment: ${formData.teachingEnvironment || 'Not specified'}

CONCERNS ABOUT THE LESSON:
${Array.isArray(formData.concernsAboutLesson) 
  ? formData.concernsAboutLesson.map((c: string) => `- ${c.replace(/-/g, ' ')}`).join('\n')
  : '- Not specified'}

PRIMARY WORRY:
"${formData.primaryWorry || 'Not specified'}"

---

Generate a pastoral reflection that:
1. Starts with this exact headline: "${tool.headline}"
2. Names the patterns you observe in what they've shared
3. Validates their instinct that something feels misaligned
4. Reflects their discernment back to them without diagnosing or prescribing
5. Closes with affirmation of their attentiveness

Remember: They are not failing. They are paying attention. The mismatch they sense is real and worth honoring.`;
}

/**
 * Build user prompt for Left Out Safely tool
 */
function buildLeftOutPrompt(formData: Record<string, unknown>): string {
  const tool = TOOLBELT_TOOLS['left-out'];
  
  return `A Bible teacher is using the "${tool.name}" reflection tool.

They have shared the following about their situation:

WHAT MUST BE UNDERSTOOD TODAY:
"${formData.mustBeUnderstood || 'Not specified'}"

WHAT THEY HOPE STAYS WITH LEARNERS NEXT WEEK:
"${formData.hopeStaysNextWeek || 'Not specified'}"

WHAT FEELS HEAVY IN THE LESSON:
${Array.isArray(formData.feelsHeavy) 
  ? formData.feelsHeavy.map((h: string) => `- ${h.replace(/-/g, ' ')}`).join('\n')
  : '- Not specified'}

WHEN LESSONS FEEL TOO FULL, WHAT USUALLY HAPPENS:
"${formData.whenLessonsFull || 'Not specified'}"

CONCERNS ABOUT SIMPLIFYING:
"${formData.concernsAboutSimplifying || 'Not specified'}"

---

Generate a pastoral reflection that:
1. Starts with this exact headline: "${tool.headline}"
2. Names what they've already identified as essential
3. Validates their care about not leaving important things out
4. Reflects back that their discernment about weight is trustworthy
5. Closes with affirmation that clarity serves faithfulness

Remember: The weight they feel is real. Their instinct to simplify is not carelessness—it is care.`;
}

/**
 * Build user prompt for One Truth tool
 */
function buildOneTruthPrompt(formData: Record<string, unknown>): string {
  const tool = TOOLBELT_TOOLS['one-truth'];
  
  return `A Bible teacher is using the "${tool.name}" reflection tool.

They have shared the following about their lesson:

SCRIPTURE SCOPE:
"${formData.scriptureScope || 'Not specified'}"

WHAT SEEMS MOST CENTRAL:
"${formData.seemsMostCentral || 'Not specified'}"

WHAT THEY WANT LEARNERS TO UNDERSTAND:
"${formData.wantLearnersToUnderstand || 'Not specified'}"

HOW THE LESSON CURRENTLY FEELS:
"${formData.lessonFeels || 'Not specified'}"

THEIR CLOSEST ONE-SENTENCE SUMMARY:
"${formData.closestSummary || 'Not specified'}"

---

Generate a pastoral reflection that:
1. Starts with this exact headline: "${tool.headline}"
2. Reflects back the anchor truth they've already identified
3. Validates their instinct about what matters most
4. Names the clarity that's emerging in their preparation
5. Closes with affirmation that focused teaching honors Scripture

Remember: They have already found the anchor. Your role is to help them see what they've named.`;
}

/**
 * Build the appropriate user prompt based on tool_id
 */
function buildUserPrompt(toolId: ToolbeltToolId, formData: Record<string, unknown>): string {
  switch (toolId) {
    case 'lesson-fit':
      return buildLessonFitPrompt(formData);
    case 'left-out':
      return buildLeftOutPrompt(formData);
    case 'one-truth':
      return buildOneTruthPrompt(formData);
    default:
      throw new Error(`Unknown tool_id: ${toolId}`);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. INITIALIZE CLIENTS
    // ========================================================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    if (!anthropicApiKey) {
      console.error("[toolbelt-reflect] Missing ANTHROPIC_API_KEY");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error", code: "CONFIG_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // 2. PARSE REQUEST
    // ========================================================================

    const body: ReflectRequest = await req.json();
    
    console.log("[toolbelt-reflect] Request received:", {
      tool_id: body.tool_id,
      session_id: body.session_id?.substring(0, 8) + "...",
    });

    // Validate required fields
    if (!body.tool_id || !body.session_id || !body.form_data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: tool_id, session_id, form_data",
          code: "INVALID_REQUEST" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate tool_id
    if (!TOOLBELT_TOOLS[body.tool_id]) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid tool_id: ${body.tool_id}`,
          code: "INVALID_TOOL" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tool = TOOLBELT_TOOLS[body.tool_id];

    // ========================================================================
    // 3. BUILD PROMPTS
    // ========================================================================

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(body.tool_id, body.form_data);

    console.log("[toolbelt-reflect] Calling Anthropic API for tool:", tool.name);

    // ========================================================================
    // 4. CALL ANTHROPIC API
    // ========================================================================

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: TOOLBELT_THRESHOLDS.claudeModel,
        max_tokens: TOOLBELT_THRESHOLDS.maxTokensPerCall,
        messages: [
          { role: "user", content: userPrompt }
        ],
        system: systemPrompt,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("[toolbelt-reflect] Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "AI generation failed", code: "AI_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const reflection = anthropicData.content[0]?.text || "";
    const tokensUsed = (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0);

    console.log("[toolbelt-reflect] Reflection generated, tokens:", tokensUsed);

    // ========================================================================
    // 5. LOG USAGE
    // ========================================================================

    const { error: usageError } = await supabase
      .from("toolbelt_usage")
      .insert({
        tool_id: body.tool_id,
        session_id: body.session_id,
        tokens_used: tokensUsed,
      });

    if (usageError) {
      console.error("[toolbelt-reflect] Usage logging error:", usageError.message);
      // Non-fatal - reflection was generated successfully
    }

    const duration = Date.now() - startTime;
    console.log("[toolbelt-reflect] Success! Duration:", duration, "ms");

    // ========================================================================
    // 6. RETURN RESPONSE
    // ========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        reflection: reflection,
        tool_name: tool.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[toolbelt-reflect] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
