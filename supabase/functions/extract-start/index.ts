import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory job storage (simple approach without DB migration)
const jobs = new Map<string, {
  jobId: string;
  sessionId: string;
  uploadId: string;
  fileHash: string;
  state: 'queued' | 'processing' | 'done' | 'failed' | 'canceled';
  progress: number;
  result?: any;
  error?: { code: string; msg: string };
  createdAt: number;
}>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, uploadId, sessionId, fileHash, fileName } = await req.json();
    
    if (!filePath || !uploadId || !sessionId || !fileHash) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const jobId = crypto.randomUUID();
    
    // Create job entry
    const job = {
      jobId,
      sessionId,
      uploadId,
      fileHash,
      state: 'queued' as const,
      progress: 0,
      createdAt: Date.now(),
    };
    
    jobs.set(jobId, job);
    
    console.log('Job created:', jobId, { sessionId, uploadId, fileHash });

    // Start background processing
    EdgeRuntime.waitUntil(processExtraction(jobId, filePath, fileName));

    return new Response(
      JSON.stringify({ 
        jobId, 
        sessionId, 
        uploadId, 
        fileHash, 
        state: 'queued' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        },
        status: 202
      }
    );

  } catch (error) {
    console.error('Extract-start error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function processExtraction(jobId: string, filePath: string, fileName: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  const startTime = Date.now();
  const TIMEOUT_MS = 60000; // 60 second timeout

  try {
    job.state = 'processing';
    job.progress = 10;
    jobs.set(jobId, job);

    // Check timeout
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new Error('Processing timeout exceeded');
    }

    // Mock extraction logic (in real implementation, call OCR service here)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    
    job.progress = 50;
    jobs.set(jobId, job);

    // Parse mock content
    const mockText = `Topic: Sample Lesson from ${fileName}\nScripture: Romans 12:1-2\n\nThis is extracted content.`;
    const lines = mockText.split('\n');
    const topic = lines[0]?.replace('Topic:', '').trim() || 'Untitled';
    const scripture = lines[1]?.replace('Scripture:', '').trim() || '';
    
    job.state = 'done';
    job.progress = 100;
    job.result = {
      topic,
      scripture,
      content: mockText,
      sourceFile: fileName
    };
    jobs.set(jobId, job);

    console.log('Job completed:', jobId);

  } catch (error) {
    console.error('Processing error for job', jobId, error);
    job.state = 'failed';
    job.error = {
      code: 'processing_error',
      msg: error instanceof Error ? error.message : 'Processing failed'
    };
    jobs.set(jobId, job);
  }
}
