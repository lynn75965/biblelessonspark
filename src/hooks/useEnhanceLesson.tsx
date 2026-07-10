import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { API_ERROR_CODES } from "@/constants/apiErrorCodes";

export interface EnhanceLessonResult {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
  lessons_used?: number;
  lessons_limit?: number;
  tier?: string;
  reset_date?: string;
}

export const useEnhanceLesson = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSupplements, setIsLoadingSupplements] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingTokenCount, setStreamingTokenCount] = useState(0);
  const { toast } = useToast();

  const enhanceLesson = async (
    enhancementData: Record<string, any>,
    onSupplements?: (updatedLesson: any) => void
  ): Promise<EnhanceLessonResult> => {
    setIsGenerating(true);
    setIsLoadingSupplements(false);
    setStreamingContent('');
    setStreamingTokenCount(0);

    try {
      // Fresh session token required -- prevents 401s on long-lived sessions
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "Session expired. Please refresh and try again.",
          variant: "destructive",
        });
        return { success: false, error: "User not authenticated" };
      }

      // URL and key match src/integrations/supabase/client.ts (auto-generated, no env vars)
      const SUPABASE_URL = "https://hphebzdftpjbiudpfcrs.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaGViemRmdHBqYml1ZHBmY3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDk0MjksImV4cCI6MjA3NjM4NTQyOX0.WSNtUrxihquk0ZV0tT7uaad8W3MNjIUwCD4hG0jr-eo";

      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(enhancementData),
      });

      // Pre-streaming error (auth failure, limit reached, etc.) -- JSON body
      if (!response.ok) {
        let errorBody: any = {};
        try { errorBody = await response.json(); } catch { /* non-JSON body */ }

        if (errorBody.code === API_ERROR_CODES.LIMIT_REACHED) {
          return {
            success: false,
            code: API_ERROR_CODES.LIMIT_REACHED,
            error: errorBody.error,
            lessons_used: errorBody.lessons_used,
            lessons_limit: errorBody.lessons_limit,
            tier: errorBody.tier,
            reset_date: errorBody.reset_date,
          };
        }

        const errMsg = errorBody.error || `Generation failed (${response.status})`;
        toast({
          title: "Error",
          description: errMsg,
          variant: "destructive",
        });
        return { success: false, error: errMsg };
      }

      // Read the SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      return await new Promise<EnhanceLessonResult>((resolve) => {
        (async () => {
          let tokenAccum = 0;
          let phase1Resolved = false;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (!phase1Resolved) {
                  resolve({ success: false, error: 'Stream ended without a completion event' });
                }
                // Stream closed naturally after Phase 2 (or Phase 1 for single-phase)
                setIsLoadingSupplements(false);
                return;
              }

              sseBuffer += decoder.decode(value, { stream: true });
              const messages = sseBuffer.split('\n\n');
              sseBuffer = messages.pop() ?? '';

              for (const message of messages) {
                const dataLine = message.split('\n').find(l => l.startsWith('data: '));
                if (!dataLine) continue;

                let event: any;
                try { event = JSON.parse(dataLine.slice(6)); } catch { continue; }

                if (event.type === 'token') {
                  tokenAccum++;
                  setStreamingContent(prev => prev + event.token);
                  setStreamingTokenCount(tokenAccum);
                } else if (event.type === 'done') {
                  toast({
                    title: "Lesson ready",
                    description: event.two_phase
                      ? "Sections 1-5 saved. Supplement sections being prepared..."
                      : "Lesson generated successfully",
                  });
                  phase1Resolved = true;
                  // Resolve with Phase 1 lesson so the form can display it immediately
                  resolve({
                    success: true,
                    data: {
                      lesson: event.lesson,
                      style_metadata: event.style_metadata ?? null,
                      metadata: event.metadata,
                      success: true,
                    },
                  });
                  // If two-phase, keep reading stream for supplements event
                  if (event.two_phase) {
                    setIsLoadingSupplements(true);
                  }
                  // Don't return -- continue reading for supplements
                } else if (event.type === 'supplements') {
                  setIsLoadingSupplements(false);
                  if (onSupplements && event.lesson) {
                    onSupplements(event.lesson);
                  }
                  return;
                } else if (event.type === 'supplements_failed') {
                  setIsLoadingSupplements(false);
                  console.warn('Supplements failed:', event.message);
                  return;
                } else if (event.type === 'error') {
                  const errCode = event.code as string | undefined;
                  const errMsg = (event.error as string) || 'Generation failed';
                  if (!phase1Resolved) {
                    if (errCode !== API_ERROR_CODES.LIMIT_REACHED) {
                      toast({
                        title: "Generation Failed",
                        description: errMsg,
                        variant: "destructive",
                      });
                    }
                    resolve({ success: false, error: errMsg, code: errCode });
                    phase1Resolved = true;
                  }
                  setIsLoadingSupplements(false);
                  return;
                }
              }
            }
          } catch (readError: any) {
            if (!phase1Resolved) {
              resolve({ success: false, error: readError.message || 'Stream read error' });
            }
            setIsLoadingSupplements(false);
          }
        })();
      });

    } catch (error: any) {
      console.error("Error generating lesson:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate lesson",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
      // Note: isLoadingSupplements is NOT cleared here -- Phase 2 may still be running
    }
  };

  return {
    enhanceLesson,
    isEnhancing: isGenerating,
    isLoadingSupplements,
    streamingContent,
    streamingTokenCount,
  };
};
