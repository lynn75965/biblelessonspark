-- First check and drop all existing policies on organization_members table
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can join organizations through invites" ON public.organization_members;
DROP POLICY IF EXISTS "Users can join organizations" ON public.organization_members;

-- Create security definer function to check organization membership safely
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = org_id AND organization_members.user_id = user_id
  );
$$;