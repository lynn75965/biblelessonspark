-- Fix security vulnerability: Restrict access to invites table
-- Add created_by field to track who created the invite
ALTER TABLE public.invites ADD COLUMN created_by uuid;

-- Drop the overly permissive policy
DROP POLICY "Anyone can read invites" ON public.invites;

-- Create secure policies for reading invites
-- Users can read invites they created
CREATE POLICY "Users can read invites they created" 
ON public.invites 
FOR SELECT 
USING (created_by = auth.uid());

-- Users can read invites intended for their authenticated email
CREATE POLICY "Users can read invites for their email" 
ON public.invites 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Update the insert policy to set created_by automatically
DROP POLICY "Authenticated users can create invites" ON public.invites;

CREATE POLICY "Authenticated users can create invites" 
ON public.invites 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  created_by = auth.uid()
);