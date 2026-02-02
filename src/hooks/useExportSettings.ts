/**
 * useExportSettings - Admin panel hook for export formatting settings
 *
 * SSOT: src/constants/exportSettingsConfig.ts
 * Storage: system_settings table, key = 'export_formatting', value = JSON
 *
 * Pattern: Batch-save (user edits multiple settings, then saves all at once)
 * Only non-default values are stored in the database to keep overrides clean.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getExportSettingDefaults,
  EXPORT_SETTINGS_DB_KEY,
} from "@/constants/exportSettingsConfig";

export type ExportSettingsValues = Record<string, string | number>;

export function useExportSettings() {
  const defaults = useMemo(() => getExportSettingDefaults(), []);
  const [values, setValues] = useState<ExportSettingsValues>(defaults);
  const [savedValues, setSavedValues] = useState<ExportSettingsValues>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Track whether user has unsaved changes
  const hasChanges = useMemo(() => {
    return Object.keys(values).some((key) => values[key] !== savedValues[key]);
  }, [values, savedValues]);

  // Count how many settings differ from defaults
  const customCount = useMemo(() => {
    return Object.keys(savedValues).filter(
      (key) => savedValues[key] !== defaults[key]
    ).length;
  }, [savedValues, defaults]);

  // Fetch settings from database
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", EXPORT_SETTINGS_DB_KEY)
        .maybeSingle();

      if (error) {
        console.error("Error fetching export settings:", error);
        setValues(defaults);
        setSavedValues(defaults);
        return;
      }

      if (data?.value) {
        try {
          const overrides = JSON.parse(data.value);
          // Ensure numeric values are actually numbers
          const parsed: ExportSettingsValues = {};
          for (const [key, val] of Object.entries(overrides)) {
            const defaultVal = defaults[key];
            if (typeof defaultVal === "number") {
              parsed[key] = Number(val);
            } else {
              parsed[key] = val as string;
            }
          }
          const merged = { ...defaults, ...parsed };
          setValues(merged);
          setSavedValues(merged);
        } catch {
          console.error("Failed to parse export settings JSON");
          setValues(defaults);
          setSavedValues(defaults);
        }
      } else {
        setValues(defaults);
        setSavedValues(defaults);
      }
    } catch (err) {
      console.error("Unexpected error fetching export settings:", err);
      setValues(defaults);
      setSavedValues(defaults);
    } finally {
      setLoading(false);
    }
  }, [defaults]);

  // Save current values to database
  const saveSettings = useCallback(async () => {
    try {
      setSaving(true);

      // Only persist values that differ from defaults
      const overrides: Record<string, string | number> = {};
      for (const [key, value] of Object.entries(values)) {
        if (value !== defaults[key]) {
          overrides[key] = value;
        }
      }

      const jsonValue = JSON.stringify(overrides);

      // Upsert: check if row exists, then update or insert
      const { data: existing } = await supabase
        .from("system_settings")
        .select("key")
        .eq("key", EXPORT_SETTINGS_DB_KEY)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from("system_settings")
          .update({
            value: jsonValue,
            updated_at: new Date().toISOString(),
          })
          .eq("key", EXPORT_SETTINGS_DB_KEY));
      } else {
        ({ error } = await supabase
          .from("system_settings")
          .insert({
            key: EXPORT_SETTINGS_DB_KEY,
            value: jsonValue,
          }));
      }

      if (error) {
        console.error("Error saving export settings:", error);
        toast({
          title: "Error",
          description: "Failed to save export settings.",
          variant: "destructive",
        });
        return false;
      }

      setSavedValues({ ...values });
      toast({
        title: "Saved",
        description: "Export formatting settings updated successfully.",
      });
      return true;
    } catch (err) {
      console.error("Unexpected error saving export settings:", err);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [values, defaults, toast]);

  // Update a single value (local state only, not saved yet)
  const updateValue = useCallback(
    (key: string, value: string | number) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Reset all values to defaults (local state only, still needs save)
  const resetToDefaults = useCallback(() => {
    setValues({ ...defaults });
  }, [defaults]);

  // Discard unsaved changes
  const discardChanges = useCallback(() => {
    setValues({ ...savedValues });
  }, [savedValues]);

  // Load on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    values,
    loading,
    saving,
    hasChanges,
    customCount,
    defaults,
    updateValue,
    saveSettings,
    resetToDefaults,
    discardChanges,
    refetch: fetchSettings,
  };
}
