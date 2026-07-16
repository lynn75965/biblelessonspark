// ============================================================
// BibleLessonSpark - CONVERSION FUNNEL TRACKING (B7)
// Location: src/lib/conversionTracking.ts
//
// Fire-and-forget client-side emitter for the log_conversion_event RPC
// (supabase/migrations/20260716180000_create_conversion_events.sql).
// Deliberately separate from useAnalytics.tsx -- that hook owns the
// unrelated (and currently broken -- see PROJECT_MASTER.md backlog)
// Pattern-A `events` table.
// ============================================================
import { supabase } from '@/integrations/supabase/client';
import type { ConversionEventType } from '@/constants/conversionEvents';

const CLIENT_SESSION_ID_KEY = 'bls_conversion_session_id';

// One random UUID per browser tab (sessionStorage, not localStorage), so a
// future funnel query can group repeat impressions into a single visit
// without needing any write-time dedup logic. No PII.
export function getClientSessionId(): string {
  let id = sessionStorage.getItem(CLIENT_SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(CLIENT_SESSION_ID_KEY, id);
  }
  return id;
}

export function logConversionEvent(
  eventType: ConversionEventType,
  triggerSource?: string,
  meta: Record<string, unknown> = {}
): void {
  supabase.rpc('log_conversion_event', {
    p_event_type: eventType,
    p_trigger_source: triggerSource ?? null,
    p_meta: { ...meta, client_session_id: getClientSessionId() },
  }).then(({ error }) => {
    if (error) {
      // Fire-and-forget by design: a lost event is acceptable, a broken
      // upgrade flow is not. There is no cheap way to escalate a client-side
      // RPC-call failure beyond the browser console without adding a
      // fallback write path that could fail the same way -- not solved
      // further here (B7 Phase 2 design note).
      console.error('logConversionEvent failed:', error);
    }
  });
  // Intentionally not awaited by callers.
}
