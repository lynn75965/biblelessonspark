import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { LESSON_STRUCTURE_VERSION, getRequiredSections, getOptionalSections, getTotalMinWords, getTotalMaxWords, getTeaserSection } from '../_shared/lessonStructure.ts';
import { AGE_GROUPS } from '../_shared/ageGroups.ts';
import { THEOLOGY_PROFILES, generateTheologicalGuardrails } from '../_shared/theologyProfiles.ts';
import { BIBLE_VERSIONS, generateCopyrightGuardrails, getDefaultBibleVersion } from '../_shared/bibleVersions.ts';
import { buildCustomizationDirectives } from '../_shared/customizationDirectives.ts';
import { validateLessonRequest } from '../_shared/validation.ts';
import { checkRateLimit, logUsage } from '../_shared/rateLimit.ts';
import { checkLessonLimit, getSectionsForTier } from '../_shared/subscriptionCheck.ts';
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
import { PLATFORM_MODE_ACCESS, ORG_TYPES } from '../_shared/organizationConfig.ts';
import { TRIAL_CONFIG, isTrialAvailable, doesTrialApply } from '../_shared/trialConfig.ts';
// Phase 13.6: Organization Pool Check
import { checkOrgPoolAccess, consumeFromOrgPool, OrgPoolCheckResult } from '../_shared/orgPoolCheck.ts';
// Output Guardrails: Post-generation truth & integrity verification (SSOT: outputGuardrails.ts)
import { checkOutputGuardrails, buildRewritePrompt, parseLessonSections, replaceSections, GuardrailCheckResult, OUTPUT_GUARDRAILS_VERSION, REWRITE_CONFIG } from '../_shared/outputGuardrails.ts';

import { getCorsHeadersFromRequest, PRODUCTION_ORIGINS, DEVELOPMENT_ORIGINS } from '../_shared/corsConfig.ts';

// Legacy corsHeaders for backward compatibility - dynamic version preferred
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://lessonsparkusa.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Anthropic model constant for tracking
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

function logTiming(label: string, startTime: number): number {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[TIMING] ${label}: ${elapsed}s`);
  return Date.now();
}

function buildSectionsPrompt(sections: ReturnType<typeof getRequiredSections>, includeTeaser: boolean = false) {
  return sections.map((section) => {
    const rules = section.contentRules.map((r) => `    • ${r}`).join('\n');
    const prohibitions = section.prohibitions.map((p) => `    • ${p}`).join('\n');
    const redundancyNote = section.redundancyLock.length > 0
      ? `\n    ⚠️ REDUNDANCY LOCK: Do NOT repeat content from: ${section.redundancyLock.join(', ')}`
      : '';
    const optionalNote = section.optional ? '\n    • OPTIONAL SECTION - Only include when requested' : '';

    let enforcementNote = '';
    if (section.id === 5) {
      enforcementNote = `

⚠️ CRITICAL ENFORCEMENT FOR THIS SECTION:
1. MANDATORY MINIMUM: ${section.minWords} words (COUNT CAREFULLY)
2. Every sentence must ADD NEW INSIGHT or DEPTH
3. If explaining a concept, give the WHY and HOW, not just the WHAT
4. Anticipate follow-up questions and answer them preemptively
5. Connect abstract theology to concrete life application
6. Give teachers substance to answer student questions confidently

🚫 FORBIDDEN - These do NOT count toward word target:
- Repetition of content from other sections
- Transitional phrases ("As we discussed...", "Moving on...")
- Padding sentences that add no value
- Circular reasoning or restating the same point
- Generic statements without specific application

✓ REQUIRED - Every sentence must do ONE of these:
- Unpack a theological concept with depth
- Explain WHY something matters (not just that it does)
- Give concrete examples or applications
- Anticipate and answer "What do you mean by that?"
- Draw from Section 3's depth and make it spoken/teachable
- Bridge abstract truth to student's real-world experience

⚠️ QUALITY CHECK: Before finishing this section, ask yourself:
"Could a volunteer teacher use this to answer student questions with confidence?"
If no, add more depth and explanation.`;
    }

    return `
## Section ${section.id}: ${section.name}
**Purpose:** ${section.purpose}${optionalNote}${enforcementNote}

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
⚠️ TRUTH AND INTEGRITY GUARDRAILS (APPLIES TO ALL SECTIONS)
-------------------------------------------------------------------------------

YOU ARE GENERATING CONTENT FOR BIBLE TEACHERS WHO WILL READ THIS VERBATIM TO THEIR CLASS.
If you fabricate a fact, a teacher will unknowingly present a lie to their students.
This is a matter of ministerial integrity — treat it with absolute seriousness.

RULE 1: NEVER FABRICATE CURRENT EVENTS
- Do NOT invent news stories, infrastructure projects, research studies, surveys, or statistics
- Do NOT write "You may have seen the news about..." followed by a made-up event
- Do NOT claim something "happened this week" or "recently" unless it is a well-known, verifiable historical fact
- Do NOT invent quotes attributed to project managers, researchers, pastors, teachers, or any person real or fictional

RULE 2: NEVER ASSUME LOCAL KNOWLEDGE
- Do NOT reference "our state", "our city", "our community", or "our area" as if describing a real local event
- Do NOT assume knowledge of the teacher's geographic location, local news, or regional context
- You have NO knowledge of current events — do not pretend otherwise

RULE 3: ALL ILLUSTRATIONS MUST BE HONEST
Every illustration, story, or example in the lesson MUST be one of these:
  ✅ CLEARLY HYPOTHETICAL: "Imagine you're...", "Think about a time when...", "Picture this..."
  ✅ UNIVERSAL HUMAN EXPERIENCE: "Most of us have felt...", "We've all had moments where..."
  ✅ VERIFIABLE HISTORICAL FACT: Well-known events that can be independently confirmed
  ✅ BIBLICAL NARRATIVE: Stories and examples directly from Scripture
  ❌ NEVER: A made-up news story, fake quote, invented statistic, or fabricated current event

RULE 4: WHEN IN DOUBT, USE HYPOTHETICAL FRAMING
- If you want to illustrate a point with a modern scenario, ALWAYS frame it as hypothetical
- Say "Imagine a construction foreman..." NOT "A construction foreman recently said..."
- Say "Think about what it would be like..." NOT "This week in our state..."

These rules are NON-NEGOTIABLE and override any other instruction to be "current" or "relevant."
Integrity matters more than engagement. A teacher's credibility depends on it.
`;
}

function buildCompressionRules(includeTeaser: boolean = false) {
  const baseWordMin = getTotalMinWords();
  const baseWordMax = getTotalMaxWords();

  return `
-------------------------------------------------------------------------------
OUTPUT COMPRESSION & QUALITY RULES
-------------------------------------------------------------------------------

RULE 1: REDUNDANCY PREVENTION BY ARCHITECTURE
- Section 3 (Theological Background) contains ALL deep theology
- Sections 4, 5, 6, 7, 8 must REFERENCE Section 3, never REPEAT it
- If you explained a concept in Section 3, do NOT explain it again

RULE 2: WORD BUDGET ENFORCEMENT
- Each section has MANDATORY min/max word limits - RESPECT THEM
- Total lesson target: ${baseWordMin}-${baseWordMax} words
- Going over budget causes timeouts and failures

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

  const rules = teaserSection.contentRules.map((r) => `    • ${r}`).join('\n');
  const prohibitions = teaserSection.prohibitions.map((p) => `    • ${p}`).join('\n');

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
❌ WRONG: "Join us Sunday to learn about God's plan!"
✓ RIGHT: "When we gather, we'll explore this together. I think you'll find some clarity."

FINAL QUALITY CHECK:
Before outputting the teaser, verify:
1. Does it contain ANY words from the prohibited lists? → REWRITE
2. Could this teaser work for 10+ different lessons? → If no, make it MORE generic
3. Does it reveal the Bible passage, topic, or doctrine? → REWRITE
4. Does it use "Ever wonder/feel/notice"? → REWRITE with different opener

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
    // PHASE 13.6: ORGANIZATION POOL CHECK
    // Check if user is org member and if org pool is available
    // Org pool is checked BEFORE individual subscription
    // =========================================================================
    let orgPoolResult: OrgPoolCheckResult | null = null;
    let useOrgPool = false;
    
    if (!isAdmin) {
      orgPoolResult = await checkOrgPoolAccess(supabase, user.id);
      
      if (orgPoolResult.is_org_member) {
        console.log('Org membership found:', {
          organization_id: orgPoolResult.organization_id,
          organization_name: orgPoolResult.organization_name,
          role: orgPoolResult.role,
          can_use_org_pool: orgPoolResult.can_use_org_pool,
          pool_available: orgPoolResult.pool_status?.total_available || 0
        });
        
        if (orgPoolResult.can_use_org_pool) {
          useOrgPool = true;
          console.log('ORG POOL: Will consume from organization pool');
        } else {
          console.log('ORG POOL: Empty or no subscription, falling back to individual tier');
        }
      }
    }
    
    checkpoint = logTiming('Org pool check completed', checkpoint);

    // =========================================================================
    // SUBSCRIPTION & LIMIT CHECK (skipped for admins, modified for org pool)
    // =========================================================================
    let userTier = isAdmin ? 'admin' : 'free';
    let allowedSections: number[] = [];
    
    if (!isAdmin) {
      if (useOrgPool) {
        // User is using org pool - they get full tier access
        userTier = 'personal';
        allowedSections = getSectionsForTier('personal');
        console.log('Org pool user gets full tier access');
      } else {
        // Check individual subscription tier and lesson limit
        const limitCheck = await checkLessonLimit(supabase, user.id);
        console.log('Subscription check:', limitCheck);
        
        if (!limitCheck.can_generate) {
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
        
        userTier = limitCheck.tier;
        allowedSections = limitCheck.sections_allowed;
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
          .select('trial_full_lesson_last_used, trial_full_lesson_granted_until')
          .eq('id', user.id)
          .single();
        
        const trialAvailable = isTrialAvailable(
          profileData?.trial_full_lesson_last_used,
          profileData?.trial_full_lesson_granted_until
        );
        
        if (trialAvailable) {
          sectionsToGenerate = getRequiredSections().map(s => s.id);
          isTrialLesson = true;
          console.log('Trial lesson: Free user gets all sections (monthly trial)');
        } else {
          sectionsToGenerate = allowedSections || getSectionsForTier(userTier);
          console.log('Production mode: User tier', userTier, 'gets sections:', sectionsToGenerate);
        }
      } else {
        sectionsToGenerate = allowedSections || getSectionsForTier(userTier);
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

    const requestData = await req.json();

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
      series_style_context = null
    } = validatedData;

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
      
      if (generate_teaser) {
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
      includeTeaser: generate_teaser,
      wordTarget: `${getTotalMinWords()}-${getTotalMaxWords()}${generate_teaser ? ' (+50-100 for teaser)' : ''}`,
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

    const systemPrompt = `You are a Baptist Bible study lesson generator using the LessonSparkUSA Framework.

-------------------------------------------------------------------------------
THEOLOGY PROFILE: ${theologyProfile.name}
-------------------------------------------------------------------------------
${theologyProfile.description}

${generateTheologicalGuardrails(theologyProfile.id)}

-------------------------------------------------------------------------------
AGE GROUP: ${ageGroupData.label}
-------------------------------------------------------------------------------
${ageGroupData.promptGuidance}

${buildCompressionRules(generate_teaser)}

${buildTruthGuardrails()}

-------------------------------------------------------------------------------
BIBLE VERSION: ${bibleVersion.name} (${bibleVersion.abbreviation})
-------------------------------------------------------------------------------
Copyright Status: ${bibleVersion.copyrightStatus}
Quote Type: ${bibleVersion.quoteType}

${copyrightGuardrails}

${customizationDirectives}


${buildTeaserInstructions(generate_teaser, selectedTeaserFreshness)}

${buildFreshnessContext(new Date(), freshness_mode, include_liturgical, include_cultural)}

${freshnessPromptAddition}

${consistentStylePromptAddition}

-------------------------------------------------------------------------------
LESSON STRUCTURE (EXACTLY ${totalSections} SECTIONS)
-------------------------------------------------------------------------------
${buildSectionsPrompt(filteredSections, generate_teaser)}

-------------------------------------------------------------------------------
OUTPUT REQUIREMENTS
-------------------------------------------------------------------------------
Generate all ${totalSections} sections in order. Follow EXACT formatting:

## Section N: [Section Name]

[Section content following rules above]

---

Each section separated by "---" on its own line.
Meet ALL word minimums. Respect ALL word maximums.

${styleExtractionPromptAddition}
`;

    let lessonInput = bible_passage || focused_topic || '';
    if (bible_passage && focused_topic) {
      lessonInput = `${bible_passage} - ${focused_topic}`;
    }

    let bibleVersionInstruction = `\n\nIMPORTANT: Use the ${bibleVersion.name} (${bibleVersion.abbreviation}) for ALL Scripture quotations and references.`;

    let teaserInstruction = '';
    if (generate_teaser) {
      teaserInstruction = '\n\nINCLUDE STUDENT TEASER: Generate the student teaser section at the beginning, before Section 1.';
    }

    let userPrompt: string;

    if (extracted_content) {
      userPrompt = `Generate a complete ${totalSections}-section Baptist Bible study lesson based on this curriculum content:\n\n---BEGIN CURRICULUM CONTENT---\n${extracted_content}\n---END CURRICULUM CONTENT---\n\n${bible_passage ? `Primary Passage: ${bible_passage}\n` : ''}${focused_topic ? `Focus Topic: ${focused_topic}\n` : ''}${additional_notes ? `Teacher Notes: ${additional_notes}` : ''}${bibleVersionInstruction}${teaserInstruction}`;
    } else if (bible_passage && focused_topic) {
      userPrompt = `Generate a complete ${totalSections}-section Baptist Bible study lesson for:\n\nBible Passage: ${bible_passage}\nTheme/Focus: ${focused_topic}${additional_notes ? `\nTeacher Notes: ${additional_notes}` : ''}${bibleVersionInstruction}${teaserInstruction}`;
    } else if (bible_passage) {
      userPrompt = `Generate a complete ${totalSections}-section Baptist Bible study lesson for:\n\nBible Passage: ${bible_passage}${additional_notes ? `\nTeacher Notes: ${additional_notes}` : ''}${bibleVersionInstruction}${teaserInstruction}`;
    } else {
      userPrompt = `Generate a complete ${totalSections}-section Baptist Bible study lesson for:\n\nTopic: ${focused_topic}${additional_notes ? `\nTeacher Notes: ${additional_notes}` : ''}${bibleVersionInstruction}${teaserInstruction}`;
    }

    checkpoint = logTiming('Prompt built', checkpoint);

    console.log(`System prompt: ${systemPrompt.length} chars (~${Math.round(systemPrompt.length / 4)} tokens)`);
    console.log(`User prompt: ${userPrompt.length} chars (~${Math.round(userPrompt.length / 4)} tokens)`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[TIMEOUT] Aborting Anthropic request after 120 seconds');
      controller.abort();
    }, 120000);

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
          max_tokens: 8000,
          temperature: 0.6,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      clearTimeout(timeoutId);
      checkpoint = logTiming('Anthropic API returned', checkpoint);

      if (anthropicResponse.status === 429) {
        const errorData = await anthropicResponse.text();
        console.error('Anthropic API rate limited:', errorData);
        
        if (metricId) {
          await supabase
            .from('generation_metrics')
            .update({
              generation_end: new Date().toISOString(),
              generation_duration_ms: Date.now() - functionStartTime,
              status: 'error',
              rate_limited: true,
              anthropic_model: ANTHROPIC_MODEL,
              error_message: 'Anthropic API rate limit exceeded (429)'
            })
            .eq('id', metricId);
        }
        
        throw new Error('Service temporarily busy. Please try again in a few minutes.');
      }

      if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.text();
        console.error('Anthropic API error:', errorData);
        throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorData}`);
      }

      const anthropicData = await anthropicResponse.json();
      let generatedLesson = anthropicData.content[0].text;
      let wordCount = generatedLesson.split(/\s+/).length;

      const tokensInput = anthropicData.usage?.input_tokens || null;
      const tokensOutput = anthropicData.usage?.output_tokens || null;

      console.log(`Lesson generated: ${generatedLesson.length} chars, ${wordCount} words`);
      console.log(`Anthropic usage: ${JSON.stringify(anthropicData.usage)}`);
      console.log(`Tokens - Input: ${tokensInput}, Output: ${tokensOutput}`);

      // =========================================================================
      // STYLE METADATA EXTRACTION
      // =========================================================================
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
      if (generate_teaser) {
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

      // =========================================================================
      // POST-GENERATION GUARDRAIL CHECK (SSOT: outputGuardrails.ts)
      // Checks for fabricated events, fake quotes, made-up statistics, etc.
      // If violations found, automatically rewrites ONLY the offending sections.
      // Clean lessons pass through with ZERO added cost or delay.
      // =========================================================================
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

        // Log each violation for audit trail
        for (const section of violatedSections) {
          for (const v of section.violations) {
            console.log(`  [${v.patternId}] Section ${section.sectionId}: ${v.description}`);
            console.log(`    Context: "${v.matchedText}"`);
          }
        }

        // Build targeted rewrite prompt for ONLY the offending sections
        const rewritePrompt = buildRewritePrompt(violatedSections);

        try {
          const rewriteController = new AbortController();
          const rewriteTimeoutId = setTimeout(() => rewriteController.abort(), REWRITE_CONFIG.timeoutMs);

          const rewriteResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicApiKey,
              'anthropic-version': '2023-06-01'
            },
            signal: rewriteController.signal,
            body: JSON.stringify({
              model: ANTHROPIC_MODEL,
              max_tokens: REWRITE_CONFIG.maxTokens,
              temperature: REWRITE_CONFIG.temperature,
              system: rewritePrompt.system,
              messages: [{ role: 'user', content: rewritePrompt.user }]
            })
          });

          clearTimeout(rewriteTimeoutId);

          if (rewriteResponse.ok) {
            const rewriteData = await rewriteResponse.json();
            const rewrittenContent = rewriteData.content[0].text;

            // Parse rewritten sections and replace in original lesson
            const rewrittenParsed = parseLessonSections(rewrittenContent);

            if (rewrittenParsed.length > 0) {
              generatedLesson = replaceSections(generatedLesson, rewrittenParsed);
              rewrittenSectionIds = rewrittenParsed.map(s => s.id);
              wasRewritten = true;

              // Recalculate word count after rewrite
              wordCount = generatedLesson.split(/\s+/).length;

              // Track rewrite API costs separately
              rewriteTokensInput = rewriteData.usage?.input_tokens || 0;
              rewriteTokensOutput = rewriteData.usage?.output_tokens || 0;

              console.log(`GUARDRAIL REWRITE: Sections [${rewrittenSectionIds.join(', ')}] rewritten successfully`);
              console.log(`Rewrite tokens — Input: ${rewriteTokensInput}, Output: ${rewriteTokensOutput}`);

              // Verify the rewrite resolved all violations
              const postRewriteCheck = checkOutputGuardrails(generatedLesson);
              if (!postRewriteCheck.passed) {
                console.log(`GUARDRAIL WARNING: ${postRewriteCheck.totalViolations} violation(s) remain after rewrite — delivering as-is`);
              } else {
                guardrailCheckPassed = true;
                console.log('GUARDRAIL: All violations resolved after rewrite');
              }
            } else {
              console.error('GUARDRAIL REWRITE: Could not parse rewritten sections from API response');
            }
          } else {
            console.error('GUARDRAIL REWRITE FAILED: API returned', rewriteResponse.status);
          }
        } catch (rewriteError) {
          if (rewriteError.name === 'AbortError') {
            console.error('GUARDRAIL REWRITE: Timed out after', REWRITE_CONFIG.timeoutMs / 1000, 'seconds');
          } else {
            console.error('GUARDRAIL REWRITE ERROR:', rewriteError);
          }
          // Continue with original content — don't block lesson delivery
        }
      } else {
        console.log('GUARDRAIL: Passed — no violations detected');
      }

      checkpoint = logTiming('Guardrail check', checkpoint);

      // =========================================================================
      // PHASE 13.6: LESSON DATA WITH ORG CONTEXT
      // organization_id: ALWAYS set for org members (Org Leader sees all)
      // org_pool_consumed: true only if consumed from org pool (reimbursement indicator)
      // =========================================================================
      const lessonData = {
        user_id: user.id,
        title: lessonInput,
        original_text: generatedLesson,
        // Phase 13.6: Organization context - ALWAYS set for org members
        organization_id: orgPoolResult?.organization_id || null,
        // Phase 13.6: Pool consumption flag - true = church paid, false = member paid
        org_pool_consumed: useOrgPool,
        series_style_metadata: extractedStyleMetadata,
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
          generate_teaser,
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
          sectionCount: totalSections,
          includesTeaser: generate_teaser && teaserContent !== null,
          teaser: teaserContent,
          generationTimeSeconds: ((Date.now() - functionStartTime) / 1000).toFixed(2),
          anthropicUsage: anthropicData.usage,
          wasEnhancement: !!extracted_content,
          extractedContentLength: extracted_content?.length || 0,
          freshnessMode: freshness_mode,
          freshnessSuggestions: selectedFreshness,
          teaserFreshnessSuggestions: selectedTeaserFreshness,
          platformMode: platformMode,
          isTrialLesson: isTrialLesson,
          sectionsGenerated: filteredSections.map(s => s.id),
          extractedStyleMetadata: extract_style_metadata,
          usedSeriesStyleContext: !!series_style_context,
          // Phase 13.6: Org pool metadata for audit trail
          usedOrgPool: useOrgPool,
          organizationId: orgPoolResult?.organization_id || null,
          organizationName: orgPoolResult?.organization_name || null,
          // Output Guardrails: Truth & integrity verification audit trail
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

      // =========================================================================
      // PHASE 13.6: CONSUME FROM ORG POOL (if applicable)
      // Individual usage increment is handled by frontend (SSOT: frontend drives backend)
      // Only org pool consumption happens here (org-level logic, not individual)
      // =========================================================================
      if (useOrgPool && orgPoolResult?.organization_id) {
        const consumed = await consumeFromOrgPool(supabase, orgPoolResult.organization_id);
        if (consumed) {
          console.log('Org pool consumption successful for org:', orgPoolResult.organization_id);
        } else {
          console.error('Org pool consumption failed - this should not happen');
        }
      }

      if (isTrialLesson) {
        await supabase
          .from('profiles')
          .update({ trial_full_lesson_last_used: new Date().toISOString() })
          .eq('id', user.id);
        console.log('Trial lesson consumed for user:', user.id);
      }

      if (metricId) {
        await supabase
          .from('generation_metrics')
          .update({
            lesson_id: lesson.id,
            organization_id: lesson.organization_id,
            generation_end: new Date().toISOString(),
            generation_duration_ms: Date.now() - functionStartTime,
            sections_generated: totalSections,
            status: 'completed',
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            anthropic_model: ANTHROPIC_MODEL
          })
          .eq('id', metricId);
      }

      return new Response(JSON.stringify({
        success: true,
        lesson,
        metadata: lessonData.metadata,
        style_metadata: extractedStyleMetadata
      }), {
        status: 200,
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Anthropic API timeout after 120 seconds');
        if (metricId) {
          await supabase
            .from('generation_metrics')
            .update({
              generation_end: new Date().toISOString(),
              generation_duration_ms: Date.now() - functionStartTime,
              status: 'timeout',
              anthropic_model: ANTHROPIC_MODEL,
              error_message: 'Anthropic API timeout after 120 seconds'
            })
            .eq('id', metricId);
        }
        throw new Error('Lesson generation timed out. Please try again.');
      }
      throw fetchError;
    }

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

    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
