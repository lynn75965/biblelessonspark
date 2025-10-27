-- Update the first user to have admin role for testing
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1);

-- Log this change
SELECT public.log_security_event(
  'admin_role_granted', 
  (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1),
  '{"granted_by": "system", "reason": "initial_admin_setup"}'::jsonb
);