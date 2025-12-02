import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    let extractedText = "";
    const fileName = file.name.toLowerCase();
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    // Handle different file types
    if (fileName.endsWith(".txt")) {
      // Plain text - just read it
      extractedText = await file.text();

    } else if (fileName.endsWith(".pdf")) {
      // PDF extraction using Claude Sonnet 4 (fast and reliable)
      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "PDF processing not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let base64 = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64 += String.fromCharCode(...chunk);
      }
      base64 = btoa(base64);

      console.log(`Sending PDF to Claude Sonnet 4: ${file.name} (${Math.round(base64.length / 1024)}KB base64)`);

      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: "Extract ALL text content from this PDF document. Return ONLY the extracted text, preserving the original structure, paragraphs, and formatting. Do not add any commentary or analysis.",
                },
              ],
            },
          ],
        }),
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error("Claude API error for PDF:", errorText);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to process PDF" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const claudeResult = await claudeResponse.json();
      extractedText = claudeResult.content?.[0]?.text || "";
      
      const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`Claude Sonnet 4 extracted ${extractedText.length} characters in ${extractionTime}s`);

      if (extractedText.length < 50) {
        extractedText = `[PDF: ${file.name}. Could not extract sufficient text. Please also enter a Bible passage or topic.]`;
      }

    } else if (fileName.endsWith(".docx")) {
      // DOCX extraction using Claude Sonnet 4
      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "DOCX processing not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let base64 = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64 += String.fromCharCode(...chunk);
      }
      base64 = btoa(base64);

      console.log(`Sending DOCX to Claude Sonnet 4: ${file.name}`);

      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: "Extract ALL text content from this Word document. Return ONLY the extracted text, preserving structure. No commentary.",
                },
              ],
            },
          ],
        }),
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error("Claude API error for DOCX:", errorText);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to process DOCX" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const claudeResult = await claudeResponse.json();
      extractedText = claudeResult.content?.[0]?.text || "";

      const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`Claude Sonnet 4 extracted ${extractedText.length} characters from DOCX in ${extractionTime}s`);

      if (extractedText.length < 50) {
        extractedText = `[DOCX: ${file.name}. Could not extract sufficient text. Please also enter a Bible passage or topic.]`;
      }

    } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png")) {
      // Image files - use Claude Sonnet 4 Vision
      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "Image processing not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let base64 = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64 += String.fromCharCode(...chunk);
      }
      base64 = btoa(base64);

      let mediaType = "image/jpeg";
      if (fileName.endsWith(".png")) mediaType = "image/png";

      console.log(`Sending image to Claude Sonnet 4: ${file.name}`);

      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64,
                  },
                },
                {
                  type: "text",
                  text: "Extract ALL text from this image. Return ONLY the extracted text, maintaining structure.",
                },
              ],
            },
          ],
        }),
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error("Claude API error:", errorText);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to process image" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const claudeResult = await claudeResponse.json();
      extractedText = claudeResult.content?.[0]?.text || "";

      const extractionTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`Claude Sonnet 4 extracted ${extractedText.length} characters from image in ${extractionTime}s`);

      if (extractedText.length < 50) {
        extractedText = `[Image: ${file.name}. Could not extract sufficient text. Please also enter a Bible passage or topic.]`;
      }

    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Unsupported file type. Please use PDF, DOCX, TXT, JPG, or JPEG.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total extraction: ${extractedText.length} characters from ${file.name} in ${totalTime}s`);

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: extractedText,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extraction error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});