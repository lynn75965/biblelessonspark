-- Close the invite PII-enumeration vector: remove the anon SELECT policy on invites.
-- (Anon retains a table-level SELECT grant per Supabase defaults, but with no anon SELECT
--  policy remaining, RLS denies anon every row. Broad anon grants are a separate review - not touched here.)
DROP POLICY IF EXISTS anon_claim_by_token ON public.invites;

-- Token-gated, minimal-disclosure read for the logged-out invite page.
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token text)
RETURNS TABLE (email text, inviter_name text, organization_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email, inviter_name, organization_name
  FROM public.invites
  WHERE token = p_token
    AND claimed_at IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_by_token(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO anon, authenticated;
