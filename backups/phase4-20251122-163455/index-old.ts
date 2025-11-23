import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
// DATA imports from SSOT (no logic imports)
import { LESSON_SECTIONS, LESSON_STRUCTURE_VERSION, TOTAL_TARGET_WORD_COUNT } from '../_shared/lessonStructure.ts'
import { getAgeGroupByLabel } from '../_shared/ageGroups.ts'
import { 
  THEOLOGICAL_PREFERENCES,
  SB_CONFESSION_VERSIONS,
  getTheologicalPreference,
  getDistinctives,
  isValidTheologicalPreferenceKey,
} from '../_shared/theologicalPreferences.ts'
import type { TheologicalPreferenceKey, SBConfessionVersionKey } from '../_shared/theologicalPreferences.ts'
import { DEFAULT_TEACHER_PREFERENCES, getOptionLabel, CLASS_SIZES } from '../_shared/teacherPreferences.ts'
import type { TeacherPreferences } from '../_shared/teacherPreferences.ts'



interface LessonRequest {
  passage?: string;
  topic?: string;
  passageOrTopic: string;
  ageGroup: string;
  notes?: string;
  enhancementType: 'curriculum' | 'generation' | 'enhance' | 'generate';
  extractedContent?: string;
  teacherPreferences?: TeacherPreferences;
  theologicalPreference: 'southern_baptist' | 'reformed_baptist' | 'independent_baptist';
  sbConfessionVersion?: 'bfm_1963' | 'bfm_2000';
  bibleVersion?: string;
  sessionId?: string;
  uploadId?: string;
  fileHash?: string;
  sourceFile?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(userId: string): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return {
      allowed: true,
      remainingRequests: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: userLimit.resetTime
    };
  }

  userLimit.count++;
  rateLimitMap.set(userId, userLimit);

  return {
    allowed: true,
    remainingRequests: RATE_LIMIT_MAX_REQUESTS - userLimit.count,
    resetTime: userLimit.resetTime
  };
}

// LOGIC: Build lesson structure prompt from SSOT data
// This function lives here (Edge Function) because it's LOGIC, not DATA
function buildLessonStructurePrompt(): string {
  return LESSON_SECTIONS.map(section => 
    `${section.id}. ${section.name}: ${section.description}\n   Required elements: ${section.requiredElements.join(', ')}\n   Target: ~${section.targetWordCount} words`
  ).join('\n\n');
}

// SSOT Age Group Lookup - uses data from _shared/ageGroups.ts
function getAgeGroupData(ageGroupLabel: string) {
  const ageGroup = getAgeGroupByLabel(ageGroupLabel);
  if (ageGroup) {
    return ageGroup;
  }
  // Fallback for unrecognized labels
  console.warn(`Unrecognized age group label: ${ageGroupLabel}, using fallback`);
  return {
    id: 'unknown',
    label: ageGroupLabel,
    ageMin: 0,
    ageMax: 100,
    description: `Tailored for ${ageGroupLabel}`,
    teachingProfile: {
      vocabularyLevel: 'moderate' as const,
      attentionSpan: 30,
      preferredActivities: ['discussion', 'group activities'],
      abstractThinking: 'developing' as const,
      specialConsiderations: ['Adapt content to actual audience needs']
    }
  };
}

async function generateLessonWithAI(data: LessonRequest) {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }


  // Get theological lens from SSOT
  const prefKey = data.theologicalPreference as TheologicalPreferenceKey;
  const lens = getTheologicalPreference(prefKey);
  
  let versionLabel = '';
  let versionKey: SBConfessionVersionKey | undefined;
  
  if (prefKey === 'southern_baptist') {
    versionKey = (data.sbConfessionVersion as SBConfessionVersionKey) || 'bfm_2000';
    const version = SB_CONFESSION_VERSIONS[versionKey];
    versionLabel = version?.label || '';
  }
  
  const lensDistinctives = getDistinctives(prefKey, versionKey);


  // Use SSOT age group lookup
  const ageGroupInfo = getAgeGroupData(data.ageGroup);

  const buildCustomizationContext = (prefs: TeacherPreferences): string => {
    if (!prefs) return '';

    const context = [];
    context.push(`Teaching Style: ${prefs.teachingStyle.replace(/_/g, ' ')} approach`);
    context.push(`Classroom Management: ${prefs.classroomManagement.replace(/_/g, ' ')} format`);
    context.push(`Technology Integration: ${prefs.techIntegration} level of technology use`);
    context.push(`Class Size: ${prefs.classSize} (${prefs.classSize === 'small' ? '5-15' : prefs.classSize === 'medium' ? '16-30' : prefs.classSize === 'large' ? '31-50' : '50+'} people)`);
    context.push(`Session Duration: ${prefs.sessionDuration}`);
    context.push(`Physical Space: ${prefs.physicalSpace.replace(/_/g, ' ')}`);

    if (prefs.learningStyles.length > 0) {
      context.push(`Learning Styles: Focus on ${prefs.learningStyles.join(', ')} learners`);
    }
    context.push(`Engagement Level: ${prefs.engagementLevel.replace(/_/g, ' ')}`);
    context.push(`Discussion Format: ${prefs.discussionFormat.replace(/_/g, ' ')}`);
    context.push(`Activity Complexity: ${prefs.activityComplexity} level activities`);
    context.push(`Bible Translation: ${prefs.bibleTranslation}`);
    context.push(`Theological Emphasis: ${prefs.theologicalEmphasis.replace(/_/g, ' ')} style`);
    context.push(`Application Focus: ${prefs.applicationFocus.replace(/_/g, ' ')}`);
    context.push(`Study Depth: ${prefs.depthLevel.replace(/_/g, ' ')}`);
    context.push(`Handout Style: ${prefs.handoutStyle.replace(/_/g, ' ')}`);
    context.push(`Visual Aids: ${prefs.visualAidPreference.replace(/_/g, ' ')}`);
    context.push(`Preparation Time Available: ${prefs.preparationTime}`);
    context.push(`Cultural Background: ${prefs.culturalBackground} context`);
    context.push(`Educational Background: ${prefs.educationalBackground.replace(/_/g, ' ')}`);
    context.push(`Spiritual Maturity: ${prefs.spiritualMaturity.replace(/_/g, ' ')}`);

    if (prefs.specialNeeds.length > 0) {
      context.push(`Special Considerations: ${prefs.specialNeeds.join(', ').replace(/_/g, ' ')}`);
    }

    if (prefs.additionalContext) {
      context.push(`Additional Context: ${prefs.additionalContext}`);
    }

    return context.join('\n');
  };

  const customizationContext = buildCustomizationContext(data.teacherPreferences || {} as TeacherPreferences);
  
  // ✅ FIX: Build focus string that includes BOTH passage AND topic when provided
  const passageOrTopic = data.passage || data.topic || data.passageOrTopic;
  const passagePart = data.passage ? `Bible Passage: ${data.passage}` : '';
  const topicPart = data.topic ? `Topic Focus: ${data.topic}` : '';
  const focusString = [passagePart, topicPart].filter(Boolean).join(' | ') || passageOrTopic;

  const enhancementPrompt = data.enhancementType === 'curriculum' || data.enhancementType === 'enhance'
    ? `Enhance and expand the following existing curriculum content: "${data.extractedContent}". Additional focus: ${focusString}. Build upon this foundation while maintaining its core structure and adding comprehensive depth.`
    : `Generate a complete, original lesson plan based on: ${focusString}.`;

  const lensDisplayName = versionLabel ? `${lens.name} — ${versionLabel}` : lens.name;
  const lensSubtitle = versionLabel ? `Confession: ${versionLabel}` : '';

  // Build dynamic lesson structure from SSOT constants (using local LOGIC function)
  const lessonStructurePrompt = buildLessonStructurePrompt();

  const systemPrompt = `You are an expert Bible curriculum developer with 20+ years of experience creating comprehensive, engaging lesson plans for ${data.ageGroup} from a ${lens.contextDescription}

THEOLOGICAL LENS: ${lensDisplayName}
You are generating this lesson under the ${lens.label}${versionLabel ? ` (${versionLabel})` : ''}.
${lens.description}

When doctrine is debated, present this lens' position clearly and charitably without attacking other positions.

REQUIRED: At the very top of your lesson output, include:
1. A Lens Banner showing: "Theological Lens: ${lensDisplayName}"
${lensSubtitle ? `   ${lensSubtitle}` : ''}
2. A "Lens Distinctives" section with exactly these bullet points (use verbatim):
   ${lens.label}${versionLabel ? ` — ${versionLabel}` : ''}
${lensDistinctives.map(d => `   • ${d}`).join('\n')}

REQUIRED: Prefix the lesson title with "${lens.short} • " (e.g., "${lens.short} • Understanding Grace")

TEACHER CUSTOMIZATION PROFILE:
${customizationContext}

Create a publication-ready, comprehensive lesson that includes:

${lessonStructurePrompt}

CONTENT QUALITY REQUIREMENTS:
- Each section should be detailed and comprehensive (not bullet points)
- Include specific materials lists for all activities
- Provide estimated time durations for each component
- Add biblical cross-references and supporting verses
- Include age-appropriate illustrations and examples
- Ensure theological accuracy according to ${data.theologicalPreference} perspective
- Make content immediately usable without additional research

TARGET AUDIENCE: ${ageGroupInfo.description}

AGE GROUP TEACHING PROFILE:
- Vocabulary Level: ${ageGroupInfo.teachingProfile.vocabularyLevel}
- Attention Span: ${ageGroupInfo.teachingProfile.attentionSpan} minutes
- Preferred Activities: ${ageGroupInfo.teachingProfile.preferredActivities.join(', ')}
- Abstract Thinking: ${ageGroupInfo.teachingProfile.abstractThinking}
- Special Considerations: ${ageGroupInfo.teachingProfile.specialConsiderations.join('; ')}

DENOMINATION EMPHASIS: ${lens.contextDescription}

${data.notes ? `ADDITIONAL REQUIREMENTS: ${data.notes}` : ''}

REQUIRED FOOTER: At the end of the lesson, include this note:
"This lesson reflects the ${lens.name} lens selected in settings."

CRITICAL: Aim for approximately ${TOTAL_TARGET_WORD_COUNT}-${TOTAL_TARGET_WORD_COUNT + 500} words total. Ensure ALL ${LESSON_SECTIONS.length} sections are complete with proper conclusions. Do not cut off mid-sentence. Do not skip Section 11 (Student Handout). If approaching the limit, prioritize completing sections over starting new ones.

Lesson Structure Version: ${LESSON_STRUCTURE_VERSION}

Return a comprehensive lesson plan that a teacher could print and use immediately for a 45-60 minute class session.`;

  const userPrompt = enhancementPrompt;

  try {
    console.log('Calling Anthropic API with Claude...');
    console.log(`Using Lesson Structure Version: ${LESSON_STRUCTURE_VERSION}`);
    console.log(`Total sections required: ${LESSON_SECTIONS.length}`);
    console.log(`Target word count: ${TOTAL_TARGET_WORD_COUNT}`);
    console.log(`Focus string: ${focusString}`);
    console.log(`Age Group: ${ageGroupInfo.label} (${ageGroupInfo.id})`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const completion = await response.json();
    const content = completion.content[0].text;

    return {
      fullContent: content,
      wordCount: content.length,
      estimatedDuration: '45-60 minutes',
      structureVersion: LESSON_STRUCTURE_VERSION
    };
  } catch (error) {
    console.error('Error calling Anthropic:', error);
    throw error;
  }
}

function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/\0/g, '')
    .trim();
}

function validateInput(data: any): LessonRequest {
  if (!data.passage && !data.topic && !data.passageOrTopic) {
    throw new Error('Either passage, topic, or passageOrTopic is required');
  }

  if (!data.ageGroup || typeof data.ageGroup !== 'string' || data.ageGroup.trim().length === 0) {
    throw new Error('ageGroup is required and must be a non-empty string');
  }

  if (!data.theologicalPreference || typeof data.theologicalPreference !== 'string') {
    throw new Error('theologicalPreference is required and must be a string');
  }

  const allowedTheologicalPreferences = ['southern_baptist', 'reformed_baptist', 'independent_baptist'];

  if (!allowedTheologicalPreferences.includes(data.theologicalPreference)) {
    throw new Error('Invalid theological preference. Must be one of: southern_baptist, reformed_baptist, independent_baptist');
  }

  const passageOrTopic = data.passage || data.topic || data.passageOrTopic;

  return {
    passage: data.passage ? sanitizeString(data.passage) : undefined,
    topic: data.topic ? sanitizeString(data.topic) : undefined,
    passageOrTopic: sanitizeString(passageOrTopic),
    ageGroup: sanitizeString(data.ageGroup),
    notes: data.notes ? sanitizeString(data.notes) : undefined,
    enhancementType: data.enhancementType || 'generation',
    extractedContent: data.extractedContent ? sanitizeString(data.extractedContent) : undefined,
    teacherPreferences: data.teacherPreferences,
    theologicalPreference: data.theologicalPreference,
    sbConfessionVersion: data.sbConfessionVersion,
    bibleVersion: data.bibleVersion,
    sessionId: data.sessionId,
    uploadId: data.uploadId,
    fileHash: data.fileHash,
    sourceFile: data.sourceFile
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: rateLimit.resetTime
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    const requestData = await req.json()
    console.log('Received request:', JSON.stringify(requestData, null, 2))

    const validatedData = validateInput(requestData)
    console.log('Validated data:', JSON.stringify(validatedData, null, 2))

    const { sessionId, uploadId, fileHash, sourceFile } = requestData;

    const lessonContent = await generateLessonWithAI(validatedData)

    const { data: lesson, error: insertError } = await supabaseClient
      .from('lessons')
      .insert({
        user_id: user.id,
        title: `Lesson: ${validatedData.passageOrTopic}`,
        original_text: lessonContent.fullContent || validatedData.extractedContent || '',
        source_type: validatedData.enhancementType || 'generation',
        upload_path: sourceFile || null,
        filters: {
          ageGroup: validatedData.ageGroup,
          theologicalPreference: validatedData.theologicalPreference,
          enhancementType: validatedData.enhancementType,
          sessionId,
          uploadId,
          fileHash,
          metadata: {
            ageGroup: validatedData.ageGroup,
            enhancementType: validatedData.enhancementType,
            wordCount: lessonContent.wordCount,
            estimatedDuration: lessonContent.estimatedDuration,
            theologicalPreference: validatedData.theologicalPreference,
            sbConfessionVersion: validatedData.sbConfessionVersion || null,
            bibleVersion: validatedData.bibleVersion || 'KJV',
            structureVersion: lessonContent.structureVersion
          }
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving lesson:', insertError)
      throw new Error(`Failed to save lesson: ${insertError.message}`)
    }

    console.log('Successfully generated and saved lesson')

    return new Response(
      JSON.stringify({
        success: true,
        output: {
          teacher_plan: lessonContent
        },
        lesson: lesson,
        sessionId: sessionId || '',
        uploadId: uploadId || '',
        fileHash: fileHash || ''
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in generate-lesson function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
