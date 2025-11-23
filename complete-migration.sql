-- Phase 5: Complete Theology Profile Migration
-- Handles ALL possible theology combinations

-- Step 1: Add theology_profile_id column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theology_profile_id TEXT;

-- Step 2: Migrate ALL theology combinations
-- Southern Baptist combinations
UPDATE profiles SET theology_profile_id = 'southern-baptist-bfm-2000'
WHERE theological_preference = 'southern-baptist' AND sb_confession_version = '2000';

UPDATE profiles SET theology_profile_id = 'southern-baptist-bfm-1963'
WHERE theological_preference = 'southern-baptist' AND sb_confession_version = '1963';

UPDATE profiles SET theology_profile_id = 'southern-baptist-bfm-2000'
WHERE theological_preference = 'southern-baptist' AND (sb_confession_version IS NULL OR sb_confession_version = '');

-- Reformed Baptist (any version defaults to 2000)
UPDATE profiles SET theology_profile_id = 'reformed-baptist'
WHERE theological_preference = 'reformed-baptist';

-- Independent Baptist (any version defaults to 2000)
UPDATE profiles SET theology_profile_id = 'independent-baptist'
WHERE theological_preference = 'independent-baptist';

-- Handle any NULL theological_preference (default to southern-baptist-bfm-2000)
UPDATE profiles SET theology_profile_id = 'southern-baptist-bfm-2000'
WHERE theological_preference IS NULL AND theology_profile_id IS NULL;

-- Step 3: Make NOT NULL
ALTER TABLE profiles ALTER COLUMN theology_profile_id SET NOT NULL;

-- Step 4: Add constraint
ALTER TABLE profiles ADD CONSTRAINT valid_theology_profile_id 
CHECK (theology_profile_id IN (
  'southern-baptist-bfm-2000',
  'southern-baptist-bfm-1963',
  'reformed-baptist',
  'independent-baptist'
));

-- Step 5: Drop old columns
ALTER TABLE profiles 
DROP COLUMN IF EXISTS theological_preference,
DROP COLUMN IF EXISTS sb_confession_version;

-- Verification
SELECT theology_profile_id, COUNT(*) as count
FROM profiles GROUP BY theology_profile_id ORDER BY theology_profile_id;