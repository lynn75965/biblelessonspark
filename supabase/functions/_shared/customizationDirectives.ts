/**
 * Customization Directives Generator
 * 
 * Transforms user selections into explicit instructions for Claude.
 * This ensures customizations ACTUALLY affect lesson output.
 * 
 * Location: supabase/functions/_shared/customizationDirectives.ts
 * 
 * =============================================================================
 * ARCHITECTURAL RULING (November 24, 2025)
 * =============================================================================
 * This file is a BACKEND-ONLY behavioral file, not a structural constant.
 * 
 * SSOT EXCEPTION RATIONALE:
 * - Frontend constants (src/constants/) define WHAT options exist
 * - This file defines HOW Claude interprets those options
 * - Customization directives are behavioral instructions for Claude, not
 *   structural definitions that need frontend authority
 * - Similar architectural pattern to the Edge Function itself
 * 
 * This file does NOT violate "frontend drives backend" because:
 * - The dropdown options are defined in frontend constants
 * - This file only adds backend interpretation logic
 * - No new options can be created here; only interpretations of existing ones
 * 
 * DO NOT add new customization OPTIONS here. Add them to the appropriate
 * frontend constant file first, then add the corresponding directive here.
 * =============================================================================
 */

const TEACHING_STYLE_DIRECTIVES: Record<string, string> = {
  'lecture': 
    'TEACHING STYLE (Lecture): Structure content for clear, sequential presentation. Use topic sentences and supporting points. Include memorable phrases for note-taking. Minimize interruptions for questions until designated times.',
  'discussion': 
    'TEACHING STYLE (Discussion-Based): Structure each section around 2-3 open-ended questions. Begin with a hook question. Use "What do you think..." and "How might..." phrasing. Leave space for student responses. Minimize lecture; maximize Socratic dialogue.',
  'storytelling': 
    'TEACHING STYLE (Storytelling): Frame biblical content through narrative arcs. Use vivid sensory details. Include character perspectives and emotions. Connect ancient stories to modern situations through parallel narratives.',
  'socratic': 
    'TEACHING STYLE (Socratic Method): Build entire lesson around sequential questions that lead to discovery. Never state conclusions directly—guide students to discover them. Use "Why might..." and "What if..." progressions.',
  'experiential': 
    'TEACHING STYLE (Experiential): Design hands-on activities for each concept. Include simulations, role-plays, or physical demonstrations. Process experiences with reflection questions. Learning happens through doing.',
  'mixed': 
    'TEACHING STYLE (Mixed Methods): Vary approaches across sections. Combine brief lecture with discussion. Include at least one hands-on activity. Use storytelling for key illustrations.'
};

const LEARNING_STYLE_DIRECTIVES: Record<string, string> = {
  'visual': 
    'LEARNING STYLE (Visual): Include diagram descriptions, charts, or visual metaphors in each section. Suggest whiteboard layouts. Use spatial language ("picture this," "imagine seeing"). Recommend visual aids for activities.',
  'auditory': 
    'LEARNING STYLE (Auditory): Include read-aloud Scripture portions. Suggest verbal repetition of key points. Add call-and-response elements. Include hymn or song references where appropriate.',
  'kinesthetic': 
    'LEARNING STYLE (Kinesthetic): Include movement or hands-on elements in every section. Suggest standing, walking, or gesture activities. Use tactile object lessons. Make abstract concepts physical.',
  'reading-writing': 
    'LEARNING STYLE (Reading/Writing): Include journaling prompts throughout. Provide fill-in-the-blank options. Suggest note-taking frameworks. Include written reflection questions.',
  'mixed': 
    'LEARNING STYLE (Mixed): Vary learning modalities across sections. Include at least one visual, one auditory, and one kinesthetic element. Accommodate multiple preferences.'
};

const LESSON_LENGTH_DIRECTIVES: Record<string, string> = {
  '30': 
    'LESSON LENGTH (30 minutes): Keep content tight and focused. One main point only. Single activity lasting 5-7 minutes. Brief opening and closing. No tangents.',
  '45': 
    'LESSON LENGTH (45 minutes): Moderate depth with 2-3 supporting points. One main activity (8-10 min) plus brief opener. Allow 5 minutes for discussion.',
  '60': 
    'LESSON LENGTH (60 minutes): Full development of theme. Include 2 activities. Allow 10 minutes for discussion. Include brief break point suggestion.',
  '75': 
    'LESSON LENGTH (75 minutes): Comprehensive coverage. Multiple activities with variety. Extended discussion time. Include suggested break point.',
  '90': 
    'LESSON LENGTH (90 minutes): Deep dive format. Include 3+ activities. Allow for extended discussion and application. Include 1-2 break points. Consider small group breakouts.'
};

const GROUP_SIZE_DIRECTIVES: Record<string, string> = {
  'small-group': 
    'GROUP SIZE (Small Group, 3-8): Design for intimate discussion. Every person should speak. Include pair-share activities. Use first names in example dialogues.',
  'medium-group': 
    'GROUP SIZE (Medium Group, 9-20): Balance whole-group and small-group activities. Include turn-to-your-neighbor moments. Plan for varied participation levels.',
  'large-group': 
    'GROUP SIZE (Large Group, 20+): Design for visibility and audibility. Use show-of-hands engagement. Include small group breakout instructions. Repeat questions for clarity.',
  'one-on-one': 
    'GROUP SIZE (One-on-One): Highly personalized conversation format. Use "you" directly. Include space for personal sharing. Adapt pace to individual.',
  'family': 
    'GROUP SIZE (Family/Intergenerational): Include age-spanning activities. Suggest parent-child discussion prompts. Vary complexity within same content. Include take-home family application.'
};

const LEARNING_ENVIRONMENT_DIRECTIVES: Record<string, string> = {
  'classroom': 
    'ENVIRONMENT (Classroom): Assume chairs/tables, whiteboard access, controlled setting. Include board work suggestions. Reference typical classroom setup.',
  'fellowship-hall': 
    'ENVIRONMENT (Fellowship Hall): Assume flexible seating, larger space, possible distractions. Design activities that work with round tables. Include movement activities using the space.',
  'home': 
    'ENVIRONMENT (Home Setting): Assume comfortable, informal atmosphere. Include living room-friendly activities. Reference household items for object lessons. Keep intimacy of setting.',
  'outdoor': 
    'ENVIRONMENT (Outdoor): Use nature references and illustrations. Design activities that work without furniture. Include creation-focused observations. Account for weather variables.',
  'virtual': 
    'ENVIRONMENT (Virtual/Online): Include screen-sharing moments. Design for chat participation. Include breakout room instructions. Keep segments short (10-12 min max). Suggest interactive tools.',
  'mixed': 
    'ENVIRONMENT (Mixed/Flexible): Design adaptable activities. Provide alternatives for different settings. Keep material portable.'
};

const STUDENT_EXPERIENCE_DIRECTIVES: Record<string, string> = {
  'new-believers': 
    'STUDENT EXPERIENCE (New Believers): Define all theological terms. Explain church traditions. Avoid assumed knowledge. Include "basics" explanations without condescension. Heavy Scripture reading with context.',
  'mature': 
    'STUDENT EXPERIENCE (Mature Christians): Assume biblical literacy. Include deeper word studies. Reference cross-biblical themes. Challenge with harder application questions. Less explanation, more exploration.',
  'mixed': 
    'STUDENT EXPERIENCE (Mixed Levels): Layer content with basics and depth. Include parenthetical definitions. Design discussions where all can contribute. Avoid embarrassing knowledge gaps.',
  'seekers': 
    'STUDENT EXPERIENCE (Seekers/Exploring): Assume minimal Bible knowledge. Explain everything. Use accessible language. Focus on relevance and questions. Welcome doubt openly. Heavy on grace, light on church jargon.'
};

const CULTURAL_CONTEXT_DIRECTIVES: Record<string, string> = {
  'urban': 
    'CULTURAL CONTEXT (Urban): Use city-life illustrations. Reference public transit, apartments, diverse neighbors. Include examples from fast-paced, diverse environments.',
  'suburban': 
    'CULTURAL CONTEXT (Suburban): Use family and neighborhood illustrations. Reference schools, sports, commuting. Include middle-class life applications.',
  'rural': 
    'CULTURAL CONTEXT (Rural): Use agricultural and small-town illustrations. Reference land, seasons, tight-knit community. Include farming and nature metaphors.',
  'international': 
    'CULTURAL CONTEXT (International): Avoid American-specific references. Use universally understood illustrations. Be sensitive to varied cultural backgrounds. Include global church perspective.',
  'multicultural': 
    'CULTURAL CONTEXT (Multicultural): Include diverse illustrations. Acknowledge varied backgrounds. Avoid single-culture assumptions. Celebrate diversity in examples.'
};

const SPECIAL_NEEDS_DIRECTIVES: Record<string, string> = {
  'none': '',
  'learning-disabilities': 
    'SPECIAL NEEDS (Learning Disabilities): Use short, clear sentences. Repeat key concepts multiple ways. Include multi-sensory reinforcement. Provide extra processing time in activities. Chunk information into small pieces.',
  'visual-hearing': 
    'SPECIAL NEEDS (Visual/Hearing Impaired): Include verbal descriptions of all visuals. Suggest large-print handout options. Include visual alternatives for audio content. Recommend seating arrangements.',
  'esl': 
    'SPECIAL NEEDS (ESL/English Learners): Use simple sentence structures. Define idioms and figures of speech. Avoid complex vocabulary when simple words work. Include visual supports. Speak/write key terms clearly.',
  'mixed-needs': 
    'SPECIAL NEEDS (Mixed/Various): Design with universal accessibility. Include multiple modalities. Provide scaffolded options. Suggest adaptations for various needs.'
};

const LESSON_SEQUENCE_DIRECTIVES: Record<string, string> = {
  'single': 
    'LESSON SEQUENCE (Standalone): Design as complete unit. Include full context. No assumed prior knowledge from previous sessions. Resolve application within this lesson.',
  'series': 
    'LESSON SEQUENCE (Part of Series): Include brief connection to series theme. Reference "last week" and "next week" concepts. Build toward cumulative understanding. Include series memory work.',
  'workshop': 
    'LESSON SEQUENCE (Workshop/Intensive): Design for concentrated learning. Include skill-building progression. Allow practice time. Build competency across session.',
  'retreat': 
    'LESSON SEQUENCE (Retreat Session): Design for reflective depth. Include extended silence options. Allow for emotional processing. Connect to retreat theme.',
  'vbs': 
    'LESSON SEQUENCE (VBS/Camp): High energy, memorable activities. Include music/motion suggestions. Design for daily themes. Heavy repetition of key verse. Fun and engaging delivery.'
};

const ASSESSMENT_STYLE_DIRECTIVES: Record<string, string> = {
  'informal': 
    'ASSESSMENT (Informal Discussion): Check understanding through conversation. Include "How would you explain this to a friend?" moments. Observe engagement rather than test.',
  'written': 
    'ASSESSMENT (Written Reflection): Include journaling prompts. Provide reflection questions for written response. Suggest take-home writing assignments.',
  'quiz': 
    'ASSESSMENT (Quiz/Review): Include review questions at end. Provide answer key for teacher. Design quick-check moments throughout.',
  'presentation': 
    'ASSESSMENT (Presentation/Verbal): Include opportunities for students to teach back. Design share-with-class moments. Allow verbal demonstration of understanding.',
  'project': 
    'ASSESSMENT (Project-Based): Include creative project options. Design application projects. Provide rubric suggestions. Allow for extended completion time.',
  'observation': 
    'ASSESSMENT (Observation): Include behavioral indicators of understanding. Design observable activities. Provide teacher observation prompts.'
};

const ACTIVITY_TYPE_DIRECTIVES: Record<string, string> = {
  'written': 'Include written reflection or journaling activities.',
  'verbal': 'Include discussion, debate, or verbal sharing activities.',
  'creative': 'Include art, craft, or creative expression activities.',
  'drama': 'Include role-play, skit, or dramatic reading activities.',
  'games': 'Include games, competitions, or movement activities.',
  'music': 'Include hymn references, worship song suggestions, or musical elements.',
  'prayer': 'Include structured prayer activities, prayer walks, or contemplative practices.'
};

export interface CustomizationInput {
  teaching_style?: string;
  learning_style?: string;
  lesson_length?: string;
  class_setting?: string;
  learning_environment?: string;
  student_experience?: string;
  cultural_context?: string;
  special_needs?: string;
  lesson_sequence?: string;
  assessment_style?: string;
  activity_types?: string[];
  language?: string;
  education_experience?: string;
}

export function buildCustomizationDirectives(input: CustomizationInput): string {
  const directives: string[] = [];

  if (input.teaching_style && TEACHING_STYLE_DIRECTIVES[input.teaching_style]) {
    directives.push(TEACHING_STYLE_DIRECTIVES[input.teaching_style]);
  }
  if (input.learning_style && LEARNING_STYLE_DIRECTIVES[input.learning_style]) {
    directives.push(LEARNING_STYLE_DIRECTIVES[input.learning_style]);
  }
  if (input.lesson_length && LESSON_LENGTH_DIRECTIVES[input.lesson_length]) {
    directives.push(LESSON_LENGTH_DIRECTIVES[input.lesson_length]);
  }
  if (input.class_setting && GROUP_SIZE_DIRECTIVES[input.class_setting]) {
    directives.push(GROUP_SIZE_DIRECTIVES[input.class_setting]);
  }
  if (input.learning_environment && LEARNING_ENVIRONMENT_DIRECTIVES[input.learning_environment]) {
    directives.push(LEARNING_ENVIRONMENT_DIRECTIVES[input.learning_environment]);
  }
  if (input.student_experience && STUDENT_EXPERIENCE_DIRECTIVES[input.student_experience]) {
    directives.push(STUDENT_EXPERIENCE_DIRECTIVES[input.student_experience]);
  }
  if (input.cultural_context && CULTURAL_CONTEXT_DIRECTIVES[input.cultural_context]) {
    directives.push(CULTURAL_CONTEXT_DIRECTIVES[input.cultural_context]);
  }
  if (input.special_needs && SPECIAL_NEEDS_DIRECTIVES[input.special_needs]) {
    directives.push(SPECIAL_NEEDS_DIRECTIVES[input.special_needs]);
  }
  if (input.lesson_sequence && LESSON_SEQUENCE_DIRECTIVES[input.lesson_sequence]) {
    directives.push(LESSON_SEQUENCE_DIRECTIVES[input.lesson_sequence]);
  }
  if (input.assessment_style && ASSESSMENT_STYLE_DIRECTIVES[input.assessment_style]) {
    directives.push(ASSESSMENT_STYLE_DIRECTIVES[input.assessment_style]);
  }
  if (input.activity_types && input.activity_types.length > 0) {
    const activityDirectives = input.activity_types
      .map(type => ACTIVITY_TYPE_DIRECTIVES[type])
      .filter(Boolean);
    if (activityDirectives.length > 0) {
      directives.push('ACTIVITIES: ' + activityDirectives.join(' '));
    }
  }
  if (input.language && input.language !== 'english') {
    directives.push(`LANGUAGE: Generate the entire lesson in ${input.language}. All content, instructions, and student materials must be in ${input.language}.`);
  }

  if (directives.length === 0) {
    return '';
  }

  return '\nCUSTOMIZATION DIRECTIVES:\n' + directives.join('\n\n');
}

export default buildCustomizationDirectives;
