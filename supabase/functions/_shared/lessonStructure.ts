/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/lessonStructure.ts
 * Generated: 2026-01-28T22:25:06.611Z
 */
// src/constants/lessonStructure.ts
// SSOT: Single Source of Truth for lesson structure AND export formatting
// Frontend drives backend - all values defined here, imported everywhere

export const LESSON_STRUCTURE_VERSION = "2.4.2";

/**
 * SSOT: Export Spacing Constants
 * All export files (Print, DOCX, PDF) import these values
 * Change here = changes everywhere
 */
export const EXPORT_SPACING = {
  // Font family - Calibri 11pt for readability (60-65yr teachers)
  fonts: {
    primary: 'Calibri',                      // Main font name
    fallback: 'Arial, sans-serif',           // Fallback stack
    css: 'Calibri, Arial, sans-serif',       // For Print/CSS
    docx: 'Calibri',                         // For DOCX export
    pdf: 'Helvetica',                        // PDF fallback (Calibri not native to PDF libs)
  },

  // Page margins - 0.5" all sides
  margins: {
    inches: 0.5,
    twips: 720,        // 0.5 * 1440 twips per inch
    css: '0.5in',
  },
  
  // Section headers - 8pt BEFORE, 4pt AFTER
  sectionHeader: {
    beforePt: 8,
    afterPt: 4,
    beforeTwips: 160,  // 8 * 20 twips per point
    afterTwips: 80,    // 4 * 20 twips per point
  },
  
  // Body text - readable for 60-65yr teachers
  body: {
    fontPt: 11,
    fontHalfPt: 22,    // docx uses half-points
    lineHeight: 1.4,
  },
  
  // Title
  title: {
    fontPt: 14,
    fontHalfPt: 28,
    afterPt: 4,
    afterTwips: 80,
  },
  
  // Section header font
  sectionHeaderFont: {
    fontPt: 14,
    fontHalfPt: 28,
  },
  
  // Teaser box
  teaser: {
    fontPt: 10,
    fontHalfPt: 20,
    paddingPt: 6,
    marginBeforePt: 6,
    marginAfterPt: 8,
    marginBeforeTwips: 120,
    marginAfterTwips: 160,
    borderRadiusPx: 4,
  },
  
  // Metadata line
  metadata: {
    fontPt: 9,
    fontHalfPt: 18,
    afterPt: 6,
    afterTwips: 120,
  },
  
  // Copyright/footer
  footer: {
    fontPt: 8,
    fontHalfPt: 16,
    marginTopPt: 10,
    marginTopTwips: 200,
  },
  
  // Paragraph spacing
  paragraph: {
    afterPt: 4,
    afterTwips: 80,
  },
  
  // List item spacing
  listItem: {
    afterPt: 4,
    afterTwips: 80,
    indentPt: 18,      // Left indent for bullet lists
    indentTwips: 360,  // 18 * 20
  },
  
  // Horizontal rule
  hr: {
    marginPt: 6,
    marginTwips: 120,
  },
  
  // Colors (hex without #)
  colors: {
    teaserBg: 'F0F7FF',
    teaserBorder: '3B82F6',
    teaserText: '2563EB',
    bodyText: '333333',
    metaText: '666666',
    footerText: '999999',
    hrLine: 'CCCCCC',
  },
};

/**
 * SSOT: Export Formatting Labels and Text
 */
export const EXPORT_FORMATTING = {
  boldLabels: ["Theological Profile","Lesson Summary","Main Theme","Key Takeaway","Audience Insight","Learning Objectives","Primary Scripture","Supporting Passages","Teacher Preparation Checklist","Memory Verse","Gospel Connection","Weekly Challenge","Doctrinal Framework","Theological Significance","Interpretive Framework","Literary Context","Historical Context","Transition Statement","Key Idea","Big Points","Reflection Questions","Prayer Prompt","Prayer","Personal Reflection","Comprehension Check","Spiritual Indicators","Closing Reflection","Discussion Questions","Recall","Understanding","Application","Analysis","This Week's Challenge"],
  skipLabels: ["Lesson Title"],
  documentTitleSource: "Lesson Title",
  footerText: "BibleLessonSpark.com",
  teaserLabel: "STUDENT TEASER",
  printTooltip: "Opens in new tab. Close that tab to return here.",
  section8Title: "Section 8: Student Handout",
};

export interface LessonSection {
  id: number; key: string; name: string; enabled: boolean; required: boolean; minWords: number; maxWords: number;
  purpose: string; contentRules: string[]; prohibitions: string[]; redundancyLock: string[];
  tier?: "free" | "basic" | "standard" | "premium" | "enterprise"; featureFlag?: string; creditCost?: number;
  upsellMessage?: string; outputTarget?: "teacher" | "student" | "both";
  deliveryTiming?: "pre-lesson" | "during-lesson" | "post-lesson"; optional?: boolean;
}

export const LESSON_SECTIONS: LessonSection[] = [
  { id: 1, key: "lens_overview", name: "Lens + Lesson Overview", enabled: true, required: true, minWords: 150, maxWords: 250, purpose: "Frame the lesson with theological lens and high-level summary", contentRules: ["Theological profile identification","Lesson title","Lesson summary (2-3 sentences)","Main theme statement","Key takeaway for students (1 sentence)","Brief audience insight note"], prohibitions: ["No detailed theology - that belongs in Section 3","No teaching content or classroom dialogue","No activity descriptions","No scripture exposition"], redundancyLock: [], tier: "free", featureFlag: "core_lesson", creditCost: 0, outputTarget: "teacher", deliveryTiming: "during-lesson" },
  { id: 2, key: "objectives_scripture", name: "Learning Objectives + Key Scriptures", enabled: true, required: true, minWords: 150, maxWords: 250, purpose: "Define measurable outcomes and identify scripture references", contentRules: ["3-5 bulleted measurable learning objectives","Primary scripture passage with full reference","1-2 supporting passages (if applicable)","Teacher preparation checklist"], prohibitions: ["No theological explanation - that belongs in Section 3","No teaching narrative","Minimal commentary on passages","No activities"], redundancyLock: [], tier: "free", featureFlag: "core_lesson", creditCost: 0, outputTarget: "teacher", deliveryTiming: "during-lesson" },
  { id: 3, key: "theological_background", name: "Theological Background (Deep-Dive)", enabled: true, required: true, minWords: 450, maxWords: 600, purpose: "ALL deep theology lives here - prevents redundancy in other sections", contentRules: ["Interpretive background for the passage","Doctrinal framing aligned with theological profile","Literary context (genre, structure, author purpose)","Historical context (time, place, audience)","Key Greek/Hebrew word insights (age-appropriate)","Theological significance and doctrinal connections","Age-appropriate depth notes for the teacher","Cross-references to related passages"], prohibitions: ["No activity descriptions","No classroom dialogue or transitions","No student handout content","This section is for TEACHER BACKGROUND only"], redundancyLock: [], tier: "basic", featureFlag: "deep_theology", creditCost: 1, outputTarget: "teacher", deliveryTiming: "during-lesson" },
  { id: 4, key: "opening_activities", name: "Opening Activities", enabled: true, required: true, minWords: 120, maxWords: 200, purpose: "Attention-getting introduction and warm-up engagement", contentRules: ["1-2 age-appropriate opening activities","Attention-getting hook or provocative question","Warm-up discussion prompt","Clear transition phrase into main teaching","Time estimate for each activity"], prohibitions: ["No deep theology - reference Section 3 as needed","No lengthy explanations","No main teaching content","Do NOT fabricate news stories, current events, statistics, or quotes from real or fictional people","Do NOT present fictional scenarios as if they actually happened - use 'Imagine...' or 'Consider...' for hypotheticals","Do NOT reference 'our state', 'our city', 'this week', or 'recently' as if describing a real event"], redundancyLock: ["theological_background"], tier: "free", featureFlag: "core_lesson", creditCost: 0, outputTarget: "teacher", deliveryTiming: "during-lesson" },
  { id: 5, key: "teaching_transcript", name: "Main Teaching Content (Teacher Transcript)", enabled: true, required: true, minWords: 630, maxWords: 840, purpose: "Spoken classroom delivery script with depth - what the teacher actually SAYS", contentRules: ["Written as natural spoken dialogue","Identify passage and topic clearly at the start","Include verbal transitions between points","Include classroom engagement lines","Age-appropriate vocabulary and sentence structure","Clear teaching flow: intro - main points - conclusion","End with a memorable statement or challenge","Unpack key phrases - anticipate the student asking 'What do you mean by that?'","Do not just assert truth - explain WHY it matters and WHAT it means","Include 2-3 moments where a concept is explained with depth, not just stated","Connect theological ideas to concrete, relatable meaning","Give the teacher enough substance to answer follow-up questions confidently","Draw from Section 3's depth when explaining key concepts in spoken form","Illustrations must be clearly hypothetical ('Imagine...', 'Think about...', 'Picture this...') or use well-known verifiable historical examples"], prohibitions: ["Do NOT repeat theological explanations verbatim from Section 3","Do NOT write academic-style paragraphs","Do NOT re-explain doctrine already covered without adding spoken clarity","This is SPOKEN WORDS, not written essay","No pacing cues like (pause) or (wait for responses)","Do NOT fabricate news stories, current events, statistics, surveys, studies, or quotes","Do NOT present fictional scenarios as real events that 'happened this week' or 'recently'","Do NOT invent quotes attributed to real or fictional people (project managers, researchers, pastors, etc.)","Do NOT reference 'our state', 'our city', 'our community' as if describing real local events","All illustrations must be either: (a) clearly hypothetical using 'Imagine...' or 'Think about...', (b) well-known verifiable historical facts, or (c) universal human experiences stated as general truths","NEVER write 'You may have seen the news about...' or similar phrases implying a real current event"], redundancyLock: ["theological_background"], tier: "free", featureFlag: "core_lesson", creditCost: 0, outputTarget: "teacher", deliveryTiming: "during-lesson" },
  { id: 6, key: "interactive_activities", name: "Interactive Activities", enabled: true, required: true, minWords: 150, maxWords: 250, purpose: "Hands-on reinforcement activities during the lesson", contentRules: ["1-3 activities that reinforce the main point","Clear step-by-step instructions","Materials needed (if any)","Time estimate for each activity","Adaptation notes for different class sizes"], prohibitions: ["No theological re-explanation","No duplicate content from opening activities","No new teaching - activities reinforce only","Do NOT fabricate news stories, current events, statistics, or quotes","Do NOT present fictional scenarios as real events"], redundancyLock: ["theological_background", "opening_activities"], tier: "free", featureFlag: "core_lesson", creditCost: 0, outputTarget: "teacher", deliveryTiming: "during-lesson" },
  { id: 7, key: "discussion_assessment", name: "Discussion & Assessment", enabled: true, required: true, minWords: 200, maxWords: 300, purpose: "Comprehension checks and spiritual application assessment", contentRules: ["FORMAT: Use **Discussion Questions:** as the header","FORMAT: Number questions as **1.** **2.** **3.** **4.** **5.** (bold numbers with periods)","FORMAT: Each question should have a bold category label like **Recall:** or **Understanding:** or **Application:** or **Analysis:** or **Personal Reflection:**","Include 5 discussion questions progressing from recall to application","After questions, include **Comprehension Check:** paragraph with what to listen for","Include **Spiritual Indicators:** paragraph with behavioral signs of understanding","End with **Closing Reflection:** containing a reflective question in quotes"], prohibitions: ["Do NOT repeat theology from Section 3","Do NOT repeat transcript content from Section 5","No re-teaching - this assesses understanding","Do NOT use circled numbers or emoji numbers","Do NOT use plain 1. 2. 3. at start of line - use **1.** **2.** **3.** bold format","Do NOT use ## or # markdown headers - use **Bold:** format instead"], redundancyLock: ["theological_background", "teaching_transcript"], tier: "free", featureFlag: "core_lesson", creditCost: 0, outputTarget: "teacher", deliveryTiming: "during-lesson" },
  { id: 8, key: "student_handout", name: "Student Handout (Standalone)", enabled: true, required: true, minWords: 250, maxWords: 400, purpose: "Fresh, student-focused standalone takeaway document", contentRules: ["FORMAT: Start with lesson title in bold on its own line","FORMAT: Use **Key Idea:** followed by 1-2 sentences","FORMAT: Use **Memory Verse:** followed by verse text with reference","FORMAT: Use **Big Points:** followed by bullet points using • character","FORMAT: Use **Gospel Connection:** followed by a paragraph","FORMAT: Use **Reflection Questions:** as header, then each question on its own line as **1.** Question text / **2.** Question text / **3.** Question text (bold numbers, not plain numbers)","FORMAT: Use **Weekly Challenge:** followed by action step paragraph","FORMAT: Use **Prayer:** followed by a written prayer in quotes","All labels must use **Bold:** format, NOT ## markdown headers","Bullet points for Big Points only - use • character"], prohibitions: ["Do NOT copy long theology from Section 3","Do NOT copy teacher transcript from Section 5","Do NOT use teacher-focused language","Must be CREATIVELY DISTINCT from teacher materials","No teacher notes or instructions","Do NOT use ## or # markdown headers anywhere - use **Bold:** format instead","Do NOT use circled numbers or emoji numbers","Do NOT use plain 1. 2. 3. at start of line for Reflection Questions - use **1.** **2.** **3.** bold format"], redundancyLock: ["theological_background", "teaching_transcript", "discussion_assessment"], tier: "standard", featureFlag: "student_handout", creditCost: 1, outputTarget: "student", deliveryTiming: "during-lesson" },
  { id: 9, key: "student_teaser", name: "Student Teaser (Pre-Lesson)", enabled: true, required: false, optional: true, minWords: 50, maxWords: 100, purpose: "Build emotional curiosity and anticipation by touching felt needs - WITHOUT revealing lesson content", contentRules: ["Start with a relatable feeling, struggle, or life question the student experiences daily","Create an emotional gap or tension that only attending class can resolve","Use language that speaks to the student's real life concerns and circumstances","Hint that something meaningful will be explored without saying what it is","End with subtle invitation that makes them WANT to come discover the answer","Write like a friend sparking curiosity, NOT like a church bulletin announcement","Focus entirely on the FELT NEED, never the biblical solution or content"], prohibitions: ["NEVER mention the Bible passage, book, chapter, or verse","NEVER reveal the main teaching point, theme, or topic","NEVER use lesson-specific theological terms (e.g., 'image of God', 'sanctification', 'covenant')","NEVER summarize what will be taught, learned, or discovered","NEVER sound like a promotional flyer, sermon title, or church announcement","NEVER say 'we will explore' or 'you will discover' or 'we will learn' followed by content","NEVER mention theological concepts, doctrines, or biblical figures by name","NEVER include scripture references of any kind","NEVER use phrases that reveal content like 'ultimate origin story' or 'God's blueprint' or 'made in His image'","NEVER use promotional language like 'You won't want to miss' or 'Join us for'","NEVER mention what the lesson is ABOUT - only touch on feelings the student already has"], redundancyLock: ["lens_overview", "theological_background", "teaching_transcript", "student_handout"], tier: "standard", featureFlag: "teaser_generation", creditCost: 0, outputTarget: "student", deliveryTiming: "pre-lesson" },
];

export const getEnabledSections = (): LessonSection[] => LESSON_SECTIONS.filter((s) => s.enabled && s.required);
export const getRequiredSections = (): LessonSection[] => LESSON_SECTIONS.filter((s) => s.enabled && s.required);
export const getOptionalSections = (): LessonSection[] => LESSON_SECTIONS.filter((s) => s.enabled && s.optional);
export const getSectionByKey = (key: string): LessonSection | undefined => LESSON_SECTIONS.find((s) => s.key === key);
export const getSectionById = (id: number): LessonSection | undefined => LESSON_SECTIONS.find((s) => s.id === id);
export const getTotalMinWords = (): number => getRequiredSections().reduce((sum, s) => sum + s.minWords, 0);
export const getTotalMaxWords = (): number => getRequiredSections().reduce((sum, s) => sum + s.maxWords, 0);
export const getSectionCount = (): number => getRequiredSections().length;
export const getTeaserSection = (): LessonSection | undefined => getSectionByKey("student_teaser");
export const isBoldLabel = (label: string): boolean => EXPORT_FORMATTING.boldLabels.some(l => l.toLowerCase() === label.toLowerCase());
export const isSkipLabel = (label: string): boolean => EXPORT_FORMATTING.skipLabels.some(l => l.toLowerCase() === label.toLowerCase());
