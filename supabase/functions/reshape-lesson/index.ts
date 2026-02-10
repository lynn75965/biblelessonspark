import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getCorsHeadersFromRequest } from '../_shared/corsConfig.ts';

/**
 * reshape-lesson Edge Function
 *
 * Purpose: Takes an already-generated lesson and reshapes it into a different
 * pedagogical format using the Lesson Shapes system.
 *
 * Architecture: Pure Claude API relay. Frontend drives backend.
 * - Frontend assembles the reshape prompt from lessonShapeProfiles.ts (SSOT)
 * - Frontend sends original_content + reshape_prompt to this function
 * - This function authenticates, calls Claude, returns reshaped content
 * - Frontend writes shaped_content + shape_id to lessons table
 *
 * Metrics: Writes to reshape_metrics table for cost analysis and usage tracking.
 *
 * This function does NOT write to lessons — frontend handles that.
 *
 * @since Phase 27 — Lesson Shapes
 */

// Model constant — same as generate-lesson for consistency
// Can be changed to a lighter model if reshape quality holds
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

// Reshape is lighter than generation — 90s timeout is generous
const RESHAPE_TIMEOUT_MS = 90000;

// Reshaped output should be similar length to original lesson
// Original lessons run 2000–3500 words ≈ 2600–4550 tokens
// 6000 max_tokens provides comfortable headroom
const RESHAPE_MAX_TOKENS = 6000;

// Slightly lower temperature than generation (0.6) for faithful restructuring
const RESHAPE_TEMPERATURE = 0.5;

interface ReshapeRequest {
  /** The full text of the original generated lesson */
  original_content: string;
  /** The assembled reshape prompt from lessonShapeProfiles.ts (guardrail + shape instructions) */
  reshape_prompt: string;
  /** The shape ID — used for metrics and logging */
  shape_id: string;
  /** The lessons table ID being reshaped — used for metrics audit trail */
  lesson_id: string;
}

function logTiming(label: string, startTime: number): number {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[TIMING] ${label}: ${elapsed}s`);
  return Date.now();
}

serve(async (req) => {
  const functionStartTime = Date.now();
  const dynamicCorsHeaders = getCorsHeadersFromRequest(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: dynamicCorsHeaders });
  }

  let metricId: string | undefined;
  let supabase: any;

  try {
    let checkpoint = functionStartTime;

    // =========================================================================
    // ENVIRONMENT
    // =========================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // =========================================================================
    // AUTH — Same pattern as generate-lesson
    // =========================================================================
    supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    checkpoint = logTiming('Auth completed', checkpoint);

    // =========================================================================
    // PARSE REQUEST
    // =========================================================================
    const { original_content, reshape_prompt, shape_id, lesson_id }: ReshapeRequest = await req.json();

    if (!original_content || !reshape_prompt || !shape_id || !lesson_id) {
      return new Response(
        JSON.stringify({ error: 'original_content, reshape_prompt, shape_id, and lesson_id are all required' }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Reshape request: shape_id="${shape_id}", lesson_id="${lesson_id}", user="${user.id}"`);
    console.log(`Original content: ${original_content.length} chars (~${Math.round(original_content.length / 4)} tokens)`);
    console.log(`Reshape prompt: ${reshape_prompt.length} chars`);

    // =========================================================================
    // METRICS — Insert tracking row (status: 'processing')
    // Same pattern as generate-lesson with generation_metrics
    // =========================================================================
    try {
      const { data: metricRow } = await supabase
        .from('reshape_metrics')
        .insert({
          user_id: user.id,
          lesson_id: lesson_id,
          shape_id: shape_id,
          status: 'processing',
          reshape_start: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (metricRow) {
        metricId = metricRow.id;
        console.log('Reshape metric created:', metricId);
      }
    } catch (metricError) {
      // Metrics failure should never block reshaping
      console.error('Failed to create reshape metric (non-blocking):', metricError);
    }

    checkpoint = logTiming('Metrics row inserted', checkpoint);

    // =========================================================================
    // BUILD PROMPTS
    // =========================================================================

    // System prompt: The reshape instructions from the SSOT file
    // This contains the universal guardrail + shape-specific instructions
    const systemPrompt = reshape_prompt;

    // User prompt: The original lesson content to reshape
    const userPrompt = `Here is the original lesson to reshape:\n\n---BEGIN ORIGINAL LESSON---\n${original_content}\n---END ORIGINAL LESSON---\n\nReshape this lesson according to the format instructions provided. Produce both the teacher's preparation content and the student handout in the new format.`;

    console.log(`System prompt: ${systemPrompt.length} chars (~${Math.round(systemPrompt.length / 4)} tokens)`);
    console.log(`User prompt: ${userPrompt.length} chars (~${Math.round(userPrompt.length / 4)} tokens)`);

    checkpoint = logTiming('Prompt built', checkpoint);

    // =========================================================================
    // CALL CLAUDE API — Same pattern as generate-lesson
    // =========================================================================
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[TIMEOUT] Aborting Anthropic request after ${RESHAPE_TIMEOUT_MS / 1000} seconds`);
      controller.abort();
    }, RESHAPE_TIMEOUT_MS);

    try {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: RESHAPE_MAX_TOKENS,
          temperature: RESHAPE_TEMPERATURE,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      clearTimeout(timeoutId);
      checkpoint = logTiming('Anthropic API returned', checkpoint);

      // Handle rate limiting
      if (anthropicResponse.status === 429) {
        const errorData = await anthropicResponse.text();
        console.error('Anthropic API rate limited:', errorData);

        if (metricId) {
          await supabase
            .from('reshape_metrics')
            .update({
              reshape_end: new Date().toISOString(),
              reshape_duration_ms: Date.now() - functionStartTime,
              status: 'error',
              rate_limited: true,
              anthropic_model: ANTHROPIC_MODEL,
              error_message: 'Anthropic API rate limit exceeded (429)'
            })
            .eq('id', metricId);
        }

        throw new Error('Service temporarily busy. Please try again in a few minutes.');
      }

      // Handle other API errors
      if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.text();
        console.error('Anthropic API error:', errorData);
        throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorData}`);
      }

      // Parse response
      const anthropicData = await anthropicResponse.json();
      const reshapedContent = anthropicData.content[0].text;
      const wordCount = reshapedContent.split(/\s+/).length;

      const tokensInput = anthropicData.usage?.input_tokens || null;
      const tokensOutput = anthropicData.usage?.output_tokens || null;

      console.log(`Reshaped lesson: ${reshapedContent.length} chars, ${wordCount} words`);
      console.log(`Anthropic usage: ${JSON.stringify(anthropicData.usage)}`);
      console.log(`Tokens — Input: ${tokensInput}, Output: ${tokensOutput}`);

      checkpoint = logTiming('Response parsed', checkpoint);

      // =====================================================================
      // METRICS — Update with success
      // =====================================================================
      if (metricId) {
        await supabase
          .from('reshape_metrics')
          .update({
            reshape_end: new Date().toISOString(),
            reshape_duration_ms: Date.now() - functionStartTime,
            status: 'completed',
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            anthropic_model: ANTHROPIC_MODEL,
          })
          .eq('id', metricId);
      }

      logTiming('TOTAL FUNCTION TIME', functionStartTime);

      // =====================================================================
      // RETURN RESHAPED CONTENT
      // Frontend handles writing to lessons table (frontend drives backend)
      // =====================================================================
      return new Response(JSON.stringify({
        success: true,
        shaped_content: reshapedContent,
        shape_id: shape_id,
        metadata: {
          wordCount,
          tokensInput,
          tokensOutput,
          model: ANTHROPIC_MODEL,
          temperature: RESHAPE_TEMPERATURE,
          generationTimeSeconds: ((Date.now() - functionStartTime) / 1000).toFixed(2),
        }
      }), {
        status: 200,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.error(`Anthropic API timeout after ${RESHAPE_TIMEOUT_MS / 1000} seconds`);

        if (metricId) {
          await supabase
            .from('reshape_metrics')
            .update({
              reshape_end: new Date().toISOString(),
              reshape_duration_ms: Date.now() - functionStartTime,
              status: 'timeout',
              anthropic_model: ANTHROPIC_MODEL,
              error_message: `Anthropic API timeout after ${RESHAPE_TIMEOUT_MS / 1000} seconds`
            })
            .eq('id', metricId);
        }

        throw new Error('Lesson reshaping timed out. Please try again.');
      }
      throw fetchError;
    }

  } catch (error) {
    logTiming('ERROR occurred at', functionStartTime);
    console.error('Error in reshape-lesson:', error);

    // Update metrics with error status
    if (typeof metricId !== 'undefined' && metricId && supabase) {
      await supabase
        .from('reshape_metrics')
        .update({
          reshape_end: new Date().toISOString(),
          reshape_duration_ms: Date.now() - functionStartTime,
          status: 'error',
          anthropic_model: ANTHROPIC_MODEL,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', metricId);
    }

    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
