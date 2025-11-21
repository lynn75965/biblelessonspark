$ProjectRoot = "C:\Users\Lynn\lesson-spark-usa"
$FrontendConstants = "$ProjectRoot\src\constants"
$BackendShared = "$ProjectRoot\supabase\functions\_shared"
Write-Host "`n========== Sync Constants to Backend ==========`n" -ForegroundColor Blue
if (-not (Test-Path $BackendShared)) { New-Item -ItemType Directory -Path $BackendShared -Force | Out-Null; Write-Host "Created _shared folder" -ForegroundColor Green }
$FilesToSync = @("contracts.ts","lessonStructure.ts","ageGroups.ts","theologicalPreferences.ts","teacherPreferences.ts","bibleVersions.ts","systemOptions.ts")
$synced = 0; $skipped = 0
foreach ($file in $FilesToSync) { $src = Join-Path $FrontendConstants $file; $dest = Join-Path $BackendShared $file; if (Test-Path $src) { Copy-Item -Path $src -Destination $dest -Force; Write-Host "Synced: $file" -ForegroundColor Green; $synced++ } else { Write-Host "Skipped: $file (not yet created)" -ForegroundColor Yellow; $skipped++ } }
Write-Host "`nDone! Synced: $synced | Skipped: $skipped`n" -ForegroundColor Cyan
