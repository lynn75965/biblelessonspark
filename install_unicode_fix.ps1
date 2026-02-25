# ============================================================================
# BibleLessonSpark -- Install Unicode Permanent Fix
# ============================================================================
# Run from: C:\Users\Lynn\biblelessonspark
# This script:
#   1. Runs the Unicode cleanup across the ENTIRE codebase
#   2. Installs the pre-commit hook to prevent future violations
#   3. Finds and displays the Step 2 separator (test case)
# ============================================================================

$repoRoot = "C:\Users\Lynn\biblelessonspark"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  BibleLessonSpark Unicode Permanent Fix" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------
# STEP 1: Find the Step 2 separator (test case -- see what it is now)
# ------------------------------------------------------------------
Write-Host "STEP 1: Finding Step 2 teaching context separator..." -ForegroundColor Yellow
$step2Results = Select-String -Path "$repoRoot\src\**\*.tsx" -Pattern "Set Your Teaching Context|Teaching Context.*summary|theologyProfile.*ageGroup.*bible|collapsed.*step.*2" -Recurse
if ($step2Results) {
    Write-Host "  Found in:" -ForegroundColor Green
    foreach ($result in $step2Results) {
        Write-Host "    $($result.Path):$($result.LineNumber)" -ForegroundColor White
    }
} else {
    Write-Host "  Searching with broader pattern..." -ForegroundColor Gray
    $step2Results = Select-String -Path "$repoRoot\src\**\*.tsx" -Pattern "separator|bullet.*age|collapsed.*summary" -Recurse
    foreach ($result in $step2Results | Select-Object -First 10) {
        Write-Host "    $($result.Path):$($result.LineNumber): $($result.Line.Trim().Substring(0, [Math]::Min(100, $result.Line.Trim().Length)))" -ForegroundColor White
    }
}

Write-Host ""

# ------------------------------------------------------------------
# STEP 2: Run the Unicode cleanup (dry-run first)
# ------------------------------------------------------------------
Write-Host "STEP 2: Running Unicode cleanup (dry-run)..." -ForegroundColor Yellow
python3 "$repoRoot\fix_unicode_permanent.py" --dry-run "$repoRoot\src"

Write-Host "`nAlso checking constants directory..." -ForegroundColor Gray
python3 "$repoRoot\fix_unicode_permanent.py" --dry-run "$repoRoot\src\constants"

Write-Host ""
$proceed = Read-Host "Apply all fixes? (y/n)"
if ($proceed -eq "y") {
    Write-Host "`nApplying fixes to src/..." -ForegroundColor Yellow
    python3 "$repoRoot\fix_unicode_permanent.py" "$repoRoot\src"
    
    # Also fix deploy.ps1 if it has corrupted checkmark
    $deployContent = Get-Content "$repoRoot\deploy.ps1" -Raw
    if ($deployContent -match '\? Deployed') {
        $deployContent = $deployContent -replace '\? Deployed', '[OK] Deployed'
        Set-Content "$repoRoot\deploy.ps1" $deployContent -NoNewline
        Write-Host "  Also fixed deploy.ps1 checkmark" -ForegroundColor Green
    }
    
    Write-Host "`n[OK] All source files cleaned!" -ForegroundColor Green
} else {
    Write-Host "Aborted. No files changed." -ForegroundColor Red
    exit
}

# ------------------------------------------------------------------
# STEP 3: Install pre-commit hook
# ------------------------------------------------------------------
Write-Host "`nSTEP 3: Installing pre-commit hook..." -ForegroundColor Yellow

$hooksDir = "$repoRoot\.git\hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

Copy-Item "$repoRoot\pre-commit" "$hooksDir\pre-commit" -Force
Write-Host "  Pre-commit hook installed at: $hooksDir\pre-commit" -ForegroundColor Green

# ------------------------------------------------------------------
# STEP 4: Verify
# ------------------------------------------------------------------
Write-Host "`nSTEP 4: Post-fix verification..." -ForegroundColor Yellow
python3 "$repoRoot\fix_unicode_permanent.py" --dry-run "$repoRoot\src" 2>&1 | Select-String "Would fix"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Done! Ready to deploy." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "  .\deploy.ps1 `"SSOT: Permanent Unicode-to-ASCII cleanup + pre-commit guard`"" -ForegroundColor Gray
