import { z } from 'zod';

// File validation constants - SSOT for allowed file types
// Supported: PDF, TXT, JPG, JPEG, PNG (DOCX removed - Claude API limitation)
export const ALLOWED_FILE_TYPES = ['.pdf', '.txt', '.jpg', '.jpeg', '.png'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'image/png'
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
      error: `File type not allowed. Please upload PDF, TXT, or images (JPG, PNG). For Word docs, save as PDF first.`
    };
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(fileExtension as any)) {
    return {
      isValid: false,
      error: `File extension not allowed. Please upload PDF, TXT, or images (JPG, PNG). For Word docs, save as PDF first.`
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

// Flexible validation schema - frontend constants are source of truth
export const lessonFormSchema = z.object({
  passage: z.string().optional(),
  topic: z.string().optional(),
  passageOrTopic: z.string().optional(),
  
  // Accept any age group string from frontend
  ageGroup: z.string().min(1, 'Age group is required'),

  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .transform(val => val?.trim() || ''),
}).refine(
  (data) => data.passage || data.topic || data.passageOrTopic,
  { message: 'Either passage, topic, or passageOrTopic is required' }
);

export type LessonFormData = z.infer<typeof lessonFormSchema>;

// Helper function to check if file is an image
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png'].some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );
}
