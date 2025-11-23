-- Phase 5 Rollback: Remove theology_profile_id column
-- This restores database to Phase 4 state

BEGIN;

-- Drop the theology_profile_id column
ALTER TABLE lessons 
DROP COLUMN IF EXISTS theology_profile_id;

-- Verify column is removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
AND column_name = 'theology_profile_id';

COMMIT;

-- Expected result: No rows (column removed)
