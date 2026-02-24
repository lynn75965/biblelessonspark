/**
 * useOrgSharedFocus - Fetch active shared focus and org settings
 * 
 * SSOT: src/constants/sharedFocusConfig.ts
 * Returns the currently active focus (if any) and org defaults
 */

import { useState, useEffect } from "react";
import { useOrganization } from "./useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { SharedFocus } from "@/constants/sharedFocusConfig";

interface OrgSettings {
  default_doctrine: string | null;
  default_bible_version: string | null;
}

export function useOrgSharedFocus() {
  const { organization, hasOrganization } = useOrganization();
  const [activeFocus, setActiveFocus] = useState<SharedFocus | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveFocus = async () => {
      if (!hasOrganization || !organization?.id) {
        setActiveFocus(null);
        setOrgSettings(null);
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch focus where today falls within date range
        const { data, error } = await supabase
          .from("org_shared_focus")
          .select("*")
          .eq("organization_id", organization.id)
          .lte("start_date", today)
          .gte("end_date", today)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching active focus:", error);
          setActiveFocus(null);
        } else {
          setActiveFocus(data);
        }

        // Also capture org settings
        setOrgSettings({
          default_doctrine: organization.default_doctrine || null,
          default_bible_version: organization.default_bible_version || null,
        });
      } catch (error) {
        console.error("Error in fetchActiveFocus:", error);
        setActiveFocus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveFocus();
  }, [organization?.id, organization?.default_doctrine, organization?.default_bible_version, hasOrganization]);

  return {
    activeFocus,
    orgSettings,
    loading,
    hasActiveFocus: !!activeFocus,
  };
}
