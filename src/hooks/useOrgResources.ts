/**
 * useOrgResources Hook
 *
 * Fetches the Org Resource Library list for an organization and exposes a
 * delete action. No join to profiles -- member-facing UI never shows who
 * uploaded a resource (uploaded_by is carried for audit only).
 *
 * @location src/hooks/useOrgResources.ts
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrgResource } from "@/constants/contracts";

export function useOrgResources(organizationId: string | undefined) {
  const [resources, setResources] = useState<OrgResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!organizationId) {
      setResources([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('org_resources')
      .select('id, organization_id, uploaded_by, title, description, file_path, file_size, page_count, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setResources(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Delete the storage object FIRST, then the row. If the storage delete
  // fails, abort and leave the row fully intact so the leader can retry --
  // an orphaned file that nothing tracks is permanent and invisible in a
  // 25MB-capped bucket, while a row pointing at an already-deleted file is
  // rarer, visible, and self-healing on retry.
  const deleteResource = useCallback(async (resource: OrgResource): Promise<{ success: boolean; error?: string }> => {
    const { error: storageError } = await supabase.storage
      .from('org-resources')
      .remove([resource.file_path]);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    const { error: rowError } = await supabase
      .from('org_resources')
      .delete()
      .eq('id', resource.id);

    if (rowError) {
      return { success: false, error: rowError.message };
    }

    setResources(prev => prev.filter(r => r.id !== resource.id));
    return { success: true };
  }, []);

  return { resources, loading, error, refresh, deleteResource };
}
