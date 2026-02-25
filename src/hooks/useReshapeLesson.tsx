/**
 * useReshapeLesson Hook
 * Calls the reshape-lesson Edge Function to reshape a lesson into a different pedagogical format
 *
 * Phase 27: Lesson Shapes (February 2026)
 *
 * PATTERN: Follows useEnhanceLesson.tsx structure
 * - Authenticates user via supabase.auth.getUser()
 * - Calls Edge Function via supabase.functions.invoke()
 * - Returns typed result with success/error/data
 * - Manages loading state for UI spinners
 *
 * ARCHITECTURE:
 * - Frontend assembles the complete reshape prompt (from lessonShapeProfiles.ts)
 * - Edge Function is a pure relay -- receives prompt, calls Claude, returns content
 * - Edge Function writes metrics to reshape_metrics table (non-blocking)
 * - This hook does NOT write to the lessons table -- caller uses useLessons.updateLessonShape()
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShapeId } from "@/constants/lessonShapeProfiles";

// ============================================================================
// TYPES
// ============================================================================

export interface ReshapeLessonRequest {
  /** The original lesson text (original_text from lessons table) */
  original_content: string;
  /** Complete reshape prompt assembled by assembleReshapePrompt() */
  reshape_prompt: string;
  /** Which shape is being applied */
  shape_id: ShapeId;
  /** Lesson UUID for metrics tracking */
  lesson_id: string;
}

export interface ReshapeLessonResult {
  success: boolean;
  /** The reshaped lesson content */
  shaped_content?: string;
  /** Metadata from Edge Function response */
  metadata?: {
    tokens_input?: number;
    tokens_output?: number;
    reshape_duration_ms?: number;
    word_count?: number;
    model?: string;
  };
  error?: string;
}

// ============================================================================
// HOOK
// ============================================================================

export const useReshapeLesson = () => {
  const [isReshaping, setIsReshaping] = useState(false);
  const { toast } = useToast();

  const reshapeLesson = async (request: ReshapeLessonRequest): Promise<ReshapeLessonResult> => {
    setIsReshaping(true);

    try {
      // Authenticate
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be signed in to reshape a lesson.",
          variant: "destructive",
        });
        return { success: false, error: "User not authenticated" };
      }

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke("reshape-lesson", {
        body: {
          original_content: request.original_content,
          reshape_prompt: request.reshape_prompt,
          shape_id: request.shape_id,
          lesson_id: request.lesson_id,
        },
      });

      if (error) {
        // Try to parse structured error from Edge Function
        const errorBody = error.context?.body;
        if (errorBody) {
          try {
            const parsed = typeof errorBody === 'string' ? JSON.parse(errorBody) : errorBody;
            
            // Rate limited
            if (parsed.error?.includes('rate limit') || parsed.error?.includes('overloaded')) {
              toast({
                title: "Service Busy",
                description: "The AI service is temporarily busy. Please try again in a moment.",
                variant: "destructive",
              });
              return { success: false, error: "Rate limited -- please retry" };
            }

            // Timeout
            if (parsed.error?.includes('timeout') || parsed.error?.includes('timed out')) {
              toast({
                title: "Request Timed Out",
                description: "The reshape took too long. Please try again.",
                variant: "destructive",
              });
              return { success: false, error: "Reshape timed out" };
            }
          } catch (e) {
            // Not JSON, continue with generic error
          }
        }

        toast({
          title: "Reshape Failed",
          description: error.message || "Failed to reshape lesson. Please try again.",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      // Validate response has content
      if (!data?.shaped_content) {
        toast({
          title: "Reshape Error",
          description: "No content was returned. Please try again.",
          variant: "destructive",
        });
        return { success: false, error: "Empty response from reshape" };
      }

      toast({
        title: "Lesson Reshaped",
        description: "Your lesson has been reshaped successfully.",
      });

      return {
        success: true,
        shaped_content: data.shaped_content,
        metadata: {
          tokens_input: data.tokens_input,
          tokens_output: data.tokens_output,
          reshape_duration_ms: data.reshape_duration_ms,
          word_count: data.word_count,
          model: data.model,
        },
      };
    } catch (error: any) {
      console.error("Error reshaping lesson:", error);
      toast({
        title: "Reshape Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsReshaping(false);
    }
  };

  return {
    reshapeLesson,
    isReshaping,
  };
};
