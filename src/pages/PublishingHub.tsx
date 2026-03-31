// src/pages/PublishingHub.tsx
// Phase D Part 2: Publishing Hub -- lessons, devotionals, and series.
// SSOT: publishingHubConfig.ts for all UI strings and defaults.
// SSOT: seriesExportConfig.ts for fonts, color schemes, layouts.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSearchParams } from "react-router-dom";
import { Printer, Loader2, Maximize2, X, Search, Share2, Link2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { exportToPdf } from "@/utils/exportToPdf";
import { exportToDocx } from "@/utils/exportToDocx";
import {
  BOOKLET_COLOR_SCHEMES,
  SERIES_EXPORT_FONT_OPTIONS,
  SERIES_EXPORT_LAYOUTS,
  SERIES_EXPORT_LAYOUT_LABELS,
  SERIES_EXPORT_LAYOUT_DESCRIPTIONS,
  SERIES_EXPORT_FORMATS,
  ECONOMICAL_PRINT,
  getColorScheme,
  getFontOption,
} from "@/constants/seriesExportConfig";
import type {
  FontId,
  ColorSchemeId,
  SeriesExportLayout,
  SeriesExportFormat,
} from "@/constants/seriesExportConfig";
import {
  PUBLISHING_HUB_CONTENT_TYPES,
  PUBLISHING_HUB_FORMATS,
  PUBLISHING_HUB_DEFAULTS,
  PUBLISHING_HUB_STORAGE_KEY,
  PUBLISHING_HUB_UI,
} from "@/constants/publishingHubConfig";
import type { PublishingContentType, PublishingFormat } from "@/constants/publishingHubConfig";
import { useSeriesExport } from "@/hooks/useSeriesExport";
import type { LessonSeries } from "@/constants/seriesConfig";
import { DIGITAL_WING_UI, DIGITAL_WING_BASE_URL } from "@/constants/digitalWingConfig";
import { useSubscription } from "@/hooks/useSubscription";

// ============================================================================
// TYPES
// ============================================================================

interface LessonRow {
  id: string;
  title: string;
  original_text: string;
  created_at: string;
  filters: Record<string, any> | null;
  metadata: Record<string, any> | null;
  share_token: string | null;
  share_token_handout: string | null;
}

interface DevotionalRow {
  id: string;
  title: string | null;
  bible_passage: string;
  content: string | null;
  created_at: string;
  share_token: string | null;
}

interface SeriesRow {
  id: string;
  series_name: string;
  created_at: string;
  total_lessons: number | null;
  lesson_summaries: unknown[] | null;
  share_token: string | null;
  share_token_handout: string | null;
}

interface SeriesLessonRow {
  id: string;
  title: string;
  original_text: string | null;
  filters: Record<string, any> | null;
  metadata: Record<string, any> | null;
  series_lesson_number: number | null;
}

interface SavedPrefs {
  fontId?: string;
  colorSchemeId?: string;
  selectedFormat?: string;
  economicalPrint?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function loadPrefs(): SavedPrefs {
  try {
    const raw = localStorage.getItem(PUBLISHING_HUB_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SavedPrefs;
  } catch { /* ignore corrupt data */ }
  return {};
}

function savePrefs(prefs: SavedPrefs): void {
  try {
    localStorage.setItem(PUBLISHING_HUB_STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore quota errors */ }
}

function getPassageDisplay(lesson: LessonRow): string {
  const f = lesson.filters;
  return f?.bible_passage || f?.focused_topic || '';
}

/** Extract AI-generated lesson title from original_text */
function extractLessonCardTitle(lesson: LessonRow): string {
  const titleMatch = lesson.original_text?.match(/\*\*Lesson Title:\*\*\s*(.+)/i);
  const extracted = titleMatch ? titleMatch[1].replace(/["\u201C\u201D*]/g, '').trim() : null;
  return extracted || lesson.title || lesson.filters?.bible_passage || lesson.filters?.focused_topic || 'Untitled Lesson';
}

/** Extract Primary Scripture Passage from original_text */
function extractLessonCardPassage(lesson: LessonRow): string {
  const raw = lesson.original_text || '';
  const sameLineMatch = raw.match(/\*\*Primary Scripture Passages?\s*:\*\*[ \t]+(.+)/i);
  const nextLineMatch = raw.match(/\*\*Primary Scripture Passages?\s*:\*\*[ \t]*\n+[ \t]*(.+)/i);
  const extracted = (sameLineMatch?.[1] || nextLineMatch?.[1])?.replace(/\*\*/g, '').trim() || null;
  return extracted || lesson.filters?.bible_passage || lesson.filters?.focused_topic || '';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PublishingHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tier } = useSubscription();
  const [searchParams] = useSearchParams();

  // Content type tab
  const [contentType, setContentType] = useState<PublishingContentType>(
    PUBLISHING_HUB_DEFAULTS.contentType
  );

  // Lessons list
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);

  // Devotionals list
  const [devotionals, setDevotionals] = useState<DevotionalRow[]>([]);
  const [loadingDevotionals, setLoadingDevotionals] = useState(true);

  // Series list
  const [seriesList, setSeriesList] = useState<SeriesRow[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);

  // Selected items
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedDevotionalId, setSelectedDevotionalId] = useState<string | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  // Pickers -- initialized from localStorage or defaults
  const [selectedFont, setSelectedFont] = useState<FontId>(PUBLISHING_HUB_DEFAULTS.fontId);
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorSchemeId>(PUBLISHING_HUB_DEFAULTS.colorSchemeId);
  const [selectedFormat, setSelectedFormat] = useState<PublishingFormat>(PUBLISHING_HUB_DEFAULTS.format);

  // Economical print
  const [economicalPrint, setEconomicalPrint] = useState(false);

  // Series-specific controls
  const [seriesLayout, setSeriesLayout] = useState<SeriesExportLayout>(SERIES_EXPORT_LAYOUTS.FULL_PAGE);
  const [seriesFormat, setSeriesFormat] = useState<SeriesExportFormat>(SERIES_EXPORT_FORMATS.PDF);
  const [includeGroupHandout, setIncludeGroupHandout] = useState(true);

  // Search states
  const [searchLessons, setSearchLessons] = useState('');
  const [searchDevotionals, setSearchDevotionals] = useState('');
  const [searchSeries, setSearchSeries] = useState('');

  // Series lesson list (fetched when a series is selected)
  const [seriesLessons, setSeriesLessons] = useState<SeriesLessonRow[]>([]);
  const [loadingSeriesLessons, setLoadingSeriesLessons] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Full size preview modal
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  // Series full size preview modal
  const [seriesFullPreviewOpen, setSeriesFullPreviewOpen] = useState(false);

  // Series export hook
  const { exportSeries: runSeriesExport } = useSeriesExport();

  // Sharing state
  const [sharingLoading, setSharingLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // SHARING HANDLERS
  // --------------------------------------------------------------------------

  const isPaidUser = tier !== 'free';

  const getShareUrl = (token: string): string =>
    DIGITAL_WING_BASE_URL + '/' + token;

  const handleEnableSharing = async (
    table: 'lessons' | 'devotionals' | 'lesson_series',
    id: string,
    scope: 'full' | 'handout' = 'full',
  ) => {
    setSharingLoading(true);
    try {
      const token = crypto.randomUUID();
      const column = scope === 'handout' ? 'share_token_handout' : 'share_token';
      const { error } = await supabase
        .from(table)
        .update({ [column]: token })
        .eq('id', id);

      if (error) {
        toast({ title: DIGITAL_WING_UI.toastShareError, variant: 'destructive' });
        return;
      }

      if (table === 'lessons') {
        setLessons(prev => prev.map(l => l.id === id ? { ...l, [column]: token } : l));
      } else if (table === 'devotionals') {
        setDevotionals(prev => prev.map(d => d.id === id ? { ...d, [column]: token } : d));
      } else {
        setSeriesList(prev => prev.map(s => s.id === id ? { ...s, [column]: token } : s));
      }

      toast({ title: DIGITAL_WING_UI.toastSharingEnabled });
    } catch {
      toast({ title: DIGITAL_WING_UI.toastShareError, variant: 'destructive' });
    } finally {
      setSharingLoading(false);
    }
  };

  const handleDisableSharing = async (
    table: 'lessons' | 'devotionals' | 'lesson_series',
    id: string,
    scope: 'full' | 'handout' = 'full',
  ) => {
    if (!window.confirm(DIGITAL_WING_UI.shareButtonDisableConfirm)) return;
    setSharingLoading(true);
    try {
      const column = scope === 'handout' ? 'share_token_handout' : 'share_token';
      const { error } = await supabase
        .from(table)
        .update({ [column]: null })
        .eq('id', id);

      if (error) {
        toast({ title: DIGITAL_WING_UI.toastShareError, variant: 'destructive' });
        return;
      }

      if (table === 'lessons') {
        setLessons(prev => prev.map(l => l.id === id ? { ...l, [column]: null } : l));
      } else if (table === 'devotionals') {
        setDevotionals(prev => prev.map(d => d.id === id ? { ...d, [column]: null } : d));
      } else {
        setSeriesList(prev => prev.map(s => s.id === id ? { ...s, [column]: null } : s));
      }

      toast({ title: DIGITAL_WING_UI.toastSharingDisabled });
    } catch {
      toast({ title: DIGITAL_WING_UI.toastShareError, variant: 'destructive' });
    } finally {
      setSharingLoading(false);
    }
  };

  const handleCopyLink = async (token: string, id: string, scope: 'full' | 'handout' = 'full') => {
    try {
      await navigator.clipboard.writeText(getShareUrl(token));
      setCopiedId(id + '-' + scope);
      toast({ title: DIGITAL_WING_UI.toastLinkCopied });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: DIGITAL_WING_UI.toastShareError, variant: 'destructive' });
    }
  };

  // --------------------------------------------------------------------------
  // RESTORE SAVED PREFERENCES
  // --------------------------------------------------------------------------

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs.fontId) setSelectedFont(prefs.fontId as FontId);
    if (prefs.colorSchemeId) setSelectedColorScheme(prefs.colorSchemeId as ColorSchemeId);
    if (prefs.selectedFormat) setSelectedFormat(prefs.selectedFormat as PublishingFormat);
    if (prefs.economicalPrint !== undefined) setEconomicalPrint(prefs.economicalPrint);
  }, []);

  // --------------------------------------------------------------------------
  // PERSIST PREFERENCES ON CHANGE
  // --------------------------------------------------------------------------

  const persistPrefs = useCallback(() => {
    savePrefs({ fontId: selectedFont, colorSchemeId: selectedColorScheme, selectedFormat, economicalPrint });
  }, [selectedFont, selectedColorScheme, selectedFormat, economicalPrint]);

  useEffect(() => { persistPrefs(); }, [persistPrefs]);

  // --------------------------------------------------------------------------
  // FETCH LESSONS
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchLessons = async () => {
      setLoadingLessons(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, original_text, created_at, filters, metadata, share_token, share_token_handout')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Error fetching lessons:', error);
        setLessons([]);
      } else {
        setLessons((data || []) as LessonRow[]);
      }
      setLoadingLessons(false);
    };

    fetchLessons();
    return () => { cancelled = true; };
  }, [user]);

  // --------------------------------------------------------------------------
  // FETCH DEVOTIONALS
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchDevotionals = async () => {
      setLoadingDevotionals(true);
      const { data, error } = await supabase
        .from('devotionals')
        .select('id, title, bible_passage, content, created_at, share_token')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Error fetching devotionals:', error);
        setDevotionals([]);
      } else {
        setDevotionals((data || []) as DevotionalRow[]);
      }
      setLoadingDevotionals(false);
    };

    fetchDevotionals();
    return () => { cancelled = true; };
  }, [user]);

  // --------------------------------------------------------------------------
  // FETCH SERIES
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchSeries = async () => {
      setLoadingSeries(true);
      const { data, error } = await supabase
        .from('lesson_series')
        .select('id, series_name, created_at, total_lessons, lesson_summaries, share_token, share_token_handout')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Error fetching series:', error);
        setSeriesList([]);
      } else {
        setSeriesList((data || []) as SeriesRow[]);
      }
      setLoadingSeries(false);
    };

    fetchSeries();
    return () => { cancelled = true; };
  }, [user]);

  // --------------------------------------------------------------------------
  // DEEP LINK: ?type=lesson|devotional|series&id=xxx
  // --------------------------------------------------------------------------

  useEffect(() => {
    const paramType = searchParams.get('type');
    const paramId = searchParams.get('id');
    if (!paramType || !paramId) return;

    if (paramType === 'lesson') {
      setContentType(PUBLISHING_HUB_CONTENT_TYPES.LESSONS);
      setSelectedLessonId(paramId);
    } else if (paramType === 'devotional') {
      setContentType(PUBLISHING_HUB_CONTENT_TYPES.DEVOTIONALS);
      setSelectedDevotionalId(paramId);
    } else if (paramType === 'series') {
      setContentType(PUBLISHING_HUB_CONTENT_TYPES.SERIES);
      setSelectedSeriesId(paramId);
    }
  }, [searchParams]);

  // --------------------------------------------------------------------------
  // SCROLL DEEP-LINKED ITEM INTO VIEW
  // --------------------------------------------------------------------------

  useEffect(() => {
    const id = selectedLessonId || selectedDevotionalId || selectedSeriesId;
    if (!id) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-item-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedLessonId, selectedDevotionalId, selectedSeriesId, loadingLessons, loadingDevotionals, loadingSeries]);

  // --------------------------------------------------------------------------
  // FETCH SERIES LESSONS (when a series is selected)
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedSeriesId) {
      setSeriesLessons([]);
      return;
    }
    let cancelled = false;

    const fetchSeriesLessons = async () => {
      setLoadingSeriesLessons(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, original_text, filters, metadata, series_lesson_number')
        .eq('series_id', selectedSeriesId)
        .order('series_lesson_number', { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error('Error fetching series lessons:', error);
        setSeriesLessons([]);
      } else {
        setSeriesLessons((data || []) as SeriesLessonRow[]);
      }
      setLoadingSeriesLessons(false);
    };

    fetchSeriesLessons();
    return () => { cancelled = true; };
  }, [selectedSeriesId]);

  // --------------------------------------------------------------------------
  // SELECTED ITEMS
  // --------------------------------------------------------------------------

  const selectedLesson     = lessons.find(l => l.id === selectedLessonId) || null;
  const selectedDevotional = devotionals.find(d => d.id === selectedDevotionalId) || null;
  const selectedSeries     = seriesList.find(s => s.id === selectedSeriesId) || null;

  // --------------------------------------------------------------------------
  // LESSON EXPORT HANDLER
  // --------------------------------------------------------------------------

  const getCopyrightLine = (lesson: LessonRow): string | undefined => {
    const meta = lesson.metadata;
    if (meta?.copyrightNotice) return meta.copyrightNotice as string;
    if (meta?.bibleVersion) {
      if (meta.copyrightStatus === 'public_domain') {
        return `Scripture quotations are from the ${meta.bibleVersion} (${meta.bibleVersionAbbreviation || ''}).`;
      }
      return `Scripture quotations are from the ${meta.bibleVersion}.`;
    }
    return undefined;
  };

  const handleLessonDownload = async () => {
    if (!selectedLesson || exporting) return;
    setExporting(true);

    const meta = selectedLesson.metadata;
    const exportMeta = {
      passage:                  selectedLesson.title,
      ageGroup:                 meta?.ageGroup as string | undefined,
      theology:                 meta?.theologyProfile as string | undefined,
      bibleVersion:             meta?.bibleVersion as string | undefined,
      bibleVersionAbbreviation: meta?.bibleVersionAbbreviation as string | undefined,
      copyrightNotice:          getCopyrightLine(selectedLesson),
    };

    try {
      if (selectedFormat === PUBLISHING_HUB_FORMATS.FULL_PAGE) {
        await exportToPdf({
          title:         selectedLesson.title,
          content:       selectedLesson.original_text,
          teaserContent: (meta?.teaser as string) || undefined,
          metadata:      exportMeta,
          fontId:        selectedFont,
          colorSchemeId: selectedColorScheme,
          economicalPrint,
        });
        toast({ title: PUBLISHING_HUB_UI.toastPdfSuccess });
      } else {
        await exportToDocx({
          title:         selectedLesson.title,
          content:       selectedLesson.original_text,
          teaserContent: (meta?.teaser as string) || undefined,
          metadata:      exportMeta,
          fontId:        selectedFont,
          colorSchemeId: selectedColorScheme,
          economicalPrint,
        });
        toast({ title: PUBLISHING_HUB_UI.toastDocxSuccess });
      }
    } catch {
      toast({
        title:       PUBLISHING_HUB_UI.toastExportError,
        description: PUBLISHING_HUB_UI.toastExportErrorDescription,
        variant:     'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // --------------------------------------------------------------------------
  // DEVOTIONAL EXPORT HANDLER
  // --------------------------------------------------------------------------

  const handleDevotionalDownload = async () => {
    if (!selectedDevotional || exporting) return;
    setExporting(true);

    const devTitle   = selectedDevotional.title || 'Untitled Devotional';
    const devContent = selectedDevotional.content || '';

    try {
      if (selectedFormat === PUBLISHING_HUB_FORMATS.FULL_PAGE) {
        await exportToPdf({
          title:         devTitle,
          content:       devContent,
          metadata:      { passage: selectedDevotional.bible_passage },
          fontId:        selectedFont,
          colorSchemeId: selectedColorScheme,
          economicalPrint,
        });
        toast({ title: PUBLISHING_HUB_UI.toastPdfSuccess });
      } else {
        await exportToDocx({
          title:         devTitle,
          content:       devContent,
          metadata:      { passage: selectedDevotional.bible_passage },
          fontId:        selectedFont,
          colorSchemeId: selectedColorScheme,
          economicalPrint,
        });
        toast({ title: PUBLISHING_HUB_UI.toastDocxSuccess });
      }
    } catch {
      toast({
        title:       PUBLISHING_HUB_UI.toastExportError,
        description: PUBLISHING_HUB_UI.toastExportErrorDescription,
        variant:     'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // --------------------------------------------------------------------------
  // SERIES EXPORT HANDLER
  // --------------------------------------------------------------------------

  const handleSeriesDownload = async () => {
    if (!selectedSeries || exporting) return;
    setExporting(true);

    try {
      // Fetch full series data for the export hook
      const { data: fullSeries, error: seriesError } = await supabase
        .from('lesson_series')
        .select('*')
        .eq('id', selectedSeries.id)
        .single();

      if (seriesError || !fullSeries) {
        throw new Error('Could not load series data');
      }

      const success = await runSeriesExport(fullSeries as unknown as LessonSeries, {
        format:                    seriesFormat,
        layout:                    seriesLayout,
        colorSchemeId:             selectedColorScheme,
        font:                      selectedFont,
        includeHandoutBooklet:     includeGroupHandout,
        omitSection8FromChapters:  true,
      });

      if (success) {
        toast({ title: seriesFormat === SERIES_EXPORT_FORMATS.PDF ? PUBLISHING_HUB_UI.toastPdfSuccess : PUBLISHING_HUB_UI.toastDocxSuccess });
      }
    } catch {
      toast({
        title:       PUBLISHING_HUB_UI.toastExportError,
        description: PUBLISHING_HUB_UI.toastExportErrorDescription,
        variant:     'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // Series layout constrains format
  const isSeriesTrifold = seriesLayout === SERIES_EXPORT_LAYOUTS.TRIFOLD;
  const isSeriesBooklet = seriesLayout === SERIES_EXPORT_LAYOUTS.BOOKLET;
  useEffect(() => {
    if (isSeriesBooklet) setSeriesFormat(SERIES_EXPORT_FORMATS.BOOKLET);
    else if (isSeriesTrifold) setSeriesFormat(SERIES_EXPORT_FORMATS.TRIFOLD);
  }, [isSeriesTrifold, isSeriesBooklet]);

  // --------------------------------------------------------------------------
  // PREVIEW PANEL (mirrors LessonExportModal pattern)
  // --------------------------------------------------------------------------

  const scheme  = getColorScheme(selectedColorScheme);
  const fontOpt = getFontOption(selectedFont);
  const primaryHex = '#' + scheme.primary;
  const accentHex  = '#' + scheme.accent;

  // Preview styles -- single scrollable box, no position tricks
  // Font sizes react to economicalPrint toggle
  const ecoBodySize    = economicalPrint ? '12px' : '14px';
  const ecoBodyLineH   = economicalPrint ? '1.3'  : '1.6';
  const ecoHeadingSize = economicalPrint ? '14px' : '16px';
  const ecoSubheadSize = economicalPrint ? '13px' : '14px';

  const tw: React.CSSProperties = {
    maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word', display: 'block',
  };
  const pw = {
    boxChrome: {
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      background: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    } as React.CSSProperties,
    boxScroll: {
      height: '500px',
      overflowY: 'scroll' as const,
      overflowX: 'hidden' as const,
      scrollbarWidth: 'auto' as const,
      scrollbarColor: '#9ca3af #f3f4f6',
    } as React.CSSProperties,
    boxInner: {
      padding: '16px',
      fontFamily: fontOpt.cssFamily,
      fontSize: ecoBodySize,
      lineHeight: ecoBodyLineH,
      color: '#1a1a1a',
      wordBreak: 'break-word' as const,
      overflowWrap: 'break-word' as const,
    } as React.CSSProperties,
    schemeTag: {
      display: 'block' as const, fontSize: '10px', fontWeight: 600,
      letterSpacing: '0.05em', textTransform: 'uppercase' as const,
      color: '#ffffff', background: primaryHex,
      borderRadius: '3px', padding: '2px 8px', marginBottom: '12px',
      width: 'fit-content', ...tw,
    } as React.CSSProperties,
    lessonTitle: {
      fontSize: '18px', fontWeight: 700, color: primaryHex,
      lineHeight: '1.3', marginBottom: '4px', ...tw,
    } as React.CSSProperties,
    scripture: {
      fontSize: '13px', fontStyle: 'italic', color: '#555555', marginBottom: '10px', ...tw,
    } as React.CSSProperties,
    rule: { height: '2px', background: accentHex, opacity: 0.6, marginBottom: '14px' } as React.CSSProperties,
    footerRow: {
      display: 'flex', justifyContent: 'space-between',
      paddingTop: '8px', borderTop: '1px solid #e5e7eb', marginTop: '12px',
    } as React.CSSProperties,
    footerText: { fontSize: '10px', color: '#9ca3af' } as React.CSSProperties,
  };

  /** Render a single line of markdown-ish text with inline bold parsed */
  function renderInlineText(text: string, key: string): React.ReactNode {
    // Split on **bold** markers
    const parts = text.split(/\*\*(.*?)\*\*/g);
    if (parts.length === 1) return text;
    return (
      <span key={key}>
        {parts.map((part, i) =>
          i % 2 === 1
            ? <strong key={i}>{part}</strong>
            : <React.Fragment key={i}>{part}</React.Fragment>
        )}
      </span>
    );
  }

  const textContainStyle: React.CSSProperties = tw;

  /** Parse raw lesson text into styled preview elements */
  function renderMarkdownPreview(raw: string): React.ReactNode[] {
    // Normalize: insert newlines before inline section separators
    // Content from the database may be a single continuous string with no newlines.
    // Step 1: normalize line endings
    // Step 2: insert breaks before markdown patterns
    // Step 3: insert breaks before bold labels (**Label:**)
    // Step 4: insert breaks between sentences (period/!/? followed by 2+ spaces)
    const normalized = raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/([.!?])\s{2,}##\s/g, '$1\n## ')
      .replace(/\s##\s/g, '\n## ')
      .replace(/\s---\s/g, '\n---\n')
      .replace(/([^\n])\*\*([^*]+):\*\*/g, '$1\n**$2:**')
      .replace(/([.!?])\s{2,}/g, '$1\n');
    const lines = normalized.split('\n');
    const elements: React.ReactNode[] = [];

    const headingStyle: React.CSSProperties = {
      fontSize: '15px',
      fontWeight: 700,
      color: primaryHex,
      letterSpacing: '0.03em',
      marginTop: '16px',
      marginBottom: '6px',
      paddingBottom: '3px',
      borderBottom: '1px solid ' + accentHex,
      display: 'block',
      maxWidth: '100%',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
    };

    const ruleStyle: React.CSSProperties = {
      height: '2px',
      backgroundColor: accentHex,
      opacity: 0.6,
      margin: '12px 0',
      width: '100%',
      display: 'block',
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line -> small spacer
      if (trimmed === '') {
        elements.push(<div key={'sp-' + i} style={{ height: '8px' }} />);
        continue;
      }

      // Horizontal rule --- or *** or ___
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        elements.push(<div key={'hr-' + i} style={ruleStyle} />);
        continue;
      }

      // ## Heading
      if (trimmed.startsWith('## ') && trimmed.length > 3) {
        const headingText = trimmed.slice(3);
        elements.push(
          <div key={'h-' + i} style={headingStyle}>
            {renderInlineText(headingText, 'hi-' + i)}
          </div>
        );
        continue;
      }

      // # Heading (single hash)
      if (trimmed.startsWith('# ')) {
        const headingText = trimmed.slice(2);
        elements.push(
          <div key={'h1-' + i} style={headingStyle}>
            {renderInlineText(headingText, 'h1i-' + i)}
          </div>
        );
        continue;
      }

      // Normal paragraph with inline bold
      elements.push(
        <div key={'p-' + i} style={{ marginBottom: '4px', fontWeight: 400, fontStyle: 'normal', ...textContainStyle }}>
          {renderInlineText(trimmed, 'pi-' + i)}
        </div>
      );
    }

    return elements;
  }

  /** Parse raw lesson text into styled elements at booklet scale (10px base) */
  function renderBookletMarkdown(raw: string): React.ReactNode[] {
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (trimmed === '') {
        elements.push(<div key={'bsp-' + i} style={{ height: '6px' }} />);
        continue;
      }

      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        elements.push(
          <div key={'bhr-' + i} style={{ height: '1px', backgroundColor: accentHex, margin: '8px 0', width: '100%' }} />
        );
        continue;
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <div key={'bh-' + i} style={{ fontSize: '11px', fontWeight: 600, color: primaryHex, marginTop: '12px', marginBottom: '4px', ...tw }}>
            {renderInlineText(trimmed.slice(3), 'bhi-' + i)}
          </div>
        );
        continue;
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <div key={'bh1-' + i} style={{ fontSize: '12px', fontWeight: 600, color: primaryHex, marginTop: '12px', marginBottom: '4px', ...tw }}>
            {renderInlineText(trimmed.slice(2), 'bh1i-' + i)}
          </div>
        );
        continue;
      }

      elements.push(
        <div key={'bp-' + i} style={{ marginBottom: '4px', ...tw }}>
          {renderInlineText(trimmed, 'bpi-' + i)}
        </div>
      );
    }

    return elements;
  }

  /** Build logical half-page pairs for the booklet spread simulation preview */
  function buildBookletSpreads(): Array<[React.ReactNode, React.ReactNode | null]> {
    const pages: React.ReactNode[] = [];

    // Page 1: Cover
    pages.push(
      <div key="p-cover" style={{ padding: '18px 14px 18px 18px', height: '100%', boxSizing: 'border-box' as const, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: primaryHex, marginBottom: '8px', ...tw }}>
          {selectedSeries ? selectedSeries.series_name : 'Untitled Series'}
        </div>
        <div style={{ height: '2px', background: accentHex, opacity: 0.6, marginBottom: '10px' }} />
        <div style={{ fontSize: '10px', color: '#555555', ...tw }}>
          {seriesLessons.length === 1 ? '1 Lesson' : seriesLessons.length + ' Lessons'}
        </div>
        <div style={{ marginTop: 'auto', fontSize: '9px', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
          biblelessonspark.com
        </div>
      </div>
    );

    // Page 2: Table of Contents
    pages.push(
      <div key="p-toc" style={{ padding: '14px 14px 14px 18px', height: '100%', boxSizing: 'border-box' as const, overflow: 'hidden' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: primaryHex, marginBottom: '8px', ...tw }}>
          Table of Contents
        </div>
        <div style={{ height: '1px', background: accentHex, opacity: 0.6, marginBottom: '8px' }} />
        {seriesLessons.map((sl, idx) => (
          <div key={'ptoc-' + sl.id} style={{ fontSize: '9px', color: '#1a1a1a', padding: '2px 0', ...tw }}>
            <span style={{ fontWeight: 600, color: primaryHex, marginRight: '5px' }}>
              {(sl.series_lesson_number ?? idx + 1)}.
            </span>
            {sl.title || 'Untitled Lesson'}
          </div>
        ))}
      </div>
    );

    // One page per lesson
    seriesLessons.forEach((sl, idx) => {
      const lessonTitle = sl.title || sl.filters?.bible_passage || 'Untitled Lesson';
      pages.push(
        <div key={'p-lesson-' + sl.id} style={{ padding: '14px 14px 14px 18px', height: '100%', boxSizing: 'border-box' as const, overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: primaryHex, marginBottom: '4px', ...tw }}>
            {'Lesson ' + (sl.series_lesson_number ?? idx + 1) + ' \u2014 ' + lessonTitle}
          </div>
          <div style={{ height: '1px', background: accentHex, opacity: 0.6, marginBottom: '6px' }} />
          <div style={{ fontSize: '8.5px', lineHeight: '1.35', overflow: 'hidden', maxHeight: 'calc(100% - 32px)' }}>
            {sl.original_text
              ? renderBookletMarkdown(sl.original_text)
              : <div style={{ color: '#999999', fontStyle: 'italic', ...tw }}>No content available.</div>
            }
          </div>
        </div>
      );
    });

    // Pad to even count for booklet imposition
    if (pages.length % 2 !== 0) {
      pages.push(
        <div key="p-blank" style={{ padding: '14px', height: '100%', boxSizing: 'border-box' as const, display: 'flex', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '9px', color: '#d1d5db', fontStyle: 'italic' }}>This page intentionally blank</span>
        </div>
      );
    }

    // Pair into spreads
    const spreads: Array<[React.ReactNode, React.ReactNode | null]> = [];
    for (let i = 0; i < pages.length; i += 2) {
      spreads.push([pages[i], pages[i + 1] ?? null]);
    }
    return spreads;
  }

  const previewRef = useRef<HTMLDivElement>(null);

  // Diagnostic: log scroll dimensions when selected lesson changes
  useEffect(() => {
    if (previewRef.current) {
      console.log('Preview scrollHeight:', previewRef.current.scrollHeight, 'clientHeight:', previewRef.current.clientHeight);
    }
  }, [selectedLessonId, selectedDevotionalId, economicalPrint]);

  // Preview panel values for lessons
  const previewTitle      = selectedLesson?.title || 'Your Lesson Title';
  const previewShortTitle = previewTitle.length > 50 ? previewTitle.slice(0, 50) + '...' : previewTitle;
  const previewPassage    = selectedLesson ? getPassageDisplay(selectedLesson) : '';
  const previewRawText    = selectedLesson?.original_text || '';

  // Preview panel values for devotionals
  const devPreviewTitle      = selectedDevotional?.title || 'Untitled Devotional';
  const devPreviewShortTitle = devPreviewTitle.length > 50 ? devPreviewTitle.slice(0, 50) + '...' : devPreviewTitle;
  const devPreviewPassage    = selectedDevotional?.bible_passage || '';
  const devPreviewRawText    = selectedDevotional?.content || '';

  // --------------------------------------------------------------------------
  // TAB SWITCH HANDLER
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // FILTERED LISTS (client-side search)
  // --------------------------------------------------------------------------

  const filteredLessons = lessons.filter(l => {
    if (!searchLessons) return true;
    const q = searchLessons.toLowerCase();
    const title = (l.title || '').toLowerCase();
    const passage = (l.filters?.bible_passage || '').toLowerCase();
    return title.includes(q) || passage.includes(q);
  });

  const filteredDevotionals = devotionals.filter(d => {
    if (!searchDevotionals) return true;
    const q = searchDevotionals.toLowerCase();
    const title = (d.title || '').toLowerCase();
    const passage = (d.bible_passage || '').toLowerCase();
    return title.includes(q) || passage.includes(q);
  });

  const filteredSeries = seriesList.filter(s => {
    if (!searchSeries) return true;
    const q = searchSeries.toLowerCase();
    return s.series_name.toLowerCase().includes(q);
  });

  const handleTabSwitch = (tab: PublishingContentType) => {
    setContentType(tab);
    setSelectedLessonId(null);
    setSelectedDevotionalId(null);
    setSelectedSeriesId(null);
    setFullPreviewOpen(false);
    setSeriesFullPreviewOpen(false);
  };

  // --------------------------------------------------------------------------
  // CONTENT TYPE TABS
  // --------------------------------------------------------------------------

  const tabs: { key: PublishingContentType; label: string }[] = [
    { key: PUBLISHING_HUB_CONTENT_TYPES.LESSONS,     label: PUBLISHING_HUB_UI.tabLessons },
    { key: PUBLISHING_HUB_CONTENT_TYPES.DEVOTIONALS, label: PUBLISHING_HUB_UI.tabDevotionals },
    { key: PUBLISHING_HUB_CONTENT_TYPES.SERIES,      label: PUBLISHING_HUB_UI.tabSeries },
  ];

  // --------------------------------------------------------------------------
  // SHARED UI FRAGMENTS
  // --------------------------------------------------------------------------

  /** Render a single share scope row (Full Lesson or Group Handout) */
  const renderShareScopeRow = (
    table: 'lessons' | 'devotionals' | 'lesson_series',
    id: string,
    shareToken: string | null | undefined,
    scope: 'full' | 'handout',
    label: string,
    description: string,
  ) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {shareToken && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium shrink-0 ml-2">
            Active
          </span>
        )}
      </div>
      {shareToken ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/20">
            <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
              {getShareUrl(shareToken)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCopyLink(shareToken, id, scope)}
              disabled={sharingLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted/50 transition-colors flex-1 justify-center"
            >
              {copiedId === id + '-' + scope
                ? <><Check className="h-3 w-3 text-emerald-600" />{DIGITAL_WING_UI.shareButtonCopied}</>
                : <><Link2 className="h-3 w-3" />{DIGITAL_WING_UI.shareButtonCopy}</>
              }
            </button>
            <button
              type="button"
              onClick={() => handleDisableSharing(table, id, scope)}
              disabled={sharingLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors"
            >
              {DIGITAL_WING_UI.shareButtonDisable}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => handleEnableSharing(table, id, scope)}
          disabled={sharingLoading}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-primary/40 text-primary hover:bg-primary/5 transition-colors"
        >
          {sharingLoading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Share2 className="h-3 w-3" />
          }
          {DIGITAL_WING_UI.shareButtonEnable}
        </button>
      )}
    </div>
  );

  /** Share controls -- rendered below the download button for all three content types */
  const renderShareControls = (
    table: 'lessons' | 'devotionals' | 'lesson_series',
    id: string,
    shareToken: string | null | undefined,
    shareTokenHandout?: string | null,
  ) => (
    <div style={{ borderTop: '1px solid' }} className="border-border pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{DIGITAL_WING_UI.shareLabel}</p>
      </div>

      {!isPaidUser ? (
        <div className="p-3 rounded-md border border-border bg-muted/30 text-center space-y-2">
          <p className="text-xs text-muted-foreground">{DIGITAL_WING_UI.upgradePrompt}</p>
          <a href="/pricing" className="inline-block text-xs font-medium text-primary hover:underline">
            {DIGITAL_WING_UI.upgradeButton}
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {renderShareScopeRow(
            table, id, shareToken, 'full',
            DIGITAL_WING_UI.shareScopeFull,
            DIGITAL_WING_UI.shareScopeFullDesc,
          )}
          {shareTokenHandout !== undefined && (
            <>
              <div style={{ height: '1px' }} className="bg-border" />
              {renderShareScopeRow(
                table, id, shareTokenHandout, 'handout',
                DIGITAL_WING_UI.shareScopeHandout,
                DIGITAL_WING_UI.shareScopeHandoutDesc,
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  /** Font picker fieldset -- reused across all three content types */
  const renderFontPicker = () => (
    <fieldset className="border border-border rounded-lg p-4">
      <legend className="text-sm font-medium text-foreground mb-2">{PUBLISHING_HUB_UI.fontLabel}</legend>
      <div className="space-y-1.5">
        {SERIES_EXPORT_FONT_OPTIONS.map(f => (
          <label
            key={f.id}
            className={
              "flex items-center gap-3 cursor-pointer px-3 py-2 rounded-md border transition-colors " +
              (selectedFont === f.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50")
            }
          >
            <input
              type="radio"
              name="pub-font"
              value={f.id}
              checked={selectedFont === f.id}
              onChange={() => setSelectedFont(f.id as FontId)}
              className="accent-primary"
            />
            <span style={{ fontFamily: f.cssFamily, fontSize: '14px' }} className="text-foreground">
              {f.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  /** Color scheme picker fieldset -- reused across all three content types */
  const renderColorSchemePicker = () => (
    <fieldset className="border border-border rounded-lg p-4">
      <legend className="text-sm font-medium text-foreground mb-1">{PUBLISHING_HUB_UI.colorSchemeLabel}</legend>
      <p className="text-xs text-muted-foreground mb-2">{PUBLISHING_HUB_UI.colorSchemeNote}</p>
      <div className="space-y-1.5">
        {BOOKLET_COLOR_SCHEMES.map(cs => (
          <label
            key={cs.id}
            className={
              "flex items-center gap-3 cursor-pointer px-3 py-2 rounded-md border transition-colors " +
              (selectedColorScheme === cs.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50")
            }
          >
            <input
              type="radio"
              name="pub-color"
              value={cs.id}
              checked={selectedColorScheme === cs.id}
              onChange={() => setSelectedColorScheme(cs.id as ColorSchemeId)}
              className="accent-primary"
            />
            <span className="flex gap-1">
              <span
                style={{ background: '#' + cs.primary }}
                className="inline-block w-5 h-5 rounded-sm border border-black/10"
                aria-hidden="true"
              />
              <span
                style={{ background: '#' + cs.accent }}
                className="inline-block w-5 h-5 rounded-sm border border-black/10"
                aria-hidden="true"
              />
            </span>
            <span className="text-sm text-foreground">{cs.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  /** Format picker (PDF / DOCX) for lessons and devotionals */
  const renderFormatPicker = () => (
    <fieldset>
      <legend className="text-sm font-medium text-foreground mb-2">{PUBLISHING_HUB_UI.formatLabel}</legend>
      <div className="grid grid-cols-2 gap-3">
        <label
          className={
            "flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
            (selectedFormat === PUBLISHING_HUB_FORMATS.FULL_PAGE
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50")
          }
        >
          <input
            type="radio"
            name="pub-format"
            value={PUBLISHING_HUB_FORMATS.FULL_PAGE}
            checked={selectedFormat === PUBLISHING_HUB_FORMATS.FULL_PAGE}
            onChange={() => setSelectedFormat(PUBLISHING_HUB_FORMATS.FULL_PAGE)}
            className="mt-0.5 accent-primary"
          />
          <div>
            <span className="text-sm font-medium text-foreground block">{PUBLISHING_HUB_UI.formatPdfLabel}</span>
            <span className="text-xs text-emerald-600 block mt-0.5 font-medium">{PUBLISHING_HUB_UI.formatPdfDescription}</span>
          </div>
        </label>
        <label
          className={
            "flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
            (selectedFormat === PUBLISHING_HUB_FORMATS.DOCX
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50")
          }
        >
          <input
            type="radio"
            name="pub-format"
            value={PUBLISHING_HUB_FORMATS.DOCX}
            checked={selectedFormat === PUBLISHING_HUB_FORMATS.DOCX}
            onChange={() => setSelectedFormat(PUBLISHING_HUB_FORMATS.DOCX)}
            className="mt-0.5 accent-primary"
          />
          <div>
            <span className="text-sm font-medium text-foreground block">{PUBLISHING_HUB_UI.formatDocxLabel}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">{PUBLISHING_HUB_UI.formatDocxDescription}</span>
          </div>
        </label>
      </div>
    </fieldset>
  );

  /** Economical print toggle */
  const renderEconomicalPrint = () => (
    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-md border border-border hover:bg-muted/50 transition-colors">
      <input
        type="checkbox"
        checked={economicalPrint}
        onChange={(e) => setEconomicalPrint(e.target.checked)}
        className="mt-0.5 accent-primary"
      />
      <div>
        <span className="text-sm font-medium text-foreground block">{PUBLISHING_HUB_UI.economicalPrintLabel}</span>
        <span className="text-xs text-muted-foreground block mt-0.5">{PUBLISHING_HUB_UI.economicalPrintDescription}</span>
      </div>
    </label>
  );

  /** Download button */
  const renderDownloadButton = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={exporting}
      className={
        "w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2 " +
        (exporting
          ? "bg-muted text-muted-foreground cursor-not-allowed"
          : "bg-primary text-primary-foreground hover:bg-primary/90")
      }
    >
      {exporting && <Loader2 className="h-4 w-4 animate-spin" />}
      {exporting ? PUBLISHING_HUB_UI.downloadingButton : PUBLISHING_HUB_UI.downloadButton}
    </button>
  );

  /** Search input for content list panels */
  const renderSearchInput = (
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
  ) => (
    <div className="px-3 py-2 border-b border-border">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  /** Generic content selector list */
  const renderContentList = <T extends { id: string }>(
    items: T[],
    loading: boolean,
    loadingLabel: string,
    emptyLabel: string,
    headerLabel: string,
    selectedId: string | null,
    onSelect: (id: string) => void,
    getTitle: (item: T) => string,
    getSubtitle: (item: T) => string,
    getDate: (item: T) => string,
    searchNode?: React.ReactNode,
    renderExtra?: (item: T) => React.ReactNode,
  ) => (
    <div className="lg:col-span-1">
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{headerLabel}</h2>
        </div>
        {searchNode}
        <div className="max-h-[480px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{loadingLabel}</span>
            </div>
          )}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground px-4 py-8 text-center">{emptyLabel}</p>
          )}
          {!loading && items.map(item => {
            const isSelected = item.id === selectedId;
            const subtitle = getSubtitle(item);
            return (
              <button
                key={item.id}
                data-item-id={item.id}
                onClick={() => onSelect(item.id)}
                className={
                  "w-full text-left px-4 py-3 border-b border-border last:border-b-0 transition-colors " +
                  (isSelected
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-muted/50")
                }
              >
                <p className={
                  "text-sm font-medium truncate " +
                  (isSelected ? "text-primary" : "text-foreground")
                }>
                  {getTitle(item)}
                </p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
                )}
                {renderExtra && renderExtra(item)}
                <p className="text-xs text-muted-foreground mt-0.5">{getDate(item)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // CONTENT-SPECIFIC PREVIEW: renders for lesson or devotional
  // --------------------------------------------------------------------------

  const renderContentPreview = (
    title: string,
    shortTitle: string,
    passage: string,
    rawText: string,
  ) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-foreground">{PUBLISHING_HUB_UI.previewLabel}</p>
        <button
          type="button"
          onClick={() => setFullPreviewOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <Maximize2 className="h-3 w-3" />
          {PUBLISHING_HUB_UI.previewFullSizeButton}
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{PUBLISHING_HUB_UI.previewZoomHint}</p>
      <div style={pw.boxChrome}>
        <div ref={previewRef} className="preview-scroll-container" style={pw.boxScroll}>
          <div style={pw.boxInner}>
            {economicalPrint && (
              <div style={{
                fontSize: '11px', color: '#92400e', background: '#fffbeb',
                border: '1px solid #fde68a', borderRadius: '4px',
                padding: '4px 8px', marginBottom: '10px', ...tw,
              }}>
                Economical Print {'\u2014'} reduced size for home printing
              </div>
            )}
            <div style={pw.schemeTag}>{scheme.label} {'\u2014'} {fontOpt.label.split('(')[0].trim()}</div>
            <div style={pw.lessonTitle}>{title}</div>
            {passage && <div style={pw.scripture}>{passage}</div>}
            <div style={pw.rule} />
            {rawText ? renderMarkdownPreview(rawText) : <div style={tw}>No content available.</div>}
            <div style={pw.footerRow}>
              <span style={pw.footerText}>{shortTitle}</span>
              <span style={pw.footerText}>biblelessonspark.com {'\u2014'} 1</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{PUBLISHING_HUB_UI.previewNote}</p>
    </div>
  );

  // --------------------------------------------------------------------------
  // FULL SIZE PREVIEW - used for lesson and devotional content
  // --------------------------------------------------------------------------

  const fullPreviewTitle   = contentType === PUBLISHING_HUB_CONTENT_TYPES.DEVOTIONALS ? devPreviewTitle : previewTitle;
  const fullPreviewPassage = contentType === PUBLISHING_HUB_CONTENT_TYPES.DEVOTIONALS ? devPreviewPassage : previewPassage;
  const fullPreviewRaw     = contentType === PUBLISHING_HUB_CONTENT_TYPES.DEVOTIONALS ? devPreviewRawText : previewRawText;
  const showFullPreview    = fullPreviewOpen && (selectedLesson || selectedDevotional);

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <AppShell>
    <div className="min-h-screen bg-background">
      <style>{`
        .preview-scroll-container::-webkit-scrollbar { width: 12px; }
        .preview-scroll-container::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 6px; }
        .preview-scroll-container::-webkit-scrollbar-thumb { background-color: #9ca3af; border-radius: 6px; border: 2px solid #f3f4f6; }
      `}</style>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-1">
          <Printer className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{PUBLISHING_HUB_UI.pageTitle}</h1>
        </div>
        <p className="text-muted-foreground mb-6">{PUBLISHING_HUB_UI.pageSubtitle}</p>

        {/* CONTENT TYPE TABS */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabSwitch(tab.key)}
              className={
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px " +
                (contentType === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================================================================ */}
        {/* LESSONS TAB                                                      */}
        {/* ================================================================ */}
        {contentType === PUBLISHING_HUB_CONTENT_TYPES.LESSONS && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderContentList(
              filteredLessons,
              loadingLessons,
              PUBLISHING_HUB_UI.loadingLessons,
              PUBLISHING_HUB_UI.emptyLessons,
              PUBLISHING_HUB_UI.tabLessons,
              selectedLessonId,
              setSelectedLessonId,
              (l) => extractLessonCardTitle(l),
              (l) => extractLessonCardPassage(l),
              (l) => formatDate(l.created_at),
              renderSearchInput(searchLessons, setSearchLessons, PUBLISHING_HUB_UI.searchLessonsPlaceholder),
            )}

            <div className="lg:col-span-2">
              {!selectedLesson ? (
                <div className="border border-border rounded-lg flex items-center justify-center py-20">
                  <p className="text-muted-foreground">{PUBLISHING_HUB_UI.selectPrompt}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderFontPicker()}
                    {renderColorSchemePicker()}
                  </div>
                  {renderFormatPicker()}
                  {renderEconomicalPrint()}
                  {renderContentPreview(previewTitle, previewShortTitle, previewPassage, previewRawText)}
                  {renderDownloadButton(handleLessonDownload)}
                  {renderShareControls('lessons', selectedLesson.id, selectedLesson.share_token, selectedLesson.share_token_handout)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* DEVOTIONALS TAB                                                  */}
        {/* ================================================================ */}
        {contentType === PUBLISHING_HUB_CONTENT_TYPES.DEVOTIONALS && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderContentList(
              filteredDevotionals,
              loadingDevotionals,
              PUBLISHING_HUB_UI.loadingDevotionals,
              PUBLISHING_HUB_UI.noDevotionals,
              PUBLISHING_HUB_UI.devotionalsTabLabel,
              selectedDevotionalId,
              setSelectedDevotionalId,
              (d) => d.title || 'Untitled Devotional',
              (d) => d.bible_passage,
              (d) => formatDate(d.created_at),
              renderSearchInput(searchDevotionals, setSearchDevotionals, PUBLISHING_HUB_UI.searchDevotionalsPlaceholder),
            )}

            <div className="lg:col-span-2">
              {!selectedDevotional ? (
                <div className="border border-border rounded-lg flex items-center justify-center py-20">
                  <p className="text-muted-foreground">{PUBLISHING_HUB_UI.selectDevotionalPrompt}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderFontPicker()}
                    {renderColorSchemePicker()}
                  </div>
                  {renderFormatPicker()}
                  {renderContentPreview(devPreviewTitle, devPreviewShortTitle, devPreviewPassage, devPreviewRawText)}
                  {renderDownloadButton(handleDevotionalDownload)}
                  {renderShareControls('devotionals', selectedDevotional.id, selectedDevotional.share_token)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* SERIES TAB                                                       */}
        {/* ================================================================ */}
        {contentType === PUBLISHING_HUB_CONTENT_TYPES.SERIES && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderContentList(
              filteredSeries,
              loadingSeries,
              PUBLISHING_HUB_UI.loadingSeries,
              PUBLISHING_HUB_UI.noSeries,
              PUBLISHING_HUB_UI.seriesTabLabel,
              selectedSeriesId,
              setSelectedSeriesId,
              (s) => s.series_name,
              () => '',
              (s) => formatDate(s.created_at),
              renderSearchInput(searchSeries, setSearchSeries, PUBLISHING_HUB_UI.searchSeriesPlaceholder),
              (s) => {
                const total = s.total_lessons || 0;
                const completed = Array.isArray(s.lesson_summaries) ? s.lesson_summaries.length : 0;
                const isComplete = total > 0 && completed >= total;
                const isInProgress = completed > 0 && completed < total;
                const statusLabel = isComplete
                  ? PUBLISHING_HUB_UI.seriesComplete
                  : isInProgress
                    ? PUBLISHING_HUB_UI.seriesInProgress
                    : PUBLISHING_HUB_UI.seriesEmpty;
                const badgeClass = isComplete
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : isInProgress
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-muted-foreground bg-muted/50 border-border';
                return (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{completed} of {total} lessons</span>
                    <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded border ' + badgeClass}>{statusLabel}</span>
                  </div>
                );
              },
            )}

            <div className="lg:col-span-2">
              {!selectedSeries ? (
                <div className="border border-border rounded-lg flex items-center justify-center py-20">
                  <p className="text-muted-foreground">{PUBLISHING_HUB_UI.selectSeriesPrompt}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Font + Color Scheme */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {renderFontPicker()}
                    {renderColorSchemePicker()}
                  </div>

                  {/* Layout picker */}
                  <fieldset className="border border-border rounded-lg p-4">
                    <legend className="text-sm font-medium text-foreground mb-2">{PUBLISHING_HUB_UI.layoutLabel}</legend>
                    <div className="space-y-1.5">
                      {([SERIES_EXPORT_LAYOUTS.FULL_PAGE, SERIES_EXPORT_LAYOUTS.BOOKLET, SERIES_EXPORT_LAYOUTS.TRIFOLD] as SeriesExportLayout[]).map(layout => (
                        <label
                          key={layout}
                          className={
                            "flex items-start gap-3 cursor-pointer px-3 py-2 rounded-md border transition-colors " +
                            (seriesLayout === layout
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50")
                          }
                        >
                          <input
                            type="radio"
                            name="pub-series-layout"
                            value={layout}
                            checked={seriesLayout === layout}
                            onChange={() => setSeriesLayout(layout)}
                            className="mt-0.5 accent-primary"
                          />
                          <div>
                            <span className="text-sm font-medium text-foreground block">{SERIES_EXPORT_LAYOUT_LABELS[layout]}</span>
                            <span className="text-xs text-muted-foreground block mt-0.5">{SERIES_EXPORT_LAYOUT_DESCRIPTIONS[layout]}</span>
                            {layout === SERIES_EXPORT_LAYOUTS.BOOKLET && (
                              <span className="text-xs text-amber-600 block mt-0.5 font-medium">PDF only</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Include Group Handout checkbox -- hidden for Tri-Fold (it IS the handout) */}
                  {!isSeriesTrifold && (
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-md border border-border hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeGroupHandout}
                        onChange={(e) => setIncludeGroupHandout(e.target.checked)}
                        className="mt-0.5 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">{PUBLISHING_HUB_UI.includeGroupHandout}</span>
                    </label>
                  )}

                  {/* Economical print -- Full Page only */}
                  {seriesLayout === SERIES_EXPORT_LAYOUTS.FULL_PAGE && renderEconomicalPrint()}

                  {/* Format picker for series */}
                  <fieldset>
                    <legend className="text-sm font-medium text-foreground mb-2">{PUBLISHING_HUB_UI.formatLabel}</legend>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={
                          "flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
                          ((seriesFormat === SERIES_EXPORT_FORMATS.PDF || seriesFormat === SERIES_EXPORT_FORMATS.BOOKLET)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50")
                        }
                      >
                        <input
                          type="radio"
                          name="pub-series-format"
                          value={SERIES_EXPORT_FORMATS.PDF}
                          checked={seriesFormat === SERIES_EXPORT_FORMATS.PDF || seriesFormat === SERIES_EXPORT_FORMATS.BOOKLET || seriesFormat === SERIES_EXPORT_FORMATS.TRIFOLD}
                          onChange={() => {
                            if (isSeriesBooklet) setSeriesFormat(SERIES_EXPORT_FORMATS.BOOKLET);
                            else if (isSeriesTrifold) setSeriesFormat(SERIES_EXPORT_FORMATS.TRIFOLD);
                            else setSeriesFormat(SERIES_EXPORT_FORMATS.PDF);
                          }}
                          className="mt-0.5 accent-primary"
                        />
                        <div>
                          <span className="text-sm font-medium text-foreground block">{PUBLISHING_HUB_UI.formatPdfLabel}</span>
                          <span className="text-xs text-emerald-600 block mt-0.5 font-medium">{PUBLISHING_HUB_UI.formatPdfDescription}</span>
                        </div>
                      </label>
                      <label
                        className={
                          "flex items-start gap-3 p-3 rounded-md border transition-colors " +
                          (isSeriesBooklet || isSeriesTrifold
                            ? "opacity-50 cursor-not-allowed border-border bg-muted/30"
                            : seriesFormat === SERIES_EXPORT_FORMATS.DOCX
                              ? "cursor-pointer border-primary bg-primary/5"
                              : "cursor-pointer border-border hover:bg-muted/50")
                        }
                      >
                        <input
                          type="radio"
                          name="pub-series-format"
                          value={SERIES_EXPORT_FORMATS.DOCX}
                          checked={seriesFormat === SERIES_EXPORT_FORMATS.DOCX}
                          disabled={isSeriesBooklet || isSeriesTrifold}
                          onChange={() => setSeriesFormat(SERIES_EXPORT_FORMATS.DOCX)}
                          className="mt-0.5 accent-primary"
                        />
                        <div>
                          <span className="text-sm font-medium text-foreground block">{PUBLISHING_HUB_UI.formatDocxLabel}</span>
                          {isSeriesBooklet || isSeriesTrifold ? (
                            <span className="text-xs text-amber-600 block mt-0.5 font-medium">{PUBLISHING_HUB_UI.seriesFormatPdfOnly}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground block mt-0.5">{PUBLISHING_HUB_UI.formatDocxDescription}</span>
                          )}
                        </div>
                      </label>
                    </div>
                  </fieldset>

                  {/* Series preview panel -- full content */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{PUBLISHING_HUB_UI.previewLabel}</p>
                      <button
                        type="button"
                        onClick={() => setSeriesFullPreviewOpen(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 hover:text-foreground transition-colors"
                      >
                        <Maximize2 className="h-3 w-3" />
                        {PUBLISHING_HUB_UI.previewFullSizeButton}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{PUBLISHING_HUB_UI.previewZoomHint}</p>
                    {isSeriesTrifold ? (
                      /* ---- TRI-FOLD: DIAGRAM + CONTENT PREVIEW ---- */
                      <div>
                        {/* PART 1: Tri-Fold Diagram */}
                        <div style={{ border: `1.5px solid ${accentHex}`, borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#ffffff' }}>
                          {/* Sheet count -- prominent at top */}
                          <div style={{ fontFamily: fontOpt.cssFamily, fontSize: '15px', fontWeight: 700, color: primaryHex, textAlign: 'center', marginBottom: '12px' }}>
                            Your series will produce {seriesLessons.length} Tri-Fold {seriesLessons.length === 1 ? 'sheet' : 'sheets'} {'\u2014'} one per lesson
                          </div>

                          {/* SVG Diagram */}
                          <svg width="100%" height="160" viewBox="0 0 460 160" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', marginBottom: '8px' }}>
                            {/* Landscape sheet */}
                            <rect x="30" y="10" width="400" height="90" rx="2" fill="#ffffff" stroke={primaryHex} strokeWidth="1.5" />
                            {/* First fold line */}
                            <line x1="163" y1="10" x2="163" y2="100" stroke={accentHex} strokeWidth="1.5" strokeDasharray="6 3" />
                            {/* Second fold line */}
                            <line x1="297" y1="10" x2="297" y2="100" stroke={accentHex} strokeWidth="1.5" strokeDasharray="6 3" />
                            {/* Panel labels */}
                            <text x="96" y="55" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily={fontOpt.cssFamily}>Back</text>
                            <text x="230" y="55" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily={fontOpt.cssFamily}>Inside Left</text>
                            <text x="378" y="48" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily={fontOpt.cssFamily}>Inside Right</text>
                            <text x="378" y="62" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily={fontOpt.cssFamily}>/ Front</text>
                            {/* Fold arrows */}
                            <line x1="163" y1="108" x2="163" y2="117" stroke="#9ca3af" strokeWidth="1" />
                            <polygon points="158,117 168,117 163,123" fill="#9ca3af" />
                            <text x="163" y="135" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily={fontOpt.cssFamily}>Fold</text>
                            <line x1="297" y1="108" x2="297" y2="117" stroke="#9ca3af" strokeWidth="1" />
                            <polygon points="292,117 302,117 297,123" fill="#9ca3af" />
                            <text x="297" y="135" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily={fontOpt.cssFamily}>Fold</text>
                            {/* Bottom description */}
                            <text x="230" y="155" textAnchor="middle" fill={primaryHex} fontSize="11" fontFamily={fontOpt.cssFamily}>
                              {'8.5 \u00D7 11" sheet \u00B7 fold into thirds \u00B7 one sheet per lesson'}
                            </text>
                          </svg>

                          {/* Bullet points */}
                          <ul style={{ fontFamily: fontOpt.cssFamily, fontSize: '12px', color: '#1a1a1a', margin: '12px 0 0 18px', lineHeight: '1.8' }}>
                            <li>Each lesson produces one tri-fold sheet for group members</li>
                            <li>Contains only the Group Handout section from each lesson</li>
                            <li>Print one sheet per group member, fold into thirds</li>
                          </ul>
                        </div>

                        {/* PART 2: Content Preview */}
                        <div style={{ fontFamily: fontOpt.cssFamily, fontSize: '13px', fontWeight: 600, color: primaryHex, marginTop: '16px', marginBottom: '8px' }}>
                          Content Preview {'\u2014'} Group Handout content for each lesson
                        </div>
                        {loadingSeriesLessons ? (
                          <div className="flex items-center gap-2 py-8 text-muted-foreground" style={{ justifyContent: 'center' }}>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{PUBLISHING_HUB_UI.seriesLoadingLessons}</span>
                          </div>
                        ) : (
                          <div style={{ border: `1px solid ${accentHex}`, borderRadius: '6px', background: '#ffffff' }}>
                            <div className="preview-scroll-container" style={{
                              height: '400px',
                              overflowY: 'scroll' as const,
                              overflowX: 'hidden' as const,
                              scrollbarWidth: 'auto' as const,
                              scrollbarColor: '#9ca3af #f3f4f6',
                              padding: '16px',
                              fontFamily: fontOpt.cssFamily,
                              fontSize: '11px',
                              lineHeight: '1.4',
                              color: '#1a1a1a',
                              wordBreak: 'break-word' as const,
                              overflowWrap: 'break-word' as const,
                            }}>
                              {seriesLessons.map((sl, idx) => {
                                const lessonTitle = sl.title || sl.filters?.bible_passage || 'Untitled Lesson';
                                const handoutText = sl.original_text || '';
                                // Extract Section 8 content from lesson text
                                const section8Match = handoutText.match(/(?:##?\s*)?(?:Section\s*8[:\s]|GROUP\s+HANDOUT|Group\s+Handout)[^\n]*\n([\s\S]*?)(?=(?:##?\s*)?(?:Section\s*\d|STUDENT\s+TEASER|Student\s+Teaser)|$)/i);
                                const handoutContent = section8Match ? section8Match[1].trim() : '';
                                return (
                                  <div key={'tf-' + sl.id} style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: primaryHex, marginBottom: '6px', ...tw }}>
                                      Lesson {sl.series_lesson_number ?? idx + 1} {'\u2014'} {lessonTitle}
                                    </div>
                                    {handoutContent ? renderBookletMarkdown(handoutContent) : (
                                      <div style={{ fontSize: '11px', color: '#999999', fontStyle: 'italic', ...tw }}>
                                        Group Handout content not available for this lesson.
                                      </div>
                                    )}
                                    {idx < seriesLessons.length - 1 && (
                                      <div style={{ height: '2px', background: accentHex, opacity: 0.8, margin: '12px 0' }} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">{PUBLISHING_HUB_UI.previewNote}</p>
                      </div>
                    ) : isSeriesBooklet ? (
                      /* ---- BOOKLET: DIAGRAM + CONTENT PREVIEW ---- */
                      <div>
                        {/* PART 1: Booklet Diagram */}
                        <div style={{ border: `1.5px solid ${accentHex}`, borderRadius: '8px', padding: '16px', marginBottom: '12px', background: '#ffffff' }}>
                          {/* Page/sheet estimate -- prominent at top */}
                          <div style={{ fontFamily: fontOpt.cssFamily, fontSize: '15px', fontWeight: 700, color: primaryHex, textAlign: 'center', marginBottom: '12px' }}>
                            Your series will print as approximately {seriesLessons.length * 4} pages {'\u2014'} {Math.ceil((seriesLessons.length * 4) / 4)} sheets of paper
                          </div>

                          {/* SVG Diagram */}
                          <svg width="100%" height="140" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', marginBottom: '8px' }}>
                            {/* Sheet rectangle */}
                            <rect x="40" y="10" width="320" height="80" rx="2" fill="#ffffff" stroke={primaryHex} strokeWidth="1.5" />
                            {/* Fold line */}
                            <line x1="200" y1="10" x2="200" y2="90" stroke={accentHex} strokeWidth="1.5" strokeDasharray="6 3" />
                            {/* Left label */}
                            <text x="120" y="55" textAnchor="middle" fill={primaryHex} fontSize="10" fontFamily={fontOpt.cssFamily}>Inside pages</text>
                            {/* Right label */}
                            <text x="280" y="55" textAnchor="middle" fill={primaryHex} fontSize="10" fontFamily={fontOpt.cssFamily}>Cover</text>
                            {/* Fold arrow */}
                            <line x1="200" y1="98" x2="200" y2="107" stroke="#9ca3af" strokeWidth="1" />
                            <polygon points="195,107 205,107 200,113" fill="#9ca3af" />
                            <text x="200" y="126" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily={fontOpt.cssFamily}>Fold here</text>
                            {/* Bottom description */}
                            <text x="200" y="140" textAnchor="middle" fill={primaryHex} fontSize="11" fontFamily={fontOpt.cssFamily}>
                              {'11 \u00D7 8.5" sheet \u00B7 fold in half \u00B7 staple along the fold'}
                            </text>
                          </svg>

                          {/* Bullet points */}
                          <ul style={{ fontFamily: fontOpt.cssFamily, fontSize: '12px', color: '#1a1a1a', margin: '12px 0 0 18px', lineHeight: '1.8' }}>
                            <li>{'Prints on standard letter paper (8.5 \u00D7 11") \u2014 works on any home printer'}</li>
                            <li>{'Fold each sheet in half to create a 5.5 \u00D7 8.5" booklet'}</li>
                            <li>Staple along the center fold for a finished quarterly-style booklet</li>
                          </ul>
                        </div>

                        {/* PART 2: Booklet Spread Simulation */}
                        <div style={{ fontFamily: fontOpt.cssFamily, fontSize: '13px', fontWeight: 600, color: primaryHex, marginTop: '16px', marginBottom: '8px' }}>
                          {'Page Preview \u2014 ' + (loadingSeriesLessons ? 'Loading\u2026' : 'Scroll through your booklet spreads')}
                        </div>
                        {loadingSeriesLessons ? (
                          <div className="flex items-center gap-2 py-8 text-muted-foreground" style={{ justifyContent: 'center' }}>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{PUBLISHING_HUB_UI.seriesLoadingLessons}</span>
                          </div>
                        ) : (() => {
                          const spreads = buildBookletSpreads();
                          const halfW = 250;
                          const halfH = Math.round(halfW * (8.5 / 5.5));
                          return (
                            <div className="preview-scroll-container" style={{
                              height: '480px',
                              overflowY: 'scroll' as const,
                              overflowX: 'hidden' as const,
                              scrollbarWidth: 'auto' as const,
                              scrollbarColor: '#9ca3af #f3f4f6',
                              padding: '8px 4px',
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
                                {spreads.map((spread, si) => (
                                  <div key={'spread-' + si}>
                                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px', fontFamily: fontOpt.cssFamily }}>
                                      {'Spread ' + (si + 1) + ' of ' + spreads.length + ' \u2014 pp.\u00A0' + (si * 2 + 1) + '\u2013' + (si * 2 + 2)}
                                    </div>
                                    <div style={{
                                      display: 'flex',
                                      width: (halfW * 2) + 'px',
                                      height: halfH + 'px',
                                      border: '1px solid ' + accentHex,
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                      background: '#ffffff',
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                    }}>
                                      {/* Left half-page */}
                                      <div style={{
                                        width: halfW + 'px',
                                        minWidth: halfW + 'px',
                                        height: halfH + 'px',
                                        borderRight: '2px dashed ' + accentHex,
                                        overflow: 'hidden',
                                        background: '#ffffff',
                                        fontFamily: fontOpt.cssFamily,
                                      }}>
                                        {spread[0]}
                                      </div>
                                      {/* Right half-page */}
                                      <div style={{
                                        width: halfW + 'px',
                                        minWidth: halfW + 'px',
                                        height: halfH + 'px',
                                        overflow: 'hidden',
                                        background: '#ffffff',
                                        fontFamily: fontOpt.cssFamily,
                                      }}>
                                        {spread[1] ?? (
                                          <div style={{ padding: '14px', fontSize: '9px', color: '#d1d5db', fontStyle: 'italic' }}>Blank page</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {includeGroupHandout && (
                                  <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#888888', fontFamily: fontOpt.cssFamily, ...tw }}>
                                    Group Handout section will be appended at the end of the printed booklet.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                        <p className="text-xs text-muted-foreground mt-2">{PUBLISHING_HUB_UI.previewNote}</p>
                      </div>
                    ) : (
                      /* ---- FULL PAGE PREVIEW ---- */
                      <div>
                        <div style={pw.boxChrome}>
                          <div className="preview-scroll-container" style={pw.boxScroll}>
                            <div style={pw.boxInner}>

                              {/* LAYOUT BADGE */}
                              <div style={pw.schemeTag}>
                                FULL PAGE {' \u2014 '}{fontOpt.label.split('(')[0].trim()}
                              </div>

                              {loadingSeriesLessons ? (
                                <div className="flex items-center gap-2 py-8 text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm">{PUBLISHING_HUB_UI.seriesLoadingLessons}</span>
                                </div>
                              ) : (
                                <>
                                  {/* A. COVER PAGE BLOCK */}
                                  <div style={{ fontSize: '18px', fontWeight: 700, color: primaryHex, marginBottom: '4px', ...tw }}>
                                    {selectedSeries.series_name}
                                  </div>
                                  <div style={pw.rule} />
                                  <div style={{ fontSize: '13px', color: '#555555', marginBottom: '16px', ...tw }}>
                                    {seriesLessons.length === 1 ? '1 Lesson' : seriesLessons.length + ' Lessons'}
                                  </div>

                                  {/* B. TABLE OF CONTENTS BLOCK */}
                                  <div style={{ fontSize: ecoHeadingSize, fontWeight: 700, color: primaryHex, marginBottom: '8px', ...tw }}>
                                    Table of Contents
                                  </div>
                                  {seriesLessons.map((sl, idx) => (
                                    <div key={'toc-' + sl.id} style={{ fontSize: '13px', color: '#1a1a1a', padding: '3px 0', ...tw }}>
                                      <span style={{ fontWeight: 600, color: primaryHex, marginRight: '8px' }}>{(sl.series_lesson_number ?? idx + 1)}.</span>
                                      {sl.title || 'Untitled Lesson'}
                                    </div>
                                  ))}
                                  <div style={{ height: '2px', background: accentHex, opacity: 0.6, margin: '16px 0' }} />

                                  {/* C. FULL LESSON CONTENT */}
                                  {seriesLessons.map((sl, idx) => (
                                    <div key={'lesson-' + sl.id} style={{ marginBottom: '20px' }}>
                                      <div style={{ fontSize: ecoHeadingSize, fontWeight: 700, color: primaryHex, marginBottom: '8px', ...tw }}>
                                        Lesson {sl.series_lesson_number ?? idx + 1} {'\u2014'} {sl.title || 'Untitled Lesson'}
                                      </div>
                                      {sl.original_text ? renderMarkdownPreview(sl.original_text) : (
                                        <div style={{ fontSize: '13px', color: '#999999', fontStyle: 'italic', ...tw }}>No content available.</div>
                                      )}
                                      {idx < seriesLessons.length - 1 && (
                                        <div style={{ height: '3px', background: accentHex, opacity: 0.8, margin: '20px 0' }} />
                                      )}
                                    </div>
                                  ))}

                                  {/* D. GROUP HANDOUT NOTE */}
                                  {includeGroupHandout && (
                                    <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#888888', marginTop: '16px', ...tw }}>
                                      Group Handout section will be included at the end of this document.
                                    </div>
                                  )}

                                  {/* FOOTER */}
                                  <div style={pw.footerRow}>
                                    <span style={pw.footerText}>biblelessonspark.com</span>
                                    <span style={pw.footerText}>{SERIES_EXPORT_LAYOUT_LABELS[seriesLayout]}</span>
                                  </div>
                                </>
                              )}

                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{PUBLISHING_HUB_UI.previewNote}</p>
                      </div>
                    )}
                  </div>

                  {renderDownloadButton(handleSeriesDownload)}
                  {renderShareControls('lesson_series', selectedSeries.id, selectedSeries.share_token, selectedSeries.share_token_handout)}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Full Size Series Preview Modal -- full content */}
      {seriesFullPreviewOpen && selectedSeries && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setSeriesFullPreviewOpen(false); }}
        >
          <div className="relative bg-background rounded-lg shadow-2xl w-full my-4" style={{ maxWidth: '816px' }}>

            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{selectedSeries.series_name}</h3>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{fontOpt.label.split('(')[0].trim()}</span>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded text-white" style={{ background: primaryHex }}>{scheme.label}</span>
              </div>
              <button
                type="button"
                onClick={() => setSeriesFullPreviewOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 hover:text-foreground transition-colors shrink-0 ml-3"
              >
                <X className="h-3 w-3" />
                {PUBLISHING_HUB_UI.closePreview}
              </button>
            </div>
            <p className="text-xs text-muted-foreground px-6 py-2 border-b border-border bg-muted/20">
              {PUBLISHING_HUB_UI.previewModalInstruction}
            </p>

            {/* Document area */}
            <div
              className="preview-scroll-container"
              style={{
                height: '90vh',
                overflowY: 'scroll' as const,
                overflowX: 'hidden' as const,
                background: (isSeriesBooklet || isSeriesTrifold) ? '#ffffff' : '#ffffff',
                scrollbarWidth: 'auto' as const,
                scrollbarColor: '#9ca3af #f3f4f6',
              }}
            >
              {isSeriesTrifold ? (
                /* Tri-Fold: Group Handout content preview in modal */
                <div style={{
                  padding: '48px',
                  fontFamily: fontOpt.cssFamily,
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#1a1a1a',
                  wordBreak: 'break-word' as const,
                  overflowWrap: 'break-word' as const,
                }}>
                  {seriesLessons.map((sl, idx) => {
                    const lessonTitle = sl.title || sl.filters?.bible_passage || 'Untitled Lesson';
                    const handoutText = sl.original_text || '';
                    const section8Match = handoutText.match(/(?:##?\s*)?(?:Section\s*8[:\s]|GROUP\s+HANDOUT|Group\s+Handout)[^\n]*\n([\s\S]*?)(?=(?:##?\s*)?(?:Section\s*\d|STUDENT\s+TEASER|Student\s+Teaser)|$)/i);
                    const handoutContent = section8Match ? section8Match[1].trim() : '';
                    return (
                      <div key={'fstf-' + sl.id} style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: primaryHex, marginBottom: '8px', ...tw }}>
                          Lesson {sl.series_lesson_number ?? idx + 1} {'\u2014'} {lessonTitle}
                        </div>
                        {handoutContent ? renderMarkdownPreview(handoutContent) : (
                          <div style={{ fontSize: '13px', color: '#999999', fontStyle: 'italic', ...tw }}>
                            Group Handout content not available for this lesson.
                          </div>
                        )}
                        {idx < seriesLessons.length - 1 && (
                          <div style={{ height: '3px', background: accentHex, opacity: 0.8, margin: '24px 0' }} />
                        )}
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #e5e7eb', marginTop: '20px' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>biblelessonspark.com</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{SERIES_EXPORT_LAYOUT_LABELS[seriesLayout]}</span>
                  </div>
                </div>
              ) : isSeriesBooklet ? (
                /* Booklet: full content preview (no diagram in modal) */
                <div style={{
                  padding: '48px',
                  fontFamily: fontOpt.cssFamily,
                  fontSize: '12px',
                  lineHeight: '1.4',
                  color: '#1a1a1a',
                  wordBreak: 'break-word' as const,
                  overflowWrap: 'break-word' as const,
                }}>
                  {/* Cover */}
                  <div style={{ fontSize: '22px', fontWeight: 700, color: primaryHex, marginBottom: '6px', ...tw }}>
                    {selectedSeries.series_name}
                  </div>
                  <div style={{ height: '2px', background: accentHex, opacity: 0.6, marginBottom: '16px' }} />
                  <div style={{ fontSize: '13px', color: '#555555', marginBottom: '24px', ...tw }}>
                    {seriesLessons.length === 1 ? '1 Lesson' : seriesLessons.length + ' Lessons'}
                  </div>

                  {/* Table of Contents */}
                  <div style={{ fontSize: '16px', fontWeight: 700, color: primaryHex, marginBottom: '10px', ...tw }}>
                    Table of Contents
                  </div>
                  {seriesLessons.map((sl, idx) => (
                    <div key={'fsbktoc-' + sl.id} style={{ fontSize: '13px', color: '#1a1a1a', padding: '3px 0', ...tw }}>
                      <span style={{ fontWeight: 600, color: primaryHex, marginRight: '8px' }}>{(sl.series_lesson_number ?? idx + 1)}.</span>
                      {sl.title || 'Untitled Lesson'}
                    </div>
                  ))}
                  <div style={{ height: '2px', background: accentHex, opacity: 0.6, margin: '20px 0' }} />

                  {/* Full lesson content */}
                  {seriesLessons.map((sl, idx) => (
                    <div key={'fsbklesson-' + sl.id} style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: primaryHex, marginBottom: '8px', ...tw }}>
                        Lesson {sl.series_lesson_number ?? idx + 1} {'\u2014'} {sl.title || 'Untitled Lesson'}
                      </div>
                      {sl.original_text ? renderMarkdownPreview(sl.original_text) : (
                        <div style={{ fontSize: '13px', color: '#999999', fontStyle: 'italic', ...tw }}>No content available.</div>
                      )}
                      {idx < seriesLessons.length - 1 && (
                        <div style={{ height: '3px', background: accentHex, opacity: 0.8, margin: '24px 0' }} />
                      )}
                    </div>
                  ))}

                  {/* Group handout note */}
                  {includeGroupHandout && (
                    <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#888888', marginTop: '16px', ...tw }}>
                      Group Handout section will be included at the end of this document.
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #e5e7eb', marginTop: '20px' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>biblelessonspark.com</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{SERIES_EXPORT_LAYOUT_LABELS[seriesLayout]}</span>
                  </div>
                </div>
              ) : (
                /* Full Page: standard scrollable content */
                <div style={{
                  padding: economicalPrint ? '60px' : '96px',
                  fontFamily: fontOpt.cssFamily,
                  fontSize: economicalPrint ? '12px' : '14px',
                  lineHeight: economicalPrint ? '1.3' : '1.6',
                  color: '#1a1a1a',
                  wordBreak: 'break-word' as const,
                  overflowWrap: 'break-word' as const,
                }}>

                  {/* COVER PAGE */}
                  <div style={{ fontSize: '28px', fontWeight: 700, color: primaryHex, marginBottom: '8px', ...tw }}>
                    {selectedSeries.series_name}
                  </div>
                  <div style={{ height: '2px', background: accentHex, opacity: 0.6, marginBottom: '20px' }} />
                  <div style={{ fontSize: '14px', color: '#555555', marginBottom: '30px', ...tw }}>
                    {seriesLessons.length === 1 ? '1 Lesson' : seriesLessons.length + ' Lessons'}
                  </div>

                  {/* TABLE OF CONTENTS */}
                  <div style={{ fontSize: '18px', fontWeight: 700, color: primaryHex, marginBottom: '12px', ...tw }}>
                    Table of Contents
                  </div>
                  {seriesLessons.map((sl, idx) => (
                    <div key={'fstoc-' + sl.id} style={{ fontSize: '14px', color: '#1a1a1a', padding: '4px 0', ...tw }}>
                      <span style={{ fontWeight: 600, color: primaryHex, marginRight: '10px' }}>{(sl.series_lesson_number ?? idx + 1)}.</span>
                      {sl.title || 'Untitled Lesson'}
                    </div>
                  ))}
                  <div style={{ height: '2px', background: accentHex, opacity: 0.6, margin: '24px 0' }} />

                  {/* FULL LESSON CONTENT */}
                  {seriesLessons.map((sl, idx) => (
                    <div key={'fslesson-' + sl.id} style={{ marginBottom: '30px' }}>
                      <div style={{ fontSize: economicalPrint ? '16px' : '18px', fontWeight: 700, color: primaryHex, marginBottom: '12px', ...tw }}>
                        Lesson {sl.series_lesson_number ?? idx + 1} {'\u2014'} {sl.title || 'Untitled Lesson'}
                      </div>
                      {sl.original_text ? renderMarkdownPreview(sl.original_text) : (
                        <div style={{ fontSize: '14px', color: '#999999', fontStyle: 'italic', ...tw }}>No content available.</div>
                      )}
                      {idx < seriesLessons.length - 1 && (
                        <div style={{ height: '3px', background: accentHex, opacity: 0.8, margin: '30px 0' }} />
                      )}
                    </div>
                  ))}

                  {/* GROUP HANDOUT NOTE */}
                  {includeGroupHandout && (
                    <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#888888', marginTop: '20px', ...tw }}>
                      Group Handout section will be included at the end of this document.
                    </div>
                  )}

                  {/* FOOTER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid #e5e7eb', marginTop: '24px' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>biblelessonspark.com</span>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>{SERIES_EXPORT_LAYOUT_LABELS[seriesLayout]}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Full Size Preview Modal (lessons and devotionals) */}

      {showFullPreview && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setFullPreviewOpen(false); }}
        >
          <div className="relative bg-background rounded-lg shadow-2xl w-full my-4" style={{ maxWidth: '816px' }}>

            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{fullPreviewTitle}</h3>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{fontOpt.label.split('(')[0].trim()}</span>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded text-white" style={{ background: primaryHex }}>{scheme.label}</span>
              </div>
              <button
                type="button"
                onClick={() => setFullPreviewOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 hover:text-foreground transition-colors shrink-0 ml-3"
              >
                <X className="h-3 w-3" />
                {PUBLISHING_HUB_UI.closePreview}
              </button>
            </div>
            <p className="text-xs text-muted-foreground px-6 py-2 border-b border-border bg-muted/20">
              {PUBLISHING_HUB_UI.previewModalInstruction}
            </p>

            {/* Document area */}
            <div
              className="preview-scroll-container"
              style={{
                height: '90vh',
                overflowY: 'scroll' as const,
                overflowX: 'hidden' as const,
                background: '#ffffff',
                scrollbarWidth: 'auto' as const,
                scrollbarColor: '#9ca3af #f3f4f6',
              }}
            >
              <div style={{
                paddingTop:    economicalPrint ? Math.round(ECONOMICAL_PRINT.margins.top * (96 / 72)) + 'px'    : '96px',
                paddingBottom: economicalPrint ? Math.round(ECONOMICAL_PRINT.margins.bottom * (96 / 72)) + 'px' : '96px',
                paddingLeft:   economicalPrint ? Math.round(ECONOMICAL_PRINT.margins.left * (96 / 72)) + 'px'   : '96px',
                paddingRight:  economicalPrint ? Math.round(ECONOMICAL_PRINT.margins.right * (96 / 72)) + 'px'  : '96px',
                fontFamily: fontOpt.cssFamily,
                fontSize: economicalPrint ? '12px' : '14px',
                lineHeight: economicalPrint ? '1.3' : '1.6',
                color: '#1a1a1a',
                wordBreak: 'break-word' as const,
                overflowWrap: 'break-word' as const,
              }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px', ...tw }}>{fullPreviewTitle}</div>
                {fullPreviewPassage && (
                  <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#555555', marginBottom: '12px', ...tw }}>{fullPreviewPassage}</div>
                )}
                <div style={{ height: '2px', background: accentHex, opacity: 0.6, marginBottom: '20px' }} />
                {renderMarkdownPreview(fullPreviewRaw)}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
    </AppShell>
  );
}
