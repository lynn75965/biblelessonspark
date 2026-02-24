import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  SYSTEM_SETTINGS, 
  getAllDefaults, 
  type SettingKey 
} from '@/constants/systemSettings';

type SettingsRecord = Record<SettingKey, string | boolean>;

export function useSystemSettings() {
  const [settings, setSettings] = useState<SettingsRecord>(getAllDefaults());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('key, value');

      if (fetchError) {
        console.error('Error fetching settings:', fetchError);
        setError(fetchError.message);
        // Fall back to defaults
        setSettings(getAllDefaults());
        return;
      }

      if (data && data.length > 0) {
        const dbSettings: Partial<SettingsRecord> = {};
        
        for (const row of data) {
          const key = row.key as SettingKey;
          if (key in SYSTEM_SETTINGS) {
            // Parse boolean strings
            if (row.value === 'true') {
              dbSettings[key] = true;
            } else if (row.value === 'false') {
              dbSettings[key] = false;
            } else {
              dbSettings[key] = row.value;
            }
          }
        }

        // Merge with defaults (defaults fill any missing keys)
        setSettings({ ...getAllDefaults(), ...dbSettings });
      } else {
        // No data, use defaults
        setSettings(getAllDefaults());
      }
    } catch (err) {
      console.error('Unexpected error fetching settings:', err);
      setError('Failed to load settings');
      setSettings(getAllDefaults());
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a single setting
  const updateSetting = useCallback(async (key: SettingKey, value: string | boolean) => {
    try {
      setSaving(true);
      
      const stringValue = typeof value === 'boolean' ? String(value) : value;

      const { error: updateError } = await supabase
        .from('system_settings')
        .update({ value: stringValue, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (updateError) {
        console.error('Error updating setting:', updateError);
        toast({
          title: 'Error',
          description: `Failed to update ${SYSTEM_SETTINGS[key].label}`,
          variant: 'destructive',
        });
        return false;
      }

      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: 'Saved',
        description: `${SYSTEM_SETTINGS[key].label} updated successfully`,
      });
      
      return true;
    } catch (err) {
      console.error('Unexpected error updating setting:', err);
      toast({
        title: 'Error',
        description: 'Failed to save setting',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    saving,
    error,
    updateSetting,
    refetch: fetchSettings,
  };
}
