import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface GenerateLessonButtonProps {
  onSuccess?: () => void;
}

export function GenerateLessonButton({ onSuccess }: GenerateLessonButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: { 
          source_type: "text",
          original_text: "Sample lesson content",
          filters: {}
        },
      });

      if (error) {
        if (error.message?.includes("402") || error.message?.includes("insufficient")) {
          toast({
            title: "No credits",
            description: "You don't have enough credits to generate a lesson",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Lesson generated!",
        description: "Your lesson has been created successfully",
      });
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate lesson",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Lesson</CardTitle>
        <CardDescription>Create a new AI-powered lesson (costs 1 credit)</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Lesson
        </Button>
      </CardContent>
    </Card>
  );
}
