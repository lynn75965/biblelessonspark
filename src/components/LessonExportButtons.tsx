/**
 * LessonExportButtons Component
 * SSOT COMPLIANT: All values imported from lessonStructure.ts
 * NO hardcoded spacing/font values - frontend drives backend
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Printer, Download, FileText, FileType, ChevronDown, Check, Loader2, Share2, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToPdf } from "@/utils/exportToPdf";
import { exportToDocx } from "@/utils/exportToDocx";
import { EXPORT_FORMATTING, EXPORT_SPACING } from "@/constants/lessonStructure";
import { formatLessonContentForPrint, stripMarkdown, convertToRichHtml } from "@/utils/formatLessonContent";

// Destructure SSOT values
const { fonts, margins, sectionHeader, sectionHeaderFont, body, title, metadata, teaser, paragraph, footer, colors } = EXPORT_SPACING;

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

export function LessonExportButtons({ lesson, disabled = false, onExport }: { lesson: LessonData; disabled?: boolean; onExport?: () => void }) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const { toast } = useToast();

  const getCopyrightLine = (): string => {
    if (lesson.metadata?.copyrightNotice) return lesson.metadata.copyrightNotice;
    if (lesson.metadata?.bibleVersion) {
      if (lesson.metadata.copyrightStatus === 'public_domain') {
        return `Scripture quotations are from the ${lesson.metadata.bibleVersion} (${lesson.metadata.bibleVersionAbbreviation || ''}).`;
      }
      return `Scripture quotations are from the ${lesson.metadata.bibleVersion}.`;
    }
    return '';
  };

  const handleCopy = async () => {
    try {
      const copyrightLine = getCopyrightLine();
      let plainText = `${lesson.title}\n${"=".repeat(50)}\n\n`;
      if (lesson.metadata?.teaser) {
        plainText += `${EXPORT_FORMATTING.teaserLabel}:\n${lesson.metadata.teaser}\n\n${"-".repeat(50)}\n\n`;
      }
      plainText += stripMarkdown(lesson.original_text);
      if (copyrightLine) plainText += `\n\n${"-".repeat(50)}\n${copyrightLine}`;
      
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
      
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([richHtml], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
          })
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
        await navigator.clipboard.writeText(`${lesson.title}\n\n${stripMarkdown(lesson.original_text)}`);
        setCopied(true);
        toast({ title: "Copied to clipboard", description: "Lesson content copied." });
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        toast({ title: "Copy failed", description: "Unable to copy.", variant: "destructive" });
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Print blocked", description: "Please allow pop-ups.", variant: "destructive" });
      return;
    }
    
    const metaItems: string[] = [];
    if (lesson.metadata?.ageGroup) metaItems.push(lesson.metadata.ageGroup);
    if (lesson.metadata?.theologyProfile) metaItems.push(lesson.metadata.theologyProfile);
    
    const formattedContent = formatLessonContentForPrint(lesson.original_text);
    
    const lessonTitleMatch = lesson.original_text.match(/Lesson Title:?\s*[""]?(.+?)[""]?\s*(?:\n|$)/i);
    const documentTitle = lessonTitleMatch ? lessonTitleMatch[1].replace(/[""\*]/g, "").trim() : lesson.title;
    
    // Teaser HTML - used in TWO places (SSOT values)
    const teaserHtml = lesson.metadata?.teaser 
      ? `<div class="teaser"><b>${EXPORT_FORMATTING.teaserLabel}:</b> <i>${lesson.metadata.teaser}</i></div>`
      : '';
    
    // Split at Section 8 for standalone page
    const section8Regex = /<strong[^>]*>Section\s*8[:\s\-–—]+Student\s*Handout<\/strong>/i;
    const section8Match = formattedContent.match(section8Regex);
    
    let mainContent = formattedContent;
    let section8Content = '';
    
    if (section8Match) {
      const idx = formattedContent.indexOf(section8Match[0]);
      mainContent = formattedContent.substring(0, idx);
      section8Content = formattedContent.substring(idx).replace(section8Regex, '');
    }
    
    const copyrightLine = getCopyrightLine();
    const copyrightHtml = copyrightLine ? `<div class="copyright">${copyrightLine}</div>` : '';
    
    // CSS uses ALL SSOT values - no hardcoding
    const printContent = `<!DOCTYPE html><html><head>
<title>${documentTitle} - ${EXPORT_FORMATTING.footerText}</title>
<style>
/* Page setup - SSOT margins */
@page { margin: ${margins.css}; size: letter; }

/* Section 8 standalone - page break before */
@media print { .section8-page { page-break-before: always !important; } }

/* Body - SSOT font size and line height */
body {
  font-family: ${fonts.css};
  font-size: ${body.fontPt}pt;
  line-height: ${body.lineHeight};
  margin: 0; padding: 0;
  color: #${colors.bodyText};
}

/* Title - SSOT values */
h1 { font-size: ${title.fontPt}pt; font-weight: bold; margin: 0 0 ${title.afterPt}pt 0; }
.meta { color: #${colors.metaText}; font-size: ${metadata.fontPt}pt; margin-bottom: ${metadata.afterPt}pt; }

/* Teaser box - SSOT values */
.teaser {
  background: #${colors.teaserBg};
  border: 1px solid #${colors.teaserBorder};
  border-radius: ${teaser.borderRadiusPx}px;
  padding: ${teaser.paddingPt}pt;
  margin: ${teaser.marginBeforePt}pt 0 ${teaser.marginAfterPt}pt 0;
  font-size: ${teaser.fontPt}pt;
}
.teaser b { color: #${colors.teaserText}; }

/* Content - SSOT values */
.content { font-size: ${body.fontPt}pt; line-height: ${body.lineHeight}; }
.content strong { font-weight: bold; }

/* Section headers - SSOT spacing */
.content strong[style*="display:block"] {
  margin: ${sectionHeader.beforePt}pt 0 ${sectionHeader.afterPt}pt 0 !important;
}

/* Copyright footer - SSOT values */
.copyright {
  margin-top: ${footer.marginTopPt}pt;
  padding-top: ${teaser.paddingPt}pt;
  border-top: 1px solid #${colors.hrLine};
  font-size: ${footer.fontPt}pt;
  color: #${colors.footerText};
  font-style: italic;
  text-align: center;
}

/* Section 8 page */
.section8-header { font-size: ${sectionHeaderFont.fontPt}pt; font-weight: bold; margin: 0 0 ${sectionHeader.afterPt}pt 0; }
</style>
</head>
<body>
<h1>${documentTitle}</h1>
<div class="meta">${metaItems.join(" | ")}</div>
${teaserHtml}
<div class="content">${mainContent}</div>
${section8Content ? `
<div class="section8-page">
<div class="section8-header">${EXPORT_FORMATTING.section8Title}</div>
${teaserHtml}
<div class="content">${section8Content}</div>
</div>
` : ''}
${copyrightHtml}
</body></html>`;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
    if (onExport) onExport();
  };

  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      await exportToPdf({ 
        title: lesson.title, 
        content: lesson.original_text, 
        teaserContent: lesson.metadata?.teaser || undefined, 
        metadata: { 
          passage: lesson.title, 
          ageGroup: lesson.metadata?.ageGroup, 
          theology: lesson.metadata?.theologyProfile,
          bibleVersion: lesson.metadata?.bibleVersion,
          bibleVersionAbbreviation: lesson.metadata?.bibleVersionAbbreviation,
          copyrightNotice: lesson.metadata?.copyrightNotice || undefined
        } 
      });
      if (onExport) onExport();
      toast({ title: "PDF exported", description: "Downloaded." });
    } catch (error) {
      toast({ title: "Export failed", description: "Unable to export PDF.", variant: "destructive" });
    } finally { setExporting(null); }
  };

  const handleExportDocx = async () => {
    setExporting("docx");
    try {
      await exportToDocx({ 
        title: lesson.title, 
        content: lesson.original_text, 
        teaserContent: lesson.metadata?.teaser || undefined, 
        metadata: { 
          passage: lesson.title, 
          ageGroup: lesson.metadata?.ageGroup, 
          theology: lesson.metadata?.theologyProfile,
          bibleVersion: lesson.metadata?.bibleVersion,
          bibleVersionAbbreviation: lesson.metadata?.bibleVersionAbbreviation,
          copyrightNotice: lesson.metadata?.copyrightNotice || undefined
        } 
      });
      if (onExport) onExport();
      toast({ title: "Document exported", description: "Downloaded." });
    } catch (error) {
      toast({ title: "Export failed", description: "Unable to export document.", variant: "destructive" });
    } finally { setExporting(null); }
  };

  const getShareableText = (): string => {
    let text = `${lesson.title}\n\n`;
    if (lesson.metadata?.teaser) text += `${EXPORT_FORMATTING.teaserLabel}:\n${lesson.metadata.teaser}\n\n`;
    text += stripMarkdown(lesson.original_text);
    const copyright = getCopyrightLine();
    if (copyright) text += `\n\n---\n${copyright}`;
    return text;
  };

  const handleShareEmail = () => {
    // MUST trigger mailto FIRST (synchronously) - browsers require immediate user gesture
    // Awaiting clipboard before mailto breaks the user gesture context
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(lesson.title)}`;
    window.location.href = mailtoUrl;
    
    // Copy to clipboard AFTER mailto trigger (non-blocking)
    navigator.clipboard.writeText(getShareableText()).catch(() => {});
    
    if (onExport) onExport();
    toast({ title: "Lesson copied", description: "Paste into email body." });
  };

  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareableText());
      toast({ title: "Copied for sharing", description: "Paste to share." });
      if (onExport) onExport();
    } catch { toast({ title: "Copy failed", variant: "destructive" }); }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: lesson.title, text: getShareableText() });
        if (onExport) onExport();
      } catch (e: any) { if (e.name !== 'AbortError') toast({ title: "Share failed", variant: "destructive" }); }
    } else { await handleShareCopy(); }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy} disabled={disabled}>
        {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
        {copied ? "Copied!" : "Copy"}
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} disabled={disabled} title={EXPORT_FORMATTING.printTooltip}>
        <Printer className="h-4 w-4 mr-1.5" />Print
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Share2 className="h-4 w-4 mr-1.5" />Share<ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShareEmail}><Mail className="h-4 w-4 mr-2" />Email Lesson</DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareCopy}><Copy className="h-4 w-4 mr-2" />Copy for Sharing</DropdownMenuItem>
          {hasNativeShare && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={handleShareNative}><Smartphone className="h-4 w-4 mr-2" />More Options...</DropdownMenuItem></>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled || exporting !== null}>
            {exporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
            Download<ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportPdf} disabled={exporting !== null}><FileText className="h-4 w-4 mr-2" />PDF</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportDocx} disabled={exporting !== null}><FileType className="h-4 w-4 mr-2" />Document (DOCX)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
