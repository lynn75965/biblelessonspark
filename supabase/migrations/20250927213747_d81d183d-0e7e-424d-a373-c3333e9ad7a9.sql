-- Fix RLS infinite recursion on organization_members table
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can join organizations through invites" ON public.organization_members;

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

-- Create security definer function to check organization admin status safely
CREATE OR REPLACE FUNCTION public.is_organization_admin_safe(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = org_id 
    AND organization_members.user_id = user_id
    AND role IN ('admin', 'owner')
  );
$$;

-- Create new safe RLS policies using security definer functions
CREATE POLICY "Members can view organization members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (public.is_organization_member(organization_id));

CREATE POLICY "Organization admins can manage members"
ON public.organization_members
FOR ALL
TO authenticated
USING (public.is_organization_admin_safe(organization_id));

CREATE POLICY "Users can join organizations"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Strengthen invite email protection - tighten RLS policies
DROP POLICY IF EXISTS "User can read their own email invites" ON public.invites;

-- More restrictive policy that prevents email enumeration
CREATE POLICY "Users can only read invites for their verified email"
ON public.invites
FOR SELECT
TO authenticated
USING (
  (auth.uid() IS NOT NULL) 
  AND (
    (created_by = auth.uid()) -- Creator can see their invites
    OR (
      email = (SELECT auth.email()) -- Only if email exactly matches authenticated user's email
      AND (claimed_by IS NULL OR claimed_by = auth.uid()) -- And not claimed by someone else
    )
  )
);

-- Add constraint to prevent email enumeration through timing attacks
CREATE OR REPLACE FUNCTION public.validate_invite_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure email is properly formatted
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Limit invite creation rate per user
  IF (
    SELECT COUNT(*) 
    FROM public.invites 
    WHERE created_by = auth.uid() 
    AND created_at > now() - interval '1 hour'
  ) > 10 THEN
    RAISE EXCEPTION 'Too many invites created in the last hour';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for invite validation
DROP TRIGGER IF EXISTS validate_invite_email_trigger ON public.invites;
CREATE TRIGGER validate_invite_email_trigger
  BEFORE INSERT ON public.invites
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_invite_email();

-- Enhanced admin role validation - create centralized admin check function
CREATE OR REPLACE FUNCTION public.verify_admin_access(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Log admin privilege usage
CREATE OR REPLACE FUNCTION public.log_admin_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log admin access attempts
  PERFORM public.log_security_event(
    'admin_access_attempt',
    auth.uid(),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add admin access logging to profiles table
DROP TRIGGER IF EXISTS log_admin_profile_access ON public.profiles;
CREATE TRIGGER log_admin_profile_access
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role AND NEW.role = 'admin')
  EXECUTE FUNCTION public.log_admin_access();