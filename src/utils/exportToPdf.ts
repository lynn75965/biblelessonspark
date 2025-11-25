// src/utils/exportToPdf.ts
import jsPDF from "jspdf";
import { EXPORT_FORMATTING, isBoldLabel, isSkipLabel } from "../constants/lessonStructure";

const sanitizeText = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2013/g, "-").replace(/\u2014/g, "--").replace(/\u2026/g, "...").replace(/\u2728/g, "*").replace(/\u2713/g, "[x]").replace(/\u2714/g, "[x]").replace(/\u2717/g, "[ ]").replace(/\u2718/g, "[ ]").replace(/\u2022/g, "-").replace(/\u25CF/g, "-").replace(/\u25CB/g, "o").replace(/\u2192/g, "->").replace(/\u2190/g, "<-").replace(/\u2191/g, "^").replace(/\u2193/g, "v").replace(/\u00A0/g, " ").replace(/[^\x00-\xFF]/g, "");
};

const extractLessonTitle = (content: string): string | null => {
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?Lesson Title:?(?:\*\*)?\s*[""]?(.+?)[""]?\s*$/i);
    if (match) return match[1].replace(/[""\*]/g, "").trim();
  }
  return null;
};

interface ExportToPdfOptions {
  title: string;
  content: string;
  metadata?: { passage?: string; ageGroup?: string; theology?: string; };
  teaserContent?: string;
}

export const exportToPdf = async ({ title, content, metadata, teaserContent }: ExportToPdfOptions): Promise<void> => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const lessonTitle = extractLessonTitle(content);
  const documentTitle = lessonTitle || title;

  const addText = (text: string, fontSize: number, isBold: boolean = false, lineHeight: number = 1.2): void => {
    const sanitizedText = sanitizeText(text);
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(sanitizedText, contentWidth);
    const textHeight = (fontSize * lineHeight * lines.length) / 2.83;
    if (yPosition + textHeight > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(lines, margin, yPosition);
    yPosition += textHeight;
  };

  const addLabeledText = (label: string, value: string, fontSize: number = 10): void => {
    const sanitizedLabel = sanitizeText(label);
    const sanitizedValue = sanitizeText(value);
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    const labelWidth = doc.getTextWidth(sanitizedLabel + " ");
    const remainingWidth = contentWidth - labelWidth;
    if (yPosition + 5 > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(sanitizedLabel, margin, yPosition);
    doc.setFont("helvetica", "normal");
    const valueLines = doc.splitTextToSize(sanitizedValue, remainingWidth);
    if (valueLines.length === 1) {
      doc.text(valueLines[0], margin + labelWidth, yPosition);
      yPosition += (fontSize * 1.2) / 2.83;
    } else {
      doc.text(valueLines[0], margin + labelWidth, yPosition);
      yPosition += (fontSize * 1.2) / 2.83;
      for (let i = 1; i < valueLines.length; i++) {
        if (yPosition + 5 > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(valueLines[i], margin, yPosition);
        yPosition += (fontSize * 1.2) / 2.83;
      }
    }
  };

  const addLine = (): void => {
    if (yPosition + 3 > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;
  };

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(sanitizeText(documentTitle), contentWidth);
  doc.text(titleLines, margin, yPosition);
  yPosition += (18 * 1.2 * titleLines.length) / 2.83 + 2;

  if (metadata) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const metadataParts: string[] = [];
    if (metadata.passage) metadataParts.push(sanitizeText(metadata.passage));
    if (metadata.ageGroup) metadataParts.push(sanitizeText(metadata.ageGroup));
    if (metadata.theology) metadataParts.push(sanitizeText(metadata.theology));
    if (metadataParts.length > 0) {
      doc.text(metadataParts.join("  |  "), margin, yPosition);
      yPosition += 5;
    }
    doc.setTextColor(0, 0, 0);
  }

  addLine();
  yPosition += 2;

  if (teaserContent && teaserContent.trim()) {
    const teaserText = sanitizeText(teaserContent);
    doc.setFontSize(10);
    const teaserLines = doc.splitTextToSize(teaserText, contentWidth - 10);
    const teaserHeight = (10 * 1.2 * teaserLines.length) / 2.83 + 10;
    if (yPosition + teaserHeight > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFillColor(245, 245, 250);
    doc.setDrawColor(180, 180, 200);
    doc.roundedRect(margin, yPosition - 2, contentWidth, teaserHeight, 2, 2, "FD");
    yPosition += 3;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 120);
    doc.text(EXPORT_FORMATTING.teaserLabel, margin + 5, yPosition);
    yPosition += 4;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(60, 60, 80);
    doc.text(teaserLines, margin + 5, yPosition);
    yPosition += (10 * 1.2 * teaserLines.length) / 2.83 + 4;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    addLine();
    yPosition += 2;
  }

  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      yPosition += 2;
      i++;
      continue;
    }
    if (trimmedLine === "---" || trimmedLine === "***" || trimmedLine === "___") {
      addLine();
      i++;
      continue;
    }
    if (trimmedLine.startsWith("## ")) {
      yPosition += 4;
      addText(trimmedLine.replace("## ", ""), 14, true);
      yPosition += 2;
      i++;
      continue;
    }
    if (trimmedLine.startsWith("### ")) {
      yPosition += 3;
      addText(trimmedLine.replace("### ", ""), 11, true);
      yPosition += 1;
      i++;
      continue;
    }
    if (trimmedLine.startsWith("# ")) {
      yPosition += 3;
      addText(trimmedLine.replace("# ", ""), 16, true);
      yPosition += 2;
      i++;
      continue;
    }
    if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      const bulletText = trimmedLine.substring(2);
      const boldMatch = bulletText.match(/^\*\*(.+?):\*\*\s*(.*)$/);
      if (boldMatch) {
        addLabeledText("• " + boldMatch[1] + ":", boldMatch[2], 10);
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const bulletLines = doc.splitTextToSize("• " + sanitizeText(bulletText), contentWidth - 5);
        if (yPosition + 5 > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(bulletLines, margin + 3, yPosition);
        yPosition += (10 * 1.2 * bulletLines.length) / 2.83;
      }
      i++;
      continue;
    }
    if (/^\d+\.\s/.test(trimmedLine)) {
      addText(trimmedLine, 10, false);
      i++;
      continue;
    }
    const labelMatch = trimmedLine.match(/^(?:\*\*)?([^:]+):(?:\*\*)?\s*(.*)$/);
    if (labelMatch) {
      const label = labelMatch[1].trim();
      const value = labelMatch[2].trim();
      if (isSkipLabel(label)) {
        i++;
        continue;
      }
      if (isBoldLabel(label)) {
        addLabeledText(label + ":", value, 10);
        yPosition += 1;
        i++;
        continue;
      }
      addText(trimmedLine.replace(/\*\*/g, ""), 10, false);
      i++;
      continue;
    }
    const cleanedLine = trimmedLine.replace(/\*\*/g, "");
    addText(cleanedLine, 10, false);
    i++;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    const footerText = `${EXPORT_FORMATTING.footerText}  |  Page ${p} of ${totalPages}`;
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
  }

  const sanitizedTitle = sanitizeText(documentTitle).replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 50);
  const filename = `${sanitizedTitle}_Lesson.pdf`;
  doc.save(filename);
};
