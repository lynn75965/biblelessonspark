/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/teacherPreferences.ts
 * Generated: 2026-01-28T20:40:18.897Z
 */
/**
 * Teacher Preferences SSOT
 * Single Source of Truth for all teacher customization options
 *
 * Architecture: Frontend drives backend
 * This file syncs to: supabase/functions/_shared/teacherPreferences.ts
 *
 * UPDATED: January 2026 (Phase 2)
 * - Added `directive` field to PreferenceOption and CheckboxOption interfaces
 * - All options now carry their own Claude behavioral directives
 * - Enables true SSOT: backend reads directives from this file
 * - Phase 1: Education Experience directives, strengthened Activity Types
 * - Phase 2: Added Emotional Entry Point and Theological Lens fields
 * - Profile fields increased from 13 to 15
 */

// ============================================================================
// OPTION INTERFACES
// ============================================================================

export interface PreferenceOption {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  directive?: string;  // Claude's behavioral instruction for this option
}

export interface CheckboxOption {
  id: string;
  label: string;
  directive?: string;  // Claude's behavioral instruction for this option
}

// ============================================================================
// TEACHING STYLE OPTIONS
// ============================================================================

export const TEACHING_STYLES: PreferenceOption[] = [
  { 
    id: "lecture", 
    label: "Lecture-Based", 
    description: "Teacher-led instruction with structured content delivery",
    directive: "TEACHING STYLE (Lecture): Structure content for clear, sequential presentation. Use topic sentences and supporting points. Include memorable phrases for note-taking. Minimize interruptions for questions until designated times."
  },
  { 
    id: "discussion", 
    label: "Discussion-Based", 
    description: "Emphasizes dialogue and student participation",
    directive: "TEACHING STYLE (Discussion-Based): Structure each section around 2-3 open-ended questions. Begin with a hook question. Use \"What do you think...\" and \"How might...\" phrasing. Leave space for student responses. Minimize lecture; maximize Socratic dialogue."
  },
  { 
    id: "interactive", 
    label: "Interactive/Hands-On", 
    description: "Hands-on learning through activities and exercises",
    directive: "TEACHING STYLE (Interactive): Design hands-on activities for each concept. Include simulations, role-plays, or physical demonstrations. Process experiences with reflection questions. Learning happens through doing."
  },
  { 
    id: "storytelling", 
    label: "Storytelling", 
    description: "Narrative-driven teaching using stories and examples",
    directive: "TEACHING STYLE (Storytelling): Frame biblical content through narrative arcs. Use vivid sensory details. Include character perspectives and emotions. Connect ancient stories to modern situations through parallel narratives."
  },
  { 
    id: "socratic", 
    label: "Socratic Method", 
    description: "Teaching through probing questions that lead students to discover truth themselves", 
    tooltip: "Teaching through asking probing questions that lead students to discover truth themselves, rather than directly telling them answers",
    directive: "TEACHING STYLE (Socratic Method): Build entire lesson around sequential questions that lead to discovery. Never state conclusions directly—guide students to discover them. Use \"Why might...\" and \"What if...\" progressions."
  },
  { 
    id: "mixed", 
    label: "Mixed", 
    description: "Balanced combination of teaching methods",
    directive: "TEACHING STYLE (Mixed Methods): Vary approaches across sections. Combine brief lecture with discussion. Include at least one hands-on activity. Use storytelling for key illustrations."
  },
] as const;

// ============================================================================
// LEARNING STYLE OPTIONS
// ============================================================================

export const LEARNING_STYLES: PreferenceOption[] = [
  { 
    id: "visual", 
    label: "Visual Learners", 
    description: "Learn best through images, diagrams, and visual aids",
    directive: "LEARNING STYLE (Visual): Include diagram descriptions, charts, or visual metaphors in each section. Suggest whiteboard layouts. Use spatial language (\"picture this,\" \"imagine seeing\"). Recommend visual aids for activities."
  },
  { 
    id: "auditory", 
    label: "Auditory Learners", 
    description: "Learn best through listening and discussion",
    directive: "LEARNING STYLE (Auditory): Include read-aloud Scripture portions. Suggest verbal repetition of key points. Add call-and-response elements. Include hymn or song references where appropriate."
  },
  { 
    id: "kinesthetic", 
    label: "Kinesthetic/Hands-On", 
    description: "Learn best through physical activities and movement",
    directive: "LEARNING STYLE (Kinesthetic): Include movement or hands-on elements in every section. Suggest standing, walking, or gesture activities. Use tactile object lessons. Make abstract concepts physical."
  },
  { 
    id: "reading-writing", 
    label: "Reading/Writing", 
    description: "Learn best through reading and written exercises",
    directive: "LEARNING STYLE (Reading/Writing): Include journaling prompts throughout. Provide fill-in-the-blank options. Suggest note-taking frameworks. Include written reflection questions."
  },
  { 
    id: "mixed", 
    label: "Mixed Learning Styles", 
    description: "Accommodate multiple learning preferences",
    directive: "LEARNING STYLE (Mixed): Vary learning modalities across sections. Include at least one visual, one auditory, and one kinesthetic element. Accommodate multiple preferences."
  },
] as const;

// ============================================================================
// LESSON LENGTH OPTIONS
// ============================================================================

export const LESSON_LENGTHS: PreferenceOption[] = [
  { 
    id: "15", 
    label: "15 minutes", 
    description: "Very brief session, preschool or quick devotional",
    directive: "LESSON LENGTH (15 minutes): Ultra-concise content. One single point only. One very brief activity (3-4 min). Immediate hook, rapid closure. No tangents. Designed for preschool attention spans or quick devotionals."
  },
  { 
    id: "30", 
    label: "30 minutes", 
    description: "Brief session, typically children's classes",
    directive: "LESSON LENGTH (30 minutes): Keep content tight and focused. One main point only. Single activity lasting 5-7 minutes. Brief opening and closing. No tangents."
  },
  { 
    id: "45", 
    label: "45 minutes", 
    description: "Standard Sunday School timeframe",
    directive: "LESSON LENGTH (45 minutes): Moderate depth with 2-3 supporting points. One main activity (8-10 min) plus brief opener. Allow 5 minutes for discussion."
  },
  { 
    id: "60", 
    label: "60 minutes", 
    description: "Extended class period",
    directive: "LESSON LENGTH (60 minutes): Full development of theme. Include 2 activities. Allow 10 minutes for discussion. Include brief break point suggestion."
  },
  { 
    id: "75", 
    label: "75 minutes", 
    description: "In-depth study session",
    directive: "LESSON LENGTH (75 minutes): Comprehensive coverage. Multiple activities with variety. Extended discussion time. Include suggested break point."
  },
  { 
    id: "90", 
    label: "90 minutes", 
    description: "Extended study or workshop format",
    directive: "LESSON LENGTH (90 minutes): Deep dive format. Include 3+ activities. Allow for extended discussion and application. Include 1-2 break points. Consider small group breakouts."
  },
] as const;

// ============================================================================
// GROUP SIZE OPTIONS
// ============================================================================

export const GROUP_SIZES: PreferenceOption[] = [
  { 
    id: "small-group", 
    label: "Small Group (3-12)", 
    description: "Intimate setting allowing individual attention",
    directive: "GROUP SIZE (Small Group, 3-12): Design for intimate discussion. Every person should speak. Include pair-share activities. Use first names in example dialogues."
  },
  { 
    id: "large-group", 
    label: "Large Group (13+)", 
    description: "Larger group requiring structured activities",
    directive: "GROUP SIZE (Large Group, 13+): Design for visibility and audibility. Use show-of-hands engagement. Include small group breakout instructions. Repeat questions for clarity."
  },
  { 
    id: "one-on-one", 
    label: "One-on-One", 
    description: "Individual mentoring or tutoring",
    directive: "GROUP SIZE (One-on-One): Highly personalized conversation format. Use \"you\" directly. Include space for personal sharing. Adapt pace to individual."
  },
  { 
    id: "family", 
    label: "Family Setting", 
    description: "Multi-generational family worship",
    directive: "GROUP SIZE (Family/Intergenerational): Include age-spanning activities. Suggest parent-child discussion prompts. Vary complexity within same content. Include take-home family application."
  },
  { 
    id: "mixed", 
    label: "Mixed Groups", 
    description: "Variable group sizes",
    directive: "GROUP SIZE (Mixed/Variable): Design adaptable activities that scale up or down. Provide alternatives for different group sizes. Include both pair-share and whole-group options."
  },
] as const;

// ============================================================================
// LEARNING ENVIRONMENT OPTIONS
// ============================================================================

export const LEARNING_ENVIRONMENTS: PreferenceOption[] = [
  { 
    id: "classroom", 
    label: "Church Classroom", 
    description: "Standard room with chairs/tables",
    directive: "ENVIRONMENT (Classroom): Assume chairs/tables, whiteboard access, controlled setting. Include board work suggestions. Reference typical classroom setup."
  },
  { 
    id: "fellowship-hall", 
    label: "Fellowship Hall", 
    description: "Larger multipurpose room",
    directive: "ENVIRONMENT (Fellowship Hall): Assume flexible seating, larger space, possible distractions. Design activities that work with round tables. Include movement activities using the space."
  },
  { 
    id: "home", 
    label: "Home Setting", 
    description: "Small group in residential setting",
    directive: "ENVIRONMENT (Home Setting): Assume comfortable, informal atmosphere. Include living room-friendly activities. Reference household items for object lessons. Keep intimacy of setting."
  },
  { 
    id: "outdoor", 
    label: "Outdoor/Nature", 
    description: "Outside venue or nature setting",
    directive: "ENVIRONMENT (Outdoor): Use nature references and illustrations. Design activities that work without furniture. Include creation-focused observations. Account for weather variables."
  },
  { 
    id: "virtual", 
    label: "Virtual/Online", 
    description: "Remote video conferencing",
    directive: "ENVIRONMENT (Virtual/Online): Include screen-sharing moments. Design for chat participation. Include breakout room instructions. Keep segments short (10-12 min max). Suggest interactive tools."
  },
  { 
    id: "mixed", 
    label: "Mixed Environments", 
    description: "Variable locations",
    directive: "ENVIRONMENT (Mixed/Flexible): Design adaptable activities. Provide alternatives for different settings. Keep material portable."
  },
] as const;

// ============================================================================
// STUDENT EXPERIENCE LEVEL OPTIONS
// ============================================================================

export const STUDENT_EXPERIENCE_LEVELS: PreferenceOption[] = [
  { 
    id: "new-believers", 
    label: "New Believers", 
    description: "Recently accepted Christ",
    directive: "STUDENT EXPERIENCE (New Believers): Define all theological terms on first use. Explain church traditions. Avoid assumed knowledge. Include \"basics\" explanations without condescension. Heavy Scripture reading with context."
  },
  { 
    id: "growing", 
    label: "Growing Christians", 
    description: "Developing in faith journey",
    directive: "STUDENT EXPERIENCE (Growing Christians): Balance foundational truths with deeper exploration. Include some theological vocabulary with brief definitions. Encourage questions and wrestling with faith. Build on basic knowledge."
  },
  { 
    id: "mature", 
    label: "Mature Christians", 
    description: "Established, seasoned Christians",
    directive: "STUDENT EXPERIENCE (Mature Christians): Assume biblical literacy. Include deeper word studies. Reference cross-biblical themes. Challenge with harder application questions. Less explanation, more exploration."
  },
  { 
    id: "seekers", 
    label: "Seekers/Non-Believers", 
    description: "Exploring faith questions",
    directive: "STUDENT EXPERIENCE (Seekers/Exploring): Assume minimal Bible knowledge. Explain everything. Use accessible language. Focus on relevance and questions. Welcome doubt openly. Heavy on grace, light on church jargon."
  },
  { 
    id: "mixed", 
    label: "Mixed Experience Levels", 
    description: "Variety of spiritual maturity",
    directive: "STUDENT EXPERIENCE (Mixed Levels): Layer content with basics and depth. Include parenthetical definitions. Design discussions where all can contribute. Avoid embarrassing knowledge gaps."
  },
] as const;

// ============================================================================
// EDUCATION EXPERIENCE OPTIONS
// ============================================================================

export const EDUCATION_EXPERIENCES: PreferenceOption[] = [
  { 
    id: "preschool", 
    label: "Preschool", 
    description: "Early childhood education",
    directive: "EDUCATION LEVEL (Preschool): Use very simple vocabulary (1-2 syllable words). Short sentences only. Heavy repetition. Concrete concepts only—no abstractions. Include songs, rhymes, and movement. Visual and tactile emphasis."
  },
  { 
    id: "elementary", 
    label: "Elementary Education", 
    description: "Elementary school level",
    directive: "EDUCATION LEVEL (Elementary): Use clear, simple language appropriate for children. Explain new words. Use concrete examples before abstract ideas. Include stories and hands-on activities. Keep sentences short and direct."
  },
  { 
    id: "middle", 
    label: "Middle School", 
    description: "Middle school level",
    directive: "EDUCATION LEVEL (Middle School): Use age-appropriate vocabulary with some challenging words defined. Include real-world applications relevant to adolescents. Balance concrete and abstract thinking. Engage with questions about identity and belonging."
  },
  { 
    id: "high-school", 
    label: "High School", 
    description: "High school level",
    directive: "EDUCATION LEVEL (High School): Use mature vocabulary. Include critical thinking challenges. Address real-world complexities. Engage with apologetics and worldview questions. Treat students as emerging adults."
  },
  { 
    id: "some-college", 
    label: "Some College", 
    description: "Partial college education",
    directive: "EDUCATION LEVEL (Some College): Use educated adult vocabulary. Include thoughtful analysis. Reference broader cultural and intellectual contexts. Assume comfort with reading and discussion."
  },
  { 
    id: "associates", 
    label: "Associate's Degree", 
    description: "Two-year college degree",
    directive: "EDUCATION LEVEL (Associate's Degree): Use professional vocabulary. Include analytical elements. Assume familiarity with structured learning. Balance accessibility with intellectual depth."
  },
  { 
    id: "bachelors", 
    label: "Bachelor's Degree", 
    description: "Four-year college degree",
    directive: "EDUCATION LEVEL (Bachelor's Degree): Use sophisticated vocabulary freely. Include nuanced theological discussion. Reference historical and cultural contexts. Assume strong reading comprehension and analytical skills."
  },
  { 
    id: "masters", 
    label: "Master's Degree", 
    description: "Graduate degree",
    directive: "EDUCATION LEVEL (Master's Degree): Use academic vocabulary including theological terms. Include scholarly depth and nuance. Reference primary sources and theological traditions. Assume graduate-level analytical capacity."
  },
  { 
    id: "doctorate", 
    label: "Doctoral/Advanced Degree", 
    description: "Doctoral or professional degree",
    directive: "EDUCATION LEVEL (Doctoral): Use full academic vocabulary including technical theological language. Include deep exegetical and hermeneutical considerations. Reference scholarly debates and original languages where relevant. Assume expert-level comprehension."
  },
  { 
    id: "mixed", 
    label: "Mixed Education Levels", 
    description: "Diverse educational backgrounds",
    directive: "EDUCATION LEVEL (Mixed): Use accessible language while offering depth for advanced learners. Define technical terms parenthetically. Layer content so all education levels can engage. Avoid both condescension and alienation."
  },
] as const;

// ============================================================================
// CULTURAL CONTEXT OPTIONS
// ============================================================================

export const CULTURAL_CONTEXTS: PreferenceOption[] = [
  { 
    id: "urban", 
    label: "Urban", 
    description: "City or metropolitan area context",
    directive: "CULTURAL CONTEXT (Urban): Use city-life illustrations. Reference public transit, apartments, diverse neighbors. Include examples from fast-paced, diverse environments."
  },
  { 
    id: "suburban", 
    label: "Suburban", 
    description: "Residential areas outside city centers",
    directive: "CULTURAL CONTEXT (Suburban): Use family and neighborhood illustrations. Reference schools, sports, commuting. Include middle-class life applications."
  },
  { 
    id: "rural", 
    label: "Rural", 
    description: "Country or small-town setting",
    directive: "CULTURAL CONTEXT (Rural): Use agricultural and small-town illustrations. Reference land, seasons, tight-knit community. Include farming and nature metaphors."
  },
  { 
    id: "international", 
    label: "International", 
    description: "Multicultural or missionary context",
    directive: "CULTURAL CONTEXT (International): Avoid American-specific references. Use universally understood illustrations. Be sensitive to varied cultural backgrounds. Include global church perspective."
  },
  { 
    id: "multicultural", 
    label: "Multicultural", 
    description: "Diverse cultural backgrounds",
    directive: "CULTURAL CONTEXT (Multicultural): Include diverse illustrations. Acknowledge varied backgrounds. Avoid single-culture assumptions. Celebrate diversity in examples."
  },
  { 
    id: "mixed", 
    label: "Mixed Contexts", 
    description: "Variable cultural settings",
    directive: "CULTURAL CONTEXT (Mixed): Use universally relatable illustrations. Avoid context-specific references that exclude. Include variety in examples."
  },
] as const;

// ============================================================================
// SPECIAL NEEDS OPTIONS
// ============================================================================

export const SPECIAL_NEEDS_OPTIONS: PreferenceOption[] = [
  { 
    id: "none", 
    label: "None", 
    description: "No special accommodations needed",
    directive: ""
  },
  { 
    id: "learning-disabilities", 
    label: "Learning Disabilities", 
    description: "Dyslexia, ADHD, etc.",
    directive: "SPECIAL NEEDS (Learning Disabilities): Use short, clear sentences. Repeat key concepts multiple ways. Include multi-sensory reinforcement. Provide extra processing time in activities. Chunk information into small pieces."
  },
  { 
    id: "visual-impaired", 
    label: "Visual Impairment", 
    description: "Low vision or blindness",
    directive: "SPECIAL NEEDS (Visual Impairment): Include verbal descriptions of all visuals. Suggest large-print handout options. Avoid reliance on visual-only content. Emphasize auditory and tactile elements."
  },
  { 
    id: "hearing-impaired", 
    label: "Hearing Impairment", 
    description: "Hard of hearing or deaf",
    directive: "SPECIAL NEEDS (Hearing Impairment): Include visual alternatives for all audio content. Suggest written materials. Recommend seating arrangements for lip-reading. Emphasize visual and written elements."
  },
  { 
    id: "esl", 
    label: "ESL/English Learners", 
    description: "English as second language",
    directive: "SPECIAL NEEDS (ESL/English Learners): Use simple sentence structures. Define idioms and figures of speech. Avoid complex vocabulary when simple words work. Include visual supports. Speak/write key terms clearly."
  },
  { 
    id: "mobility", 
    label: "Mobility Challenges", 
    description: "Physical movement limitations",
    directive: "SPECIAL NEEDS (Mobility Challenges): Design activities that can be done seated. Avoid activities requiring physical movement. Provide alternatives for any standing or walking elements. Consider accessibility of space."
  },
  { 
    id: "mixed", 
    label: "Mixed Needs", 
    description: "Multiple accommodation needs",
    directive: "SPECIAL NEEDS (Mixed/Various): Design with universal accessibility. Include multiple modalities for every key point. Provide scaffolded options. Suggest adaptations for various needs throughout."
  },
] as const;

// ============================================================================
// ASSESSMENT STYLE OPTIONS
// ============================================================================

export const ASSESSMENT_STYLES: PreferenceOption[] = [
  { 
    id: "discussion", 
    label: "Informal Discussion", 
    description: "Conversational assessment through dialogue",
    directive: "ASSESSMENT (Informal Discussion): Check understanding through conversation. Include \"How would you explain this to a friend?\" moments. Observe engagement rather than test."
  },
  { 
    id: "written", 
    label: "Written Reflection", 
    description: "Journaling and written responses",
    directive: "ASSESSMENT (Written Reflection): Include journaling prompts. Provide reflection questions for written response. Suggest take-home writing assignments."
  },
  { 
    id: "quiz", 
    label: "Quiz/Test", 
    description: "Written tests and quizzes",
    directive: "ASSESSMENT (Quiz/Review): Include review questions at end. Provide answer key for teacher. Design quick-check moments throughout."
  },
  { 
    id: "questionnaire", 
    label: "Questionnaire", 
    description: "Structured question formats",
    directive: "ASSESSMENT (Questionnaire): Include structured self-assessment questions. Design reflection questionnaires. Provide rating scales or checklists for personal evaluation."
  },
  { 
    id: "presentation", 
    label: "Student Presentation", 
    description: "Oral presentations and sharing",
    directive: "ASSESSMENT (Presentation/Verbal): Include opportunities for students to teach back. Design share-with-class moments. Allow verbal demonstration of understanding."
  },
  { 
    id: "project", 
    label: "Group Project", 
    description: "Collaborative demonstrations",
    directive: "ASSESSMENT (Project-Based): Include creative project options. Design application projects. Provide rubric suggestions. Allow for extended completion time."
  },
  { 
    id: "observation", 
    label: "Observation Only", 
    description: "Teacher observes without formal assessment",
    directive: "ASSESSMENT (Observation): Include behavioral indicators of understanding. Design observable activities. Provide teacher observation prompts. No formal student assessment required."
  },
] as const;

// ============================================================================
// LANGUAGE OPTIONS
// ============================================================================

export const LANGUAGE_OPTIONS: PreferenceOption[] = [
  { 
    id: "english", 
    label: "English", 
    description: "Generate lesson in English",
    directive: ""
  },
  { 
    id: "spanish", 
    label: "Spanish", 
    description: "Generate lesson in Spanish",
    directive: "LANGUAGE: Generate the entire lesson in Spanish. All content, instructions, Scripture quotations, and student materials must be in Spanish."
  },
  { 
    id: "french", 
    label: "French", 
    description: "Generate lesson in French",
    directive: "LANGUAGE: Generate the entire lesson in French. All content, instructions, Scripture quotations, and student materials must be in French."
  },
] as const;

// ============================================================================
// LESSON SEQUENCE OPTIONS
// ============================================================================

export const LESSON_SEQUENCE_OPTIONS: PreferenceOption[] = [
  { 
    id: "single_lesson", 
    label: "Single Lesson", 
    description: "Complete standalone lesson with all 8 sections",
    directive: "LESSON SEQUENCE (Standalone): Design as complete unit. Include full context. No assumed prior knowledge from previous sessions. Resolve application within this lesson."
  },
  { 
    id: "part_of_series", 
    label: "Part of Series", 
    description: "One lesson in a connected series (7 max)",
    directive: "LESSON SEQUENCE (Part of Series): Include brief connection to series theme. Reference \"last week\" and \"next week\" concepts where appropriate. Build toward cumulative understanding. Include series memory work if applicable."
  },
] as const;

// ============================================================================
// EMOTIONAL ENTRY POINT OPTIONS (Phase 2 - NEW)
// How the lesson emotionally engages students from the opening
// ============================================================================

export const EMOTIONAL_ENTRY_OPTIONS: PreferenceOption[] = [
  {
    id: "curiosity",
    label: "Curiosity",
    description: "Open with mystery or unanswered questions",
    directive: "EMOTIONAL ENTRY (Curiosity): Open with mystery or unanswered questions. Create \"I wonder...\" moments throughout. Delay resolution to build engagement. Use surprising facts or paradoxes to hook attention."
  },
  {
    id: "conviction",
    label: "Conviction",
    description: "Open with bold truth claims",
    directive: "EMOTIONAL ENTRY (Conviction): Open with bold truth claims. Create \"This matters because...\" urgency. Challenge comfort zones early. Build toward decisive response. Emphasize the stakes of the lesson's truth."
  },
  {
    id: "comfort",
    label: "Comfort",
    description: "Open with assurance and safety",
    directive: "EMOTIONAL ENTRY (Comfort): Open with assurance and safety. Create \"You are not alone...\" connection. Emphasize grace before challenge. Use gentle, pastoral tone. Meet students where they are hurting."
  },
  {
    id: "challenge",
    label: "Challenge",
    description: "Open with disruption of assumptions",
    directive: "EMOTIONAL ENTRY (Challenge): Open with disruption of assumptions. Create \"What if you're wrong about...\" tension. Push toward growth and transformation. Confront complacency. Call to higher commitment."
  },
  {
    id: "celebration",
    label: "Celebration",
    description: "Open with gratitude and joy",
    directive: "EMOTIONAL ENTRY (Celebration): Open with gratitude and joy. Create \"Look what God has done...\" wonder. Emphasize praise and thanksgiving throughout. Build toward worship response. Highlight blessings and victories."
  },
  {
    id: "connection",
    label: "Connection",
    description: "Open with shared human experience",
    directive: "EMOTIONAL ENTRY (Connection): Open with shared human experience. Create \"We've all been there...\" moments. Build community through vulnerability. Emphasize \"one another\" relationship. Use stories that unite rather than divide."
  },
] as const;

// ============================================================================
// THEOLOGICAL LENS OPTIONS (Phase 2 - NEW)
// The dominant theological emphasis throughout the lesson
// ============================================================================

export const THEOLOGICAL_LENS_OPTIONS: PreferenceOption[] = [
  {
    id: "obedience",
    label: "Obedience",
    description: "Emphasize faithful response",
    directive: "THEOLOGICAL LENS (Obedience): Emphasize faithful response before understanding. Highlight \"trust and obey\" moments. Application focuses on next steps of obedience. Connect blessing to faithful action. Include accountability elements."
  },
  {
    id: "grace",
    label: "Grace",
    description: "Emphasize God's unmerited favor",
    directive: "THEOLOGICAL LENS (Grace): Emphasize God's initiative and gift. Highlight unmerited favor throughout. Application focuses on receiving and extending grace. Lead with what God has done, not what we must do. Avoid legalism."
  },
  {
    id: "mission",
    label: "Mission",
    description: "Emphasize outward calling and witness",
    directive: "THEOLOGICAL LENS (Mission): Emphasize outward calling and witness. Highlight \"go and tell\" moments. Application focuses on sharing faith and serving others. Connect every truth to its missional implication. Include evangelistic elements."
  },
  {
    id: "worship",
    label: "Worship",
    description: "Emphasize God's worthiness",
    directive: "THEOLOGICAL LENS (Worship): Emphasize God's worthiness and our response. Highlight awe, reverence, and wonder. Application focuses on lifestyle worship. Connect truth to doxology. Include elements of praise and adoration."
  },
  {
    id: "community",
    label: "Community",
    description: "Emphasize togetherness in faith",
    directive: "THEOLOGICAL LENS (Community): Emphasize togetherness in the body of Christ. Highlight \"one another\" commands. Application focuses on relationships within the church. Include fellowship and accountability elements. Stress interdependence."
  },
  {
    id: "discipleship",
    label: "Discipleship",
    description: "Emphasize spiritual growth and formation",
    directive: "THEOLOGICAL LENS (Discipleship): Emphasize spiritual growth and formation. Highlight the journey of following Jesus. Application focuses on spiritual disciplines and maturity. Include mentoring elements. Connect to long-term transformation."
  },
] as const;

// ============================================================================
// ACTIVITY TYPE OPTIONS (Checkboxes)
// ============================================================================

export const ACTIVITY_TYPE_OPTIONS: CheckboxOption[] = [
  { 
    id: "written", 
    label: "Written reflection",
    directive: "ACTIVITY (Written Reflection): Include at least one journaling prompt per main section. Provide sentence starters for reluctant writers. Suggest private vs. shared writing options. Include take-home reflection questions."
  },
  { 
    id: "verbal", 
    label: "Verbal interaction",
    directive: "ACTIVITY (Verbal Interaction): Include structured discussion questions with follow-ups. Design pair-share before whole-group sharing. Provide sentence frames for hesitant speakers. Include debate or perspective-taking options."
  },
  { 
    id: "creative", 
    label: "Creative arts",
    directive: "ACTIVITY (Creative Arts): Include drawing, collage, or craft options. Provide simple and elaborate versions. List materials needed. Connect creative expression to lesson themes explicitly."
  },
  { 
    id: "drama", 
    label: "Drama & role-play",
    directive: "ACTIVITY (Drama/Role-Play): Include at least one dramatic element—reader's theater, improvisation, or reenactment. Provide scripts or scenario cards. Include debrief questions after performance."
  },
  { 
    id: "games", 
    label: "Games & movement",
    directive: "ACTIVITY (Games/Movement): Include competitive or cooperative game options. Provide rules clearly. Design for the specified group size. Include movement that reinforces content, not just energy release."
  },
  { 
    id: "music", 
    label: "Music & worship",
    directive: "ACTIVITY (Music/Worship): Reference specific hymns or worship songs by name when possible. Include lyrics discussion. Suggest instrumental alternatives. Connect musical themes to lesson content."
  },
  { 
    id: "prayer", 
    label: "Prayer practices",
    directive: "ACTIVITY (Prayer Practices): Include structured prayer formats—ACTS, lectio divina, breath prayer, or written prayers. Provide prayer prompts. Design for varied comfort levels with public prayer."
  },
] as const;

// ============================================================================
// TEACHER PREFERENCES INTERFACE
// Defines the shape of saved profile data (15 fields - updated from 13)
// ============================================================================

export interface TeacherPreferences {
  // Core teaching settings
  teachingStyle: string;
  learningStyle: string;
  lessonLength: string;
  groupSize: string;
  learningEnvironment: string;

  // Student context
  studentExperience: string;
  educationExperience: string;
  culturalContext: string;
  specialNeeds: string;

  // Lesson format
  assessmentStyle: string;
  language: string;
  lessonSequence: string;

  // Activity preferences (multi-select)
  activityTypes: string[];

  // Phase 2: Emotional and Theological approach
  emotionalEntry: string;
  theologicalLens: string;
}

// ============================================================================
// DEFAULT PREFERENCES
// Used when no profile is loaded
// ============================================================================

export const DEFAULT_TEACHER_PREFERENCES: TeacherPreferences = {
  teachingStyle: "",
  learningStyle: "",
  lessonLength: "",
  groupSize: "",
  learningEnvironment: "",
  studentExperience: "",
  educationExperience: "",
  culturalContext: "",
  specialNeeds: "",
  assessmentStyle: "",
  language: "english",
  lessonSequence: "",
  activityTypes: [],
  emotionalEntry: "",
  theologicalLens: "",
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getOptionLabel(options: readonly PreferenceOption[], id: string): string {
  return options.find(opt => opt.id === id)?.label ?? id;
}

export function getOptionDescription(options: readonly PreferenceOption[], id: string): string | undefined {
  return options.find(opt => opt.id === id)?.description;
}

export function getOptionTooltip(options: readonly PreferenceOption[], id: string): string | undefined {
  return options.find(opt => opt.id === id)?.tooltip;
}

export function getOptionDirective(options: readonly PreferenceOption[], id: string): string | undefined {
  return options.find(opt => opt.id === id)?.directive;
}

export function getCheckboxLabel(options: readonly CheckboxOption[], id: string): string {
  return options.find(opt => opt.id === id)?.label ?? id;
}

export function getCheckboxDirective(options: readonly CheckboxOption[], id: string): string | undefined {
  return options.find(opt => opt.id === id)?.directive;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TeachingStyleKey = typeof TEACHING_STYLES[number]["id"];
export type LearningStyleKey = typeof LEARNING_STYLES[number]["id"];
export type LessonLengthKey = typeof LESSON_LENGTHS[number]["id"];
export type GroupSizeKey = typeof GROUP_SIZES[number]["id"];
export type LearningEnvironmentKey = typeof LEARNING_ENVIRONMENTS[number]["id"];
export type StudentExperienceKey = typeof STUDENT_EXPERIENCE_LEVELS[number]["id"];
export type EducationExperienceKey = typeof EDUCATION_EXPERIENCES[number]["id"];
export type CulturalContextKey = typeof CULTURAL_CONTEXTS[number]["id"];
export type SpecialNeedsKey = typeof SPECIAL_NEEDS_OPTIONS[number]["id"];
export type AssessmentStyleKey = typeof ASSESSMENT_STYLES[number]["id"];
export type LanguageKey = typeof LANGUAGE_OPTIONS[number]["id"];
export type LessonSequenceKey = typeof LESSON_SEQUENCE_OPTIONS[number]["id"];
export type EmotionalEntryKey = typeof EMOTIONAL_ENTRY_OPTIONS[number]["id"];
export type TheologicalLensKey = typeof THEOLOGICAL_LENS_OPTIONS[number]["id"];
export type ActivityTypeKey = typeof ACTIVITY_TYPE_OPTIONS[number]["id"];
