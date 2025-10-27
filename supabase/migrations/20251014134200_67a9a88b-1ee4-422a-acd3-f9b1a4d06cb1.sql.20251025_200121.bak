-- Add theological_preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theological_preference text 
CHECK (theological_preference IN ('southern_baptist', 'reformed_baptist', 'independent_baptist'))
DEFAULT 'southern_baptist';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.theological_preference IS 'User''s theological lens for lesson generation: southern_baptist, reformed_baptist, or independent_baptist';
