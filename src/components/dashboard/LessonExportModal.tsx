// src/components/dashboard/LessonExportModal.tsx
// Font and color scheme picker for single-lesson PDF/DOCX export.
// SSOT: seriesExportConfig.ts for all font and color scheme definitions.
// Mirrors the picker UI pattern from SeriesExportModal.tsx.

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  BOOKLET_COLOR_SCHEMES,
  SERIES_EXPORT_FONT_OPTIONS,
  SERIES_EXPORT_DEFAULT_FONT,
  SERIES_EXPORT_DEFAULT_COLOR_SCHEME,
} from "@/constants/seriesExportConfig";
import type { FontId, ColorSchemeId } from "@/constants/seriesExportConfig";
import { exportToPdf } from "@/utils/exportToPdf";
import { exportToDocx } from "@/utils/exportToDocx";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// TYPES -- mirror LessonExportButtons so the same lesson object works
// ============================================================================

interface LessonMetadata {
  teaser?: string | null;
  ageGroup?: string;
  theologyProfile?: string;
  bibleVersion?: string;
  bibleVersionAbbreviation?: string;
  copyrightStatus?: string;
  copyrightNotice?: string | null;
}

interface LessonData {
  title: string;
  original_text: string;
  metadata?: LessonMetadata | null;
}

interface LessonExportModalProps {
  lesson:        LessonData;
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  /** Called after a successful download (e.g. to increment usage counters) */
  onExport?:     () => void;
}

type ExportFormat = "pdf" | "docx";

// ============================================================================
// COMPONENT
// ============================================================================

export function LessonExportModal({
  lesson,
  open,
  onOpenChange,
  onExport,
}: LessonExportModalProps) {
  const [selectedFont,        setSelectedFont]        = useState<FontId>(SERIES_EXPORT_DEFAULT_FONT);
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorSchemeId>(SERIES_EXPORT_DEFAULT_COLOR_SCHEME);
  const [selectedFormat,      setSelectedFormat]      = useState<ExportFormat | null>(null);
  const [exporting,           setExporting]           = useState(false);
  const { toast } = useToast();

  if (!open) return null;

  // Build copyright line the same way LessonExportButtons previously did
  const getCopyrightLine = (): string | undefined => {
    if (lesson.metadata?.copyrightNotice) return lesson.metadata.copyrightNotice;
    if (lesson.metadata?.bibleVersion) {
      if (lesson.metadata.copyrightStatus === "public_domain") {
        return `Scripture quotations are from the ${lesson.metadata.bibleVersion} (${lesson.metadata.bibleVersionAbbreviation || ""}).`;
      }
      return `Scripture quotations are from the ${lesson.metadata.bibleVersion}.`;
    }
    return undefined;
  };

  const exportMeta = {
    passage:                  lesson.title,
    ageGroup:                 lesson.metadata?.ageGroup,
    theology:                 lesson.metadata?.theologyProfile,
    bibleVersion:             lesson.metadata?.bibleVersion,
    bibleVersionAbbreviation: lesson.metadata?.bibleVersionAbbreviation,
    copyrightNotice:          getCopyrightLine(),
  };

  const handleDownload = async () => {
    if (!selectedFormat || exporting) return;
    setExporting(true);
    try {
      if (selectedFormat === "pdf") {
        await exportToPdf({
          title:         lesson.title,
          content:       lesson.original_text,
          teaserContent: lesson.metadata?.teaser || undefined,
          metadata:      exportMeta,
          fontId:        selectedFont,
          colorSchemeId: selectedColorScheme,
        });
        toast({ title: "PDF downloaded" });
      } else {
        await exportToDocx({
          title:         lesson.title,
          content:       lesson.original_text,
          teaserContent: lesson.metadata?.teaser || undefined,
          metadata:      exportMeta,
          fontId:        selectedFont,
          colorSchemeId: selectedColorScheme,
        });
        toast({ title: "Document downloaded" });
      }
      if (onExport) onExport();
      onOpenChange(false);
    } catch {
      toast({
        title:       "Export failed",
        description: "Unable to export. Please try again.",
        variant:     "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const canDownload = selectedFormat !== null && !exporting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !exporting) onOpenChange(false);
      }}
    >
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Download Lesson</h2>
          <button
            onClick={() => !exporting && onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
            disabled={exporting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">

          {/* Font picker */}
          <fieldset>
            <legend className="text-sm font-medium text-foreground mb-2">Body Font</legend>
            <div className="space-y-1.5">
              {SERIES_EXPORT_FONT_OPTIONS.map((f) => (
                <label
                  key={f.id}
                  className={"flex items-center gap-3 cursor-pointer px-3 py-2 rounded-md border transition-colors " +
                    (selectedFont === f.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50")}
                >
                  <input
                    type="radio"
                    name="lesson-export-font"
                    value={f.id}
                    checked={selectedFont === f.id}
                    onChange={() => setSelectedFont(f.id as FontId)}
                    className="accent-primary"
                  />
                  <span style={{ fontFamily: f.cssFamily, fontSize: "14px" }} className="text-foreground">
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Color scheme picker */}
          <fieldset>
            <legend className="text-sm font-medium text-foreground mb-1">Color Scheme</legend>
            <p className="text-xs text-muted-foreground mb-2">Applies to headings and decorative elements.</p>
            <div className="space-y-1.5">
              {BOOKLET_COLOR_SCHEMES.map((cs) => (
                <label
                  key={cs.id}
                  className={"flex items-center gap-3 cursor-pointer px-3 py-2 rounded-md border transition-colors " +
                    (selectedColorScheme === cs.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50")}
                >
                  <input
                    type="radio"
                    name="lesson-export-color"
                    value={cs.id}
                    checked={selectedColorScheme === cs.id}
                    onChange={() => setSelectedColorScheme(cs.id as ColorSchemeId)}
                    className="accent-primary"
                  />
                  <span className="flex gap-1">
                    <span
                      style={{ background: "#" + cs.primary }}
                      className="inline-block w-5 h-5 rounded-sm border border-black/10"
                      aria-hidden="true"
                    />
                    <span
                      style={{ background: "#" + cs.accent }}
                      className="inline-block w-5 h-5 rounded-sm border border-black/10"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-sm text-foreground">{cs.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Format picker */}
          <fieldset>
            <legend className="text-sm font-medium text-foreground mb-2">File Format</legend>
            <div className="space-y-2">
              <label
                className={"flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
                  (selectedFormat === "pdf"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50")}
              >
                <input
                  type="radio"
                  name="lesson-export-format"
                  value="pdf"
                  checked={selectedFormat === "pdf"}
                  onChange={() => setSelectedFormat("pdf")}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <span className="text-sm font-medium text-foreground block">PDF Document</span>
                  <span className="text-xs text-emerald-600 block mt-0.5 font-medium">Recommended for printing</span>
                </div>
              </label>
              <label
                className={"flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
                  (selectedFormat === "docx"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50")}
              >
                <input
                  type="radio"
                  name="lesson-export-format"
                  value="docx"
                  checked={selectedFormat === "docx"}
                  onChange={() => setSelectedFormat("docx")}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <span className="text-sm font-medium text-foreground block">Word Document (.docx)</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Opens in Word, Google Docs, LibreOffice</span>
                </div>
              </label>
            </div>
            {!selectedFormat && (
              <p className="text-xs text-muted-foreground mt-2">Please select a format to continue.</p>
            )}
          </fieldset>

        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => !exporting && onOpenChange(false)}
            disabled={exporting}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground bg-background hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!canDownload}
            className={"flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2 " +
              (!canDownload
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            {exporting && <Loader2 className="h-4 w-4 animate-spin" />}
            {exporting ? "Downloading..." : "Download"}
          </button>
        </div>

      </div>
    </div>
  );
}
