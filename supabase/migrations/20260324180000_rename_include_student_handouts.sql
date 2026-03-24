-- Phase A10: Rename legacy column include_student_handouts to
-- include_group_handouts on profiles table
-- This column was previously referenced only by dead code
-- (WorkspaceSettingsPanel.tsx deleted March 20, 2026)
-- No active code references this column. Safe to rename.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'include_student_handouts'
  ) THEN
    ALTER TABLE profiles
    RENAME COLUMN include_student_handouts TO include_group_handouts;
  END IF;
END $$;
