/**
 * LessonExportButtons Component
 * Export buttons for lessons: Copy, Print, Share (dropdown), Download (PDF/DOCX)
 * 
 * SSOT Compliance:
 * - formatLessonContentForPrint imported from @/utils/formatLessonContent (shared utility)
 * - No inline formatting logic - all formatting centralized in utility
 * 
 * Updated: January 2026
 * - Share dropdown menu: Email Lesson, Copy for Sharing, More Options (mobile)
 * - Added Bible version attribution to all exports
 * - copyrightNotice now included in all output formats
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Printer, Download, FileText, FileType, ChevronDown, Check, Loader2, Share2, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToPdf } from "@/utils/exportToPdf";
import { exportToDocx } from "@/utils/exportToDocx";
import { EXPORT_FORMATTING } from "@/constants/lessonStructure";
import { formatLessonContentForPrint } from "@/utils/formatLessonContent";

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

  // Build copyright attribution line for text-based exports
  const getCopyrightLine = (): string => {
    if (lesson.metadata?.copyrightNotice) {
      return lesson.metadata.copyrightNotice;
    }
    // Fallback for public domain or missing notice
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
      let textContent = `${lesson.title}\n${"=".repeat(50)}\n\n`;
      if (lesson.metadata?.teaser) textContent += `${EXPORT_FORMATTING.teaserLabel}:\n${lesson.metadata.teaser}\n\n${"-".repeat(50)}\n\n`;
      textContent += lesson.original_text;
      
      // Add copyright attribution at the end
      const copyrightLine = getCopyrightLine();
      if (copyrightLine) {
        textContent += `\n\n${"-".repeat(50)}\n${copyrightLine}`;
      }
      
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      if (onExport) onExport();
      toast({ title: "Copied to clipboard", description: "Lesson content has been copied to your clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Copy failed", description: "Unable to copy to clipboard.", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Print blocked", description: "Please allow pop-ups to print.", variant: "destructive" });
      return;
    }
    const metaItems: string[] = [lesson.title];
    if (lesson.metadata?.ageGroup) metaItems.push(lesson.metadata.ageGroup);
    if (lesson.metadata?.theologyProfile) metaItems.push(lesson.metadata.theologyProfile);
    
    // SSOT: Use shared formatting utility for print
    const formattedContent = formatLessonContentForPrint(lesson.original_text);
    
    const lessonTitleMatch = lesson.original_text.match(/Lesson Title:?\s*[""]?(.+?)[""]?\s*(?:\n|$)/i);
    const documentTitle = lessonTitleMatch ? lessonTitleMatch[1].replace(/[""\*]/g, "").trim() : lesson.title;
    
    // Get copyright notice for footer
    const copyrightLine = getCopyrightLine();
    const copyrightFooter = copyrightLine 
      ? `<div class="copyright-notice">${copyrightLine}</div>` 
      : '';
    
    const printContent = `<!DOCTYPE html><html><head><title>${documentTitle}</title><style>@page{margin:1in}body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.5;max-width:8.5in;margin:0 auto;padding:0}h1{font-size:18pt;margin-bottom:12pt;line-height:1.3}h2{font-size:14pt;margin-top:18pt;margin-bottom:12pt;line-height:1.3}hr{margin:18px 0;border:none;border-top:1px solid #ccc}.metadata{color:#666;font-size:10pt;margin-bottom:18pt;line-height:1.3}.teaser-box{background:#F0F7FF;border:1px solid #3B82F6;border-radius:8px;padding:12pt;margin:18pt 0}.teaser-box h3{color:#3B82F6;margin:0 0 6pt 0;font-size:12pt}.teaser-box p{font-style:italic;margin:0;line-height:1.5}p{margin-bottom:12pt}.copyright-notice{margin-top:36pt;padding-top:12pt;border-top:1px solid #ccc;font-size:9pt;color:#666;font-style:italic;line-height:1.4;text-align:center}</style></head><body><h1>${documentTitle}</h1><div class="metadata">${metaItems.join(" | ")}</div>${lesson.metadata?.teaser ? `<div class="teaser-box"><h3>${EXPORT_FORMATTING.teaserLabel}</h3><p>${lesson.metadata.teaser}</p></div>` : ""}<div>${formattedContent}</div>${copyrightFooter}</body></html>`;
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
      toast({ title: "PDF exported", description: "Your lesson has been downloaded." });
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
      toast({ title: "Document exported", description: "Your lesson has been downloaded." });
    } catch (error) {
      toast({ title: "Export failed", description: "Unable to export document.", variant: "destructive" });
    } finally { setExporting(null); }
  };

  // Build shareable text content (used by all share methods)
  const getShareableText = (): string => {
    let shareText = `${lesson.title}\n\n`;
    if (lesson.metadata?.teaser) {
      shareText += `${EXPORT_FORMATTING.teaserLabel}:\n${lesson.metadata.teaser}\n\n`;
    }
    shareText += lesson.original_text;
    
    // Add copyright attribution
    const copyrightLine = getCopyrightLine();
    if (copyrightLine) {
      shareText += `\n\n---\n${copyrightLine}`;
    }
    return shareText;
  };

  // Email share - opens mail client with lesson content
  const handleShareEmail = () => {
    const subject = encodeURIComponent(lesson.title);
    const body = encodeURIComponent(getShareableText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    if (onExport) onExport();
    toast({ title: "Email opened", description: "Compose your email and send." });
  };

  // Copy for sharing - copies formatted text to clipboard
  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareableText());
      toast({ 
        title: "Copied for sharing", 
        description: "Lesson copied. Paste into your preferred app to share." 
      });
      if (onExport) onExport();
    } catch (error) {
      toast({ title: "Copy failed", description: "Unable to copy to clipboard.", variant: "destructive" });
    }
  };

  // Native Share API - for mobile users
  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lesson.title,
          text: getShareableText(),
        });
        if (onExport) onExport();
        toast({ title: "Shared successfully", description: "Your lesson has been shared." });
      } catch (error: any) {
        // User cancelled share - not an error
        if (error.name !== 'AbortError') {
          toast({ title: "Share failed", description: "Unable to share lesson.", variant: "destructive" });
        }
      }
    } else {
      // Fallback if native share not available
      await handleShareCopy();
    }
  };

  // Check if native share is available (primarily for mobile)
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
          <DropdownMenuItem onClick={handleShareEmail}>
            <Mail className="h-4 w-4 mr-2" />Email Lesson
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareCopy}>
            <Copy className="h-4 w-4 mr-2" />Copy for Sharing
          </DropdownMenuItem>
          {hasNativeShare && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShareNative}>
                <Smartphone className="h-4 w-4 mr-2" />More Options...
              </DropdownMenuItem>
            </>
          )}
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
          <DropdownMenuItem onClick={handleExportPdf} disabled={exporting !== null}>
            <FileText className="h-4 w-4 mr-2" />PDF (viewing/sharing)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportDocx} disabled={exporting !== null}>
            <FileType className="h-4 w-4 mr-2" />Document (editable)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
