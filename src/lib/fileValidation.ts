import { z } from 'zod';

// File validation constants
export const ALLOWED_FILE_TYPES = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
] as const;

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  file?: File;
}

export function validateFileUpload(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: `File type not allowed. Please upload documents (PDF, DOC, TXT) or images (JPG, PNG, GIF) of curriculum materials.`
    };
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(fileExtension as any)) {
    return {
      isValid: false,
      error: `File extension not allowed. Please upload documents (PDF, DOC, TXT) or images (JPG, PNG, GIF) of curriculum materials.`
    };
  }

  // Additional security checks
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File appears to be empty. Please select a valid file.'
    };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.js$/i,
    /\.vbs$/i,
    /\.php$/i,
    /\.html$/i,
    /\.htm$/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons.'
    };
  }

  return {
    isValid: true,
    file
  };
}

// Zod schema for lesson form validation
export const lessonFormSchema = z.object({
  passageOrTopic: z.string()
    .min(1, 'Scripture passage or topic is required')
    .max(200, 'Scripture passage or topic must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s:;,.-]+$/, 'Only letters, numbers, and basic punctuation allowed'),
  
  ageGroup: z.enum([
    'Preschoolers', 'Elementary', 'Middle School', 'High School', 
    'College & Career', 'Young Adults', 'Mid-Life Adults', 
    'Mature Adults', 'Active Seniors', 'Senior Adults', 'Mixed Groups'
  ]),
  
  doctrineProfile: z.enum(['SBC', 'RB', 'IND']),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .transform(val => val?.trim() || ''),
});

export type LessonFormData = z.infer<typeof lessonFormSchema>;

// Helper function to check if file is an image
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
}