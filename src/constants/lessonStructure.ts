// src/constants/lessonStructure.ts
// ═══════════════════════════════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH: Lesson Output Structure
// ═══════════════════════════════════════════════════════════════════════════════
//
// SINGLE SOURCE OF TRUTH: 8-Section LessonSparkUSA Framework + Optional Teaser.
//
// GOVERNANCE PRINCIPLE: "Maximum sophistication with minimum redundancy"
//
// Admin can modify:
//   - Section word limits (minWords, maxWords)
//   - Content rules and prohibitions
//   - Enable/disable sections
//   - Add new sections for future features
//
// The Edge Function dynamically builds prompts from this SSOT.
// ═══════════════════════════════════════════════════════════════════════════════

export const LESSON_STRUCTURE_VERSION = "2.1.0";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface LessonSection {
  // BETA-ESSENTIAL (Active Now)
  id: number;
  key: string;
  name: string;
  enabled: boolean;
  required: boolean;
  minWords: number;
  maxWords: number;
  purpose: string;
  contentRules: string[];
  prohibitions: string[];
  redundancyLock: string[];

  // FUTURE-READY (Defined but not enforced in Beta)
  tier?: "free" | "basic" | "standard" | "premium" | "enterprise";
  featureFlag?: string;
  creditCost?: number;
  upsellMessage?: string;
  outputTarget?: "teacher" | "student" | "both";
  deliveryTiming?: "pre-lesson" | "during-lesson" | "post-lesson";
  optional?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE 8-SECTION FRAMEWORK + OPTIONAL TEASER (Section 9)
// ═══════════════════════════════════════════════════════════════════════════════

export const LESSON_SECTIONS: LessonSection[] = [
  {
    id: 1,
    key: "lens_overview",
    name: "Lens + Lesson Overview",
    enabled: true,
    required: true,
    minWords: 150,
    maxWords: 250,
    purpose: "Frame the lesson with theological lens and high-level summary",
    contentRules: [
      "Theological profile identification",
      "Lesson title",
      "Lesson summary (2-3 sentences)",
      "Main theme statement",
      "Key takeaway for students (1 sentence)",
      "Brief audience insight note",
    ],
    prohibitions: [
      "No detailed theology - that belongs in Section 3",
      "No teaching content or classroom dialogue",
      "No activity descriptions",
      "No scripture exposition",
    ],
    redundancyLock: [],
    tier: "free",
    featureFlag: "core_lesson",
    creditCost: 0,
    outputTarget: "teacher",
    deliveryTiming: "during-lesson",
  },
  {
    id: 2,
    key: "objectives_scripture",
    name: "Learning Objectives + Key Scriptures",
    enabled: true,
    required: true,
    minWords: 150,
    maxWords: 250,
    purpose: "Define measurable outcomes and identify scripture references",
    contentRules: [
      "3-5 bulleted measurable learning objectives",
      "Primary scripture passage with full reference",
      "1-2 supporting passages (if applicable)",
      "Teacher preparation checklist",
    ],
    prohibitions: [
      "No theological explanation - that belongs in Section 3",
      "No teaching narrative",
      "Minimal commentary on passages",
      "No activities",
    ],
    redundancyLock: [],
    tier: "free",
    featureFlag: "core_lesson",
    creditCost: 0,
    outputTarget: "teacher",
    deliveryTiming: "during-lesson",
  },
  {
    id: 3,
    key: "theological_background",
    name: "Theological Background (Deep-Dive)",
    enabled: true,
    required: true,
    minWords: 450,
    maxWords: 600,
    purpose: "ALL deep theology lives here - prevents redundancy in other sections",
    contentRules: [
      "Interpretive background for the passage",
      "Doctrinal framing aligned with theological profile",
      "Literary context (genre, structure, author purpose)",
      "Historical context (time, place, audience)",
      "Key Greek/Hebrew word insights (age-appropriate)",
      "Theological significance and doctrinal connections",
      "Age-appropriate depth notes for the teacher",
      "Cross-references to related passages",
    ],
    prohibitions: [
      "No activity descriptions",
      "No classroom dialogue or transitions",
      "No student handout content",
      "This section is for TEACHER BACKGROUND only",
    ],
    redundancyLock: [],
    tier: "basic",
    featureFlag: "deep_theology",
    creditCost: 1,
    outputTarget: "teacher",
    deliveryTiming: "during-lesson",
  },
  {
    id: 4,
    key: "opening_activities",
    name: "Opening Activities",
    enabled: true,
    required: true,
    minWords: 120,
    maxWords: 200,
    purpose: "Attention-getting introduction and warm-up engagement",
    contentRules: [
      "1-2 age-appropriate opening activities",
      "Attention-getting hook or provocative question",
      "Warm-up discussion prompt",
      "Clear transition phrase into main teaching",
      "Time estimate for each activity",
    ],
    prohibitions: [
      "No deep theology - reference Section 3 as needed",
      "No lengthy explanations",
      "No main teaching content",
    ],
    redundancyLock: ["theological_background"],
    tier: "free",
    featureFlag: "core_lesson",
    creditCost: 0,
    outputTarget: "teacher",
    deliveryTiming: "during-lesson",
  },
  {
    id: 5,
    key: "teaching_transcript",
    name: "Main Teaching Content (Teacher Transcript)",
    enabled: true,
    required: true,
    minWords: 450,
    maxWords: 600,
    purpose: "Spoken classroom delivery script - what the teacher actually SAYS",
    contentRules: [
      "Written as natural spoken dialogue",
      "Identify passage and topic clearly at the start",
      "Include verbal transitions between points",
      "Include pacing cues (pause, wait for responses)",
      "Include classroom engagement lines",
      "Age-appropriate vocabulary and sentence structure",
      "Clear teaching flow: intro - main points - conclusion",
      "End with a memorable statement or challenge",
    ],
    prohibitions: [
      "Do NOT repeat theological explanations from Section 3",
      "Do NOT write academic-style paragraphs",
      "Do NOT re-explain doctrine already covered",
      "This is SPOKEN WORDS, not written essay",
    ],
    redundancyLock: ["theological_background"],
    tier: "free",
    featureFlag: "core_lesson",
    creditCost: 0,
    outputTarget: "teacher",
    deliveryTiming: "during-lesson",
  },
  {
    id: 6,
    key: "interactive_activities",
    name: "Interactive Activities",
    enabled: true,
    required: true,
    minWords: 150,
    maxWords: 250,
    purpose: "Hands-on reinforcement activities during the lesson",
    contentRules: [
      "1-3 activities that reinforce the main point",
      "Clear step-by-step instructions",
      "Materials needed (if any)",
      "Time estimate for each activity",
      "Adaptation notes for different class sizes",
    ],
    prohibitions: [
      "No theological re-explanation",
      "No duplicate content from opening activities",
      "No new teaching - activities reinforce only",
    ],
    redundancyLock: ["theological_background", "opening_activities"],
    tier: "free",
    featureFlag: "core_lesson",
    creditCost: 0,
    outputTarget: "teacher",
    deliveryTiming: "during-lesson",
  },
  {
    id: 7,
    key: "discussion_assessment",
    name: "Discussion & Assessment",
    enabled: true,
    required: true,
    minWords: 200,
    maxWords: 300,
    purpose: "Comprehension checks and spiritual application assessment",
    contentRules: [
      "3-5 discussion questions (recall to application)",
      "Informal comprehension check suggestions",
      "Behavioral or spiritual indicators of understanding",
      "Closing reflection prompt",
      "Connection to weekly challenge",
    ],
    prohibitions: [
      "Do NOT repeat theology from Section 3",
      "Do NOT repeat transcript content from Section 5",
      "No re-teaching - this assesses understanding",
    ],
    redundancyLock: ["theological_background", "teaching_transcript"],
    tier: "free",
    featureFlag: "core_lesson",
    creditCost: 0,
    outputTarget: "teacher",
    deliveryTiming: "during-lesson",
  },
  {
    id: 8,
    key: "student_handout",
    name: "Student Handout (Standalone)",
    enabled: true,
    required: true,
    minWords: 250,
    maxWords: 400,
    purpose: "Fresh, student-focused standalone takeaway document",
    contentRules: [
      "Lesson title (student-friendly version)",
      "Key idea (1-2 sentences in student language)",
      "Memory verse with reference",
      "3-5 big points (bullet points, student vocabulary)",
      "Gospel connection (age-appropriate)",
      "2-3 reflection questions for personal use",
      "Weekly challenge or action step",
      "Prayer prompt or written prayer",
    ],
    prohibitions: [
      "Do NOT copy long theology from Section 3",
      "Do NOT copy teacher transcript from Section 5",
      "Do NOT use teacher-focused language",
      "Must be CREATIVELY DISTINCT from teacher materials",
      "No teacher notes or instructions",
    ],
    redundancyLock: ["theological_background", "teaching_transcript", "discussion_assessment"],
    tier: "standard",
    featureFlag: "student_handout",
    creditCost: 1,
    outputTarget: "student",
    deliveryTiming: "during-lesson",
  },
  {
    id: 9,
    key: "student_teaser",
    name: "Student Teaser (Pre-Lesson)",
    enabled: true,
    required: false,
    optional: true,
    minWords: 50,
    maxWords: 100,
    purpose: "Build anticipation days before class - shareable via text, email, post, or card",
    contentRules: [
      "Intriguing question or hook related to the lesson theme",
      "Brief hint at what students will discover (without spoilers)",
      "Excitement-building language appropriate to age group",
      "Optional: relevant emoji for digital sharing",
      "Call-to-action inviting them to class",
      "Must stand alone without context",
    ],
    prohibitions: [
      "Do NOT reveal the main teaching point",
      "Do NOT include scripture references (save for class)",
      "Do NOT use teacher language",
      "Do NOT exceed 100 words - brevity is essential",
      "No theological depth - this is a teaser only",
    ],
    redundancyLock: ["lens_overview", "theological_background", "teaching_transcript", "student_handout"],
    tier: "standard",
    featureFlag: "teaser_generation",
    creditCost: 0,
    outputTarget: "student",
    deliveryTiming: "pre-lesson",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const getEnabledSections = (): LessonSection[] => LESSON_SECTIONS.filter((s) => s.enabled && s.required);

export const getRequiredSections = (): LessonSection[] => LESSON_SECTIONS.filter((s) => s.enabled && s.required);

export const getOptionalSections = (): LessonSection[] => LESSON_SECTIONS.filter((s) => s.enabled && s.optional);

export const getSectionByKey = (key: string): LessonSection | undefined => LESSON_SECTIONS.find((s) => s.key === key);

export const getSectionById = (id: number): LessonSection | undefined => LESSON_SECTIONS.find((s) => s.id === id);

export const getTotalMinWords = (): number => getRequiredSections().reduce((sum, s) => sum + s.minWords, 0);

export const getTotalMaxWords = (): number => getRequiredSections().reduce((sum, s) => sum + s.maxWords, 0);

export const getSectionCount = (): number => getRequiredSections().length;

export const getTeaserSection = (): LessonSection | undefined => getSectionByKey("student_teaser");
