/**
 * Enhanced input validation for Edge Function
 * Prevents injection attacks, oversized inputs, and malformed data
 */

export interface LessonRequest {
  bible_passage?: string;
  focused_topic?: string;
  age_group: string;
  theology_profile_id: string;
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
}

/**
 * Validates and sanitizes lesson generation request
 * @throws Error if validation fails
 */
export function validateLessonRequest(data: any): LessonRequest {
  // Required field validation
  if (!data.bible_passage && !data.focused_topic) {
    throw new Error('Either bible_passage or focused_topic is required');
  }

  if (!data.age_group || typeof data.age_group !== 'string') {
    throw new Error('age_group is required and must be a string');
  }

  if (!data.theology_profile_id || typeof data.theology_profile_id !== 'string') {
    throw new Error('theology_profile_id is required and must be a string');
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

  // Validate boolean
  if (data.generate_teaser !== undefined && typeof data.generate_teaser !== 'boolean') {
    throw new Error('generate_teaser must be a boolean');
  }

  // Return sanitized data
  return {
    bible_passage: sanitizeString(data.bible_passage),
    focused_topic: sanitizeString(data.focused_topic),
    age_group: sanitizeString(data.age_group) || '',
    theology_profile_id: sanitizeString(data.theology_profile_id) || '',
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
    generate_teaser: data.generate_teaser || false
  };
}
