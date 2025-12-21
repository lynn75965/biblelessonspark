/**
 * ParableGenerator.tsx
 * Phase 17.6: Modern Parable Generator UI Component
 * 
 * DUAL CONTEXT ARCHITECTURE:
 * 
 * 1. LESSONSPARK CONTEXT
 *    - Inherits settings from lesson (passage, theology, age group, Bible version)
 *    - Shows collapsed summary with "Customize" toggle
 *    - Uses LESSONSPARK_DIRECTIVE for teaching parables
 *    - User can override via explicit checkbox
 * 
 * 2. STANDALONE CONTEXT  
 *    - All settings visible and user-controlled
 *    - Uses teacher_preferences if authenticated
 *    - Uses STANDALONE_DIRECTIVE for contemplative parables
 *    - Anonymous users see all dropdowns with defaults
 * 
 * SSOT COMPLIANCE:
 * - All configuration from frontend constants
 * - Edge Function receives complete resolved objects
 * - No backend config lookups
 * 
 * @version 2.0.0
 * @lastUpdated 2025-12-21
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BookOpen, Sparkles, Newspaper, Copy, Check, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// SSOT Imports
import { 
  getTheologyProfile, 
  getDefaultTheologyProfile,
  generateTheologicalGuardrails,
  getTheologyProfileOptions,
} from '@/constants/theologyProfiles';

import { 
  getBibleVersion, 
  getDefaultBibleVersion,
  generateCopyrightGuardrails,
  getBibleVersionOptions,
} from '@/constants/bibleVersions';

import {
  getAgeGroupById,
  getDefaultAgeGroup,
  AGE_GROUPS,
} from '@/constants/ageGroups';

import {
  AUDIENCE_LENSES,
  MODERN_SETTINGS,
  WORD_COUNT_TARGETS,
  getAudienceLensById,
  getModernSettingById,
  getWordCountTargetById,
  getDefaultWordCountTarget,
} from '@/constants/parableConfig';

import {
  getParableDirective,
  type ParableContext,
} from '@/constants/parableDirectives';

// ============================================================================
// TYPES
// ============================================================================

interface LessonSettings {
  lessonId: string;
  lessonTitle: string;
  passage: string;
  theologyProfile: string;
  ageGroup: string;
  bibleVersion: string;
}

interface TeacherPreferences {
  theology_profile?: string;
  bible_version?: string;
  age_group?: string;
}

interface ResolvedTheologyProfile {
  id: string;
  name: string;
  guardrails: string;
  description: string;
}

interface ResolvedBibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  copyrightStatus: 'public_domain' | 'copyrighted';
  copyrightGuardrails: string;
}

interface ResolvedAudienceLens {
  id: string;
  name: string;
  description: string;
  heartCondition: string;
}

interface ResolvedModernSetting {
  id: string;
  name: string;
  description: string;
  exampleRoles: string[];
}

interface ResolvedWordCountTarget {
  id: string;
  name: string;
  wordRange: { min: number; max: number };
}

interface ResolvedAgeGroup {
  id: string;
  name: string;
  vocabularyLevel: string;
  conceptualDepth: string;
}

interface ResolvedParableDirective {
  id: ParableContext;
  name: string;
  systemInstruction: string;
}

interface ParableRequest {
  bible_passage?: string;
  focus_point?: string;
  parable_directive: ResolvedParableDirective;
  theology_profile: ResolvedTheologyProfile;
  bible_version: ResolvedBibleVersion;
  audience_lens: ResolvedAudienceLens;
  modern_setting: ResolvedModernSetting;
  word_count_target: ResolvedWordCountTarget;
  age_group: ResolvedAgeGroup;
  lesson_id?: string;
}

interface GeneratedParable {
  id: string;
  parable_text: string;
  bible_passage: string;
  news_headline: string;
  news_source: string;
  news_url: string;
  news_date: string | null;
  news_location: string | null;
  word_count: number;
  generation_time_ms: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNewsDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ParableGeneratorProps {
  /** Context determines directive and UI mode */
  context: ParableContext;
  /** Lesson settings when coming from LessonSparkUSA */
  lessonSettings?: LessonSettings;
  /** Callback when parable is generated */
  onParableGenerated?: (parable: GeneratedParable) => void;
}

export function ParableGenerator({ 
  context,
  lessonSettings,
  onParableGenerated 
}: ParableGeneratorProps) {
  const { toast } = useToast();
  const isLessonSparkContext = context === 'lessonspark' && !!lessonSettings;
  
  // =========================================================================
  // STATE
  // =========================================================================
  
  // Form state - passage and focus
  const [biblePassage, setBiblePassage] = useState(lessonSettings?.passage || '');
  const [focusPoint, setFocusPoint] = useState('');
  
  // Parable-specific settings (user can always adjust these)
  const [audienceLensId, setAudienceLensId] = useState('general');
  const [modernSettingId, setModernSettingId] = useState('family');
  const [wordCountTargetId, setWordCountTargetId] = useState('standard');
  
  // Override settings (for LessonSpark context)
  const [customizeSettings, setCustomizeSettings] = useState(false);
  const [overrideTheologyId, setOverrideTheologyId] = useState(lessonSettings?.theologyProfile || '');
  const [overrideAgeGroupId, setOverrideAgeGroupId] = useState(lessonSettings?.ageGroup || '');
  const [overrideBibleVersionId, setOverrideBibleVersionId] = useState(lessonSettings?.bibleVersion || '');
  
  // Standalone settings (when no lesson context)
  const [standaloneTheologyId, setStandaloneTheologyId] = useState('');
  const [standaloneAgeGroupId, setStandaloneAgeGroupId] = useState('');
  const [standaloneBibleVersionId, setStandaloneBibleVersionId] = useState('');
  
  // User preferences (from database - for standalone context)
  const [preferences, setPreferences] = useState<TeacherPreferences | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedParable, setGeneratedParable] = useState<GeneratedParable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // =========================================================================
  // LOAD USER PREFERENCES (for standalone context)
  // =========================================================================
  
  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Anonymous user - use defaults
          setIsAuthenticated(false);
          setStandaloneTheologyId(getDefaultTheologyProfile().id);
          setStandaloneAgeGroupId(getDefaultAgeGroup().id);
          setStandaloneBibleVersionId(getDefaultBibleVersion().id);
          setLoadingPreferences(false);
          return;
        }
        
        setIsAuthenticated(true);

        const { data, error } = await supabase
          .from('teacher_preferences')
          .select('theology_profile, bible_version, age_group')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading preferences:', error);
        }

        const prefs = data || {};
        setPreferences(prefs);
        
        // Set standalone defaults from preferences
        setStandaloneTheologyId(prefs.theology_profile || getDefaultTheologyProfile().id);
        setStandaloneAgeGroupId(prefs.age_group || getDefaultAgeGroup().id);
        setStandaloneBibleVersionId(prefs.bible_version || getDefaultBibleVersion().id);
        
      } catch (err) {
        console.error('Error loading preferences:', err);
        // Fall back to defaults
        setStandaloneTheologyId(getDefaultTheologyProfile().id);
        setStandaloneAgeGroupId(getDefaultAgeGroup().id);
        setStandaloneBibleVersionId(getDefaultBibleVersion().id);
      } finally {
        setLoadingPreferences(false);
      }
    }

    loadPreferences();
  }, []);

  // =========================================================================
  // RESOLVE SSOT DATA
  // =========================================================================

  function getEffectiveTheologyId(): string {
    if (isLessonSparkContext) {
      return customizeSettings ? overrideTheologyId : (lessonSettings?.theologyProfile || getDefaultTheologyProfile().id);
    }
    return standaloneTheologyId || getDefaultTheologyProfile().id;
  }

  function getEffectiveAgeGroupId(): string {
    if (isLessonSparkContext) {
      return customizeSettings ? overrideAgeGroupId : (lessonSettings?.ageGroup || getDefaultAgeGroup().id);
    }
    return standaloneAgeGroupId || getDefaultAgeGroup().id;
  }

  function getEffectiveBibleVersionId(): string {
    if (isLessonSparkContext) {
      return customizeSettings ? overrideBibleVersionId : (lessonSettings?.bibleVersion || getDefaultBibleVersion().id);
    }
    return standaloneBibleVersionId || getDefaultBibleVersion().id;
  }

  function resolveTheologyProfile(): ResolvedTheologyProfile {
    const profileId = getEffectiveTheologyId();
    const profile = getTheologyProfile(profileId) || getDefaultTheologyProfile();
    
    return {
      id: profile.id,
      name: profile.name,
      guardrails: generateTheologicalGuardrails(profile.id),
      description: profile.summary,
    };
  }

  function resolveBibleVersion(): ResolvedBibleVersion {
    const versionId = getEffectiveBibleVersionId();
    const version = getBibleVersion(versionId) || getDefaultBibleVersion();
    
    return {
      id: version.id,
      name: version.name,
      abbreviation: version.abbreviation,
      copyrightStatus: version.copyrightStatus,
      copyrightGuardrails: generateCopyrightGuardrails(version.id),
    };
  }

  function resolveAgeGroup(): ResolvedAgeGroup {
    const ageGroupId = getEffectiveAgeGroupId();
    const ageGroup = getAgeGroupById(ageGroupId) || getDefaultAgeGroup();
    
    return {
      id: ageGroup.id,
      name: ageGroup.label,
      vocabularyLevel: ageGroup.teachingProfile?.vocabularyLevel || 'moderate',
      conceptualDepth: ageGroup.teachingProfile?.abstractThinking || 'developing',
    };
  }

  function resolveParableDirective(): ResolvedParableDirective {
    const directive = getParableDirective(context);
    return {
      id: directive.id,
      name: directive.name,
      systemInstruction: directive.systemInstruction,
    };
  }

  function resolveAudienceLens(): ResolvedAudienceLens {
    const lens = getAudienceLensById(audienceLensId);
    if (!lens) {
      const defaultLens = AUDIENCE_LENSES.find(l => l.id === 'general') || AUDIENCE_LENSES[0];
      return {
        id: defaultLens.id,
        name: defaultLens.name,
        description: defaultLens.description,
        heartCondition: defaultLens.heartCondition,
      };
    }
    return {
      id: lens.id,
      name: lens.name,
      description: lens.description,
      heartCondition: lens.heartCondition,
    };
  }

  function resolveModernSetting(): ResolvedModernSetting {
    const setting = getModernSettingById(modernSettingId);
    if (!setting) {
      const defaultSetting = MODERN_SETTINGS[0];
      return {
        id: defaultSetting.id,
        name: defaultSetting.name,
        description: defaultSetting.description,
        exampleRoles: [...defaultSetting.exampleRoles],
      };
    }
    return {
      id: setting.id,
      name: setting.name,
      description: setting.description,
      exampleRoles: [...setting.exampleRoles],
    };
  }

  function resolveWordCountTarget(): ResolvedWordCountTarget {
    const target = getWordCountTargetById(wordCountTargetId) || getDefaultWordCountTarget();
    return {
      id: target.id,
      name: target.name,
      wordRange: { ...target.wordRange },
    };
  }

  // =========================================================================
  // GET DISPLAY NAMES FOR SUMMARY
  // =========================================================================

  function getTheologyDisplayName(id: string): string {
    const profile = getTheologyProfile(id);
    return profile?.name || id;
  }

  function getAgeGroupDisplayName(id: string): string {
    const ageGroup = getAgeGroupById(id);
    return ageGroup?.label || id;
  }

  function getBibleVersionDisplayName(id: string): string {
    const version = getBibleVersion(id);
    return version?.abbreviation || id;
  }

  // =========================================================================
  // GENERATE PARABLE
  // =========================================================================

  async function handleGenerate() {
    // Validation: need either passage or focus point
    if (!biblePassage.trim() && !focusPoint.trim()) {
      setError('Please enter a Bible passage or a focus point (or both)');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedParable(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to generate parables');
      }

      // Build SSOT-compliant request
      const request: ParableRequest = {
        bible_passage: biblePassage.trim() || undefined,
        focus_point: focusPoint.trim() || undefined,
        parable_directive: resolveParableDirective(),
        theology_profile: resolveTheologyProfile(),
        bible_version: resolveBibleVersion(),
        audience_lens: resolveAudienceLens(),
        modern_setting: resolveModernSetting(),
        word_count_target: resolveWordCountTarget(),
        age_group: resolveAgeGroup(),
        lesson_id: lessonSettings?.lessonId,
      };

      console.log('Sending SSOT-compliant parable request:', {
        context: context,
        bible_passage: request.bible_passage,
        parable_directive: request.parable_directive.id,
        theology_profile: request.theology_profile.name,
        bible_version: request.bible_version.abbreviation,
        age_group: request.age_group.name,
      });

      const { data, error: fnError } = await supabase.functions.invoke('generate-parable', {
        body: request,
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate parable');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate parable');
      }

      setGeneratedParable(data.parable);
      
      toast({
        title: 'Parable Generated!',
        description: `${data.parable.word_count} words in ${(data.parable.generation_time_ms / 1000).toFixed(1)}s`,
      });

      if (onParableGenerated) {
        onParableGenerated(data.parable);
      }

    } catch (err) {
      console.error('Generation error:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Generation Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // =========================================================================
  // COPY TO CLIPBOARD
  // =========================================================================

  async function handleCopy() {
    if (!generatedParable) return;
    
    try {
      await navigator.clipboard.writeText(generatedParable.parable_text);
      setCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ 
        title: 'Copy failed', 
        description: 'Please select and copy manually',
        variant: 'destructive' 
      });
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loadingPreferences) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {isLessonSparkContext ? 'Generate Parable for Lesson' : 'Create Modern Parable'}
          </CardTitle>
          <CardDescription>
            {isLessonSparkContext 
              ? `Creating a teaching parable for "${lessonSettings?.lessonTitle}"`
              : 'Create a contemplative parable for personal reflection'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* ============================================================= */}
          {/* LESSONSPARK CONTEXT: Lesson Info + Inherited Settings */}
          {/* ============================================================= */}
          {isLessonSparkContext && (
            <>
              {/* Lesson Context Banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">From Lesson Library</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lessonSettings?.passage && (
                        <>Bible Passage: <span className="font-medium">{lessonSettings.passage}</span></>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inherited Settings Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Using Lesson Settings:</span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-background px-2 py-1 rounded border">
                    {getAgeGroupDisplayName(lessonSettings?.ageGroup || '')}
                  </span>
                  <span className="bg-background px-2 py-1 rounded border">
                    {getTheologyDisplayName(lessonSettings?.theologyProfile || '')}
                  </span>
                  <span className="bg-background px-2 py-1 rounded border">
                    {getBibleVersionDisplayName(lessonSettings?.bibleVersion || '')}
                  </span>
                </div>
                
                {/* Customize Toggle */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Checkbox 
                    id="customize" 
                    checked={customizeSettings}
                    onCheckedChange={(checked) => setCustomizeSettings(checked === true)}
                  />
                  <label htmlFor="customize" className="text-sm cursor-pointer flex items-center gap-1">
                    <Settings2 className="h-3.5 w-3.5" />
                    Customize settings for this parable
                  </label>
                </div>
              </div>

              {/* Override Settings (shown when customizing) */}
              {customizeSettings && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-dashed rounded-lg">
                  <div className="space-y-2">
                    <Label>Age Group</Label>
                    <Select value={overrideAgeGroupId} onValueChange={setOverrideAgeGroupId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_GROUPS.map((ag) => (
                          <SelectItem key={ag.id} value={ag.id}>
                            {ag.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Theology Profile</Label>
                    <Select value={overrideTheologyId} onValueChange={setOverrideTheologyId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getTheologyProfileOptions().map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bible Version</Label>
                    <Select value={overrideBibleVersionId} onValueChange={setOverrideBibleVersionId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getBibleVersionOptions().map((version) => (
                          <SelectItem key={version.id} value={version.id}>
                            {version.name} ({version.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============================================================= */}
          {/* STANDALONE CONTEXT: Full Settings */}
          {/* ============================================================= */}
          {!isLessonSparkContext && (
            <>
              {/* Bible Passage */}
              <div className="space-y-2">
                <Label htmlFor="passage" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Bible Passage (optional)
                </Label>
                <Textarea
                  id="passage"
                  placeholder="e.g., Luke 15:11-32 (The Prodigal Son)"
                  value={biblePassage}
                  onChange={(e) => setBiblePassage(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              {/* Your Settings Header */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Your Settings
                  {preferences && (
                    <span className="text-xs text-muted-foreground font-normal">
                      (from your preferences)
                    </span>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Age Group</Label>
                    <Select value={standaloneAgeGroupId} onValueChange={setStandaloneAgeGroupId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_GROUPS.map((ag) => (
                          <SelectItem key={ag.id} value={ag.id}>
                            {ag.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Theology Profile</Label>
                    <Select value={standaloneTheologyId} onValueChange={setStandaloneTheologyId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getTheologyProfileOptions().map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bible Version</Label>
                    <Select value={standaloneBibleVersionId} onValueChange={setStandaloneBibleVersionId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getBibleVersionOptions().map((version) => (
                          <SelectItem key={version.id} value={version.id}>
                            {version.name} ({version.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================= */}
          {/* COMMON: Focus Point + Parable Settings */}
          {/* ============================================================= */}
          
          {/* Focus Point */}
          <div className="space-y-2">
            <Label htmlFor="focus">
              Focus Point {isLessonSparkContext ? '(optional)' : '(optional - or use instead of passage)'}
            </Label>
            <Textarea
              id="focus"
              placeholder="e.g., The father's unconditional love and forgiveness"
              value={focusPoint}
              onChange={(e) => setFocusPoint(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Parable-Specific Settings */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-4">Parable Style</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Audience Lens</Label>
                <Select value={audienceLensId} onValueChange={setAudienceLensId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_LENSES.map((lens) => (
                      <SelectItem key={lens.id} value={lens.id}>
                        {lens.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modern Setting</Label>
                <Select value={modernSettingId} onValueChange={setModernSettingId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODERN_SETTINGS.map((setting) => (
                      <SelectItem key={setting.id} value={setting.id}>
                        {setting.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Length</Label>
                <Select value={wordCountTargetId} onValueChange={setWordCountTargetId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORD_COUNT_TARGETS.map((target) => (
                      <SelectItem key={target.id} value={target.id}>
                        {target.name} ({target.wordRange.min}-{target.wordRange.max} words)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || (!biblePassage.trim() && !focusPoint.trim())}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Parable...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate {isLessonSparkContext ? 'Teaching' : 'Modern'} Parable
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Parable Display */}
      {generatedParable && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Modern Parable</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <CardDescription className="flex items-center gap-4 text-xs">
              <span>{generatedParable.word_count} words</span>
              <span>•</span>
              <span>{(generatedParable.generation_time_ms / 1000).toFixed(1)}s</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {generatedParable.parable_text}
            </div>
            
            {/* Attribution Box */}
            {generatedParable.news_source !== 'generated' && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Newspaper className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Real-World Inspiration
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      This parable was inspired by a true story
                      {generatedParable.news_date && (
                        <> reported on <span className="font-medium">{formatNewsDate(generatedParable.news_date)}</span></>
                      )}
                      {generatedParable.news_location && (
                        <> from <span className="font-medium">{generatedParable.news_location}</span></>
                      )}
                      .
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      <span className="font-medium">Source:</span> {generatedParable.news_source}
                      {generatedParable.news_headline && (
                        <> — "{generatedParable.news_headline.slice(0, 80)}{generatedParable.news_headline.length > 80 ? '...' : ''}"</>
                      )}
                    </p>
                    {generatedParable.news_url && (
                      <a 
                        href={generatedParable.news_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 underline"
                      >
                        View original article →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ParableGenerator;
