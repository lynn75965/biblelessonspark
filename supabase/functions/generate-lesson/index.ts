import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface LessonRequest {
  user_id: string;
  topic: string;
  passage: string;
  age_group: string;
  lesson_length: number;
  lesson_type: 'teacher' | 'student';
  doctrine_profile?: string;
  theological_lens?: string;
  additional_notes?: string;
}

// ENHANCED: Comprehensive age-appropriate teaching strategies
const ageGroupProfiles = {
  'Preschoolers (Ages 3–5)': {
    cognitiveLevel: 'Concrete, literal thinking. Cannot grasp abstract concepts yet.',
    attentionSpan: '5-7 minutes per activity. Need frequent transitions.',
    vocabulary: 'Use 3-4 word sentences. Avoid theological terms. Use tangible objects.',
    activities: 'Hands-on crafts, movement songs, simple stories with repetition, sensory experiences.',
    illustrations: 'Use stuffed animals, colorful pictures, puppet shows. Show, don\'t tell.',
    questions: 'Yes/no questions only. "Can you show me...?" instead of "Why...?"',
    application: 'Immediate, practical actions: "Give a hug", "Say thank you", "Be kind to friends"',
    bibleVersion: 'Use simple paraphrases or picture Bibles',
    teachingTips: 'Repeat key phrases 3-4 times. Use physical movements. Keep lessons under 20 minutes total.'
  },
  
  'Elementary Kids (Ages 6–10)': {
    cognitiveLevel: 'Beginning abstract thinking. Can connect cause and effect.',
    attentionSpan: '10-15 minutes per segment. Can handle longer stories.',
    vocabulary: 'Simple sentences but can learn new words with definitions. Introduce basic theological terms.',
    activities: 'Interactive games, creative arts, drama, simple Scripture memorization, group projects.',
    illustrations: 'Relatable stories from school/home life, age-appropriate media, object lessons.',
    questions: 'Mix of factual recall and simple "why" questions. "What would you do if...?"',
    application: 'Specific, observable behaviors: sharing toys, helping at home, being truthful.',
    bibleVersion: 'ICB, NLT, or CEV - clear, simple language',
    teachingTips: 'Use visuals extensively. Create take-home reminders. Celebrate small victories.'
  },
  
  'Preteens & Middle Schoolers (Ages 11–14)': {
    cognitiveLevel: 'Developing abstract reasoning. Question authority and test boundaries.',
    attentionSpan: '15-20 minutes with engagement. Need interactive elements.',
    vocabulary: 'Can handle theological vocabulary with clear explanations. Like feeling "smart".',
    activities: 'Small group discussions, debates, technology integration, service projects, competitions.',
    illustrations: 'Pop culture references, social media analogies, peer pressure scenarios, real-world issues.',
    questions: 'Open-ended questions about feelings, identity, fairness. "How does this apply to your life?"',
    application: 'Address identity formation, peer relationships, family dynamics, faith ownership.',
    bibleVersion: 'NIV, NLT, ESV - balance readability and depth',
    teachingTips: 'Acknowledge their struggles authentically. Avoid talking down. Give leadership opportunities.'
  },
  
  'High School Students (Ages 15–18)': {
    cognitiveLevel: 'Full abstract reasoning. Can handle nuance and complexity.',
    attentionSpan: '20-30 minutes if engaged. Expect intellectual rigor.',
    vocabulary: 'Full theological vocabulary expected. Introduce Greek/Hebrew concepts.',
    activities: 'Socratic seminars, apologetics discussions, worldview analysis, ministry applications.',
    illustrations: 'College prep, dating, sexuality, career choices, suffering, doubt, cultural issues.',
    questions: 'Challenging questions about faith validity, God\'s existence, biblical reliability, tough topics.',
    application: 'Decision-making frameworks, relationship boundaries, mission/calling, faith defense.',
    bibleVersion: 'ESV, NASB, NIV - balance accuracy and readability',
    teachingTips: 'Create safe space for doubt. Address real objections. Model authentic faith struggles.'
  },
  
  'College & Early Career (Ages 19–25)': {
    cognitiveLevel: 'Mature abstract thinking. Processing independence and identity.',
    attentionSpan: '30-45 minutes with breaks. Expect academic-level discussion.',
    vocabulary: 'Academic theological language. Comfortable with systematic theology terms.',
    activities: 'Case studies, theological debates, ministry practicum, mentorship, accountability groups.',
    illustrations: 'Career pressures, relationship navigation, financial decisions, purpose-finding, church involvement.',
    questions: 'Existential questions about calling, suffering, God\'s will, denominational differences.',
    application: 'Life integration: work ethics, relationship commitments, church engagement, missional living.',
    bibleVersion: 'ESV, NASB, NKJV - value accuracy and study depth',
    teachingTips: 'Respect their agency. Provide resources for further study. Connect to life transitions.'
  },
  
  'Young Adults (Ages 26–35)': {
    cognitiveLevel: 'Peak cognitive function. Balancing multiple life responsibilities.',
    attentionSpan: '45-60 minutes. Appreciate efficient, practical teaching.',
    vocabulary: 'Expect sophisticated theological discourse. Value practical application.',
    activities: 'Workshop-style teaching, real-life case studies, marriage/parenting applications, mentorship.',
    illustrations: 'Work-life balance, parenting challenges, marriage enrichment, financial stewardship.',
    questions: 'How-to questions: "How do I teach my kids?", "How do we handle conflict?", "How do I balance priorities?"',
    application: 'Family discipleship, marriage strengthening, workplace witness, community service.',
    bibleVersion: 'ESV, NIV, NASB - balance study depth and accessibility',
    teachingTips: 'Provide practical tools and resources. Honor their time. Offer childcare during classes.'
  },
  
  'Mid-Life Adults (Ages 36–50)': {
    cognitiveLevel: 'Wisdom-building phase. Reflective and experiential.',
    attentionSpan: '60+ minutes. Appreciate deep dives and discussion.',
    vocabulary: 'Theological sophistication with life experience. Value nuanced teaching.',
    activities: 'In-depth Bible study, book discussions, ministry leadership training, mentoring younger adults.',
    illustrations: 'Parenting teenagers, aging parents, career transitions, health challenges, legacy building.',
    questions: 'Integration questions: "How does this connect to...?", "What does Scripture say about...?"',
    application: 'Raising godly teens, caring for aging parents, career ministry integration, church leadership.',
    bibleVersion: 'ESV, NASB, NKJV - prefer depth and accuracy',
    teachingTips: 'Draw on their wisdom. Facilitate peer-to-peer learning. Address "sandwich generation" pressures.'
  },
  
  'Mature Adults (Ages 51–65)': {
    cognitiveLevel: 'Life-wisdom integration. Value depth over novelty.',
    attentionSpan: '60+ minutes. Appreciate thorough, scholarly approaches.',
    vocabulary: 'Lifetime of biblical knowledge. Enjoy connecting Scripture across testament.',
    activities: 'Inductive Bible study, theological deep-dives, mentorship training, mission focus.',
    illustrations: 'Empty nest adjustments, retirement planning, grandparenting, legacy-leaving.',
    questions: 'Reflective questions about life meaning, spiritual legacy, ministry in later years.',
    application: 'Mentoring next generation, wise stewardship, finishing well, renewed mission.',
    bibleVersion: 'ESV, NASB, NKJV - prefer traditional, accurate translations',
    teachingTips: 'Honor their experience. Create inter-generational connections. Focus on legacy and wisdom-sharing.'
  },
  
  'Active Seniors (Ages 66–75)': {
    cognitiveLevel: 'Reflective wisdom. May need accommodations for memory.',
    attentionSpan: '45-60 minutes with breaks. Comfortable pace appreciated.',
    vocabulary: 'Rich biblical background. May prefer traditional terminology.',
    activities: 'Hymn-based teaching, testimony sharing, prayer ministry, mentoring, service projects.',
    illustrations: 'Health challenges, loss and grief, spiritual legacy, joy in golden years.',
    questions: 'Reflection questions about life faithfulness, God\'s provision, hope in aging.',
    application: 'Remaining active in service, prayer ministry, grandchildren discipleship, testimonies.',
    bibleVersion: 'KJV, NKJV, ESV - may prefer familiar translations',
    teachingTips: 'Use larger fonts. Slower pace. Honor their stories. Emphasize encouragement and hope.'
  },
  
  'Senior Adults (Ages 76+)': {
    cognitiveLevel: 'Lifetime wisdom. May have cognitive changes. Value familiar.',
    attentionSpan: '30-45 minutes. Shorter lessons, more rest.',
    vocabulary: 'Lifetime biblical vocabulary. Prefer traditional, familiar language.',
    activities: 'Reminiscence, hymn singing, Scripture reading, prayer circles, life review.',
    illustrations: 'God\'s faithfulness throughout life, eternal hope, comfort in transition.',
    questions: 'Comfort-focused questions about God\'s presence, eternal home, peace.',
    application: 'Finding joy daily, sharing faith with family, prayer ministry, godly witness.',
    bibleVersion: 'KJV, NKJV - strongly prefer familiar, beloved translations',
    teachingTips: 'Large print materials. Comfort-focused. Honor lifetime of faithfulness. Emphasize eternal hope.'
  },
  
  'Mixed Groups': {
    cognitiveLevel: 'Varied. Design for middle-range with optional depth and simplification.',
    attentionSpan: '30-45 minutes. Multiple engagement styles needed.',
    vocabulary: 'Accessible core with optional deeper exploration.',
    activities: 'Multi-level activities, breakout groups by age, inter-generational sharing.',
    illustrations: 'Universal life themes that resonate across ages.',
    questions: 'Tiered questions from simple to complex.',
    application: 'General principles with age-specific suggestions.',
    bibleVersion: 'NIV or ESV - accessible to all',
    teachingTips: 'Design main teaching for all, offer breakout options for deeper/simpler exploration.'
  }
};

// ENHANCED: Language-specific age instructions
const languageConfigs = {
  'en': {
    name: 'English',
    promptInstruction: 'You must generate ALL content in English.'
  },
  'es': {
    name: 'Spanish',
    promptInstruction: 'Debes generar TODO el contenido en español. Usa lenguaje natural y apropiado para hispanohablantes.'
  },
  'fr': {
    name: 'French',
    promptInstruction: 'Vous devez générer TOUT le contenu en français. Utilisez un langage naturel et approprié pour les francophones.'
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData: LessonRequest = await req.json();
    const { 
      user_id, 
      topic, 
      passage, 
      age_group, 
      lesson_length, 
      lesson_type, 
      doctrine_profile = 'southern_baptist',
      theological_lens = 'sbc',
      additional_notes 
    } = requestData;

    console.log('Received request:', { user_id, age_group, topic, passage });

    // CRITICAL: Validate age group
    if (!age_group || !ageGroupProfiles[age_group as keyof typeof ageGroupProfiles]) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid age group: ${age_group}. Must be one of: ${Object.keys(ageGroupProfiles).join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's language preference
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }
    
    const language = (profile?.preferred_language as keyof typeof languageConfigs) || "en";
    const languageConfig = languageConfigs[language];
    const ageProfile = ageGroupProfiles[age_group as keyof typeof ageGroupProfiles];

    console.log('Using language:', language, 'for age group:', age_group);

    // ENHANCED: Build highly specific age-differentiated prompt
    const systemPrompt = `${languageConfig.promptInstruction}

CRITICAL: You are creating a ${lesson_length}-minute Bible lesson for ${age_group}.

═══════════════════════════════════════════════════════════
AGE GROUP PROFILE: ${age_group}
═══════════════════════════════════════════════════════════

COGNITIVE LEVEL: ${ageProfile.cognitiveLevel}
ATTENTION SPAN: ${ageProfile.attentionSpan}
VOCABULARY LEVEL: ${ageProfile.vocabulary}
RECOMMENDED ACTIVITIES: ${ageProfile.activities}
ILLUSTRATION STYLE: ${ageProfile.illustrations}
QUESTION TYPES: ${ageProfile.questions}
APPLICATION FOCUS: ${ageProfile.application}
BIBLE VERSION: ${ageProfile.bibleVersion}
TEACHING TIPS: ${ageProfile.teachingTips}

═══════════════════════════════════════════════════════════
THEOLOGICAL CONTEXT
═══════════════════════════════════════════════════════════

Doctrine Profile: ${doctrine_profile} (Southern Baptist Convention - Baptist Faith & Message 1963/2000)
Theological Lens: ${theological_lens}

Core Baptist Distinctives to Honor:
• Biblical Authority: Scripture as sole authority for faith and practice
• Soul Competency: Individual accountability before God
• Believer's Baptism: Baptism by immersion following profession of faith
• Security of the Believer: Eternal security in Christ
• Priesthood of Believers: Direct access to God without human mediator
• Autonomy of Local Church: Each church self-governing under Christ
• Separation of Church and State: Religious freedom

${additional_notes ? `\nTEACHER'S ADDITIONAL NOTES:\n${additional_notes}\n` : ''}

═══════════════════════════════════════════════════════════
LESSON GENERATION REQUIREMENTS
═══════════════════════════════════════════════════════════

Lesson Type: ${lesson_type === 'teacher' ? 'TEACHER TRANSCRIPT' : 'STUDENT HANDOUT'}

${lesson_type === 'teacher' ? `
As a TEACHER TRANSCRIPT, include:

1. LESSON OVERVIEW (2-3 paragraphs)
   - Big idea in age-appropriate language
   - Why this matters to ${age_group}
   - Expected outcomes

2. MATERIALS NEEDED
   - Complete list with quantities
   - Preparation notes
   - Room setup suggestions

3. OPENING ACTIVITY (${ageProfile.attentionSpan.split('.')[0]})
   - Attention-grabbing hook appropriate for cognitive level
   - Clear connection to lesson theme
   - Specific instructions

4. SCRIPTURE INTRODUCTION (5-7 minutes)
   - Context setting for ${age_group}
   - Read from ${ageProfile.bibleVersion}
   - Age-appropriate background information

5. MAIN TEACHING CONTENT (${Math.floor(lesson_length * 0.4)}-${Math.floor(lesson_length * 0.5)} minutes)
   - Use vocabulary level: ${ageProfile.vocabulary}
   - Include illustrations: ${ageProfile.illustrations}
   - Break into segments respecting: ${ageProfile.attentionSpan}
   - Theological accuracy maintaining Baptist distinctives
   - Interactive elements: ${ageProfile.activities}

6. DISCUSSION QUESTIONS (8-12 questions)
   - Type: ${ageProfile.questions}
   - Progress from simple to complex
   - Include suggested answers with Scripture references

7. ACTIVITIES (2-3 options)
   - ${ageProfile.activities}
   - Detailed instructions
   - Materials lists
   - Time estimates
   - Learning objectives

8. LIFE APPLICATION (5-10 minutes)
   - Focus: ${ageProfile.application}
   - Specific, measurable, achievable actions
   - Follow-up suggestions

9. CLOSING & PRAYER (3-5 minutes)
   - Summary appropriate for age
   - Prayer prompts
   - Take-home connection

10. TEACHER PREPARATION NOTES
    - Background study resources
    - Anticipated questions/objections
    - Adaptation suggestions
    - ${ageProfile.teachingTips}
` : `
As a STUDENT HANDOUT, include:

1. ATTRACTIVE HEADER
   - Lesson title in engaging language
   - Scripture reference
   - Age-appropriate graphics description

2. KEY VERSE
   - ${ageProfile.bibleVersion}
   - Memory help/illustration

3. LESSON SUMMARY (2-3 paragraphs)
   - Written at reading level for ${age_group}
   - Main points clearly stated
   - Personal engagement questions

4. FILL-IN-THE-BLANK NOTES (8-12 items)
   - Vocabulary: ${ageProfile.vocabulary}
   - Key concepts to remember
   - Scripture references to look up

5. ACTIVITIES (2-3)
   - ${ageProfile.activities}
   - Clear instructions
   - Space for responses

6. DISCUSSION QUESTIONS (6-8)
   - ${ageProfile.questions}
   - Space for notes

7. THIS WEEK'S CHALLENGE
   - ${ageProfile.application}
   - Specific daily actions
   - Accountability check-in method

8. PRAYER JOURNAL SPACE
   - Prayer requests
   - Praise reports
   - Scripture to pray

9. PARENT CONNECTION (if applicable)
   - What we learned today
   - Discussion starters for home
   - Reinforcement activities
`}

═══════════════════════════════════════════════════════════
CRITICAL REMINDERS
═══════════════════════════════════════════════════════════

✓ ALL content must be in ${languageConfig.name}
✓ Maintain theological accuracy (Baptist Faith & Message)
✓ Use vocabulary appropriate for ${age_group}: ${ageProfile.vocabulary}
✓ Design activities respecting attention span: ${ageProfile.attentionSpan}
✓ Include specific timing for each section (total: ${lesson_length} minutes)
✓ Make content immediately usable - no placeholder text
✓ Include ALL materials, resources, and preparation steps
✓ Honor Christian values and biblical authority throughout

Your lesson should be so complete and age-appropriate that a volunteer teacher could print it and teach confidently with minimal additional preparation.`;

    const userPrompt = `Create a ${lesson_length}-minute ${lesson_type} for ${age_group} on:

TOPIC: ${topic}
SCRIPTURE: ${passage}

Remember: This is for ${age_group} with these characteristics:
- Cognitive Level: ${ageProfile.cognitiveLevel}
- Attention Span: ${ageProfile.attentionSpan}
- Best Activities: ${ageProfile.activities}
- Application Style: ${ageProfile.application}`;

    // Call Claude API
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    console.log('Calling Claude API...');
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        temperature: 0.7,
        messages: [
          { 
            role: "user", 
            content: `${systemPrompt}\n\n${userPrompt}` 
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.content[0].text;

    console.log('Successfully generated lesson content');

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        metadata: {
          age_group,
          language,
          lesson_length,
          lesson_type,
          topic,
          passage,
          word_count: generatedContent.length,
          generated_at: new Date().toISOString()
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Error generating lesson:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Failed to generate lesson: ${errorMessage}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});