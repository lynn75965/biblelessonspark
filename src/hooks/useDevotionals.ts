/**
 * useDevotionals Hook
 * 
 * Fetches and manages user's devotionals from the database.
 * 
 * Features:
 * - Fetch all devotionals for current user
 * - Delete devotional
 * - Real-time subscription (optional)
 * 
 * @version 1.0.0
 * @lastUpdated 2025-12-28
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// TYPES
// ============================================================================

export interface Devotional {
  id: string;
  user_id: string;
  source_lesson_id: string | null;
  bible_passage: string;
  target_id: string;
  length_id: string;
  theology_profile_id: string;
  bible_version_id: string;
  age_group_id: string | null;
  title: string | null;
  content: string | null;
  section_contemporary_connection: string | null;
  section_scripture_in_context: string | null;
  section_theological_insights: string | null;
  section_reflection_questions: string | null;
  section_prayer_prompt: string | null;
  word_count: number | null;
  generation_duration_ms: number | null;
  anthropic_model: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  detected_valence: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface UseDevotionalsReturn {
  devotionals: Devotional[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteDevotional: (id: string) => Promise<boolean>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDevotionals(): UseDevotionalsReturn {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch devotionals
  const fetchDevotionals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setDevotionals([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("devotionals")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setDevotionals(data || []);
    } catch (err: any) {
      console.error("Error fetching devotionals:", err);
      setError(err.message || "Failed to fetch devotionals");
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete devotional
  const deleteDevotional = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("devotionals")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setDevotionals((prev) => prev.filter((d) => d.id !== id));

      toast({
        title: "Devotional Deleted",
        description: "The devotional has been removed from your library.",
      });

      return true;
    } catch (err: any) {
      console.error("Error deleting devotional:", err);
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete the devotional.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Initial fetch
  useEffect(() => {
    fetchDevotionals();
  }, [fetchDevotionals]);

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchDevotionals();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDevotionals]);

  return {
    devotionals,
    loading,
    error,
    refetch: fetchDevotionals,
    deleteDevotional,
  };
}
