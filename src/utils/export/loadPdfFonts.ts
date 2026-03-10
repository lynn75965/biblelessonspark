// ============================================================================
// loadPdfFonts.ts
// Location: src/utils/export/loadPdfFonts.ts
//
// Registers open-source TTF fonts with a jsPDF instance.
// Font files are served from /fonts/ (public/fonts/ in the repo).
//
// Called once at the top of buildSeriesPdf() and buildBookletPdf()
// before any text is drawn.
//
// If the selected font is a jsPDF built-in (times, helvetica), this
// function returns immediately -- no fetch, no registration needed.
//
// SSOT: font paths are declared in seriesExportConfig.ts FontOption.pdfFontFiles
// ============================================================================

import type jsPDF from 'jspdf';
import type { FontOption } from '@/constants/seriesExportConfig';

// Convert an ArrayBuffer to base64 in safe chunks to avoid stack overflow
// on large font files (Carlito Regular is ~600 KB).
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchAndRegister(
  doc:      jsPDF,
  url:      string,
  family:   string,
  style:    string
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      'BLS font load failed: ' + url + ' (' + response.status + ')'
    );
  }
  const buffer   = await response.arrayBuffer();
  const base64   = arrayBufferToBase64(buffer);
  const filename = url.split('/').pop()!;
  doc.addFileToVFS(filename, base64);
  doc.addFont(filename, family, style);
}

export async function loadPdfFonts(
  doc:     jsPDF,
  fontOpt: FontOption
): Promise<void> {
  // Built-in font (times, helvetica) -- nothing to load
  if (!fontOpt.pdfFontFiles) return;

  const { regular, bold, italic, boldItalic } = fontOpt.pdfFontFiles;
  const family = fontOpt.pdfFamily;

  // Fetch all four variants in parallel
  await Promise.all([
    fetchAndRegister(doc, regular,    family, 'normal'),
    fetchAndRegister(doc, bold,       family, 'bold'),
    fetchAndRegister(doc, italic,     family, 'italic'),
    fetchAndRegister(doc, boldItalic, family, 'bolditalic'),
  ]);
}
