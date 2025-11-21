export interface LessonSection {
  id: number;
  name: string;
  description: string;
  required: boolean;
  targetWordCount: number;
  requiredElements: string[];
}

export const LESSON_SECTIONS: LessonSection[] = [
  { id: 1, name: "Lesson Overview", description: "Brief summary of the lesson's main theme and purpose", required: true, targetWordCount: 150, requiredElements: ["Main theme statement", "Key takeaway", "Target audience consideration"] },
  { id: 2, name: "Learning Objectives", description: "Clear, measurable goals for what students will learn", required: true, targetWordCount: 100, requiredElements: ["3-5 specific objectives", "Action verbs", "Measurable outcomes"] },
  { id: 3, name: "Key Scripture Passages", description: "Primary and supporting Bible verses for the lesson", required: true, targetWordCount: 200, requiredElements: ["Primary passage with full text", "Supporting verses", "Context notes"] },
  { id: 4, name: "Theological Background", description: "Doctrinal context and historical background", required: true, targetWordCount: 300, requiredElements: ["Historical context", "Theological significance", "Denominational perspective"] },
  { id: 5, name: "Opening Activities", description: "Engaging activities to introduce the lesson topic", required: true, targetWordCount: 200, requiredElements: ["Icebreaker or hook", "Connection to main theme", "Time estimate"] },
  { id: 6, name: "Main Teaching Content", description: "Core biblical teaching and exposition", required: true, targetWordCount: 500, requiredElements: ["Verse-by-verse or thematic exposition", "Key points", "Illustrations"] },
  { id: 7, name: "Interactive Activities", description: "Hands-on activities to reinforce learning", required: true, targetWordCount: 250, requiredElements: ["Age-appropriate activities", "Materials needed", "Instructions"] },
  { id: 8, name: "Discussion Questions", description: "Thought-provoking questions for group discussion", required: true, targetWordCount: 150, requiredElements: ["5-7 questions", "Mix of factual and application", "Follow-up prompts"] },
  { id: 9, name: "Life Applications", description: "Practical ways to apply the lesson to daily life", required: true, targetWordCount: 200, requiredElements: ["Real-world scenarios", "Personal challenges", "Weekly action steps"] },
  { id: 10, name: "Assessment Methods", description: "Ways to evaluate student understanding", required: true, targetWordCount: 150, requiredElements: ["Informal assessment ideas", "Review questions", "Observable outcomes"] },
  { id: 11, name: "Student Handout", description: "Reproducible handout for students to take home", required: true, targetWordCount: 300, requiredElements: ["Key points summary", "Scripture references", "Take-home questions", "Space for notes"] },
  { id: 12, name: "Teacher Preparation Notes", description: "Guidance for teacher preparation and delivery", required: true, targetWordCount: 200, requiredElements: ["Preparation checklist", "Materials list", "Teaching tips", "Prayer focus"] }
];

export const LESSON_STRUCTURE_VERSION = "1.0.0";
export const TOTAL_TARGET_WORD_COUNT = LESSON_SECTIONS.reduce((sum, s) => sum + s.targetWordCount, 0);

export function buildLessonStructurePrompt(): string {
  let prompt = "LESSON STRUCTURE REQUIREMENTS (YOU MUST INCLUDE ALL 12 SECTIONS):\n";
  LESSON_SECTIONS.forEach((section) => {
    prompt += `${section.id}. ${section.name} - ${section.description}\n`;
    prompt += `   Required elements: ${section.requiredElements.join(", ")}\n`;
    prompt += `   Target: ~${section.targetWordCount} words\n`;
  });
  prompt += `\nCRITICAL: You MUST include ALL ${LESSON_SECTIONS.length} sections listed above. Do not skip any section, especially Section 11 (Student Handout).`;
  return prompt;
}
