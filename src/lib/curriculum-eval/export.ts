import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

export function exportTextAsPDF(text: string, filename: string, title: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 8;

  doc.setDrawColor(180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lineHeight = 15;

  const rawLines = text.split("\n");
  for (const raw of rawLines) {
    if (raw.trim() === "") {
      y += lineHeight * 0.6;
      continue;
    }
    const isHeader =
      /^[A-Z][^a-z]*$/.test(raw) === false &&
      raw === raw.trim() &&
      !raw.startsWith("-") &&
      !raw.startsWith("*") &&
      !raw.startsWith("  ") &&
      raw.length < 60 &&
      /^[A-Z]/.test(raw) &&
      !raw.includes(":");

    if (isHeader) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    }

    const wrapped = doc.splitTextToSize(raw, maxWidth);
    for (const line of wrapped) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    if (isHeader) y += 4;
  }

  doc.save(filename);
}

export async function exportTextAsDOCX(
  text: string,
  filename: string,
  title: string,
) {
  const rawLines = text.split("\n");
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: title, bold: true, size: 32 })],
    }),
  );

  for (const raw of rawLines) {
    if (raw.trim() === "") {
      paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
      continue;
    }

    const isHeader =
      raw === raw.trim() &&
      !raw.startsWith("-") &&
      !raw.startsWith("*") &&
      !raw.startsWith("  ") &&
      raw.length < 60 &&
      /^[A-Z]/.test(raw) &&
      !raw.includes(":");

    if (isHeader) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: raw, bold: true, size: 26 })],
        }),
      );
    } else if (raw.startsWith("- ") || raw.startsWith("  -")) {
      paragraphs.push(
        new Paragraph({
          bullet: { level: raw.startsWith("  ") ? 1 : 0 },
          children: [new TextRun(raw.replace(/^\s*-\s*/, ""))],
        }),
      );
    } else {
      paragraphs.push(new Paragraph({ children: [new TextRun(raw)] }));
    }
  }

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  saveAs(blob, filename);
}
