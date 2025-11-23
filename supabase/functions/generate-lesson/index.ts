import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import {
  LESSON_STRUCTURE_VERSION,
  getEnabledSections,
  getTotalMinWords,
  getTotalMaxWords,
  getSectionCount,
  generateFullPromptStructure,
  generateBehaviorRules
} from '../_shared/lessonStructure.ts'
import { getAgeGroupByLabel } from '../_shared/ageGroups.ts'
import { getTheologyProfile, isValidTheologyProfileId } from '../_shared/theologyProfiles.ts'
import type { TheologyProfile } from '../_shared/theologyProfiles.ts'
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
  theologyProfileId: string;
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
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(userId, { count: 1, resetTime });
    return { allowed: true, remainingRequests: RATE_LIMIT_MAX_REQUESTS - 1, resetTime };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remainingRequests: 0, resetTime: userLimit.resetTime };
  }

  userLimit.count++;
  return { allowed: true, remainingRequests: RATE_LIMIT_MAX_REQUESTS - userLimit.count, resetTime: userLimit.resetTime };
}

function buildTheologicalContext(theologyProfile: TheologyProfile): string {
  return `
THEOLOGICAL FRAMEWORK (${theologyProfile.name}):
${theologyProfile.description}

Key Distinctives:
${theologyProfile.distinctives.map(d => `- ${d}`).join('\n')}

CRITICAL: All content must align with these theological standards. This shapes interpretation, application, and teaching emphasis throughout the lesson.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: `Too many requests. Please wait ${waitTime} seconds before trying again.`,
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

    const requestData: LessonRequest = await req.json();
    const { 
      passageOrTopic, 
      ageGroup, 
      notes, 
      theologyProfileId,
      bibleVersion = 'CSB',
      teacherPreferences 
    } = requestData;

    // Validate theology profile ID
    if (!theologyProfileId || !isValidTheologyProfileId(theologyProfileId)) {
      throw new Error('Invalid theology profile ID');
    }

    const theologyProfile = getTheologyProfile(theologyProfileId);
    if (!theologyProfile) {
      throw new Error('Theology profile not found');
    }

    const ageGroupData = getAgeGroupByLabel(ageGroup);
    if (!ageGroupData) {
      throw new Error(`Invalid age group: ${ageGroup}`);
    }

    const theologicalContext = buildTheologicalContext(theologyProfile);
    const promptStructure = generateFullPromptStructure();
    const behaviorRules = generateBehaviorRules();

    const systemPrompt = `You are a Baptist Bible study lesson generator with deep theological knowledge and 40+ years of ministry experience.

${theologicalContext}

AGE GROUP CONTEXT:
Target Audience: ${ageGroupData.label}
Age Range: ${ageGroupData.ageRange}
Cognitive Level: ${ageGroupData.cognitiveLevel}
Teaching Focus: ${ageGroupData.teachingFocus}

LESSON STRUCTURE (Version ${LESSON_STRUCTURE_VERSION}):
You must generate a lesson with exactly ${getSectionCount()} sections:
${promptStructure}

WORD COUNT REQUIREMENTS:
- Total lesson must be between ${getTotalMinWords()} and ${getTotalMaxWords()} words
- Each section has specific min/max word counts (see structure above)
- Be thorough but concise within these limits

${behaviorRules}

${teacherPreferences ? `
TEACHER PREFERENCES:
${teacherPreferences.teachingStyle ? `Teaching Style: ${teacherPreferences.teachingStyle}` : ''}
${teacherPreferences.classDuration ? `Class Duration: ${teacherPreferences.classDuration} minutes` : ''}
${teacherPreferences.groupSize ? `Group Size: ${teacherPreferences.groupSize}` : ''}
${teacherPreferences.additionalNotes ? `Additional Notes: ${teacherPreferences.additionalNotes}` : ''}
` : ''}

Bible Version: ${bibleVersion}

CRITICAL REMINDERS:
1. Maintain ${theologyProfile.name} theological standards throughout
2. Use age-appropriate language for ${ageGroupData.label}
3. Include all ${getSectionCount()} required sections
4. Stay within word count limits
5. Provide practical, applicable teaching content
`;

    const userPrompt = `Generate a complete Baptist Bible study lesson for:

Passage/Topic: ${passageOrTopic}
${notes ? `Additional Notes: ${notes}` : ''}

Please generate the complete lesson following the structure and requirements specified in the system prompt.`;

    console.log('Calling Anthropic API...');
    console.log('Theology Profile:', theologyProfile.name);
    console.log('Age Group:', ageGroupData.label);

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.text();
      console.error('Anthropic API error:', errorData);
      throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorData}`);
    }

    const anthropicData = await anthropicResponse.json();
    const generatedLesson = anthropicData.content[0].text;

    console.log('Lesson generated successfully');
    console.log(`Lesson length: ${generatedLesson.length} characters`);

    const lessonData = {
      user_id: user.id,
      title: passageOrTopic,
      original_text: generatedLesson,
      enhanced_text: generatedLesson,
      filters: {
        passageOrTopic,
        ageGroup,
        theologyProfileId,
        bibleVersion,
        notes: notes || null
      },
      metadata: {
        lessonStructureVersion: LESSON_STRUCTURE_VERSION,
        generatedAt: new Date().toISOString(),
        theologyProfile: theologyProfile.name,
        ageGroup: ageGroupData.label,
        wordCount: generatedLesson.split(/\s+/).length,
        sectionCount: getSectionCount()
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

    console.log('Lesson saved to database:', lesson.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lesson,
        theologyProfile: theologyProfile.name,
        metadata: lessonData.metadata
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remainingRequests.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    );

  } catch (error) {
    console.error('Error in generate-lesson function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});