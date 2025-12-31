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
import { checkLessonLimit, incrementLessonUsage, getSectionsForTier } from '../_shared/subscriptionCheck.ts';
import { parseDeviceType, parseBrowser, parseOS } from '../_shared/generationMetrics.ts';
import { buildFreshnessContext, selectFreshElements, buildFreshnessSuggestionsPrompt, FreshnessSuggestions } from '../_shared/freshnessOptions.ts';
import { PLATFORM_MODE_ACCESS, ORG_TYPES } from '../_shared/organizationConfig.ts';
import { TRIAL_CONFIG, isTrialAvailable, doesTrialApply } from '../_shared/trialConfig.ts';

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
    const rules = section.contentRules.map((r) => `    â€¢ ${r}`).join('\n');
    const prohibitions = section.prohibitions.map((p) => `    â€¢ ${p}`).join('\n');
    const redundancyNote = section.redundancyLock.length > 0
      ? `\n    âš ï¸ REDUNDANCY LOCK: Do NOT repeat content from: ${section.redundancyLock.join(', ')}`
      : '';
    const optionalNote = section.optional ? '\n    â€¢ OPTIONAL SECTION - Only include when requested' : '';

    let enforcementNote = '';
    if (section.id === 5) {
      enforcementNote = `

âš ï¸ CRITICAL ENFORCEMENT FOR THIS SECTION:
1. MANDATORY MINIMUM: ${section.minWords} words (COUNT CAREFULLY)
2. Every sentence must ADD NEW INSIGHT or DEPTH
3. If explaining a concept, give the WHY and HOW, not just the WHAT
4. Anticipate follow-up questions and answer them preemptively
5. Connect abstract theology to concrete life application
6. Give teachers substance to answer student questions confidently

ðŸš« FORBIDDEN - These do NOT count toward word target:
- Repetition of content from other sections
- Transitional phrases ("As we discussed...", "Moving on...")
- Padding sentences that add no value
- Circular reasoning or restating the same point
- Generic statements without specific application

âœ… REQUIRED - Every sentence must do ONE of these:
- Unpack a theological concept with depth
- Explain WHY something matters (not just that it does)
- Give concrete examples or applications
- Anticipate and answer "What do you mean by that?"
- Draw from Section 3's depth and make it spoken/teachable
- Bridge abstract truth to student's real-world experience

âš ï¸ QUALITY CHECK: Before finishing this section, ask yourself:
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

function buildTeaserInstructions(includeTeaser: boolean): string {
  if (!includeTeaser) return '';

  const teaserSection = getTeaserSection();
  if (!teaserSection) return '';

  const rules = teaserSection.contentRules.map((r) => `    â€¢ ${r}`).join('\n');
  const prohibitions = teaserSection.prohibitions.map((p) => `    â€¢ ${p}`).join('\n');

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

âš ï¸ CRITICAL TEASER ENFORCEMENT:
This section is ONLY about FELT NEEDS. You must create curiosity WITHOUT revealing ANY lesson content.

REQUIRED SIGNOFF:
- End with a compelling reason to attend WITHOUT revealing content
- Use time-neutral language: "next time we meet" or "when we gather" (NOT "Sunday")
- Focus on the benefit of discovering answers, not what will be taught
- Create urgency through curiosity, not promotional language

EXAMPLES:
âŒ WRONG TEASER: "Discover what makes you unique - made in God's image"
âœ… RIGHT TEASER: "Ever feel like you're supposed to be more than you are? Like there's a bigger purpose you can't quite see? Let's talk about it next time we meetâ€”you might be surprised by what we uncover."

âŒ WRONG SIGNOFF: "Join us Sunday to learn about God's plan!"
âœ… RIGHT SIGNOFF: "When we gather, we'll explore this together. I think you'll find some clarity."

REMEMBER:
- DO NOT reference the Bible passage in ANY way
- DO NOT hint at theological concepts
- DO NOT use subject-specific terms
- ONLY touch on emotions and questions the student already feels
- Create a gap that ONLY attending class can fill
- Output teaser ONCE at the beginning, then move to Section 1
`;
}

serve(async (req) => {
  const functionStartTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Declare metricId and supabase at function scope for error handling
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

    // Check subscription tier and lesson limit
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const userTier = limitCheck.tier;
    const allowedSections = limitCheck.sections_allowed;

    // =========================================================================
    // PLATFORM MODE & SECTION FILTERING (SSOT: organizationConfig.ts, trialConfig.ts)
    // =========================================================================
    
    // Fetch platform mode from system_settings
    const { data: platformModeRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'current_phase')
      .single();
    
    const platformMode = (platformModeRow?.value || 'private_beta') as keyof typeof PLATFORM_MODE_ACCESS;
    const modeConfig = PLATFORM_MODE_ACCESS[platformMode] || PLATFORM_MODE_ACCESS.private_beta;
    
    console.log('Platform mode:', platformMode, 'Tier enforcement:', modeConfig.tierEnforcement);
    
    // Determine sections to generate based on platform mode
    let sectionsToGenerate: number[];
    let isTrialLesson = false;
    
    if (!modeConfig.tierEnforcement) {
      // BETA MODE: Everyone gets all sections
      sectionsToGenerate = getRequiredSections().map(s => s.id);
      console.log('Beta mode: All users get all sections');
    } else {
      // PRODUCTION MODE: Check tier and trial
      if (doesTrialApply(platformMode, userTier)) {
        // Fetch user's trial status
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
          // TRIAL: Give full sections, mark as trial
          sectionsToGenerate = getRequiredSections().map(s => s.id);
          isTrialLesson = true;
          console.log('Trial lesson: Free user gets all sections (monthly trial)');
        } else {
          // NO TRIAL: Use tier-based sections
          sectionsToGenerate = allowedSections || getSectionsForTier(userTier);
          console.log('Production mode: User tier', userTier, 'gets sections:', sectionsToGenerate);
        }
      } else {
        // Paid tier or non-free: Use tier-based sections
        sectionsToGenerate = allowedSections || getSectionsForTier(userTier);
        console.log('Production mode: User tier', userTier, 'gets sections:', sectionsToGenerate);
      }
    }
    
    // Filter required sections based on what user is allowed
    const allRequiredSections = getRequiredSections();
    const filteredSections = allRequiredSections.filter(s => sectionsToGenerate.includes(s.id));
    
    console.log('Sections to generate:', filteredSections.map(s => s.id + ': ' + s.name));

    // Capture metrics - SSOT functions from generationMetrics.ts
    const userAgent = req.headers.get('user-agent') || '';
    const deviceType = parseDeviceType(userAgent);
    const browser = parseBrowser(userAgent);
    const os = parseOS(userAgent);
    
    // Insert started metric
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
        status: 'started'
      })
      .select('id')
      .single();
    
    metricId = metricRecord?.id;

    const requestData = await req.json();

    // Validate and sanitize input
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
      generate_teaser = false,
      freshness_mode = 'fresh',
      include_liturgical = false,
      include_cultural = false,
      freshness_suggestions = null
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

    // Get Bible version - default to KJV if not specified
    const effectiveBibleVersionId = bible_version_id || getDefaultBibleVersion().id;
    const bibleVersion = BIBLE_VERSIONS.find((v) => v.id === effectiveBibleVersionId);
    if (!bibleVersion) {
      throw new Error(`Bible version not found: ${effectiveBibleVersionId}`);
    }

    // Use filteredSections (set earlier based on platform mode + tier)
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
      wordTarget: `${getTotalMinWords()}-${getTotalMaxWords()}${generate_teaser ? ' (+50-100 for teaser)' : ''}`
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
      education_experience
    });

    // Build copyright guardrails based on Bible version
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

-------------------------------------------------------------------------------
BIBLE VERSION: ${bibleVersion.name} (${bibleVersion.abbreviation})
-------------------------------------------------------------------------------
Copyright Status: ${bibleVersion.copyrightStatus}
Quote Type: ${bibleVersion.quoteType}

${copyrightGuardrails}

${customizationDirectives}

${buildTeaserInstructions(generate_teaser)}

${buildFreshnessContext(new Date(), freshness_mode, include_liturgical, include_cultural)}

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

      // Check for rate limit (429) error
      if (anthropicResponse.status === 429) {
        const errorData = await anthropicResponse.text();
        console.error('Anthropic API rate limited:', errorData);
        
        // Update metric with rate_limited flag
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
      const wordCount = generatedLesson.split(/\s+/).length;

      // Extract token usage from response
      const tokensInput = anthropicData.usage?.input_tokens || null;
      const tokensOutput = anthropicData.usage?.output_tokens || null;

      console.log(`Lesson generated: ${generatedLesson.length} chars, ${wordCount} words`);
      console.log(`Anthropic usage: ${JSON.stringify(anthropicData.usage)}`);
      console.log(`Tokens - Input: ${tokensInput}, Output: ${tokensOutput}`);

      let teaserContent: string | null = null;
      if (generate_teaser) {
        const teaserMatch = generatedLesson.match(/\*\*STUDENT TEASER\*\*\s*([\s\S]*?)---/i);
        if (teaserMatch) {
          teaserContent = teaserMatch[1].trim();
          console.log(`Teaser extracted: ${teaserContent.split(/\s+/).length} words`);

          // Remove the teaser section from the lesson text so it doesn't appear twice
          generatedLesson = generatedLesson.replace(/\*\*STUDENT TEASER\*\*\s*[\s\S]*?---\s*/, '');
        } else {
          console.log('Warning: Teaser was requested but not found in output');
        }
      }

      checkpoint = logTiming('Response parsed', checkpoint);

      const lessonData = {
        user_id: user.id,
        title: lessonInput,
        original_text: generatedLesson,
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
          additional_notes: additional_notes || null,
          generate_teaser,
          freshness_mode
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
          freshnessSuggestions: freshness_suggestions,
          platformMode: platformMode,
          isTrialLesson: isTrialLesson,
          sectionsGenerated: filteredSections.map(s => s.id)
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

      checkpoint = logTiming('Database insert', checkpoint);
      logTiming('TOTAL FUNCTION TIME', functionStartTime);

      console.log('Lesson saved:', lesson.id);

      // Increment lesson usage for subscription tracking
      await incrementLessonUsage(supabase, user.id);
      console.log('Lesson usage incremented for user:', user.id);

      // Consume trial if this was a trial lesson
      if (isTrialLesson) {
        await supabase
          .from('profiles')
          .update({ trial_full_lesson_last_used: new Date().toISOString() })
          .eq('id', user.id);
        console.log('Trial lesson consumed for user:', user.id);
      }

      // Update metric to completed with token tracking
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
        metadata: lessonData.metadata
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Anthropic API timeout after 120 seconds');
        // Update metric to timeout
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
    
    // Update metric to error
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
