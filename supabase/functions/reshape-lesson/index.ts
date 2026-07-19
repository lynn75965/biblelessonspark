import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getCorsHeadersFromRequest } from '../_shared/corsConfig.ts';
import { checkLessonLimit } from '../_shared/subscriptionCheck.ts';
import { getTrialStatus, doesTrialApply, TrialStatus, TrialProfileRow } from '../_shared/trialConfig.ts';
import { getShapeById, ShapeId } from '../_shared/lessonShapeProfiles.ts';
import { RESHAPE_RULE } from '../_shared/featureFlags.ts';
import { ANTHROPIC_MODELS } from '../_shared/modelConfig.ts';
import { checkOrgPoolAccess, consumeFromOrgPool } from '../_shared/orgPoolCheck.ts';
import { callAnthropicNonStreaming, getForcedErrorClass, AnthropicUsage, BUSY_MESSAGE } from '../_shared/anthropicRetry.ts';
import { claimGenerationSlot, releaseGenerationSlot } from '../_shared/generationAdmission.ts';
import { logCapacityEvent } from '../_shared/capacityEvents.ts';

/**
 * reshape-lesson Edge Function (Session A -- reshape-as-lesson)
 *
 * Takes an existing full 8-section lesson and produces a reshaped version
 * saved as a NEW lessons row with reshape_of pointing to the parent.
 *
 * Enforcement chain (frontend drives backend):
 *   1. RESHAPE_RULE (SSOT in _shared/featureFlags.ts) gates eligibility:
 *      only lesson_type = 'full' can be reshaped.
 *   2. check_lesson_limit gates paid-user billing -- if at limit, refuse.
 *      The new lessons row IS the increment for paid users.
 *   3. For trial users, mirror generate-lesson's full-lesson billing:
 *      check trialStatus.fullAvailable, then increment trial_full_lessons_used
 *      and set trial_period_start if missing.
 *
 * Order of operations is non-negotiable: all gates run BEFORE the Anthropic
 * call. A user at limit must never receive shaped content.
 *
 * Response shape (success):
 *   { success: true, lesson: <new lessons row>, shaped_content: <text>, metadata: {...} }
 *
 * Response shape (limit/eligibility failure):
 *   { error, code? } with status 400 / 403 / 429.
 */

const ANTHROPIC_MODEL = ANTHROPIC_MODELS.default;
// Reshape takes a full 2000-3500 word source lesson as input and produces a
// similar-length output. The 140s single-attempt timeout empirically tuned
// here on 2026-05-18 (90s was too tight under real Anthropic latency; 180s
// was above Supabase's ~150s gateway ceiling and never fired, giving users a
// raw 504 instead of a graceful timeout body) now lives as
// RETRY_CONFIG.primaryAttemptTimeoutMs.reshapeLesson in
// _shared/modelConfig.ts (B4 -- retry/fallback), preserved unchanged as the
// first attempt's timeout so a healthy slow-but-successful reshape is never
// cut short.
const RESHAPE_MAX_TOKENS = 6000;
const RESHAPE_TEMPERATURE = 0.5;

interface ReshapeRequest {
  /** The full text of the original generated lesson */
  original_content: string;
  /** The assembled reshape prompt from lessonShapeProfiles.ts */
  reshape_prompt: string;
  /** The shape ID -- used for metrics, the title, and the new row */
  shape_id: string;
  /** The lessons table ID being reshaped (parent) */
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

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: dynamicCorsHeaders });
  }

  let metricId: string | undefined;
  let supabase: SupabaseClient;

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

    supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // =========================================================================
    // AUTH
    // =========================================================================
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

    // =========================================================================
    // LOAD PARENT LESSON (for lesson_type, filters, share flags, org, title)
    // =========================================================================
    const { data: parentLesson, error: parentError } = await supabase
      .from('lessons')
      .select('id, title, lesson_type, filters, shared_with_team, shared_with_org, organization_id, org_pool_consumed, audience_profile')
      .eq('id', lesson_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (parentError || !parentLesson) {
      console.error('Parent lesson lookup failed:', parentError);
      return new Response(
        JSON.stringify({ error: 'Original lesson not found' }),
        { status: 404, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // RESHAPE_RULE GATE -- SSOT enforcement
    // Only full 8-section lessons are eligible. Legacy rows where lesson_type
    // is null are treated as full (the migration backfill default).
    // =========================================================================
    const parentType = parentLesson.lesson_type ?? 'full';
    if (parentType !== RESHAPE_RULE.eligibleLessonType) {
      console.log(`Reshape blocked: parent lesson_type="${parentType}" not eligible`);
      return new Response(
        JSON.stringify({
          error: 'Only full lessons can be reshaped. Short trial lessons are not eligible.',
          code: 'NOT_RESHAPEABLE',
        }),
        { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    checkpoint = logTiming('Parent lesson loaded + eligibility gate passed', checkpoint);

    // =========================================================================
    // PRIOR RESHAPE LOOKUP -- anti-duplicate safeguard
    // If the user has already reshaped this same parent with the same shape,
    // the AI must produce a substantively different composition. Without this
    // hint Claude returns near-identical output for repeat (parent, shape)
    // pairs because the deterministic system prompt + identical source yields
    // identical generations.
    // =========================================================================
    const { data: priorReshapes } = await supabase
      .from('lessons')
      .select('id, original_text, created_at')
      .eq('reshape_of', parentLesson.id)
      .eq('shape_id', shape_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const hasPriorReshape = Array.isArray(priorReshapes) && priorReshapes.length > 0;
    if (hasPriorReshape) {
      console.log(`Prior reshape detected for parent=${parentLesson.id} shape=${shape_id} (id=${priorReshapes[0].id}). Appending anti-duplicate instruction.`);
    }

    checkpoint = logTiming('Prior reshape lookup', checkpoint);

    // =========================================================================
    // ADMIN BYPASS -- skip all billing/limit checks
    // =========================================================================
    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!adminCheck;

    if (isAdmin) {
      console.log('ADMIN BYPASS: User is admin, skipping all tier/limit checks');
    }

    // =========================================================================
    // BILLING / LIMIT CHECK -- BEFORE Anthropic call (Rule R3)
    // Reshape == generation: it consumes exactly 1 from the SAME bucket the
    // parent lesson was charged to (Shepherding Stage A). A parent that was
    // pool-funded (org_pool_consumed) draws the org pool; any other parent draws
    // the author's personal allowance (paid row-count or free trial credit).
    // There is no fresh funding declaration on reshape -- the bucket is inherited.
    // =========================================================================
    let userTier: string = 'free';
    let isTrialLesson = false;
    let trialProfileData: TrialProfileRow | null = null;
    let trialStatus: TrialStatus | null = null;

    // Inherit the parent lesson's funding bucket.
    const parentUsedPool = parentLesson.org_pool_consumed === true && !!parentLesson.organization_id;
    let useOrgPoolForReshape = false;
    let orgPoolOrgId: string | null = null;

    if (!isAdmin && parentUsedPool) {
      // Shepherd lesson -> reshape draws the org pool (checkOrgPoolAccess also
      // rolls the 30-day window forward if it has elapsed).
      const poolCheck = await checkOrgPoolAccess(supabase, user.id);

      if (!poolCheck.is_org_member || poolCheck.organization_id !== parentLesson.organization_id) {
        // Author has left the Shepherding group that funded the original lesson.
        return new Response(
          JSON.stringify({
            error: 'You are no longer a member of the Shepherding group that owns this lesson.',
            code: 'NOT_ORG_MEMBER',
          }),
          { status: 403, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!poolCheck.can_use_org_pool) {
        // Pool exhausted for the current 30-day window. Charge is locked to the
        // inherited bucket -- no fallback to the personal allowance.
        return new Response(
          JSON.stringify({
            error: 'Your Shepherding group lesson pool is empty for this period.',
            code: 'POOL_EXHAUSTED',
            organization_name: poolCheck.organization_name,
            pool_available: poolCheck.pool_status?.total_available ?? 0,
            lessons_limit: poolCheck.pool_status?.lessons_limit ?? 0,
            pool_period_start: poolCheck.pool_status?.pool_period_start ?? null,
          }),
          { status: 403, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      useOrgPoolForReshape = true;
      orgPoolOrgId = poolCheck.organization_id;
      userTier = 'personal';
      console.log('RESHAPE ORG POOL: parent was pool-funded; will consume from org pool', orgPoolOrgId);
    } else if (!isAdmin) {
      const limitCheck = await checkLessonLimit(supabase, user.id);
      console.log('Reshape limit check:', limitCheck);
      userTier = limitCheck.tier;

      if (!limitCheck.can_generate) {
        return new Response(
          JSON.stringify({
            error: 'Lesson limit reached',
            code: 'LIMIT_REACHED',
            lessons_used: limitCheck.lessons_used,
            lessons_limit: limitCheck.lessons_limit,
            tier: limitCheck.tier,
            reset_date: limitCheck.reset_date,
          }),
          { status: 403, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Platform mode resolves whether trial logic applies for this tier
      const { data: platformModeRow } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'current_phase')
        .single();
      const platformMode = (platformModeRow?.value || 'private_beta') as string;

      if (doesTrialApply(platformMode, userTier)) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('trial_period_start, trial_full_lessons_used, trial_short_lessons_used, trial_full_lesson_granted_until')
          .eq('id', user.id)
          .single();

        trialProfileData = profileData;
        trialStatus = getTrialStatus(
          profileData?.trial_period_start ?? null,
          profileData?.trial_full_lessons_used ?? 0,
          profileData?.trial_short_lessons_used ?? 0,
          profileData?.trial_full_lesson_granted_until ?? null
        );

        if (trialStatus.periodExpired) {
          await supabase
            .from('profiles')
            .update({ trial_full_lessons_used: 0, trial_short_lessons_used: 0, trial_period_start: null })
            .eq('id', user.id);
          // Refresh after reset
          trialStatus = getTrialStatus(
            null,
            0,
            0,
            profileData?.trial_full_lesson_granted_until ?? null
          );
        }

        // Reshape consumes a FULL credit (only full lessons are eligible).
        // Block if no full lesson credit remains.
        if (!(trialStatus.fullAvailable || trialStatus.isAdminGrant)) {
          return new Response(
            JSON.stringify({
              error: 'You have used all your free full lessons for this period.',
              code: 'TRIAL_EXHAUSTED',
              full_lessons_used: trialStatus.fullLessonsUsed,
              short_lessons_used: trialStatus.shortLessonsUsed,
              period_end: trialStatus.periodEnd?.toISOString() ?? null,
            }),
            { status: 403, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        isTrialLesson = true;
      }
    }

    checkpoint = logTiming('Billing / limit gates passed', checkpoint);

    // =========================================================================
    // METRICS -- Insert tracking row (status: 'processing')
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

    // =========================================================================
    // CALL CLAUDE API
    // Anti-duplicate suffix: when a prior reshape of the same (parent, shape)
    // exists, require a substantively different composition. Theology and
    // scripture basis stay constant; story/illustration/framing must differ.
    // =========================================================================
    const ANTI_DUPLICATE_SUFFIX = `\n\nIMPORTANT: A previous reshape of this lesson using this same format already exists. You MUST produce a substantially different composition. Use different narrative examples, different characters, different illustrations, and a different opening approach. The theological content and scripture basis must remain the same, but every story element, illustration, and narrative framing must be original and distinct from any previous version.`;

    const systemPrompt = hasPriorReshape
      ? reshape_prompt + ANTI_DUPLICATE_SUFFIX
      : reshape_prompt;
    const userPrompt = `Here is the original lesson to reshape:\n\n---BEGIN ORIGINAL LESSON---\n${original_content}\n---END ORIGINAL LESSON---\n\nReshape this lesson according to the format instructions provided. Produce both the teacher's preparation content and the group handout in the new format.`;

    console.log(`System prompt: ${systemPrompt.length} chars`);
    console.log(`User prompt: ${userPrompt.length} chars`);

    let reshapedContent = '';
    let tokensInput: number | null = null;
    let tokensOutput: number | null = null;
    let modelUsed: string = ANTHROPIC_MODEL;

    // =========================================================================
    // ADMISSION CONTROL (B8 Session 1) -- claim a concurrency slot before the
    // paid Anthropic call. Immediate-reject policy: reshape-lesson's own
    // 145s totalBudgetMs has no slack to carve a poll-wait out of.
    // =========================================================================
    const admission = await claimGenerationSlot(supabase, { source: 'reshape-lesson', userId: user.id });
    if (!admission.claimed) {
      await logCapacityEvent(supabase, {
        userId: user.id,
        source: 'reshape-lesson',
        eventType: admission.reason === 'cooldown' ? 'admission_cooldown_rejected' : 'admission_rejected',
        tier: userTier,
      });
      if (metricId) {
        await supabase
          .from('reshape_metrics')
          .update({
            reshape_end: new Date().toISOString(),
            reshape_duration_ms: Date.now() - functionStartTime,
            status: 'error',
            error_message: `Admission rejected: ${admission.reason}`,
          })
          .eq('id', metricId);
      }
      return new Response(JSON.stringify({ error: BUSY_MESSAGE, code: 'AI_TEMPORARILY_UNAVAILABLE' }), {
        status: 503,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const forcedErrorClass = getForcedErrorClass(req);
    let reshapeResult;
    try {
      reshapeResult = await callAnthropicNonStreaming({
        functionName: 'reshape-lesson',
        callLabel: 'reshape',
        callSite: 'reshapeLesson',
        apiKey: anthropicApiKey,
        primaryModel: ANTHROPIC_MODEL,
        fallbackModel: ANTHROPIC_MODELS.fallback,
        forcedErrorClass,
        buildBody: (model) => ({
          model,
          max_tokens: RESHAPE_MAX_TOKENS,
          temperature: RESHAPE_TEMPERATURE,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });
    } finally {
      await releaseGenerationSlot(supabase, admission.slotId);
    }

    checkpoint = logTiming('Anthropic API returned', checkpoint);

    if (!reshapeResult.ok) {
      console.error('Anthropic call failed after retries/fallback:', reshapeResult.errorClass);

      if (metricId) {
        await supabase
          .from('reshape_metrics')
          .update({
            reshape_end: new Date().toISOString(),
            reshape_duration_ms: Date.now() - functionStartTime,
            status: reshapeResult.errorClass === 'network' ? 'timeout' : 'error',
            rate_limited: reshapeResult.errorClass === 'rate_limit',
            anthropic_model: ANTHROPIC_MODEL,
            error_message: reshapeResult.error
          })
          .eq('id', metricId);
      }

      return new Response(JSON.stringify({
        error: reshapeResult.error,
        code: reshapeResult.code
      }), {
        status: 503,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      });
    }

    reshapedContent = reshapeResult.text;
    modelUsed = reshapeResult.modelUsed;
    const rawUsage = (reshapeResult.raw as { usage?: AnthropicUsage })?.usage;
    tokensInput = rawUsage?.input_tokens ?? null;
    tokensOutput = rawUsage?.output_tokens ?? null;

    const wordCount = reshapedContent.split(/\s+/).length;
    console.log(`Reshaped lesson: ${reshapedContent.length} chars, ${wordCount} words (model: ${modelUsed}, attempts: ${reshapeResult.attempts})`);
    console.log(`Tokens -- Input: ${tokensInput}, Output: ${tokensOutput}`);

    checkpoint = logTiming('Response parsed', checkpoint);

    // =========================================================================
    // BUILD AND INSERT THE NEW LESSON ROW
    // Reshape = first-class lessons row. reshape_of points back to parent.
    // Parent row is left untouched (shaped_content / shape_id on parent are
    // preserved as-is for backward compatibility with the existing viewer).
    // =========================================================================
    const shape = getShapeById(shape_id as ShapeId);
    const shapeName = shape?.name ?? shape_id;
    const parentTitle = (parentLesson.title && parentLesson.title.trim()) || 'Untitled Lesson';
    const newTitle = `${shapeName}: ${parentTitle}`;

    interface NewReshapeLessonRow {
      user_id: string;
      organization_id: string | null;
      title: string;
      original_text: string;
      source_type: string;
      filters: unknown;
      audience_profile: unknown;
      shared_with_team: boolean;
      shared_with_org: boolean;
      lesson_type: string;
      reshape_of: string;
      shape_id: string;
      org_pool_consumed: boolean;
    }

    const newLessonRow: NewReshapeLessonRow = {
      user_id: user.id,
      organization_id: parentLesson.organization_id ?? null,
      title: newTitle,
      original_text: reshapedContent,
      source_type: 'reshape',
      filters: parentLesson.filters ?? null,
      audience_profile: parentLesson.audience_profile ?? null,
      // Stage C: a reshaped variant inherits the parent's per-group sharing.
      shared_with_team: parentLesson.shared_with_team ?? false,
      shared_with_org: parentLesson.shared_with_org ?? false,
      lesson_type: 'full',
      reshape_of: parentLesson.id,
      shape_id: shape_id,
      // Inherit the parent's funding bucket; pool consumption happens below.
      org_pool_consumed: useOrgPoolForReshape,
      // shaped_content intentionally NULL: the reshape IS the shaped content.
    };

    const { data: insertedLesson, error: insertError } = await supabase
      .from('lessons')
      .insert(newLessonRow)
      .select()
      .single();

    if (insertError || !insertedLesson) {
      console.error('Failed to insert reshape lesson row:', insertError);

      if (metricId) {
        await supabase
          .from('reshape_metrics')
          .update({
            reshape_end: new Date().toISOString(),
            reshape_duration_ms: Date.now() - functionStartTime,
            status: 'error',
            anthropic_model: ANTHROPIC_MODEL,
            error_message: `Failed to save reshape: ${insertError?.message ?? 'unknown'}`
          })
          .eq('id', metricId);
      }

      throw new Error('Reshape generated but failed to save. Please try again.');
    }

    checkpoint = logTiming('New lesson row inserted', checkpoint);

    // =========================================================================
    // ORG POOL CONSUMPTION (Shepherding Stage A) -- reshape == generation
    // Parent was pool-funded -> draw exactly 1 from the org pool now that the
    // new row is safely persisted. Mutually exclusive with trial consumption
    // (the pool path sets isTrialLesson = false).
    // =========================================================================
    if (useOrgPoolForReshape && orgPoolOrgId) {
      const consumed = await consumeFromOrgPool(supabase, orgPoolOrgId);
      if (consumed) {
        console.log('Reshape org pool consumption successful for org:', orgPoolOrgId);
      } else {
        console.error('Reshape org pool consumption failed - this should not happen');
      }
    }

    // =========================================================================
    // TRIAL CONSUMPTION -- mirror generate-lesson L1124-1153
    // Paid users: the new lessons row IS the increment (check_lesson_limit
    // counts rows). Trial users need an explicit profiles update.
    // =========================================================================
    if (isTrialLesson && trialProfileData !== null) {
      const now = new Date().toISOString();
      const currentFull = trialStatus?.periodExpired ? 0 : (trialProfileData.trial_full_lessons_used ?? 0);
      const updateData: Record<string, unknown> = {
        trial_full_lessons_used: currentFull + 1,
      };
      if (!trialProfileData.trial_period_start || trialStatus?.periodExpired) {
        updateData.trial_period_start = now;
      }

      const { error: trialUpdateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (trialUpdateError) {
        console.error('CRITICAL: Trial counter increment failed for reshape, user:', user.id, 'error:', trialUpdateError.message);
      } else {
        console.log('Trial consumed (reshape -> full credit) for user:', user.id);
      }
    }

    // =========================================================================
    // METRICS -- success
    // =========================================================================
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

    // =========================================================================
    // RETURN -- new lesson row + shaped_content (kept for Session A viewer)
    // =========================================================================
    return new Response(JSON.stringify({
      success: true,
      lesson: insertedLesson,
      shaped_content: reshapedContent,
      shape_id: shape_id,
      metadata: {
        wordCount: reshapedContent.split(/\s+/).length,
        tokensInput,
        tokensOutput,
        model: modelUsed,
        temperature: RESHAPE_TEMPERATURE,
        generationTimeSeconds: ((Date.now() - functionStartTime) / 1000).toFixed(2),
      }
    }), {
      status: 200,
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logTiming('ERROR occurred at', functionStartTime);
    console.error('Error in reshape-lesson:', error);
    const err = error as { message?: string; toString(): string };

    if (typeof metricId !== 'undefined' && metricId && supabase) {
      await supabase
        .from('reshape_metrics')
        .update({
          reshape_end: new Date().toISOString(),
          reshape_duration_ms: Date.now() - functionStartTime,
          status: 'error',
          anthropic_model: ANTHROPIC_MODEL,
          error_message: err.message || 'Unknown error'
        })
        .eq('id', metricId);
    }

    return new Response(JSON.stringify({
      error: err.message || 'An unexpected error occurred',
      details: err.toString()
    }), {
      status: 500,
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
