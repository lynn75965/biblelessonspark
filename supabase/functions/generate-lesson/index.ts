import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// CLEAN age groups with EN-DASHES (–) matching frontend exactly
const VALID_AGE_GROUPS = [
  'Preschoolers (Ages 3–5)',
  'Elementary Kids (Ages 6–10)',
  'Preteens & Middle Schoolers (Ages 11–14)',
  'High School Students (Ages 15–18)',
  'College & Early Career (Ages 19–25)',
  'Young Adults (Ages 26–35)',
  'Mid-Life Adults (Ages 36–50)',
  'Mature Adults (Ages 51–65)',
  'Active Seniors (Ages 66–75)',
  'Senior Adults (Ages 76+)',
  'Mixed Groups'
];

// Age-specific teaching profiles - KEYS MUST MATCH VALID_AGE_GROUPS EXACTLY
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
    bibleVersion: 'NIrV, NLT, CSB - accessible yet substantive',
    teachingTips: 'Create safe space for questions. Use multimedia. Address real-world issues honestly.'
  },
  'High School Students (Ages 15–18)': {
    cognitiveLevel: 'Advanced abstract thinking. Can handle complex theological concepts.',
    attentionSpan: '20-30 minutes with interactive elements. Can sustain deeper discussions.',
    vocabulary: 'Use full theological vocabulary with nuanced explanations. Challenge intellectually.',
    activities: 'Apologetics debates, case studies, mission projects, leadership opportunities, deep Bible study.',
    illustrations: 'Cultural issues, philosophical questions, college prep, relationship ethics, calling/vocation.',
    questions: 'Socratic questioning: "How do you know?", "What evidence supports this?", "What would you say to someone who..."',
    application: 'Worldview formation, preparing for college/career, sexual purity, dating wisdom, standing for faith.',
    bibleVersion: 'ESV, NIV, CSB - solid translations for serious study',
    teachingTips: 'Respect their intelligence. Acknowledge hard questions. Model authentic faith.'
  },
  'College & Early Career (Ages 19–25)': {
    cognitiveLevel: 'Fully developed abstract reasoning. Processing independence and identity.',
    attentionSpan: '30-45 minutes. Can handle extended theological discussions.',
    vocabulary: 'Full theological discourse. Engage academic and philosophical language.',
    activities: 'Theological discussions, mentoring relationships, service projects, career integration with faith.',
    illustrations: 'Career pressures, relationship decisions, financial stewardship, calling, doubt and faith.',
    questions: 'Existential questions about purpose, suffering, God\'s will, career, relationships, doubt.',
    application: 'Integrating faith with career, navigating singleness/dating, financial wisdom, church involvement.',
    bibleVersion: 'ESV, NASB, NIV - serious study translations',
    teachingTips: 'Address real tensions. Welcome doubt and questions. Provide mentoring opportunities.'
  },
  'Young Adults (Ages 26–35)': {
    cognitiveLevel: 'Mature theological understanding. Balancing multiple life roles.',
    attentionSpan: '30-45 minutes. Appreciate depth but need practical application.',
    vocabulary: 'Mature theological vocabulary. Connect doctrine to daily life.',
    activities: 'Case study discussions, mentoring, service projects, leadership development, parenting seminars.',
    illustrations: 'Marriage challenges, parenting young children, career advancement, financial pressures, time management.',
    questions: 'How-to questions: "How do I teach my kids?", "How do we handle conflict?", "How do I balance work and faith?"',
    application: 'Marriage enrichment, parenting biblically, workplace integrity, financial stewardship, serving others.',
    bibleVersion: 'NIV, ESV, CSB - balance accessibility and depth',
    teachingTips: 'Provide practical tools. Honor time constraints. Facilitate peer learning.'
  },
  'Mid-Life Adults (Ages 36–50)': {
    cognitiveLevel: 'Deep theological understanding from life experience. Leading others.',
    attentionSpan: '45-60 minutes. Appreciate thorough teaching and discussion.',
    vocabulary: 'Rich theological vocabulary. Connect truth to complex life situations.',
    activities: 'Leadership training, mentoring programs, mission trips, theological study, ministry service.',
    illustrations: 'Parenting teens, caring for aging parents, career transitions, marriage longevity, financial planning.',
    questions: 'Legacy questions: "How do I leave a godly legacy?", "How do I lead my family well?", "How do I mentor others?"',
    application: 'Family leadership, mentoring next generation, workplace influence, generosity, church leadership.',
    bibleVersion: 'ESV, NASB, NIV - depth for teaching others',
    teachingTips: 'Leverage their experience. Create mentoring opportunities. Address mid-life transitions.'
  },
  'Mature Adults (Ages 51–65)': {
    cognitiveLevel: 'Rich theological wisdom from decades of faith. Processing legacy and purpose.',
    attentionSpan: '45-60 minutes. Value depth and life application.',
    vocabulary: 'Full theological depth. Connect to life\'s major transitions.',
    activities: 'Mentoring, Bible study leadership, mission work, prayer ministry, legacy planning.',
    illustrations: 'Empty nest, grandparenting, retirement planning, aging parents, health challenges, legacy.',
    questions: 'Purpose questions: "What\'s my role now?", "How do I stay relevant?", "How do I finish well?"',
    application: 'Grandparenting with purpose, mentoring younger believers, generosity, preparing for aging, leaving legacy.',
    bibleVersion: 'ESV, NASB, NIV - translations for teaching',
    teachingTips: 'Honor their wisdom. Address transitions positively. Create mentoring roles.'
  },
  'Active Seniors (Ages 66–75)': {
    cognitiveLevel: 'Lifetime of spiritual wisdom. May have physical limitations but mentally sharp.',
    attentionSpan: '30-45 minutes. Value depth but need comfort considerations.',
    vocabulary: 'Full biblical vocabulary with grace for hearing/vision challenges.',
    activities: 'Prayer ministry, mentoring, life story sharing, simplified service projects, Bible study.',
    illustrations: 'Retirement purpose, health challenges, grandchildren, loss of peers, God\'s faithfulness.',
    questions: 'Reflection questions: "How has God been faithful?", "What wisdom can I share?", "How do I face aging?"',
    application: 'Staying engaged in ministry, prayer as service, blessing family, modeling faithfulness, facing aging with grace.',
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

// Multi-language support
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      passage, 
      topic, 
      ageGroup, 
      notes, 
      bibleVersion, 
      theologicalPreference = 'southern_baptist',
      sbConfessionVersion = 'bfm_1963',
      extractedContent,
      sessionId,
      uploadId,
      fileHash,
      sourceFile
    } = await req.json();

    // VALIDATE REQUIRED FIELDS
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

    // GET USER LANGUAGE PREFERENCE
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

    // BUILD COMPREHENSIVE PROMPT WITH AGE-SPECIFIC DETAILS
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
3. Hook/Introduction (engage learners immediately)
4. Bible Story/Passage Teaching (main content)
5. Discussion Questions (age-appropriate)
6. Practical Application (specific, actionable)
7. Activities (hands-on learning)
8. Memory Verse (if applicable)
9. Closing Prayer
10. Take-Home Points (for parents/learners)`;

    let userPrompt = '';
    if (passage) {
      userPrompt += `Bible Passage: ${passage}\n`;
    }
    if (topic) {
      userPrompt += `Topic: ${topic}\n`;
    }
    if (extractedContent) {
      userPrompt += `Teacher's Content: ${extractedContent}\n`;
    }
    if (notes) {
      userPrompt += `Additional Notes: ${notes}\n`;
    }
    if (bibleVersion) {
      userPrompt += `Preferred Bible Version: ${bibleVersion}\n`;
    }

    userPrompt += `\nCreate a complete, ready-to-teach Sunday School lesson for ${ageGroup} that follows the teaching profile above.`;

    // CALL ANTHROPIC API
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    console.log("Calling Anthropic API...");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
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
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedContent = result.content[0].text;

    console.log("Lesson generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        output: {
          teacher_plan: {
            fullContent: generatedContent,
            overview: "Complete Sunday School Lesson",
            scripture: passage || topic || "See lesson content",
            targetAge: ageGroup
          }
        },
        sessionId: sessionId || "",
        uploadId: uploadId || "",
        fileHash: fileHash || ""
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in generate-lesson:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});