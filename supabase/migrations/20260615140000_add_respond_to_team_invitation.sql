-- 20260615140000_add_respond_to_team_invitation.sql
-- Purpose: Let a pending Teaching Team invitee accept or decline their OWN
--          invitation reliably, past RLS.
--
-- Why a SECURITY DEFINER resolver (not a client-side UPDATE):
--   acceptInvitation/declineInvitation previously did a client-side UPDATE of
--   teaching_team_members from the invitee's session. A non-lead invitee
--   updating their own membership row requires an RLS UPDATE policy for
--   user_id = auth.uid(); no such policy is defined anywhere in the repo (these
--   tables were created in the Supabase dashboard in Phase 27). Worse, the
--   accept path had never actually run -- the dashboard never rendered the
--   invitation banner -- so any missing UPDATE policy would have surfaced as a
--   SILENT 0-row UPDATE (RLS filters UPDATEs without raising), leaving the lead
--   stuck on "Pending". This resolver guarantees the write succeeds regardless
--   of the table's RLS UPDATE policy.
--
-- Security boundary: the WHERE predicate (id = p_membership_id AND
--   user_id = auth.uid() AND status = 'pending') is the authorization gate --
--   an invitee can only respond to their OWN still-pending invite. Returns the
--   affected team_id, or NULL when nothing matched (already responded, expired,
--   or not theirs) so the caller can treat it as a benign no-op.
--
-- Posture mirrors the other Teaching Team resolvers: SECURITY DEFINER, fixed
--   search_path (public, auth), all objects schema-qualified, EXECUTE revoked
--   from PUBLIC/anon and granted to authenticated only.

BEGIN;

CREATE OR REPLACE FUNCTION public.respond_to_team_invitation(
  p_membership_id uuid,
  p_accept boolean
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_team_id uuid;
BEGIN
  -- Separate UPDATEs per branch so the status literal coerces directly to the
  -- column type whether it is an enum or a text+CHECK column (avoids CASE-result
  -- type ambiguity).
  IF p_accept THEN
    UPDATE public.teaching_team_members AS tm
    SET status = 'accepted',
        responded_at = now()
    WHERE tm.id = p_membership_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'pending'
    RETURNING tm.team_id INTO v_team_id;
  ELSE
    UPDATE public.teaching_team_members AS tm
    SET status = 'declined',
        responded_at = now()
    WHERE tm.id = p_membership_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'pending'
    RETURNING tm.team_id INTO v_team_id;
  END IF;

  RETURN v_team_id;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.respond_to_team_invitation(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.respond_to_team_invitation(uuid, boolean) FROM anon;
GRANT  EXECUTE ON FUNCTION public.respond_to_team_invitation(uuid, boolean) TO authenticated;

COMMIT;