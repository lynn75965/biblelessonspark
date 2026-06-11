// ============================================================================
// SSOT: BLS vs. The Competition -- Comparison Page Content
// Location: src/config/comparisonConfig.ts
//
// This file is the SINGLE SOURCE OF TRUTH for all copy on the public
// /compare page. The page component (src/pages/ComparePage.tsx) renders
// from this config and contains no hardcoded marketing copy.
//
// CANONICAL DATA SOURCE: _import/comparison/comparison-data.json (gitignored).
// The companion .ts export used a broken bls_only/both enum; it is discarded.
// Each comparison row follows the JSON scheme:
//   { capability, competitor: true | false | "partial", bls: true }
//
// PRICING SSOT (Frontend-Drives-Backend): every BLS price/limit figure on this
// page traces to src/constants/pricingConfig.ts + trialConfig.ts. Verified
// 2026-06-10 against the live pricing page:
//   - $9/month   -> PRICING_DISPLAY.personal.monthly.displayText
//   - $90/year   -> PRICING_DISPLAY.personal.annual.displayText
//   - Free tier  -> TRIAL_CONFIG (3 full + 2 short lessons per rolling 30 days)
//   - "Personal Plan" -> PRICING_DISPLAY.personal.displayName
// The pricingBadge and footer.pricingNote below are BUILT from those constants
// so this page can never drift from the pricing page. The "$9/month" and the
// free-tier "3 full + 2 short lessons" figures embedded in the prose
// strengthParagraphs were verified to match the same SSOT on 2026-06-10.
// Competitor prices
// ($15-30, $20-30, etc.) are factual claims sourced in docs/comparison-sources.md.
//
// ASCII-only: em dashes -> "--", en dashes -> "-". Check/cross/partial marks
// are rendered as lucide-react icons in the component, never as glyphs here.
// ============================================================================

import { PRICING_DISPLAY } from '@/constants/pricingConfig';
import { TRIAL_CONFIG } from '@/constants/trialConfig';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

// Canonical JSON scheme: the competitor HAS the capability (true), LACKS it
// (false), or offers it PARTIALLY ("partial"). BLS is true on every row.
export type CompetitorMark = boolean | 'partial';

export interface ComparisonRow {
  capability: string;
  competitor: CompetitorMark;
  bls: boolean;
}

export interface Competitor {
  /** Internal slug (React key + dialog id) */
  id: string;
  /** Full display name */
  name: string;
  /** Short card blurb */
  cardDescription: string;
  /** Denomination / positioning tag shown on the card */
  denominationTag: string;
  /** Subtitle shown under the dialog title */
  modalSubtitle: string;
  /** Full BLS-voice comparison paragraph */
  strengthParagraph: string;
  /** Feature comparison rows */
  comparisonTable: ComparisonRow[];
}

export interface ComparisonPageConfig {
  title: string;
  subtitle: string;
  pricingBadge: string;
  sectionHeading: string;
  sectionInstruction: string;
  footer: {
    pricingNote: string;
    tagline: string;
    accuracyNote: string;
    trademarkNote: string;
  };
  seo: {
    title: string;
    description: string;
  };
}

// ----------------------------------------------------------------------------
// Page-level config (pricing strings composed from the pricing SSOT)
// ----------------------------------------------------------------------------

export const COMPARISON_PAGE: ComparisonPageConfig = {
  title: 'BibleLessonSpark vs. The Competition',
  subtitle:
    'How BibleLessonSpark compares with five trusted Baptist curriculum publishers serving the same teachers, the same classrooms, and the same Sunday mornings.',
  pricingBadge: `${PRICING_DISPLAY.personal.monthly.displayText}  |  ${PRICING_DISPLAY.personal.annual.displayText}  |  Free Tier Available`,
  sectionHeading: 'Select a Publisher to Compare',
  sectionInstruction:
    'Choose any card below to see the full head-to-head comparison with BibleLessonSpark.',
  footer: {
    pricingNote: `BLS: Free (${TRIAL_CONFIG.fullLessonsPerPeriod} full + ${TRIAL_CONFIG.shortLessonsPerPeriod} short lessons every ${TRIAL_CONFIG.resetIntervalDays} days)  |  ${PRICING_DISPLAY.personal.displayName}: ${PRICING_DISPLAY.personal.monthly.displayText} or ${PRICING_DISPLAY.personal.annual.displayText}`,
    tagline:
      'BibleLessonSpark -- Theology-guarded Bible lesson generation for Baptist teachers.',
    accuracyNote: 'Information current as of June 2026.',
    trademarkNote:
      'All competitor names and product names are trademarks or registered trademarks of their respective owners. BibleLessonSpark is not affiliated with, endorsed by, or sponsored by any of the publishers listed.',
  },
  seo: {
    title: 'BibleLessonSpark vs. The Competition | Compare Baptist Curriculum',
    description:
      'See how BibleLessonSpark compares with five trusted Baptist curriculum publishers -- LifeWay, Regular Baptist Press, D6, Answers Bible Curriculum, and Bogard Press -- on customization, pricing, and on-demand lesson generation.',
  },
};

// ----------------------------------------------------------------------------
// Competitors (content from comparison-data.json; prose in BLS voice)
// ----------------------------------------------------------------------------

export const COMPETITORS: Competitor[] = [
  {
    id: 'lifeway',
    name: 'LifeWay Christian Resources',
    cardDescription:
      "The SBC's default publisher since 1891. Explore the Bible, Bible Studies for Life, The Gospel Project, and the Hyfi digital platform.",
    denominationTag: 'Southern Baptist Convention',
    modalSubtitle:
      'A trusted denominational publisher, and an on-demand tool built for the individual teacher',
    strengthParagraph:
      "LifeWay has served Southern Baptist churches since 1891, and today its curriculum reaches approximately 47,000 SBC-affiliated congregations -- Explore the Bible, Bible Studies for Life, The Gospel Project, and the Hyfi platform among them. That reach rests on a centralized model: every church teaching a given quarter receives the same carefully edited content, set by a fixed editorial calendar. BibleLessonSpark serves a different need. Rather than selecting from a published quarter, a teacher generates an original, classroom-ready lesson in minutes from any passage she chooses. Step 3 of the BLS builder offers 14 teacher-and-class descriptors -- including family, home, and mixed-ages settings -- so the lesson fits the room she actually teaches. Where LifeWay prices curriculum per age group per quarter (commonly $15-30+ per department), a single $9/month BLS subscription covers every age group from three-year-olds through senior adults, with no printing or shipping. Because BLS can generate sermon-aligned lessons for every class, a pastor can bring the whole church into Sunday's text in a way a fixed editorial calendar isn't designed to do. And the publishable series system (2-13 lessons) lets a teacher build her own scope and sequence, while DevotionalSpark (7 per month) carries the week's study into the home -- without buying a separate product.",
    comparisonTable: [
      { capability: 'Instant lesson generation', competitor: false, bls: true },
      { capability: 'Teacher selects any passage, any time', competitor: false, bls: true },
      { capability: '12 Baptist theology profiles', competitor: false, bls: true },
      { capability: '14 teacher/class customization descriptors', competitor: false, bls: true },
      { capability: 'Full age range (3 yrs to senior adults)', competitor: true, bls: true },
      { capability: 'Sermon-aligned all-age curriculum', competitor: false, bls: true },
      { capability: '5 pedagogical lesson shapes (reshape)', competitor: false, bls: true },
      { capability: 'Publishable series (2-13 lessons)', competitor: false, bls: true },
      { capability: 'DevotionalSpark (7 devotionals/month)', competitor: false, bls: true },
      { capability: 'Entirely paperless -- zero print cost', competitor: false, bls: true },
      { capability: 'Free tier available', competitor: false, bls: true },
      { capability: 'Explicit Baptist terminology guardrails', competitor: false, bls: true },
      { capability: 'Church plant optimized', competitor: false, bls: true },
      { capability: 'Under $9/month for all features', competitor: false, bls: true },
    ],
  },
  {
    id: 'rbp',
    name: 'Regular Baptist Press',
    cardDescription:
      'The GARBC publishing arm since 1952. Strong Curriculum with a 4-year departmental cycle for fundamental Baptist churches.',
    denominationTag: 'Fundamental Baptist (GARBC)',
    modalSubtitle:
      'A steadfast print publisher for fundamental Baptists, and a digital-native generation engine',
    strengthParagraph:
      "Regular Baptist Press has published for GARBC churches since 1952, with a Strong Curriculum built on a four-year departmental cycle, a KJV/NKJV preference, and a dispensational doctrinal commitment -- convictions many fundamental Baptist teachers hold dearly. BibleLessonSpark honors those same convictions through an Independent/Fundamental Baptist theology profile that includes dispensational guardrails, while adding the flexibility a fixed cycle cannot: a teacher who needs a specific passage this Sunday can generate a complete lesson on demand, from any text, at any time. BLS is paperless by design, which removes the print costs, shipping waits, and unused-copy waste a print-primary quarter can carry. A church using BLS for sermon-aligned, all-age teaching across its full age range -- three-year-olds through senior adults -- pays $9/month in total, and exports to PDF or DOCX whenever a teacher chooses to print. The publishable series system (2-13 lessons) lets fundamental Baptist teachers build their own doctrinally consistent studies without waiting for the next quarter to begin.",
    comparisonTable: [
      { capability: 'Instant lesson generation', competitor: false, bls: true },
      { capability: 'Teacher selects any passage, any time', competitor: false, bls: true },
      { capability: '12 Baptist theology profiles', competitor: false, bls: true },
      { capability: '14 teacher/class customization descriptors', competitor: false, bls: true },
      { capability: 'Full age range (3 yrs to senior adults)', competitor: true, bls: true },
      { capability: 'Sermon-aligned all-age curriculum', competitor: false, bls: true },
      { capability: '5 pedagogical lesson shapes (reshape)', competitor: false, bls: true },
      { capability: 'Publishable series (2-13 lessons)', competitor: false, bls: true },
      { capability: 'DevotionalSpark (7 devotionals/month)', competitor: false, bls: true },
      { capability: 'Entirely paperless -- zero print cost', competitor: false, bls: true },
      { capability: 'Free tier available', competitor: false, bls: true },
      { capability: 'KJV/NKJV/ESV Bible version support', competitor: true, bls: true },
      { capability: 'No quarterly ordering or shipping', competitor: false, bls: true },
      { capability: 'Church plant optimized', competitor: false, bls: true },
    ],
  },
  {
    id: 'd6',
    name: 'Randall House / D6 Curriculum',
    cardDescription:
      'Free Will Baptist publisher with the D6 family-aligned discipleship model connecting church teaching to home devotionals.',
    denominationTag: 'Free Will Baptist',
    modalSubtitle:
      'A family-discipleship publisher, and a configurable platform for church and home',
    strengthParagraph:
      "Randall House and its D6 curriculum, rooted in Deuteronomy 6, have built something many churches love: a family-aligned model where every age studies one theme and take-home devotionals connect Sunday to the rest of the week. BibleLessonSpark pursues that same church-to-home vision by a different path. Step 3 offers explicit family, home, and mixed-ages descriptors, so a lesson can be purpose-built for intergenerational classes or home-based groups. A single generated lesson can be reshaped into any of five pedagogical formats (each reshape using one lesson credit), so one passage can serve the adult class in one shape and the youth group in another. Paired with DevotionalSpark (7 devotionals per month), BLS delivers the continuity from gathering to home that sits at the heart of the D6 model -- generated on demand from the teacher's own chosen passage. BLS's sermon-aligned all-age curriculum draws churchwide alignment from the local church's own preaching calendar, and when a teacher needs to step away from the shared theme to meet a pastoral moment, the 2-13 lesson series system gives her that freedom.",
    comparisonTable: [
      { capability: 'Instant lesson generation', competitor: false, bls: true },
      { capability: 'Teacher selects any passage, any time', competitor: false, bls: true },
      { capability: 'Family/home/mixed-ages class descriptors', competitor: false, bls: true },
      { capability: '14 teacher/class customization descriptors', competitor: false, bls: true },
      { capability: 'Churchwide theme alignment', competitor: true, bls: true },
      { capability: 'Sermon-aligned all-age curriculum', competitor: false, bls: true },
      { capability: '5 pedagogical lesson shapes (reshape)', competitor: false, bls: true },
      { capability: 'Publishable series (2-13 lessons)', competitor: false, bls: true },
      { capability: 'Take-home devotionals', competitor: true, bls: true },
      { capability: 'Devotionals generated on-demand (DevotionalSpark)', competitor: false, bls: true },
      { capability: 'Flexibility to deviate from churchwide theme', competitor: false, bls: true },
      { capability: 'Entirely paperless -- zero print cost', competitor: false, bls: true },
      { capability: '12 Baptist theology profiles', competitor: false, bls: true },
      { capability: 'Free tier available', competitor: false, bls: true },
    ],
  },
  {
    id: 'abc',
    name: 'Answers Bible Curriculum',
    cardDescription:
      "Answers in Genesis' 3-year chronological Bible survey with strong apologetics and young-earth creation emphasis.",
    denominationTag: 'Apologetics-Focused',
    modalSubtitle:
      'A chronological survey with an apologetics emphasis, and a teacher-directed series builder',
    strengthParagraph:
      "Answers Bible Curriculum, from Answers in Genesis, walks a church through a three-year chronological survey of Scripture with a strong young-earth creation and apologetics emphasis, and a whole-family model in which every age studies the same weekly theme. For churches drawn to that approach, it offers real coherence. BibleLessonSpark gives a teacher more room to shape the study to her own class. Through 14 teacher-and-class descriptors and a full age range from three-year-olds to senior adults, lessons adapt to the people in the room. The publishable series system (2-13 lessons) lets a teacher build a chronological survey at her own pace, or assemble a sermon-aligned, all-age study that reaches ABC's whole-family goal without committing to a three-year arc -- and with the freedom to follow the Spirit's leading elsewhere when needed. Every lesson in a series carries full theological guardrail protection across 10 Baptist profiles. BLS runs entirely in the browser with no app to install (ABC Digital uses the myAnswers app), stays fully paperless, and is available at $9/month -- or free for 3 full and 2 short lessons every 30 days -- compared with ABC's $20-30 per quarter per age group.",
    comparisonTable: [
      { capability: 'Instant lesson generation', competitor: false, bls: true },
      { capability: 'Teacher selects any passage, any time', competitor: false, bls: true },
      { capability: '12 Baptist theology profiles', competitor: false, bls: true },
      { capability: '14 teacher/class customization descriptors', competitor: false, bls: true },
      { capability: 'All ages study same passage', competitor: true, bls: true },
      { capability: 'Sermon-aligned all-age curriculum', competitor: false, bls: true },
      { capability: '5 pedagogical lesson shapes (reshape)', competitor: false, bls: true },
      { capability: 'Publishable series (2-13 lessons)', competitor: false, bls: true },
      { capability: 'DevotionalSpark (7 devotionals/month)', competitor: false, bls: true },
      { capability: 'Freedom to deviate from fixed cycle', competitor: false, bls: true },
      { capability: 'No app installation required', competitor: false, bls: true },
      { capability: 'Entirely paperless -- zero print cost', competitor: 'partial', bls: true },
      { capability: 'Free tier available', competitor: false, bls: true },
      { capability: 'Church plant optimized', competitor: false, bls: true },
    ],
  },
  {
    id: 'bogard',
    name: 'Bogard Press',
    cardDescription:
      "The American Baptist Association's KJV-only publisher serving Landmark/Missionary Baptist churches for over 100 years.",
    denominationTag: 'Landmark Baptist (ABA)',
    modalSubtitle:
      'A long-serving Landmark Baptist publisher, and an instant digital platform for small churches',
    strengthParagraph:
      "For more than a century, Bogard Press has served American Baptist Association churches with KJV materials and denominationally subsidized pricing -- a faithful resource for Landmark and Missionary Baptist congregations, often small, rural, and led by dedicated volunteer teachers. BibleLessonSpark meets that same teacher where a print-primary, quarterly model leaves a gap: when she needs a specific passage this week, wants to respond to something happening in the congregation, or needs to supplement the quarter. BLS delivers instantly, with no shipping, no minimum orders, and no waste from unused copies, and it covers the full age range -- three-year-olds through senior adults -- under one subscription. A small church with a single volunteer teacher covering several age groups can use the mixed-ages descriptor and sermon-aligned generation to produce one lesson that fits her actual classroom. And the publishable series system (2-13 lessons) lets her build a coherent multi-week study, with full theological guardrails, without waiting for the next shipment to arrive.",
    comparisonTable: [
      { capability: 'Instant lesson generation', competitor: false, bls: true },
      { capability: 'Teacher selects any passage, any time', competitor: false, bls: true },
      { capability: '12 Baptist theology profiles', competitor: false, bls: true },
      { capability: '14 teacher/class customization descriptors', competitor: false, bls: true },
      { capability: 'Full age range (3 yrs to senior adults)', competitor: true, bls: true },
      { capability: 'Mixed-ages class support', competitor: false, bls: true },
      { capability: 'Sermon-aligned all-age curriculum', competitor: false, bls: true },
      { capability: '5 pedagogical lesson shapes (reshape)', competitor: false, bls: true },
      { capability: 'Publishable series (2-13 lessons)', competitor: false, bls: true },
      { capability: 'DevotionalSpark (7 devotionals/month)', competitor: false, bls: true },
      { capability: 'Entirely paperless -- zero print cost', competitor: false, bls: true },
      { capability: 'No shipping delays or minimum orders', competitor: false, bls: true },
      { capability: 'Digital-native platform', competitor: false, bls: true },
      { capability: 'Free tier available', competitor: false, bls: true },
      { capability: 'Church plant optimized', competitor: false, bls: true },
    ],
  },
];
