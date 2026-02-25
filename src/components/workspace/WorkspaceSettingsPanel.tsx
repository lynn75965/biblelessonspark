// ============================================================================
// WorkspaceSettingsPanel.tsx
// ============================================================================
// Lesson and teaching settings panel for workspace Settings tab.
//
// PROFILE FIELDS (Bible Version, Theology Profile, Language, Name, Email)
// are in UserProfileModal.tsx -- NOT here.
//
// This panel covers: Lesson Defaults, Teaching Context, Export, Notifications
//
// SSOT CONSISTENCY: Dropdowns match EnhanceLessonForm.tsx exactly
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen,
  Clock,
  Download,
  Bell,
  Users,
  Save,
  Loader2,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AGE_GROUPS, getAgeGroupById } from '@/constants/ageGroups';

// ============================================================================
// SSOT: Settings Configuration
// ============================================================================
const SETTINGS_CONFIG = {
  lessonDurations: [
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes (1 hour)' },
    { value: '90', label: '90 minutes (1.5 hours)' },
  ],

  exportFormats: [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'docx', label: 'Word Document (.docx)' },
    { value: 'print', label: 'Print-Ready' },
  ],

  teachingEnvironments: [
    { value: 'classroom', label: 'Traditional Classroom' },
    { value: 'home', label: 'Home/Small Group' },
    { value: 'online', label: 'Online/Virtual' },
    { value: 'hybrid', label: 'Hybrid (In-person + Online)' },
  ],

  classSizes: [
    { value: 'small', label: 'Small (1-5 students)' },
    { value: 'medium', label: 'Medium (6-15 students)' },
    { value: 'large', label: 'Large (16+ students)' },
  ],

  ui: {
    saveButton: 'Save Changes',
    savingButton: 'Saving...',
    savedMessage: 'Settings saved successfully',
    errorMessage: 'Failed to save settings. Please try again.',
  },
};

// ============================================================================
// Types
// ============================================================================
interface UserSettings {
  preferred_age_group: string;
  default_lesson_duration: number;
  default_export_format: string;
  include_student_handouts: boolean;
  email_notifications: boolean;
  teaching_environment: string;
  typical_class_size: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  preferred_age_group: '',
  default_lesson_duration: 45,
  default_export_format: 'pdf',
  include_student_handouts: true,
  email_notifications: true,
  teaching_environment: 'classroom',
  typical_class_size: 'medium',
};

// ============================================================================
// Component
// ============================================================================
export function WorkspaceSettingsPanel() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // --------------------------------------------------------------------------
  // Load settings on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  // --------------------------------------------------------------------------
  // Track changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // --------------------------------------------------------------------------
  // Load user settings from database
  // --------------------------------------------------------------------------
  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          preferred_age_group,
          default_lesson_duration,
          default_export_format,
          include_student_handouts,
          email_notifications,
          teaching_environment,
          typical_class_size
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const loadedSettings: UserSettings = {
        preferred_age_group: data?.preferred_age_group || DEFAULT_SETTINGS.preferred_age_group,
        default_lesson_duration: data?.default_lesson_duration || DEFAULT_SETTINGS.default_lesson_duration,
        default_export_format: data?.default_export_format || DEFAULT_SETTINGS.default_export_format,
        include_student_handouts: data?.include_student_handouts ?? DEFAULT_SETTINGS.include_student_handouts,
        email_notifications: data?.email_notifications ?? DEFAULT_SETTINGS.email_notifications,
        teaching_environment: data?.teaching_environment || DEFAULT_SETTINGS.teaching_environment,
        typical_class_size: data?.typical_class_size || DEFAULT_SETTINGS.typical_class_size,
      };

      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Save settings to database
  // --------------------------------------------------------------------------
  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        preferred_age_group: settings.preferred_age_group || null,
        default_lesson_duration: Number(settings.default_lesson_duration),
        default_export_format: settings.default_export_format,
        include_student_handouts: Boolean(settings.include_student_handouts),
        email_notifications: Boolean(settings.email_notifications),
        teaching_environment: settings.teaching_environment,
        typical_class_size: settings.typical_class_size,
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      setOriginalSettings(settings);
      setHasChanges(false);

      toast({
        title: 'Settings Saved',
        description: SETTINGS_CONFIG.ui.savedMessage,
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error?.message || SETTINGS_CONFIG.ui.errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Update individual setting
  // --------------------------------------------------------------------------
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // --------------------------------------------------------------------------
  // Loading state
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Button - Fixed at top when changes exist */}
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-3 border-b">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">You have unsaved changes</p>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {SETTINGS_CONFIG.ui.savingButton}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {SETTINGS_CONFIG.ui.saveButton}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================
          LESSON DEFAULTS
          ================================================================ */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Lesson Defaults
          </CardTitle>
          <CardDescription>
            Set your default preferences for new lessons. These will pre-fill when you create a lesson.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Age Group - MATCHES EnhanceLessonForm exactly */}
          <div className="space-y-2">
            <Label>Default Age Group</Label>
            <Select
              value={settings.preferred_age_group}
              onValueChange={(value) => updateSetting('preferred_age_group', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUPS.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {settings.preferred_age_group && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 p-2 bg-muted/50 rounded-md">
                {getAgeGroupById(settings.preferred_age_group)?.description}
              </p>
            )}
          </div>

          {/* Lesson Duration */}
          <div className="space-y-2">
            <Label>Default Lesson Duration</Label>
            <Select
              value={settings.default_lesson_duration.toString()}
              onValueChange={(value) => updateSetting('default_lesson_duration', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {SETTINGS_CONFIG.lessonDurations.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Activities and pacing will be adjusted for this timeframe
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          TEACHING CONTEXT
          ================================================================ */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Teaching Context
          </CardTitle>
          <CardDescription>
            Help us understand your teaching environment for better activity suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teaching Environment */}
          <div className="space-y-2">
            <Label>Teaching Environment</Label>
            <Select
              value={settings.teaching_environment}
              onValueChange={(value) => updateSetting('teaching_environment', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {SETTINGS_CONFIG.teachingEnvironments.map((env) => (
                  <SelectItem key={env.value} value={env.value}>
                    {env.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Activity suggestions will be tailored to your setting
            </p>
          </div>

          {/* Class Size */}
          <div className="space-y-2">
            <Label>Typical Class Size</Label>
            <Select
              value={settings.typical_class_size}
              onValueChange={(value) => updateSetting('typical_class_size', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class size" />
              </SelectTrigger>
              <SelectContent>
                {SETTINGS_CONFIG.classSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Group activities will be scaled appropriately
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          EXPORT PREFERENCES
          ================================================================ */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Export Preferences
          </CardTitle>
          <CardDescription>
            Set your default export options when downloading or printing lessons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Default Export Format</Label>
            <Select
              value={settings.default_export_format}
              onValueChange={(value) => updateSetting('default_export_format', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {SETTINGS_CONFIG.exportFormats.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Handouts Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Include Student Handouts</Label>
              <p className="text-xs text-muted-foreground">
                Automatically include printable student materials
              </p>
            </div>
            <Switch
              checked={settings.include_student_handouts}
              onCheckedChange={(checked) => updateSetting('include_student_handouts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          NOTIFICATIONS
          ================================================================ */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Control how and when you receive updates from BibleLessonSpark
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive tips, updates, and new feature announcements
              </p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          BOTTOM SAVE BUTTON
          ================================================================ */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {SETTINGS_CONFIG.ui.savingButton}
            </>
          ) : hasChanges ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              {SETTINGS_CONFIG.ui.saveButton}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              All Changes Saved
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default WorkspaceSettingsPanel;
