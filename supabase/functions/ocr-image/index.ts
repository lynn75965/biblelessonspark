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

    // Parse the form data to get the image
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing image:', imageFile.name, 'Size:', imageFile.size);

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Call Google Cloud Vision API
    const visionRequest = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    console.log('Calling Google Cloud Vision API...');
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(visionRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Cloud Vision API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'OCR processing failed',
          details: `API returned ${response.status}: ${errorText}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const visionResult = await response.json();
    console.log('Google Cloud Vision API response received');

    // Extract text from the response
    let extractedText = '';
    if (visionResult.responses && visionResult.responses[0]) {
      const textAnnotations = visionResult.responses[0].textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        extractedText = textAnnotations[0].description || '';
      }
    }

    console.log('Extracted text length:', extractedText.length);

    if (!extractedText.trim()) {
      return new Response(
        JSON.stringify({ 
          error: 'No text found in image',
          text: ''
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim();

    console.log('OCR processing completed successfully');

    return new Response(
      JSON.stringify({ 
        text: cleanedText,
        success: true
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