# ============================================================================
# BibleLessonSpark -- Full Unicode-to-ASCII Codebase Sweep (PowerShell)
# ============================================================================
# Since Python is not installed, this does the same cleanup in pure PowerShell.
# Run from: C:\Users\Lynn\biblelessonspark
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\sweep_unicode.ps1 -DryRun
#   powershell -ExecutionPolicy Bypass -File .\sweep_unicode.ps1
# ============================================================================

param(
    [switch]$DryRun
)

$repoRoot = "C:\Users\Lynn\biblelessonspark"
$totalFixed = 0
$totalScanned = 0

# ── Replacement table ────────────────────────────────────────────
# Each entry: [regex_pattern, replacement, description]
# Order matters -- more specific patterns first
$replacements = @(
    # Already-corrupted replacement character
    @{ Pattern = [char]0xFFFD;         Replace = '--';          Desc = 'replacement char (was em-dash)' }
    # Em-dash
    @{ Pattern = [char]0x2014;         Replace = '--';          Desc = 'em-dash' }
    # En-dash
    @{ Pattern = [char]0x2013;         Replace = '-';           Desc = 'en-dash' }
    # Right arrow
    @{ Pattern = [char]0x2192;         Replace = '->';          Desc = 'right arrow' }
    # Left arrow
    @{ Pattern = [char]0x2190;         Replace = '<-';          Desc = 'left arrow' }
    # Heavy check mark (white)
    @{ Pattern = [char]0x2705;         Replace = '[OK]';        Desc = 'heavy check mark' }
    # Check mark
    @{ Pattern = [char]0x2713;         Replace = '[x]';         Desc = 'check mark' }
    # Bullet
    @{ Pattern = [char]0x2022;         Replace = '*';           Desc = 'bullet' }
    # Box drawing horizontal
    @{ Pattern = [char]0x2500;         Replace = '-';           Desc = 'box drawing' }
    # Box drawing corner
    @{ Pattern = [char]0x2514;         Replace = '+-';          Desc = 'box drawing corner' }
    # Multiplication sign
    @{ Pattern = [char]0x00D7;         Replace = 'x';           Desc = 'multiplication' }
    # Middle dot
    @{ Pattern = [char]0x00B7;         Replace = '|';           Desc = 'middle dot' }
    # Copyright
    @{ Pattern = [char]0x00A9;         Replace = '\u00A9';      Desc = 'copyright' }
    # Registered
    @{ Pattern = [char]0x00AE;         Replace = '\u00AE';      Desc = 'registered' }
    # Trademark
    @{ Pattern = [char]0x2122;         Replace = '\u2122';      Desc = 'trademark' }
    # n-tilde (Espanol)
    @{ Pattern = [char]0x00F1;         Replace = '\u00F1';      Desc = 'n-tilde' }
    # c-cedilla (Francais)
    @{ Pattern = [char]0x00E7;         Replace = '\u00E7';      Desc = 'c-cedilla' }
)

# Emoji patterns - use [char]::ConvertFromUtf32 for astral plane characters
# These must be built at runtime since PowerShell 5.1 lacks `u{} syntax
$emojiReplacements = @(
    @{ Pattern = [char]::ConvertFromUtf32(0x1F389); Replace = '';   Desc = 'party popper' }
    @{ Pattern = [char]::ConvertFromUtf32(0x1F6A8); Replace = '!!'; Desc = 'siren' }
    @{ Pattern = "$([char]::ConvertFromUtf32(0x1F1FA))$([char]::ConvertFromUtf32(0x1F1F8))"; Replace = ''; Desc = 'US flag' }
    @{ Pattern = "$([char]::ConvertFromUtf32(0x1F1F2))$([char]::ConvertFromUtf32(0x1F1FD))"; Replace = ''; Desc = 'MX flag' }
    @{ Pattern = "$([char]::ConvertFromUtf32(0x1F1EB))$([char]::ConvertFromUtf32(0x1F1F7))"; Replace = ''; Desc = 'FR flag' }
)

Write-Host "`n============================================" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "  Unicode Sweep -- DRY RUN (no changes)" -ForegroundColor Yellow
} else {
    Write-Host "  Unicode Sweep -- APPLYING FIXES" -ForegroundColor Green
}
Write-Host "============================================`n" -ForegroundColor Cyan

# ── Scan all .ts and .tsx files ──────────────────────────────────
$files = Get-ChildItem -Path "$repoRoot\src" -Include "*.ts","*.tsx" -Recurse |
    Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\\.netlify\\' }

foreach ($file in $files) {
    $totalScanned++
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content
    $fileChanges = @()

    # Apply emoji replacements first
    foreach ($r in $emojiReplacements) {
        if ($content.Contains($r.Pattern)) {
            $content = $content.Replace($r.Pattern, $r.Replace)
            $fileChanges += "  $($r.Desc)"
        }
    }

    # Apply single-char replacements
    foreach ($r in $replacements) {
        $charStr = [string]$r.Pattern
        if ($content.Contains($charStr)) {
            $count = ($content.ToCharArray() | Where-Object { $_ -eq $r.Pattern }).Count
            $content = $content.Replace($charStr, $r.Replace)
            $fileChanges += "  $($r.Desc) x$count"
        }
    }

    # Post-processing: clean up badge text
    $content = $content.Replace('Public Beta * Free', 'Public Beta | Free')

    # Post-processing: clean up <li> bullet prefixes
    $content = $content -replace '(<li[^>]*>)\s*\*\s*', '$1'

    # Post-processing: clean up welcome message trailing space from emoji removal
    $content = $content.Replace('BibleLessonSpark! "', 'BibleLessonSpark!"')
    $content = $content.Replace("BibleLessonSpark! '", "BibleLessonSpark!'")
    $content = $content.Replace('! !', '!')

    if ($content -ne $original) {
        $totalFixed++
        $relPath = $file.FullName.Replace("$repoRoot\", "")
        Write-Host "--- $relPath ---" -ForegroundColor Yellow
        foreach ($change in $fileChanges) {
            Write-Host $change -ForegroundColor Gray
        }

        if (-not $DryRun) {
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
            Write-Host "  [FIXED]" -ForegroundColor Green
        }
        Write-Host ""
    }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Scanned: $totalScanned files" -ForegroundColor White
if ($DryRun) {
    Write-Host "  Would fix: $totalFixed files" -ForegroundColor Yellow
    Write-Host "`n  Run without -DryRun to apply." -ForegroundColor Gray
} else {
    Write-Host "  Fixed: $totalFixed files" -ForegroundColor Green
}
Write-Host "============================================`n" -ForegroundColor Cyan
