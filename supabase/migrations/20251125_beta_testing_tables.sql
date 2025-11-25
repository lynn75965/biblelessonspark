-- Beta Testers Table
CREATE TABLE IF NOT EXISTS public.beta_testers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  church_name TEXT,
  teaching_experience TEXT,
  age_group_taught TEXT,
  signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by TEXT DEFAULT 'Lynn Eckeberger',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  lessons_generated INTEGER DEFAULT 0,
  last_lesson_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Beta Feedback Table
CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category TEXT CHECK (category IN ('bug_report', 'feature_request', 'general_feedback')),
  feedback_text TEXT NOT NULL,
  allow_followup BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beta_testers
CREATE POLICY "Users can view their own beta tester record"
  ON public.beta_testers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own beta tester record"
  ON public.beta_testers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own beta tester record"
  ON public.beta_testers FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for beta_feedback
CREATE POLICY "Users can view their own feedback"
  ON public.beta_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can see all - Lynn Eckeberger's account
CREATE POLICY "Admin can view all beta testers"
  ON public.beta_testers FOR SELECT
  USING (auth.uid() = 'b8708e6b-eeef-4ff5-9f0b-57d808ef8762'::uuid);

CREATE POLICY "Admin can view all feedback"
  ON public.beta_feedback FOR SELECT
  USING (auth.uid() = 'b8708e6b-eeef-4ff5-9f0b-57d808ef8762'::uuid);

-- Indexes for performance
CREATE INDEX idx_beta_testers_user_id ON public.beta_testers(user_id);
CREATE INDEX idx_beta_testers_email ON public.beta_testers(email);
CREATE INDEX idx_beta_feedback_user_id ON public.beta_feedback(user_id);
CREATE INDEX idx_beta_feedback_submitted_at ON public.beta_feedback(submitted_at DESC);
