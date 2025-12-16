/**
 * useOrgSharedFocus Hook
 * 
 * SSOT: src/constants/sharedFocusConfig.ts
 * 
 * Fetches the active shared focus for an organization member, along with
 * organization defaults (Bible version, theology profile) for the "Use Focus" feature.
 * 
 * When a member clicks "Use Focus", ALL org defaults should apply to their lesson form:
 * - Shared Focus passage and/or theme
 * - Organization's default_bible_version
 * - Organization's default_doctrine (theology profile)
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getFocusStatus,
  type SharedFocus,
  type FocusStatusKey,
} from "@/constants/sharedFocusConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface OrgFocusData {
  /** Active shared focus (if any) */
  activeFocus: SharedFocus | null;
  /** Organization's default Bible version ID */
  defaultBibleVersion: string | null;
  /** Organization's default theology profile ID */
  defaultDoctrine: string | null;
  /** Organization name (for display) */
  organizationName: string | null;
  /** Organization ID */
  organizationId: string | null;
}

export interface UseOrgSharedFocusReturn {
  /** Combined org focus data */
  focusData: OrgFocusData;
  /** Whether data is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh the focus data */
  refresh: () => Promise<void>;
  /** Check if there's an active focus available */
  hasActiveFocus: boolean;
  /** Get the focus status label */
  focusStatus: FocusStatusKey | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useOrgSharedFocus(): UseOrgSharedFocusReturn {
  const { user } = useAuth();
  const [focusData, setFocusData] = useState<OrgFocusData>({
    activeFocus: null,
    defaultBibleVersion: null,
    defaultDoctrine: null,
    organizationName: null,
    organizationId: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch org data and active focus
  const fetchOrgFocusData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get user's organization from their profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      
      if (!profile?.organization_id) {
        // User not in an organization - no focus available
        setFocusData({
          activeFocus: null,
          defaultBibleVersion: null,
          defaultDoctrine: null,
          organizationName: null,
          organizationId: null,
        });
        setLoading(false);
        return;
      }

      const orgId = profile.organization_id;

      // Step 2: Get organization details (name, defaults)
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, default_doctrine, default_bible_version")
        .eq("id", orgId)
        .single();

      if (orgError) throw orgError;

      // Step 3: Get active shared focus (where today is between start_date and end_date)
      const today = new Date().toISOString().split("T")[0];
      
      const { data: focuses, error: focusError } = await supabase
        .from("org_shared_focus")
        .select("*")
        .eq("organization_id", orgId)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_date", { ascending: false })
        .limit(1);

      if (focusError) throw focusError;

      const activeFocus = focuses && focuses.length > 0 ? focuses[0] : null;

      setFocusData({
        activeFocus,
        defaultBibleVersion: org?.default_bible_version || null,
        defaultDoctrine: org?.default_doctrine || null,
        organizationName: org?.name || null,
        organizationId: org?.id || null,
      });

    } catch (err: any) {
      console.error("Error fetching org focus data:", err);
      setError(err.message || "Failed to load organization focus");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchOrgFocusData();
  }, [fetchOrgFocusData]);

  // Compute derived values
  const hasActiveFocus = !!focusData.activeFocus;
  
  const focusStatus: FocusStatusKey | null = focusData.activeFocus
    ? getFocusStatus(focusData.activeFocus.start_date, focusData.activeFocus.end_date)
    : null;

  return {
    focusData,
    loading,
    error,
    refresh: fetchOrgFocusData,
    hasActiveFocus,
    focusStatus,
  };
}

// ============================================================================
// HELPER: Build focus application payload
// ============================================================================

/**
 * Builds the data object to apply when user clicks "Use Focus"
 * This includes ALL org defaults, not just the focus passage/theme
 */
export function buildFocusApplicationData(focusData: OrgFocusData): {
  passage: string;
  theme: string;
  bibleVersionId: string | null;
  theologyProfileId: string | null;
} {
  return {
    passage: focusData.activeFocus?.passage || "",
    theme: focusData.activeFocus?.theme || "",
    bibleVersionId: focusData.defaultBibleVersion,
    theologyProfileId: focusData.defaultDoctrine,
  };
}
