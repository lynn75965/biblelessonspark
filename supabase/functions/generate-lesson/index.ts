import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ✅ IMPORT from shared constants - Single Source of Truth
import { AGE_GROUP_OPTIONS } from "../_shared/constants.ts";

// ✅ FIXED: Complete CORS headers with all required fields
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ✅ Use imported constants instead of duplicating
const VALID_AGE_GROUPS = AGE_GROUP_OPTIONS;

// 🆕 THEOLOGY PROFILE TYPES AND DATA
// These match what we created in Phase 1 & 2, adapted for Deno

interface TheologyProfile {
  id: string;
  family: "sbc" | "reformed_baptist" | "independent_baptist";
  confession_label: string;
  is_default_for_family: boolean;
  doctrinal_priorities: string[];
  interpretive_lens: string[];
  teaching_tone: string[];
  key_distinctives_to_emphasize: string[];
  boundaries: string[];
  scripture_use: string[];
  soteriology_profile: string;
  sovereignty_vs_responsibility: string;
  invitation_style: string;
  worship_regulation: string;
  gender_role_profile: string;
  holiness_separation_profile: string;
  allowed_vocabulary_tags: string[];
  forbidden_vocabulary_tags: string[];
  notes?: string;
}

// 🆕 THEOLOGY PROFILES - Same as Phase 1 config file
const THEOLOGY_PROFILES: TheologyProfile[] = [
  // Reformed Baptist Profile
  {
    id: "reformed_baptist",
    family: "reformed_baptist",
    confession_label: "1689 London Baptist Confession",
    is_default_for_family: true,
    doctrinal_priorities: [
      "God's absolute sovereignty",
      "Doctrines of Grace (TULIP)",
      "Covenant theology (Baptistic)",
      "Regenerate church membership",
      "Christ-centered exposition",
      "Law/Gospel distinction",
      "Elder-led congregationalism",
    ],
    interpretive_lens: [
      "Strong redemptive-historical framework",
      "All Scripture fulfilled in Christ",
      "Emphasis on original context and authorial intent",
      "Use of confessional anchors when summarizing doctrine (1689 LBCF)",
    ],
    teaching_tone: [
      "Reverent",
      "Doctrinally rich",
      "Precision-oriented",
      "Avoid sentimentality and emotional over-appeal",
    ],
    key_distinctives_to_emphasize: [
      "Providence and sovereignty in all things",
      "Particular redemption",
      "Effectual calling",
      "Perseverance of the saints",
      "Worship regulated by Scripture (regulative principle of worship)",
      "Church discipline as a mark of the church",
    ],
    boundaries: [
      "Avoid manipulative emotional altar calls",
      "Avoid decisionism",
      "Avoid man-centered moralism",
      "Avoid egalitarian interpretations",
    ],
    scripture_use: [
      "Expository teaching prioritized",
      "Theological coherence emphasized across passages",
      "Emphasis on covenants, typology, and Christ's fulfillment",
    ],
    soteriology_profile: "doctrines_of_grace",
    sovereignty_vs_responsibility: "high_sovereignty",
    invitation_style: "clear_gospel_without_decisionism",
    worship_regulation: "regulative_principle",
    gender_role_profile: "strong_complementarian",
    holiness_separation_profile: "doctrinal_holiness_emphasis",
    allowed_vocabulary_tags: [
      "sovereignty",
      "providence",
      "effectual_calling",
      "particular_redemption",
      "perseverance_of_the_saints",
      "covenant",
      "redemptive_history",
    ],
    forbidden_vocabulary_tags: ["decisionism", "altar_call_language", "man_centered_success_language"],
    notes: "Internal only – used to steer tone, emphasis, and constraints for Reformed Baptist users.",
  },

  // Independent Baptist Profile
  {
    id: "independent_baptist",
    family: "independent_baptist",
    confession_label: "Independent Baptist – conservative Baptist",
    is_default_for_family: true,
    doctrinal_priorities: [
      "Biblical authority and inerrancy",
      "Salvation by grace through faith",
      "Human responsibility and free will",
      "Eternal security of the believer",
      "Local church autonomy",
      "Personal and ecclesiastical separation",
    ],
    interpretive_lens: [
      "Literal, plain-sense reading of Scripture",
      "Clear application focus in every passage",
      "Strong evangelistic emphasis",
    ],
    teaching_tone: [
      "Warm, direct, urgent",
      "Evangelistic and practical",
      "Traditional and conservative tone",
      "Clear invitations to trust Christ",
    ],
    key_distinctives_to_emphasize: [
      "The necessity of personal conversion",
      "Holiness and separation from worldliness",
      "Conservative moral standards",
      "Missions, soul winning, and gospel proclamation",
      "Strong emphasis on family, purity, and modesty",
    ],
    boundaries: [
      "Avoid Calvinistic determinism",
      "Avoid sacramental language",
      "Avoid ecumenical endorsements",
      "Avoid gender-role ambiguity",
    ],
    scripture_use: [
      "Verse-by-verse but application-heavy teaching",
      "Emphasis on obedience and Christian living",
      "Include clear gospel invitations",
    ],
    soteriology_profile: "traditionalist_free_will",
    sovereignty_vs_responsibility: "high_responsibility",
    invitation_style: "direct_evangelistic_invitation",
    worship_regulation: "normative_principle_traditional",
    gender_role_profile: "traditional_complementarian_strong",
    holiness_separation_profile: "strong_separation",
    allowed_vocabulary_tags: [
      "personal_conversion",
      "soul_winning",
      "separation",
      "holiness",
      "worldliness",
      "purity",
      "modesty",
      "eternal_security",
    ],
    forbidden_vocabulary_tags: [
      "irresistible_grace_strong_form",
      "effectual_calling_language",
      "sacramental_regeneration",
      "ecumenical_partnership_language",
    ],
    notes: "Internal only – used to steer tone, emphasis, and constraints for Independent Baptist users.",
  },

  // SBC BF&M 2000 Profile
  {
    id: "sbc_bfm_2000",
    family: "sbc",
    confession_label: "Baptist Faith & Message 2000",
    is_default_for_family: true,
    doctrinal_priorities: [
      "Scriptural inerrancy and authority",
      "Salvation by grace through faith in Christ",
      "Security of the believer",
      "Complementarianism (male pastors/elders)",
      "Local church autonomy with cooperative mission",
      "Religious liberty",
      "Great Commission focus",
    ],
    interpretive_lens: [
      "Christ-centered, conservative evangelical hermeneutic",
      "Balanced view of God's sovereignty and human responsibility",
      "BF&M 2000 doctrinal boundaries honored",
    ],
    teaching_tone: [
      "Pastorally warm",
      "Accessible and clear",
      "Mission-focused",
      "Balanced between doctrinal depth and practical application",
    ],
    key_distinctives_to_emphasize: [
      "Complementarian leadership (male pastors)",
      "Strong evangelism and discipleship practice",
      "Missions centrality (Lottie Moon / Annie Armstrong ethos)",
      "Importance of the local church community",
      "Christian ethics rooted in Scripture",
    ],
    boundaries: [
      "Avoid endorsing egalitarian clergy roles",
      "Avoid hyper-Calvinism or extreme determinism",
      "Avoid fundamentalist legalism",
      "Avoid charismatic excess",
    ],
    scripture_use: [
      "Expository with clear, practical application",
      "Emphasis on gospel proclamation",
      "Christ-centered ethical instruction",
    ],
    soteriology_profile: "mixed_conservative_evangelical",
    sovereignty_vs_responsibility: "balanced",
    invitation_style: "warm_evangelistic_invitation",
    worship_regulation: "normative_principle",
    gender_role_profile: "explicit_complementarian_male_pastors",
    holiness_separation_profile: "moderate_holiness_without_fundamentalism",
    allowed_vocabulary_tags: [
      "gospel",
      "mission",
      "discipleship",
      "cooperative_missions",
      "religious_liberty",
      "complementarian_leadership",
    ],
    forbidden_vocabulary_tags: [
      "egalitarian_ordained_pastor_language",
      "hyper_calvinism",
      "legalistic_separation_badge",
      "charismatic_manifestation_emphasis",
    ],
    notes: "Internal only – used to steer tone, emphasis, and constraints for SBC BF&M 2000 users.",
  },

  // SBC BF&M 1963 Profile
  {
    id: "sbc_bfm_1963",
    family: "sbc",
    confession_label: "Baptist Faith & Message 1963",
    is_default_for_family: false,
    doctrinal_priorities: [
      "Biblical authority and trustworthiness",
      "Christ-centered interpretation ('Christ is the criterion')",
      "Salvation by grace through faith",
      "Mission and evangelism",
      "Local church autonomy",
      "Security of the believer",
      "Family and moral integrity",
    ],
    interpretive_lens: [
      "Christocentric reading of Scripture",
      "Warm evangelistic focus",
      "Traditionalist soteriology more typical",
    ],
    teaching_tone: [
      "Pastoral and gentle",
      "Invitational and warm",
      "Accessible, traditional Southern Baptist tone",
      "Less formal doctrinal sharpness than 2000",
    ],
    key_distinctives_to_emphasize: [
      "Christ as the interpretive center of Scripture",
      "Traditional gender roles (without the explicit clergy formulations of 2000)",
      "Evangelistic invitation",
      "Discipleship focused on daily living",
      "Family-centered application",
    ],
    boundaries: [
      "Avoid rigid complementarian formulations",
      "Avoid detailed theological systems not present in the text",
      "Avoid hyper-separatist tones",
      "Avoid doctrinal harshness",
    ],
    scripture_use: [
      "Christ-centered exposition",
      "Practical application for home, marriage, and discipleship",
      "Warm gospel appeal",
    ],
    soteriology_profile: "traditionalist_sbc",
    sovereignty_vs_responsibility: "moderately_balanced_with_traditionalist_flavor",
    invitation_style: "gentle_evangelistic_invitation",
    worship_regulation: "normative_principle_traditional",
    gender_role_profile: "traditional_roles_less_explicit",
    holiness_separation_profile: "moderate_conservative_without_rigidity",
    allowed_vocabulary_tags: [
      "christ_centered",
      "invitation",
      "family",
      "daily_discipleship",
      "mission",
      "local_church",
    ],
    forbidden_vocabulary_tags: [
      "rigid_gender_systems",
      "hyper_systematic_theology_frames",
      "harsh_separation_language",
    ],
    notes: "Internal only – used to steer tone, emphasis, and constraints for SBC BF&M 1963 users.",
  },
];

// 🆕 THEOLOGY HELPER FUNCTIONS - Same as Phase 2 lib files

function getTheologyProfileById(id: string): TheologyProfile {
  const profile = THEOLOGY_PROFILES.find((p) => p.id === id);
  if (!profile) {
    throw new Error(`Unknown theology profile: ${id}`);
  }
  return profile;
}

function getTheologyProfileForUser(
  theologyFamily: "sbc" | "reformed_baptist" | "independent_baptist",
  theologyChoice?: string | null,
): TheologyProfile {
  if (theologyFamily === "sbc") {
    if (theologyChoice) {
      return getTheologyProfileById(theologyChoice);
    }
    return getTheologyProfileById("sbc_bfm_2000");
  }

  if (theologyFamily === "reformed_baptist") {
    return getTheologyProfileById("reformed_baptist");
  }

  if (theologyFamily === "independent_baptist") {
    return getTheologyProfileById("independent_baptist");
  }

  // Safety fallback
  console.warn(`Unknown theology_family: ${theologyFamily}. Falling back to SBC BF&M 2000.`);
  return getTheologyProfileById("sbc_bfm_2000");
}

function buildTheologyInstructionBlock(profile: TheologyProfile): string {
  return `
=============================================================================
INTERNAL THEOLOGY CONSTRAINTS (DO NOT MENTION IN OUTPUT)
=============================================================================

You are generating Bible study content for a theological context defined as:
- Theological Family: ${profile.family}
- Confessional Anchor: ${profile.confession_label}

CRITICAL: This profile is INTERNAL and MUST NOT be mentioned, referenced, or 
described in the lesson content. Users should never see profile names, IDs, 
or internal categorizations. These instructions shape your TONE, EMPHASIS, 
and BOUNDARIES invisibly.

-----------------------------------------------------------------------------
DOCTRINAL PRIORITIES (What to emphasize)
-----------------------------------------------------------------------------
You MUST honor and prioritize these doctrinal emphases:
${profile.doctrinal_priorities.map((p) => `  • ${p}`).join("\n")}

-----------------------------------------------------------------------------
INTERPRETIVE LENS (How to approach Scripture)
-----------------------------------------------------------------------------
Use this interpretive framework:
${profile.interpretive_lens.map((p) => `  • ${p}`).join("\n")}

-----------------------------------------------------------------------------
TEACHING TONE (How to communicate)
-----------------------------------------------------------------------------
Maintain this tone and style throughout:
${profile.teaching_tone.map((p) => `  • ${p}`).join("\n")}

-----------------------------------------------------------------------------
KEY DISTINCTIVES (What makes this tradition unique)
-----------------------------------------------------------------------------
Emphasize these distinctive theological points:
${profile.key_distinctives_to_emphasize.map((p) => `  • ${p}`).join("\n")}

-----------------------------------------------------------------------------
BOUNDARIES (What to avoid)
-----------------------------------------------------------------------------
Do NOT cross these theological or stylistic boundaries:
${profile.boundaries.map((p) => `  • ${p}`).join("\n")}

-----------------------------------------------------------------------------
SCRIPTURE USE GUIDELINES
-----------------------------------------------------------------------------
Follow these principles when using and applying Scripture:
${profile.scripture_use.map((p) => `  • ${p}`).join("\n")}

-----------------------------------------------------------------------------
THEOLOGICAL POSITION PROFILES
-----------------------------------------------------------------------------
Soteriology (Salvation Theology): ${profile.soteriology_profile}
Sovereignty vs Responsibility Balance: ${profile.sovereignty_vs_responsibility}
Gospel Invitation Style: ${profile.invitation_style}
Worship Regulation Principle: ${profile.worship_regulation}
Gender Role Framework: ${profile.gender_role_profile}
Holiness & Separation Approach: ${profile.holiness_separation_profile}

-----------------------------------------------------------------------------
VOCABULARY GUIDANCE
-----------------------------------------------------------------------------
FAVOR these concepts and vocabulary:
${profile.allowed_vocabulary_tags.map((t) => `  • ${t}`).join("\n")}

AVOID these concepts and vocabulary:
${profile.forbidden_vocabulary_tags.map((t) => `  • ${t}`).join("\n")}

=============================================================================
END THEOLOGY CONSTRAINTS
=============================================================================

Remember: Let these constraints shape your output naturally. Do not reference
them explicitly. Generate content that honors these boundaries while remaining
engaging, clear, and helpful for the teacher and students.
`.trim();
}

// Detailed age-specific teaching profiles
const ageGroupProfiles = {
  "Preschoolers (Ages 3–5)": {
    cognitiveLevel: "Concrete, literal thinking. Cannot grasp abstract concepts yet.",
    attentionSpan: "5-7 minutes per activity. Need frequent transitions.",
    vocabulary: "Use 3-4 word sentences. Avoid theological terms. Use tangible objects.",
    activities: "Hands-on crafts, movement songs, simple stories with repetition, sensory experiences.",
    illustrations: "Use stuffed animals, colorful pictures, puppet shows. Show, don't tell.",
    questions: 'Yes/no questions only. "Can you show me...?" instead of "Why...?"',
    application: 'Immediate, practical actions: "Give a hug", "Say thank you", "Be kind to friends"',
    bibleVersion: "Use simple paraphrases or picture Bibles",
    teachingTips: "Repeat key phrases 3-4 times. Use physical movements. Keep lessons under 20 minutes total.",
  },
  "Elementary Kids (Ages 6–10)": {
    cognitiveLevel: "Beginning abstract thinking. Can connect cause and effect.",
    attentionSpan: "10-15 minutes per segment. Can handle longer stories.",
    vocabulary: "Simple sentences but can learn new words with definitions. Introduce basic theological terms.",
    activities: "Interactive games, creative arts, drama, simple Scripture memorization, group projects.",
    illustrations: "Relatable stories from school/home life, age-appropriate media, object lessons.",
    questions: 'Mix of factual recall and simple "why" questions. "What would you do if...?"',
    application: "Specific, observable behaviors: sharing toys, helping at home, being truthful.",
    bibleVersion: "ICB, NLT, or CEV - clear, simple language",
    teachingTips: "Use visuals extensively. Create take-home reminders. Celebrate small victories.",
  },
  "Preteens & Middle Schoolers (Ages 11–14)": {
    cognitiveLevel: "Developing abstract reasoning. Question authority and test boundaries.",
    attentionSpan: "15-20 minutes with engagement. Need interactive elements.",
    vocabulary: 'Can handle theological vocabulary with clear explanations. Like feeling "smart".',
    activities: "Small group discussions, debates, technology integration, service projects, competitions.",
    illustrations: "Pop culture references, social media analogies, peer pressure scenarios, real-world issues.",
    questions: 'Open-ended questions about feelings, identity, fairness. "How does this apply to your life?"',
    application: "Address identity formation, peer relationships, family dynamics, faith ownership.",
    bibleVersion: "NIV, NLT, ESV - balance readability and depth",
    teachingTips: "Acknowledge their struggles authentically. Avoid talking down. Give leadership opportunities.",
  },
  "High School Students (Ages 15–18)": {
    cognitiveLevel: "Full abstract reasoning. Can handle nuance and complexity.",
    attentionSpan: "20-30 minutes if engaged. Expect intellectual rigor.",
    vocabulary: "Full theological vocabulary expected. Introduce Greek/Hebrew concepts.",
    activities: "Socratic seminars, apologetics discussions, worldview analysis, ministry applications.",
    illustrations: "College prep, dating, sexuality, career choices, suffering, doubt, cultural issues.",
    questions: "Challenging questions about faith validity, God's existence, biblical reliability, tough topics.",
    application: "Decision-making frameworks, relationship boundaries, mission/calling, faith defense.",
    bibleVersion: "ESV, NASB, NIV - balance accuracy and readability",
    teachingTips: "Create safe space for doubt. Address real objections. Model authentic faith struggles.",
  },
  "College & Early Career (Ages 19–25)": {
    cognitiveLevel: "Mature abstract thinking. Processing independence and identity.",
    attentionSpan: "30-45 minutes with breaks. Expect academic-level discussion.",
    vocabulary: "Academic theological language. Comfortable with systematic theology terms.",
    activities: "Case studies, theological debates, ministry practicum, mentorship, accountability groups.",
    illustrations:
      "Career pressures, relationship navigation, financial decisions, purpose-finding, church involvement.",
    questions: "Existential questions about calling, suffering, God's will, denominational differences.",
    application: "Life integration: work ethics, relationship commitments, church engagement, missional living.",
    bibleVersion: "ESV, NASB, NKJV - value accuracy and study depth",
    teachingTips: "Respect their agency. Provide resources for further study. Connect to life transitions.",
  },
  "Young Adults (Ages 26–35)": {
    cognitiveLevel: "Peak cognitive function. Balancing multiple life responsibilities.",
    attentionSpan: "45-60 minutes. Appreciate efficient, practical teaching.",
    vocabulary: "Expect sophisticated theological discourse. Value practical application.",
    activities: "Workshop-style teaching, real-life case studies, marriage/parenting applications, mentorship.",
    illustrations: "Work-life balance, parenting challenges, marriage enrichment, financial stewardship.",
    questions:
      'How-to questions: "How do I teach my kids?", "How do we handle conflict?", "How do I balance priorities?"',
    application: "Family discipleship, marriage strengthening, workplace witness, community service.",
    bibleVersion: "ESV, NIV, NASB - balance study depth and accessibility",
    teachingTips: "Provide practical tools and resources. Honor their time. Offer childcare during classes.",
  },
  "Mid-Life Adults (Ages 36–50)": {
    cognitiveLevel: "Wisdom-building phase. Reflective and experiential.",
    attentionSpan: "60+ minutes. Appreciate deep dives and discussion.",
    vocabulary: "Theological sophistication with life experience. Value nuanced teaching.",
    activities: "In-depth Bible study, book discussions, ministry leadership training, mentoring younger adults.",
    illustrations: "Parenting teenagers, aging parents, career transitions, health challenges, legacy building.",
    questions: 'Integration questions: "How does this connect to...?", "What does Scripture say about...?"',
    application: "Raising godly teens, caring for aging parents, career ministry integration, church leadership.",
    bibleVersion: "ESV, NASB, NKJV - prefer depth and accuracy",
    teachingTips: 'Draw on their wisdom. Facilitate peer-to-peer learning. Address "sandwich generation" pressures.',
  },
  "Mature Adults (Ages 51–65)": {
    cognitiveLevel: "Life-wisdom integration. Value depth over novelty.",
    attentionSpan: "60+ minutes. Appreciate thorough, scholarly approaches.",
    vocabulary: "Lifetime of biblical knowledge. Enjoy connecting Scripture across testament.",
    activities: "Inductive Bible study, theological deep-dives, mentorship training, mission focus.",
    illustrations: "Empty nest adjustments, retirement planning, grandparenting, legacy-leaving.",
    questions: "Reflective questions about life meaning, spiritual legacy, ministry in later years.",
    application: "Mentoring next generation, wise stewardship, finishing well, renewed mission.",
    bibleVersion: "ESV, NASB, NKJV - prefer traditional, accurate translations",
    teachingTips: "Honor their experience. Create inter-generational connections. Focus on legacy and wisdom-sharing.",
  },
  "Active Seniors (Ages 66–75)": {
    cognitiveLevel: "Reflective wisdom. May need accommodations for memory.",
    attentionSpan: "45-60 minutes with breaks. Comfortable pace appreciated.",
    vocabulary: "Rich biblical background. May prefer traditional terminology.",
    activities: "Hymn-based teaching, testimony sharing, prayer ministry, mentoring, service projects.",
    illustrations: "Health challenges, loss and grief, spiritual legacy, joy in golden years.",
    questions: "Reflection questions about life faithfulness, God's provision, hope in aging.",
    application: "Remaining active in service, prayer ministry, grandchildren discipleship, testimonies.",
    bibleVersion: "KJV, NKJV, ESV - may prefer familiar translations",
    teachingTips: "Use larger fonts. Slower pace. Honor their stories. Emphasize encouragement and hope.",
  },
  "Senior Adults (Ages 76+)": {
    cognitiveLevel: "Deep spiritual wisdom. May have physical/cognitive limitations.",
    attentionSpan: "30-45 minutes. Prioritize comfort and accessibility.",
    vocabulary: "Biblical fluency with preference for familiar language.",
    activities: "Reflective teaching, prayer circles, memory-sharing, simplified crafts, gentle music.",
    illustrations: "God's faithfulness over decades, eternal perspective, preparing for glory.",
    questions: "Comfort-oriented questions about heaven, God's presence, peace in suffering.",
    application: "Modeling faith, blessing family, prayer as ministry, leaving godly legacy.",
    bibleVersion: "KJV, NKJV, Large Print - familiar, readable",
    teachingTips: "Prioritize dignity and comfort. Use large print. Provide seating support. Celebrate their lives.",
  },
  "Mixed Groups": {
    cognitiveLevel: "Varied - design for multiple engagement levels.",
    attentionSpan: "30-45 minutes with variety to keep all ages engaged.",
    vocabulary: "Use accessible language with optional depth for advanced learners.",
    activities: "Multi-generational activities, group discussions, mentor pairings, service projects.",
    illustrations: "Life-stage relevant examples that span ages. Universal themes like family, faith, community.",
    questions: "Questions that invite perspectives from different life experiences.",
    application: "Inter-generational application that benefits all ages and encourages mentorship.",
    bibleVersion: "NIV, NLT, ESV - accessible yet substantial",
    teachingTips: "Create opportunities for cross-generational interaction. Value each age's contribution.",
  },
};

// Multi-language support configurations
const languageConfigs = {
  english: {
    name: "English",
    promptInstruction: "You must generate ALL content in English.",
  },
  spanish: {
    name: "Spanish",
    promptInstruction:
      "Debes generar TODO el contenido en español. Usa lenguaje natural y apropiado para hispanohablantes.",
  },
  french: {
    name: "French",
    promptInstruction:
      "Vous devez générer TOUT le contenu en français. Utilisez un langage naturel et approprié pour les francophones.",
  },
};

serve(async (req) => {
  // ✅ FIXED: Proper OPTIONS handler with complete CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    console.log("=== GENERATE LESSON REQUEST STARTED ===");

    // 1. AUTHENTICATE USER
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    // 2. PARSE REQUEST BODY
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const {
      passage = "",
      topic = "",
      ageGroup,
      notes = "",
      bibleVersion = "kjv",
      theologicalPreference = "southern_baptist",
      sbConfessionVersion = "bfm_1963",
      extractedContent = null,
    } = body;

    // 3. VALIDATE REQUIRED FIELDS
    if (!ageGroup) {
      console.error("Missing ageGroup");
      return new Response(JSON.stringify({ error: "Age group is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!VALID_AGE_GROUPS.includes(ageGroup)) {
      console.error("❌ VALIDATION FAILED");
      console.error("Received age group:", ageGroup);
      console.error("Valid options:", VALID_AGE_GROUPS);

      return new Response(
        JSON.stringify({
          error: `Invalid age group: "${ageGroup}". Must be one of: ${VALID_AGE_GROUPS.join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!ageGroupProfiles[ageGroup]) {
      console.error("Age group profile not found:", ageGroup);
      return new Response(JSON.stringify({ error: `Age group profile not found for: ${ageGroup}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!passage && !topic && !extractedContent) {
      console.error("Missing content");
      return new Response(JSON.stringify({ error: "Please provide passage, topic, or upload a file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Validation passed - generating lesson");

    // 🆕 4. GET BIBLE VERSION DATA FROM DATABASE
    const { data: bibleVersionData, error: versionError } = await supabase
      .from("bible_versions")
      .select("quote_type, abbreviation, name")
      .eq("id", bibleVersion)
      .single();

    if (versionError || !bibleVersionData) {
      console.error("Bible version not found:", bibleVersion, versionError);
      return new Response(JSON.stringify({ error: `Invalid Bible version: ${bibleVersion}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Using Bible version: ${bibleVersionData.abbreviation} (${bibleVersionData.quote_type})`);

    // 5. GET USER PREFERENCES (Language AND Theology)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("preferred_language, theology_family, theology_choice")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }

    // Language setup
    const userLanguage = profile?.preferred_language || "english";
    const languageConfig = languageConfigs[userLanguage as keyof typeof languageConfigs] || languageConfigs.english;

    // Theology profile setup
    const theologyFamily = profile?.theology_family || "sbc";
    const theologyChoice = profile?.theology_choice;

    console.log("User theology preference:", theologyFamily, theologyChoice);

    const theologyProfile = getTheologyProfileForUser(
      theologyFamily as "sbc" | "reformed_baptist" | "independent_baptist",
      theologyChoice,
    );

    console.log("Using theology profile:", theologyProfile.id);
    console.log("Using language:", languageConfig.name);

    // Build theology instruction block
    const theologyInstructions = buildTheologyInstructionBlock(theologyProfile);

    // Age group setup
    const ageProfile = ageGroupProfiles[ageGroup];
    console.log("Age profile loaded for:", ageGroup);

    // 🆕 6. BUILD BIBLE VERSION INSTRUCTIONS BASED ON QUOTE TYPE
    const bibleVersionInstructions =
      bibleVersionData.quote_type === "direct"
        ? `
=============================================================================
BIBLE VERSION HANDLING: DIRECT QUOTE
=============================================================================

BIBLE VERSION: ${bibleVersionData.abbreviation} (${bibleVersionData.name})
QUOTE TYPE: DIRECT QUOTE (Public Domain)

You MUST include EXACT word-for-word Scripture text from ${bibleVersionData.abbreviation}.

REQUIREMENTS:
- Use quotation marks for all Bible verses
- Include exact text with proper attribution
- Format: "Exact verse text here" (Book Chapter:Verse, ${bibleVersionData.abbreviation})

EXAMPLE FORMAT:
"For by grace are ye saved through faith; and that not of yourselves: it is the 
gift of God: Not of works, lest any man should boast." (Ephesians 2:8-9, ${bibleVersionData.abbreviation})

This is a PUBLIC DOMAIN translation - you MUST quote it exactly.
=============================================================================
`
        : `
=============================================================================
BIBLE VERSION HANDLING: PARAPHRASE
=============================================================================

BIBLE VERSION: ${bibleVersionData.abbreviation} (${bibleVersionData.name})
QUOTE TYPE: PARAPHRASE (Copyrighted Translation)

For ${bibleVersionData.abbreviation} (copyrighted translation), you MUST:

REQUIREMENTS:
- Provide FAITHFUL, ACCURATE paraphrase of Scripture passages
- Always include verse reference (book, chapter, verse)
- Include teacher note: "[Teacher: Please read [passage] from your ${bibleVersionData.abbreviation} Bible]"
- Capture theological precision and doctrinal content
- Maintain the meaning and flow of the original text
- Do NOT use quotation marks (this is a paraphrase, not a quote)
- Do NOT attempt to quote copyrighted text verbatim

PARAPHRASE QUALITY STANDARDS:
- Capture every major theological point from the passage
- Preserve doctrinal precision (especially soteriological terms)
- Maintain logical flow and structure of the text
- Use vocabulary appropriate for the age group
- Include all key concepts
- Be faithful to conservative Baptist interpretation

EXAMPLE FORMAT:
Ephesians 2:8-9 (${bibleVersionData.abbreviation})

Paul teaches that we are saved by God's grace through faith—this salvation is 
not from ourselves but is God's gift. It's not based on works, so no one can 
boast about earning it.

[Teacher: Please read Ephesians 2:8-9 from your ${bibleVersionData.abbreviation} Bible]

CRITICAL: Never reproduce copyrighted Bible text verbatim.
=============================================================================
`;

    // 7. BUILD COMPREHENSIVE PROMPT WITH ALL COMPONENTS
    const systemPrompt = `You are a theologically trained Sunday School curriculum writer.

${theologyInstructions}

${bibleVersionInstructions}

${languageConfig.promptInstruction}

ADDITIONAL REQUIREMENTS:
- Generate ALL content in ${languageConfig.name}
- Be age-appropriate for ${ageGroup}
- Handle Bible version according to quote type instructions above
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
3. Scripture Reading & Context (formatted according to Bible version quote type)
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

    console.log("Calling Anthropic API with:");
    console.log("- Theology profile:", theologyProfile.confession_label);
    console.log("- Bible version:", bibleVersionData.abbreviation, `(${bibleVersionData.quote_type})`);

    // 8. CALL ANTHROPIC API
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.error("Missing ANTHROPIC_API_KEY");
      return new Response(JSON.stringify({ error: "API configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `${systemPrompt}\n\n${userPrompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to generate lesson" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    if (!content) {
      console.error("No content in response");
      return new Response(JSON.stringify({ error: "No content generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Lesson generated successfully");
    console.log("- Theology profile:", theologyProfile.id);
    console.log("- Bible version:", bibleVersionData.abbreviation, `(${bibleVersionData.quote_type})`);

    // 9. RETURN SUCCESS RESPONSE IN FORMAT FORM EXPECTS
    return new Response(
      JSON.stringify({
        success: true,
        output: {
          teacher_plan: {
            fullContent: content,
            overview: content.split("\n").slice(0, 3).join("\n"),
            objectives: "",
            scripture: passage || topic || "Bible Lesson",
            background: "",
            opening: "",
            teaching: content,
            activities: "",
            discussion: "",
            applications: "",
            assessment: "",
            resources: "",
            preparation: "",
          },
        },
        lesson: {
          id: crypto.randomUUID(),
          title: topic || passage || "Generated Lesson",
        },
        sessionId: body.sessionId || "",
        uploadId: body.uploadId || "",
        fileHash: body.fileHash || "",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("=== ERROR IN GENERATE-LESSON ===");
    console.error(error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
