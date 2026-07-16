// ============================================================
// BibleLessonSpark - CONVERSION FUNNEL EVENT TYPES (SSOT)
// Location: src/constants/conversionEvents.ts
//
// SSOT for B7 conversion-funnel event names. Mirrored (Rule #23) to
// supabase/functions/_shared/conversionEvents.ts for create-checkout-session's
// checkout_started emission. The RPC's internal allowlist and the
// conversion_events table's CHECK constraint (supabase/migrations/
// 20260716180000_create_conversion_events.sql) are SEPARATE, hand-maintained
// SQL-side mirrors of this file -- SQL cannot import TS, same documented
// pattern as lessonTiers.ts's relationship to check_lesson_limit (Rule #26).
// Update all three places together when adding an event type.
// ============================================================

export const CONVERSION_EVENT_TYPES = {
  UPGRADE_PROMPT_IMPRESSION: 'upgrade_prompt_impression',
  UPGRADE_CLICK: 'upgrade_click',
  UPGRADE_DECLINED: 'upgrade_declined',
  CHECKOUT_STARTED: 'checkout_started',
} as const;

export type ConversionEventType =
  typeof CONVERSION_EVENT_TYPES[keyof typeof CONVERSION_EVENT_TYPES];

// Client-emittable via the log_conversion_event RPC. Excludes
// CHECKOUT_STARTED, which is written server-side only (service role,
// create-checkout-session) -- see the RPC definition for why.
export const CLIENT_EMITTABLE_CONVERSION_EVENTS: ConversionEventType[] = [
  CONVERSION_EVENT_TYPES.UPGRADE_PROMPT_IMPRESSION,
  CONVERSION_EVENT_TYPES.UPGRADE_CLICK,
  CONVERSION_EVENT_TYPES.UPGRADE_DECLINED,
];
