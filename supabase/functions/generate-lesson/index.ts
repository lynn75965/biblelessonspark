import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

interface TeacherPreferences {
  teachingStyle: string;
  classroomManagement: string;
  techIntegration: string;
  assessmentPreference: string;
  classSize: string;
  meetingFrequency: string;
  sessionDuration: string;
  physicalSpace: string;
  specialNeeds: string[];
  learningStyles: string[];
  engagementLevel: string;
  discussionFormat: string;
  activityComplexity: string;
  bibleTranslation: string;
  theologicalEmphasis: string;
  applicationFocus: string;
  depthLevel: string;
  handoutStyle: string;
  visualAidPreference: string;
  takehomeMaterials: string[];
  preparationTime: string;
  culturalBackground: string;
  socioeconomicContext: string;
  educationalBackground: string;
  spiritualMaturity: string;
  additionalContext: string;
}

interface LessonRequest {
  passage?: string;
  topic?: string;
  passageOrTopic: string;
  ageGroup: string;
  doctrineProfile: string;
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

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

function checkRateLimit(userId: string): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
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

  // Increment count
  userLimit.count++;
  rateLimitMap.set(userId, userLimit);

  return {
    allowed: true,
    remainingRequests: RATE_LIMIT_MAX_REQUESTS - userLimit.count,
    resetTime: userLimit.resetTime
  };
}

// ✅ FIXED: Extract age range and category from age group string
function parseAgeGroup(ageGroup: string): { category: string; ageRange: string; description: string } {
  // Extract age range if present (e.g., "Ages 3-5" or "Ages 51–65")
  const ageRangeMatch = ageGroup.match(/\(Ages?\s+([\d–\-]+)\s*[+]?\)/i);
  const ageRange = ageRangeMatch ? ageRangeMatch[1] : '';
  
  // Determine category based on keywords
  let category = 'General';
  let description = `Tailored for ${ageGroup}`;
  
  if (ageGroup.toLowerCase().includes('preschool')) {
    category = 'Preschoolers';
    description = 'Ages 3-5, requiring simple concepts, hands-on activities, and visual learning aids';
  } else if (ageGroup.toLowerCase().includes('elementary')) {
    category = 'Elementary';
    description = 'Ages 6-11, needing interactive activities, basic biblical concepts, and age-appropriate applications';
  } else if (ageGroup.toLowerCase().includes('middle school')) {
    category = 'Middle School';
    description = 'Ages 12-14, addressing identity questions, peer pressure, and foundational faith development';
  } else if (ageGroup.toLowerCase().includes('high school')) {
    category = 'High School';
    description = 'Ages 15-18, tackling complex theological questions, life decisions, and future planning';
  } else if (ageGroup.toLowerCase().includes('college') || ageGroup.toLowerCase().includes('career')) {
    category = 'College & Career';
    description = 'Ages 18-25, focusing on independence, career choices, and deep theological study';
  } else if (ageGroup.toLowerCase().includes('young adult')) {
    category = 'Young Adults';
    description = 'Ages 26-35, addressing marriage, family, and establishing life priorities';
  } else if (ageGroup.toLowerCase().includes('mid-life') || (ageGroup.toLowerCase().includes('adult') && ageRange.includes('36'))) {
    category = 'Mid-Life Adults';
    description = 'Ages 36-50, dealing with family responsibilities, career pressures, and spiritual maturity';
  } else if (ageGroup.toLowerCase().includes('mature adult') || (ageGroup.toLowerCase().includes('adult') && ageRange.includes('51'))) {
    category = 'Mature Adults';
    description = 'Ages 51-65, focusing on wisdom sharing, legacy building, and deeper spiritual reflection';
  } else if (ageGroup.toLowerCase().includes('active senior')) {
    category = 'Active Seniors';
    description = 'Ages 66-80, emphasizing continued service, life reflection, and spiritual encouragement';
  } else if (ageGroup.toLowerCase().includes('senior')) {
    category = 'Senior Adults';
    description = 'Ages 70+, focusing on comfort, encouragement, and simplified but meaningful content';
  } else if (ageGroup.toLowerCase().includes('mixed')) {
    category = 'Mixed Groups';
    description = 'Multi-generational, requiring adaptable content for various age levels and life stages';
  }
  
  return { category, ageRange, description };
}

async function generateLessonWithAI(data: LessonRequest) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Theological lens configurations
  const theologicalLenses = {
    'southern_baptist': {
      name: 'Southern Baptist',
      short: 'SB',
      label: 'Southern Baptist Lens',
      description: 'Align with the Baptist Faith & Message. Emphasize believer\'s baptism by immersion, congregational polity, local church autonomy, evangelism/missions, assurance/perseverance. Avoid pedobaptism or non-congregational governance.',
      distinctives: [],
      versions: {
        'bfm_1963': {
          label: 'BF&M 1963',
          distinctives: [
            'Based on the Baptist Faith & Message (1963)',
            'Highlights "the criterion by which the Bible is to be interpreted is Jesus Christ"',
            'Emphasizes believer\'s baptism by immersion',
            'Affirms congregational governance & local-church autonomy',
            'Stresses evangelism & missions'
          ]
        },
        'bfm_2000': {
          label: 'BF&M 2000',
          distinctives: [
            'Based on the Baptist Faith & Message (2000)',
            'Emphasizes the Bible\'s full authority & sufficiency',
            'Emphasizes believer\'s baptism by immersion',
            'Affirms congregational governance & local-church autonomy',
            'Stresses evangelism, missions, and perseverance of the believer'
          ]
        }
      }
    },
    'reformed_baptist': {
      name: 'Reformed Baptist',
      short: 'RB',
      label: 'Reformed Baptist Lens',
      description: 'Align with the 1689 London Baptist Confession. Emphasize doctrines of grace (TULIP), elder-led congregationalism, covenantal reading distinct from paedobaptism (still credobaptist). Avoid language that conflicts with credobaptism.',
      distinctives: [
        'Grounded in the 1689 London Baptist Confession',
        'Emphasizes doctrines of grace (TULIP)',
        'Holds to elder-led congregational polity',
        'Reads Scripture through a covenantal but credobaptist framework',
        'Values expository teaching and doctrinal depth'
      ]
    },
    'independent_baptist': {
      name: 'Independent Baptist',
      short: 'IB',
      label: 'Independent Baptist Lens',
      description: 'Emphasize independent local church governance, separation, strong personal evangelism, believer\'s baptism by immersion, congregational polity. Avoid implying denominational boards/structures.',
      distinctives: [
        'Stresses complete independence of the local church',
        'Upholds believer\'s baptism by immersion',
        'Strong focus on personal evangelism and soul-winning',
        'Prefers traditional worship and separation from denominational control',
        'Highlights practical holiness and daily obedience'
      ]
    }
  };

  let lens = theologicalLenses[data.theologicalPreference];

  // Handle Southern Baptist version selection
  let versionLabel = '';
  let lensDistinctives: string[] = lens.distinctives || [];

  if (data.theologicalPreference === 'southern_baptist') {
    const version = data.sbConfessionVersion || 'bfm_2000';
    if (lens.versions && lens.versions[version]) {
      versionLabel = lens.versions[version].label;
      lensDistinctives = lens.versions[version].distinctives;
    }
  }

  const doctrineContexts = {
    'SBC': 'Southern Baptist Convention theological perspective, emphasizing biblical inerrancy, salvation by grace through faith alone, and believer\'s baptism by immersion.',
    'RB': 'Regular Baptist theological perspective, focusing on fundamentalist principles, separation from worldly practices, and dispensational theology.',
    'IND': 'Independent Baptist theological perspective, emphasizing local church autonomy, biblical authority, and conservative evangelical doctrine.'
  };

  // ✅ FIXED: Use flexible age group parsing
  const ageGroupInfo = parseAgeGroup(data.ageGroup);

  // Build customization context from teacher preferences
  const buildCustomizationContext = (prefs: TeacherPreferences): string => {
    if (!prefs) return '';

    const context = [];

    // Teaching style adaptation
    context.push(`Teaching Style: ${prefs.teachingStyle.replace(/_/g, ' ')} approach`);
    context.push(`Classroom Management: ${prefs.classroomManagement.replace(/_/g, ' ')} format`);
    context.push(`Technology Integration: ${prefs.techIntegration} level of technology use`);

    // Class context
    context.push(`Class Size: ${prefs.classSize} (${prefs.classSize === 'small' ? '5-15' : prefs.classSize === 'medium' ? '16-30' : prefs.classSize === 'large' ? '31-50' : '50+'} people)`);
    context.push(`Session Duration: ${prefs.sessionDuration}`);
    context.push(`Physical Space: ${prefs.physicalSpace.replace(/_/g, ' ')}`);

    // Learning preferences
    if (prefs.learningStyles.length > 0) {
      context.push(`Learning Styles: Focus on ${prefs.learningStyles.join(', ')} learners`);
    }
    context.push(`Engagement Level: ${prefs.engagementLevel.replace(/_/g, ' ')}`);
    context.push(`Discussion Format: ${prefs.discussionFormat.replace(/_/g, ' ')}`);
    context.push(`Activity Complexity: ${prefs.activityComplexity} level activities`);

    // Theological preferences
    context.push(`Bible Translation: ${prefs.bibleTranslation}`);
    context.push(`Theological Emphasis: ${prefs.theologicalEmphasis.replace(/_/g, ' ')} style`);
    context.push(`Application Focus: ${prefs.applicationFocus.replace(/_/g, ' ')}`);
    context.push(`Study Depth: ${prefs.depthLevel.replace(/_/g, ' ')}`);

    // Resource preferences
    context.push(`Handout Style: ${prefs.handoutStyle.replace(/_/g, ' ')}`);
    context.push(`Visual Aids: ${prefs.visualAidPreference.replace(/_/g, ' ')}`);
    context.push(`Preparation Time Available: ${prefs.preparationTime}`);

    // Cultural context
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

  // ✅ FIXED: Support both passage and topic fields
  const passageOrTopic = data.passage || data.topic || data.passageOrTopic;

  const enhancementPrompt = data.enhancementType === 'curriculum' || data.enhancementType === 'enhance'
    ? `Enhance and expand the following existing curriculum content: "${data.extractedContent || passageOrTopic}". Build upon this foundation while maintaining its core structure and adding comprehensive depth.`
    : `Generate a complete, original lesson plan based on: "${passageOrTopic}".`;

  const lensDisplayName = versionLabel ? `${lens.name} — ${versionLabel}` : lens.name;
  const lensSubtitle = versionLabel ? `Confession: ${versionLabel}` : '';

  const systemPrompt = `You are an expert Bible curriculum developer with 20+ years of experience creating comprehensive, engaging lesson plans for ${data.ageGroup} from a ${doctrineContexts[data.doctrineProfile as keyof typeof doctrineContexts]}

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

LESSON STRUCTURE REQUIREMENTS:
1. Lesson Overview (2-3 paragraphs)
2. Learning Objectives (3-5 specific, measurable goals)
3. Key Scripture Passages (with context and cross-references)
4. Theological Background (denominational perspective and historical context)
5. Opening Activities (2-3 engaging warm-up activities)
6. Main Teaching Content (detailed exposition with illustrations)
7. Interactive Activities (4-6 varied activities for different learning styles)
8. Discussion Questions (8-10 thought-provoking questions)
9. Life Applications (practical, age-appropriate applications)
10. Assessment Methods (ways to measure understanding)
11. Take-Home Resources (materials for continued learning)
12. Teacher Preparation Notes (background study and tips)

CONTENT QUALITY REQUIREMENTS:
- Each section should be detailed and comprehensive (not bullet points)
- Include specific materials lists for all activities
- Provide estimated time durations for each component
- Add biblical cross-references and supporting verses
- Include age-appropriate illustrations and examples
- Ensure theological accuracy according to ${data.doctrineProfile} perspective
- Make content immediately usable without additional research

TARGET AUDIENCE: ${ageGroupInfo.description}

DENOMINATION EMPHASIS: ${doctrineContexts[data.doctrineProfile as keyof typeof doctrineContexts]}

${data.notes ? `ADDITIONAL REQUIREMENTS: ${data.notes}` : ''}

REQUIRED FOOTER: At the end of the lesson, include this note:
"This lesson reflects the ${lens.name} lens selected in settings."

Return a comprehensive lesson plan that a teacher could print and use immediately for a 45-60 minute class session.`;

  const userPrompt = enhancementPrompt;

  try {
    console.log('Generating lesson with OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;

    // Parse the comprehensive content into structured format
    const structuredContent = parseComprehensiveLesson(generatedContent);

    return {
      content: structuredContent,
      title: `${lens.short} • ${data.enhancementType === 'curriculum' || data.enhancementType === 'enhance' ? 'Enhanced' : 'Generated'} Lesson: ${passageOrTopic}`,
      wordCount: generatedContent.length,
      estimatedDuration: '45-60 minutes',
      theologicalLens: lens.name,
      ...(data.theologicalPreference === 'southern_baptist' && data.sbConfessionVersion && {
        sbConfessionVersion: data.sbConfessionVersion
      })
    };

  } catch (error) {
    console.error('Error generating lesson with AI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate lesson: ${errorMessage}`);
  }
}

function parseComprehensiveLesson(content: string) {
  // Parse the AI-generated content into structured sections
  const sections: Record<string, string> = {};

  // Extract major sections using common headers
  const sectionRegexes: Record<string, RegExp> = {
    overview: /(?:lesson\s+overview|overview|introduction)[:\s]*(.*?)(?=\n(?:learning\s+objectives|objectives|key\s+scripture)|$)/is,
    objectives: /(?:learning\s+objectives|objectives)[:\s]*(.*?)(?=\n(?:key\s+scripture|scripture|theological)|$)/is,
    scripture: /(?:key\s+scripture|scripture\s+passages|scripture)[:\s]*(.*?)(?=\n(?:theological|background|opening)|$)/is,
    background: /(?:theological\s+background|background|context)[:\s]*(.*?)(?=\n(?:opening\s+activities|opening|main\s+teaching)|$)/is,
    opening: /(?:opening\s+activities|warm[- ]?up|opening)[:\s]*(.*?)(?=\n(?:main\s+teaching|teaching\s+content|interactive)|$)/is,
    teaching: /(?:main\s+teaching|teaching\s+content|main\s+content)[:\s]*(.*?)(?=\n(?:interactive\s+activities|activities|discussion)|$)/is,
    activities: /(?:interactive\s+activities|activities)[:\s]*(.*?)(?=\n(?:discussion\s+questions|discussion|life\s+applications)|$)/is,
    discussion: /(?:discussion\s+questions|discussion)[:\s]*(.*?)(?=\n(?:life\s+applications|applications|assessment)|$)/is,
    applications: /(?:life\s+applications|applications)[:\s]*(.*?)(?=\n(?:assessment|take[- ]?home|teacher)|$)/is,
    assessment: /(?:assessment\s+methods|assessment)[:\s]*(.*?)(?=\n(?:take[- ]?home|teacher\s+preparation|teacher)|$)/is,
    resources: /(?:take[- ]?home\s+resources|resources)[:\s]*(.*?)(?=\n(?:teacher\s+preparation|teacher\s+notes)|$)/is,
    preparation: /(?:teacher\s+preparation|teacher\s+notes|preparation)[:\s]*(.*?)$/is
  };

  // Extract each section
  Object.keys(sectionRegexes).forEach(key => {
    const match = content.match(sectionRegexes[key]);
    if (match) {
      sections[key] = match[1].trim();
    }
  });

  // If structured parsing fails, create sections from the raw content
  if (Object.keys(sections).length < 5) {
    const contentChunks = content.split('\n\n').filter(chunk => chunk.trim().length > 50);

    return {
      overview: contentChunks[0] || 'Comprehensive lesson content generated.',
      objectives: contentChunks[1] || 'Students will engage with biblical truth and apply it to their lives.',
      scripture: contentChunks[2] || 'Key passages and supporting verses provided.',
      background: contentChunks[3] || 'Theological context and historical background included.',
      teaching: contentChunks.slice(4).join('\n\n') || 'Detailed teaching content with activities and applications.',
      activities: 'Interactive learning experiences designed for engagement.',
      discussion: 'Thought-provoking questions for deeper understanding.',
      applications: 'Practical ways to live out biblical principles.',
      fullContent: content
    };
  }

  return {
    ...sections,
    fullContent: content
  };
}

function validateInput(data: any): LessonRequest {
  // ✅ FIXED: More flexible validation - frontend is source of truth
  
  // Validate that we have passage, topic, or passageOrTopic
  if (!data.passage && !data.topic && !data.passageOrTopic) {
    throw new Error('Either passage, topic, or passageOrTopic is required');
  }

  // Validate ageGroup is a non-empty string
  if (!data.ageGroup || typeof data.ageGroup !== 'string' || data.ageGroup.trim().length === 0) {
    throw new Error('ageGroup is required and must be a non-empty string');
  }

  // Validate theologicalPreference
  if (!data.theologicalPreference || typeof data.theologicalPreference !== 'string') {
    throw new Error('Theological preference is required. Please select your theological lens (Southern Baptist, Reformed Baptist, or Independent Baptist) in your settings or the generation form.');
  }

  // Validate theological preference enum
  const allowedTheologicalPreferences = ['southern_baptist', 'reformed_baptist', 'independent_baptist'];
  if (!allowedTheologicalPreferences.includes(data.theologicalPreference)) {
    throw new Error('Invalid theological preference. Must be one of: southern_baptist, reformed_baptist, independent_baptist');
  }

  // ✅ FIXED: Auto-map theologicalPreference to doctrineProfile if not provided
  let doctrineProfile = data.doctrineProfile;
  if (!doctrineProfile) {
    const preferenceToProfile: Record<string, string> = {
      'southern_baptist': 'SBC',
      'reformed_baptist': 'RB',
      'independent_baptist': 'IND'
    };
    doctrineProfile = preferenceToProfile[data.theologicalPreference] || 'SBC';
  }

  // Validate doctrineProfile
  const allowedDoctrineProfiles = ['SBC', 'RB', 'IND'];
  if (!allowedDoctrineProfiles.includes(doctrineProfile)) {
    throw new Error('Invalid doctrineProfile. Must be one of: SBC, RB, IND');
  }

  // Sanitize strings
  const sanitizeString = (str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/javascript:/gi, '')
             .trim()
             .substring(0, 1000); // Limit length
  };

  // Build passageOrTopic from individual fields if not provided
  const passageOrTopic = data.passageOrTopic || data.passage || data.topic || '';

  return {
    passage: data.passage ? sanitizeString(data.passage) : undefined,
    topic: data.topic ? sanitizeString(data.topic) : undefined,
    passageOrTopic: sanitizeString(passageOrTopic),
    ageGroup: sanitizeString(data.ageGroup), // Accept any age group string from frontend
    doctrineProfile: doctrineProfile, // ✅ Auto-mapped from theologicalPreference
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
    sourceFile: data.sourceFile,
  };
}

serve(async (req) => {
  // CORS headers - Restricted to specific domains for security
  const allowedOrigins = [
    'https://lessonsparkusa.com',
    'https://www.lessonsparkusa.com'
  ];

  // In development, also allow Lovable and localhost
  if (Deno.env.get('DENO_DEPLOYMENT_ID') === undefined) {
    allowedOrigins.push(...[
      'http://localhost:5173',
      'http://localhost:3000'
    ]);
  }

  // Always allow Lovable preview domains
  const origin = req.headers.get('origin');
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    origin.includes('.lovable.app') ||
    origin.includes('.supabase.co')
  );

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limit
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

    // Parse and validate request body
    const body = await req.json();
    const validatedData = validateInput(body);

    // Extract tracking IDs from request
    const { sessionId, uploadId, fileHash, sourceFile } = body;

    // Generate comprehensive lesson content using OpenAI
    const lessonContent = await generateLessonWithAI(validatedData);

    // Log the successful generation with theological preference
    const lensInfo = validatedData.theologicalPreference === 'southern_baptist' && validatedData.sbConfessionVersion
      ? `${validatedData.theologicalPreference} (${validatedData.sbConfessionVersion})`
      : validatedData.theologicalPreference;
    console.log(`Lesson generated for user ${user.id}: ${validatedData.passageOrTopic} (Lens: ${lensInfo})`);

    // ✅ FIXED: Return proper response structure
    return new Response(
      JSON.stringify({
        success: true,
        output: {
          teacher_plan: lessonContent.content
        },
        lesson: {
          id: crypto.randomUUID(),
          title: lessonContent.title
        },
        sessionId,
        uploadId,
        fileHash,
        metadata: {
          ageGroup: validatedData.ageGroup,
          doctrineProfile: validatedData.doctrineProfile,
          enhancementType: validatedData.enhancementType,
          wordCount: lessonContent.wordCount,
          estimatedDuration: lessonContent.estimatedDuration,
          theologicalLens: lessonContent.theologicalLens,
          theologicalPreference: validatedData.theologicalPreference,
          ...(validatedData.theologicalPreference === 'southern_baptist' && validatedData.sbConfessionVersion && {
            sbConfessionVersion: validatedData.sbConfessionVersion
          })
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'X-RateLimit-Remaining': rateLimit.remainingRequests.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        },
      }
    );

  } catch (error) {
    console.error('Error in generate-lesson function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});