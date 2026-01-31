// ============================================================
// useFocusAdoptionMap.ts
// React hook for parent org managers to see focus adoption status
// SSOT Source: organizationConfig.ts → SHARED_FOCUS_INHERITANCE
//   parentSeesAdoptionStatus: true (informational only)
// Database Source: get_focus_adoption_map() secure function
//
// Used on the Network tab to show adoption badges on ChildOrgCards
// and a summary line: "3 of 5 organizations adopted the focus"
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdoptionMapEntry {
  child_org_id: string;
  has_adopted: boolean;
}

interface UseFocusAdoptionMapResult {
  /** Map of child_org_id → adopted boolean */
  adoptionMap: Record<string, boolean>;
  /** True if the parent org has a currently active focus */
  hasActiveFocus: boolean;
  /** Count of children who adopted */
  adoptedCount: number;
  /** Total children in the map */
  totalChildren: number;
  /** Loading state */
  loading: boolean;
  /** Refresh function */
  refresh: () => void;
}

/**
 * Fetches the focus adoption map for a parent organization.
 * Calls get_focus_adoption_map() which returns one row per child org
 * indicating whether they adopted the parent's current active focus.
 *
 * Returns empty data if:
 *   - No parentOrgId provided
 *   - Parent has no active shared focus
 *   - Caller is not the parent's org leader or admin
 */
export function useFocusAdoptionMap(parentOrgId: string | undefined): UseFocusAdoptionMapResult {
  const [entries, setEntries] = useState<AdoptionMapEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdoptionMap = useCallback(async () => {
    if (!parentOrgId) {
      setEntries([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_focus_adoption_map', { p_parent_org_id: parentOrgId });

      if (error) {
        // Silently handle — may not be a parent org, or no active focus
        // Access denied is also expected if user isn't the leader
        setEntries([]);
      } else {
        setEntries((data as AdoptionMapEntry[]) || []);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [parentOrgId]);

  useEffect(() => {
    fetchAdoptionMap();
  }, [fetchAdoptionMap]);

  // Build lookup map: child_org_id → boolean
  const adoptionMap: Record<string, boolean> = {};
  entries.forEach(e => { adoptionMap[e.child_org_id] = e.has_adopted; });

  return {
    adoptionMap,
    hasActiveFocus: entries.length > 0,
    adoptedCount: entries.filter(e => e.has_adopted).length,
    totalChildren: entries.length,
    loading,
    refresh: fetchAdoptionMap
  };
}
