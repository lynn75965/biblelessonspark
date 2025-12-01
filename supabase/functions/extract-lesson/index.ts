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

    // Handle different file types
    if (fileName.endsWith(".txt")) {
      // Plain text - just read it
      extractedText = await file.text();
      
    } else if (fileName.endsWith(".pdf")) {
      // PDF extraction
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const pdfContent = decoder.decode(uint8Array);
      
      // Extract text from PDF streams
      const textMatches = pdfContent.match(/\(([^)]+)\)/g) || [];
      const extractedParts: string[] = [];
      
      for (const match of textMatches) {
        const text = match.slice(1, -1);
        if (text.length > 2 && !/^[A-Z]{2,}$/.test(text) && !/^\d+$/.test(text)) {
          extractedParts.push(text);
        }
      }
      
      extractedText = extractedParts.join(" ").replace(/\\n/g, "\n").replace(/\s+/g, " ").trim();
      
      // Try BT/ET blocks if basic extraction fails
      if (extractedText.length < 100) {
        const btMatches = pdfContent.match(/BT[\s\S]*?ET/g) || [];
        const btText: string[] = [];
        for (const block of btMatches) {
          const tjMatches = block.match(/\(([^)]+)\)\s*Tj/g) || [];
          for (const tj of tjMatches) {
            const text = tj.match(/\(([^)]+)\)/)?.[1] || "";
            if (text.length > 1) btText.push(text);
          }
        }
        if (btText.length > 0) {
          extractedText = btText.join(" ");
        }
      }
      
      if (extractedText.length < 50) {
        extractedText = `[PDF: ${file.name}. Limited text extraction. Please also enter a Bible passage or topic.]`;
      }
      
    } else if (fileName.endsWith(".docx")) {
      // DOCX extraction
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const content = decoder.decode(uint8Array);
      
      const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const extractedParts: string[] = [];
      
      for (const match of textMatches) {
        const text = match.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "");
        if (text.trim()) extractedParts.push(text);
      }
      
      extractedText = extractedParts.join(" ").replace(/\s+/g, " ").trim();
      
      if (extractedText.length < 50) {
        extractedText = `[DOCX: ${file.name}. Please also enter a Bible passage or topic.]`;
      }
      
    } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png")) {
      // Image files - use Claude Vision API to extract text
      const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
      
      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "Image processing not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Convert image to base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      
      // Determine media type
      let mediaType = "image/jpeg";
      if (fileName.endsWith(".png")) mediaType = "image/png";
      
      // Call Claude Vision API to extract text
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
                  text: "Extract ALL text from this image. This is a Bible study curriculum document. Return ONLY the extracted text, maintaining the original structure and formatting as much as possible. Include all scripture references, lesson titles, discussion questions, and teaching notes visible in the image.",
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
      
      if (extractedText.length < 50) {
        extractedText = `[Image: ${file.name}. Could not extract sufficient text. Please also enter a Bible passage or topic.]`;
      }
      
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Unsupported file type. Please use PDF, DOCX, TXT, JPG, or JPEG.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracted ${extractedText.length} characters from ${file.name}`);

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
