// ============================================================
// useParentSharedFocus.ts
// React hook for child org managers to see parent org's active focus
// SSOT Source: organizationConfig.ts -> SHARED_FOCUS_INHERITANCE
// Database Source: get_parent_active_focus() + adopt_parent_focus()
//
// PRINCIPLE: Parent org PUBLISHES focus. Child org SEES it.
// Child CHOOSES to adopt. Pure suggestion, never enforcement.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Matches the return type of get_parent_active_focus() SQL function
export interface ParentFocusData {
  focus_id: string;
  parent_org_id: string;
  parent_org_name: string;
  focus_type: string;
  passage: string | null;
  theme: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  already_adopted: boolean;
}

interface UseParentSharedFocusResult {
  parentFocus: ParentFocusData | null;
  loading: boolean;
  error: string | null;
  hasParentFocus: boolean;
  adopt: () => Promise<boolean>;
  refresh: () => void;
}

/**
 * Fetches the parent org's currently active shared focus for a child org.
 * Returns null if:
 *   - The org has no parent (top-level)
 *   - The parent has no active shared focus
 *   - The caller is not a member of the child org
 *
 * Provides an adopt() function that copies the parent's focus
 * into the child org's own Shared Focus (one-time copy, not live sync).
 */
export function useParentSharedFocus(childOrgId: string | undefined): UseParentSharedFocusResult {
  const [parentFocus, setParentFocus] = useState<ParentFocusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParentFocus = useCallback(async () => {
    if (!childOrgId) {
      setParentFocus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_parent_active_focus', { p_child_org_id: childOrgId });

      if (rpcError) {
        // Access denied or no parent -- both are expected, not errors
        if (rpcError.message?.includes('Access denied') ||
            rpcError.message?.includes('not a member')) {
          setParentFocus(null);
          setError(null);
        } else {
          console.error('Error fetching parent focus:', rpcError);
          setError(rpcError.message);
        }
      } else {
        // RPC returns array; we expect 0 or 1 rows
        const rows = data as ParentFocusData[] | null;
        setParentFocus(rows && rows.length > 0 ? rows[0] : null);
      }
    } catch (err) {
      console.error('Unexpected error fetching parent focus:', err);
      setError('Failed to load network focus');
    } finally {
      setLoading(false);
    }
  }, [childOrgId]);

  useEffect(() => {
    fetchParentFocus();
  }, [fetchParentFocus]);

  /**
   * Adopt the parent's focus -- creates a copy in child's org_shared_focus.
   * Returns true on success, false on failure.
   * After adoption, refreshes to update the already_adopted flag.
   */
  const adopt = useCallback(async (): Promise<boolean> => {
    if (!parentFocus || !childOrgId) return false;

    try {
      const { error: rpcError } = await supabase
        .rpc('adopt_parent_focus', {
          p_parent_focus_id: parentFocus.focus_id,
          p_child_org_id: childOrgId
        });

      if (rpcError) {
        console.error('Error adopting focus:', rpcError);
        setError(rpcError.message);
        return false;
      }

      // Refresh to update already_adopted flag
      await fetchParentFocus();
      return true;
    } catch (err) {
      console.error('Unexpected error adopting focus:', err);
      setError('Failed to adopt focus');
      return false;
    }
  }, [parentFocus, childOrgId, fetchParentFocus]);

  return {
    parentFocus,
    loading,
    error,
    hasParentFocus: parentFocus !== null,
    adopt,
    refresh: fetchParentFocus
  };
}
