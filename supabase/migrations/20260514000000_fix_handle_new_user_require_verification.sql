-- 20260514000000_fix_handle_new_user_require_verification.sql
-- Purpose: Block profile creation for unverified signups; create the profile
--          only when the auth user has actually confirmed their email.
--          Fixes the duplicate-unverified-profile race where two signups with
--          the same email could each land a profile row before either side
--          completed verification (partial unique index on auth.users.email
--          allows the race when is_sso_user = false on a double-submit).
--
-- Behavior change:
--   BEFORE  on_auth_user_created -> handle_new_user() ALWAYS inserts profile
--   AFTER   on_auth_user_created -> handle_new_user() inserts profile ONLY
--           when NEW.email_confirmed_at IS NOT NULL (covers OAuth and any
--           future pre-verified signup paths)
--   NEW     on_email_verified_create_profile fires AFTER UPDATE on auth.users
--           when (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at
--           IS NOT NULL) and inserts the profile with identical columns and
--           values to the original handle_new_user() body.
--
-- Both INSERT paths keep ON CONFLICT (id) DO NOTHING so re-firing is a no-op.
-- All other side effects of the original function (none beyond the INSERT)
-- are preserved.

-- ------------------------------------------------------------------
-- 1. Rewrite handle_new_user() to skip unverified signups.
--    Column list, values, COALESCE, defaults, and ON CONFLICT clause are
--    copied verbatim from the prior body. The only change is the guard.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (
    id, full_name, created_at, updated_at,
    preferred_language, theology_family,
    trial_full_lessons_used, trial_short_lessons_used
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    now(), now(), 'english', 'sbc', 0, 0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------------
-- 2. New function: insert the profile when email becomes verified.
--    Body matches the INSERT in handle_new_user() exactly so a row produced
--    via this path is indistinguishable from a row produced by the verified
--    signup path (OAuth, magic-link with auto-confirm, admin-created users).
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_profile_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, created_at, updated_at,
    preferred_language, theology_family,
    trial_full_lessons_used, trial_short_lessons_used
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    now(), now(), 'english', 'sbc', 0, 0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------------
-- 3. Wire the new function to a fresh AFTER UPDATE trigger on auth.users.
--    DROP IF EXISTS first so the migration is rerunnable.
--    The WHEN clause guarantees the trigger only fires on the verification
--    transition (NULL -> NOT NULL), never on subsequent updates.
-- ------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_email_verified_create_profile ON auth.users;

CREATE TRIGGER on_email_verified_create_profile
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.create_profile_on_verification();
