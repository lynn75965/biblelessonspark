import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AGE_GROUP_OPTIONS } from '../_shared/constants.ts';

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
// Using EXACT keys from shared constants to ensure frontend/backend match
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
    cognitiveLevel: 'Deep spiritual wisdom. May have physical/cognitive limitations.',
    attentionSpan: '30-45 minutes. Prioritize comfort and accessibility.',
    vocabulary: 'Biblical fluency with preference for familiar language.',
    activities: 'Reflective teaching, prayer circles, memory-sharing, simplified crafts, gentle music.',
    illustrations: 'God\'s faithfulness over decades, eternal perspective, preparing for glory.',
    questions: 'Comfort-oriented questions about heaven, God\'s presence, peace in suffering.',
    application: 'Modeling faith, blessing family, prayer as ministry, leaving godly legacy.',
    bibleVersion: 'KJV, NKJV, Large Print - familiar, readable',
    teachingTips: 'Prioritize dignity and comfort. Use large print. Provide seating support. Celebrate their lives.'
  },

  'Mixed Groups': {
    cognitiveLevel: 'Varied - design for multiple engagement levels.',
    attentionSpan: '30-45 minutes with variety to keep all ages engaged.',
    vocabulary: 'Use accessible language with optional depth for advanced learners.',
    activities: 'Multi-generational activities, group discussions, mentor pairings, service projects.',
    illustrations: 'Life-stage relevant examples that span ages. Universal themes like family, faith, community.',
    questions: 'Questions that invite perspectives from different life experiences.',
    application: 'Inter-generational application that benefits all ages and encourages mentorship.',
    bibleVersion: 'NIV, NLT, ESV - accessible yet substantial',
    teachingTips: 'Create opportunities for cross-generational interaction. Value each age\'s contribution.'
  }
};

// Language configuration
const languageConfigs = {
  english: {
    name: 'English',
    promptInstruction: 'You must generate ALL content in English.'
  },
  spanish: {
    name: 'Spanish',
    promptInstruction: 'Debes generar TODO el contenido en español. Usa lenguaje natural y apropiado para hispanohablantes.'
  },
  french: {
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

    // CRITICAL: Validate age group against shared constants
    if (!age_group || !AGE_GROUP_OPTIONS.includes(age_group as any)) {
      return new Response(
        JSON.stringify({
          error: `Invalid age group: ${age_group}. Must be one of: ${AGE_GROUP_OPTIONS.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that age group profile exists
    if (!ageGroupProfiles[age_group]) {
      return new Response(
        JSON.stringify({
          error: `Age group profile not found for: ${age_group}`
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
      .from('profiles')
      .select('preferred_language')
      .eq('id', user_id)
      .single();

    const userLanguage = profile?.preferred_language || 'english';
    const languageConfig = languageConfigs[userLanguage as keyof typeof languageConfigs] || languageConfigs.english;

    console.log(`Using language: ${languageConfig.name}`);

    // Get age-appropriate strategies
    const ageProfile = ageGroupProfiles[age_group];

    // Build comprehensive lesson generation prompt
    const systemPrompt = `You are a theologically trained Sunday School curriculum writer for the Southern Baptist Convention.

${languageConfig.promptInstruction}

CRITICAL REQUIREMENTS:
- Generate ALL content in ${languageConfig.name}
- Maintain theological alignment with Southern Baptist Convention (Baptist Faith & Message 1963)
- Be age-appropriate for ${age_group}
- Content must be respectful of Christian values and biblical authority

AGE GROUP PROFILE for ${age_group}:
- Cognitive Level: ${ageProfile.cognitiveLevel}
- Attention Span: ${ageProfile.attentionSpan}
- Vocabulary: ${ageProfile.vocabulary}
- Best Activities: ${ageProfile.activities}
- Effective Illustrations: ${ageProfile.illustrations}
- Question Types: ${ageProfile.questions}
- Application Style: ${ageProfile.application}
- Recommended Bible Version: ${ageProfile.bibleVersion}
- Teaching Tips: ${ageProfile.teachingTips}

${lesson_type === "teacher" ? `
OUTPUT FORMAT - TEACHER TRANSCRIPT:
1. Lesson Overview (brief summary)
2. Opening Prayer (2-3 sentences)
3. Scripture Reading & Context
4. Main Teaching Points (3-5 key points with explanations)
5. Discussion Questions (3-5 age-appropriate questions)
6. Activities/Application (practical ways to apply the lesson)
7. Closing Prayer
8. Additional Resources/Notes for Teacher
` : `
OUTPUT FORMAT - STUDENT HANDOUT:
1. Title and Scripture Reference
2. Key Verse (formatted clearly)
3. Lesson Summary (age-appropriate language)
4. Fill-in-the-blank or short answer questions
5. Activity or reflection exercise
6. Memory verse
7. Prayer starter or reflection prompt
`}`;

    const userPrompt = `Create a ${lesson_length}-minute ${age_group} ${lesson_type === "teacher" ? "teacher transcript" : "student handout"} on the topic: "${topic}"

Biblical Passage: ${passage}
${additional_notes ? `\nAdditional Instructions: ${additional_notes}` : ""}

Generate comprehensive, engaging content that honors God and serves the teacher/student effectively.`;

    // Call Claude API (using Anthropic)
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          { 
            role: "user", 
            content: `${systemPrompt}\n\n${userPrompt}` 
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate lesson content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        content,
        lesson_type,
        age_group,
        language: userLanguage,
        lesson_length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in generate-lesson function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});