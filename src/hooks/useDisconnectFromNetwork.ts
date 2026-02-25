// ============================================================
// useDisconnectFromNetwork.ts
// React hook for disconnecting an org from its parent network
// SSOT Source: organizationConfig.ts -> DISCONNECT_RULES
// Database Source: disconnect_org_from_network() secure function
//
// PRINCIPLE: Any child block can detach at any time. Nothing breaks.
// Baptist autonomy honored completely.
// ============================================================

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DisconnectResult {
  success: boolean;
  disconnected_org_id: string;
  disconnected_org_name: string;
  former_parent_name: string;
  message: string;
}

interface UseDisconnectFromNetworkResult {
  /** Execute the disconnect */
  disconnect: (orgId: string) => Promise<DisconnectResult | null>;
  /** True while the RPC is in flight */
  disconnecting: boolean;
  /** Error message if disconnect failed */
  error: string | null;
}

/**
 * Provides a disconnect() function that severs the parent-child link.
 * Can be called by:
 *   - Child org leader (disconnecting their own org)
 *   - Parent org leader (disconnecting a child from their network)
 *   - Platform admin (disconnecting any org)
 *
 * On success, the child org becomes independent (top-level).
 * All data (members, pool, lessons, subscription) remains unchanged.
 */
export function useDisconnectFromNetwork(): UseDisconnectFromNetworkResult {
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(async (orgId: string): Promise<DisconnectResult | null> => {
    setDisconnecting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('disconnect_org_from_network', { p_org_id: orgId });

      if (rpcError) {
        console.error('Error disconnecting org:', rpcError);
        setError(rpcError.message);
        return null;
      }

      return data as DisconnectResult;
    } catch (err) {
      console.error('Unexpected error disconnecting org:', err);
      setError('Failed to disconnect organization');
      return null;
    } finally {
      setDisconnecting(false);
    }
  }, []);

  return { disconnect, disconnecting, error };
}
