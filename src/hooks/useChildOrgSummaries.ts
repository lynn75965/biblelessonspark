// ============================================================
// useChildOrgSummaries.ts
// React hook for fetching child organization summary data
// SSOT Source: organizationConfig.ts → PARENT_VISIBILITY
// Database Source: get_child_org_summaries() secure function
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Matches the return type of get_child_org_summaries() in Phase N2
export interface ChildOrgSummary {
  org_id: string;
  org_name: string;
  org_type: string;
  manager_email: string;
  member_count: number;
  lessons_this_month: number;
  pool_total: number;
  pool_used: number;
  pool_percentage: number;
  subscription_tier: string | null;
  subscription_status: string | null;
  health_status: 'healthy' | 'attention' | 'critical';
  health_color: string;
}

interface UseChildOrgSummariesResult {
  children: ChildOrgSummary[];
  loading: boolean;
  error: string | null;
  hasChildren: boolean;
  refresh: () => void;
}

/**
 * Fetches child org summaries for the given parent organization.
 * Calls the get_child_org_summaries() SECURITY DEFINER function
 * which enforces the PARENT_VISIBILITY boundary at database level.
 * 
 * Returns hasChildren=false if no child orgs exist, which controls
 * whether the Network tab appears in OrgManager.
 */
export function useChildOrgSummaries(parentOrgId: string | undefined): UseChildOrgSummariesResult {
  const [children, setChildren] = useState<ChildOrgSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaries = useCallback(async () => {
    if (!parentOrgId) {
      setChildren([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_child_org_summaries', { p_parent_org_id: parentOrgId });

      if (rpcError) {
        // Access denied is expected if user isn't the org manager
        // or if the org simply has no children
        if (rpcError.message?.includes('Access denied')) {
          setChildren([]);
          setError(null);
        } else {
          console.error('Error fetching child org summaries:', rpcError);
          setError(rpcError.message);
        }
      } else {
        setChildren((data as ChildOrgSummary[]) || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching child org summaries:', err);
      setError('Failed to load network data');
    } finally {
      setLoading(false);
    }
  }, [parentOrgId]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return {
    children,
    loading,
    error,
    hasChildren: children.length > 0,
    refresh: fetchSummaries
  };
}
