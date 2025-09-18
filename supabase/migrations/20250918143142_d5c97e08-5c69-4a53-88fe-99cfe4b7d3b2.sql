-- Fix security vulnerability: Prevent email harvesting from invites table
-- Issue: Current UPDATE policy allows any authenticated user to claim any unclaimed invite,
-- potentially exposing email addresses during the update process.

-- Drop the vulnerable UPDATE policy that allows claiming any unclaimed invite
DROP POLICY IF EXISTS "Users can claim invites" ON public.invites;

-- Create a secure UPDATE policy that only allows users to claim invites for their own email
CREATE POLICY "Users can claim invites for their email" 
ON public.invites 
FOR UPDATE 
USING (
  claimed_by IS NULL 
  AND email IS NOT NULL 
  AND email = (SELECT auth.email() WHERE auth.uid() IS NOT NULL)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND claimed_by = auth.uid()
);

-- Also improve the SELECT policies for better security
-- Drop existing SELECT policies to recreate them with better security
DROP POLICY IF EXISTS "Users can read invites for their email" ON public.invites;
DROP POLICY IF EXISTS "Users can read invites they created" ON public.invites;

-- Create more secure SELECT policies
-- Policy 1: Users can read invites they created
CREATE POLICY "Creator can read their invites" 
ON public.invites 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
);

-- Policy 2: Users can read unclaimed invites for their email address only
CREATE POLICY "User can read their own email invites" 
ON public.invites 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND email IS NOT NULL 
  AND email = (SELECT auth.email() WHERE auth.uid() IS NOT NULL)
  AND (claimed_by IS NULL OR claimed_by = auth.uid())
);

-- Add a DELETE policy to allow users to delete invites they created (for cleanup)
CREATE POLICY "Creator can delete their invites" 
ON public.invites 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
);

-- Add constraint to ensure email is always provided for invites (prevent NULL email attacks)
ALTER TABLE public.invites ALTER COLUMN email SET NOT NULL;

-- Add constraint to ensure created_by is always set (improve audit trail)
ALTER TABLE public.invites ALTER COLUMN created_by SET NOT NULL;