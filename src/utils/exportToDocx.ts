// src/utils/exportToDocx.ts
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { EXPORT_FORMATTING } from "../constants/lessonStructure";

const extractLessonTitle = (content: string): string | null => {
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?Lesson Title:?(?:\*\*)?\s*[""]?(.+?)[""]?\s*$/i);
    if (match) return match[1].replace(/[""\*]/g, "").trim();
  }
  return null;
};

interface ExportToDocxOptions {
  title: string;
  content: string;
  metadata?: { passage?: string; ageGroup?: string; theology?: string; };
  teaserContent?: string;
}

export const exportToDocx = async ({ title, content, metadata, teaserContent }: ExportToDocxOptions): Promise<void> => {
  const lessonTitle = extractLessonTitle(content);
  const documentTitle = lessonTitle || title;
  const sections: Paragraph[] = [];

  sections.push(new Paragraph({ text: documentTitle, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.LEFT }));

  if (metadata) {
    const metadataParts: string[] = [];
    if (metadata.passage) metadataParts.push(metadata.passage);
    if (metadata.ageGroup) metadataParts.push(metadata.ageGroup);
    if (metadata.theology) metadataParts.push(metadata.theology);
    if (metadataParts.length > 0) {
      sections.push(new Paragraph({ text: metadataParts.join("  |  "), spacing: { after: 200 } }));
    }
  }

  if (teaserContent && teaserContent.trim()) {
    sections.push(new Paragraph({ text: EXPORT_FORMATTING.teaserLabel, heading: HeadingLevel.HEADING_3, shading: { fill: "E3F2FD" }, spacing: { before: 200, after: 100 } }));
    sections.push(new Paragraph({ text: teaserContent, italics: true, spacing: { after: 200 }, shading: { fill: "F5F5FA" }, border: { top: { color: "B4C7E7", size: 6, style: BorderStyle.SINGLE }, bottom: { color: "B4C7E7", size: 6, style: BorderStyle.SINGLE }, left: { color: "B4C7E7", size: 6, style: BorderStyle.SINGLE }, right: { color: "B4C7E7", size: 6, style: BorderStyle.SINGLE } } }));
  }

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine === "---") continue;
    if (/^Lesson Title:/i.test(trimmedLine)) continue;
    if (trimmedLine.startsWith("## ")) {
      sections.push(new Paragraph({ text: trimmedLine.replace("## ", ""), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    } else if (trimmedLine.startsWith("### ")) {
      sections.push(new Paragraph({ text: trimmedLine.replace("### ", ""), heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 50 } }));
    } else if (trimmedLine.startsWith("# ")) {
      sections.push(new Paragraph({ text: trimmedLine.replace("# ", ""), heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
    } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      const bulletText = trimmedLine.substring(2);
      const runs: TextRun[] = [];
      const parts = bulletText.split(/(\*\*.*?\*\*)/g);
      for (const part of parts) {
        if (part.startsWith("**") && part.endsWith("**")) {
          runs.push(new TextRun({ text: part.replace(/\*\*/g, ""), bold: true }));
        } else {
          runs.push(new TextRun({ text: part }));
        }
      }
      sections.push(new Paragraph({ children: runs, bullet: { level: 0 }, spacing: { after: 100 } }));
    } else {
      const runs: TextRun[] = [];
      const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
      for (const part of parts) {
        if (part.startsWith("**") && part.endsWith("**")) {
          runs.push(new TextRun({ text: part.replace(/\*\*/g, ""), bold: true }));
        } else {
          runs.push(new TextRun({ text: part }));
        }
      }
      sections.push(new Paragraph({ children: runs, spacing: { after: 100 } }));
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children: sections }] });
  const blob = await Packer.toBlob(doc);
  const sanitizedTitle = documentTitle.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 50);
  saveAs(blob, `${sanitizedTitle}_Lesson.docx`);
};
