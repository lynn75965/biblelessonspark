-- Create setup_progress table to track user onboarding steps
CREATE TABLE public.setup_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete')),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_key)
);

-- Enable RLS
ALTER TABLE public.setup_progress ENABLE ROW LEVEL SECURITY;

-- Users can manage their own progress
CREATE POLICY "Users can manage own setup progress"
ON public.setup_progress
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_setup_progress_updated_at
  BEFORE UPDATE ON public.setup_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();