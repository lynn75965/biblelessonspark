-- Audit theology fields in lessons table
SELECT 
  filters->>'theologicalPreference' as theological_preference,
  filters->'metadata'->>'sbConfessionVersion' as sb_confession_version,
  COUNT(*) as lesson_count
FROM lessons
WHERE filters->>'theologicalPreference' IS NOT NULL
GROUP BY 
  filters->>'theologicalPreference',
  filters->'metadata'->>'sbConfessionVersion'
ORDER BY lesson_count DESC;
