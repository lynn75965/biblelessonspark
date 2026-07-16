import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { LESSON_STRUCTURE_VERSION, getRequiredSections, getOptionalSections, getTotalMinWords, getTotalMaxWords, getTeaserSection } from '../_shared/lessonStructure.ts';
import { AGE_GROUPS } from '../_shared/ageGroups.ts';
import { THEOLOGY_PROFILES, generateTheologicalGuardrails } from '../_shared/theologyProfiles.ts';
import { BIBLE_VERSIONS, generateCopyrightGuardrails, getDefaultBibleVersion } from '../_shared/bibleVersions.ts';
import { buildCustomizationDirectives } from '../_shared/customizationDirectives.ts';
import { validateLessonRequest } from '../_shared/validation.ts';
import { checkLessonLimit, incrementLessonUsage } from '../_shared/subscriptionCheck.ts';
import { parseDeviceType, parseBrowser, parseOS } from '../_shared/generationMetrics.ts';
import { 
  buildFreshnessContext, 
  selectFreshElements, 
  selectFreshTeaserElements,
  buildFreshnessSuggestionsPrompt,
  buildTeaserFreshnessPrompt,
  generateTeaserContentGuardrails,
  buildConsistentStyleContext,
  buildStyleExtractionPrompt,
  parseStyleMetadata,
  removeStyleMetadataFromContent,
  FreshnessSuggestions,
  TeaserFreshnessSuggestions,
  SeriesStyleMetadata
} from '../_shared/freshnessOptions.ts';
import { PLATFORM_MODE_ACCESS, ORG_TYPES, LESSON_FUNDING, DEFAULT_LESSON_FUNDING, isValidLessonFunding, LessonFunding } from '../_shared/organizationConfig.ts';
// ============================================================
// TRIAL: Updated to rolling 30-day period (3 full + 2 short)
// ============================================================
import { TRIAL_CONFIG, getTrialStatus, doesTrialApply, TrialStatus } from '../_shared/trialConfig.ts';
// Phase 13.6: Organization Pool Check
import { checkOrgPoolAccess, consumeFromOrgPool, OrgPoolCheckResult } from '../_shared/orgPoolCheck.ts';
// Output Guardrails: Post-generation truth & integrity verification (SSOT: outputGuardrails.ts)
import { checkOutputGuardrails, buildRewritePrompt, parseLessonSections, replaceSections, GuardrailCheckResult, OUTPUT_GUARDRAILS_VERSION, REWRITE_CONFIG } from '../_shared/outputGuardrails.ts';
// Scripture Integrity Guardrail (Rule 5) -- SSOT: src/constants/scriptureIntegrityGuardrail.ts
import { SCRIPTURE_INTEGRITY_GUARDRAIL } from '../_shared/scriptureIntegrityGuardrail.ts';
import { ANTHROPIC_MODELS } from '../_shared/modelConfig.ts';
import { callAnthropicNonStreaming, openAnthropicStreamWithRetry, getForcedErrorClass } from '../_shared/anthropicRetry.ts';
import { logCapacityEvent } from '../_shared/capacityEvents.ts';
// Section-shape SSOT (Phase 1). Full = [1..8], Short = [1,5,8]. This is the
// first edge function to import the _shared mirror at runtime.
import { FULL_SECTIONS, SHORT_SECTIONS } from '../_shared/lessonTiers.ts';

import { getCorsHeadersFromRequest, PRODUCTION_ORIGINS, DEVELOPMENT_ORIGINS } from '../_shared/corsConfig.ts';

// Legacy corsHeaders for backward compatibility - dynamic version preferred
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://biblelessonspark.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Anthropic model constant for tracking (value sourced from model-ID SSOT)
const ANTHROPIC_MODEL = ANTHROPIC_MODELS.default;

// B8: shown to the teacher whenever Phase 2 (Sections 6-8 + Teaser) fails
// or is truncated -- the core lesson (Sections 1-5) is always trustworthy
// regardless of which reason triggered this message. Lynn-approved wording.
const SUPPLEMENTS_INCOMPLETE_MESSAGE =
  'One or more supplemental sections may be incomplete. Your core lesson is complete and ready to use.';



function logTiming(label: string, startTime: number): number {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[TIMING] ${label}: ${elapsed}s`);
  return Date.now();
}

function buildSectionsPrompt(sections: ReturnType<typeof getRequiredSections>, includeTeaser: boolean = false) {
  return sections.map((section) => {
    const rules = section.contentRules.map((r) => `    \u2022 ${r}`).join('\n');
    const prohibitions = section.prohibitions.map((p) => `    \u2022 ${p}`).join('\n');
    const redundancyNote = section.redundancyLock.length > 0
      ? `\n    \u26A0\uFE0F REDUNDANCY LOCK: Do NOT repeat content from: ${section.redundancyLock.join(', ')}`
      : '';
    const optionalNote = section.optional ? '\n    \u2022 OPTIONAL SECTION - Only include when requested' : '';

    let enforcementNote = '';
    if (section.id === 5) {
      enforcementNote = `

\u26A0\uFE0F CRITICAL ENFORCEMENT FOR THIS SECTION:
1. REQUIRED RANGE: ${section.minWords}-${section.maxWords} words -- stay at or above ${section.minWords}; do NOT exceed ${section.maxWords}
2. Achieve depth through DENSITY, not length -- pack insight into each sentence
3. If explaining a concept, give the WHY and HOW, not just the WHAT
4. Anticipate follow-up questions and answer them preemptively
5. Connect abstract theology to concrete life application
6. Give teachers substance to answer student questions confidently

\u{1F6AB} FORBIDDEN - These do NOT count toward word target:
- Repetition of content from other sections
- Transitional phrases ("As we discussed...", "Moving on...")
- Padding sentences that add no value
- Circular reasoning or restating the same point
- Generic statements without specific application

\u2713 REQUIRED - Every sentence must do ONE of these:
- Unpack a theological concept with depth
- Explain WHY something matters (not just that it does)
- Give concrete examples or applications
- Anticipate and answer "What do you mean by that?"
- Draw from Section 3's depth and make it spoken/teachable
- Bridge abstract truth to student's real-world experience

\u26A0\uFE0F QUALITY CHECK: Before finishing this section, ask yourself:
"Could a volunteer teacher use this to answer student questions with confidence?"
If not, tighten and clarify -- do NOT add length. When the teaching is complete within the range, STOP.`;
    }

    return `
## Section ${section.id}: ${section.name}
**Purpose:** ${section.purpose}${optionalNote}${enforcementNote}
**WORD COUNT:** ${section.minWords}-${section.maxWords} words -- HARD MAXIMUM ${section.maxWords}; do NOT exceed it.

**MUST INCLUDE:**
${rules}

**PROHIBITED:**
${prohibitions}${redundancyNote}
`;
  }).join('\n---\n');
}

function buildTruthGuardrails() {
  return `
-------------------------------------------------------------------------------
\u26A0\uFE0F TRUTH AND INTEGRITY GUARDRAILS (APPLIES TO ALL SECTIONS)
-------------------------------------------------------------------------------

YOU ARE GENERATING CONTENT FOR BIBLE TEACHERS WHO WILL READ THIS VERBATIM TO THEIR CLASS.
If you fabricate a fact, a teacher will unknowingly present a lie to their students.
This is a matter of ministerial integrity \u2014 treat it with absolute seriousness.

RULE 1: NEVER FABRICATE CURRENT EVENTS
- Do NOT invent news stories, infrastructure projects, research studies, surveys, or statistics
- Do NOT write "You may have seen the news about..." followed by a made-up event
- Do NOT claim something "happened this week" or "recently" unless it is a well-known, verifiable historical fact
- Do NOT invent quotes attributed to project managers, researchers, pastors, teachers, or any person real or fictional

RULE 2: NEVER ASSUME LOCAL KNOWLEDGE
- Do NOT reference "our state", "our city", "our community", or "our area" as if describing a real local event
- Do NOT assume knowledge of the teacher's geographic location, local news, or regional context
- You have NO knowledge of current events \u2014 do not pretend otherwise

RULE 3: ALL ILLUSTRATIONS MUST BE HONEST
Every illustration, story, or example in the lesson MUST be one of these:
  \u2705 CLEARLY HYPOTHETICAL: "Imagine you're...", "Think about a time when...", "Picture this..."
  \u2705 UNIVERSAL HUMAN EXPERIENCE: "Most of us have felt...", "We've all had moments where..."
  \u2705 VERIFIABLE HISTORICAL FACT: Well-known events that can be independently confirmed
  \u2705 BIBLICAL NARRATIVE: Stories and examples directly from Scripture
  \u274C NEVER: A made-up news story, fake quote, invented statistic, or fabricated current event

RULE 4: WHEN IN DOUBT, USE HYPOTHETICAL FRAMING
- If you want to illustrate a point with a modern scenario, ALWAYS frame it as hypothetical
- Say "Imagine a construction foreman..." NOT "A construction foreman recently said..."
- Say "Think about what it would be like..." NOT "This week in our state..."

${SCRIPTURE_INTEGRITY_GUARDRAIL}

These rules are NON-NEGOTIABLE and override any other instruction to be "current" or "relevant."
Integrity matters more than engagement. A teacher's credibility depends on it.
`;
}

function buildCompressionRules(includeTeaser: boolean = false, sections: any[] | null = null) {
  const targetSections = sections ?? getRequiredSections();
  const baseWordMin = targetSections.reduce((sum: number, s: any) => sum + s.minWords, 0);
  const baseWordMax = targetSections.reduce((sum: number, s: any) => sum + s.maxWords, 0);

  return `
-------------------------------------------------------------------------------
OUTPUT COMPRESSION & QUALITY RULES
-------------------------------------------------------------------------------

RULE 1: REDUNDANCY PREVENTION BY ARCHITECTURE
- Section 3 (Theological Background) contains ALL deep theology
- Sections 4, 5, 6, 7, 8 must REFERENCE Section 3, never REPEAT it
- If you explained a concept in Section 3, do NOT explain it again

RULE 2: WORD BUDGET ENFORCEMENT (HARD CAP)
- Each section has MANDATORY min/max word limits - RESPECT BOTH THE MIN AND THE MAX
- Total target for this generation: ${baseWordMin}-${baseWordMax} words
- HARD CAP: do NOT exceed ${baseWordMax + 100} words total across the sections generated in
  this call. Stop when the lesson is complete -- do not pad, do not over-explain, do not
  exceed any section maximum.
- Going over budget causes timeouts and truncation failures

RULE 3: SECTION PURPOSE INTEGRITY
- Each section has ONE purpose - fulfill it, nothing more
- Teacher transcript (Section 5) = SPOKEN WORDS only, MINIMUM 630 words
- Student handout (Section 8) = FRESH content, not copied from teacher sections

RULE 4: NO PADDING, NO FILLER
- Every sentence must add value
- No "As we discussed earlier..."
- No "This is important because..."
- No transitional fluff between sections

RULE 5: VALUE DENSITY REQUIREMENT
Every word must earn its place. Prohibited filler:
- "It's important to note that..."
- "As mentioned earlier..."
- "This is significant because..."
- "Let's take a moment to..."
- Empty transitional phrases

Instead: Get to the point immediately. State insights directly.

RULE 6: NO WORD COUNT METADATA
Do NOT include word count information in section headers or anywhere in the output.
`;
}


function buildTeaserInstructions(includeTeaser: boolean, teaserFreshness: TeaserFreshnessSuggestions | null = null): string {
  if (!includeTeaser) return '';

  const teaserSection = getTeaserSection();
  if (!teaserSection) return '';

  const rules = teaserSection.contentRules.map((r) => `    \u2022 ${r}`).join('\n');
  const prohibitions = teaserSection.prohibitions.map((p) => `    \u2022 ${p}`).join('\n');

  const freshnessDirectives = teaserFreshness 
    ? buildTeaserFreshnessPrompt(teaserFreshness)
    : '';

  const contentGuardrails = generateTeaserContentGuardrails();

  return `
-------------------------------------------------------------------------------
STUDENT TEASER (PRE-LESSON ANNOUNCEMENT)
-------------------------------------------------------------------------------

**CRITICAL:** This teaser will be extracted and displayed separately at the TOP of the lesson.
Output the teaser at the beginning using this EXACT format:

**STUDENT TEASER**
[50-100 word teaser content here]

---

After the teaser and separator, continue with Section 1.
Do NOT repeat the teaser content anywhere else in the lesson.

**Purpose:** ${teaserSection.purpose}

**MUST INCLUDE:**
${rules}

**PROHIBITED:**
${prohibitions}

${freshnessDirectives}

${contentGuardrails}

BAPTIST TERMINOLOGY REQUIREMENT:
- Use "ordinance" or "practice" - NEVER use "ritual" or "sacrament"
- Use "Lord's Supper" - NEVER use "Eucharist" or "mass"  
- Use "pastor" or "minister" - NEVER use "priest"
- Use "Lord's table" - NEVER use "altar" (for church furniture)

REQUIRED SIGNOFF:
- End with a compelling reason to attend WITHOUT revealing content
- Use time-neutral language: "next time we meet" or "when we gather" (NOT "Sunday")
- Focus on the benefit of discovering answers, not what will be taught
- Create urgency through curiosity, not promotional language

SIGNOFF EXAMPLES:
\u274C WRONG: "Join us Sunday to learn about God's plan!"
\u2713 RIGHT: "When we gather, we'll explore this together. I think you'll find some clarity."

FINAL QUALITY CHECK:
Before outputting the teaser, verify:
1. Does it contain ANY words from the prohibited lists? \u2192 REWRITE
2. Could this teaser work for 10+ different lessons? \u2192 If no, make it MORE generic
3. Does it reveal the Bible passage, topic, or doctrine? \u2192 REWRITE
4. Does it use "Ever wonder/feel/notice"? \u2192 REWRITE with different opener

REMEMBER:
- ONLY touch on emotions and questions the student already feels
- Create a gap that ONLY attending class can fill
- Output teaser ONCE at the beginning, then move to Section 1
`;
}

serve(async (req) => {
  const functionStartTime = Date.now();
  
  const dynamicCorsHeaders = getCorsHeadersFromRequest(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: dynamicCorsHeaders });
  }

  let metricId: string | undefined;
  let supabase: any;

  try {
    let checkpoint = functionStartTime;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid token');
    }

    checkpoint = logTiming('Auth completed', checkpoint);

    // =========================================================================
    // PARSE REQUEST BODY EARLY (funding declaration gates the org-pool path)
    // The body is parsed here (not later) because the lesson_funding declaration
    // decides whether the Shepherding pool is drawn. requestData is reused by
    // validateLessonRequest further down -- req.json() must run exactly once.
    // =========================================================================
    const requestData = await req.json();

    // Funding declaration (FE drives BE). Default PERSONAL so the shared pool is
    // never drawn unintentionally; unaffiliated users never send a declaration.
    const rawFunding = (requestData?.lesson_funding ?? '').toString();
    const lessonFunding: LessonFunding = isValidLessonFunding(rawFunding)
      ? rawFunding
      : DEFAULT_LESSON_FUNDING;
    console.log('Lesson funding declaration:', lessonFunding, '(raw:', rawFunding || '<none>', ')');

    // =========================================================================
    // ADMIN BYPASS CHECK
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
    // ORGANIZATION POOL CHECK -- DECLARATION-KEYED (Shepherding Stage A)
    // The org pool is drawn ONLY when the member explicitly declared 'shepherd'
    // at lesson initiation. A 'personal' declaration -- and every unaffiliated
    // user, who never sends one -- falls through to the personal/trial gating
    // below. The two buckets are ADDITIVE, never mutually exclusive. The charge
    // is locked to the declaration: a 'shepherd' declaration with an empty pool
    // is refused (no silent fallback to the personal allowance).
    // =========================================================================
    let orgPoolResult: OrgPoolCheckResult | null = null;
    let useOrgPool = false;

    if (!isAdmin && lessonFunding === LESSON_FUNDING.shepherd) {
      orgPoolResult = await checkOrgPoolAccess(supabase, user.id);

      if (!orgPoolResult.is_org_member) {
        // Declared the pool but is not in a Shepherding group. Defensive guard:
        // the frontend never offers 'shepherd' to a non-member.
        console.log('Shepherd funding declared by a non-member; refusing.');
        return new Response(JSON.stringify({
          error: 'You are not a member of a Shepherding group.',
          code: 'NOT_ORG_MEMBER',
        }), {
          status: 403,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!orgPoolResult.can_use_org_pool) {
        // Pool exhausted for the current 30-day window. Charge is locked to the
        // declaration -- do NOT fall back to the personal allowance.
        console.log('Shepherd pool empty for org:', orgPoolResult.organization_id);
        return new Response(JSON.stringify({
          error: 'Your Shepherding group lesson pool is empty for this period.',
          code: 'POOL_EXHAUSTED',
          organization_name: orgPoolResult.organization_name,
          pool_available: orgPoolResult.pool_status?.total_available ?? 0,
          lessons_limit: orgPoolResult.pool_status?.lessons_limit ?? 0,
          pool_period_start: orgPoolResult.pool_status?.pool_period_start ?? null,
        }), {
          status: 403,
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
        });
      }

      useOrgPool = true;
      console.log('ORG POOL: shepherd declaration accepted; will consume from organization pool', {
        organization_id: orgPoolResult.organization_id,
        organization_name: orgPoolResult.organization_name,
        pool_available: orgPoolResult.pool_status?.total_available ?? 0,
      });
    }

    checkpoint = logTiming('Org pool check completed', checkpoint);

    // =========================================================================
    // SUBSCRIPTION & LIMIT CHECK (skipped for admins, modified for org pool)
    // =========================================================================
    let userTier = isAdmin ? 'admin' : 'free';

    if (!isAdmin) {
      if (useOrgPool) {
        // User is using org pool - they get full tier access
        userTier = 'personal';
        console.log('Org pool user gets full tier access');
      } else {
        // check_lesson_limit is used here ONLY for tier resolution and
        // PAID-tier gating. Free users are gated by the trial counters
        // (TRIAL_EXHAUSTED) in the platform-mode block below -- NOT by the flat
        // RPC lessons_used counter. One authoritative free counter lives in
        // profiles.trial_full/short_lessons_used. (Decision 5)
        const limitCheck = await checkLessonLimit(supabase, user.id);
        console.log('Subscription check:', limitCheck);

        if (limitCheck.checkFailed) {
          await logCapacityEvent(supabase, {
            userId: user.id,
            source: 'generate-lesson',
            eventType: 'quota_denied_failclosed',
          });
          return new Response(JSON.stringify({
            error: "We're experiencing a lot of activity right now. Please try again in a few minutes \u2014 your lesson allowance is unaffected.",
            code: 'CAPACITY_UNAVAILABLE'
          }), {
            status: 503,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
          });
        }

        userTier = limitCheck.tier;

        if (userTier !== 'free' && !limitCheck.can_generate) {
          await logCapacityEvent(supabase, {
            userId: user.id,
            source: 'generate-lesson',
            eventType: 'quota_denied',
            tier: limitCheck.tier,
            meta: { lessons_used: limitCheck.lessons_used, lessons_limit: limitCheck.lessons_limit },
          });
          return new Response(JSON.stringify({
            error: 'Lesson limit reached',
            code: 'LIMIT_REACHED',
            lessons_used: limitCheck.lessons_used,
            lessons_limit: limitCheck.lessons_limit,
            tier: limitCheck.tier,
            reset_date: limitCheck.reset_date
          }), {
            status: 403,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    checkpoint = logTiming('Subscription check completed', checkpoint);

    // =========================================================================
    // PLATFORM MODE & SECTION FILTERING
    // =========================================================================
    const { data: platformModeRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'current_phase')
      .single();
    
    const platformMode = (platformModeRow?.value || 'private_beta') as keyof typeof PLATFORM_MODE_ACCESS;
    const modeConfig = PLATFORM_MODE_ACCESS[platformMode] || PLATFORM_MODE_ACCESS.private_beta;
    
    console.log('Platform mode:', platformMode, 'Tier enforcement:', modeConfig.tierEnforcement, 'Is Admin:', isAdmin);
    
    let sectionsToGenerate: number[];
    let isTrialLesson = false;
    let isFullTrialLesson = false;
    let trialProfileData: any = null;
    let trialStatus: TrialStatus | null = null;
    
    if (isAdmin) {
      sectionsToGenerate = getRequiredSections().map(s => s.id);
      console.log('Admin bypass: Full access to all sections');
    } else if (useOrgPool) {
      // ORG POOL: Full sections when using org pool
      sectionsToGenerate = getRequiredSections().map(s => s.id);
      console.log('Org pool: Full access to all sections');
    } else if (!modeConfig.tierEnforcement) {
      sectionsToGenerate = getRequiredSections().map(s => s.id);
      console.log('Beta mode: All users get all sections');
    } else {
      if (doesTrialApply(platformMode, userTier)) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('trial_period_start, trial_full_lessons_used, trial_short_lessons_used, trial_full_lesson_granted_until')
          .eq('id', user.id)
          .single();

        trialProfileData = profileData;
        trialStatus = getTrialStatus(
          profileData?.trial_period_start             ?? null,
          profileData?.trial_full_lessons_used        ?? 0,
          profileData?.trial_short_lessons_used       ?? 0,
          profileData?.trial_full_lesson_granted_until ?? null
        );

        // If period expired, reset counts immediately so next lesson starts fresh
        if (trialStatus.periodExpired) {
          await supabase
            .from('profiles')
            .update({ trial_full_lessons_used: 0, trial_short_lessons_used: 0, trial_period_start: null })
            .eq('id', user.id);
          console.log('Trial period expired \u2014 counts reset for user:', user.id);
        }

        if (trialStatus.fullAvailable || trialStatus.isAdminGrant) {
          // Full (8-section) lesson available
          sectionsToGenerate = getRequiredSections().map(s => s.id);
          isTrialLesson = true;
          isFullTrialLesson = true;
          console.log('Trial: Free user gets full 8 sections');
        } else if (trialStatus.shortAvailable) {
          // Full lessons exhausted -- short (3-section) lesson available.
          // SSOT: short section set comes from lessonTiers SHORT_SECTIONS.
          sectionsToGenerate = [...SHORT_SECTIONS];
          isTrialLesson = true;
          isFullTrialLesson = false;
          console.log('Trial: Full lessons exhausted -- generating short 3-section lesson');
        } else {
          // Both full and short exhausted for this period
          return new Response(JSON.stringify({
            error:              'Lesson limit reached',
            code:               'TRIAL_EXHAUSTED',
            message:            'You have used all your free lessons for this period.',
            full_lessons_used:  trialStatus.fullLessonsUsed,
            short_lessons_used: trialStatus.shortLessonsUsed,
            period_end:         trialStatus.periodEnd?.toISOString() ?? null,
          }), {
            status: 403,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        // Paid individual tiers get the full 8-section lesson.
        // SSOT: full section set comes from lessonTiers FULL_SECTIONS.
        sectionsToGenerate = [...FULL_SECTIONS];
        console.log('Production mode: User tier', userTier, 'gets sections:', sectionsToGenerate);
      }
    }
    
    const allRequiredSections = getRequiredSections();
    const filteredSections = allRequiredSections.filter(s => sectionsToGenerate.includes(s.id));
    
    console.log('Sections to generate:', filteredSections.map(s => s.id + ': ' + s.name));

    // Capture metrics
    const userAgent = req.headers.get('user-agent') || '';
    const deviceType = parseDeviceType(userAgent);
    const browser = parseBrowser(userAgent);
    const os = parseOS(userAgent);
    
    const { data: metricRecord } = await supabase
      .from('generation_metrics')
      .insert({
        user_id: user.id,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        os: os,
        generation_start: new Date().toISOString(),
        tier_requested: 'full',
        sections_requested: 8,
        status: 'started',
        organization_id: orgPoolResult?.organization_id || null
      })
      .select('id')
      .single();
    
    metricId = metricRecord?.id;

    // requestData was parsed earlier (funding declaration gate). Validate it now.
    const validatedData = validateLessonRequest(requestData);
    const {
      bible_passage,
      focused_topic,
      extracted_content,
      age_group,
      theology_profile_id,
      bible_version_id,
      additional_notes,
      teaching_style,
      lesson_length,
      activity_types,
      language = 'english',
      class_setting,
      learning_environment,
      student_experience,
      cultural_context,
      special_needs,
      lesson_sequence,
      assessment_style,
      learning_style,
      education_experience,
      emotional_entry,
      theological_lens,
      generate_teaser = false,
      freshness_mode = 'fresh',
      include_liturgical = false,
      include_cultural = false,
      freshness_suggestions = null,
      extract_style_metadata = false,
      series_style_context = null,
      audience_profile = null
    } = validatedData;

    // ---------------------------------------------------------------------
    // TEASER BINDING (server-enforced -- Decision 4)
    // The teaser is a FULL-lesson feature only. Short lessons NEVER include a
    // teaser, regardless of what the request body asked for. isFullLesson is
    // true for every generation path except the free-trial short lesson
    // (the only path that sets isTrialLesson && !isFullTrialLesson). All
    // downstream teaser logic uses effectiveTeaser, never raw generate_teaser.
    // ---------------------------------------------------------------------
    const isFullLesson = !(isTrialLesson && !isFullTrialLesson);
    const effectiveTeaser = isFullLesson ? generate_teaser : false;
    if (generate_teaser && !effectiveTeaser) {
      console.log('Teaser requested but suppressed: short lessons never include a teaser');
    }

    // Two-phase generation: full 8-section lessons only.
    // Phase 1 = S1-S5 (doctrinal core, streamed); Phase 2 = S6-S8+Teaser (derived supplements).
    const usesTwoPhase = isFullLesson && filteredSections.length === 8;
    const phase1Sections = usesTwoPhase
      ? filteredSections.filter((s: any) => s.id <= 5)
      : filteredSections;
    const phase1SectionCount = phase1Sections.length;

    if (!bible_passage && !focused_topic && !extracted_content) {
      throw new Error('Either bible_passage, focused_topic, or extracted_content is required');
    }

    if (!age_group) {
      throw new Error('age_group is required');
    }

    if (!theology_profile_id) {
      throw new Error('theology_profile_id is required');
    }

    const theologyProfile = THEOLOGY_PROFILES.find((p) => p.id === theology_profile_id);
    if (!theologyProfile) {
      throw new Error(`Theology profile not found: ${theology_profile_id}`);
    }

    const ageGroupData = AGE_GROUPS.find((ag) => ag.id === age_group);
    if (!ageGroupData) {
      throw new Error(`Age group not found: ${age_group}`);
    }

    const effectiveBibleVersionId = bible_version_id || getDefaultBibleVersion().id;
    const bibleVersion = BIBLE_VERSIONS.find((v) => v.id === effectiveBibleVersionId);
    if (!bibleVersion) {
      throw new Error(`Bible version not found: ${effectiveBibleVersionId}`);
    }

    // =========================================================================
    // FRESHNESS SYSTEM
    // =========================================================================
    const skipTeachingAngle = !!teaching_style;
    const skipActivityFormat = activity_types && activity_types.length > 0;
    const skipApplicationContext = !!class_setting || !!learning_environment;
    
    let selectedFreshness: FreshnessSuggestions | null = null;
    let selectedTeaserFreshness: TeaserFreshnessSuggestions | null = null;
    let freshnessPromptAddition = '';
    
    if (freshness_mode === 'fresh') {
      selectedFreshness = selectFreshElements(
        [],
        5,
        skipTeachingAngle,
        skipActivityFormat,
        skipApplicationContext
      );
      freshnessPromptAddition = buildFreshnessSuggestionsPrompt(selectedFreshness, freshness_mode);
      
      console.log('Freshness suggestions selected:', selectedFreshness);
      if (selectedFreshness.skippedDueToCustomization.length > 0) {
        console.log('Elements skipped (teacher specified in Step 3):', selectedFreshness.skippedDueToCustomization);
      }
      
      if (effectiveTeaser) {
        selectedTeaserFreshness = selectFreshTeaserElements([], 5);
        console.log('Teaser freshness suggestions selected:', selectedTeaserFreshness);
      }
    }

    // =========================================================================
    // CONSISTENT STYLE MODE
    // =========================================================================
    let consistentStylePromptAddition = '';
    let styleExtractionPromptAddition = '';
    
    if (extract_style_metadata) {
      styleExtractionPromptAddition = buildStyleExtractionPrompt();
      console.log('Style extraction requested (Lesson 1 of series with Consistent Style Mode)');
    }
    
    if (series_style_context) {
      consistentStylePromptAddition = buildConsistentStyleContext(series_style_context as SeriesStyleMetadata);
      console.log('Consistent style context provided:', series_style_context);
    }

    const totalSections = filteredSections.length;

    console.log('Generating lesson:', {
      user: user.id,
      theology: theologyProfile.name,
      bibleVersion: bibleVersion.name,
      copyrightStatus: bibleVersion.copyrightStatus,
      quoteType: bibleVersion.quoteType,
      ageGroup: ageGroupData.label,
      passage: bible_passage,
      topic: focused_topic,
      hasExtractedContent: !!extracted_content,
      extractedContentLength: extracted_content?.length || 0,
      extractedContentPreview: extracted_content?.substring(0, 500) || 'NONE',
      sectionCount: totalSections,
      includeTeaser: effectiveTeaser,
      wordTarget: `${getTotalMinWords()}-${getTotalMaxWords()}${effectiveTeaser ? ' (+50-100 for teaser)' : ''}`,
      extractStyleMetadata: extract_style_metadata,
      hasSeriesStyleContext: !!series_style_context,
      usingOrgPool: useOrgPool,
      organizationId: orgPoolResult?.organization_id || null
    });

    const customizationDirectives = buildCustomizationDirectives({
      teaching_style,
      learning_style,
      lesson_length,
      class_setting,
      learning_environment,
      student_experience,
      cultural_context,
      special_needs,
      lesson_sequence,
      assessment_style,
      activity_types,
      language,
      education_experience,
      emotional_entry,
      theological_lens
    });

    const copyrightGuardrails = generateCopyrightGuardrails(bibleVersion.id);

    // =========================================================================
    // PROMPT ASSEMBLY (three system blocks: static | theology | dynamic)
    //
    // Block 1 -- staticSystemPrefix (no cache_control)
    //   Framework guardrails + lesson structure + output format.
    //   Varies by section-shape (full vs short) only.
    //
    // Block 2 -- theologyBlock (cache_control: ephemeral HERE)
    //   Theology profile name + summary + generateTheologicalGuardrails().
    //   Varies by theology profile.
    //   Placing cache_control on this block makes Anthropic cache blocks 1+2
    //   together as the prefix. Cache key = shape x theology-profile
    //   (24 variants across 12 profiles x 2 shapes). Repeat generators on
    //   the same profile share the prefix and pay cache-read rates (0.1x).
    //
    // Block 3 -- dynamicRemainder (no cache_control)
    //   Age group, ministry context, bible version, copyright, customization,
    //   freshness, style. Unique per request -- never cached.
    //
    // Byte-identity guarantee: block1 + block2 + block3 assembles to exactly
    // the same string as the prior two-block layout for the same inputs.
    // No prompt wording was changed; only the cache boundary moved.
    //
    // Prompt caching is GA (no anthropic-beta header); min cacheable prefix
    // on sonnet-4-6 is 2048 tokens. Block 1 alone is ~3,803 tok; adding
    // block 2 brings the cached prefix to ~5,150 tok.
    // =========================================================================
    // Phase 1 (two-phase): suppress teaser in system prefix; Phase 2 handles it.
    const phase1EffectiveTeaser = usesTwoPhase ? false : effectiveTeaser;
    const staticSystemPrefix = `You are a Baptist Bible study lesson generator using the BibleLessonSpark Framework.

${buildCompressionRules(phase1EffectiveTeaser, phase1Sections)}

${buildTruthGuardrails()}

-------------------------------------------------------------------------------
LESSON STRUCTURE (EXACTLY ${phase1SectionCount} SECTIONS)
-------------------------------------------------------------------------------
${buildSectionsPrompt(phase1Sections, phase1EffectiveTeaser)}

-------------------------------------------------------------------------------
OUTPUT REQUIREMENTS
-------------------------------------------------------------------------------
Generate all ${phase1SectionCount} sections in order. Follow EXACT formatting:

## Section N: [Section Name]

[Section content following rules above]

---

Each section separated by "---" on its own line.
Meet ALL word minimums. Respect ALL word maximums. Do NOT exceed any section maximum.
`;

    // Block 2: per-theology-profile static content. Cache boundary is here.
    const theologyBlock = `-------------------------------------------------------------------------------
THEOLOGY PROFILE: ${theologyProfile.name}
-------------------------------------------------------------------------------
${theologyProfile.summary}

${generateTheologicalGuardrails(theologyProfile.id)}`;

    // Block 3: per-request dynamic content. Never cached.
    // For two-phase: teaser instructions suppressed in Phase 1; Phase 2 uses the full block.
    // Both share the same template; only the teaser line differs.
    const buildDynamicRemainder = (includeTeaserInBlock: boolean) => `

-------------------------------------------------------------------------------
AGE GROUP: ${ageGroupData.label}
-------------------------------------------------------------------------------
${ageGroupData.promptGuidance}

-------------------------------------------------------------------------------
MINISTRY CONTEXT
-------------------------------------------------------------------------------
Role: ${audience_profile?.role || 'Teacher'}
Gathering: ${audience_profile?.assembly || 'Class'}
Participants: ${audience_profile?.participant || 'Students'}

Use these terms consistently throughout all sections of this lesson when referring
to the leader, the group, and the people in it. Do NOT use alternate terms like
"class" when the gathering is "Congregation", or "teacher" when the role is "Pastor".
Never mention Sunday School unless the content specifically requires it.

-------------------------------------------------------------------------------
BIBLE VERSION: ${bibleVersion.name} (${bibleVersion.abbreviation})
-------------------------------------------------------------------------------
Copyright Status: ${bibleVersion.copyrightStatus}
Quote Type: ${bibleVersion.quoteType}

${copyrightGuardrails}

${customizationDirectives}

${buildTeaserInstructions(includeTeaserInBlock ? effectiveTeaser : false, includeTeaserInBlock ? selectedTeaserFreshness : null)}

${buildFreshnessContext(new Date(), freshness_mode, include_liturgical, include_cultural)}

${freshnessPromptAddition}

${consistentStylePromptAddition}

${styleExtractionPromptAddition}
`;

    // Phase 1: suppress teaser in Block 3 (no contradiction with user prompt)
    // Phase 2: full Block 3 with teaser (passed when building Phase 2 system)
    const dynamicRemainder = buildDynamicRemainder(!usesTwoPhase);

    let lessonInput = bible_passage || focused_topic || '';
    if (bible_passage && focused_topic) {
      lessonInput = `${bible_passage} - ${focused_topic}`;
    }

    const bibleVersionInstruction = `\n\nIMPORTANT: Use the ${bibleVersion.name} (${bibleVersion.abbreviation}) for ALL Scripture quotations and references.`;

    let teaserInstruction = '';
    // Teaser goes in Phase 2 for two-phase full lessons; suppressed in Phase 1.
    if (effectiveTeaser && !usesTwoPhase) {
      teaserInstruction = '\n\nINCLUDE STUDENT TEASER: Generate the student teaser section at the beginning, before Section 1.';
    }

    let userPrompt: string;
    const phaseOneLabel = usesTwoPhase
      ? `${phase1SectionCount}-section core`
      : `complete ${phase1SectionCount}-section`;
    const phaseOneStop = usesTwoPhase
      ? '\n\nCRITICAL: Generate ONLY Sections 1, 2, 3, 4, and 5. STOP after completing Section 5. Do NOT generate Section 6, 7, 8, or any student teaser.'
      : '';

    if (extracted_content) {
      userPrompt = `Generate a ${phaseOneLabel} Baptist Bible study lesson based on this curriculum content:\n\n---BEGIN CURRICULUM CONTENT---\n${extracted_content}\n---END CURRICULUM CONTENT---\n\n${bible_passage ? `Primary Passage: ${bible_passage}\n` : ''}${focused_topic ? `Focus Topic: ${focused_topic}\n` : ''}${additional_notes ? `Teacher Notes: ${additional_notes}` : ''}${bibleVersionInstruction}${teaserInstruction}${phaseOneStop}`;
    } else if (bible_passage && focused_topic) {
      userPrompt = `Generate a ${phaseOneLabel} Baptist Bible study lesson for:\n\nBible Passage: ${bible_passage}\nTheme/Focus: ${focused_topic}${additional_notes ? `\nTeacher Notes: ${additional_notes}` : ''}${bibleVersionInstruction}${teaserInstruction}${phaseOneStop}`;
    } else if (bible_passage) {
      userPrompt = `Generate a ${phaseOneLabel} Baptist Bible study lesson for:\n\nBible Passage: ${bible_passage}${additional_notes ? `\nTeacher Notes: ${additional_notes}` : ''}${bibleVersionInstruction}${teaserInstruction}${phaseOneStop}`;
    } else {
      userPrompt = `Generate a ${phaseOneLabel} Baptist Bible study lesson for:\n\nTopic: ${focused_topic}${additional_notes ? `\nTeacher Notes: ${additional_notes}` : ''}${bibleVersionInstruction}${teaserInstruction}${phaseOneStop}`;
    }

    checkpoint = logTiming('Prompt built', checkpoint);

    console.log(`System block 1 (static, uncached): ${staticSystemPrefix.length} chars (~${Math.round(staticSystemPrefix.length / 4)} tokens)`);
    console.log(`System block 2 (theology, cached): ${theologyBlock.length} chars (~${Math.round(theologyBlock.length / 4)} tokens)`);
    console.log(`System block 3 (dynamic, uncached): ${dynamicRemainder.length} chars (~${Math.round(dynamicRemainder.length / 4)} tokens)`);
    console.log(`User prompt: ${userPrompt.length} chars (~${Math.round(userPrompt.length / 4)} tokens)`);

    // Post-connection stall guard (moved inside the IIFE below, once we have
    // the controller actually wired to the successful attempt -- B4).
    const STALL_TIMEOUT_MS = 30_000;

    // =========================================================================
    // SSE STREAMING RESPONSE
    // Returns immediately; background IIFE drives the Anthropic stream,
    // runs post-processing, writes DB rows, and emits token/done/error events.
    // =========================================================================
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();

    const sendEvent = async (type: string, payload: Record<string, unknown>): Promise<void> => {
      const data = JSON.stringify({ type, ...payload });
      await writer.write(encoder.encode(`data: ${data}\n\n`));
    };

    // Declared here (not inside the try block below) so the catch/finally
    // blocks -- separate sibling scopes in JS -- can still see and clear it.
    // Only assigned once we have a successful stream connection.
    let stallTimer: ReturnType<typeof setInterval> | undefined;

    (async () => {
      try {
        const forcedErrorClass = getForcedErrorClass(req);
        const streamResult = await openAnthropicStreamWithRetry({
          functionName: 'generate-lesson',
          callLabel: 'phase1-stream',
          apiKey: anthropicApiKey,
          primaryModel: ANTHROPIC_MODEL,
          fallbackModel: ANTHROPIC_MODELS.fallback,
          forcedErrorClass,
          buildBody: (model) => ({
            model,
            max_tokens: usesTwoPhase ? 4000 : 8000,
            temperature: 0.6,
            stream: true,
            system: [
              { type: 'text', text: staticSystemPrefix },
              { type: 'text', text: theologyBlock, cache_control: { type: 'ephemeral' } },
              { type: 'text', text: dynamicRemainder }
            ],
            messages: [{ role: 'user', content: userPrompt }]
          })
        });

        checkpoint = logTiming('Anthropic stream opened', checkpoint);

        if (!streamResult.ok) {
          console.error('Anthropic stream connection failed after retries/fallback:', streamResult.errorClass);
          if (metricId) {
            await supabase
              .from('generation_metrics')
              .update({
                generation_end: new Date().toISOString(),
                generation_duration_ms: Date.now() - functionStartTime,
                status: 'error',
                rate_limited: streamResult.errorClass === 'rate_limit',
                anthropic_model: ANTHROPIC_MODEL,
                error_message: streamResult.error
              })
              .eq('id', metricId);
          }
          await logCapacityEvent(supabase, {
            userId: user.id,
            source: 'generate-lesson',
            eventType: 'anthropic_terminal_failure',
            tier: userTier,
            meta: { phase: 'phase1-connect', errorClass: streamResult.errorClass },
          });
          await sendEvent('error', { error: streamResult.error, code: streamResult.code });
          return;
        }

        const anthropicResponse = streamResult.response;
        const modelUsedForGeneration = streamResult.modelUsed;

        // STALL GUARD -- aborts only if Anthropic sends NO bytes for >30s
        // (genuine silence, not slow generation). Attached to the controller
        // actually wired to this successful attempt (B4 -- see
        // openAnthropicStreamWithRetry), not a separately-created one.
        let lastByteTime = Date.now();
        stallTimer = setInterval(() => {
          if (Date.now() - lastByteTime > STALL_TIMEOUT_MS) {
            console.error(`[STALL] No bytes from Anthropic for ${STALL_TIMEOUT_MS / 1000}s -- aborting`);
            streamResult.controller.abort();
            clearInterval(stallTimer);
          }
        }, 5_000);

        // Parse Anthropic SSE stream -- collect tokens + usage metadata
        let fullText = '';
        let tokensInput: number | null = null;
        let tokensOutput: number | null = null;
        let cacheCreationTokens: number | null = null;
        let cacheReadTokens: number | null = null;
        let finalStopReason: string | null = null;

        const streamReader = anthropicResponse.body!.getReader();
        const streamDecoder = new TextDecoder();
        let sseBuffer = '';

        while (true) {
          const { done, value } = await streamReader.read();
          if (done) break;

          lastByteTime = Date.now(); // reset stall guard on every chunk

          sseBuffer += streamDecoder.decode(value, { stream: true });
          const messages = sseBuffer.split('\n\n');
          sseBuffer = messages.pop() ?? '';

          for (const message of messages) {
            const dataLine = message.split('\n').find((l: string) => l.startsWith('data: '));
            if (!dataLine) continue;
            const jsonStr = dataLine.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'message_start') {
                tokensInput = event.message?.usage?.input_tokens ?? null;
                cacheCreationTokens = event.message?.usage?.cache_creation_input_tokens ?? null;
                cacheReadTokens = event.message?.usage?.cache_read_input_tokens ?? null;
                console.log(`Cache tokens -- write: ${cacheCreationTokens}, read: ${cacheReadTokens}`);
              }

              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                const token = event.delta.text as string;
                fullText += token;
                await sendEvent('token', { token });
              }

              if (event.type === 'message_delta') {
                tokensOutput = event.usage?.output_tokens ?? null;
                finalStopReason = event.delta?.stop_reason ?? finalStopReason;
              }
            } catch {
              // Skip unparseable SSE events
            }
          }
        }

        clearInterval(stallTimer);
        checkpoint = logTiming('Anthropic stream complete', checkpoint);

        let generatedLesson = fullText;
        let wordCount = generatedLesson.split(/\s+/).length;

        console.log(`Lesson generated: ${generatedLesson.length} chars, ${wordCount} words`);
        console.log(`Tokens - Input: ${tokensInput}, Output: ${tokensOutput}, Cache Write: ${cacheCreationTokens}, Cache Read: ${cacheReadTokens}`);

        // =====================================================================
        // TRUNCATION CHECK (B8) -- must run before any downstream work
        // (guardrail rewrite call, DB save, trial/usage increment, Phase 2).
        // A truncated core lesson is never saved and never counted against
        // the teacher's allowance.
        // =====================================================================
        if (finalStopReason === 'max_tokens') {
          console.error(`Phase 1 truncated (max_tokens) for user ${user.id}`);
          if (metricId) {
            await supabase
              .from('generation_metrics')
              .update({
                generation_end: new Date().toISOString(),
                generation_duration_ms: Date.now() - functionStartTime,
                status: 'error',
                anthropic_model: modelUsedForGeneration,
                tokens_input: tokensInput,
                tokens_output: tokensOutput,
                error_message: 'Truncated: max_tokens reached before Phase 1 completed'
              })
              .eq('id', metricId);
          }
          await logCapacityEvent(supabase, {
            userId: user.id,
            source: 'generate-lesson',
            eventType: 'truncated',
            tier: userTier,
            meta: { phase: 'phase1', tokensOutput },
          });
          await sendEvent('error', {
            error: 'Generation was cut short before completing. Please try again.',
            code: 'TRUNCATED'
          });
          return;
        }

        // =====================================================================
        // STYLE METADATA EXTRACTION
        // =====================================================================
        let extractedStyleMetadata: SeriesStyleMetadata | null = null;

        if (extract_style_metadata) {
          extractedStyleMetadata = parseStyleMetadata(generatedLesson, 'pending');

          if (extractedStyleMetadata) {
            console.log('Style metadata extracted:', extractedStyleMetadata);
            generatedLesson = removeStyleMetadataFromContent(generatedLesson);
          } else {
            console.log('Warning: Style extraction was requested but metadata block not found in output');
          }
        }

        let teaserContent: string | null = null;
        if (effectiveTeaser) {
          const teaserMatch = generatedLesson.match(/\*\*STUDENT TEASER\*\*\s*([\s\S]*?)---/i);
          if (teaserMatch) {
            teaserContent = teaserMatch[1].trim();
            console.log(`Teaser extracted: ${teaserContent.split(/\s+/).length} words`);
            generatedLesson = generatedLesson.replace(/\*\*STUDENT TEASER\*\*\s*[\s\S]*?---\s*/, '');
          } else {
            console.log('Warning: Teaser was requested but not found in output');
          }
        }

        checkpoint = logTiming('Response parsed', checkpoint);

        // =====================================================================
        // POST-GENERATION GUARDRAIL CHECK (SSOT: outputGuardrails.ts)
        // =====================================================================
        let guardrailCheckPassed = true;
        let wasRewritten = false;
        let rewrittenSectionIds: number[] = [];
        let rewriteTokensInput = 0;
        let rewriteTokensOutput = 0;

        const guardrailResult = checkOutputGuardrails(generatedLesson);

        if (!guardrailResult.passed) {
          guardrailCheckPassed = false;
          console.log(`GUARDRAIL VIOLATION: ${guardrailResult.totalViolations} violation(s) in ${guardrailResult.sectionsWithViolations} section(s)`);

          const violatedSections = guardrailResult.results.filter(r => r.violations.length > 0);

          for (const section of violatedSections) {
            for (const v of section.violations) {
              console.log(`  [${v.patternId}] Section ${section.sectionId}: ${v.description}`);
              console.log(`    Context: "${v.matchedText}"`);
            }
          }

          const rewritePrompt = buildRewritePrompt(violatedSections);

          // B4: retry + model fallback. This is a content-quality corrective
          // call, not the primary generation -- a terminal failure after
          // retries/fallback is non-fatal exactly as before: log and deliver
          // the original (still-violating) content as-is.
          const rewriteResult = await callAnthropicNonStreaming({
            functionName: 'generate-lesson',
            callLabel: 'guardrail-rewrite',
            callSite: 'lessonPhase2',
            apiKey: anthropicApiKey,
            primaryModel: ANTHROPIC_MODEL,
            fallbackModel: ANTHROPIC_MODELS.fallback,
            forcedErrorClass,
            buildBody: (model) => ({
              model,
              max_tokens: REWRITE_CONFIG.maxTokens,
              temperature: REWRITE_CONFIG.temperature,
              system: rewritePrompt.system,
              messages: [{ role: 'user', content: rewritePrompt.user }]
            }),
          });

          if (rewriteResult.ok) {
            const rewrittenContent = rewriteResult.text;
            const rewrittenParsed = parseLessonSections(rewrittenContent);

            if (rewrittenParsed.length > 0) {
              generatedLesson = replaceSections(generatedLesson, rewrittenParsed);
              rewrittenSectionIds = rewrittenParsed.map(s => s.id);
              wasRewritten = true;

              wordCount = generatedLesson.split(/\s+/).length;

              const rawUsage = (rewriteResult.raw as any)?.usage;
              rewriteTokensInput = rawUsage?.input_tokens || 0;
              rewriteTokensOutput = rawUsage?.output_tokens || 0;

              console.log(`GUARDRAIL REWRITE: Sections [${rewrittenSectionIds.join(', ')}] rewritten successfully (model: ${rewriteResult.modelUsed})`);
              console.log(`Rewrite tokens \u2014 Input: ${rewriteTokensInput}, Output: ${rewriteTokensOutput}`);

              const postRewriteCheck = checkOutputGuardrails(generatedLesson);
              if (!postRewriteCheck.passed) {
                console.log(`GUARDRAIL WARNING: ${postRewriteCheck.totalViolations} violation(s) remain after rewrite \u2014 delivering as-is`);
              } else {
                guardrailCheckPassed = true;
                console.log('GUARDRAIL: All violations resolved after rewrite');
              }
            } else {
              console.error('GUARDRAIL REWRITE: Could not parse rewritten sections from API response');
            }
          } else {
            console.error('GUARDRAIL REWRITE FAILED after retries/fallback:', rewriteResult.errorClass);
          }
        } else {
          console.log('GUARDRAIL: Passed \u2014 no violations detected');
        }

        checkpoint = logTiming('Guardrail check', checkpoint);

        // =====================================================================
        // EXTRACT AI-GENERATED TITLE FROM SECTION 1
        // =====================================================================
        const titleMatch = generatedLesson.match(/\*\*Lesson Title:\*\*\s*(.+)/i);
        const extractedTitle = titleMatch ? titleMatch[1].replace(/["\u201C\u201D*]/g, '').trim() : null;

        // =====================================================================
        // PHASE 13.6: LESSON DATA WITH ORG CONTEXT
        // =====================================================================
        const lessonTypeForRow: 'full' | 'short' =
          (isTrialLesson && !isFullTrialLesson) ? 'short' : 'full';

        const lessonData = {
          user_id: user.id,
          title: extractedTitle || lessonInput,
          original_text: generatedLesson,
          organization_id: orgPoolResult?.organization_id || null,
          audience_profile: audience_profile || { role: 'Teacher', assembly: 'Class', participant: 'Student' },
          org_pool_consumed: useOrgPool,
          series_style_metadata: extractedStyleMetadata,
          lesson_type: lessonTypeForRow,
          filters: {
            bible_passage,
            focused_topic,
            extracted_content: extracted_content ? `[${extracted_content.length} chars]` : null,
            age_group,
            theology_profile_id,
            bible_version_id: bibleVersion.id,
            teaching_style,
            lesson_length,
            activity_types,
            language,
            class_setting,
            learning_environment,
            student_experience,
            cultural_context,
            special_needs,
            lesson_sequence,
            assessment_style,
            learning_style,
            education_experience,
            emotional_entry,
            theological_lens,
            additional_notes: additional_notes || null,
            generate_teaser: effectiveTeaser,
            freshness_mode,
            extract_style_metadata,
            has_series_style_context: !!series_style_context
          },
          metadata: {
            lessonStructureVersion: LESSON_STRUCTURE_VERSION,
            generatedAt: new Date().toISOString(),
            theologyProfile: theologyProfile.name,
            bibleVersion: bibleVersion.name,
            bibleVersionAbbreviation: bibleVersion.abbreviation,
            copyrightStatus: bibleVersion.copyrightStatus,
            ageGroup: ageGroupData.label,
            wordCount: wordCount,
            sectionCount: phase1SectionCount,
            includesTeaser: !usesTwoPhase && effectiveTeaser && teaserContent !== null,
            teaser: usesTwoPhase ? null : teaserContent,
            generationTimeSeconds: ((Date.now() - functionStartTime) / 1000).toFixed(2),
            anthropicUsage: {
              input_tokens: tokensInput,
              output_tokens: tokensOutput,
              cache_creation_input_tokens: cacheCreationTokens,
              cache_read_input_tokens: cacheReadTokens
            },
            wasEnhancement: !!extracted_content,
            extractedContentLength: extracted_content?.length || 0,
            freshnessMode: freshness_mode,
            freshnessSuggestions: selectedFreshness,
            teaserFreshnessSuggestions: selectedTeaserFreshness,
            platformMode: platformMode,
            isTrialLesson: isTrialLesson,
            isFullTrialLesson: isFullTrialLesson,
            sectionsGenerated: phase1Sections.map((s: any) => s.id),
            extractedStyleMetadata: extract_style_metadata,
            usedSeriesStyleContext: !!series_style_context,
            usedOrgPool: useOrgPool,
            organizationId: orgPoolResult?.organization_id || null,
            organizationName: orgPoolResult?.organization_name || null,
            outputGuardrailsVersion: OUTPUT_GUARDRAILS_VERSION,
            guardrailCheckPassed: guardrailCheckPassed,
            guardrailRewritten: wasRewritten,
            guardrailRewrittenSections: rewrittenSectionIds,
            guardrailRewriteTokensInput: rewriteTokensInput,
            guardrailRewriteTokensOutput: rewriteTokensOutput
          }
        };

        const { data: lesson, error: insertError } = await supabase
          .from('lessons')
          .insert(lessonData)
          .select()
          .single();

        if (insertError) {
          console.error('Database insert error:', insertError);
          throw new Error(`Failed to save lesson: ${insertError.message}`);
        }

        if (extractedStyleMetadata && lesson) {
          extractedStyleMetadata.capturedFromLessonId = lesson.id;

          await supabase
            .from('lessons')
            .update({
              series_style_metadata: {
                ...extractedStyleMetadata,
                capturedFromLessonId: lesson.id
              }
            })
            .eq('id', lesson.id);
        }

        checkpoint = logTiming('Database insert', checkpoint);
        logTiming('TOTAL FUNCTION TIME', functionStartTime);

        console.log('Lesson saved:', lesson.id);

        // =====================================================================
        // LOG GUARDRAIL VIOLATIONS TO DATABASE (if any were detected)
        // =====================================================================
        if (!guardrailCheckPassed && guardrailResult && guardrailResult.totalViolations > 0) {
          try {
            const violatedSections = guardrailResult.results.filter(r => r.violations.length > 0);
            const allViolatedTerms = violatedSections.flatMap(s =>
              s.violations.map(v => v.patternId)
            );
            const violationContexts = violatedSections.flatMap(s =>
              s.violations.map(v => ({
                term: v.patternId,
                occurrences: 1,
                samples: [v.matchedText],
              }))
            );

            const { error: violationInsertError } = await supabase
              .from('guardrail_violations')
              .insert({
                lesson_id: lesson.id,
                user_id: user.id,
                theology_profile_id: theology_profile_id,
                theology_profile_name: theologyProfile.name,
                violated_terms: allViolatedTerms,
                violation_count: guardrailResult.totalViolations,
                violation_contexts: violationContexts,
                lesson_title: lessonInput,
                age_group: age_group,
                bible_passage: bible_passage || null,
              });

            if (violationInsertError) {
              console.error('Failed to log guardrail violation:', violationInsertError.message);
            } else {
              console.log(`GUARDRAIL: Logged ${guardrailResult.totalViolations} violation(s) to guardrail_violations table`);
            }
          } catch (violationLogError) {
            console.error('GUARDRAIL LOGGING ERROR:', violationLogError);
          }
        }

        // =====================================================================
        // PHASE 13.6: CONSUME FROM ORG POOL (if applicable)
        // =====================================================================
        if (useOrgPool && orgPoolResult?.organization_id) {
          const consumed = await consumeFromOrgPool(supabase, orgPoolResult.organization_id);
          if (consumed) {
            console.log('Org pool consumption successful for org:', orgPoolResult.organization_id);
          } else {
            console.error('Org pool consumption failed - this should not happen');
          }
        }

        // =====================================================================
        // TRIAL CONSUMPTION: Update rolling period counters (Rule #26)
        // =====================================================================
        if (isTrialLesson && trialProfileData !== null) {
          const now = new Date().toISOString();
          const updateData: Record<string, unknown> = {};

          if (isFullTrialLesson) {
            const currentFull = trialStatus?.periodExpired ? 0 : (trialProfileData.trial_full_lessons_used ?? 0);
            updateData.trial_full_lessons_used = currentFull + 1;
            if (!trialProfileData.trial_period_start || trialStatus?.periodExpired) {
              updateData.trial_period_start = now;
            }
          } else {
            const currentShort = trialStatus?.periodExpired ? 0 : (trialProfileData.trial_short_lessons_used ?? 0);
            updateData.trial_short_lessons_used = currentShort + 1;
          }

          const { error: trialUpdateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);
          if (trialUpdateError) {
            console.error('CRITICAL: Trial counter increment failed for user:',
              user.id, 'error:', trialUpdateError.message);
          } else {
            console.log('Trial consumed:',
              isFullTrialLesson ? 'full (8-section)' : 'short (3-section)',
              'for user:', user.id);
          }
        }

        // =====================================================================
        // PAID-TIER USAGE INCREMENT (server-side only -- Rule #26)
        // =====================================================================
        if (!isAdmin && !useOrgPool && userTier !== 'free') {
          await incrementLessonUsage(supabase, user.id);
          console.log('Paid-tier usage incremented for user:', user.id, 'tier:', userTier);
        }

        const phase1EndMs = Date.now();
        if (metricId) {
          await supabase
            .from('generation_metrics')
            .update({
              lesson_id: lesson.id,
              organization_id: lesson.organization_id,
              generation_end: new Date().toISOString(),
              generation_duration_ms: phase1EndMs - functionStartTime,
              sections_generated: phase1SectionCount,
              status: 'completed',
              tokens_input: tokensInput,
              tokens_output: tokensOutput,
              anthropic_model: modelUsedForGeneration,
              cache_creation_input_tokens: cacheCreationTokens,
              cache_read_input_tokens: cacheReadTokens,
              phase1_duration_ms: phase1EndMs - functionStartTime
            })
            .eq('id', metricId);
        }

        await sendEvent('done', {
          lesson,
          metadata: lessonData.metadata,
          style_metadata: extractedStyleMetadata,
          two_phase: usesTwoPhase
        });

        // =====================================================================
        // PHASE 2: Derived supplements (S6, S7, S8 + Teaser)
        // Full 8-section lessons only. Runs after 'done' so teacher has core lesson now.
        // Phase 2 failure NEVER loses Phase 1 -- it is already saved and billed.
        // =====================================================================
        if (usesTwoPhase) {
          const phase2Start = Date.now();
          try {
            const phase2Sections = filteredSections.filter((s: any) => s.id > 5);
            const phase2SectionCount = phase2Sections.length;

            const phase2SystemPrefix = `You are a Baptist Bible study lesson generator using the BibleLessonSpark Framework.

${buildCompressionRules(effectiveTeaser, phase2Sections)}

${buildTruthGuardrails()}

-------------------------------------------------------------------------------
SUPPLEMENT SECTIONS (${phase2SectionCount} SECTIONS -- PHASE 2 SUPPLEMENTS)
-------------------------------------------------------------------------------
${buildSectionsPrompt(phase2Sections, effectiveTeaser)}

-------------------------------------------------------------------------------
OUTPUT REQUIREMENTS
-------------------------------------------------------------------------------
Generate ONLY the ${phase2SectionCount} supplement sections listed above.
Each supplement must be derived from the specific content in the core lesson provided.
${effectiveTeaser ? 'Generate the student teaser FIRST, before the numbered sections.' : ''}
Follow EXACT formatting:

## Section N: [Section Name]

[Section content following rules above]

---

Each section separated by "---" on its own line.
Meet ALL word minimums. Respect ALL word maximums. Do NOT exceed any section maximum.
`;

            const phase2UserPrompt = `Here is the complete core lesson (Sections 1-5) that was just generated:

---BEGIN CORE LESSON---
${generatedLesson}
---END CORE LESSON---

Using this core lesson as your source, now generate:
${effectiveTeaser ? '- The Student Teaser (output FIRST, before Section 6)\n' : ''}- Section 6: Interactive Activities (derived from the teaching content above)
- Section 7: Discussion & Assessment (questions referencing the actual theology and content)
- Section 8: Group Handout (standalone, distilling the lesson for participants)

All supplements must be specific to this lesson's content -- not generic.${bibleVersionInstruction}`;

            console.log(`[Phase 2] Starting supplement generation for lesson ${lesson.id}`);

            // B4: retry + model fallback. A terminal failure throws, caught
            // by this Phase 2 block's own catch below -- Phase 1's lesson is
            // already saved, so the teacher is never blocked by a Phase 2
            // failure (unchanged behavior, just with retry/fallback first).
            const phase2Result = await callAnthropicNonStreaming({
              functionName: 'generate-lesson',
              callLabel: 'phase2-supplements',
              callSite: 'lessonPhase2',
              apiKey: anthropicApiKey,
              primaryModel: ANTHROPIC_MODEL,
              fallbackModel: ANTHROPIC_MODELS.fallback,
              forcedErrorClass,
              buildBody: (model) => ({
                model,
                max_tokens: 2500,
                temperature: 0.6,
                system: [
                  { type: 'text', text: phase2SystemPrefix },
                  { type: 'text', text: theologyBlock, cache_control: { type: 'ephemeral' } },
                  { type: 'text', text: buildDynamicRemainder(true) }
                ],
                messages: [{ role: 'user', content: phase2UserPrompt }]
              }),
            });

            if (!phase2Result.ok) {
              throw new Error(`Phase 2 generation failed after retries/fallback: ${phase2Result.errorClass}`);
            }

            if (phase2Result.stopReason === 'max_tokens') {
              // Degrade gracefully -- Phase 1's core lesson (S1-5) is already
              // saved and trustworthy. Don't extract/guardrail-check/save the
              // truncated supplement text; tell the client the same way an
              // outright Phase 2 failure is communicated (B8).
              console.error(`[Phase 2] Truncated (max_tokens) for lesson ${lesson.id}`);
              await logCapacityEvent(supabase, {
                userId: user.id,
                source: 'generate-lesson',
                eventType: 'truncated',
                tier: userTier,
                meta: { phase: 'phase2', lessonId: lesson.id },
              });
              await sendEvent('supplements_failed', {
                lesson_id: lesson.id,
                message: SUPPLEMENTS_INCOMPLETE_MESSAGE,
              }).catch(() => {});
              return;
            }

            const phase2RawText: string = phase2Result.text;
            const phase2RawUsage = (phase2Result.raw as any)?.usage;
            const phase2TokensOut: number = phase2RawUsage?.output_tokens ?? 0;
            const phase2TokensIn: number = phase2RawUsage?.input_tokens ?? 0;
            const phase2CacheWrite: number = phase2RawUsage?.cache_creation_input_tokens ?? 0;
            const phase2CacheRead: number = phase2RawUsage?.cache_read_input_tokens ?? 0;

            console.log(`[Phase 2] Generated ${phase2RawText.length} chars, ${phase2TokensOut} output tokens`);

            // Extract teaser from Phase 2 output (if requested)
            let phase2TeaserContent: string | null = null;
            let phase2BodyText = phase2RawText;
            if (effectiveTeaser) {
              const tMatch = phase2BodyText.match(/\*\*STUDENT TEASER\*\*\s*([\s\S]*?)(?=##\s*Section|\s*$)/i);
              if (tMatch) {
                phase2TeaserContent = tMatch[1].trim();
                phase2BodyText = phase2BodyText.replace(/\*\*STUDENT TEASER\*\*\s*[\s\S]*?(?=##\s*Section)/, '').trim();
              } else {
                console.log('[Phase 2] Teaser was requested but not found in Phase 2 output');
              }
            }

            // Guardrail check on Phase 2 body (best-effort rewrite)
            const phase2GuardrailResult = checkOutputGuardrails(phase2BodyText);
            let phase2FinalText = phase2BodyText;
            if (!phase2GuardrailResult.passed) {
              console.log(`[Phase 2 Guardrail] ${phase2GuardrailResult.totalViolations} violation(s) -- attempting rewrite`);
              try {
                const p2Violated = phase2GuardrailResult.results.filter((r: any) => r.violations.length > 0);
                const p2RewritePrompt = buildRewritePrompt(p2Violated);
                // B4: retry + model fallback. Non-fatal exactly as before --
                // on terminal failure, phase2FinalText simply stays as the
                // original (still-violating) phase2BodyText.
                const p2RwResult = await callAnthropicNonStreaming({
                  functionName: 'generate-lesson',
                  callLabel: 'phase2-guardrail-rewrite',
                  callSite: 'lessonPhase2',
                  apiKey: anthropicApiKey,
                  primaryModel: ANTHROPIC_MODEL,
                  fallbackModel: ANTHROPIC_MODELS.fallback,
                  forcedErrorClass,
                  buildBody: (model) => ({
                    model,
                    max_tokens: REWRITE_CONFIG.maxTokens,
                    temperature: REWRITE_CONFIG.temperature,
                    system: p2RewritePrompt.system,
                    messages: [{ role: 'user', content: p2RewritePrompt.user }]
                  }),
                });
                if (p2RwResult.ok) {
                  const p2RwParsed = parseLessonSections(p2RwResult.text);
                  if (p2RwParsed.length > 0) {
                    phase2FinalText = replaceSections(phase2BodyText, p2RwParsed);
                  }
                } else {
                  console.error('[Phase 2 Guardrail] Rewrite failed after retries/fallback, using original:', p2RwResult.errorClass);
                }
              } catch (p2RwErr) {
                console.error('[Phase 2 Guardrail] Rewrite failed, using original:', p2RwErr);
              }
            }

            // Combine Phase 1 (generatedLesson) + Phase 2 body
            const combinedText = generatedLesson.trimEnd() + '\n\n---\n\n' + phase2FinalText.trim();

            // UPDATE lessons row with combined text and Phase 2 metadata
            const supplementMeta = {
              ...(lesson.metadata as Record<string, unknown> || {}),
              phase2Completed: true,
              sectionCount: filteredSections.length,
              sectionsGenerated: filteredSections.map((s: any) => s.id),
              includesTeaser: effectiveTeaser && phase2TeaserContent !== null,
              teaser: phase2TeaserContent,
              phase2GenerationSeconds: ((Date.now() - phase2Start) / 1000).toFixed(2),
              phase2TokensInput: phase2TokensIn,
              phase2TokensOutput: phase2TokensOut,
              phase2CacheCreation: phase2CacheWrite,
              phase2CacheRead: phase2CacheRead,
            };

            const { data: updatedLesson, error: updateError } = await supabase
              .from('lessons')
              .update({ original_text: combinedText, metadata: supplementMeta })
              .eq('id', lesson.id)
              .select()
              .single();

            if (updateError) {
              throw new Error(`Phase 2 DB update failed: ${updateError.message}`);
            }

            // Update generation_metrics with final status and Phase 2 timing
            const phase2EndMs = Date.now();
            if (metricId) {
              await supabase
                .from('generation_metrics')
                .update({
                  status: 'completed',
                  generation_duration_ms: phase2EndMs - functionStartTime,
                  sections_generated: filteredSections.length,
                  phase2_duration_ms: phase2EndMs - phase2Start
                })
                .eq('id', metricId);
            }

            await sendEvent('supplements', { lesson: updatedLesson });
            console.log(`[Phase 2] Complete for lesson ${lesson.id}`);

          } catch (phase2Err: any) {
            // Phase 2 failure: Phase 1 lesson is already saved. Teacher is not blocked.
            console.error('[Phase 2] Failed (Phase 1 lesson preserved):', phase2Err.message);
            await logCapacityEvent(supabase, {
              userId: user.id,
              source: 'generate-lesson',
              eventType: 'anthropic_terminal_failure',
              tier: userTier,
              meta: { phase: 'phase2', lessonId: lesson.id, error: phase2Err.message },
            });
            await sendEvent('supplements_failed', {
              lesson_id: lesson.id,
              message: SUPPLEMENTS_INCOMPLETE_MESSAGE,
            }).catch(() => {});
          }
        }
        // end Phase 2

      } catch (streamError: any) {
        clearInterval(stallTimer);
        logTiming('ERROR occurred at', functionStartTime);
        console.error('Error in generate-lesson stream:', streamError);
        if (metricId) {
          await supabase
            .from('generation_metrics')
            .update({
              generation_end: new Date().toISOString(),
              generation_duration_ms: Date.now() - functionStartTime,
              status: streamError.name === 'AbortError' ? 'timeout' : 'error',
              anthropic_model: ANTHROPIC_MODEL,
              error_message: streamError.name === 'AbortError'
                ? `Stream stalled for >${STALL_TIMEOUT_MS / 1000}s`
                : (streamError.message || 'Unknown error')
            })
            .eq('id', metricId);
        }
        await logCapacityEvent(supabase, {
          userId: user.id,
          source: 'generate-lesson',
          eventType: 'anthropic_terminal_failure',
          tier: userTier,
          meta: { phase: 'phase1-stream', name: streamError.name },
        });
        const errMsg = streamError.name === 'AbortError'
          ? 'Generation timed out. Please try again.'
          : (streamError.message || 'An unexpected error occurred');
        await sendEvent('error', { error: errMsg }).catch(() => {});
      } finally {
        clearInterval(stallTimer);
        try { writer.close(); } catch { /* already closed */ }
      }
    })();

    return new Response(readable, {
      headers: {
        ...dynamicCorsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    logTiming('ERROR occurred at', functionStartTime);
    console.error('Error in generate-lesson:', error);
    
    if (typeof metricId !== 'undefined' && metricId && supabase) {
      await supabase
        .from('generation_metrics')
        .update({
          generation_end: new Date().toISOString(),
          generation_duration_ms: Date.now() - functionStartTime,
          status: 'error',
          anthropic_model: ANTHROPIC_MODEL,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', metricId);
    }

    if (typeof user !== 'undefined' && user && supabase) {
      await logCapacityEvent(supabase, {
        userId: user.id,
        source: 'generate-lesson',
        eventType: 'anthropic_terminal_failure',
        tier: typeof userTier !== 'undefined' ? userTier : 'unknown',
        meta: { phase: 'outer-catch', error: error.message },
      });
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
