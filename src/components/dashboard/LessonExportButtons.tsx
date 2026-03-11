/**
 * LessonExportButtons Component
 * SSOT COMPLIANT: All values imported from lessonStructure.ts + emailDeliveryConfig.ts
 * NO hardcoded spacing/font values - frontend drives backend
 *
 * Updated: 2026-03-11
 * - Download button now opens LessonExportModal (font + color scheme + format picker)
 * - Removed inline PDF/DOCX export handlers; modal owns all download logic
 * - Copy and Email buttons unchanged
 * - Print button removed
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Download,
  Check,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EXPORT_FORMATTING, EXPORT_SPACING } from "@/constants/lessonStructure";
import {
  stripMarkdown,
  convertToRichHtml,
} from "@/utils/formatLessonContent";
import { EMAIL_DELIVERY_CONFIG } from "@/constants/emailDeliveryConfig";
import { EmailLessonDialog } from "@/components/EmailLessonDialog";
import { LessonExportModal } from "@/components/dashboard/LessonExportModal";

// Destructure SSOT values (used by Copy)
const {
  fonts,
  body,
  title,
  teaser,
  paragraph,
  footer,
  colors,
} = EXPORT_SPACING;

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

interface LessonExportButtonsProps {
  lesson: LessonData;
  disabled?: boolean;
  onExport?: () => void;
  /** Whether the current user has a paid subscription (personal/admin) */
  isPaidUser?: boolean;
  /** Display name of the current user (for "Shared by" in email) */
  senderName?: string;
}

export function LessonExportButtons({
  lesson,
  disabled = false,
  onExport,
  isPaidUser = false,
  senderName = "",
}: LessonExportButtonsProps) {
  const [copied,           setCopied]           = useState(false);
  const [emailDialogOpen,  setEmailDialogOpen]  = useState(false);
  const [exportModalOpen,  setExportModalOpen]  = useState(false);
  const { toast } = useToast();

  // ================================================================
  // COPY -- rich HTML + plain text to clipboard
  // ================================================================
  const handleCopy = async () => {
    try {
      const copyrightLine = (() => {
        if (lesson.metadata?.copyrightNotice) return lesson.metadata.copyrightNotice;
        if (lesson.metadata?.bibleVersion) {
          if (lesson.metadata.copyrightStatus === "public_domain") {
            return `Scripture quotations are from the ${lesson.metadata.bibleVersion} (${lesson.metadata.bibleVersionAbbreviation || ""}).`;
          }
          return `Scripture quotations are from the ${lesson.metadata.bibleVersion}.`;
        }
        return "";
      })();

      let plainText = `${lesson.title}\n${"=".repeat(50)}\n\n`;
      if (lesson.metadata?.teaser) {
        plainText += `${EXPORT_FORMATTING.teaserLabel}:\n${lesson.metadata.teaser}\n\n${"-".repeat(50)}\n\n`;
      }
      plainText += stripMarkdown(lesson.original_text);
      if (copyrightLine)
        plainText += `\n\n${"-".repeat(50)}\n${copyrightLine}`;

      // Rich HTML uses SSOT values
      let richHtml = `<h1 style="font-family:${fonts.css};font-size:${title.fontPt}pt;margin-bottom:${title.afterPt}pt;">${lesson.title}</h1>`;
      if (lesson.metadata?.teaser) {
        richHtml += `<div style="background:#${colors.teaserBg};border:1px solid #${colors.teaserBorder};border-radius:${teaser.borderRadiusPx}px;padding:${teaser.paddingPt}pt;margin:${teaser.marginBeforePt}pt 0 ${teaser.marginAfterPt}pt 0;">`;
        richHtml += `<p style="font-family:${fonts.css};color:#${colors.teaserText};font-weight:bold;margin:0 0 ${paragraph.afterPt}pt 0;font-size:${teaser.fontPt}pt;">${EXPORT_FORMATTING.teaserLabel}</p>`;
        richHtml += `<p style="font-family:${fonts.css};font-style:italic;margin:0;font-size:${body.fontPt}pt;">${lesson.metadata.teaser}</p></div>`;
      }
      richHtml += `<div style="font-family:${fonts.css};font-size:${body.fontPt}pt;line-height:${body.lineHeight};">${convertToRichHtml(lesson.original_text)}</div>`;
      if (copyrightLine) {
        richHtml += `<hr style="margin-top:${footer.marginTopPt}pt;border:none;border-top:1px solid #${colors.hrLine};">`;
        richHtml += `<p style="font-family:${fonts.css};font-size:${footer.fontPt}pt;color:#${colors.footerText};font-style:italic;">${copyrightLine}</p>`;
      }

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html":  new Blob([richHtml],    { type: "text/html" }),
            "text/plain": new Blob([plainText],   { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      setCopied(true);
      if (onExport) onExport();
      toast({ title: "Copied to clipboard", description: "Paste into Word, Docs, or email." });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      try {
        await navigator.clipboard.writeText(
          `${lesson.title}\n\n${stripMarkdown(lesson.original_text)}`
        );
        setCopied(true);
        toast({ title: "Copied to clipboard", description: "Lesson content copied." });
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        toast({ title: "Copy failed", description: "Unable to copy.", variant: "destructive" });
      }
    }
  };

  // ================================================================
  // EMAIL -- tier-gated, opens dialog for paid users
  // ================================================================
  const handleEmailClick = () => {
    if (!isPaidUser) {
      toast({
        title:       EMAIL_DELIVERY_CONFIG.labels.upgradeTitle,
        description: EMAIL_DELIVERY_CONFIG.labels.upgradeMessage,
      });
      return;
    }
    setEmailDialogOpen(true);
  };

  // ================================================================
  // RENDER: Copy | Download | Email
  // ================================================================
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* COPY */}
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={disabled}>
          {copied ? (
            <Check className="h-4 w-4 mr-1.5" />
          ) : (
            <Copy className="h-4 w-4 mr-1.5" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>

        {/* DOWNLOAD -- opens font/color/format picker modal */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExportModalOpen(true)}
          disabled={disabled}
        >
          <Download className="h-4 w-4 mr-1.5" />
          Download
        </Button>

        {/* EMAIL */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleEmailClick}
          disabled={disabled}
          title={EMAIL_DELIVERY_CONFIG.labels.buttonTooltip}
        >
          <Mail className="h-4 w-4 mr-1.5" />
          {EMAIL_DELIVERY_CONFIG.labels.buttonText}
        </Button>
      </div>

      {/* Download modal -- font, color scheme, and format picker */}
      <LessonExportModal
        lesson={lesson}
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        onExport={onExport}
      />

      {/* Email dialog (portal - renders outside button row) */}
      <EmailLessonDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        lesson={lesson}
        senderName={senderName}
      />
    </>
  );
}
