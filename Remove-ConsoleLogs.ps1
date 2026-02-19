<#
.SYNOPSIS
    Removes 15 identified console.log statements from BibleLessonSpark source files.
.DESCRIPTION
    Handles both single-line and multi-line console.log statements.
    Creates backups before modifying each file.
.USAGE
    cd C:\Users\Lynn\biblelessonspark
    .\Remove-ConsoleLogs.ps1
#>

$projectRoot = "C:\Users\Lynn\biblelessonspark\src"
$backupDir = "C:\Users\Lynn\biblelessonspark\backups\console-log-cleanup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " CONSOLE.LOG CLEANUP SCRIPT" -ForegroundColor Cyan
Write-Host " BibleLessonSpark Production Prep" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Track results
$totalRemoved = 0
$filesModified = 0

function Remove-ConsoleLogStatements {
    param(
        [string]$FilePath,
        [string]$BackupDir
    )

    $relativePath = $FilePath.Replace($projectRoot, "src")
    $content = Get-Content -Path $FilePath -Raw
    $lines = Get-Content -Path $FilePath

    # Count console.log occurrences before
    $beforeCount = ([regex]::Matches($content, 'console\.log\(')).Count
    if ($beforeCount -eq 0) { return 0 }

    # Backup the file
    $backupName = ($relativePath -replace '[\\/]', '_')
    Copy-Item -Path $FilePath -Destination (Join-Path $BackupDir $backupName) -Force

    # Process line by line
    $newLines = @()
    $skipping = $false
    $openParens = 0
    $removedCount = 0

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]

        if ($skipping) {
            # Count parens to find the end of the multi-line console.log
            foreach ($char in $line.ToCharArray()) {
                if ($char -eq '(') { $openParens++ }
                elseif ($char -eq ')') { $openParens-- }
            }
            if ($openParens -le 0) {
                $skipping = $false
                $openParens = 0
            }
            # Skip this line (part of console.log)
            continue
        }

        # Check if this line contains console.log(
        $trimmed = $line.Trim()
        if ($trimmed -match '^\s*console\.log\(') {
            $removedCount++
            # Check if statement completes on this line
            $openParens = 0
            $foundStart = $false
            foreach ($char in $line.ToCharArray()) {
                if ($char -eq '(') { $openParens++; $foundStart = $true }
                elseif ($char -eq ')') { $openParens-- }
            }
            if ($foundStart -and $openParens -gt 0) {
                # Multi-line statement - skip until balanced
                $skipping = $true
            }
            # Either way, skip this line
            continue
        }

        $newLines += $line
    }

    if ($removedCount -gt 0) {
        # Write cleaned content
        $newLines | Set-Content -Path $FilePath -Encoding UTF8
        Write-Host "  CLEANED: $relativePath ($removedCount removed)" -ForegroundColor Green
    }

    return $removedCount
}

# List of files to process
$targetFiles = @(
    "components\admin\AllLessonsPanel.tsx",
    "components\dashboard\EnhanceLessonForm.tsx",
    "components\setup\SetupChecklist.tsx",
    "components\BrandingProvider.tsx",
    "constants\ParableGenerator.tsx",
    "hooks\useAuth.tsx",
    "lib\auditLogger.ts",
    "utils\exportToDocx.ts",
    "utils\exportToPdf.ts"
)

Write-Host "Backup location: $backupDir`n" -ForegroundColor Yellow
Write-Host "Processing files..." -ForegroundColor White

foreach ($relFile in $targetFiles) {
    $fullPath = Join-Path $projectRoot $relFile
    if (Test-Path $fullPath) {
        $removed = Remove-ConsoleLogStatements -FilePath $fullPath -BackupDir $backupDir
        $totalRemoved += $removed
        if ($removed -gt 0) { $filesModified++ }
    } else {
        Write-Host "  NOT FOUND: $relFile" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Files modified:    $filesModified" -ForegroundColor White
Write-Host "  Console.logs removed: $totalRemoved" -ForegroundColor White
Write-Host "  Backups saved to:  $backupDir" -ForegroundColor Yellow

# Verification
Write-Host "`n--- VERIFICATION ---" -ForegroundColor Cyan
$remaining = Get-ChildItem -Path $projectRoot -Include "*.ts","*.tsx" -Recurse |
    Where-Object { $_.FullName -notmatch "node_modules" } |
    Select-String -Pattern "console\.log\(" |
    Measure-Object |
    Select-Object -ExpandProperty Count

if ($remaining -eq 0) {
    Write-Host "  ZERO console.log statements remaining!" -ForegroundColor Green
} else {
    Write-Host "  $remaining console.log statements still remain." -ForegroundColor Yellow
    Write-Host "  Run this to see them:" -ForegroundColor Yellow
    Write-Host '  Get-ChildItem -Path "src" -Include "*.ts","*.tsx" -Recurse | Where-Object { $_.FullName -notmatch "node_modules" } | Select-String -Pattern "console\.log\(" | Select-Object Path, LineNumber, Line | Format-Table -AutoSize -Wrap' -ForegroundColor Gray
}

Write-Host "`n--- NEXT STEP ---" -ForegroundColor Cyan
Write-Host "  If results look good, rebuild:" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor Gray
Write-Host ""
