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
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("pastedText") as string | null;

    let extractedText = "";
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    // Path A: Pasted text -- skip file parsing, go straight to Haiku extraction
    if (!file && pastedText && pastedText.trim().length >= 50) {
      console.log(`Processing pasted text: ${pastedText.length} characters`);
      extractedText = pastedText.trim();

      let extractedPassage: string | null = null;
      let extractedFocus: string | null = null;

      if (extractedText.length >= 50 && anthropicApiKey) {
        try {
          console.log("Running scripture/focus extraction with Haiku (pasted text)...");
          const analysisResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 200,
              messages: [
                {
                  role: "user",
                  content: `Read this curriculum content and identify two things:\n1. The primary Bible scripture reference or passage (book, chapter, and verses if present). Return ONLY the reference, nothing else (e.g. 'John 3:16-21'). If no specific passage is identifiable, return null.\n2. The main teaching focus or topic in 10 words or fewer. Return ONLY the topic phrase (e.g. 'God\'s love and the gift of salvation'). If no clear focus is identifiable, return null.\n\nRespond in this exact JSON format with no other text:\n{"scripture": "John 3:16-21" or null, "focus": "Main teaching topic here" or null}\n\nCurriculum content:\n${extractedText.substring(0, 3000)}`,
                },
              ],
            }),
          });

          if (analysisResponse.ok) {
            const analysisResult = await analysisResponse.json();
            let rawText = analysisResult.content?.[0]?.text || "";
            rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
            try {
              const parsed = JSON.parse(rawText);
              if (parsed.scripture && typeof parsed.scripture === "string" && parsed.scripture !== "null") {
                extractedPassage = parsed.scripture;
              }
              if (parsed.focus && typeof parsed.focus === "string" && parsed.focus !== "null") {
                extractedFocus = parsed.focus;
              }
              console.log(`Haiku extraction (pasted) - passage: ${extractedPassage}, focus: ${extractedFocus}`);
            } catch (parseErr) {
              console.error("Failed to parse Haiku response:", rawText);
            }
          } else {
            console.error("Haiku API error:", await analysisResponse.text());
          }
        } catch (analysisErr) {
          console.error("Scripture/focus extraction failed:", analysisErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          extractedText: extractedText,
          extractedPassage: extractedPassage,
          extractedFocus: extractedFocus,
          fileName: "pasted-text",
          fileSize: 0,
          fileType: "text/plain",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Path B: File upload -- existing behavior
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    const fileName = file.name.toLowerCase();

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

    // Second lightweight call: extract scripture reference and teaching focus
    let extractedPassage: string | null = null;
    let extractedFocus: string | null = null;

    if (extractedText.length >= 50 && anthropicApiKey) {
      try {
        console.log("Running scripture/focus extraction with Haiku...");
        const analysisResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicApiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 200,
            messages: [
              {
                role: "user",
                content: `Read this curriculum content and identify two things:\n1. The primary Bible scripture reference or passage (book, chapter, and verses if present). Return ONLY the reference, nothing else (e.g. 'John 3:16-21'). If no specific passage is identifiable, return null.\n2. The main teaching focus or topic in 10 words or fewer. Return ONLY the topic phrase (e.g. 'God\'s love and the gift of salvation'). If no clear focus is identifiable, return null.\n\nRespond in this exact JSON format with no other text:\n{"scripture": "John 3:16-21" or null, "focus": "Main teaching topic here" or null}\n\nCurriculum content:\n${extractedText.substring(0, 3000)}`,
              },
            ],
          }),
        });

        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          let rawText = analysisResult.content?.[0]?.text || "";
          // Strip markdown code fences if present
          rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          try {
            const parsed = JSON.parse(rawText);
            if (parsed.scripture && typeof parsed.scripture === "string" && parsed.scripture !== "null") {
              extractedPassage = parsed.scripture;
            }
            if (parsed.focus && typeof parsed.focus === "string" && parsed.focus !== "null") {
              extractedFocus = parsed.focus;
            }
            console.log(`Haiku extraction - passage: ${extractedPassage}, focus: ${extractedFocus}`);
          } catch (parseErr) {
            console.error("Failed to parse Haiku response:", rawText);
          }
        } else {
          console.error("Haiku API error:", await analysisResponse.text());
        }
      } catch (analysisErr) {
        console.error("Scripture/focus extraction failed:", analysisErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: extractedText,
        extractedPassage: extractedPassage,
        extractedFocus: extractedFocus,
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