$ProjectRoot = "C:\Users\Lynn\lesson-spark-usa"
$ConstantsDir = "$ProjectRoot\src\constants"
Write-Host "`n========== Validate Constants ==========`n" -ForegroundColor Blue
$errors = 0
$required = @("index.ts","contracts.ts")
$optional = @("lessonStructure.ts","ageGroups.ts","theologicalPreferences.ts","teacherPreferences.ts","bibleVersions.ts","systemOptions.ts")
foreach ($file in $required) { $path = Join-Path $ConstantsDir $file; if (Test-Path $path) { Write-Host "Found (required): $file" -ForegroundColor Green } else { Write-Host "MISSING (required): $file" -ForegroundColor Red; $errors++ } }
foreach ($file in $optional) { $path = Join-Path $ConstantsDir $file; if (Test-Path $path) { Write-Host "Found (optional): $file" -ForegroundColor Green } else { Write-Host "Not yet created: $file" -ForegroundColor Yellow } }
Write-Host ""
if ($errors -gt 0) { Write-Host "Validation FAILED: $errors required file(s) missing" -ForegroundColor Red; exit 1 } else { Write-Host "Validation PASSED" -ForegroundColor Green }
