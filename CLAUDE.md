# BibleLessonSpark -- Claude Code Instructions
# Last updated: July 18, 2026
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
| Pricing                 | src/constants/pricingConfig.ts            |
| Trial Config            | src/constants/trialConfig.ts              |
| Feature Flags           | src/config/featureFlags.ts                |
| Audience / Role Terms   | src/config/audienceConfig.ts              |
| Series Export Config    | src/constants/seriesExportConfig.ts       |
| Lesson Shape Profiles   | src/config/lessonShapeProfiles.ts         |
| Branding                | src/config/branding.ts                    |
| Blog Config             | src/constants/blogConfig.ts               |

### Deleted Files -- DO NOT RECREATE

| File                                              | Reason                                                          |
|---------------------------------------------------|-----------------------------------------------------------------|
| src/config/pricingPlans.ts                        | Conflicted with pricingConfig.ts (deleted Feb 22)               |
| src/constants/branding.ts                         | Orphaned duplicate of src/config/branding.ts (deleted Feb 21)  |
| src/config/site.ts                                | Duplicated branding.ts (deleted Feb 21)                         |
| src/components/workspace/WorkspaceSettingsPanel.tsx | Dead code -- never imported or rendered; targeted nonexistent table (deleted March 20, 2026) |
| src/components/dashboard/BookletPrintModal.tsx      | Print feature removed; confirmed absent April 13, 2026         |
| src/utils/useSpeechInput.ts                         | Voice navigation removed from feature set (deleted April 13, 2026) |
| src/hooks/useAnalytics.tsx                          | Sole writer to the (now-frozen) events table; RLS silently blocked every non-admin insert -- retired, see Rule #34 (deleted July 18, 2026) |
| src/components/security/SecurityMonitor.tsx         | Dead code -- never imported; read from the same frozen events table (deleted July 18, 2026) |
| src/hooks/usePricingPlans.tsx                       | Read display pricing from the pricing_plans DB table as a second source of truth; replaced by PRICING_PLANS in pricingConfig.ts (deleted July 18, 2026) |
| src/components/admin/PricingPlansManager.tsx        | Admin UI for the orphaned subscription_plans table (pre-SSOT credits model, essentials/pro/premium -- matched no current tier); "Sync from Stripe" button was a live footgun (deleted July 18, 2026) |
| supabase/functions/sync-pricing-from-stripe/         | Synced the orphaned subscription_plans table against stale essentials/pro/premium Stripe lookup keys; zero callers beyond the deleted admin UI (deleted July 18, 2026) |
| supabase/functions/seed-stripe-catalog/              | Seeded the orphaned subscription_plans table; zero callers anywhere, not even the admin UI (deleted July 18, 2026) |

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
12 supported Baptist traditions -- see theologyProfiles.ts.
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

AD-HOC SQL (added June 23, 2026): `npx supabase db query --linked "<SQL>"` runs a
one-off query against the linked remote DB via the Management API (CLI v2.107.0).
Use it for READ-ONLY diagnostics (information_schema, pg_policies,
supabase_migrations.schema_migrations, spot-checking a row) and -- sparingly, with
Lynn's OK -- deliberate test-data fixes. It is NOT a substitute for migrations:
every SCHEMA change still goes through a migration file + `db push` (never via
db query or the Dashboard SQL editor). `--output table|json|csv` formats results.

EDGE FUNCTION DEPLOYS (added June 17, 2026): deploy a single function with
  npx supabase functions deploy <name> --project-ref hphebzdftpjbiudpfcrs --use-api
The `--linked` flag is REJECTED by `functions deploy` (it is valid only on `db push`).
`--use-api` bundles server-side, so no local Docker or Deno is required (neither is
installed on this box). `npx supabase` is authenticated; project hphebzdftpjbiudpfcrs
(LessonSparkUSA) is linked. Deploy edge functions ONE AT A TIME and confirm each is
clean. A 502/transient bundler error is retryable (the live function is unchanged on
failure -- never half-deployed). NOTE: a function whose first import is the legacy
`https://deno.land/x/xhr@0.1.0/mod.ts` polyfill will fail to bundle (CDN fetch
timeout); that dead import was removed from all live functions June 17, 2026 -- do not
reintroduce it (supabase-js v2 uses native fetch).

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

### Rule #23: Run npm run sync-constants after every change to a file in FILES_TO_SYNC
The following 16 files auto-sync from src/constants/ to supabase/functions/_shared/
via scripts/sync-constants.cjs:
ageGroups.ts, bibleVersions.ts, generationMetrics.ts, lessonStructure.ts,
lessonTiers.ts, systemSettings.ts, teacherPreferences.ts, theologyProfiles.ts,
routes.ts, contracts.ts, rateLimitConfig.ts, freshnessOptions.ts,
devotionalConfig.ts, toolbeltConfig.ts, scriptureIntegrityGuardrail.ts,
modelConfig.ts
Run npm run sync-constants immediately after editing any of these. Never hand-edit
their _shared/ mirrors -- they are auto-generated and will be overwritten on the
next sync. Added May 5, 2026. scriptureIntegrityGuardrail.ts (the "Rule 5"
scripture-integrity SSOT shared by all generators + the reshape prompt) added
June 3, 2026. modelConfig.ts (ANTHROPIC_MODELS -- the model-ID SSOT imported by
all six generators: generate-lesson, reshape-lesson, extract-lesson,
generate-devotional, generate-parable, toolbelt-reflect) added June 16, 2026.

### Rule #24: These _shared/ files are intentionally hand-maintained -- not in FILES_TO_SYNC
pricingConfig.ts, trialConfig.ts, validation.ts, lessonShapeProfiles.ts,
seriesConfig.ts, branding.ts, uiSymbols.ts, organizationConfig.ts,
betaEnrollmentConfig.ts, emailDeliveryConfig.ts, outputGuardrails.ts,
customizationDirectives.ts, corsConfig.ts, orgPoolCheck.ts, subscriptionCheck.ts,
rateLimit.ts, blogConfig.ts
These contain backend-specific logic with no clean frontend counterpart. When the
frontend SSOT for any of these changes, the corresponding _shared/ file must be
updated manually in the same commit. Never add these to FILES_TO_SYNC.
Added May 5, 2026.

### Rule #25: Hardcoded admin UUID in RLS admin_full_access policies -- DO NOT REWRITE
Eighteen RLS policies named `admin_full_access` carry the hardcoded literal UUID
`b8708e6b-eeef-4ff5-9f0b-57d808ef8762` in their USING and WITH CHECK clauses.
That UUID is Lynn's auth.users id. The policies are RESTRICTIVE -- they grant
full access to exactly one user -- so they are not a data exposure. They are
brittle (UUID change breaks all 18 at once) and they coexist with three other
admin-check abstractions in the codebase (`has_role`, `is_admin`, `profiles.role
= 'admin'`), but that is a documented architectural choice.

Affected tables (18):
admin_audit, app_settings, beta_feedback, beta_testers, credits_ledger,
feedback, notifications, organization_contacts, organization_members,
outputs, rate_limits, refinements, setup_progress, stripe_events,
subscription_plans, user_roles, user_subscriptions, (and one more identified
via section C diagnostic).

DO NOT rewrite these policies in any session unless Lynn has explicitly asked
to add a second admin. When that day comes, the rewrite is a single migration
that, for every table in the list above, replaces:

  USING  (auth.uid() = 'b8708e6b-eeef-4ff5-9f0b-57d808ef8762'::uuid)
  WITH CHECK (auth.uid() = 'b8708e6b-eeef-4ff5-9f0b-57d808ef8762'::uuid)

with:

  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role))

Until then, the Supabase Security Advisor may flag these policies in a generic
"hardcoded UUID" warning. That warning is intentionally accepted. Do not
treat it as a fix-it ticket. Added May 31, 2026.

### Rule #26: Lesson usage -- one server-side writer; teaser is tier-bound
Added June 17, 2026 (free-tier counter unification).

(1) CLIENT NEVER WRITES USAGE. Lesson usage is incremented SERVER-SIDE ONLY, in
the generate-lesson Edge Function, after a successful save:
  - free tier  -> profiles.trial_full_lessons_used / trial_short_lessons_used
  - paid tier  -> incrementLessonUsage() (user_subscriptions.lessons_used)
  - org member -> org pool consumption
Do NOT reintroduce any client-side increment (the old
useSubscription.incrementUsage() + EnhanceLessonForm call were removed). The
client only READS via refreshSubscription().

(2) FREE-TIER GATING SSOT = the profiles trial counters, read through
getTrialStatus (trialConfig.ts). canGenerate, fullRemaining, shortRemaining,
resetDate, and nextLessonType for free users derive from those counters -- NOT
from the flat check_lesson_limit RPC counter. check_lesson_limit is used only
for tier resolution and PAID-tier gating. One authoritative free "5" = 3 Full +
2 Short. (Free model: 3 Full [sections 1..8] + 2 Short [1,5,8] per rolling 30
days; block after 5. See PROJECT_MASTER June 17, 2026 entry.)

(3) TEASER IS TIER-BOUND AND SERVER-ENFORCED. The teaser is a FULL-lesson
feature only. generate-lesson computes effectiveTeaser = isFullLesson &&
generate_teaser and FORCES it false on every Short lesson regardless of the
request body. The frontend hides the teaser checkbox on Short and defaults it ON
for Full. Never treat generate_teaser from the request as authoritative on its
own.

(4) SECTION-SHAPE SSOT = src/constants/lessonTiers.ts (FULL_SECTIONS [1..8],
SHORT_SECTIONS [1,5,8], self-contained). pricingConfig.ts derives from it. The
check_lesson_limit SQL arrays [1,5,8]/[1..8] are an INTENTIONAL documented mirror
(SQL cannot import TS) -- keep in sync by hand; not an SSOT violation.

### Rule #27: Database restore/DR procedure is documented and tested -- see docs/RESTORE_RUNBOOK.md
Added July 14, 2026 (session B2). Full production-to-staging restore procedure
tested end-to-end against a dedicated staging Supabase project. Three reusable
gotchas from that session, all documented in the runbook:

(1) `supabase db dump` / `db push` invoke pg_dump through DOCKER on Windows and
fail immediately with LegacyDockerRunError if Docker Desktop isn't installed.
This project does NOT have Docker installed. Use native pg_dump/pg_dumpall/psql
instead -- installed once via
`winget install --id PostgreSQL.PostgreSQL.17 --interactive`, selecting
Command Line Tools ONLY (no server, no service). Verify no data\ directory and
no postgresql* Windows service exist after install.

(2) Windows PowerShell 5.1's `*>` redirect operator and `Out-File -Encoding utf8`
both write UTF-16LE by default. A plain-ASCII grep against that output finds
ZERO matches even when real errors are present -- this produced a false "clean"
read during B2's first restore attempt. For any log file that will be
grepped/read later, capture output into a variable and write with
`[System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))`
instead.

(3) Long inline PowerShell commands mixing path variables (e.g. a $pgdump
variable holding a "C:\Program Files\..." path) with Remove-Item calls have
tripped a tool-level safety-check false positive (blocked as an attempted
removal of a protected system path). Write multi-step DB scripts to a .ps1
file under gitignored backups/, show the complete contents for review, then
execute as a single `powershell -File "path\to\script.ps1"` command.

### Rule #28: CI pipeline exists (GitHub Actions) -- alarm, not a gate
Added July 14, 2026 (B3 session). Two workflows live in .github/workflows/:

- `ci.yml` -- runs on every push/PR to main. Three jobs: build (`npm ci &&
  npm run build`), ascii-guard (`scripts/pre-commit-ascii-guard.sh
  --tracked`, repo-wide), lint (`npm run lint`). ascii-guard's baseline was
  ZEROED 2026-07-15 (B5 item 5 session). lint's baseline was ZEROED
  2026-07-18 (no-explicit-any batch 3, the final batch) -- both
  `@typescript-eslint/no-explicit-any` (246 errors at campaign start, now
  0 repo-wide; three justified, line-scoped `eslint-disable-next-line`
  exceptions remain, see PROJECT_MASTER.md) and the `temp_working_version.ts`
  parsing error (file deleted in an earlier session) are resolved. lint is
  now a PLAIN BLOCKING command (`npm run lint`, no summary wrapper), same
  posture as ascii-guard and as the local pre-commit hook. Netlify
  auto-deploys on every push regardless of CI result -- CI runs after the
  push has already landed, so this remains an alarm, not a gate, even with
  lint blocking. True pre-merge gating would require abandoning
  direct-push-to-main for a branch+PR flow (GitHub can't block a direct
  push with required status checks, only PR merges) -- documented as an
  optional click-path, not enabled.
- `edge-function-staleness.yml` -- weekly (Monday 13:00 UTC) + manual
  dispatch. Compares each edge function's last git commit against its
  deployed timestamp (`supabase functions list --output json`; `updated_at`
  is epoch MILLISECONDS, not an ISO string) and flags anything where git is
  newer than deployed by more than 48 hours (`STALE_THRESHOLD_SECONDS`,
  172800). NOT a short threshold like 5 minutes -- the normal workflow
  deploys a function mid-session then commits to git at session-end,
  sometimes hours later, producing git-newer gaps up to ~3h18m with zero
  real drift; only a genuinely forgotten redeploy sits stale for the ~30
  days a real one has shown. Requires repo secret `SUPABASE_ACCESS_TOKEN`
  (a personal access token from supabase.com/dashboard/account/tokens).
  Deployed-newer-than-git is always fine and never flagged -- dashboard
  `updated_at` can be re-stamped by unrelated `--use-api` deploy activity
  unrelated to the function's own code.

The ASCII guard's authoritative implementation is now
`scripts/pre-commit-ascii-guard.sh` (tracked in git, two modes: `--staged`
for the local hook, `--tracked` for CI's repo-wide run). `.git/hooks/pre-
commit` is now a 2-line delegator to that script -- `.git/hooks/` is never
versioned by git, so reinstall it after a fresh clone per README.md's Local
Development section. Do NOT recreate the old fully-inline hook; the tracked
script is the single source of truth so the local hook and CI can never
drift out of sync with each other. The script forces `LC_ALL=C.UTF-8` /
`LANG=C.UTF-8` internally: `grep -P` silently matches nothing (instead of
erroring) under a non-UTF-8 or unset locale, which is a real correctness
gap in the guard itself, not a cosmetic one -- discovered when a locale-
less shell reported a known-BOM'd file as clean.

### Rule #29: Claude API retry/fallback SSOT -- use _shared/anthropicRetry.ts
Added July 15, 2026 (B4 session -- model fallback / graceful degradation).
Every edge function that calls the Anthropic API (currently 6: generate-
lesson, generate-parable, reshape-lesson, generate-devotional, extract-
lesson, toolbelt-reflect) goes through `_shared/anthropicRetry.ts`'s
`callAnthropicNonStreaming()` (non-streaming calls) or
`openAnthropicStreamWithRetry()` (SSE connection-phase only, generate-
lesson's Phase 1). This centralizes retry/backoff/model-fallback/graceful-
failure so a NEW Claude-calling function should use these helpers rather
than a raw `fetch()` to `api.anthropic.com` -- do not reintroduce a bespoke
retry loop or an unguarded single-attempt call. Retry/fallback timeouts and
counts live in `RETRY_CONFIG` (`_shared/modelConfig.ts`, synced from
`src/constants/modelConfig.ts` per Rule #23) -- add a new `RetryCallSite`
key there for a new function rather than hardcoding a timeout inline.
If the new function's calling pattern is a pre-increment rate-limit gate
(via `_shared/edgeRateLimit.ts`'s `checkRateLimits`), pair it with
`refundRateLimits()` on a terminal Anthropic failure (see the 4 existing
call sites for the pattern) -- a failed generation must never permanently
cost the user part of their daily/hourly allotment.

### Rule #30: Every Stripe checkout-session function must validate its price_id
Added July 15, 2026 (closes a vulnerability class found TWICE: create-
checkout-session on July 14, create-org-checkout-session's MODE 2 on
July 15 -- both accepted a client-supplied Stripe price ID with zero
validation and passed it straight to `stripe.checkout.sessions.create`).
Any current or future function that creates a Stripe Checkout Session MUST
validate every client-supplied price ID against the frontend SSOT
(`_shared/pricingConfig.ts` -- `resolveTierFromPriceId()` for personal-tier
gates, or a direct `ORG_TIERS.find(...)` membership check for org-tier
gates) BEFORE any Stripe API call, fail closed with 400 on a mismatch, and
log `user_id` + the attempted price ID (never secrets) via `console.error`.
If the function also accepts client-supplied `success_url`/`cancel_url`
(or `successUrl`/`cancelUrl`), gate those too with a same-origin check via
`getBranding`/`getBaseUrl` (`_shared/branding.ts`) -- see
create-checkout-session/index.ts or create-org-checkout-session/index.ts
for the reference implementation of both gates.

### Rule #31: Admin-observable by design
Added July 16, 2026. Lynn will administer surge operations from the Admin
Panel (Configuration / Analytics / Security / Growth tabs). Therefore all
Gate 2 work (B6 finding #3 runtime verification, B7 conversion infra, B8
capacity gauges) and any future security rejection paths MUST persist
their events/metrics to queryable tables at build time -- never
console.error only -- so the Admin Panel can read them later without a
retrofit. Applies going forward to any new event/metric a session adds,
not just the three named above. The Admin Panel UI work itself
(Configuration: AI service status + rate-limit gauges; Analytics:
generation health + surge trends; Security: security events feed
expansion + theology violations; Growth: funnel) is scoped as its own
dedicated post-Gate-2 session -- do not build Admin Panel UI as a side
effect of Gate 2 work; persist the data, leave the UI for that session.

### Rule #32: A correct RLS policy is not enough -- verify the matching table-level GRANT too
Added July 17, 2026. Postgres checks table-level GRANTs BEFORE it ever
evaluates RLS. A table can have a perfectly correct RLS policy (e.g.
"Admins can update X" via has_role()/profiles.role='admin') and STILL
fail every write with "permission denied for table X" if the matching
GRANT was never issued to the authenticated role. This bit
guardrail_violations directly: the June 2026 Security Advisor Section F
migration (20260605100000_security_section_f_grants.sql) revoked ALL
privileges and re-granted only SELECT to four tables (app_settings,
org_tier_config, guardrail_violations, guardrail_violation_summary) as
defense-in-depth -- when the admin Mark-as-Reviewed feature was built on
guardrail_violations weeks later, its RLS UPDATE policy was correct but
nobody restored the matching UPDATE grant, so every save failed silently
from the RLS's perspective (the RLS never even ran) until a dedicated
fix migration restored it column-limited. Before shipping ANY new
admin-write path (INSERT/UPDATE/DELETE) on an existing table, query
`information_schema.role_column_grants` (or `role_table_grants`) for the
target role and confirm the needed privilege actually exists -- do not
assume a correct-looking RLS policy is sufficient. When creating a new
table from scratch, follow the explicit-grant pattern already
established in capacity_events / conversion_events / guardrail_suppressions:
`REVOKE ALL ... FROM anon, authenticated;` then explicit, ideally
column-limited, `GRANT ... TO authenticated` for exactly what the app
writes, plus an explicit `GRANT ALL ... TO service_role` (confirmed via
capacity_events that service_role privileges are NOT automatic on a new
table either). The three OTHER tables Section F left at
authenticated-SELECT-only (app_settings, org_tier_config,
guardrail_violation_summary) have not been individually re-checked --
if any of them ever gains a client-side write path, check for this exact
trap before assuming the RLS alone will cover it.

### Rule #33: One-time / never-again UI prompts must be gated server-side, not via localStorage
Added July 18, 2026 (feedback popup fix, commit 080fa35). The feedback
popup showed 5+ times to some users, including after they had already
completed the form -- root cause was a client-side, per-browser
localStorage modulo-5 counter (Dashboard.tsx) that was never tied to
actual first-lesson status and was wiped by any cache clear, new
browser, or new device. The counter's own "suppression" after
submission was also not permanent -- it only lengthened the interval
before resurfacing.

Fixed by two SECURITY DEFINER RPCs (`supabase/migrations/
20260718120000_feedback_popup_eligibility.sql`): `should_show_
feedback_popup()` derives eligibility from DB truth (lessons count,
`feedback` row existence, `profiles.feedback_popup_dismissed`) and
stamps `profiles.first_lesson_generated_at` exactly once per user so a
later deletion of that lesson can never reopen eligibility;
`dismiss_feedback_popup()` permanently sets the dismissed flag --
a dismissal is a "no," not a "later." Both follow the Teaching Team
resolver posture (20260616170000): EXECUTE revoked from PUBLIC/anon,
granted to authenticated only, `auth.uid()` as the internal security
boundary.

Any future one-time-only or never-again UI prompt (onboarding tours,
first-action celebrations, dismissible announcements meant to stay
dismissed) must follow this same pattern -- a DB-backed flag read
through a dedicated RPC or query, never a localStorage key -- since
localStorage cannot survive a cache clear, a different browser, or a
different device, and silently reintroduces exactly this bug class.

### Rule #34: public.events is FROZEN (archival, read-only) -- do not add new writers without a dedicated session
Added July 18, 2026 (B7 adjacent finding #1, closed via retire/freeze,
commit f08899a). `public.events` (Pattern A -- a generic client-insert
analytics table, distinct from B7's `conversion_events` Pattern B
service-role/RPC table and B8's `capacity_events`) had its RLS INSERT
policy missing for `authenticated` since introduction. Every real
teacher's `trackEvent()` call from `src/hooks/useAnalytics.tsx` failed
silently; all 12,456 rows found live belonged to Lynn's own admin
account. Diagnosis also found `public.log_security_event()` (a
SECURITY DEFINER function that would have bypassed RLS) had zero live
callers anywhere in current code -- fully orphaned since the pre-March
migration reconciliation.

Decision: RETIRE (FREEZE), not repair, not drop. `useAnalytics.tsx` and
the never-imported `SecurityMonitor.tsx` were deleted (see the Deleted
Files table above); `log_security_event()` was dropped
(`supabase/migrations/20260718130000_freeze_events_drop_log_security_event.sql`);
`authenticated`'s write grants (INSERT/UPDATE/DELETE/TRUNCATE/
REFERENCES/TRIGGER) on `public.events` were revoked, leaving SELECT
only. RLS policies (`admin_full_access`, `users_select_own`) and
`service_role`/`postgres` grants are untouched -- `admin_full_access`
remains the sole write path. The 12,456 existing rows were left in
place as archival data, not dropped.

`src/components/admin/AdminSecurityPanel.tsx` (the one live reader,
rendered at `/admin` -> Security tab) was deliberately left completely
untouched -- it still reads `events` via its existing SELECT grant and
renders its honest empty state, since none of its expected
`security_role_changed`/`security_login_failed`/`security_access_denied`
event types have ever had a writer (repair would not have fixed that
category either -- `log_security_event` had no callers regardless of
RLS).

DO NOT re-grant write privileges to `authenticated` on this table, and
do NOT recreate `useAnalytics.tsx`, `SecurityMonitor.tsx`, or
`log_security_event()` as a quick fix for "the Security tab is empty."
A real fix requires a dedicated session to design actual writers for
the `security_*` category (still listed as STILL OPEN, no target
session, alongside Configuration's AI-service-status/rate-limit gauges
-- see PROJECT_MASTER.md). Lifting the freeze (a new scoped INSERT
policy + a real writer) is that session's job, not a one-line grant
restore.

### Rule #35: pricingConfig.ts is the sole pricing authority, including display -- no DB pricing tables
Added July 18, 2026 (pricing SSOT consolidation session). Two DB tables
that fed frontend pricing display, `pricing_plans` and `subscription_plans`,
are both DROPPED (`supabase/migrations/20260718140000_pricing_ssot_consolidation.sql`).
`subscription_plans` was an orphaned pre-SSOT subsystem (credits model,
`essentials_*`/`pro_*`/`premium_*` lookup keys matching no current tier)
with a live admin UI (`PricingPlansManager.tsx`, Admin -> Pricing tab)
whose "Sync from Stripe" button was a footgun -- it synced against Stripe
lookup keys that didn't match the live catalog. `pricing_plans` was the
hook (`usePricingPlans.tsx`) that fed `UpgradePromptModal.tsx` and
`PricingSection.tsx` -- a real second source of truth for display pricing,
architecturally a Rule #17 violation even though its data happened to
stay in sync until this session. All 4 artifacts are deleted (see the
Deleted Files table above). Both consumer components now import
`PRICING_PLANS` (a display-ready, pre-composed constant, not a new
independent source) directly from `pricingConfig.ts`.

The migration also dropped `allocate_monthly_credits()` (a `SECURITY
DEFINER` function with zero callers anywhere -- no cron, no `.rpc()`
call in code -- and zero rows ever produced in `credits_ledger`, since
`user_subscriptions.plan_id` was 100% NULL across all live rows) and the
now-pointless `user_subscriptions.plan_id` column + its FK. `credits_ledger`
itself was left untouched -- it is now writer-less and reader-less, a
one-line-migration cleanup for a future housekeeping session, not this
one (see PROJECT_MASTER.md backlog).

Any future pricing display need (a new tier, a new plan comparison
surface) adds to `PRICING_PLANS`/`PRICING_DISPLAY` in `pricingConfig.ts`
directly -- never a new DB table, never a new hook that queries one.

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
- src/constants/seriesExportConfig.ts
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

## MARKETING PANEL (Active Development -- May 2026)

Primary files:
- src/pages/AdminMarketing.tsx              -- page wrapper (admin gate + AppShell + internal Tabs)
- src/components/admin/BlogPreviewPanel.tsx -- shared draft list/preview/edit/publish/delete logic
- src/pages/AdminBlogPreview.tsx            -- thin wrapper that keeps the standalone /admin/blog-preview URL alive
- src/constants/sidebarConfig.ts            -- `marketing` SidebarItem inside platformAdmin section
- src/constants/routes.ts                   -- ROUTES.ADMIN_MARKETING ('/admin/marketing')

Architecture:
- Single sidebar entry routes to /admin/marketing (mirrors Admin Panel pattern).
- Four tabs inside one page: Blog Preview (active), Amp Articles, Newsletter, Email Marketing.
- Unbuilt tabs use shadcn's `disabled` prop on `<TabsTrigger>` with an explicit
  `aria-label="<name>, coming soon"`. To bring a channel online: build its panel
  component (no AppShell, no admin gate), replace the matching `<ComingSoonPanel>`
  in `AdminMarketing.tsx`, and remove `disabled` from its `<TabsTrigger>`.
- `BlogPreviewPanel` is the shared component. Both `/admin/marketing`'s first tab
  and the standalone `/admin/blog-preview` page render it. The embedded copy
  passes `showHeader={false}` so the Marketing Panel page keeps a single `<h1>`.
- Standalone `/admin/blog-preview` URL is kept alive permanently for Tertius /
  OpenClaw integration. Tertius posts drafts via the `create-blog-post` Edge
  Function and this URL is the canonical review link Tertius references.

Sidebar zone policy (admin role only):
- Upper: Build & Prepare, My Teaching Team, Ministry Oversight, Resources / Teacher Tools.
- Lower (admin-only): Platform Admin (which now contains Administrator Panel, Manage Toolbelt, Marketing).
- Bottom: Account (always last; sign out lives here).

Deploy rule: When a new channel comes online, the new panel component plus the
`AdminMarketing.tsx` update (swap `<ComingSoonPanel>` for the live component AND
remove `disabled` from the `<TabsTrigger>`) deploy together in a single commit.

---

## SUBSCRIPTION TIERS

Source of truth: src/constants/pricingConfig.ts and src/constants/trialConfig.ts

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

STATUS (2026-04-27): IMPLEMENTED -- commit b534f6a.
Trigger variants: 'devotionalLibrary' | 'seriesLibrary' | 'teachingTeam'
| 'feature_teaser' (generic fallback). Wiring landed: a lockedCopy?: string
field was added to the SidebarItem interface in sidebarConfig.ts and
populated on the three paid_only items with the copy below verbatim.
UpgradePromptModal imports SIDEBAR_ITEMS and ternary-branches the
DialogDescription body on the three sidebar-item triggers, falling
through to the existing generic copy for all other triggers. AppShell
tracks an upgradeTrigger state and threads the clicked item through
handleLockedItemClick(item: SidebarItem). Trigger names are camelCase to
match SIDEBAR_ITEMS keys exactly so the modal can do
SIDEBAR_ITEMS[trigger]?.lockedCopy with no separate translation map.

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
