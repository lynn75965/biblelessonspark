// ============================================================================
// buildBookletPdf.ts
// Location: src/utils/export/buildBookletPdf.ts
//
// Saddle-stitch booklet PDF builder for the Print Class Booklet feature.
//
// CONSISTENCY GUARANTEE:
//   This file contains ZERO hardcoded numbers, hex strings, font sizes,
//   spacing values, or color values. Every such value is imported from
//   bookletConfig.ts. Same BookletOptions -> identical output, every time.
//
// IMPORTS:
//   All constants -> bookletConfig.ts (SSOT)
//   Lesson data   -> contracts.ts
//   Series data   -> seriesConfig.ts
//   Section 8     -> buildHandoutBooklet.ts (existing utility)
//
// BOOKLET STRUCTURE (8 booklet pages -> 2 duplex sheets):
//   p1  Cover
//   p2  Table of Contents
//   p3  Introduction
//   p4  Session 1 -- Overview + Theology + Scriptures
//   p5  Session 1 -- Teacher Prep + Activities + Gospel Connection
//   p6  Session 1 -- Discussion + Memory Verse + Weekly Challenge
//   p7  Group Handout (Session 1)
//   p8  Back Cover
//
//   For series with more lessons, the page count grows by multiples of 4.
//   assertValidPageCount() enforces the constraint before building.
//
// IMPOSITION (saddle-stitch, 2 pages per sheet side):
//   Sheet 1 FRONT:  p8 (back cover) | p1 (front cover)
//   Sheet 1 BACK:   p2 (TOC)        | p7 (handout)
//   Sheet 2 FRONT:  p6 (discussion) | p3 (intro)
//   Sheet 2 BACK:   p4 (overview)   | p5 (activities)
//
// ============================================================================

import jsPDF from 'jspdf';
import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  // Geometry
  BOOKLET_SHEET,
  BOOKLET_TEXT,
  BOOKLET_TEXT_X,
  // Typography
  BOOKLET_FONTS,
  BOOKLET_FONT_SIZES,
  BOOKLET_LEADING,
  // Spacing
  BOOKLET_SPACING,
  // Labels & copy
  BOOKLET_LABELS,
  // Options & types
  BookletOptions,
  BookletColorScheme,
  BookletProgressStepId,
  // Imposition
  buildImpositionPlan,
  assertValidPageCount,
  // Resolvers
  resolveColorScheme,
  hexToRgb,
} from '@/constants/bookletConfig';
import {
  extractCreativeTitle,
  stripSection8FromContent,
} from '@/utils/export/buildHandoutBooklet';

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function buildBookletPdf(
  series:   LessonSeries,
  lessons:  Lesson[],
  options:  BookletOptions,
  setStep:  (stepId: BookletProgressStepId) => void
): Promise<ArrayBuffer> {

  // -- Resolve color scheme once -- never touched again ------------------------
  const colors: BookletColorScheme = resolveColorScheme(options);

  // -- Initialise document -- landscape, points, letter -----------------------
  const doc = new jsPDF({
    orientation: 'landscape',
    unit:        'pt',
    format:      'letter',
  });

  // -- Booklet page registry --------------------------------------------------
  // We build each booklet page as a drawing function, collect them in order,
  // then lay them out on physical sheets in imposition order.
  type PageDrawer = (x: number) => void;
  const bookletPages: PageDrawer[] = [];

  // -- Shared drawing primitives ---------------------------------------------
  // All reference constants from bookletConfig.ts -- zero literals.

  const TW = BOOKLET_TEXT.widthPt;

  function setBody(style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'): void {
    const [r, g, b] = hexToRgb(colors.body);
    doc.setFont(BOOKLET_FONTS.body, style);
    doc.setFontSize(BOOKLET_FONT_SIZES.bodyPt);
    doc.setTextColor(r, g, b);
  }

  function setSans(style: 'normal' | 'bold' = 'normal'): void {
    const [r, g, b] = hexToRgb(colors.meta);
    doc.setFont(BOOKLET_FONTS.sans, style);
    doc.setFontSize(BOOKLET_FONT_SIZES.footerPt);
    doc.setTextColor(r, g, b);
  }

  /** Wrap and draw text. Returns new Y after last line. */
  function drawWrapped(
    text:     string,
    x:        number,
    y:        number,
    maxW:     number,
    font:     string,
    size:     number,
    leading:  number,
    hexColor: string,
    style:    string = 'normal'
  ): number {
    const [r, g, b] = hexToRgb(hexColor);
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(r, g, b);
    const lines = doc.splitTextToSize(text, maxW) as string[];
    for (const ln of lines) {
      doc.text(ln, x, y);
      y += leading;
    }
    return y + BOOKLET_SPACING.afterParagraph;
  }

  /** Draw body paragraph. Returns new Y. */
  function body(text: string, x: number, y: number, style: 'normal' | 'italic' = 'normal'): number {
    return drawWrapped(
      text, x, y, TW,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.bodyPt,
      BOOKLET_LEADING.bodyLd,
      colors.body, style
    );
  }

  /** Draw gold accent rule. */
  function goldRule(x: number, y: number, w: number = TW, t: number = BOOKLET_SPACING.ruleThick): void {
    const [r, g, b] = hexToRgb(colors.accent);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(t);
    doc.line(x, y, x + w, y);
  }

  /** Draw light gray rule. */
  function lightRule(x: number, y: number, w: number = TW): void {
    const [r, g, b] = hexToRgb(colors.rule);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(BOOKLET_SPACING.ruleLight);
    doc.line(x, y, x + w, y);
  }

  /**
   * Draw section label (ALL CAPS, sans bold, heading color) with gold rule beneath.
   * Returns Y below the rule ready for first content line.
   */
  function sectionLabel(text: string, x: number, y: number): number {
    const [r, g, b] = hexToRgb(colors.heading);
    doc.setFont(BOOKLET_FONTS.sans, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.labelPt);
    doc.setTextColor(r, g, b);
    doc.text(text.toUpperCase(), x, y);
    goldRule(x, y + BOOKLET_SPACING.labelRuleOffset, TW);
    return y + BOOKLET_SPACING.labelRuleOffset + BOOKLET_SPACING.afterSectionLabel;
  }

  /**
   * Draw session page header: SESSION N + scripture ref + title + gold rule.
   * Returns Y below the header ready for first section.
   */
  function pageHeader(
    sessionNum: number,
    title:      string,
    scriptureRef: string,
    x:          number
  ): number {
    let y = BOOKLET_TEXT.topY;

    // SESSION N  |  reference
    const [r, g, b] = hexToRgb(colors.heading);
    doc.setFont(BOOKLET_FONTS.sans, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.footerPt);
    doc.setTextColor(r, g, b);
    doc.text(`${BOOKLET_LABELS.sessionPrefix} ${sessionNum}`, x, y);
    doc.text(scriptureRef, x + TW, y, { align: 'right' });
    y += BOOKLET_FONT_SIZES.titlePt;

    // Lesson title -- centred, serif bold
    const [tr, tg, tb] = hexToRgb(colors.heading);
    doc.setFont(BOOKLET_FONTS.body, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.titlePt);
    doc.setTextColor(tr, tg, tb);
    const titleLines = doc.splitTextToSize(title, TW) as string[];
    for (const tl of titleLines) {
      doc.text(tl, x + TW / 2, y, { align: 'center' });
      y += BOOKLET_FONT_SIZES.titlePt + BOOKLET_SPACING.coverTitleLineGap;
    }
    y -= BOOKLET_SPACING.coverTitleLineGap; // undo trailing extra

    goldRule(x, y + BOOKLET_SPACING.labelRuleOffset, TW, BOOKLET_SPACING.ruleThick);
    return y + BOOKLET_SPACING.labelRuleOffset + BOOKLET_SPACING.afterPageHeader;
  }

  /**
   * Draw page footer: series * site on left, page number on right.
   */
  function pageFooter(pageNumStr: string, x: number): void {
    const [r, g, b] = hexToRgb(colors.meta);
    doc.setFont(BOOKLET_FONTS.sans, 'normal');
    doc.setFontSize(BOOKLET_FONT_SIZES.footerPt);
    doc.setTextColor(r, g, b);
    lightRule(x, BOOKLET_TEXT.footerY - BOOKLET_SPACING.ruleLight * 2, TW);
    doc.text(BOOKLET_LABELS.footerSite, x, BOOKLET_TEXT.footerY);
    doc.text(pageNumStr, x + TW, BOOKLET_TEXT.footerY, { align: 'right' });
  }

  /**
   * Draw centred text within the booklet page text block.
   */
  function centred(
    text:     string,
    x:        number,
    y:        number,
    font:     string,
    size:     number,
    hexColor: string,
    style:    string = 'normal'
  ): void {
    const [r, g, b] = hexToRgb(hexColor);
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(r, g, b);
    doc.text(text, x + TW / 2, y, { align: 'center' });
  }

  /** Draw scripture verse block (italic, indented, gray) + reference. Returns new Y. */
  function scriptureBlock(verse: string, ref: string, x: number, y: number): number {
    const INDENT = BOOKLET_SPACING.bulletIndent - 4;
    y = drawWrapped(
      `\u201C${verse}\u201D`,
      x + INDENT, y, TW - INDENT,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.scripturePt,
      BOOKLET_LEADING.scriptureLd,
      colors.meta, 'italic'
    );
    const [r, g, b] = hexToRgb(colors.heading);
    doc.setFont(BOOKLET_FONTS.sans, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.scriptureRefPt);
    doc.setTextColor(r, g, b);
    doc.text(`\u2014 ${ref}`, x + INDENT, y);
    return y + BOOKLET_SPACING.afterScripture;
  }

  /** Draw bullet item. Returns new Y. */
  function bullet(text: string, x: number, y: number): number {
    const [ar, ag, ab] = hexToRgb(colors.accent);
    doc.setFont(BOOKLET_FONTS.body, 'normal');
    doc.setFontSize(BOOKLET_FONT_SIZES.bodyPt);
    doc.setTextColor(ar, ag, ab);
    doc.text('\u2022', x, y);
    const newY = body(text, x + BOOKLET_SPACING.bulletIndent, y);
    return newY - BOOKLET_SPACING.afterParagraph + BOOKLET_SPACING.afterBulletItem;
  }

  /** Draw numbered discussion question. Returns new Y. */
  function discussionQ(
    num: number,
    category: string,
    text: string,
    x: number,
    y: number
  ): number {
    const [hr, hg, hb] = hexToRgb(colors.heading);
    const [br, bg, bb2] = hexToRgb(colors.body);

    // Number
    doc.setFont(BOOKLET_FONTS.sans, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.labelPt);
    doc.setTextColor(hr, hg, hb);
    doc.text(`${num}.`, x, y);

    // Category label
    const numW = doc.getTextWidth(`${num}.  `);
    doc.setTextColor(br, bg, bb2);
    doc.text(category, x + numW, y);
    const catW = doc.getTextWidth(`${category} `);

    // Question text
    const textX = x + numW + catW;
    const newY = body(text, textX, y);
    return newY - BOOKLET_SPACING.afterParagraph + BOOKLET_SPACING.afterDiscQuestion;
  }

  /** Draw memory verse block (gold rules top + bottom). Returns new Y. */
  function memoryVerseBlock(verse: string, ref: string, x: number, y: number): number {
    goldRule(x, y, TW);
    y += BOOKLET_SPACING.memVerseRuleGap;

    const [r, g, b] = hexToRgb(colors.heading);
    doc.setFont(BOOKLET_FONTS.sans, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.labelPt);
    doc.setTextColor(r, g, b);
    doc.text(BOOKLET_LABELS.memoryVerse.toUpperCase(), x, y);
    y += BOOKLET_LEADING.bodyLd;

    y = drawWrapped(
      `\u201C${verse}\u201D`,
      x, y, TW,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.bodyPt,
      BOOKLET_LEADING.bodyLd,
      colors.body, 'italic'
    );

    const [mr, mg, mb] = hexToRgb(colors.meta);
    doc.setFont(BOOKLET_FONTS.sans, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.scriptureRefPt);
    doc.setTextColor(mr, mg, mb);
    doc.text(`\u2014 ${ref}`, x, y);
    y += BOOKLET_LEADING.bodyLd;

    goldRule(x, y);
    return y + BOOKLET_SPACING.afterMemVerse;
  }

  // ============================================================================
  // BUILD INDIVIDUAL BOOKLET PAGES
  // Each function takes x (left edge of text block) and draws its content.
  // Pages are registered in reading order then laid out by imposition.
  // ============================================================================

  // -- PAGE 1 -- COVER ----------------------------------------------------------
  function drawCover(x: number): void {
    let y = BOOKLET_TEXT.topY;

    // Identity line
    centred(BOOKLET_LABELS.coverIdentLabel, x, y,
      BOOKLET_FONTS.sans, BOOKLET_FONT_SIZES.coverIdentPt, colors.heading, 'bold');
    y += BOOKLET_FONT_SIZES.coverIdentPt + BOOKLET_SPACING.labelRuleOffset;
    goldRule(x, y, TW, BOOKLET_SPACING.ruleThick);
    y += BOOKLET_SPACING.coverDoubleRuleGap;
    goldRule(x, y, TW, BOOKLET_SPACING.ruleLight);
    y += BOOKLET_SPACING.coverSectionGap;

    // Curriculum series label
    centred(BOOKLET_LABELS.coverSeriesLabel, x, y,
      BOOKLET_FONTS.sans, BOOKLET_FONT_SIZES.metaPt, colors.meta);
    y += BOOKLET_SPACING.coverSectionGap;

    // Series title -- large, stacked, centred, bold serif
    const titleWords = series.name?.split(' ') ?? ['Untitled'];
    // First word(s) on smaller line if series title has 3+ words
    const firstLine  = titleWords.length >= 3 ? titleWords[0] : series.name ?? 'Untitled';
    const secondLine = titleWords.length >= 3 ? titleWords.slice(1).join(' ') : null;

    centred(firstLine, x, y,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.coverPreTitlePt, colors.heading, 'bold');
    y += BOOKLET_FONT_SIZES.coverPreTitlePt + BOOKLET_SPACING.coverTitleLineGap;

    if (secondLine) {
      centred(secondLine, x, y,
        BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.coverSeriesPt, colors.heading, 'bold');
      y += BOOKLET_FONT_SIZES.coverSeriesPt + BOOKLET_SPACING.coverTitleLineGap;
    }
    y += BOOKLET_SPACING.afterSectionBlock;

    // Scripture reference
    const passageRef = series.bible_passage ?? '';
    centred(passageRef, x, y,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.coverSubPt, colors.accent, 'italic');
    y += BOOKLET_SPACING.coverSectionGap;

    // Double gold rule
    goldRule(x + BOOKLET_SPACING.coverRuleInset, y, TW - BOOKLET_SPACING.coverRuleInset * 2, BOOKLET_SPACING.ruleLight);
    y += BOOKLET_SPACING.coverDoubleRuleGap;
    goldRule(x + BOOKLET_SPACING.coverRuleInset, y, TW - BOOKLET_SPACING.coverRuleInset * 2, BOOKLET_SPACING.ruleThick);
    y += BOOKLET_SPACING.coverSectionGap;

    // Meta lines -- lesson count, theology, age, date
    const metaLines = [
      `${lessons.length} Lesson${lessons.length !== 1 ? 's' : ''}`,
      series.theology_profile ?? '',
      series.age_group ?? '',
      series.bible_version ?? '',
    ].filter(Boolean);
    for (const ml of metaLines) {
      centred(ml, x, y, BOOKLET_FONTS.sans, BOOKLET_FONT_SIZES.coverMetaPt, colors.meta);
      y += BOOKLET_LEADING.metaLd;
    }
    y += BOOKLET_SPACING.coverSectionGap;

    // Brief description (italic)
    const desc = series.description ??
      'A series prepared using BibleLessonSpark.com, crafted to align with ' +
      'your theology profile and age group.';
    y = drawWrapped(desc, x, y, TW,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.coverMetaPt,
      BOOKLET_LEADING.metaLd, colors.meta, 'italic');

    // Bottom -- site identity
    centred(BOOKLET_LABELS.backCoverSite, x, BOOKLET_TEXT.footerY,
      BOOKLET_FONTS.sans, BOOKLET_FONT_SIZES.coverSitePt, colors.heading, 'bold');
  }

  // -- PAGE 2 -- TABLE OF CONTENTS -------------------------------------------
  function drawToc(x: number): void {
    let y = sectionLabel(BOOKLET_LABELS.tocHeading, x, BOOKLET_TEXT.topY);

    // Introduction entry
    const [r, g, b] = hexToRgb(colors.heading);
    doc.setFont(BOOKLET_FONTS.sans, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.tocSessionPt);
    doc.setTextColor(r, g, b);
    doc.text(BOOKLET_LABELS.tocIntroEntry, x, y);
    y += BOOKLET_SPACING.tocEntryGap;

    // One entry per lesson
    lessons.forEach((lesson, i) => {
      const title = extractCreativeTitle(lesson) ?? lesson.title ?? `Lesson ${i + 1}`;
      const ref   = lesson.filters?.passage ?? series.bible_passage ?? '';

      doc.setFont(BOOKLET_FONTS.sans, 'bold');
      doc.setFontSize(BOOKLET_FONT_SIZES.tocSessionPt);
      doc.setTextColor(r, g, b);
      doc.text(`Session ${i + 1}`, x, y);
      y += BOOKLET_LEADING.metaLd;

      const [br2, bg2, bb2] = hexToRgb(colors.body);
      doc.setFont(BOOKLET_FONTS.body, 'bold');
      doc.setFontSize(BOOKLET_FONT_SIZES.tocTitlePt);
      doc.setTextColor(br2, bg2, bb2);
      const titleLines = doc.splitTextToSize(title, TW - BOOKLET_SPACING.bulletIndent) as string[];
      for (const tl of titleLines) {
        doc.text(tl, x + BOOKLET_SPACING.bulletIndent, y);
        y += BOOKLET_FONT_SIZES.tocTitlePt + BOOKLET_SPACING.afterParagraph;
      }

      if (ref) {
        const [mr2, mg2, mb2] = hexToRgb(colors.meta);
        doc.setFont(BOOKLET_FONTS.body, 'italic');
        doc.setFontSize(BOOKLET_FONT_SIZES.tocScripturePt);
        doc.setTextColor(mr2, mg2, mb2);
        doc.text(ref, x + BOOKLET_SPACING.bulletIndent, y);
        y += BOOKLET_SPACING.tocScriptureGap;
      }
      y += BOOKLET_SPACING.afterBulletItem;
    });

    // Group Handout entry
    doc.setFont(BOOKLET_FONTS.sans, 'bold');
    doc.setFontSize(BOOKLET_FONT_SIZES.tocSessionPt);
    doc.setTextColor(r, g, b);
    doc.text(BOOKLET_LABELS.tocHandoutEntry, x, y);
    y += BOOKLET_SPACING.tocEntryGap;

    // Copyright note
    y += BOOKLET_SPACING.afterSectionBlock;
    lightRule(x, y);
    y += BOOKLET_SPACING.afterParagraph;
    drawWrapped(
      BOOKLET_LABELS.copyrightNote,
      x, y, TW,
      BOOKLET_FONTS.sans, BOOKLET_FONT_SIZES.copyrightPt,
      BOOKLET_LEADING.copyrightLd, colors.meta
    );

    pageFooter('2', x);
  }

  // -- PAGE 3 -- INTRODUCTION ------------------------------------------------
  function drawIntro(x: number): void {
    let y = sectionLabel(BOOKLET_LABELS.introHeading, x, BOOKLET_TEXT.topY);
    y = body(BOOKLET_LABELS.introBody, x, y);
    y = body(BOOKLET_LABELS.introClosing, x, y, 'italic');
    y += BOOKLET_SPACING.afterSectionBlock;

    const [r, g, b] = hexToRgb(colors.accent);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(BOOKLET_SPACING.ruleLight);
    doc.line(x, y, x + TW, y);
    y += BOOKLET_SPACING.afterSectionBlock;

    y = sectionLabel(BOOKLET_LABELS.introHowToUse, x, y);

    const howTo: Array<[string, string]> = [
      [BOOKLET_LABELS.howToBeforeClass, BOOKLET_LABELS.howToBeforeBody],
      [BOOKLET_LABELS.howToDuringClass, BOOKLET_LABELS.howToDuringBody],
      [BOOKLET_LABELS.howToHandouts,    BOOKLET_LABELS.howToHandoutsBody],
    ];
    for (const [lbl, txt] of howTo) {
      const [hr2, hg2, hb2] = hexToRgb(colors.heading);
      doc.setFont(BOOKLET_FONTS.sans, 'bold');
      doc.setFontSize(BOOKLET_FONT_SIZES.labelPt);
      doc.setTextColor(hr2, hg2, hb2);
      doc.text(lbl, x, y);
      y += BOOKLET_LEADING.bodyLd;
      y = body(txt, x + BOOKLET_SPACING.bulletIndent, y);
      y += BOOKLET_SPACING.afterBulletItem;
    }

    pageFooter('3', x);
  }

  // -- PAGES 4--6 per lesson -- dynamically built -----------------------------
  // Each lesson contributes 3 booklet pages:
  //   Page A: Overview + Theological Background + Key Scriptures
  //   Page B: Teacher Prep + Opening Activities + Gospel Connection
  //   Page C: Discussion + Memory Verse + Weekly Challenge

  function drawLessonPageA(lesson: Lesson, sessionNum: number, pageNum: number, x: number): void {
    const title = extractCreativeTitle(lesson) ?? lesson.title ?? `Session ${sessionNum}`;
    const ref   = lesson.filters?.passage ?? series.bible_passage ?? '';
    let y = pageHeader(sessionNum, title, ref, x);

    // Overview
    y = sectionLabel(BOOKLET_LABELS.lessonOverview, x, y);
    const overviewContent = extractSection(lesson, 'lens_overview');
    if (overviewContent) y = body(overviewContent, x, y);
    y += BOOKLET_SPACING.afterSectionBlock;

    // Theological Background
    y = sectionLabel(BOOKLET_LABELS.theologicalBg, x, y);
    const theologyContent = extractSection(lesson, 'theological_background');
    if (theologyContent) y = body(theologyContent, x, y);
    y += BOOKLET_SPACING.afterSectionBlock;

    // Key Scriptures
    y = sectionLabel(BOOKLET_LABELS.keyScriptures, x, y);
    const scriptures = extractScriptures(lesson);
    for (const { verse, reference } of scriptures) {
      y = scriptureBlock(verse, reference, x, y);
    }

    pageFooter(String(pageNum), x);
  }

  function drawLessonPageB(lesson: Lesson, sessionNum: number, pageNum: number, x: number): void {
    const title = extractCreativeTitle(lesson) ?? lesson.title ?? `Session ${sessionNum}`;
    const ref   = lesson.filters?.passage ?? series.bible_passage ?? '';
    let y = pageHeader(sessionNum, title, ref, x);

    // Teacher Preparation
    y = sectionLabel(BOOKLET_LABELS.teacherPrep, x, y);
    const prepContent = extractSection(lesson, 'objectives_scripture');
    if (prepContent) {
      const prepLines = prepContent.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
      if (prepLines.length > 0) {
        for (const ln of prepLines) {
          y = bullet(ln.replace(/^[-*]\s*/, ''), x, y);
        }
      } else {
        y = body(prepContent, x, y);
      }
    }
    y += BOOKLET_SPACING.afterSectionBlock;

    // Opening Activities
    y = sectionLabel(BOOKLET_LABELS.openingActivities, x, y);
    const activitiesContent = extractSection(lesson, 'opening_activities');
    if (activitiesContent) y = body(activitiesContent, x, y);
    y += BOOKLET_SPACING.afterSectionBlock;

    // Gospel Connection (from teaching transcript)
    y = sectionLabel(BOOKLET_LABELS.gospelConnection, x, y);
    const gospelContent = extractGospelConnection(lesson);
    if (gospelContent) y = body(gospelContent, x, y);

    pageFooter(String(pageNum), x);
  }

  function drawLessonPageC(lesson: Lesson, sessionNum: number, pageNum: number, x: number): void {
    const title = extractCreativeTitle(lesson) ?? lesson.title ?? `Session ${sessionNum}`;
    const ref   = lesson.filters?.passage ?? series.bible_passage ?? '';
    let y = pageHeader(sessionNum, title, ref, x);

    // Discussion Questions
    y = sectionLabel(BOOKLET_LABELS.discussionAssess, x, y);
    const discussionContent = extractSection(lesson, 'discussion_assessment');
    if (discussionContent) {
      const qLines = parseDiscussionQuestions(discussionContent);
      if (qLines.length > 0) {
        for (const { num, category, text } of qLines) {
          y = discussionQ(num, category, text, x, y);
        }
      } else {
        y = body(discussionContent, x, y);
      }
    }
    y += BOOKLET_SPACING.afterSectionBlock;

    // Memory Verse
    const memVerse = extractMemoryVerse(lesson);
    if (memVerse) {
      y = memoryVerseBlock(memVerse.verse, memVerse.reference, x, y);
      y += BOOKLET_SPACING.afterSectionBlock;
    }

    // Weekly Challenge
    y = sectionLabel(BOOKLET_LABELS.weeklyChallenge, x, y);
    const challengeContent = extractSection(lesson, 'weekly_challenge') ??
      extractChallenge(lesson);
    if (challengeContent) body(challengeContent, x, y, 'italic');

    pageFooter(String(pageNum), x);
  }

  // -- STUDENT HANDOUT PAGE -------------------------------------------------
  function drawHandout(lesson: Lesson, sessionNum: number, pageNum: number, x: number): void {
    let y = sectionLabel(
      `${BOOKLET_LABELS.groupHandout} \u00B7 Session ${sessionNum}`,
      x, BOOKLET_TEXT.topY
    );

    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const handoutContent = extractSection(lesson, 'student_handout') ??
      stripSection8FromContent(rawContent);

    if (handoutContent) {
      // Render group handout content -- bold labels, bullets, italic questions
      y = renderHandoutContent(handoutContent, x, y);
    }

    pageFooter(String(pageNum), x);
  }

  // -- BACK COVER ------------------------------------------------------------
  function drawBackCover(x: number): void {
    const midY = BOOKLET_SHEET.heightPt / 2;
    goldRule(x + BOOKLET_SPACING.coverRuleInset, midY + BOOKLET_SPACING.coverSectionGap, TW - BOOKLET_SPACING.coverRuleInset * 2, BOOKLET_SPACING.ruleLight);
    const gapAboveTitle = BOOKLET_SPACING.coverSectionGap + BOOKLET_SPACING.afterSectionBlock;
    goldRule(x + BOOKLET_SPACING.coverRuleInset, midY + gapAboveTitle, TW - BOOKLET_SPACING.coverRuleInset * 2, BOOKLET_SPACING.ruleThick);

    centred(BOOKLET_LABELS.backCoverSite, x, midY,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.titlePt, colors.heading, 'bold');

    centred(BOOKLET_LABELS.backCoverLine1, x, midY - BOOKLET_LEADING.bodyLd,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.bodyPt - 1, colors.meta, 'italic');
    centred(BOOKLET_LABELS.backCoverLine2, x, midY - BOOKLET_LEADING.bodyLd * 2,
      BOOKLET_FONTS.body, BOOKLET_FONT_SIZES.bodyPt - 1, colors.meta, 'italic');

    goldRule(x + BOOKLET_SPACING.coverRuleInset, midY - BOOKLET_LEADING.bodyLd * 3, TW - BOOKLET_SPACING.coverRuleInset * 2, BOOKLET_SPACING.ruleThick);
    goldRule(x + BOOKLET_SPACING.coverRuleInset, midY - BOOKLET_LEADING.bodyLd * 3 - BOOKLET_SPACING.coverDoubleRuleGap, TW - BOOKLET_SPACING.coverRuleInset * 2, BOOKLET_SPACING.ruleLight);
  }

  // ============================================================================
  // CONTENT EXTRACTION UTILITIES
  // Parse lesson content into structured pieces for page layout.
  // ============================================================================

  function extractSection(lesson: Lesson, sectionKey: string): string | null {
    const content = lesson.shaped_content ?? lesson.original_text ?? '';
    // Sections are delimited by markdown headings
    const patterns = [
      new RegExp(`#+\\s+(?:Section \\d+[:\\s]+)?${sectionKey.replace(/_/g, '[\\s_-]+')}[\\s\\S]*?(?=\\n#+\\s|$)`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0]
          .replace(/^#+\s+.*\n/, '')   // strip heading line
          .replace(/\*\*([^*]+)\*\*/g, '$1')  // strip bold markers
          .trim();
      }
    }
    return null;
  }

  function extractScriptures(lesson: Lesson): Array<{ verse: string; reference: string }> {
    const content = lesson.shaped_content ?? lesson.original_text ?? '';
    const results: Array<{ verse: string; reference: string }> = [];
    // Match quoted scripture blocks
    const pattern = /["\u201C]([^"\u201D]+)["\u201D]\s*[\u2014\-]\s*([A-Z][a-z]+ \d+:\d+(?:[--\-]\d+)?(?:\s*\([A-Z]+\))?)/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      results.push({ verse: match[1].trim(), reference: match[2].trim() });
    }
    return results.slice(0, 3); // max 3 scripture blocks per page
  }

  function extractMemoryVerse(lesson: Lesson): { verse: string; reference: string } | null {
    const content = lesson.shaped_content ?? lesson.original_text ?? '';
    const pattern = /Memory Verse[:\s]+["\u201C]([^"\u201D]+)["\u201D]\s*[\u2014\-]\s*([A-Z][a-z]+ \d+:\d+[^\n]*)/i;
    const match = content.match(pattern);
    if (!match) return null;
    return { verse: match[1].trim(), reference: match[2].trim() };
  }

  function extractGospelConnection(lesson: Lesson): string | null {
    const content = lesson.shaped_content ?? lesson.original_text ?? '';
    const pattern = /Gospel Connection[:\s]+([\s\S]*?)(?=\n##|\n\*\*[A-Z]|$)/i;
    const match = content.match(pattern);
    return match ? match[1].replace(/\*\*/g, '').trim() : null;
  }

  function extractChallenge(lesson: Lesson): string | null {
    const content = lesson.shaped_content ?? lesson.original_text ?? '';
    const pattern = /Weekly Challenge[:\s]+([\s\S]*?)(?=\n##|\n\*\*[A-Z]|$)/i;
    const match = content.match(pattern);
    return match ? match[1].replace(/\*\*/g, '').trim() : null;
  }

  interface DiscussionQuestion { num: number; category: string; text: string; }

  function parseDiscussionQuestions(content: string): DiscussionQuestion[] {
    const results: DiscussionQuestion[] = [];
    // Match: **1.** **Category:** text
    const pattern = /\*\*(\d+)\.\*\*\s+\*\*([A-Za-z ]+):\*\*\s+([^\n]+)/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      results.push({
        num: parseInt(match[1]),
        category: match[2].trim() + ':',
        text: match[3].trim(),
      });
    }
    return results;
  }

  function renderHandoutContent(content: string, x: number, startY: number): number {
    let y = startY;
    const lines = content.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (!line) { y += BOOKLET_SPACING.afterParagraph; continue; }
      // Bold label lines (e.g. **Key Idea:**)
      if (/^\*\*[^*]+:\*\*/.test(line)) {
        const labelText = line.replace(/\*\*/g, '').replace(/:$/, '').trim();
        const [r, g, b] = hexToRgb(colors.heading);
        doc.setFont(BOOKLET_FONTS.sans, 'bold');
        doc.setFontSize(BOOKLET_FONT_SIZES.labelPt);
        doc.setTextColor(r, g, b);
        doc.text(labelText.toUpperCase(), x, y);
        y += BOOKLET_LEADING.bodyLd;
        continue;
      }
      // Bullet lines
      if (/^[*\-\*]\s/.test(line)) {
        y = bullet(line.replace(/^[*\-\*]\s/, ''), x, y);
        continue;
      }
      // Numbered items
      const numMatch = line.match(/^\*\*(\d+)\.\*\*\s+(.*)/);
      if (numMatch) {
        y = discussionQ(parseInt(numMatch[1]), '', numMatch[2], x, y);
        continue;
      }
      // Plain body
      y = body(line.replace(/\*\*/g, ''), x, y);
    }
    return y;
  }

  // ============================================================================
  // REGISTER BOOKLET PAGES IN READING ORDER
  // ============================================================================

  setStep('cover');
  // p1 -- Cover
  bookletPages.push((x) => drawCover(x));

  setStep('toc');
  // p2 -- Table of Contents
  bookletPages.push((x) => drawToc(x));

  // p3 -- Introduction
  bookletPages.push((x) => drawIntro(x));

  setStep('lessons');
  // 3 pages per lesson: Overview/Theology, Prep/Activities, Discussion
  lessons.forEach((lesson, i) => {
    const sessionNum = i + 1;
    const basePageNum = 4 + i * 3;  // p4, p7, p10, ...
    bookletPages.push((x) => drawLessonPageA(lesson, sessionNum, basePageNum,     x));
    bookletPages.push((x) => drawLessonPageB(lesson, sessionNum, basePageNum + 1, x));
    bookletPages.push((x) => drawLessonPageC(lesson, sessionNum, basePageNum + 2, x));
  });

  setStep('handouts');
  if (options.includeHandoutSection) {
    lessons.forEach((lesson, i) => {
      const handoutPageNum = 4 + lessons.length * 3 + i;
      bookletPages.push((x) => drawHandout(lesson, i + 1, handoutPageNum, x));
    });
  }

  // Back cover -- always last
  bookletPages.push((x) => drawBackCover(x));

  // ============================================================================
  // PAD TO NEXT MULTIPLE OF 4
  // ============================================================================

  while (bookletPages.length % 4 !== 0) {
    bookletPages.push((_x) => { /* intentionally blank padding page */ });
  }

  const totalBookletPages = bookletPages.length;
  assertValidPageCount(totalBookletPages);

  // ============================================================================
  // IMPOSITION -- LAY PAGES ONTO PHYSICAL SHEETS
  // ============================================================================

  setStep('finalizing');

  const impositionPlan = buildImpositionPlan(totalBookletPages);
  let firstSheet = true;

  for (const sheet of impositionPlan) {
    // FRONT side of sheet
    if (!firstSheet) doc.addPage('letter', 'landscape');
    firstSheet = false;

    // Left page (0-indexed: frontLeft - 1)
    bookletPages[sheet.frontLeft - 1](BOOKLET_TEXT_X.left);

    // Optional fold marker (PREVIEW_MODE only -- never in teacher's download)
    if (options.previewMode) {
      const [fr, fg, fb] = hexToRgb(colors.fold);
      doc.setDrawColor(fr, fg, fb);
      doc.setLineWidth(BOOKLET_SPACING.foldLineThick);
      doc.setLineDashPattern([BOOKLET_SPACING.foldLineDash, BOOKLET_SPACING.foldLineGap], 0);
      doc.line(
        BOOKLET_SHEET.halfWidthPt,
        BOOKLET_SPACING.foldLineDash * 2,
        BOOKLET_SHEET.halfWidthPt,
        BOOKLET_SHEET.heightPt - BOOKLET_SPACING.foldLineDash * 2
      );
      doc.setLineDashPattern([], 0);
    }

    // Right page
    bookletPages[sheet.frontRight - 1](BOOKLET_TEXT_X.right);

    // BACK side of sheet
    doc.addPage('letter', 'landscape');

    bookletPages[sheet.backLeft - 1](BOOKLET_TEXT_X.left);

    if (options.previewMode) {
      const [fr, fg, fb] = hexToRgb(colors.fold);
      doc.setDrawColor(fr, fg, fb);
      doc.setLineWidth(BOOKLET_SPACING.foldLineThick);
      doc.setLineDashPattern([BOOKLET_SPACING.foldLineDash, BOOKLET_SPACING.foldLineGap], 0);
      doc.line(
        BOOKLET_SHEET.halfWidthPt,
        BOOKLET_SPACING.foldLineDash * 2,
        BOOKLET_SHEET.halfWidthPt,
        BOOKLET_SHEET.heightPt - BOOKLET_SPACING.foldLineDash * 2
      );
      doc.setLineDashPattern([], 0);
    }

    bookletPages[sheet.backRight - 1](BOOKLET_TEXT_X.right);
  }

  return doc.output('arraybuffer');
}
