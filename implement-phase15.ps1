# Phase 15.1: Perpetual Freshness Implementation Script
# Run from: C:\Users\Lynn\lesson-spark-usa
# This script makes all required changes for Phase 15.1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 15.1: Perpetual Freshness Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify we're in the right directory
if (-not (Test-Path "src\constants")) {
    Write-Host "ERROR: Please run this script from C:\Users\Lynn\lesson-spark-usa" -ForegroundColor Red
    exit 1
}

Write-Host "[1/6] Creating freshnessOptions.ts SSOT file..." -ForegroundColor Yellow

# The freshnessOptions.ts content will be downloaded separately
# Check if it exists
if (-not (Test-Path "src\constants\freshnessOptions.ts")) {
    Write-Host "  -> Please first copy freshnessOptions.ts to src\constants\" -ForegroundColor Red
    Write-Host "  -> Download from Claude chat and place in src\constants\" -ForegroundColor Red
    exit 1
}
Write-Host "  -> freshnessOptions.ts found!" -ForegroundColor Green

# Step 2: Update EnhanceLessonForm.tsx
Write-Host ""
Write-Host "[2/6] Updating EnhanceLessonForm.tsx..." -ForegroundColor Yellow

$formPath = "src\components\dashboard\EnhanceLessonForm.tsx"
$formContent = Get-Content $formPath -Raw

# Backup
Copy-Item $formPath "$formPath.backup-phase15"
Write-Host "  -> Backup created: $formPath.backup-phase15" -ForegroundColor Gray

# 2A: Add import for freshnessOptions
$importSearch = 'import { TeacherPreferences } from "@/constants/teacherPreferences";'
$importReplace = @'
import { TeacherPreferences } from "@/constants/teacherPreferences";
import { FRESHNESS_MODES, getDefaultFreshnessMode } from "@/constants/freshnessOptions";
'@

if ($formContent -notmatch 'freshnessOptions') {
    $formContent = $formContent -replace [regex]::Escape($importSearch), $importReplace
    Write-Host "  -> Added freshnessOptions import" -ForegroundColor Green
} else {
    Write-Host "  -> freshnessOptions import already exists" -ForegroundColor Gray
}

# 2B: Add state variable for freshnessMode
$stateSearch = 'const [generateTeaser, setGenerateTeaser] = useState(false);'
$stateReplace = @'
const [generateTeaser, setGenerateTeaser] = useState(false);
  // Freshness mode - default is "fresh" (varied content each time)
  const [freshnessMode, setFreshnessMode] = useState(getDefaultFreshnessMode().id);
'@

if ($formContent -notmatch 'freshnessMode') {
    $formContent = $formContent -replace [regex]::Escape($stateSearch), $stateReplace
    Write-Host "  -> Added freshnessMode state" -ForegroundColor Green
} else {
    Write-Host "  -> freshnessMode state already exists" -ForegroundColor Gray
}

# 2C: Add freshnessMode to enhancementData
$dataSearch = 'generate_teaser: generateTeaser,
        uploaded_file: curriculumInputMode === "file" ? uploadedFile : null,'
$dataReplace = @'
generate_teaser: generateTeaser,
        freshness_mode: freshnessMode,
        uploaded_file: curriculumInputMode === "file" ? uploadedFile : null,
'@

if ($formContent -notmatch 'freshness_mode: freshnessMode') {
    $formContent = $formContent -replace [regex]::Escape($dataSearch), $dataReplace
    Write-Host "  -> Added freshness_mode to enhancementData" -ForegroundColor Green
} else {
    Write-Host "  -> freshness_mode already in enhancementData" -ForegroundColor Gray
}

# 2D: Add UI toggle after Generate Teaser checkbox
$uiSearch = @'
              {/* Generate Lesson Teaser */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="generate-teaser"
                  checked={generateTeaser}
                  onCheckedChange={(checked) => setGenerateTeaser(checked as boolean)}
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="generate-teaser"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Generate Lesson Teaser
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Build anticipation before you teach (perfect for emails, texts, or social media)
                  </p>
                </div>
              </div>
            </CardContent>
'@

$uiReplace = @'
              {/* Generate Lesson Teaser */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="generate-teaser"
                  checked={generateTeaser}
                  onCheckedChange={(checked) => setGenerateTeaser(checked as boolean)}
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="generate-teaser"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Generate Lesson Teaser
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Build anticipation before you teach (perfect for emails, texts, or social media)
                  </p>
                </div>
              </div>

              {/* Freshness Mode Toggle */}
              <div className="flex items-start space-x-2 pt-2 border-t">
                <Checkbox
                  id="consistent-style"
                  checked={freshnessMode === "consistent"}
                  onCheckedChange={(checked) => 
                    setFreshnessMode(checked ? "consistent" : "fresh")
                  }
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="consistent-style"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Consistent Style Mode
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {freshnessMode === "consistent" 
                      ? "Lessons will maintain similar teaching approach (useful for series)"
                      : "Each lesson uses varied illustrations, examples, and teaching angles"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
'@

if ($formContent -notmatch 'consistent-style') {
    $formContent = $formContent -replace [regex]::Escape($uiSearch), $uiReplace
    Write-Host "  -> Added Freshness Mode UI toggle" -ForegroundColor Green
} else {
    Write-Host "  -> Freshness Mode UI toggle already exists" -ForegroundColor Gray
}

# Save the updated form
$formContent | Set-Content $formPath -NoNewline
Write-Host "  -> EnhanceLessonForm.tsx updated!" -ForegroundColor Green

# Step 3: Update generate-lesson edge function
Write-Host ""
Write-Host "[3/6] Updating generate-lesson edge function..." -ForegroundColor Yellow

$edgePath = "supabase\functions\generate-lesson\index.ts"
$edgeContent = Get-Content $edgePath -Raw

# Backup
Copy-Item $edgePath "$edgePath.backup-phase15"
Write-Host "  -> Backup created: $edgePath.backup-phase15" -ForegroundColor Gray

# 3A: Add import
$edgeImportSearch = "import { parseDeviceType, parseBrowser, parseOS } from '../_shared/generationMetrics.ts';"
$edgeImportReplace = @"
import { parseDeviceType, parseBrowser, parseOS } from '../_shared/generationMetrics.ts';
import { buildFreshnessContext, FRESHNESS_ELEMENTS } from '../_shared/freshnessOptions.ts';
"@

if ($edgeContent -notmatch 'freshnessOptions') {
    $edgeContent = $edgeContent -replace [regex]::Escape($edgeImportSearch), $edgeImportReplace
    Write-Host "  -> Added freshnessOptions import" -ForegroundColor Green
} else {
    Write-Host "  -> freshnessOptions import already exists" -ForegroundColor Gray
}

# 3B: Add freshness_mode to validated data extraction
$validatedSearch = 'generate_teaser = false
    } = validatedData;'
$validatedReplace = @'
generate_teaser = false,
      freshness_mode = 'fresh'
    } = validatedData;
'@

if ($edgeContent -notmatch "freshness_mode = 'fresh'") {
    $edgeContent = $edgeContent -replace [regex]::Escape($validatedSearch), $validatedReplace
    Write-Host "  -> Added freshness_mode to validated data" -ForegroundColor Green
} else {
    Write-Host "  -> freshness_mode already in validated data" -ForegroundColor Gray
}

# 3C: Add freshness context to system prompt
$promptSearch = '${customizationDirectives}
${buildTeaserInstructions(generate_teaser)}
${buildCompressionRules(generate_teaser)}'
$promptReplace = @'
${customizationDirectives}
${buildFreshnessContext(new Date(), freshness_mode)}
${buildTeaserInstructions(generate_teaser)}
${buildCompressionRules(generate_teaser)}
'@

if ($edgeContent -notmatch 'buildFreshnessContext') {
    $edgeContent = $edgeContent -replace [regex]::Escape($promptSearch), $promptReplace
    Write-Host "  -> Added freshness context to system prompt" -ForegroundColor Green
} else {
    Write-Host "  -> Freshness context already in system prompt" -ForegroundColor Gray
}

# 3D: Add freshness_mode to filters
$filtersSearch = 'generate_teaser
        },'
$filtersReplace = @'
generate_teaser,
          freshness_mode
        },
'@

if ($edgeContent -notmatch 'freshness_mode\s*\}') {
    $edgeContent = $edgeContent -replace [regex]::Escape($filtersSearch), $filtersReplace
    Write-Host "  -> Added freshness_mode to filters" -ForegroundColor Green
} else {
    Write-Host "  -> freshness_mode already in filters" -ForegroundColor Gray
}

# 3E: Add to metadata
$metaSearch = "extractedContentLength: extracted_content?.length || 0"
$metaReplace = @"
extractedContentLength: extracted_content?.length || 0,
          freshnessMode: freshness_mode
"@

if ($edgeContent -notmatch 'freshnessMode: freshness_mode') {
    $edgeContent = $edgeContent -replace [regex]::Escape($metaSearch), $metaReplace
    Write-Host "  -> Added freshnessMode to metadata" -ForegroundColor Green
} else {
    Write-Host "  -> freshnessMode already in metadata" -ForegroundColor Gray
}

# Save edge function
$edgeContent | Set-Content $edgePath -NoNewline
Write-Host "  -> generate-lesson/index.ts updated!" -ForegroundColor Green

# Step 4: Update sync-constants.cjs
Write-Host ""
Write-Host "[4/6] Updating sync-constants.cjs..." -ForegroundColor Yellow

$syncPath = "scripts\sync-constants.cjs"
$syncContent = Get-Content $syncPath -Raw

# Backup
Copy-Item $syncPath "$syncPath.backup-phase15"

# Check if freshnessOptions is already in the sync list
if ($syncContent -notmatch 'freshnessOptions') {
    # Find the SYNC_FILES array and add freshnessOptions
    $syncSearch = "name: 'validation'"
    $syncReplace = @"
name: 'validation'
  },
  {
    source: 'src/constants/freshnessOptions.ts',
    dest: 'supabase/functions/_shared/freshnessOptions.ts',
    name: 'freshnessOptions'
"@
    $syncContent = $syncContent -replace [regex]::Escape($syncSearch), $syncReplace
    $syncContent | Set-Content $syncPath -NoNewline
    Write-Host "  -> Added freshnessOptions to sync list" -ForegroundColor Green
} else {
    Write-Host "  -> freshnessOptions already in sync list" -ForegroundColor Gray
}

# Step 5: Run sync-constants
Write-Host ""
Write-Host "[5/6] Running sync-constants..." -ForegroundColor Yellow
npm run sync-constants

# Step 6: Verify
Write-Host ""
Write-Host "[6/6] Verifying changes..." -ForegroundColor Yellow

$verifyResults = @()

# Check freshnessOptions.ts exists
if (Test-Path "src\constants\freshnessOptions.ts") {
    $verifyResults += "  [OK] src\constants\freshnessOptions.ts exists"
} else {
    $verifyResults += "  [FAIL] src\constants\freshnessOptions.ts missing"
}

# Check backend mirror exists
if (Test-Path "supabase\functions\_shared\freshnessOptions.ts") {
    $verifyResults += "  [OK] supabase\functions\_shared\freshnessOptions.ts exists"
} else {
    $verifyResults += "  [FAIL] supabase\functions\_shared\freshnessOptions.ts missing"
}

# Check EnhanceLessonForm has freshnessMode
$formCheck = Get-Content $formPath -Raw
if ($formCheck -match 'freshnessMode') {
    $verifyResults += "  [OK] EnhanceLessonForm.tsx has freshnessMode"
} else {
    $verifyResults += "  [FAIL] EnhanceLessonForm.tsx missing freshnessMode"
}

# Check edge function has buildFreshnessContext
$edgeCheck = Get-Content $edgePath -Raw
if ($edgeCheck -match 'buildFreshnessContext') {
    $verifyResults += "  [OK] generate-lesson/index.ts has freshness context"
} else {
    $verifyResults += "  [FAIL] generate-lesson/index.ts missing freshness context"
}

foreach ($result in $verifyResults) {
    if ($result -match '\[OK\]') {
        Write-Host $result -ForegroundColor Green
    } else {
        Write-Host $result -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 15.1 Implementation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes: git diff" -ForegroundColor White
Write-Host "  2. Test locally: npm run build" -ForegroundColor White
Write-Host "  3. Deploy edge function:" -ForegroundColor White
Write-Host "     npx supabase functions deploy generate-lesson --project-ref hphebzdftpjbiudpfcrs" -ForegroundColor Gray
Write-Host "  4. Commit and push to GitHub" -ForegroundColor White
Write-Host ""
