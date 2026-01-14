// ============================================================================
// WorkspaceSettingsPanel.tsx
// ============================================================================
// Comprehensive user settings panel for workspace
// Sections: Lesson Defaults, Teaching Context, Language, Export, Notifications, Account
//
// SSOT CONSISTENCY: Dropdowns match EnhanceLessonForm.tsx exactly
// - Age Group: label in dropdown, description after selection
// - Theology Profile: name in dropdown, summary after selection  
// - Bible Version: name (abbrev) + usageHint, description after selection
// ============================================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Clock, 
  Download, 
  Bell, 
  User, 
  Users,
  Save,
  Loader2,
  Check,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AGE_GROUPS, getAgeGroupById } from '@/constants/ageGroups';
import { getBibleVersionOptions, getBibleVersion } from '@/constants/bibleVersions';
import { getTheologyProfileOptions, getTheologyProfile } from '@/constants/theologyProfiles';
import LanguageSelector from '@/components/settings/LanguageSelector';

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
  full_name: string;
  email: string;
  preferred_age_group: string;
  preferred_language: string;
  theology_profile_id: string;
  default_bible_version: string;
  default_lesson_duration: number;
  default_export_format: string;
  include_student_handouts: boolean;
  email_notifications: boolean;
  teaching_environment: string;
  typical_class_size: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  full_name: '',
  email: '',
  preferred_age_group: '',
  preferred_language: 'en',
  theology_profile_id: 'baptist-core-beliefs',
  default_bible_version: 'nasb',
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
          full_name,
          email,
          preferred_age_group,
          preferred_language,
          theology_profile_id,
          default_bible_version,
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
        full_name: data?.full_name || user.user_metadata?.full_name || '',
        email: data?.email || user.email || '',
        preferred_age_group: data?.preferred_age_group || DEFAULT_SETTINGS.preferred_age_group,
        preferred_language: data?.preferred_language || DEFAULT_SETTINGS.preferred_language,
        theology_profile_id: data?.theology_profile_id || DEFAULT_SETTINGS.theology_profile_id,
        default_bible_version: data?.default_bible_version || DEFAULT_SETTINGS.default_bible_version,
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
    if (!user) {
      console.error('SAVE BLOCKED: No user');
      return;
    }
    
    setSaving(true);
    console.log('========== SETTINGS SAVE START ==========');
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    
    try {
      // STEP 1: Test with ONLY full_name to verify RLS works
      console.log('STEP 1: Testing basic update with full_name only...');
      
      const testPayload = {
        full_name: settings.full_name.trim(),
      };
      console.log('Test payload:', testPayload);
      
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .update(testPayload)
        .eq('id', user.id)
        .select();
      
      if (testError) {
        console.error('STEP 1 FAILED - Basic update error:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code,
          full: testError
        });
        throw new Error(`Basic update failed: ${testError.message}`);
      }
      
      console.log('STEP 1 SUCCESS - Basic update worked:', testData);
      
      // STEP 2: Now try the full update
      console.log('STEP 2: Attempting full settings update...');
      
      const fullPayload = {
        full_name: settings.full_name.trim(),
        preferred_age_group: settings.preferred_age_group || null,
        theology_profile_id: settings.theology_profile_id || null,
        default_bible_version: settings.default_bible_version,
        default_lesson_duration: Number(settings.default_lesson_duration),
        default_export_format: settings.default_export_format,
        include_student_handouts: Boolean(settings.include_student_handouts),
        email_notifications: Boolean(settings.email_notifications),
        teaching_environment: settings.teaching_environment,
        typical_class_size: settings.typical_class_size,
      };
      
      console.log('Full payload:', JSON.stringify(fullPayload, null, 2));
      
      const { data, error } = await supabase
        .from('profiles')
        .update(fullPayload)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('STEP 2 FAILED - Full update error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: error
        });
        throw new Error(`Full update failed: ${error.message}`);
      }
      
      console.log('STEP 2 SUCCESS - Full update worked:', data);
      console.log('========== SETTINGS SAVE COMPLETE ==========');

      setOriginalSettings(settings);
      setHasChanges(false);
      
      toast({
        title: 'Settings Saved',
        description: SETTINGS_CONFIG.ui.savedMessage,
      });
    } catch (error: any) {
      console.error('========== SETTINGS SAVE FAILED ==========');
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
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
            {/* Description shown after selection - matches EnhanceLessonForm */}
            {settings.preferred_age_group && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 p-2 bg-muted/50 rounded-md">
                {getAgeGroupById(settings.preferred_age_group)?.description}
              </p>
            )}
          </div>

          {/* Theology Profile - MATCHES EnhanceLessonForm exactly */}
          <div className="space-y-2">
            <Label>Theological Lens</Label>
            <Select
              value={settings.theology_profile_id}
              onValueChange={(value) => updateSetting('theology_profile_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theological tradition" />
              </SelectTrigger>
              <SelectContent>
                {getTheologyProfileOptions().map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Summary shown after selection - matches EnhanceLessonForm */}
            {settings.theology_profile_id && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 p-2 bg-muted/50 rounded-md">
                {getTheologyProfile(settings.theology_profile_id)?.summary}
              </p>
            )}
          </div>

          {/* Bible Version - MATCHES EnhanceLessonForm exactly */}
          <div className="space-y-2">
            <Label>Default Bible Version</Label>
            <Select
              value={settings.default_bible_version}
              onValueChange={(value) => updateSetting('default_bible_version', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Bible version" />
              </SelectTrigger>
              <SelectContent>
                {getBibleVersionOptions().map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    <div className="flex items-center gap-2">
                      <span>{version.name} ({version.abbreviation})</span>
                      <span className="text-xs text-primary">{version.usageHint}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Description shown after selection - matches EnhanceLessonForm */}
            {settings.default_bible_version && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 p-2 bg-muted/50 rounded-md">
                {getBibleVersion(settings.default_bible_version)?.description}
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
          LANGUAGE PREFERENCES
          ================================================================ */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Language Preferences
          </CardTitle>
          <CardDescription>
            Choose your preferred language for lesson plans and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSelector />
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
            Control how and when you receive updates from LessonSpark
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
          ACCOUNT
          ================================================================ */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account
          </CardTitle>
          <CardDescription>
            Manage your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={settings.full_name}
              onChange={(e) => updateSetting('full_name', e.target.value)}
              placeholder="Enter your full name"
              maxLength={100}
            />
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={settings.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Workspace Badge */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm">Workspace</span>
            <Badge variant="outline">Personal</Badge>
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
