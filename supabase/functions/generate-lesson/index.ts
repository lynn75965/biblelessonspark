import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

interface LessonRequest {
  passageOrTopic: string;
  ageGroup: string;
  doctrineProfile: string;
  notes?: string;
  enhancementType: 'curriculum' | 'generation';
  extractedContent?: string;
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

function validateInput(data: any): LessonRequest {
  // Validate required fields
  if (!data.passageOrTopic || typeof data.passageOrTopic !== 'string') {
    throw new Error('passageOrTopic is required and must be a string');
  }

  if (!data.ageGroup || typeof data.ageGroup !== 'string') {
    throw new Error('ageGroup is required and must be a string');
  }

  if (!data.doctrineProfile || typeof data.doctrineProfile !== 'string') {
    throw new Error('doctrineProfile is required and must be a string');
  }

  // Validate enum values
  const allowedAgeGroups = [
    'Preschoolers', 'Elementary', 'Middle School', 'High School',
    'College & Career', 'Young Adults', 'Mid-Life Adults',
    'Mature Adults', 'Active Seniors', 'Senior Adults', 'Mixed Groups'
  ];

  const allowedDoctrineProfiles = ['SBC', 'RB', 'IND'];
  const allowedEnhancementTypes = ['curriculum', 'generation'];

  if (!allowedAgeGroups.includes(data.ageGroup)) {
    throw new Error('Invalid ageGroup');
  }

  if (!allowedDoctrineProfiles.includes(data.doctrineProfile)) {
    throw new Error('Invalid doctrineProfile');
  }

  if (!allowedEnhancementTypes.includes(data.enhancementType)) {
    throw new Error('Invalid enhancementType');
  }

  // Sanitize strings
  const sanitizeString = (str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/javascript:/gi, '')
             .trim()
             .substring(0, 1000); // Limit length
  };

  return {
    passageOrTopic: sanitizeString(data.passageOrTopic),
    ageGroup: data.ageGroup,
    doctrineProfile: data.doctrineProfile,
    notes: data.notes ? sanitizeString(data.notes) : undefined,
    enhancementType: data.enhancementType,
    extractedContent: data.extractedContent ? sanitizeString(data.extractedContent) : undefined,
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

    // TODO: Integrate with actual AI service (OpenAI, etc.)
    // For now, return mock data with proper structure
    const mockLessonContent = {
      activities: [
        {
          title: "Scripture Memory Activity",
          duration_minutes: 15,
          materials: ["Bible", "Index cards"],
          instructions: `Engage ${validatedData.ageGroup.toLowerCase()} in memorizing key verses from ${validatedData.passageOrTopic}. Adapt for ${validatedData.doctrineProfile} theological emphasis.`
        }
      ],
      discussion_prompts: [
        `How does ${validatedData.passageOrTopic} align with Baptist beliefs about salvation?`,
        `What practical applications can ${validatedData.ageGroup.toLowerCase()} take from this passage?`
      ],
      applications: [
        `Daily Bible reading focused on ${validatedData.passageOrTopic}`,
        `Prayer and reflection on the lesson's key themes`
      ]
    };

    // Log the successful generation (in production, you'd log to your audit system)
    console.log(`Lesson generated for user ${user.id}: ${validatedData.passageOrTopic}`);

    return new Response(
      JSON.stringify({
        success: true,
        content: mockLessonContent,
        title: `${validatedData.enhancementType === 'curriculum' ? 'Enhanced' : 'Generated'} Lesson: ${validatedData.passageOrTopic}`,
        metadata: {
          ageGroup: validatedData.ageGroup,
          doctrineProfile: validatedData.doctrineProfile,
          enhancementType: validatedData.enhancementType
        }
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remainingRequests.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        },
      }
    );

  } catch (error) {
    console.error('Error in generate-lesson function:', error);
    
    return new Response(
      JSON.stringify({ 
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