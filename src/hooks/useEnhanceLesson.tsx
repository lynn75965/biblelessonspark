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
  const { toast } = useToast();

  const enhanceLesson = async (enhancementData: Record<string, any>): Promise<EnhanceLessonResult> => {
    setIsGenerating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return { success: false, error: "User not authenticated" };
      }

      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: enhancementData,
      });

      // Check if the response contains a LIMIT_REACHED error
      if (error) {
        // Try to parse error context for limit info
        const errorBody = error.context?.body;
        if (errorBody) {
          try {
            const parsed = typeof errorBody === 'string' ? JSON.parse(errorBody) : errorBody;
            if (parsed.code === API_ERROR_CODES.LIMIT_REACHED) {
              // Don't show toast - let the modal handle it
              return {
                success: false,
                code: API_ERROR_CODES.LIMIT_REACHED,
                error: parsed.error,
                lessons_used: parsed.lessons_used,
                lessons_limit: parsed.lessons_limit,
                tier: parsed.tier,
                reset_date: parsed.reset_date
              };
            }
          } catch (e) {
            // Not JSON, continue with normal error handling
          }
        }
        
        // Regular error - show toast
        toast({
          title: "Error",
          description: error.message || "Failed to generate lesson",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      // Check if data itself contains limit error (edge function might return 200 with error body)
      if (data?.code === API_ERROR_CODES.LIMIT_REACHED) {
        return {
          success: false,
          code: API_ERROR_CODES.LIMIT_REACHED,
          error: data.error,
          lessons_used: data.lessons_used,
          lessons_limit: data.lessons_limit,
          tier: data.tier,
          reset_date: data.reset_date
        };
      }

      toast({
        title: "Success",
        description: "Lesson generated successfully",
      });

      return { success: true, data };
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
    }
  };

  return {
    enhanceLesson,
    isEnhancing: isGenerating,
  };
};

