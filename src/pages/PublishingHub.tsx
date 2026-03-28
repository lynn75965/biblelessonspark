// src/pages/PublishingHub.tsx
// Phase D Part 1: Publishing Hub -- lesson content only.
// SSOT: publishingHubConfig.ts for all UI strings and defaults.
// SSOT: seriesExportConfig.ts for fonts, color schemes.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Printer, Loader2, Maximize2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { exportToPdf } from "@/utils/exportToPdf";
import { exportToDocx } from "@/utils/exportToDocx";
import {
  BOOKLET_COLOR_SCHEMES,
  SERIES_EXPORT_FONT_OPTIONS,
  ECONOMICAL_PRINT,
  getColorScheme,
  getFontOption,
} from "@/constants/seriesExportConfig";
import type { FontId, ColorSchemeId } from "@/constants/seriesExportConfig";
import {
  PUBLISHING_HUB_CONTENT_TYPES,
  PUBLISHING_HUB_FORMATS,
  PUBLISHING_HUB_DEFAULTS,
  PUBLISHING_HUB_STORAGE_KEY,
  PUBLISHING_HUB_UI,
} from "@/constants/publishingHubConfig";
import type { PublishingContentType, PublishingFormat } from "@/constants/publishingHubConfig";

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

  // Selected lesson
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Pickers -- initialized from localStorage or defaults
  const [selectedFont, setSelectedFont] = useState<FontId>(PUBLISHING_HUB_DEFAULTS.fontId);
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorSchemeId>(PUBLISHING_HUB_DEFAULTS.colorSchemeId);
  const [selectedFormat, setSelectedFormat] = useState<PublishingFormat>(PUBLISHING_HUB_DEFAULTS.format);

  // Economical print
  const [economicalPrint, setEconomicalPrint] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Full size preview modal
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

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
  // DEEP LINK: ?type=lesson&id=xxx
  // --------------------------------------------------------------------------

  useEffect(() => {
    const paramType = searchParams.get('type');
    const paramId = searchParams.get('id');
    if (paramType === 'lesson' && paramId) {
      setContentType(PUBLISHING_HUB_CONTENT_TYPES.LESSONS);
      setSelectedLessonId(paramId);
    }
  }, [searchParams]);

  // --------------------------------------------------------------------------
  // EXPORT HANDLER
  // --------------------------------------------------------------------------

  const selectedLesson = lessons.find(l => l.id === selectedLessonId) || null;

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

  const handleDownload = async () => {
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

  const previewRef = useRef<HTMLDivElement>(null);

  // Diagnostic: log scroll dimensions when selected lesson changes
  useEffect(() => {
    if (previewRef.current) {
      console.log('Preview scrollHeight:', previewRef.current.scrollHeight, 'clientHeight:', previewRef.current.clientHeight);
    }
  }, [selectedLessonId, economicalPrint]);

  // Preview panel values (computed once, used in inline JSX below)
  const previewTitle      = selectedLesson?.title || 'Your Lesson Title';
  const previewShortTitle = previewTitle.length > 50 ? previewTitle.slice(0, 50) + '...' : previewTitle;
  const previewPassage    = selectedLesson ? getPassageDisplay(selectedLesson) : '';
  const previewRawText    = selectedLesson?.original_text || '';

  // --------------------------------------------------------------------------
  // CONTENT TYPE TABS
  // --------------------------------------------------------------------------

  const tabs: { key: PublishingContentType; label: string }[] = [
    { key: PUBLISHING_HUB_CONTENT_TYPES.LESSONS,     label: PUBLISHING_HUB_UI.tabLessons },
    { key: PUBLISHING_HUB_CONTENT_TYPES.DEVOTIONALS, label: PUBLISHING_HUB_UI.tabDevotionals },
    { key: PUBLISHING_HUB_CONTENT_TYPES.SERIES,      label: PUBLISHING_HUB_UI.tabSeries },
  ];

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
              onClick={() => { setContentType(tab.key); setSelectedLessonId(null); }}
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

        {/* COMING SOON for Devotionals and Series */}
        {contentType !== PUBLISHING_HUB_CONTENT_TYPES.LESSONS && (
          <div className="text-center py-16">
            <p className="text-lg font-medium text-muted-foreground">{PUBLISHING_HUB_UI.comingSoon}</p>
            <p className="text-sm text-muted-foreground mt-1">{PUBLISHING_HUB_UI.comingSoonDescription}</p>
          </div>
        )}

        {/* LESSONS CONTENT */}
        {contentType === PUBLISHING_HUB_CONTENT_TYPES.LESSONS && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: Lesson selector */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">
                    {PUBLISHING_HUB_UI.tabLessons}
                  </h2>
                </div>
                <div className="max-h-[480px] overflow-y-auto">
                  {loadingLessons && (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{PUBLISHING_HUB_UI.loadingLessons}</span>
                    </div>
                  )}
                  {!loadingLessons && lessons.length === 0 && (
                    <p className="text-sm text-muted-foreground px-4 py-8 text-center">
                      {PUBLISHING_HUB_UI.emptyLessons}
                    </p>
                  )}
                  {!loadingLessons && lessons.map(lesson => {
                    const isSelected = lesson.id === selectedLessonId;
                    const passage = getPassageDisplay(lesson);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLessonId(lesson.id)}
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
                          {lesson.title || 'Untitled Lesson'}
                        </p>
                        {passage && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{passage}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(lesson.created_at)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Publishing controls */}
            <div className="lg:col-span-2">
              {!selectedLesson ? (
                <div className="border border-border rounded-lg flex items-center justify-center py-20">
                  <p className="text-muted-foreground">{PUBLISHING_HUB_UI.selectPrompt}</p>
                </div>
              ) : (
                <div className="space-y-5">

                  {/* ROW 1: Font picker + Color scheme picker side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Font picker */}
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

                    {/* Color scheme picker */}
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
                  </div>

                  {/* ROW 2: Format picker -- two cards side by side */}
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

                  {/* Economical Print toggle */}
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

                  {/* ROW 3: Preview -- full width */}
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
                        <div style={pw.lessonTitle}>{previewTitle}</div>
                        {previewPassage && <div style={pw.scripture}>{previewPassage}</div>}
                        <div style={pw.rule} />
                        {previewRawText ? renderMarkdownPreview(previewRawText) : <div style={tw}>No lesson content available.</div>}
                        <div style={pw.footerRow}>
                          <span style={pw.footerText}>{previewShortTitle}</span>
                          <span style={pw.footerText}>biblelessonspark.com {'\u2014'} 1</span>
                        </div>
                      </div>
                    </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{PUBLISHING_HUB_UI.previewNote}</p>
                  </div>

                  {/* Download button -- full width */}
                  <button
                    type="button"
                    onClick={handleDownload}
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

                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Full Size Preview Modal */}
      {fullPreviewOpen && selectedLesson && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setFullPreviewOpen(false); }}
        >
          <div className="relative bg-background rounded-lg shadow-2xl w-full my-4" style={{ maxWidth: '816px' }}>

            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{selectedLesson.title}</h3>
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
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px', ...tw }}>{selectedLesson.title}</div>
                {getPassageDisplay(selectedLesson) && (
                  <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#555555', marginBottom: '12px', ...tw }}>{getPassageDisplay(selectedLesson)}</div>
                )}
                <div style={{ height: '2px', background: accentHex, opacity: 0.6, marginBottom: '20px' }} />
                {renderMarkdownPreview(selectedLesson.original_text)}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
