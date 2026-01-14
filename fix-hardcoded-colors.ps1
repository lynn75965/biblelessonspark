# fix-hardcoded-colors.ps1
# Replaces hardcoded Tailwind color classes with SSOT-compliant classes
# Run from: C:\Users\Lynn\lesson-spark-usa

$files = @(
    "src\components\admin\FeedbackQuestionsManager.tsx",
    "src\components\analytics\BetaAnalyticsDashboard.tsx",
    "src\components\dashboard\BibleVersionSelector.tsx",
    "src\components\dashboard\DevotionalLibrary.tsx",
    "src\components\dashboard\EnhanceLessonForm.tsx",
    "src\components\dashboard\LessonLibrary.tsx",
    "src\components\help\VideoModal.tsx",
    "src\components\notifications\NotificationsDropdown.tsx",
    "src\components\subscription\SubscriptionManagement.tsx",
    "src\components\subscription\UpgradePromptModal.tsx",
    "src\components\subscription\UsageDisplay.tsx",
    "src\components\MaintenanceWrapper.tsx",
    "src\pages\AdminBetaMetrics.tsx",
    "src\pages\NotFound.tsx"
)

# Replacement mappings: hardcoded → SSOT
$replacements = @{
    # White backgrounds → card (warm white that pops against tan)
    'bg-white' = 'bg-card'
    
    # Gray backgrounds → background/muted (warm tan tones)
    'bg-gray-50' = 'bg-background'
    'bg-gray-100' = 'bg-muted'
    'bg-gray-200' = 'bg-muted'
    'bg-slate-50' = 'bg-background'
    'bg-slate-100' = 'bg-muted'
    'bg-slate-200' = 'bg-muted'
    
    # Gray text → foreground/muted-foreground
    'text-gray-500' = 'text-muted-foreground'
    'text-gray-600' = 'text-muted-foreground'
    'text-gray-700' = 'text-foreground'
    'text-gray-800' = 'text-foreground'
    'text-gray-900' = 'text-foreground'
    'text-slate-500' = 'text-muted-foreground'
    'text-slate-600' = 'text-muted-foreground'
    'text-slate-700' = 'text-foreground'
    'text-slate-800' = 'text-foreground'
    'text-slate-900' = 'text-foreground'
    
    # Gray borders → border
    'border-gray-200' = 'border-border'
    'border-gray-300' = 'border-border'
    'border-slate-200' = 'border-border'
    'border-slate-300' = 'border-border'
}

$totalReplacements = 0

foreach ($file in $files) {
    $fullPath = Join-Path $PWD $file
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $originalContent = $content
        $fileReplacements = 0
        
        foreach ($old in $replacements.Keys) {
            $new = $replacements[$old]
            $count = ([regex]::Matches($content, [regex]::Escape($old))).Count
            if ($count -gt 0) {
                $content = $content -replace [regex]::Escape($old), $new
                $fileReplacements += $count
            }
        }
        
        if ($fileReplacements -gt 0) {
            Set-Content $fullPath $content -NoNewline
            Write-Host "✅ $file - $fileReplacements replacements" -ForegroundColor Green
            $totalReplacements += $fileReplacements
        } else {
            Write-Host "⏭️  $file - no changes needed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ $file - file not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now run:" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor Yellow
Write-Host "  git add ." -ForegroundColor Yellow
Write-Host "  git commit -m 'SSOT: Replace hardcoded colors with theme variables'" -ForegroundColor Yellow
Write-Host "  git push" -ForegroundColor Yellow
