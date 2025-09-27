-- Add enhanced security logging for admin privilege usage
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

-- Add admin access logging to profiles table for role changes
DROP TRIGGER IF EXISTS log_admin_profile_access ON public.profiles;
CREATE TRIGGER log_admin_profile_access
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role AND NEW.role = 'admin')
  EXECUTE FUNCTION public.log_admin_access();