-- Fix critical security issue: Events table RLS policy allows inserting with any user_id
-- Current policy only checks auth.uid() IS NOT NULL, should enforce user_id = auth.uid()

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "events insert self" ON public.events;

-- Create a secure INSERT policy that enforces user_id must match authenticated user
CREATE POLICY "events insert self" 
ON public.events 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Make user_id non-nullable to prevent RLS policy violations
-- First update any existing NULL values to a placeholder (shouldn't exist with proper RLS)
UPDATE public.events SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;

-- Now make the column non-nullable
ALTER TABLE public.events ALTER COLUMN user_id SET NOT NULL;

-- Also ensure lesson_id has proper foreign key constraint for data integrity
-- (This helps prevent orphaned records and improves security)
ALTER TABLE public.events ADD CONSTRAINT events_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;