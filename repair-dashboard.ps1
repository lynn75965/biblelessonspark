##############################################################################
# BibleLessonSpark Emergency Repair Script
# Fixes Dashboard.tsx overwrite caused by stale file edit
# Run from: C:\Users\Lynn\biblelessonspark
##############################################################################

Write-Host "=== BibleLessonSpark Emergency Repair ===" -ForegroundColor Yellow
Write-Host ""

# STEP 1: Restore Dashboard.tsx from last working commit
Write-Host "[1/5] Restoring Dashboard.tsx from last working build (ad21846)..." -ForegroundColor Cyan
git checkout ad21846 -- src/pages/Dashboard.tsx
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Could not restore Dashboard.tsx" -ForegroundColor Red
    exit 1
}
Write-Host "  Restored." -ForegroundColor Green

# STEP 2: Verify restored file has WORKSPACE imports (proves it's the live version)
Write-Host "[2/5] Verifying restored file is the correct live version..." -ForegroundColor Cyan
$content = Get-Content "src\pages\Dashboard.tsx" -Raw
if ($content -notmatch "WORKSPACE_QUERY_PARAMS") {
    Write-Host "FAILED: Restored file doesn't have WORKSPACE imports — wrong version" -ForegroundColor Red
    exit 1
}
Write-Host "  Verified: WORKSPACE imports present." -ForegroundColor Green

# STEP 3: Apply SSOT fixes (greeting + subtitle + tab labels)
Write-Host "[3/5] Applying SSOT fixes to live Dashboard.tsx..." -ForegroundColor Cyan

# Fix import line: add DASHBOARD_TEXT
$content = $content -replace 'import \{ DASHBOARD_TABS \} from "@/constants/dashboardConfig"', 'import { DASHBOARD_TABS, DASHBOARD_TEXT } from "@/constants/dashboardConfig"'

# Fix greeting: Welcome back → SSOT
$content = $content -replace 'Welcome back, <span', '{DASHBOARD_TEXT.greeting} <span'

# Fix subtitle: hardcoded → SSOT
$content = $content -replace 'Your Personal Bible Study Workspace', '{DASHBOARD_TEXT.subtitle}'

# Fix tab labels: hardcoded → SSOT imports
$content = $content -replace '(<span[^>]*>)Build Lesson(</span>)', '$1{DASHBOARD_TABS.enhance.label}$2'
$content = $content -replace '(<span[^>]*>)Lesson Library(</span>)', '$1{DASHBOARD_TABS.library.label}$2'
$content = $content -replace '(<span[^>]*>)Devotional Library(</span>)', '$1{DASHBOARD_TABS.devotionalLibrary.label}$2'

Set-Content "src\pages\Dashboard.tsx" -Value $content -NoNewline

# Verify changes applied
$verify = Get-Content "src\pages\Dashboard.tsx" -Raw
$checks = @(
    @{ name = "DASHBOARD_TEXT import"; pattern = "DASHBOARD_TEXT" },
    @{ name = "Greeting from SSOT"; pattern = "DASHBOARD_TEXT\.greeting" },
    @{ name = "Subtitle from SSOT"; pattern = "DASHBOARD_TEXT\.subtitle" }
)

$allPassed = $true
foreach ($check in $checks) {
    if ($verify -match $check.pattern) {
        Write-Host "  OK: $($check.name)" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $($check.name)" -ForegroundColor Red
        $allPassed = $false
    }
}

# Verify no hardcoded "Welcome back" remains
if ($verify -match "Welcome back") {
    Write-Host "  FAILED: 'Welcome back' still present" -ForegroundColor Red
    $allPassed = $false
} else {
    Write-Host "  OK: No hardcoded 'Welcome back'" -ForegroundColor Green
}

if (-not $allPassed) {
    Write-Host "FAILED: Not all fixes applied correctly" -ForegroundColor Red
    exit 1
}

# STEP 4: Build
Write-Host "[4/5] Running build to verify no errors..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD FAILED — do not deploy. Share the error output." -ForegroundColor Red
    exit 1
}
Write-Host "  Build succeeded." -ForegroundColor Green

# STEP 5: Deploy
Write-Host "[5/5] Deploying..." -ForegroundColor Cyan
git add -A
git commit -m "SSOT: Repair Dashboard.tsx — greeting, subtitle, tab labels from dashboardConfig.ts"
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "PUSH FAILED" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Repair Complete ===" -ForegroundColor Green
Write-Host "Wait 1-2 minutes for Netlify, then Ctrl+Shift+R on your dashboard."
Write-Host "Verify: 'Welcome, Name!' (no 'back'), all 3 tab labels correct."
