-- Clean up all the problematic objects with CASCADE
DROP FUNCTION IF EXISTS public.is_organization_admin(uuid, uuid) CASCADE;

-- Now implement the solution using frontend-level access control
-- Since complex RLS policies cause recursion issues, we'll handle sensitive data masking 
-- in the application layer while maintaining basic RLS for organizational access

-- Create a simple helper function for organization admin checks that won't cause recursion
CREATE OR REPLACE FUNCTION public.check_organization_admin(org_id uuid)
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
    AND user_id = auth.uid()
    AND role IN ('admin', 'owner')
  );
$$;