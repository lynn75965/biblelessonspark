# BibleLessonSpark -- Claude Code Instructions
# Last updated: March 2026
# READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE

## AUTO-READ ON SESSION START
Read this file (CLAUDE.md) AND PROJECT_MASTER.md in full before responding to
any request. Confirm understanding of all workflow rules before proceeding.

---

## WHO OWNS THIS PROJECT

Lynn -- retired Baptist minister, PhD, 55 years ministry experience.
NON-PROGRAMMER solopreneur. Requires complete file replacements, not diffs or patches.
Every solution must be complete and working. No partial fixes. No assumptions.

---

## REPOSITORY

Local:   C:\Users\Lynn\biblelessonspark
GitHub:  https://github.com/lynn75965/biblelessonspark
Branch:  main (ONLY branch -- never create secondary branches)
Live:    biblelessonspark.com (Netlify auto-deploys from main)

---

## STACK

Frontend:   React 18 + TypeScript + Vite + Tailwind CSS
Backend:    Supabase (PostgreSQL + Edge Functions)
Deploy:     Netlify (auto-deploy from GitHub main)
Payments:   Stripe
package.json has "type": "module" -- use .cjs for Node scripts

---

## DEPLOY SEQUENCE (NEVER SKIP STEPS)

1. npm run build           (must be clean -- zero errors)
2. .\deploy.ps1 "message"  (PowerShell, -ExecutionPolicy Bypass)

NEVER push code that has not compiled cleanly.
NEVER use Lovable, Vercel, or any other host. Netlify only.

---

## FILE WRITING -- CRITICAL RULES

### NEVER use Set-Content -Encoding UTF8
PowerShell UTF8 adds a BOM (\xEF\xBB\xBF) that trips the ASCII deploy guard.

### ALWAYS use this method for file writes:
[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))

### For complex multi-line TypeScript files:
Use a Node .cjs script (NOT .js) with fs.writeFileSync() and an array of lines joined by \n
Example:
  const lines = [
    'line one',
    'line two',
  ];
  require('fs').writeFileSync('target.ts', lines.join('\n'), 'utf8');

### Why .cjs not .js:
package.json has "type": "module" -- .js files are treated as ESM and will fail with require()

### PowerShell here-strings:
Correct syntax for single quotes: @'...'@
Do NOT use bash-style escaping like '"'"' -- it does not work in PowerShell

### If a file is corrupted:
Restore from git BEFORE patching: git checkout HEAD -- path/to/file.ts
(Workflow Rule #19)

---

## ASCII GUARD

The deploy.ps1 pre-commit hook blocks any non-ASCII characters in source files.
This includes: em dashes, curly quotes, box-drawing characters, Unicode symbols.

If you must represent a special character, use a JavaScript escape sequence.
Example: \u2014 for em dash, \u00F3 for o-with-accent

Use git commit --no-verify ONLY when a BOM or encoding issue is confirmed and
cannot be resolved any other way. Not for convenience.

---

## ARCHITECTURE PRINCIPLE #1: SSOT (Single Source of Truth)

Every constant, type, and configuration has ONE authoritative source.
All consumers import from that single source.
NO duplicate definitions anywhere in the codebase.
Changes to a domain require updating only ONE file.

### SSOT File Map

| Domain                  | Authoritative File                        |
|-------------------------|-------------------------------------------|
| Types / Interfaces      | src/constants/contracts.ts                |
| Age Groups              | src/constants/ageGroups.ts                |
| Theology Profiles       | src/constants/theologyProfiles.ts         |
| Access Control / Roles  | src/constants/accessControl.ts            |
| Validation Rules        | src/constants/validation.ts               |
| Lesson Formatting       | src/utils/formatLessonContent.ts          |
| Pricing                 | src/config/pricingConfig.ts               |
| Trial Config            | src/config/trialConfig.ts                 |
| Feature Flags           | src/config/featureFlags.ts                |
| Audience / Role Terms   | src/config/audienceConfig.ts              |
| Series Export Config    | src/config/seriesExportConfig.ts          |
| Lesson Shape Profiles   | src/config/lessonShapeProfiles.ts         |
| Branding                | src/config/branding.ts                    |

### Deleted Files -- DO NOT RECREATE

| File                       | Reason                                     |
|----------------------------|--------------------------------------------|
| src/config/pricingPlans.ts | Conflicted with pricingConfig.ts (deleted Feb 22) |
| src/constants/branding.ts  | Orphaned duplicate of src/config/branding.ts (deleted Feb 21) |
| src/config/site.ts         | Duplicated branding.ts (deleted Feb 21)    |

### Before touching any SSOT file:
Audit ALL consumers of that file. Every import must be verified.
Never declare work complete until all consumers are checked.

---

## ARCHITECTURE PRINCIPLE #2: FRONTEND DRIVES BACKEND

Frontend constants are the authoritative source.
Backend (Supabase) validates against frontend-defined values.
Database enum values must match frontend constants exactly.
The Stripe webhook resolves tiers from pricingConfig.ts and trialConfig.ts.
NEVER query tier_config or pricing_plans database tables.
NEVER propose database triggers or autonomous backend actions.

---

## ARCHITECTURE PRINCIPLE #3: INVISIBLE THEOLOGICAL GUARDRAILS

Theology profiles shape AI-generated content without user awareness.
10 supported Baptist traditions -- see theologyProfiles.ts.
Prohibited terminology is logged but never shown to users.
Users see denomination-appropriate content without knowing guardrails exist.

---

## CRITICAL WORKFLOW RULES

### Rule #1: Verify actual file contents before any change
Never assume file contents. Read the actual file before proposing any change.
Identify the violation with file name and line number before proposing a fix.
Claude Code: Read files directly from the repo -- do not ask Lynn to upload them.

### Rule #2: Complete solutions only -- no partial fixes
Provide full file contents. No diffs. No patches. No partial edits.
Lynn copies complete files -- she does not apply patches manually.
Claude Code: Edit files in place using complete rewrites.

### Rule #3: Route bug pattern (has caused bugs 4 times)
Every route added to routes.ts MUST also be added to App.tsx.
Bugs caused: /org-manager, /workspace, /admin/toolbelt, /workspace again.
VERIFY BOTH FILES on every route change.
KNOWN SSOT VIOLATION: App.tsx manually re-declares routes instead of importing
from routes.ts. Future refactor needed. Until then, manual verification is mandatory.

### Rule #4: Dependency chain before deploy
Verify all files referencing new properties or exports are included in the same deploy.

### Rule #5: npm run build before every deploy
No exceptions. Clean build required before .\deploy.ps1

### Rule #6: Never overwrite working code with stale copies
Always verify the file being deployed reflects ALL changes from the current session.

### Rule #7: Verify before claiming
Never cite a commit reference or session log as proof a change exists.
Read the actual file and confirm the change is present.

### Rule #8: profiles table uses full_name
Column is full_name -- NOT display_name. Never assume column names.

### Rule #9: Single branch only
Branch is main. No secondary branches. Deploy script enforces main.

### Rule #10: Test regex against real data
Never assume a regex works. Run it against actual application content.

### Rule #11: Cache-bust downloaded exports
Increment filename (v2, v3) and delete old download before testing.

### Rule #12: AudienceConfig -- never hardcode participant strings
NEVER hardcode "Student", "Member", or "Attendee".
Always resolve through resolveExportTerminology() in seriesExportConfig.ts.
Series-level exports use "Group Handout" -- never a participant term.

### Rule #13: Corrupted files -- restore from git first
git checkout HEAD -- src/path/to/file.ts THEN apply fix to clean file.

### Rule #14: Never present options you are not certain about
If you do not know where a Supabase setting lives, say so.
Uncertainty stated clearly is less damaging than confident wrong guidance.

### Rule #15: Bible version IDs must be lowercase
Backend expects kjv, esv, niv etc. Frontend must normalize before saving.

### Rule #16: Use JavaScript escape sequences for non-ASCII
Never use literal Unicode in source files. ASCII guard will block the deploy.
Correct: \u2014 for em dash. Wrong: pasting the actual character.

### Rule #17: Webhook tier resolution uses pricingConfig.ts SSOT only
NEVER query tier_config or pricing_plans tables.
Webhook imports resolveTierFromPriceId from _shared/pricingConfig.ts.

### Rule #18: AudienceConfig -- never hardcode participant strings
(Same as Rule #12 -- reinforced because this caused a production violation.)
AudienceConfig triad: Role (Teacher/Pastor/Leader),
Assembly (Class/Study Group/Congregation), Participant (Student/Member/Attendee).

### Rule #19: Corrupted files -- restore from git before patching
(Same as Rule #13 -- reinforced.) git checkout HEAD -- path/to/file.ts FIRST.

---

## DEBUGGING PROTOCOL

1. STOP -- Do not propose solutions immediately
2. DIAGNOSE -- Identify root cause through systematic analysis
3. VERIFY -- Confirm diagnosis before any code changes
4. PROPOSE -- Present complete solution with substantiation
5. WAIT -- Get approval before implementing
6. IMPLEMENT -- Provide complete, tested solution

---

## SERIES EXPORT FEATURE (Active Development -- March 2026)

Primary files:
- src/components/SeriesLibrary.tsx
- src/components/SeriesExportModal.tsx
- src/config/seriesExportConfig.ts
- src/utils/buildSeriesPdf.ts
- src/utils/buildSeriesDocx.ts

Locked terminology: All series-level exports use "Group Handout" -- never "Student Handout".

Five color palettes (each requires two rendered swatches in modal UI):
1. Forest & Gold (default / BLS brand)
2. Navy & Steel
3. Burgundy & Copper
4. Deep Teal & Bronze
5. Plum & Sage

Export format rules (locked):
- Margins: 0.25" inner, 0.40" outer, 0.40" top/bottom; 7.85" text block
- No dates, theology profile, age group, or Bible version in any export output
- BibleLessonSpark attribution: footer only, small gray type
- No numbered circles on questions (inappropriate for adult curriculum)
- Label: "Study Guide" not "Booklet"

Deploy rule: All four primary files deploy together in a single commit.

---

## SUBSCRIPTION TIERS

Source of truth: src/config/pricingConfig.ts and src/config/trialConfig.ts

Tier names (must match database enum): free | personal | starter | growth | full | enterprise
NOTE: admin is a ROLE (accessControl.ts), not a tier.

Lesson limits per rolling 30-day period:
free: 5 | personal: 20 | starter: 25 | growth: 60 | full: 120 | enterprise: 250

Free tier precise definition:
- 3 full lessons (all 8 sections) + 2 short lessons (sections 1, 5, 8) per 30-day period
- Clock starts from FIRST full lesson generated; short lessons alone do not start the clock
- Admin can grant extensions: 7, 14, 30 (default), 60, or 90 days

Personal Plan: $9/month or $90/year -- all 8 sections, 20 lessons/period

Lesson Packs (one-time): Small $15 / Medium $35 / Large $60

---

## 8-SECTION LESSON FRAMEWORK

Section names are SSOT in pricingConfig.ts SECTION_NAMES -- never hardcode them.

1. Lens + Lesson Overview (150-250 words)
2. Learning Objectives + Key Scriptures
3. Theological Background (Deep-Dive) (450-600 words)
4. Opening Activities (120-200 words)
5. Main Teaching Content (Teacher Transcript) (630-840 words)
6. Interactive Activities (150-250 words)
7. Discussion & Assessment (200-300 words)
8. Group Handout (Standalone) (250-400 words)
Total target: 2100-3090 words

---

## COMMIT MESSAGE FORMAT

[CATEGORY]: Brief description
Categories: SSOT, FIX, FEATURE, REFACTOR, SECURITY, DOCS

---

## SUPABASE PROJECT

URL: https://hphebzdftpjbiudpfcrs.supabase.co
Edge Functions: supabase/functions/
Shared utilities: supabase/functions/_shared/

---

## SESSION START PROTOCOL (AUTOMATED)

Claude Code reads this file automatically at session start.
No manual priming required.

Before any work begins:
1. Read this file (CLAUDE.md) -- done automatically
2. Read PROJECT_MASTER.md -- required, contains current session state and What's Next
3. Read the actual source files relevant to the task
4. Confirm understanding before making any changes
5. Run npm run build after changes and before deploying