// src/utils/export/exportToEpub.ts
// Phase E Part 3: ePub export for lesson series and devotional series
// Uses JSZip to build a valid ePub 3 file client-side -- no backend required
// SSOT: seriesExportConfig.ts for font/color scheme resolution

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getFontOption, getColorScheme } from '@/constants/seriesExportConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface EpubChapter {
  id: string;
  title: string;
  number: number;
  content: string; // raw markdown text from database
}

export interface ExportToEpubOptions {
  seriesName: string;
  chapters: EpubChapter[];
  contentType: 'lesson' | 'devotional';
  fontId?: string | null;
  colorSchemeId?: string | null;
}

// ============================================================================
// MARKDOWN TO HTML
// ============================================================================

function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  const lines = markdown.split('\n');
  const htmlLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push('<hr/>');
      continue;
    }

    if (trimmed.startsWith('## ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      const text = inlineFormat(trimmed.slice(3));
      htmlLines.push('<h2>' + text + '</h2>');
      continue;
    }

    if (trimmed.startsWith('# ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      const text = inlineFormat(trimmed.slice(2));
      htmlLines.push('<h2>' + text + '</h2>');
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) { htmlLines.push('<ul>'); inList = true; }
      const text = inlineFormat(trimmed.slice(2));
      htmlLines.push('<li>' + text + '</li>');
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      const text = inlineFormat(trimmed.replace(/^\d+[.)]\s*/, ''));
      htmlLines.push('<p>' + text + '</p>');
      continue;
    }

    if (inList) { htmlLines.push('</ul>'); inList = false; }

    // Skip metadata lines common in BLS lessons
    if (/^(Lesson Title|Theological Profile|Lesson Overview|Section \d+):/i.test(trimmed.replace(/\*\*/g, ''))) {
      const text = inlineFormat(trimmed);
      htmlLines.push('<p class="meta">' + text + '</p>');
      continue;
    }

    // Standalone bold heading (e.g. **Section Name:**)
    if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed) && trimmed.length < 80) {
      const text = trimmed.replace(/\*\*/g, '');
      htmlLines.push('<h3>' + escapeHtml(text) + '</h3>');
      continue;
    }

    htmlLines.push('<p>' + inlineFormat(trimmed) + '</p>');
  }

  if (inList) htmlLines.push('</ul>');
  return htmlLines.join('\n');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Restore HTML tags we intentionally inserted
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================================
// EPUB BUILDER
// ============================================================================

export const exportToEpub = async (options: ExportToEpubOptions): Promise<void> => {
  const { seriesName, chapters, contentType, fontId, colorSchemeId } = options;

  const fontOpt = getFontOption(fontId ?? null);
  const scheme  = getColorScheme(colorSchemeId ?? null);

  const primaryColor = '#' + scheme.primary;
  const accentColor  = '#' + scheme.accent;
  const fontFamily   = fontOpt.cssFamily + ', Georgia, serif';

  const safeTitle = escapeHtml(seriesName);
  const bookId    = 'urn:uuid:bls-' + Date.now().toString(36);
  const now       = new Date().toISOString().split('T')[0];

  // ---- CSS ----
  const css = `
body {
  font-family: ${fontFamily};
  font-size: 1em;
  line-height: 1.6;
  color: #1a1a1a;
  margin: 0;
  padding: 0;
}
h1 {
  font-size: 1.8em;
  color: ${primaryColor};
  margin-bottom: 0.3em;
  line-height: 1.3;
}
h2 {
  font-size: 1.2em;
  color: ${primaryColor};
  margin-top: 1.4em;
  margin-bottom: 0.4em;
  border-bottom: 1px solid ${accentColor};
  padding-bottom: 0.2em;
}
h3 {
  font-size: 1.05em;
  color: ${primaryColor};
  margin-top: 1em;
  margin-bottom: 0.3em;
}
p {
  margin: 0.5em 0;
}
p.meta {
  color: #555555;
  font-size: 0.9em;
}
ul {
  margin: 0.5em 0;
  padding-left: 1.5em;
}
li {
  margin: 0.3em 0;
}
hr {
  border: none;
  border-top: 2px solid ${accentColor};
  margin: 1.2em 0;
  opacity: 0.6;
}
.cover {
  text-align: center;
  padding: 3em 1em;
}
.cover h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}
.cover .subtitle {
  color: #6b7280;
  font-size: 1em;
  margin-bottom: 2em;
}
.cover .accent-rule {
  width: 60px;
  height: 3px;
  background: ${accentColor};
  margin: 1em auto;
  border-radius: 2px;
}
.cover .publisher {
  color: #9ca3af;
  font-size: 0.85em;
  margin-top: 3em;
}
.chapter-header {
  margin-bottom: 1.5em;
}
.chapter-number {
  color: ${accentColor};
  font-size: 0.85em;
  font-weight: bold;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.3em;
}
`.trim();

  // ---- COVER PAGE ----
  const chapterWord = contentType === 'devotional' ? 'Devotionals' : 'Lessons';
  const coverHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${safeTitle}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="cover">
    <h1>${safeTitle}</h1>
    <div class="accent-rule"></div>
    <p class="subtitle">${chapters.length} ${chapters.length === 1 ? chapterWord.slice(0, -1) : chapterWord}</p>
    <p class="publisher">BibleLessonSpark</p>
  </div>
</body>
</html>`;

  // ---- CHAPTER PAGES ----
  const chapterFiles: Array<{ id: string; filename: string; title: string; html: string }> = [];

  for (const chapter of chapters) {
    const filename = 'ch' + String(chapter.number).padStart(3, '0') + '.xhtml';
    const chapterId = 'ch' + String(chapter.number).padStart(3, '0');
    const chapterLabel = contentType === 'devotional' ? 'Devotional' : 'Lesson';
    const bodyHtml = markdownToHtml(chapter.content);

    const html = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="chapter-header">
    <p class="chapter-number">${chapterLabel} ${chapter.number}</p>
    <h1>${escapeHtml(chapter.title)}</h1>
  </div>
  ${bodyHtml}
</body>
</html>`;

    chapterFiles.push({ id: chapterId, filename, title: chapter.title, html });
  }

  // ---- content.opf ----
  const manifestItems = [
    '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>',
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="styles" href="styles.css" media-type="text/css"/>',
    ...chapterFiles.map(c =>
      `<item id="${c.id}" href="${c.filename}" media-type="application/xhtml+xml"/>`
    ),
  ].join('\n    ');

  const spineItems = [
    '<itemref idref="cover"/>',
    ...chapterFiles.map(c => `<itemref idref="${c.id}"/>`),
  ].join('\n    ');

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:title>${safeTitle}</dc:title>
    <dc:creator>BibleLessonSpark</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${now}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine>
    ${spineItems}
  </spine>
</package>`;

  // ---- nav.xhtml ----
  const navItems = chapterFiles.map(c =>
    `<li><a href="${c.filename}">${escapeHtml(c.title)}</a></li>`
  ).join('\n        ');

  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
        ${navItems}
    </ol>
  </nav>
</body>
</html>`;

  // ---- container.xml ----
  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  // ---- ASSEMBLE ZIP ----
  const zip = new JSZip();

  // mimetype MUST be first and uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', container);
  zip.file('OEBPS/content.opf', opf);
  zip.file('OEBPS/nav.xhtml', nav);
  zip.file('OEBPS/styles.css', css);
  zip.file('OEBPS/cover.xhtml', coverHtml);

  for (const chapter of chapterFiles) {
    zip.file('OEBPS/' + chapter.filename, chapter.html);
  }

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  const safeFilename = seriesName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
  saveAs(blob, safeFilename + '.epub');
};
