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