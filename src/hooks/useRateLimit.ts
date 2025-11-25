import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RateLimitStatus {
  isLoading: boolean;
  isLimitReached: boolean;
  lessonsUsed: number;
  lessonsAllowed: number;
  hoursUntilReset: number | null;
  errorMessage: string | null;
}

export function useRateLimit() {
  const [status, setStatus] = useState<RateLimitStatus>({
    isLoading: true,
    isLimitReached: false,
    lessonsUsed: 0,
    lessonsAllowed: 5,
    hoursUntilReset: null,
    errorMessage: null,
  });

  const checkRateLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Fetch settings from app_settings (SSOT)
      const { data: settings, error: settingsError } = await supabase
        .from("app_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["beta_lesson_limit", "beta_limit_hours"]);

      if (settingsError) throw settingsError;

      const limitSetting = settings?.find(s => s.setting_key === "beta_lesson_limit");
      const hoursSetting = settings?.find(s => s.setting_key === "beta_limit_hours");
      
      const lessonLimit = parseInt(limitSetting?.setting_value || "5", 10);
      const limitHours = parseInt(hoursSetting?.setting_value || "24", 10);

      // Calculate cutoff time
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - limitHours);

      // Count user's lessons in the limit period
      const { count, error: countError } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", cutoffTime.toISOString());

      if (countError) throw countError;

      const lessonsUsed = count || 0;
      const isLimitReached = lessonsUsed >= lessonLimit;

      // Calculate hours until oldest lesson expires (if limit reached)
      let hoursUntilReset = null;
      if (isLimitReached) {
        const { data: oldestLesson } = await supabase
          .from("lessons")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", cutoffTime.toISOString())
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (oldestLesson) {
          const oldestTime = new Date(oldestLesson.created_at);
          const resetTime = new Date(oldestTime.getTime() + limitHours * 60 * 60 * 1000);
          hoursUntilReset = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60 * 60));
        }
      }

      setStatus({
        isLoading: false,
        isLimitReached,
        lessonsUsed,
        lessonsAllowed: lessonLimit,
        hoursUntilReset,
        errorMessage: isLimitReached 
          ? `You've reached your limit of ${lessonLimit} lessons per ${limitHours} hours. You can generate another lesson in approximately ${hoursUntilReset} hour${hoursUntilReset === 1 ? '' : 's'}.`
          : null,
      });
    } catch (error) {
      console.error("Rate limit check error:", error);
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false,
        errorMessage: "Unable to check rate limit. Please try again.",
      }));
    }
  };

  useEffect(() => {
    checkRateLimit();
  }, []);

  return { ...status, refreshRateLimit: checkRateLimit };
}
