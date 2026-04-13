# BibleLessonSpark -- Claude Code Instructions
# Last updated: April 13, 2026
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
2. Start dev server: npm run dev
3. HOLD -- Lynn must verify on localhost in a new browser tab
4. Do NOT run deploy.ps1 until Lynn gives explicit approval
5. .\deploy.ps1 "message"  (PowerShell, -ExecutionPolicy Bypass)

NEVER run deploy.ps1 without Lynn's explicit localhost approval first. No exceptions.
NEVER push code that has not compiled cleanly.
NEVER use Lovable, Vercel, or any other host. Netlify only.

---

## FILE WRITING -- CRITICAL RULES

### PATH VERIFICATION BEFORE EVERY FILE WRITE -- no exceptions
Before writing or editing any file, confirm its exact path:
Get-ChildItem "C:\Users\Lynn\biblelessonspark\src" -Recurse | Where-Object { $_.Name -eq "TargetFile.tsx" }
Replace "TargetFile.tsx" with the actual filename. Do not assume paths from memory.
Files may live in subdirectories you do not expect (e.g., dashboard/, layout/, landing/).

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

| File                                              | Reason                                                          |
|---------------------------------------------------|-----------------------------------------------------------------|
| src/config/pricingPlans.ts                        | Conflicted with pricingConfig.ts (deleted Feb 22)               |
| src/constants/branding.ts                         | Orphaned duplicate of src/config/branding.ts (deleted Feb 21)  |
| src/config/site.ts                                | Duplicated branding.ts (deleted Feb 21)                         |
| src/components/workspace/WorkspaceSettingsPanel.tsx | Dead code -- never imported or rendered; targeted nonexistent table (deleted March 20, 2026) |
| src/components/dashboard/BookletPrintModal.tsx      | Print feature removed; confirmed absent April 13, 2026         |

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

This applies to ALL edge functions including:
- stripe-webhook/index.ts (individual subscriptions)
- org-stripe-webhook/index.ts (org subscriptions -- fixed March 20, 2026)
- create-org-checkout-session/index.ts (org checkout -- fixed March 20, 2026)
All three now import exclusively from _shared/pricingConfig.ts. Zero banned DB queries.

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
RESOLVED March 20, 2026: All 25 hardcoded route paths in App.tsx replaced with
ROUTES.* constants imported from routes.ts. The known SSOT violation is closed.
Manual verification of BOTH files remains mandatory on every route change.

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
**TEMPORARY OVERRIDE (March 22, 2026):** Rule #9 suspended for `ui-sidebar` branch.
This branch is used for sidebar navigation feature development.
Restore this rule (remove this override note) when `ui-sidebar` merges to `main`.

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

### Rule #20: Supabase migration CLI is operational -- use it
All future database schema changes MUST use a migration file in supabase/migrations/
and be applied via: npx supabase db push --linked
NEVER apply schema changes manually via the Supabase Dashboard SQL editor.
Migration history was fully reconciled March 20, 2026 (45 migrations, zero drift).
Before running db push: verify the SQL is correct AND the change is not already
applied to the live database. The two-step check prevents duplicate migrations.

### Rule #21: Run /audit-ssot before touching constants, configs, or backend
At the start of any session that touches constants, pricing, tier names, routes,
or backend functions -- run the /audit-ssot slash command first.
It is read-only and diagnostic. It saves findings to SSOT_AUDIT_REPORT.md.
Never modify SSOT files without first knowing the current violation state.

### Rule #22: Accessibility is non-negotiable on every UI change
Every interactive element must meet WCAG 2.1 AA minimum. Required on every UI task:
(1) aria-disabled="true" never the disabled attribute on buttons that must stay focusable;
(2) decorative icons always aria-hidden="true";
(3) locked/gated items stay in tab order with tabIndex={0};
(4) aria-label must describe both purpose and state;
(5) hidden items use conditional rendering not CSS display:none;
(6) nav landmarks never removed or left unlabeled;
(7) aria-live="polite" on status/generation regions;
(8) role="alert" on error messages;
(9) focus moves to first error on validation failure and to result heading after generation completes;
(10) every CC prompt touching UI must append the ACCESSIBILITY VERIFICATION BLOCK defined in the appendix of this file.
Added April 4, 2026.

---

## DEBUGGING PROTOCOL

1. STOP -- Do not propose solutions immediately
2. DIAGNOSE -- Identify root cause through systematic analysis
3. VERIFY -- Confirm diagnosis before any code changes
4. PROPOSE -- Present complete solution with substantiation
5. WAIT -- Get approval before implementing
6. IMPLEMENT -- Provide complete, tested solution

### KNOWN RECURRING BUG -- DUPLICATE BRANDING IMPORT

Any file with two `import { BRANDING }` lines causes
`Uncaught SyntaxError: Identifier 'BRANDING' has already been declared` at runtime.
The build compiles clean but the browser crashes to a blank white page.
This has occurred in Footer.tsx, Help.tsx, and other files across multiple sessions.

When a blank white page appears -- always run this search first before any other diagnosis:

```powershell
Get-ChildItem "C:\Users\Lynn\biblelessonspark\src" -Recurse -Include "*.tsx","*.ts" | Select-String "import.*BRANDING" | Group-Object Filename | Where-Object { $_.Count -gt 1 }
```

This finds every file with more than one BRANDING import in under 10 seconds.

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

## SLASH COMMANDS

### /prime
Read CLAUDE.md and PROJECT_MASTER.md in full. Confirm architecture understanding before proceeding.

### /create-plan
Create a step-by-step implementation plan for the requested task. Present for approval before writing any code.

### /implement
Implement the approved plan. Follow deploy sequence. No partial fixes.

### /audit-ssot
Runs a read-only SSOT and Frontend-Drives-Backend audit of the entire project.
- Scans all src/ files for duplicated constants, hardcoded values, and backend-defined values that should be frontend-sourced
- Checks for any database-stored strings that conflict with or duplicate frontend SSOT definitions
- Produces a findings report saved as SSOT_AUDIT_REPORT.md in the project root
- NO code changes are made during this command -- diagnostic only
- Report format: violation, file, line number, rule broken, recommended fix
Run this command at the start of any session touching constants, configs, pricing, tier names, routes, or backend functions.

---

## COPY GOVERNANCE -- UPGRADE & CONVERSION MESSAGING

Last updated: April 4, 2026

This section governs all copy written for free-tier conversion moments,
upgrade prompts, locked feature states, and any message shown to a user
at the boundary between Free and Personal plan access.

Claude Code must read this section before modifying any of the following files:
  - src/components/dashboard/UsageDisplay.tsx
  - src/components/dashboard/EnhanceLessonForm.tsx
  - src/components/subscription/UpgradePromptModal.tsx
  - src/constants/sidebarConfig.ts (locked item labels and tooltips)

### THE FOUNDATIONAL PRINCIPLE

When a free-tier user encounters an upgrade prompt on BibleLessonSpark,
they are not making a software purchasing decision.

They are making a ministry calling decision.

The question they are silently answering is not:
    "Do I want more features?"

It is:
    "What kind of shepherd am I going to be for these people?"

This is a Great Commission moment (Matthew 28:19). Copy that lists software
features at this moment fails the teacher and fails the platform's mission.
Copy that speaks to her calling, to the people in her care, and to the
consequence of her decision succeeds.

Claude Code must never reduce this moment to a transaction.

### THE THREE CONVERSION MOMENTS

There are exactly three places in the UI where a free-tier teacher encounters
a calling decision. Each has its own tone requirement.

Moment 1 -- Lesson Usage Card (top-right dashboard)
The first place she sees her limit. She is still hopeful.
Tone: Honoring + invitational + forward-looking.
She has done something right. Now she can go further.

Moment 2 -- Exhausted Lessons Banner (center dashboard + EnhanceLessonForm)
The moment of decision. She cannot move forward without choosing.
This is the most important copy on the platform.
Tone: Honest + pastoral + clear consequence without manipulation.
Not "you are blocked." But: "there is more available to you now."

Moment 3 -- Locked Sidebar Items (Devotional Library, Series Library, Teaching Team)
Silent callings she sees on every visit. Each locked item carries its own
specific ministry meaning for her people.
Tone: Specific to that tool's ministry purpose -- never generic.
Copy must speak to what that tool does for HER GROUP, not her prep.

### PROTECTED LINES -- DO NOT WEAKEN OR REMOVE

These lines are in production in UpgradePromptModal.tsx and represent the
platform's core conversion voice. All new copy must be consistent with the
weight and tone of these lines. They are not negotiable.

    "A good lesson teaches. An equipped teacher disciples."

    "A free account prepares a lesson. The Personal Plan equips a class."

    Column headers: "WHERE YOU ARE" vs "WHERE YOU COULD TAKE THEM"

If a code change would alter, soften, or remove any of these lines,
STOP. Flag it. Do not proceed without explicit instruction from Lynn.

### LOCKED SIDEBAR ITEM MICRO-COPY

When UpgradePromptModal is triggered by a specific locked sidebar item,
the opening line of the modal must reflect that item's specific ministry
purpose. Generic copy is not acceptable here.

  Devotional Library:
    "Your group's faith doesn't pause on Monday. DevotionalSpark
     follows them all week -- connecting Sunday's lesson to Tuesday's life."

  Series Library:
    "One lesson teaches a truth. A series builds a disciple.
     Plan weeks ahead and let your group see where you're taking them."

  Teaching Team:
    "Moses had Aaron. Paul had Timothy. You were never meant to lead alone.
     Invite your co-teachers and carry this together."

### COPY RULES -- ENFORCED ON EVERY CHANGE

1. Never lead with the limit. Acknowledge it briefly, then pivot immediately
   to what is NOW available.

2. Never list software features as the primary reason to upgrade.
   Always frame the upgrade around what happens to HER PEOPLE.

3. The contrast is always:
       teaching a lesson  vs.  discipling believers
   Not:
       free plan  vs.  paid plan

4. "Your group" is preferred over "your class" -- more inclusive for all
   ministry contexts.

5. Button copy must feel like an act of ministry, not a purchase:
     CORRECT:  "Equip My Class"
     CORRECT:  "Yes -- Let's Do More"
     CORRECT:  "Step Into Personal -- Equip My Class"
     AVOID:    "Upgrade Now" as a standalone phrase

6. Never pressure. Always clarify. The decision must feel like her own --
   arrived at through reflection, not urgency.

7. Speak to her calling, not her fear.
   Speak to her people's growth, not her platform limits.

### VOICE STANDARD

Warm. Pastoral. Honest. Direct without being commercial.
This is a Baptist volunteer teacher audience. She gave up her Sunday morning
to serve her people. She deserves to be spoken to as the faithful minister
she already is -- and invited toward the fuller version of that ministry
she can become.

Every word written at these conversion moments must be worthy of that calling.

---

## PROJECT ROOT AUDIT FILES

SSOT_AUDIT_REPORT.md -- Generated by /audit-ssot. Contains all SSOT and
Frontend-Drives-Backend violations found in the last audit run. Read this
before touching any SSOT files. Last full audit: March 20, 2026 (19 violations,
all resolved).

---

Claude Code reads this file automatically at session start.
No manual priming required.

Before any work begins:
1. Read this file (CLAUDE.md) -- done automatically
2. Read PROJECT_MASTER.md -- required, contains current session state and What's Next
3. Read the actual source files relevant to the task
4. Confirm understanding before making any changes
5. npm run build after changes and before deploying

---

## ACCESSIBILITY VERIFICATION BLOCK
## Append this block to every CC prompt that touches any UI component, navigation, modal, form, or interactive element.

ACCESSIBILITY VERIFICATION (required on every UI change)

BibleLessonSpark is committed to WCAG 2.1 AA compliance.
A blind teacher must be able to use every feature without friction.

Before reporting build complete, verify every interactive element changed or added:

ARIA
- Buttons that must stay focusable use aria-disabled="true" -- never the disabled attribute
- Decorative icons have aria-hidden="true"
- Locked/gated items have aria-label describing both name and reason: "{Label}, Personal Plan required"
- Status regions use aria-live="polite"
- Error messages use role="alert"
- Nav landmarks have aria-label or equivalent

KEYBOARD
- Tab order includes all interactive elements including locked ones
- Hidden elements use conditional rendering -- not display:none or visibility:hidden
- Focus moves to first error on validation failure
- Focus moves to result heading after lesson generation completes
- Enter/Space activates every button and control

STRUCTURE
- Heading hierarchy is logical -- no skipped levels
- Form inputs have explicit label elements -- not placeholder-only
- Input groups use fieldset and legend where appropriate
- Skip link present on any page with substantial navigation

COMPONENTS
- Native HTML controls preferred on accessible flows
- If shadcn/Radix components used, verify correct ARIA behavior is not stripped by customization

ROUTES (if a new route was added)
- routes.ts updated
- App.tsx updated in the same pass

Keyboard-only verification: Tab through every changed element without using the mouse.
Confirm focus is visible at all times. Report any element that cannot be reached by keyboard.

---

## MANDATORY SESSION-END PROTOCOL -- not optional

At the end of every working session, before signing off:

1. Update PROJECT_MASTER.md with a session log covering all work completed,
   files changed, commits made, bugs found/fixed, and carry-forward items.
2. Update CLAUDE.md ONLY if new rules were added or existing rules changed.
3. Commit both files: .\deploy.ps1 "DOCS: Update PROJECT_MASTER and CLAUDE for [date] session"
4. Remind Lynn: "Please re-upload PROJECT_MASTER.md to the Claude.ai project
   so the next session has current context."

This protocol ensures no session's work is lost between conversations.
Skipping it causes the next session to start with stale context, leading
to duplicated work and missed carry-forwards.
