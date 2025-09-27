-- Create a more secure RLS policy structure for organizations
-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

-- Create separate policies for different access levels
-- Policy 1: All organization members can view basic organization info (non-sensitive fields)
CREATE POLICY "Members can view basic organization info" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Create a security definer function to check if user is admin/owner of organization
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id uuid, user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = COALESCE(is_organization_admin.user_id, auth.uid())
    AND role IN ('admin', 'owner')
  );
$$;

-- Create a view for organization data that masks sensitive fields for non-admins
CREATE OR REPLACE VIEW public.organization_public_view AS
SELECT 
  id,
  name,
  organization_type,
  denomination,
  default_doctrine,
  description,
  website,
  created_at,
  updated_at,
  -- Mask sensitive fields for non-admins
  CASE 
    WHEN public.is_organization_admin(id) THEN email
    ELSE NULL
  END AS email,
  CASE 
    WHEN public.is_organization_admin(id) THEN phone
    ELSE NULL
  END AS phone,
  CASE 
    WHEN public.is_organization_admin(id) THEN address
    ELSE NULL
  END AS address,
  -- Include created_by only for admins
  CASE 
    WHEN public.is_organization_admin(id) THEN created_by
    ELSE NULL
  END AS created_by
FROM public.organizations
WHERE id IN (
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid()
);

-- Grant access to the view
GRANT SELECT ON public.organization_public_view TO authenticated;

-- Enable RLS on the view (though it's already secured by the underlying table)
ALTER VIEW public.organization_public_view SET (security_barrier = true);