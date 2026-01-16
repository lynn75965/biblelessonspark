# ============================================================================
# SSOT: BibleLessonSpark Deployment Script
# ============================================================================
# Single source of truth for deployment - prevents branch mismatch errors
# Usage: .\deploy.ps1 "commit message"
# ============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

$ErrorActionPreference = "Stop"

# SSOT: Production branch name
$PRODUCTION_BRANCH = "biblelessonspark"

# Get current branch
$currentBranch = git branch --show-current

Write-Host "`n=== BibleLessonSpark Deployment ===" -ForegroundColor Cyan
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Verify correct branch
if ($currentBranch -ne $PRODUCTION_BRANCH) {
    Write-Host "ERROR: Not on production branch ($PRODUCTION_BRANCH)" -ForegroundColor Red
    Write-Host "Current branch: $currentBranch" -ForegroundColor Red
    Write-Host "Run: git checkout $PRODUCTION_BRANCH" -ForegroundColor Yellow
    exit 1
}

# Stage, commit, push
Write-Host "`nStaging changes..." -ForegroundColor Gray
git add .

Write-Host "Committing: $CommitMessage" -ForegroundColor Gray
git commit -m $CommitMessage

Write-Host "Pushing to origin/$PRODUCTION_BRANCH..." -ForegroundColor Gray
$pushResult = git push origin $PRODUCTION_BRANCH 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployed successfully to $PRODUCTION_BRANCH" -ForegroundColor Green
    Write-Host "Wait 1-2 minutes for Vercel build, then test at https://biblelessonspark.com" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Push failed:" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
    exit 1
}
