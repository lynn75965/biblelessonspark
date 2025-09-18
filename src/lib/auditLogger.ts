import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Logs security-relevant actions for audit purposes
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Get client info
    const ip_address = entry.ip_address || await getClientIP();
    const user_agent = entry.user_agent || navigator.userAgent;

    const auditEntry = {
      ...entry,
      ip_address,
      user_agent,
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', auditEntry);
    }

    // In production, you would send this to your logging service
    // For now, we'll store it in browser storage as a fallback
    const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
    existingLogs.push(auditEntry);
    
    // Keep only last 100 entries to prevent storage bloat
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('audit_logs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Helper function to get client IP (limited in browser environment)
 */
async function getClientIP(): Promise<string> {
  try {
    // In a real application, you'd get this from your server
    return 'client-ip-unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Log user authentication events
 */
export function logAuthEvent(action: 'login' | 'logout' | 'signup' | 'password_reset', userId: string, details?: Record<string, any>) {
  logAuditEvent({
    user_id: userId,
    action: `auth_${action}`,
    resource_type: 'authentication',
    details,
  });
}

/**
 * Log lesson-related events
 */
export function logLessonEvent(action: 'create' | 'update' | 'delete' | 'view', userId: string, lessonId?: string, details?: Record<string, any>) {
  logAuditEvent({
    user_id: userId,
    action: `lesson_${action}`,
    resource_type: 'lesson',
    resource_id: lessonId,
    details,
  });
}

/**
 * Log file upload events
 */
export function logFileUploadEvent(userId: string, fileName: string, fileSize: number, success: boolean, details?: Record<string, any>) {
  logAuditEvent({
    user_id: userId,
    action: success ? 'file_upload_success' : 'file_upload_failure',
    resource_type: 'file',
    details: {
      fileName,
      fileSize,
      ...details,
    },
  });
}

/**
 * Log security events
 */
export function logSecurityEvent(action: string, userId: string, details?: Record<string, any>) {
  logAuditEvent({
    user_id: userId,
    action: `security_${action}`,
    resource_type: 'security',
    details,
  });
}
