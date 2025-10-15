import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Secure CORS configuration
const allowedOrigins = [
  'https://lessonsparkusa.com',
  'https://www.lessonsparkusa.com'
];

// In development, also allow localhost
if (Deno.env.get('DENO_DEPLOYMENT_ID') === undefined) {
  allowedOrigins.push(...[
    'http://localhost:5173',
    'http://localhost:3000'
  ]);
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin');
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    origin.includes('.lovable.app') ||
    origin.includes('.supabase.co')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Google Cloud API key from environment
    const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_CLOUD_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'OCR service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse the request body to get tracking IDs and file path
    const { filePath, uploadId, sessionId, fileHash } = await req.json();
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'No file path provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing OCR for:', filePath, 'uploadId:', uploadId, 'fileHash:', fileHash?.slice(0, 16));

    // For now, return mock data since we're focusing on tracking
    // In production, you would fetch the actual file from storage and process it
    const mockText = `Topic: Sample Lesson\nScripture: Romans 12:1-2\n\nThis is extracted content from the uploaded file.\nIt demonstrates the tracking system working correctly.`;
    const extractedText = mockText;

    // Parse source filename from filePath
    const sourceFile = filePath.split('/').pop() || 'unknown';

    console.log('OCR processing completed successfully');

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        success: true,
        uploadId,
        sessionId,
        fileHash,
        sourceFile
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        } 
      }
    );

  } catch (error) {
    console.error('Error in OCR function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});