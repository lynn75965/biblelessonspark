import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

import { LESSON_STRUCTURE_VERSION, LESSON_SECTIONS, TOTAL_TARGET_WORD_COUNT } from '../_shared/lessonStructure.ts';
import { AGE_GROUPS } from '../_shared/ageGroups.ts';
import { THEOLOGY_PROFILES } from '../_shared/theologyProfiles.ts';
import { buildCustomizationDirectives } from '../_shared/customizationDirectives.ts';

interface LessonRequest {
  bible_passage?: string;
  focused_topic?: string;
  age_group: string;
  theology_profile_id: string;
  additional_notes?: string;
  teaching_style?: string;
  lesson_length?: string;
  activity_types?: string[];
  language?: string;
  class_setting?: string;
  learning_environment?: string;
  student_experience?: string;
  cultural_context?: string;
  special_needs?: string;
  lesson_sequence?: string;
  assessment_style?: string;
  learning_style?: string;
  education_experience?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function logTiming(label: string, startTime: number) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[TIMING] ${label}: ${elapsed}s`);
  return Date.now();
}

serve(async (req) => {
  const functionStartTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    let checkpoint = functionStartTime;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const requestData: LessonRequest = await req.json();
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
    } = requestData;

    if (!bible_passage && !focused_topic) {
      throw new Error('Either bible_passage or focused_topic is required');
    }
    if (!age_group) {
      throw new Error('age_group is required');
    }
    if (!theology_profile_id) {
      throw new Error('theology_profile_id is required');
    }

    const theologyProfile = THEOLOGY_PROFILES.find(p => p.id === theology_profile_id);
    if (!theologyProfile) {
      throw new Error(`Theology profile not found: ${theology_profile_id}`);
    }

    const ageGroupData = AGE_GROUPS.find(ag => ag.id === age_group);
    if (!ageGroupData) {
      throw new Error(`Age group not found: ${age_group}`);
    }

    console.log('Generating lesson for:', {
      user: user.id,
      theology: theologyProfile.name,
      ageGroup: ageGroupData.label,
      passage: bible_passage,
      topic: focused_topic
    });

    const sectionsPrompt = LESSON_SECTIONS.map((section, index) => 
      `${index + 1}. ${section.name} (~${section.targetWordCount} words): ${section.description}`
    ).join('\n');

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

    const systemPrompt = `You are a Baptist Bible study lesson generator. Generate a complete ${TOTAL_TARGET_WORD_COUNT}-word lesson.

THEOLOGY: ${theologyProfile.name}
${theologyProfile.description}
Distinctives:
${theologyProfile.distinctives.map(d => `• ${d}`).join('\n')}
${theologyProfile.hermeneutics ? `Hermeneutics: ${theologyProfile.hermeneutics}` : ''}
${theologyProfile.applicationEmphasis ? `Application Focus: ${theologyProfile.applicationEmphasis}` : ''}

AUDIENCE: ${ageGroupData.label} (ages ${ageGroupData.ageMin}-${ageGroupData.ageMax})
Vocabulary: ${ageGroupData.teachingProfile.vocabularyLevel} | Depth: ${ageGroupData.teachingProfile.conceptualDepth}
${customizationDirectives}
REQUIRED SECTIONS (${LESSON_SECTIONS.length} total, ~${TOTAL_TARGET_WORD_COUNT} words):
${sectionsPrompt}

OUTPUT FORMAT: Use Markdown formatting. Use ## for section headers, bullet points for lists, **bold** for key terms, and --- for section dividers.

OUTPUT: Generate all ${LESSON_SECTIONS.length} sections. Include both Teacher Lesson Plan and Student Handout. Maintain ${theologyProfile.name} theological standards throughout. FOLLOW ALL CUSTOMIZATION DIRECTIVES above.`;

    const lessonInput = bible_passage || focused_topic || 'General Bible Study';

    const userPrompt = bible_passage 
      ? `Bible Passage: ${bible_passage}${additional_notes ? `\nNotes: ${additional_notes}` : ''}`
      : `Topic: ${focused_topic}${additional_notes ? `\nNotes: ${additional_notes}` : ''}`;

    checkpoint = logTiming('Prompt built', checkpoint);
    console.log(`System prompt length: ${systemPrompt.length} chars (~${Math.round(systemPrompt.length / 4)} tokens)`);

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
          max_tokens: 6000,
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
      const generatedLesson = anthropicData.content[0].text;

      const wordCount = generatedLesson.split(/\s+/).length;
      console.log(`Lesson generated: ${generatedLesson.length} chars, ${wordCount} words`);
      console.log(`Anthropic usage: ${JSON.stringify(anthropicData.usage)}`);
      
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
          additional_notes: additional_notes || null
        },
        metadata: {
          lessonStructureVersion: LESSON_STRUCTURE_VERSION,
          generatedAt: new Date().toISOString(),
          theologyProfile: theologyProfile.name,
          ageGroup: ageGroupData.label,
          wordCount: wordCount,
          sectionCount: LESSON_SECTIONS.length,
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
      console.log('Lesson saved to database:', lesson.id);

      return new Response(
        JSON.stringify({ success: true, lesson, metadata: lessonData.metadata }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Anthropic API timeout after 120 seconds');
        throw new Error('Lesson generation timed out. Please try again with a shorter lesson or simpler topic.');
      }
      throw fetchError;
    }

  } catch (error) {
    logTiming('ERROR occurred at', functionStartTime);
    console.error('Error in generate-lesson function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred', details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
