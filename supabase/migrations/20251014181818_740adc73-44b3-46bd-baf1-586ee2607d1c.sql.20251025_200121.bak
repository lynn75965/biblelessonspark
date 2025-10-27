-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  href text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see and update their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Index for performance (user_id, read_at, created_at desc)
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at, created_at DESC);

-- Seed 2 test notifications for demonstration
-- Note: Replace 'YOUR_USER_ID' with actual user_id after first login
-- This will be populated by a one-time seed script