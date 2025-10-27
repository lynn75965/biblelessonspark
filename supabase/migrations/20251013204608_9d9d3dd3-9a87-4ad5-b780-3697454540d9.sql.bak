-- Add persistent dismissal flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS org_setup_dismissed boolean NOT NULL DEFAULT false;

-- Add documentation comment
COMMENT ON COLUMN public.profiles.org_setup_dismissed 
IS 'Tracks whether user has dismissed the organization setup modal';