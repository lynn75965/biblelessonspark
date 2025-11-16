import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ✅ IMPORT from shared constants - Single Source of Truth
import { AGE_GROUP_OPTIONS } from "../_shared/constants.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// ✅ Use imported constants instead of duplicating
const VALID_AGE_GROUPS = AGE_GROUP_OPTIONS;

// Detailed age-specific teaching profiles
const ageGroupProfiles = {
  'Preschoolers (Ages 3-5)': {
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
  'Elementary Kids (Ages 6-10)': {
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
  'Preteens & Middle Schoolers (Ages 11-14)': {
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
  'High School Students (Ages 15-18)': {
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
  'College & Early Career (Ages 19-25)': {
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
  'Young Adults (Ages 26-35)': {
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
  'Mid-Life Adults (Ages 36-50)': {
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
  'Mature Adults (Ages 51-65)': {
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
  'Active Seniors (Ages 66-75)': {
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

// Multi-language support configurations
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
    console.log("=== GENERATE LESSON REQUEST STARTED ===");
    
    // 1. AUTHENTICATE USER
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // 2. PARSE REQUEST BODY
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const {
      passage = '',
      topic = '',
      ageGroup,
      notes = '',
      bibleVersion = 'ASV',
      theologicalPreference = 'southern_baptist',
      sbConfessionVersion = 'bfm_1963',
      extractedContent = null
    } = body;

    // 3. VALIDATE REQUIRED FIELDS
    if (!ageGroup) {
      console.error("Missing ageGroup");
      return new Response(
        JSON.stringify({ error: 'Age group is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_AGE_GROUPS.includes(ageGroup)) {
      console.error("Invalid age group:", ageGroup);
      console.error("Valid options:", VALID_AGE_GROUPS);
      return new Response(
        JSON.stringify({ 
          error: `Invalid age group: "${ageGroup}". Must be one of: ${VALID_AGE_GROUPS.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ageGroupProfiles[ageGroup]) {
      console.error("Age group profile not found:", ageGroup);
      return new Response(
        JSON.stringify({ error: `Age group profile not found for: ${ageGroup}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!passage && !topic && !extractedContent) {
      console.error("Missing content");
      return new Response(
        JSON.stringify({ error: 'Please provide passage, topic, or upload a file' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Validation passed - generating lesson");

    // 4. GET USER LANGUAGE PREFERENCE
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single();

    const userLanguage = profile?.preferred_language || 'english';
    const languageConfig = languageConfigs[userLanguage as keyof typeof languageConfigs] || languageConfigs.english;
    const ageProfile = ageGroupProfiles[ageGroup];

    console.log("Using language:", languageConfig.name);
    console.log("Age profile loaded for:", ageGroup);

    // 5. BUILD COMPREHENSIVE PROMPT WITH AGE-SPECIFIC DETAILS
    const systemPrompt = `You are a theologically trained Sunday School curriculum writer for the Southern Baptist Convention.

${languageConfig.promptInstruction}

CRITICAL REQUIREMENTS:
- Generate ALL content in ${languageConfig.name}
- Maintain theological alignment with Southern Baptist Convention (Baptist Faith & Message ${sbConfessionVersion === 'bfm_2000' ? '2000' : '1963'})
- Be age-appropriate for ${ageGroup}
- Content must be respectful of Christian values and biblical authority

AGE GROUP PROFILE for ${ageGroup}:
- Cognitive Level: ${ageProfile.cognitiveLevel}
- Attention Span: ${ageProfile.attentionSpan}
- Vocabulary: ${ageProfile.vocabulary}
- Best Activities: ${ageProfile.activities}
- Effective Illustrations: ${ageProfile.illustrations}
- Question Types: ${ageProfile.questions}
- Application Style: ${ageProfile.application}
- Recommended Bible Version: ${ageProfile.bibleVersion}
- Teaching Tips: ${ageProfile.teachingTips}

OUTPUT FORMAT - TEACHER TRANSCRIPT:
1. Lesson Overview (brief summary)
2. Opening Prayer (2-3 sentences)
3. Scripture Reading & Context
4. Main Teaching Points (3-5 key points with explanations)
5. Discussion Questions (3-5 age-appropriate questions)
6. Activities/Application (practical ways to apply the lesson)
7. Closing Prayer
8. Additional Resources/Notes for Teacher`;

    let userPrompt = `Create a 45-minute ${ageGroup} teacher transcript.\n\n`;
    if (passage) userPrompt += `Biblical Passage: ${passage}\n`;
    if (topic) userPrompt += `Topic: ${topic}\n`;
    if (notes) userPrompt += `Additional Notes: ${notes}\n`;
    if (extractedContent) userPrompt += `\nExisting Curriculum to Enhance:\n${extractedContent}\n`;

    console.log("Calling Anthropic API...");

    // 6. CALL ANTHROPIC API
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.error("Missing ANTHROPIC_API_KEY");
      return new Response(
        JSON.stringify({ error: "API configuration error" }),
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
        messages: [{
          role: "user",
          content: `${systemPrompt}\n\n${userPrompt}`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate lesson" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    if (!content) {
      console.error("No content in response");
      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Lesson generated successfully");

    // 7. RETURN SUCCESS RESPONSE IN FORMAT FORM EXPECTS
    return new Response(
      JSON.stringify({
        success: true,
        output: {
          teacher_plan: {
            fullContent: content,
            overview: content.split('\n').slice(0, 3).join('\n'),
            objectives: '',
            scripture: passage || topic || 'Bible Lesson',
            background: '',
            opening: '',
            teaching: content,
            activities: '',
            discussion: '',
            applications: '',
            assessment: '',
            resources: '',
            preparation: ''
          }
        },
        lesson: {
          id: crypto.randomUUID(),
          title: topic || passage || 'Generated Lesson'
        },
        sessionId: body.sessionId || '',
        uploadId: body.uploadId || '',
        fileHash: body.fileHash || ''
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("=== ERROR IN GENERATE-LESSON ===");
    console.error(error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});