-- Find rows that weren't migrated
SELECT 
  id,
  theological_preference,
  sb_confession_version,
  age_group,
  created_at
FROM profiles
WHERE theological_preference IS NOT NULL
ORDER BY created_at DESC;