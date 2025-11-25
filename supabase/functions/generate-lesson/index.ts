import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { LESSON_STRUCTURE_VERSION, getRequiredSections, getOptionalSections, getTotalMinWords, getTotalMaxWords, getTeaserSection } from '../_shared/lessonStructure.ts';
import { AGE_GROUPS } from '../_shared/ageGroups.ts';
import { THEOLOGY_PROFILES } from '../_shared/theologyProfiles.ts';
import { buildCustomizationDirectives } from '../_shared/customizationDirectives.ts';
import { validateLessonRequest } from '../_shared/validation.ts';
import { checkRateLimit, logUsage } from '../_shared/rateLimit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function logTiming(label: string, startTime: number): number {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[TIMING] ${label}: ${elapsed}s`);
  return Date.now();
}

function buildSectionsPrompt(includeTeaser: boolean = false) {
  const sections = [...getRequiredSections()];

  return sections.map((section) => {
    const rules = section.contentRules.map((r) => `    ? ${r}`).join('\n');
    const prohibitions = section.prohibitions.map((p) => `    ? ${p}`).join('\n');
    const redundancyNote = section.redundancyLock.length > 0
      ? `\n    ?? REDUNDANCY LOCK: Do NOT repeat content from: ${section.redundancyLock.join(', ')}`
      : '';
    const optionalNote = section.optional ? '\n    ? OPTIONAL SECTION - Only include when requested' : '';

    let enforcementNote = '';
    if (section.id === 5) {
      enforcementNote = `

?? CRITICAL ENFORCEMENT FOR THIS SECTION:
1. MANDATORY MINIMUM: ${section.minWords} words (COUNT CAREFULLY)
2. Every sentence must ADD NEW INSIGHT or DEPTH
3. If explaining a concept, give the WHY and HOW, not just the WHAT
4. Anticipate follow-up questions and answer them preemptively
5. Connect abstract theology to concrete life application
6. Give teachers substance to answer student questions confidently

? FORBIDDEN - These do NOT count toward word target:
- Repetition of content from other sections
- Transitional phrases ("As we discussed...", "Moving on...")
- Padding sentences that add no value
- Circular reasoning or restating the same point
- Generic statements without specific application

? REQUIRED - Every sentence must do ONE of these:
- Unpack a theological concept with depth
- Explain WHY something matters (not just that it does)
- Give concrete examples or applications
- Anticipate and answer "What do you mean by that?"
- Draw from Section 3's depth and make it spoken/teachable
- Bridge abstract truth to student's real-world experience

?? QUALITY CHECK: Before finishing this section, ask yourself:
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

  const rules = teaserSection.contentRules.map((r) => `    ? ${r}`).join('\n');
  const prohibitions = teaserSection.prohibitions.map((p) => `    ? ${p}`).join('\n');

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

?? CRITICAL TEASER ENFORCEMENT:
This section is ONLY about FELT NEEDS. You must create curiosity WITHOUT revealing ANY lesson content.

REQUIRED SIGNOFF:
- End with a compelling reason to attend WITHOUT revealing content
- Use time-neutral language: "next time we meet" or "when we gather" (NOT "Sunday")
- Focus on the benefit of discovering answers, not what will be taught
- Create urgency through curiosity, not promotional language

EXAMPLES:
? WRONG TEASER: "Discover what makes you unique - made in God's image"
? RIGHT TEASER: "Ever feel like you're supposed to be more than you are? Like there's a bigger purpose you can't quite see? Let's talk about it next time we meet—you might be surprised by what we uncover."

? WRONG SIGNOFF: "Join us Sunday to learn about God's plan!"
? RIGHT SIGNOFF: "When we gather, we'll explore this together. I think you'll find some clarity."

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

  try {
    let checkpoint = functionStartTime;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

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

    const requestData = await req.json();

    // Validate and sanitize input
    const validatedData = validateLessonRequest(requestData);
    const {
      bible_passage,
      focused_topic,
      age_group,
      theology_profile_id,
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
      generate_teaser = false
    } = validatedData;

    if (!bible_passage && !focused_topic) {
      throw new Error('Either bible_passage or focused_topic is required');
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

    const requiredSections = getRequiredSections();
    const totalSections = requiredSections.length;

    console.log('Generating lesson:', {
      user: user.id,
      theology: theologyProfile.name,
      ageGroup: ageGroupData.label,
      passage: bible_passage,
      topic: focused_topic,
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

    const systemPrompt = `You are a Baptist Bible study lesson generator using the LessonSparkUSA Framework.

-------------------------------------------------------------------------------
THEOLOGY PROFILE: ${theologyProfile.name}
-------------------------------------------------------------------------------
${theologyProfile.description}

Distinctives:
${theologyProfile.distinctives.map((d) => `• ${d}`).join('\n')}

Hermeneutics: ${theologyProfile.hermeneutics || 'Standard grammatical-historical interpretation'}
Application Focus: ${theologyProfile.applicationEmphasis || 'Practical life application'}

-------------------------------------------------------------------------------
AUDIENCE: ${ageGroupData.label} (ages ${ageGroupData.ageMin}-${ageGroupData.ageMax})
-------------------------------------------------------------------------------
Vocabulary Level: ${ageGroupData.teachingProfile.vocabularyLevel}
Conceptual Depth: ${ageGroupData.teachingProfile.conceptualDepth}
${customizationDirectives}
${buildTeaserInstructions(generate_teaser)}
${buildCompressionRules(generate_teaser)}
-------------------------------------------------------------------------------
THE ${totalSections}-SECTION FRAMEWORK (Structure Version ${LESSON_STRUCTURE_VERSION})
-------------------------------------------------------------------------------
${buildSectionsPrompt(generate_teaser)}
-------------------------------------------------------------------------------
MANDATORY PRE-RELEASE SELF-EVALUATION
-------------------------------------------------------------------------------

?? STOP - Before outputting your completed lesson, perform this evaluation:

SECTION-BY-SECTION VERIFICATION:
? Section 1: 150-250 words? All required elements present?
? Section 2: 150-250 words? Objectives measurable?
? Section 3: 450-600 words? Deep theology complete?
? Section 4: 120-200 words? Engaging opening created?
? Section 5: MINIMUM 630 words? (COUNT CAREFULLY) Deep explanations included?
? Section 6: 150-250 words? Clear activity instructions?
? Section 7: 200-300 words? Assessment questions included?
? Section 8: 250-400 words? Student-focused and distinct from teacher content?
${generate_teaser ? '? Student Teaser: 50-100 words? NO passage/topic/theology revealed? Compelling signoff included?' : ''}

QUALITY VERIFICATION:
? Section 5 contains explanations, not just assertions?
? Theological concepts unpacked with WHY and HOW?
? Teacher has substance to answer follow-up questions?
${generate_teaser ? '? Student teaser reveals ZERO lesson content? Ends with compelling time-neutral signoff?' : ''}
${generate_teaser ? '? Teaser appears ONCE at the beginning, not repeated later?' : ''}
? No redundancy between sections?
? Every sentence adds value?
? No filler or padding?
? NO word count metadata in section headers?

CRITICAL FAILURES - If ANY of these are true, DO NOT OUTPUT:
? Section 5 is under 630 words
${generate_teaser ? '? Teaser mentions passage, topic, or theological concepts' : ''}
${generate_teaser ? '? Teaser lacks compelling signoff or uses day-specific language' : ''}
${generate_teaser ? '? Teaser appears more than once in the output' : ''}
? Sections repeat theology already covered in Section 3
? Any section ends mid-sentence or incomplete
? Word counts appear in section headers

IF ANY CHECKBOX IS UNCHECKED: 
GO BACK and fix that section NOW before outputting.

ONLY output the lesson when ALL checkboxes are marked ?
-------------------------------------------------------------------------------
OUTPUT FORMAT
-------------------------------------------------------------------------------
${generate_teaser ? `
REQUIRED OUTPUT STRUCTURE:

**STUDENT TEASER**
[teaser content here - 50-100 words]

---

## Section 1: Lens + Lesson Overview
[content here]

---

## Section 2: Learning Objectives + Key Scriptures
[content here]

[...and so on]

IMPORTANT: The teaser appears ONCE at the beginning. Do NOT repeat it anywhere else.
` : ''}

Use Markdown formatting:
- ## for section headers
- **bold** for key terms
- Bullet points for lists
- --- for section dividers

DO NOT include word counts in section headers or anywhere in the output.
`;

    const lessonInput = bible_passage || focused_topic || 'General Bible Study';

    const userPrompt = bible_passage
      ? `Generate a complete ${totalSections}-section Baptist Bible study lesson for:\n\nBible Passage: ${bible_passage}${additional_notes ? `\nTeacher Notes: ${additional_notes}` : ''}${generate_teaser ? '\n\nIMPORTANT: Generate a Student Teaser (50-100 words) and place it at the TOP of the lesson under "**STUDENT TEASER**" followed by "---". Do NOT repeat the teaser content anywhere else. The teaser must build anticipation through FELT NEEDS ONLY, with ZERO revelation of passage, topic, or theological content. MUST end with a compelling, time-neutral signoff.' : ''}`
      : `Generate a complete ${totalSections}-section Baptist Bible study lesson for:\n\nTopic: ${focused_topic}${additional_notes ? `\nTeacher Notes: ${additional_notes}` : ''}${generate_teaser ? '\n\nIMPORTANT: Generate a Student Teaser (50-100 words) and place it at the TOP of the lesson under "**STUDENT TEASER**" followed by "---". Do NOT repeat the teaser content anywhere else. The teaser must build anticipation through FELT NEEDS ONLY, with ZERO revelation of passage, topic, or theological content. MUST end with a compelling, time-neutral signoff.' : ''}`;

    checkpoint = logTiming('Prompt built', checkpoint);

    console.log(`System prompt: ${systemPrompt.length} chars (~${Math.round(systemPrompt.length / 4)} tokens)`);

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
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          temperature: 0.6,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      });

      clearTimeout(timeoutId);
      checkpoint = logTiming('Anthropic API returned', checkpoint);

      if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.text();
        console.error('Anthropic API error:', errorData);
        throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorData}`);
      }

      const anthropicData = await anthropicResponse.json();
      let generatedLesson = anthropicData.content[0].text;
      const wordCount = generatedLesson.split(/\s+/).length;

      console.log(`Lesson generated: ${generatedLesson.length} chars, ${wordCount} words`);
      console.log(`Anthropic usage: ${JSON.stringify(anthropicData.usage)}`);

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
          age_group,
          theology_profile_id,
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
          generate_teaser
        },
        metadata: {
          lessonStructureVersion: LESSON_STRUCTURE_VERSION,
          generatedAt: new Date().toISOString(),
          theologyProfile: theologyProfile.name,
          ageGroup: ageGroupData.label,
          wordCount: wordCount,
          sectionCount: totalSections,
          includesTeaser: generate_teaser && teaserContent !== null,
          teaser: teaserContent,
          generationTimeSeconds: ((Date.now() - functionStartTime) / 1000).toFixed(2),
          anthropicUsage: anthropicData.usage
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
        throw new Error('Lesson generation timed out. Please try again.');
      }
      throw fetchError;
    }

  } catch (error) {
    logTiming('ERROR occurred at', functionStartTime);
    console.error('Error in generate-lesson:', error);

    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


