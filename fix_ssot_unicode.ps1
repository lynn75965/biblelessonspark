# ============================================================================
# BibleLessonSpark -- SSOT-Compliant Unicode Repair
# ============================================================================
# Fixes all 10 files blocked by pre-commit hook.
# SSOT Rules:
#   - uiSymbols.ts is SSOT for UI symbols -> escape sequences (renders at runtime)
#   - i18n.ts is SSOT for translations -> escape sequences (preserves accented chars)
#   - Components either import from SSOT or use escape sequences
#   - Comments use plain ASCII
#   - NO content is destroyed -- only source encoding changes
# ============================================================================

param([switch]$DryRun)

$root = "C:\Users\Lynn\biblelessonspark"
$fixCount = 0

function Fix-File {
    param(
        [string]$RelPath,
        [string]$Description
    )
    $fullPath = Join-Path $root $RelPath
    if (-not (Test-Path $fullPath)) {
        Write-Host "  [SKIP] $RelPath not found" -ForegroundColor Red
        return $null
    }
    $content = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
    Write-Host "`n--- $RelPath ---" -ForegroundColor Yellow
    Write-Host "  $Description" -ForegroundColor Gray
    return @{ Path = $fullPath; Content = $content; Original = $content; RelPath = $RelPath }
}

function Save-File {
    param($FileObj)
    if ($FileObj.Content -ne $FileObj.Original) {
        if (-not $DryRun) {
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($FileObj.Path, $FileObj.Content, $utf8NoBom)
        }
        $script:fixCount++
        $label = if ($DryRun) { "[WOULD FIX]" } else { "[FIXED]" }
        Write-Host "  $label" -ForegroundColor Green
    } else {
        Write-Host "  [NO CHANGE NEEDED]" -ForegroundColor Gray
    }
}

# Helper: Convert a single non-ASCII character to JS escape sequence
function Get-JsEscape {
    param([string]$Char)
    if ($Char.Length -eq 1) {
        $code = [int][char]$Char
        if ($code -gt 127) {
            return "\u$($code.ToString('X4'))"
        }
        return $Char
    }
    # Surrogate pair (emoji outside BMP)
    if ($Char.Length -eq 2 -and [char]::IsHighSurrogate($Char[0])) {
        $cp = [char]::ConvertToUtf32($Char[0], $Char[1])
        return "\u{$($cp.ToString('X'))}"
    }
    return $Char
}

# Helper: Convert ALL non-ASCII chars in a string to JS escape sequences
function ConvertTo-AsciiEscaped {
    param([string]$Text)
    $sb = New-Object System.Text.StringBuilder
    for ($i = 0; $i -lt $Text.Length; $i++) {
        $c = $Text[$i]
        if ([int]$c -gt 127) {
            if ([char]::IsHighSurrogate($c) -and ($i + 1) -lt $Text.Length -and [char]::IsLowSurrogate($Text[$i + 1])) {
                $cp = [char]::ConvertToUtf32($c, $Text[$i + 1])
                [void]$sb.Append("\u{$($cp.ToString('X'))}")
                $i++
            } else {
                [void]$sb.Append("\u$([int]$c.ToString('X4'))")
            }
        } else {
            [void]$sb.Append($c)
        }
    }
    return $sb.ToString()
}

Write-Host "`n============================================" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "  SSOT Unicode Repair -- DRY RUN" -ForegroundColor Yellow
} else {
    Write-Host "  SSOT Unicode Repair -- APPLYING" -ForegroundColor Green
}
Write-Host "============================================" -ForegroundColor Cyan


# ================================================================
# FILE 1: src\config\i18n.ts (SSOT for translations)
# Spanish and French accented characters -> \uXXXX escape sequences
# Runtime rendering is PRESERVED -- only source encoding changes
# ================================================================
$f = Fix-File "src\config\i18n.ts" "SSOT translations: accented chars -> \uXXXX escapes (renders same at runtime)"
if ($f) {
    $f.Content = ConvertTo-AsciiEscaped $f.Content
    Save-File $f
}


# ================================================================
# FILE 2: src\constants\uiSymbols.ts (SSOT for UI symbols)
# Symbol VALUES -> \uXXXX escape sequences (renders same at runtime)
# Symbol COMMENTS -> ASCII descriptions
# ================================================================
$f = Fix-File "src\constants\uiSymbols.ts" "SSOT symbols: all non-ASCII -> \uXXXX escapes (values render same at runtime)"
if ($f) {
    $f.Content = ConvertTo-AsciiEscaped $f.Content
    Save-File $f
}


# ================================================================
# FILE 3: src\components\settings\LanguageSelector.tsx
# Flag emoji and Espanol label -> escape sequences
# ================================================================
$f = Fix-File "src\components\settings\LanguageSelector.tsx" "Language labels: flag emoji + accented chars -> escape sequences"
if ($f) {
    $f.Content = ConvertTo-AsciiEscaped $f.Content
    Save-File $f
}


# ================================================================
# FILE 4: src\components\dashboard\DebugPanel.tsx
# Ellipsis in debug output -> ASCII "..."
# ================================================================
$f = Fix-File "src\components\dashboard\DebugPanel.tsx" "Debug panel: ellipsis -> ASCII '...'"
if ($f) {
    $ellipsis = [char]0x2026
    $f.Content = $f.Content.Replace([string]$ellipsis, '...')
    Save-File $f
}


# ================================================================
# FILE 5: src\components\org\OrgLessonsPanel.tsx
# Emoji indicators -> escape sequences (preserves visual rendering)
# ================================================================
$f = Fix-File "src\components\org\OrgLessonsPanel.tsx" "Org panel: emoji indicators -> escape sequences"
if ($f) {
    $f.Content = ConvertTo-AsciiEscaped $f.Content
    Save-File $f
}


# ================================================================
# FILE 6: src\components\admin\EmailSequenceManager.tsx
# Decorative star -> escape sequence
# ================================================================
$f = Fix-File "src\components\admin\EmailSequenceManager.tsx" "Email manager: decorative star -> escape sequence"
if ($f) {
    $f.Content = ConvertTo-AsciiEscaped $f.Content
    Save-File $f
}


# ================================================================
# FILE 7: src\components\admin\toolbelt\ToolbeltEmailManager.tsx
# Decorative star -> escape sequence
# ================================================================
$f = Fix-File "src\components\admin\toolbelt\ToolbeltEmailManager.tsx" "Toolbelt email: decorative star -> escape sequence"
if ($f) {
    $f.Content = ConvertTo-AsciiEscaped $f.Content
    Save-File $f
}


# ================================================================
# FILE 8: src\pages\Admin.tsx
# Box-drawing chars in comments -> ASCII equals signs
# ================================================================
$f = Fix-File "src\pages\Admin.tsx" "Admin page: box-drawing comment borders -> ASCII ==="
if ($f) {
    $boxDouble = [char]0x2550  # ═
    $f.Content = $f.Content.Replace([string]$boxDouble, '=')
    Save-File $f
}


# ================================================================
# FILE 9: src\pages\OrgSuccess.tsx
# Lightbulb emoji -> escape sequence
# ================================================================
$f = Fix-File "src\pages\OrgSuccess.tsx" "Org success: lightbulb emoji -> escape sequence"
if ($f) {
    $f.Content = ConvertTo-AsciiEscaped $f.Content
    Save-File $f
}


# ================================================================
# FILE 10: src\pages\Parables.tsx
# Sparkles emoji -> escape sequence
# ================================================================
$f = Fix-File "src\pages\Parables.tsx" "Parables: sparkles emoji -> escape sequence"
if ($f) {
    $f.Content = ConvertTo-AsciiEscaped $f.Content
    Save-File $f
}


# ================================================================
# SUMMARY
# ================================================================
Write-Host "`n============================================" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "  Would fix: $fixCount files" -ForegroundColor Yellow
    Write-Host "  Run without -DryRun to apply." -ForegroundColor Gray
} else {
    Write-Host "  Fixed: $fixCount files" -ForegroundColor Green
    Write-Host "  All Unicode preserved as \uXXXX escapes." -ForegroundColor White
    Write-Host "  Runtime rendering is UNCHANGED." -ForegroundColor White
}
Write-Host "============================================`n" -ForegroundColor Cyan

# ================================================================
# VERIFICATION: Scan all 10 files for remaining non-ASCII
# ================================================================
if (-not $DryRun) {
    Write-Host "VERIFICATION SCAN..." -ForegroundColor Yellow
    $allFiles = @(
        "src\config\i18n.ts",
        "src\constants\uiSymbols.ts",
        "src\components\settings\LanguageSelector.tsx",
        "src\components\dashboard\DebugPanel.tsx",
        "src\components\org\OrgLessonsPanel.tsx",
        "src\components\admin\EmailSequenceManager.tsx",
        "src\components\admin\toolbelt\ToolbeltEmailManager.tsx",
        "src\pages\Admin.tsx",
        "src\pages\OrgSuccess.tsx",
        "src\pages\Parables.tsx"
    )
    $remaining = 0
    foreach ($rel in $allFiles) {
        $fullPath = Join-Path $root $rel
        if (Test-Path $fullPath) {
            $text = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
            $hasNonAscii = $false
            foreach ($c in $text.ToCharArray()) {
                if ([int]$c -gt 127) { $hasNonAscii = $true; $remaining++; break }
            }
            if ($hasNonAscii) {
                Write-Host "  [FAIL] $rel still has non-ASCII" -ForegroundColor Red
            } else {
                Write-Host "  [PASS] $rel" -ForegroundColor Green
            }
        }
    }
    if ($remaining -eq 0) {
        Write-Host "`n  All 10 files are ASCII-clean!" -ForegroundColor Green
        Write-Host "  Ready to commit. Run:" -ForegroundColor White
        Write-Host "    .\deploy.ps1 `"SSOT: Unicode escape sequences for i18n, uiSymbols, and components`"" -ForegroundColor Gray
    } else {
        Write-Host "`n  $remaining files still have non-ASCII. Review above." -ForegroundColor Red
    }
    Write-Host ""
}
