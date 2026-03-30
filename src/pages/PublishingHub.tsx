// src/pages/PublishingHub.tsx
// Phase D Part 2: Publishing Hub -- lessons, devotionals, and series.
// SSOT: publishingHubConfig.ts for all UI strings and defaults.
// SSOT: seriesExportConfig.ts for fonts, color schemes, layouts.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Printer, Loader2, Maximize2, X, Search } from "lucide-react";
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
}

interface DevotionalRow {
  id: string;
  title: string | null;
  bible_passage: string;
  content: string | null;
  created_at: string;
}

interface SeriesRow {
  id: string;
  series_name: string;
  created_at: string;
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
        .select('id, title, original_text, created_at, filters, metadata')
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
        .select('id, title, bible_passage, content, created_at')
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
        .select('id, series_name, created_at')
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
    else if (isSeriesTrifold) setSeriesFormat(SERIES_EXPORT_FORMATS.PDF);
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
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];

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
        elements.push(
          <div key={'hr-' + i} style={{ height: '1px', backgroundColor: accentHex, margin: '12px 0', width: '100%' }} />
        );
        continue;
      }

      // ## Heading
      if (trimmed.startsWith('## ')) {
        const headingText = trimmed.slice(3);
        elements.push(
          <div
            key={'h-' + i}
            style={{
              fontSize: ecoSubheadSize, fontWeight: 700, color: primaryHex,
              letterSpacing: '0.03em', marginTop: '10px', marginBottom: '4px',
              ...textContainStyle,
            }}
          >
            {renderInlineText(headingText, 'hi-' + i)}
          </div>
        );
        continue;
      }

      // # Heading (single hash)
      if (trimmed.startsWith('# ')) {
        const headingText = trimmed.slice(2);
        elements.push(
          <div
            key={'h1-' + i}
            style={{
              fontSize: ecoHeadingSize, fontWeight: 700, color: primaryHex,
              marginTop: '12px', marginBottom: '4px',
              ...textContainStyle,
            }}
          >
            {renderInlineText(headingText, 'h1i-' + i)}
          </div>
        );
        continue;
      }

      // Normal paragraph with inline bold
      elements.push(
        <div key={'p-' + i} style={{ marginBottom: '4px', ...textContainStyle }}>
          {renderInlineText(trimmed, 'pi-' + i)}
        </div>
      );
    }

    return elements;
  }

  // --------------------------------------------------------------------------
  // BOOKLET SHEET SIMULATION
  // --------------------------------------------------------------------------

  interface BookletPage {
    pageNumber: number;
    content: React.ReactNode;
    isBlank?: boolean;
  }

  function buildBookletPages(): BookletPage[] {
    const pages: BookletPage[] = [];
    let pageNum = 1;

    // Page 1 -- Front Cover
    pages.push({
      pageNumber: pageNum++,
      content: (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: primaryHex, marginBottom: '4px', ...tw }}>
            {selectedSeries?.series_name || 'Series'}
          </div>
          <div style={{ height: '1px', background: accentHex, opacity: 0.6, margin: '6px 0' }} />
          <div style={{ fontSize: '9px', color: '#555555', marginBottom: '4px', ...tw }}>
            {seriesLessons.length === 1 ? '1 Lesson' : seriesLessons.length + ' Lessons'}
          </div>
          <div style={{ fontSize: '8px', color: '#9ca3af', ...tw }}>biblelessonspark.com</div>
        </div>
      ),
    });

    // Page 2 -- Table of Contents
    pages.push({
      pageNumber: pageNum++,
      content: (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: primaryHex, marginBottom: '6px', ...tw }}>Table of Contents</div>
          {seriesLessons.map((sl, idx) => (
            <div key={'bktoc-' + sl.id} style={{ fontSize: '10px', color: '#1a1a1a', padding: '2px 0', ...tw }}>
              <span style={{ fontWeight: 600, color: primaryHex, marginRight: '5px' }}>{(sl.series_lesson_number ?? idx + 1)}.</span>
              {sl.title || 'Untitled Lesson'}
            </div>
          ))}
        </div>
      ),
    });

    // Lesson content pages -- split into ~2500 char chunks
    for (let li = 0; li < seriesLessons.length; li++) {
      const sl = seriesLessons[li];
      const raw = sl.original_text || '';
      const lessonNum = sl.series_lesson_number ?? li + 1;
      const lessonTitle = sl.title || 'Untitled Lesson';

      if (!raw) {
        pages.push({
          pageNumber: pageNum++,
          content: (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: primaryHex, marginBottom: '4px', ...tw }}>
                Lesson {lessonNum} {'\u2014'} {lessonTitle}
              </div>
              <div style={{ fontSize: '10px', color: '#999999', fontStyle: 'italic', ...tw }}>No content available.</div>
            </div>
          ),
        });
        continue;
      }

      // Split into chunks by lines, roughly 2500 chars per half-page
      const lines = raw.split('\n');
      const chunks: string[][] = [];
      let currentChunk: string[] = [];
      let currentLen = 0;

      for (const line of lines) {
        if (currentLen + line.length > 2500 && currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = [];
          currentLen = 0;
        }
        currentChunk.push(line);
        currentLen += line.length;
      }
      if (currentChunk.length > 0) chunks.push(currentChunk);

      for (let ci = 0; ci < chunks.length; ci++) {
        const chunkText = chunks[ci].join('\n');
        const isFirst = ci === 0;
        pages.push({
          pageNumber: pageNum++,
          content: (
            <div>
              {isFirst && (
                <div style={{ fontSize: '12px', fontWeight: 700, color: primaryHex, marginBottom: '4px', ...tw }}>
                  Lesson {lessonNum} {'\u2014'} {lessonTitle}
                </div>
              )}
              {renderBookletContent(chunkText)}
            </div>
          ),
        });
      }
    }

    // Final page -- Back Cover
    pages.push({
      pageNumber: pageNum++,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', ...tw, textAlign: 'center' as const }}>
            {selectedSeries?.series_name || 'Series'}
          </div>
          <div style={{ fontSize: '9px', color: '#ffffffcc', marginTop: '4px', ...tw, textAlign: 'center' as const }}>
            biblelessonspark.com
          </div>
        </div>
      ),
    });

    // Pad to even number
    if (pages.length % 2 !== 0) {
      pages.push({ pageNumber: pageNum++, content: <div />, isBlank: true });
    }

    return pages;
  }

  /** Render booklet content lines with markdown-like formatting at small scale */
  function renderBookletContent(raw: string): React.ReactNode {
    const lines = raw.split('\n');
    return (
      <>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (trimmed === '') return <div key={i} style={{ height: '3px' }} />;
          if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            return <div key={i} style={{ height: '1px', backgroundColor: accentHex, margin: '4px 0', width: '100%' }} />;
          }
          if (trimmed.startsWith('## ')) {
            return (
              <div key={i} style={{ fontSize: '11px', fontWeight: 700, color: primaryHex, marginTop: '3px', marginBottom: '2px', ...tw }}>
                {renderInlineText(trimmed.slice(3), 'bkh-' + i)}
              </div>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <div key={i} style={{ fontSize: '12px', fontWeight: 700, color: primaryHex, marginTop: '4px', marginBottom: '2px', ...tw }}>
                {renderInlineText(trimmed.slice(2), 'bkh1-' + i)}
              </div>
            );
          }
          return (
            <div key={i} style={{ marginBottom: '1px', ...tw }}>
              {renderInlineText(trimmed, 'bkp-' + i)}
            </div>
          );
        })}
      </>
    );
  }

  /** Render booklet sheets -- pairs of pages side by side */
  function renderBookletSheets(maxSheetWidth: string): React.ReactNode {
    const pages = buildBookletPages();
    const sheets: { left: BookletPage; right: BookletPage }[] = [];
    for (let i = 0; i < pages.length; i += 2) {
      sheets.push({ left: pages[i], right: pages[i + 1] });
    }

    const halfPageStyle: React.CSSProperties = {
      width: '50%',
      height: '100%',
      padding: '10px 12px',
      overflow: 'hidden',
      position: 'relative',
      fontSize: '10px',
      lineHeight: '1.3',
      fontFamily: fontOpt.cssFamily,
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      color: '#1a1a1a',
    };

    // Track which page number is the back cover for primary-color background
    const lastRealPage = pages.filter(p => !p.isBlank).pop();
    const backCoverNum = lastRealPage?.pageNumber ?? -1;

    return (
      <>
        {sheets.map((sheet, si) => (
          <div key={'sheet-' + si}>
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>
              Sheet {si + 1} of {sheets.length} {'\u2014'} Reading pages {sheet.left.pageNumber} and {sheet.right.pageNumber}
            </div>
            {/* Outer wrapper for max-width centering */}
            <div style={{ width: '100%', maxWidth: maxSheetWidth, margin: '0 auto 24px auto' }}>
              {/* Padding-bottom trick for landscape aspect ratio (8.5/11 = 77.27%) */}
              <div style={{ width: '100%', paddingBottom: '77.3%', position: 'relative' }}>
                {/* Absolute inner container */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex',
                  flexDirection: 'row',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  {/* Left half */}
                  <div style={{
                    ...halfPageStyle,
                    borderRight: '1px dashed #d1d5db',
                    ...(sheet.left.pageNumber === backCoverNum ? { background: primaryHex, color: '#ffffff' } : {}),
                  }}>
                    {sheet.left.content}
                  </div>
                  {/* Right half */}
                  <div style={{
                    ...halfPageStyle,
                    ...(sheet.right.pageNumber === backCoverNum ? { background: primaryHex, color: '#ffffff' } : {}),
                    ...(sheet.right.isBlank ? { background: '#fafafa' } : {}),
                  }}>
                    {sheet.right.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', fontStyle: 'italic', color: '#6b7280' }}>
          Preview shows content in reading order. When printed double-sided and folded, pages will automatically arrange in the correct booklet order. Print double-sided, fold in half, and staple along the center fold.
        </div>
      </>
    );
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
              (l) => l.title || 'Untitled Lesson',
              (l) => getPassageDisplay(l),
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
                  {renderEconomicalPrint()}
                  {renderContentPreview(devPreviewTitle, devPreviewShortTitle, devPreviewPassage, devPreviewRawText)}
                  {renderDownloadButton(handleDevotionalDownload)}
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
                      {([SERIES_EXPORT_LAYOUTS.FULL_PAGE, SERIES_EXPORT_LAYOUTS.BOOKLET] as SeriesExportLayout[]).map(layout => (
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
                      {/* Tri-Fold -- Coming Soon (not yet implemented) */}
                      <div className="flex items-start gap-3 px-3 py-2 rounded-md border border-border bg-muted/30 opacity-60 cursor-not-allowed">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground block">
                            Tri-Fold Group Handout
                            <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">Coming Soon</span>
                          </span>
                          <span className="text-xs text-muted-foreground block mt-0.5">One page per lesson showing only the Group Handout {'\u2014'} available soon</span>
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  {/* Include Group Handout checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-md border border-border hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeGroupHandout}
                      onChange={(e) => setIncludeGroupHandout(e.target.checked)}
                      className="mt-0.5 accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{PUBLISHING_HUB_UI.includeGroupHandout}</span>
                  </label>

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
                          checked={seriesFormat === SERIES_EXPORT_FORMATS.PDF || seriesFormat === SERIES_EXPORT_FORMATS.BOOKLET}
                          onChange={() => {
                            if (isSeriesBooklet) setSeriesFormat(SERIES_EXPORT_FORMATS.BOOKLET);
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
                          (isSeriesBooklet
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
                          disabled={isSeriesBooklet}
                          onChange={() => setSeriesFormat(SERIES_EXPORT_FORMATS.DOCX)}
                          className="mt-0.5 accent-primary"
                        />
                        <div>
                          <span className="text-sm font-medium text-foreground block">{PUBLISHING_HUB_UI.formatDocxLabel}</span>
                          {isSeriesBooklet ? (
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
                    {isSeriesBooklet ? (
                      /* ---- BOOKLET SHEET SIMULATION ---- */
                      <div>
                        <div style={pw.boxChrome}>
                          <div className="preview-scroll-container" style={{ ...pw.boxScroll, background: '#e5e7eb', padding: '20px' }}>
                            {loadingSeriesLessons ? (
                              <div className="flex items-center gap-2 py-8 text-muted-foreground" style={{ justifyContent: 'center' }}>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">{PUBLISHING_HUB_UI.seriesLoadingLessons}</span>
                              </div>
                            ) : (
                              renderBookletSheets('680px')
                            )}
                          </div>
                        </div>
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
                background: isSeriesBooklet ? '#e5e7eb' : '#ffffff',
                scrollbarWidth: 'auto' as const,
                scrollbarColor: '#9ca3af #f3f4f6',
              }}
            >
              {isSeriesBooklet ? (
                /* Booklet: sheet simulation at larger scale */
                <div style={{ padding: '24px' }}>
                  {renderBookletSheets('860px')}
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
  );
}
