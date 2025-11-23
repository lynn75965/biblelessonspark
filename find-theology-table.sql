-- Find tables with theological_preference column
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name IN ('theological_preference', 'sb_confession_version', 'age_group', 'lesson_focus')
  AND table_schema = 'public'
ORDER BY table_name, column_name;