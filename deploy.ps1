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

# SSOT: Production branch name
$PRODUCTION_BRANCH = "main"

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
$commitResult = git commit -m $CommitMessage 2>&1
Write-Host $commitResult -ForegroundColor Gray

Write-Host "`nPushing to origin/$PRODUCTION_BRANCH..." -ForegroundColor Gray
git push origin $PRODUCTION_BRANCH

Write-Host "`n? Deployed to $PRODUCTION_BRANCH" -ForegroundColor Green
Write-Host "Wait 1-2 minutes for Netlify build, then test at https://biblelessonspark.com" -ForegroundColor Cyan
