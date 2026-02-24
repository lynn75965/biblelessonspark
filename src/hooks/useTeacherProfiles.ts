/**
 * useTeacherProfiles Hook
 * CRUD operations for teacher preference profiles
 * 
 * Architecture: Frontend drives backend
 * Imports TeacherPreferences interface from SSOT
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TeacherPreferences, DEFAULT_TEACHER_PREFERENCES } from "@/constants/teacherPreferences";

// ============================================================================
// TYPES
// ============================================================================

export interface TeacherPreferenceProfile {
  id: string;
  user_id: string;
  profile_name: string;
  is_default: boolean;
  preferences: TeacherPreferences;
  created_at: string;
  updated_at: string;
}

interface UseTeacherProfilesReturn {
  // Data
  profiles: TeacherPreferenceProfile[];
  defaultProfile: TeacherPreferenceProfile | null;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  createProfile: (name: string, preferences: TeacherPreferences, setAsDefault?: boolean) => Promise<TeacherPreferenceProfile | null>;
  updateProfile: (id: string, name: string, preferences: TeacherPreferences, setAsDefault?: boolean) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
  setDefaultProfile: (id: string) => Promise<boolean>;
  refreshProfiles: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_PROFILES = 7;
const MAX_NAME_LENGTH = 50;

// ============================================================================
// HOOK
// ============================================================================

export function useTeacherProfiles(): UseTeacherProfilesReturn {
  const [profiles, setProfiles] = useState<TeacherPreferenceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // ============================================================================
  // FETCH PROFILES
  // ============================================================================

  const fetchProfiles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfiles([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("teacher_preference_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Error loading profiles",
          description: error.message,
          variant: "destructive",
        });
        setProfiles([]);
      } else {
        // Parse JSONB preferences and merge with defaults for safety
        const parsedProfiles = (data || []).map((profile) => ({
          ...profile,
          preferences: {
            ...DEFAULT_TEACHER_PREFERENCES,
            ...(typeof profile.preferences === 'object' ? profile.preferences : {}),
          } as TeacherPreferences,
        }));
        setProfiles(parsedProfiles);
      }
    } catch (err) {
      console.error("Error in fetchProfiles:", err);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ============================================================================
  // COMPUTED: Default Profile
  // ============================================================================

  const defaultProfile = profiles.find((p) => p.is_default) || null;

  // ============================================================================
  // CREATE PROFILE
  // ============================================================================

  const createProfile = useCallback(
    async (
      name: string,
      preferences: TeacherPreferences,
      setAsDefault: boolean = false
    ): Promise<TeacherPreferenceProfile | null> => {
      // Validate
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast({
          title: "Invalid profile name",
          description: "Profile name cannot be empty",
          variant: "destructive",
        });
        return null;
      }

      if (trimmedName.length > MAX_NAME_LENGTH) {
        toast({
          title: "Profile name too long",
          description: `Maximum ${MAX_NAME_LENGTH} characters allowed`,
          variant: "destructive",
        });
        return null;
      }

      if (profiles.length >= MAX_PROFILES) {
        toast({
          title: "Profile limit reached",
          description: `Maximum of ${MAX_PROFILES} profiles allowed. Delete an existing profile first.`,
          variant: "destructive",
        });
        return null;
      }

      // Check for duplicate name
      if (profiles.some((p) => p.profile_name.toLowerCase() === trimmedName.toLowerCase())) {
        toast({
          title: "Profile name exists",
          description: "A profile with this name already exists",
          variant: "destructive",
        });
        return null;
      }

      setIsSaving(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Not authenticated",
            description: "Please sign in to save profiles",
            variant: "destructive",
          });
          return null;
        }

        const { data, error } = await supabase
          .from("teacher_preference_profiles")
          .insert({
            user_id: user.id,
            profile_name: trimmedName,
            is_default: setAsDefault,
            preferences: preferences as unknown as Record<string, unknown>,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating profile:", error);
          toast({
            title: "Error saving profile",
            description: error.message,
            variant: "destructive",
          });
          return null;
        }

        const newProfile: TeacherPreferenceProfile = {
          ...data,
          preferences: {
            ...DEFAULT_TEACHER_PREFERENCES,
            ...(typeof data.preferences === 'object' ? data.preferences : {}),
          } as TeacherPreferences,
        };

        // Refresh to get updated default states
        await fetchProfiles();

        toast({
          title: "Profile saved",
          description: `"${trimmedName}" has been saved${setAsDefault ? " as your default profile" : ""}`,
        });

        return newProfile;
      } catch (err) {
        console.error("Error in createProfile:", err);
        toast({
          title: "Error saving profile",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [profiles, toast, fetchProfiles]
  );

  // ============================================================================
  // UPDATE PROFILE
  // ============================================================================

  const updateProfile = useCallback(
    async (
      id: string,
      name: string,
      preferences: TeacherPreferences,
      setAsDefault?: boolean
    ): Promise<boolean> => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast({
          title: "Invalid profile name",
          description: "Profile name cannot be empty",
          variant: "destructive",
        });
        return false;
      }

      if (trimmedName.length > MAX_NAME_LENGTH) {
        toast({
          title: "Profile name too long",
          description: `Maximum ${MAX_NAME_LENGTH} characters allowed`,
          variant: "destructive",
        });
        return false;
      }

      // Check for duplicate name (excluding current profile)
      if (
        profiles.some(
          (p) => p.id !== id && p.profile_name.toLowerCase() === trimmedName.toLowerCase()
        )
      ) {
        toast({
          title: "Profile name exists",
          description: "A profile with this name already exists",
          variant: "destructive",
        });
        return false;
      }

      setIsSaving(true);

      try {
        const updateData: Record<string, unknown> = {
          profile_name: trimmedName,
          preferences: preferences as unknown as Record<string, unknown>,
        };

        if (typeof setAsDefault === "boolean") {
          updateData.is_default = setAsDefault;
        }

        const { error } = await supabase
          .from("teacher_preference_profiles")
          .update(updateData)
          .eq("id", id);

        if (error) {
          console.error("Error updating profile:", error);
          toast({
            title: "Error updating profile",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }

        await fetchProfiles();

        toast({
          title: "Profile updated",
          description: `"${trimmedName}" has been updated`,
        });

        return true;
      } catch (err) {
        console.error("Error in updateProfile:", err);
        toast({
          title: "Error updating profile",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [profiles, toast, fetchProfiles]
  );

  // ============================================================================
  // DELETE PROFILE
  // ============================================================================

  const deleteProfile = useCallback(
    async (id: string): Promise<boolean> => {
      const profile = profiles.find((p) => p.id === id);
      if (!profile) {
        toast({
          title: "Profile not found",
          description: "The profile could not be found",
          variant: "destructive",
        });
        return false;
      }

      setIsSaving(true);

      try {
        const { error } = await supabase
          .from("teacher_preference_profiles")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Error deleting profile:", error);
          toast({
            title: "Error deleting profile",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }

        await fetchProfiles();

        toast({
          title: "Profile deleted",
          description: `"${profile.profile_name}" has been deleted`,
        });

        return true;
      } catch (err) {
        console.error("Error in deleteProfile:", err);
        toast({
          title: "Error deleting profile",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [profiles, toast, fetchProfiles]
  );

  // ============================================================================
  // SET DEFAULT PROFILE
  // ============================================================================

  const setDefaultProfile = useCallback(
    async (id: string): Promise<boolean> => {
      const profile = profiles.find((p) => p.id === id);
      if (!profile) {
        toast({
          title: "Profile not found",
          description: "The profile could not be found",
          variant: "destructive",
        });
        return false;
      }

      if (profile.is_default) {
        // Already default, no action needed
        return true;
      }

      setIsSaving(true);

      try {
        const { error } = await supabase
          .from("teacher_preference_profiles")
          .update({ is_default: true })
          .eq("id", id);

        if (error) {
          console.error("Error setting default profile:", error);
          toast({
            title: "Error setting default",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }

        await fetchProfiles();

        toast({
          title: "Default profile updated",
          description: `"${profile.profile_name}" is now your default profile`,
        });

        return true;
      } catch (err) {
        console.error("Error in setDefaultProfile:", err);
        toast({
          title: "Error setting default",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [profiles, toast, fetchProfiles]
  );

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    profiles,
    defaultProfile,
    isLoading,
    isSaving,
    createProfile,
    updateProfile,
    deleteProfile,
    setDefaultProfile,
    refreshProfiles: fetchProfiles,
  };
}
