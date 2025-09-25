-- Fix search path security issues for the functions we just created
-- Update the log_security_event function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the log_profile_role_changes function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;