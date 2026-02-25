/**
 * ParableGenerator.tsx
 * Phase 17.4: Modern Parable Generator UI Component
 * 
 * SSOT ARCHITECTURE:
 * - Fetches user's teacher_preferences from database
 * - Resolves all IDs to full objects from SSOT constants
 * - Sends complete, resolved data to Edge Function
 * - Edge Function uses what it receives (no config lookups)
 * 
 * @version 1.0.0
 * @created 2025-12-21
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BookOpen, Sparkles, Newspaper, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// SSOT Imports
import { 
  getTheologyProfile, 
  getDefaultTheologyProfile,
  generateTheologicalGuardrails,
  type TheologyProfile 
} from '@/constants/theologyProfiles';

import { 
  getBibleVersion, 
  getDefaultBibleVersion,
  generateCopyrightGuardrails,
  type BibleVersion 
} from '@/constants/bibleVersions';

import {
  getAgeGroupById,
  getDefaultAgeGroup,
  type AgeGroup
} from '@/constants/ageGroups';

import {
  AUDIENCE_LENSES,
  MODERN_SETTINGS,
  WORD_COUNT_TARGETS,
  getAudienceLensById,
  getModernSettingById,
  getWordCountTargetById,
  getDefaultWordCountTarget,
  type AudienceLens,
  type ModernSetting,
  type WordCountTarget
} from '@/constants/parableConfig';

// =============================================================================
// TYPES
// =============================================================================

interface ParableTeacherPrefs {
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

interface ParableRequest {
  bible_passage: string;
  theology_profile: ResolvedTheologyProfile;
  bible_version: ResolvedBibleVersion;
  audience_lens: ResolvedAudienceLens;
  modern_setting: ResolvedModernSetting;
  word_count_target: ResolvedWordCountTarget;
  age_group: ResolvedAgeGroup;
  focus_point?: string;
  lesson_id?: string;
}

interface GeneratedParable {
  id: string;
  parable_text: string;
  bible_passage: string;
  news_headline: string;
  news_source: string;
  news_url: string;
  word_count: number;
  generation_time_ms: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

interface ParableGeneratorProps {
  lessonId?: string;
  initialPassage?: string;
  onParableGenerated?: (parable: GeneratedParable) => void;
}

export function ParableGenerator({ 
  lessonId, 
  initialPassage = '', 
  onParableGenerated 
}: ParableGeneratorProps) {
  const { toast } = useToast();
  
  // Form state
  const [biblePassage, setBiblePassage] = useState(initialPassage);
  const [focusPoint, setFocusPoint] = useState('');
  const [audienceLensId, setAudienceLensId] = useState('general');
  const [modernSettingId, setModernSettingId] = useState('workplace');
  const [wordCountTargetId, setWordCountTargetId] = useState('standard');
  
  // User preferences (from database)
  const [preferences, setPreferences] = useState<ParableTeacherPrefs | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedParable, setGeneratedParable] = useState<GeneratedParable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ==========================================================================
  // LOAD USER PREFERENCES
  // ==========================================================================
  
  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingPreferences(false);
          return;
        }

        const { data, error } = await supabase
          .from('teacher_preferences')
          .select('theology_profile, bible_version, age_group')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading preferences:', error);
        }

        setPreferences(data || {});
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setLoadingPreferences(false);
      }
    }

    loadPreferences();
  }, []);

  // ==========================================================================
  // RESOLVE SSOT DATA
  // ==========================================================================

  /**
   * Resolve theology profile from SSOT constants
   */
  function resolveTheologyProfile(): ResolvedTheologyProfile {
    const profileId = preferences?.theology_profile || getDefaultTheologyProfile().id;
    const profile = getTheologyProfile(profileId) || getDefaultTheologyProfile();
    
    return {
      id: profile.id,
      name: profile.name,
      guardrails: generateTheologicalGuardrails(profile.id),
      description: profile.summary,
    };
  }

  /**
   * Resolve Bible version from SSOT constants
   */
  function resolveBibleVersion(): ResolvedBibleVersion {
    const versionId = preferences?.bible_version || getDefaultBibleVersion().id;
    const version = getBibleVersion(versionId) || getDefaultBibleVersion();
    
    return {
      id: version.id,
      name: version.name,
      abbreviation: version.abbreviation,
      copyrightStatus: version.copyrightStatus,
      copyrightGuardrails: generateCopyrightGuardrails(version.id),
    };
  }

  /**
   * Resolve age group from SSOT constants
   */
  function resolveAgeGroup(): ResolvedAgeGroup {
    const ageGroupId = preferences?.age_group || getDefaultAgeGroup().id;
    const ageGroup = getAgeGroupById(ageGroupId) || getDefaultAgeGroup();
    
    return {
      id: ageGroup.id,
      name: ageGroup.label, // Note: ageGroups uses 'label' not 'name'
      vocabularyLevel: ageGroup.teachingProfile.vocabularyLevel || 'moderate',
      conceptualDepth: ageGroup.teachingProfile.abstractThinking || 'developing',
    };
  }

  /**
   * Resolve audience lens from SSOT constants
   */
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

  /**
   * Resolve modern setting from SSOT constants
   */
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

  /**
   * Resolve word count target from SSOT constants
   */
  function resolveWordCountTarget(): ResolvedWordCountTarget {
    const target = getWordCountTargetById(wordCountTargetId) || getDefaultWordCountTarget();
    return {
      id: target.id,
      name: target.name,
      wordRange: { ...target.wordRange },
    };
  }

  // ==========================================================================
  // GENERATE PARABLE
  // ==========================================================================

  async function handleGenerate() {
    if (!biblePassage.trim()) {
      setError('Please enter a Bible passage');
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

      // Build SSOT-compliant request with RESOLVED objects
      const request: ParableRequest = {
        bible_passage: biblePassage.trim(),
        focus_point: focusPoint.trim() || undefined,
        theology_profile: resolveTheologyProfile(),
        bible_version: resolveBibleVersion(),
        audience_lens: resolveAudienceLens(),
        modern_setting: resolveModernSetting(),
        word_count_target: resolveWordCountTarget(),
        age_group: resolveAgeGroup(),
        lesson_id: lessonId,
      };


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

  // ==========================================================================
  // COPY TO CLIPBOARD
  // ==========================================================================

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

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loadingPreferences) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading preferences...</span>
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
            Modern Parable Generator
          </CardTitle>
          <CardDescription>
            Create contemporary parables in the style of Jesus' teaching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bible Passage */}
          <div className="space-y-2">
            <Label htmlFor="passage" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Bible Passage *
            </Label>
            <Textarea
              id="passage"
              placeholder="e.g., Luke 15:11-32 (The Prodigal Son)"
              value={biblePassage}
              onChange={(e) => setBiblePassage(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Focus Point */}
          <div className="space-y-2">
            <Label htmlFor="focus">Focus Point (Optional)</Label>
            <Textarea
              id="focus"
              placeholder="e.g., The father's unconditional love and forgiveness"
              value={focusPoint}
              onChange={(e) => setFocusPoint(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Selects Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Audience Lens */}
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

            {/* Modern Setting */}
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

            {/* Word Count */}
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

          {/* User Profile Info */}
          {preferences && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <strong>Using your preferences:</strong>{' '}
              {resolveTheologyProfile().name} * {resolveBibleVersion().abbreviation} * {resolveAgeGroup().name}
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !biblePassage.trim()}
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
                Generate Modern Parable
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Parable */}
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
              <span>*</span>
              <span>{(generatedParable.generation_time_ms / 1000).toFixed(1)}s</span>
              {generatedParable.news_source !== 'generated' && (
                <>
                  <span>*</span>
                  <span className="flex items-center gap-1">
                    <Newspaper className="h-3 w-3" />
                    Inspired by: {generatedParable.news_headline.slice(0, 50)}...
                  </span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {generatedParable.parable_text}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ParableGenerator;
