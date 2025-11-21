$ProjectRoot = "C:\Users\Lynn\lesson-spark-usa"
Write-Host "`n========== LessonSparkUSA Deploy ==========`n" -ForegroundColor Blue
Write-Host "Step 1: Validating constants..." -ForegroundColor Cyan
& "$ProjectRoot\validate-constants.ps1"
if ($LASTEXITCODE -eq 1) { Write-Host "Deploy aborted: Validation failed" -ForegroundColor Red; exit 1 }
Write-Host "`nStep 2: Syncing constants to backend..." -ForegroundColor Cyan
& "$ProjectRoot\sync-constants.ps1"
Write-Host "`nStep 3: Deploying Edge Function..." -ForegroundColor Cyan
npx supabase functions deploy generate-lesson --project-ref hphebzdftpjbiudpfcrs
if ($LASTEXITCODE -eq 0) { Write-Host "`nDeploy COMPLETE" -ForegroundColor Green } else { Write-Host "`nDeploy had issues - check output above" -ForegroundColor Yellow }
