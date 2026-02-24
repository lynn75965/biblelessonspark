import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Language = "en" | "es" | "fr";

interface LanguageOption {
  value: Language;
  label: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" }
];

export default function LanguageSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadLanguage() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading language preference:", error);
        } else {
          setLanguage((data?.preferred_language as Language) || "en");
        }
      } catch (error) {
        console.error("Unexpected error loading language:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLanguage();
  }, [user]);

  async function handleSave() {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save preferences.",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_language: language })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your content language preference has been saved.",
      });
      
    } catch (error) {
      console.error("Error saving language:", error);
      toast({
        title: "Error",
        description: "Failed to update language preference. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-32"></div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="language-selector" className="text-sm font-medium">
          Content Language
        </label>
        <p className="text-sm text-muted-foreground">
          Choose the language for your lesson plans, teacher transcripts, and student handouts.
        </p>
        <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
          <SelectTrigger id="language-selector" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.flag} {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? "Saving..." : "Save Language Preference"}
      </Button>
    </div>
  );
}
