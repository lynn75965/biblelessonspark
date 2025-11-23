-- Phase 5.2: Create theology_profile_id column and migration mapping

-- Step 1: Add new column with default
ALTER TABLE lessons 
ADD COLUMN theology_profile_id TEXT DEFAULT 'sb_bfm_2000';

-- Step 2: Migrate existing data
UPDATE lessons
SET theology_profile_id = CASE
  WHEN filters->>'theologicalPreference' = 'southern_baptist' 
   AND filters->'metadata'->>'sbConfessionVersion' = 'bfm_1963' 
   THEN 'sb_bfm_1963'
  
  WHEN filters->>'theologicalPreference' = 'southern_baptist' 
   AND filters->'metadata'->>'sbConfessionVersion' = 'bfm_2000' 
   THEN 'sb_bfm_2000'
  
  WHEN filters->>'theologicalPreference' = 'reformed_baptist' 
   THEN 'rb'
  
  WHEN filters->>'theologicalPreference' = 'independent_baptist' 
   THEN 'ib'
  
  -- Fallback for southern_baptist with NULL version
  WHEN filters->>'theologicalPreference' = 'southern_baptist' 
   AND filters->'metadata'->>'sbConfessionVersion' IS NULL 
   THEN 'sb_bfm_2000'
  
  ELSE 'sb_bfm_2000'
END
WHERE filters->>'theologicalPreference' IS NOT NULL;

-- Step 3: Make column non-nullable after migration
ALTER TABLE lessons 
ALTER COLUMN theology_profile_id SET NOT NULL;

-- Step 4: Verification query
SELECT 
  theology_profile_id,
  COUNT(*) as count
FROM lessons
GROUP BY theology_profile_id
ORDER BY count DESC;
