/**
 * Enhanced input validation for Edge Function
 * Prevents injection attacks, oversized inputs, and malformed data
 * 
 * Updated: January 2026
 * - Added freshness_mode, include_liturgical, include_cultural, freshness_suggestions
 * - Added lesson_number, total_lessons for series support
 * - Added extract_style_metadata, series_style_context for Consistent Style Mode
 */
export interface LessonRequest {
  bible_passage?: string;
  focused_topic?: string;
  extracted_content?: string;
  age_group: string;
  theology_profile_id: string;
  bible_version_id?: string;
  additional_notes?: string;
  teaching_style?: string;
  lesson_length?: string;
  activity_types?: string[];
  language?: string;
  class_setting?: string;
  learning_environment?: string;
  student_experience?: string;
  cultural_context?: string;
  special_needs?: string;
  lesson_sequence?: string;
  assessment_style?: string;
  learning_style?: string;
  education_experience?: string;
  generate_teaser?: boolean;
  // Freshness system
  freshness_mode?: string;
  include_liturgical?: boolean;
  include_cultural?: boolean;
  freshness_suggestions?: any;
  // Series support
  lesson_number?: number;
  total_lessons?: number;
  // Consistent Style Mode
  extract_style_metadata?: boolean;
  series_style_context?: any;
}

/**
 * Validates and sanitizes lesson generation request
 * @throws Error if validation fails
 */
export function validateLessonRequest(data: any): LessonRequest {
  // Required field validation - now accepts extracted_content as alternative
  if (!data.bible_passage && !data.focused_topic && !data.extracted_content) {
    throw new Error('Either bible_passage, focused_topic, or extracted_content is required');
  }

  if (!data.age_group || typeof data.age_group !== 'string') {
    throw new Error('age_group is required and must be a string');
  }

  if (!data.theology_profile_id || typeof data.theology_profile_id !== 'string') {
    throw new Error('theology_profile_id is required and must be a string');
  }

  // bible_version_id is optional (defaults to KJV in Edge Function)
  if (data.bible_version_id && typeof data.bible_version_id !== 'string') {
    throw new Error('bible_version_id must be a string');
  }

  // Length validations (prevent oversized inputs)
  if (data.bible_passage && data.bible_passage.length > 200) {
    throw new Error('bible_passage must be 200 characters or less');
  }

  if (data.focused_topic && data.focused_topic.length > 200) {
    throw new Error('focused_topic must be 200 characters or less');
  }

  if (data.additional_notes && data.additional_notes.length > 2000) {
    throw new Error('additional_notes must be 2000 characters or less');
  }

  // extracted_content can be large (up to 50000 chars for full curriculum documents)
  if (data.extracted_content && data.extracted_content.length > 50000) {
    throw new Error('extracted_content must be 50000 characters or less');
  }

  // String sanitization (remove potential XSS/injection attempts)
  const sanitizeString = (str: string | undefined): string | undefined => {
    if (!str) return str;
    // Remove null bytes, control characters except newlines/tabs
    return str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();
  };

  // Validate array inputs
  if (data.activity_types) {
    if (!Array.isArray(data.activity_types)) {
      throw new Error('activity_types must be an array');
    }
    if (data.activity_types.length > 10) {
      throw new Error('activity_types must contain 10 or fewer items');
    }
    data.activity_types.forEach((type: any) => {
      if (typeof type !== 'string' || type.length > 100) {
        throw new Error('Each activity_type must be a string of 100 characters or less');
      }
    });
  }

  // Validate booleans
  if (data.generate_teaser !== undefined && typeof data.generate_teaser !== 'boolean') {
    throw new Error('generate_teaser must be a boolean');
  }
  if (data.include_liturgical !== undefined && typeof data.include_liturgical !== 'boolean') {
    throw new Error('include_liturgical must be a boolean');
  }
  if (data.include_cultural !== undefined && typeof data.include_cultural !== 'boolean') {
    throw new Error('include_cultural must be a boolean');
  }
  if (data.extract_style_metadata !== undefined && typeof data.extract_style_metadata !== 'boolean') {
    throw new Error('extract_style_metadata must be a boolean');
  }

  // Validate numbers for series
  if (data.lesson_number !== undefined && data.lesson_number !== null) {
    if (typeof data.lesson_number !== 'number' || data.lesson_number < 1 || data.lesson_number > 7) {
      throw new Error('lesson_number must be a number between 1 and 7');
    }
  }
  if (data.total_lessons !== undefined && data.total_lessons !== null) {
    if (typeof data.total_lessons !== 'number' || data.total_lessons < 2 || data.total_lessons > 7) {
      throw new Error('total_lessons must be a number between 2 and 7');
    }
  }

  // Validate freshness_mode
  if (data.freshness_mode && typeof data.freshness_mode !== 'string') {
    throw new Error('freshness_mode must be a string');
  }

  // Return sanitized data with all fields
  return {
    bible_passage: sanitizeString(data.bible_passage),
    focused_topic: sanitizeString(data.focused_topic),
    extracted_content: sanitizeString(data.extracted_content),
    age_group: sanitizeString(data.age_group) || '',
    theology_profile_id: sanitizeString(data.theology_profile_id) || '',
    bible_version_id: sanitizeString(data.bible_version_id),
    additional_notes: sanitizeString(data.additional_notes),
    teaching_style: sanitizeString(data.teaching_style),
    lesson_length: sanitizeString(data.lesson_length),
    activity_types: data.activity_types,
    language: sanitizeString(data.language),
    class_setting: sanitizeString(data.class_setting),
    learning_environment: sanitizeString(data.learning_environment),
    student_experience: sanitizeString(data.student_experience),
    cultural_context: sanitizeString(data.cultural_context),
    special_needs: sanitizeString(data.special_needs),
    lesson_sequence: sanitizeString(data.lesson_sequence),
    assessment_style: sanitizeString(data.assessment_style),
    learning_style: sanitizeString(data.learning_style),
    education_experience: sanitizeString(data.education_experience),
    generate_teaser: data.generate_teaser || false,
    // Freshness system
    freshness_mode: sanitizeString(data.freshness_mode),
    include_liturgical: data.include_liturgical || false,
    include_cultural: data.include_cultural || false,
    freshness_suggestions: data.freshness_suggestions || null,
    // Series support
    lesson_number: data.lesson_number || null,
    total_lessons: data.total_lessons || null,
    // Consistent Style Mode
    extract_style_metadata: data.extract_style_metadata || false,
    series_style_context: data.series_style_context || null
  };
}
