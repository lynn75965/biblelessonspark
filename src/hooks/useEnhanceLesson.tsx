import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEnhanceLesson = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const enhanceLesson = async (enhancementData: Record<string, any>) => {
    setIsGenerating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: enhancementData,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson enhancement generated successfully",
      });

      return data;
    } catch (error: any) {
      console.error("Error enhancing lesson:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to enhance lesson",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    enhanceLesson,
    isEnhancing: isGenerating,
  };
};
