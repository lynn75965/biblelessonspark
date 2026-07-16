// B8 capacity/rejection event logging (Rule #31: admin-observable by
// design). Thin insert helper for the capacity_events table -- never
// blocks the caller's response on failure, matching the existing
// non-fatal metrics-insert pattern used by generation_metrics and
// devotional_metrics.

export type CapacitySource =
  | 'generate-lesson'
  | 'generate-devotional'
  | 'generate-parable'
  | 'extract-lesson';

export type CapacityEventType =
  | 'quota_denied_failclosed'
  | 'quota_denied'
  | 'rate_limited'
  | 'truncated'
  | 'anthropic_terminal_failure';

export async function logCapacityEvent(
  supabase: any,
  params: {
    userId: string | null;
    source: CapacitySource;
    eventType: CapacityEventType;
    tier?: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const { error } = await supabase.from('capacity_events').insert({
      user_id: params.userId,
      source: params.source,
      event_type: params.eventType,
      tier_at_event: params.tier ?? 'unknown',
      meta: params.meta ?? {},
    });
    if (error) {
      console.error(`[capacity_events] insert failed: ${params.source}/${params.eventType}`, error);
    }
  } catch (err) {
    console.error(`[capacity_events] insert threw: ${params.source}/${params.eventType}`, err);
  }
}
