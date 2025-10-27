-- Recreate credits_balance view with explicit security_invoker
DROP VIEW IF EXISTS public.credits_balance;

CREATE VIEW public.credits_balance
WITH (security_invoker = on)
AS
SELECT
  user_id,
  SUM(amount) AS balance
FROM public.credits_ledger
GROUP BY user_id;

COMMENT ON VIEW public.credits_balance IS
'Aggregated credit balance. Access is enforced by RLS on credits_ledger; SECURITY INVOKER ensures caller privileges are used.';

GRANT SELECT ON public.credits_balance TO authenticated;