CREATE TABLE public.cron_email_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text NOT NULL,
  tracking_row_id uuid,
  recipient_email text,
  error_detail text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cron_email_failures_source_check
    CHECK (source IN ('send-sequence-email', 'send-toolbelt-sequence')),
  CONSTRAINT cron_email_failures_event_type_check
    CHECK (event_type IN ('send_failed', 'run_failed', 'tracking_update_failed'))
);

ALTER TABLE public.cron_email_failures ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cron_email_failures FROM anon, authenticated;
