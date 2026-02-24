import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logAuditEvent } from '@/lib/auditLogger';

interface EventData {
  [key: string]: any;
}

/**
 * Hook for tracking user events and analytics
 */
export function useAnalytics() {
  const { user } = useAuth();

  const trackEvent = async (event: string, lessonId?: string, meta?: EventData) => {
    if (!user) return;

    try {
      // Save to events table
      await supabase.from('events').insert({
        user_id: user.id,
        lesson_id: lessonId,
        event,
        meta: meta || {}
      });

      // Also log to audit system
      logAuditEvent({
        user_id: user.id,
        action: event,
        resource_type: lessonId ? 'lesson' : 'app',
        resource_id: lessonId,
        details: meta
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  // Track page views
  useEffect(() => {
    if (user) {
      trackEvent('page_view', undefined, {
        path: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
  }, [user, window.location.pathname]);

  return {
    trackEvent,
    // Convenience methods for common events
    trackLessonCreated: (lessonId: string, data?: EventData) => 
      trackEvent('lesson_created', lessonId, data),
    trackLessonViewed: (lessonId: string) => 
      trackEvent('lesson_viewed', lessonId),
    trackLessonEnhanced: (lessonId: string, enhancementType?: string) => 
      trackEvent('lesson_enhanced', lessonId, { enhancementType }),
    trackFeatureUsed: (feature: string, data?: EventData) => 
      trackEvent('feature_used', undefined, { feature, ...data }),
    trackSessionStart: () => 
      trackEvent('session_start'),
    trackSessionEnd: (duration: number) => 
      trackEvent('session_end', undefined, { duration }),
  };
}
