-- Remove default_age_group from organizations table
ALTER TABLE public.organizations DROP COLUMN IF EXISTS default_age_group;

-- Add preferred_age_group to profiles table
ALTER TABLE public.profiles ADD COLUMN preferred_age_group TEXT DEFAULT 'Adults';