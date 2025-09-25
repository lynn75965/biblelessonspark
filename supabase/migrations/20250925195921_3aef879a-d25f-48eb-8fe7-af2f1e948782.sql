-- Fix role escalation vulnerability in profiles table
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "Users can update basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create new policy that prevents role escalation
CREATE POLICY "profiles_secure_self_update" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent role escalation - users cannot change their role or founder_status
  role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
  founder_status = (SELECT founder_status FROM public.profiles WHERE id = auth.uid())
);

-- Add admin-only policy for role management (for future admin functionality)
CREATE POLICY "profiles_admin_manage_all" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Enhance invites table with rate limiting protections
-- Add indexes for better performance on email lookups
CREATE INDEX IF NOT EXISTS idx_invites_email_created ON public.invites(email, created_at);
CREATE INDEX IF NOT EXISTS idx_invites_created_by_created ON public.invites(created_by, created_at);

-- Add constraint to prevent malformed emails (drop first if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format') THEN
    ALTER TABLE public.invites 
    ADD CONSTRAINT check_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Add audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  user_id UUID DEFAULT auth.uid(),
  metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.events (event, user_id, meta, created_at)
  VALUES (
    'security_' || event_type,
    COALESCE(user_id, auth.uid()),
    metadata,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_profile_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when roles are changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_security_event(
      'role_changed',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  -- Log when founder status changes
  IF OLD.founder_status IS DISTINCT FROM NEW.founder_status THEN
    PERFORM public.log_security_event(
      'founder_status_changed',
      NEW.id,
      jsonb_build_object(
        'old_status', OLD.founder_status,
        'new_status', NEW.founder_status,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS profile_security_audit ON public.profiles;
CREATE TRIGGER profile_security_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_role_changes();