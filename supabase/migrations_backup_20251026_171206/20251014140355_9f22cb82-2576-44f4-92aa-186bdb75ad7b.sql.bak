-- Add optional sb_confession_version column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sb_confession_version text
CHECK (sb_confession_version IN ('bfm_1963', 'bfm_2000'));