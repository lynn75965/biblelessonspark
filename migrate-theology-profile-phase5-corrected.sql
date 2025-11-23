-- Phase 5: Theology Profile Migration (Corrected for user_preferences table)
-- Replace dual fields (theological_preference + sb_confession_version)
-- with single theology_profile_id field

-- Step 1: Add new column (nullable initially)
ALTER TABLE user_preferences
ADD COLUMN theology_profile_id TEXT;

-- Step 2: Migrate existing data to new field
-- Map old dual-field combinations to new profile IDs

-- Southern Baptist + 2000 -> southern-baptist-bfm-2000
UPDATE user_preferences
SET theology_profile_id = 'southern-baptist-bfm-2000'
WHERE theological_preference = 'southern-baptist'
  AND sb_confession_version = '2000';

-- Southern Baptist + 1963 -> southern-baptist-bfm-1963
UPDATE user_preferences
SET theology_profile_id = 'southern-baptist-bfm-1963'
WHERE theological_preference = 'southern-baptist'
  AND sb_confession_version = '1963';

-- Reformed Baptist -> reformed-baptist
UPDATE user_preferences
SET theology_profile_id = 'reformed-baptist'
WHERE theological_preference = 'reformed-baptist';

-- Independent Baptist -> independent-baptist
UPDATE user_preferences
SET theology_profile_id = 'independent-baptist'
WHERE theological_preference = 'independent-baptist';

-- Step 3: Verify all rows migrated
DO $$
DECLARE
  unmigrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmigrated_count
  FROM user_preferences
  WHERE theology_profile_id IS NULL;

  IF unmigrated_count > 0 THEN
    RAISE EXCEPTION 'Migration incomplete: % rows not migrated', unmigrated_count;
  END IF;

  RAISE NOTICE 'Migration verified: All rows migrated successfully';
END $$;

-- Step 4: Make theology_profile_id NOT NULL
ALTER TABLE user_preferences
ALTER COLUMN theology_profile_id SET NOT NULL;

-- Step 5: Add check constraint for valid profile IDs
ALTER TABLE user_preferences
ADD CONSTRAINT valid_theology_profile_id
CHECK (theology_profile_id IN (
  'southern-baptist-bfm-2000',
  'southern-baptist-bfm-1963',
  'reformed-baptist',
  'independent-baptist'
));

-- Step 6: Drop old fields (atomic - all or nothing)
ALTER TABLE user_preferences
DROP COLUMN theological_preference,
DROP COLUMN sb_confession_version;

-- Verification query
SELECT
  theology_profile_id,
  COUNT(*) as count
FROM user_preferences
GROUP BY theology_profile_id
ORDER BY theology_profile_id;