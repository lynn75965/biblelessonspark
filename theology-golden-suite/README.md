# B6 Theology Golden Suite

Protects the core product promise: every theology profile keeps producing
doctrinally faithful lessons even as prompts, guardrails, models, or
fallback behavior change. Approved design 2026-07-15 (see PROJECT_MASTER.md
for the full session log). Final doctrinal judgment always belongs to Lynn
(PhD, 55 years Baptist ministry) -- nothing in this suite auto-approves or
auto-rejects doctrinal content. It captures Lynn-vetted reference lessons,
automates what can be mechanically checked (prohibited/required
terminology), and makes regressions loud when the generation pipeline
changes.

## What this suite is NOT

It does not modify `theologyProfiles.ts`, `outputGuardrails.ts`,
`customizationDirectives.ts`, or any generate-lesson prompt. If vetting
surfaces a real weakness in a profile's terminology lists or guardrail
text, that gets logged as a numbered B6 finding for its own follow-up
session -- never fixed inline here.

## Anchor passages (`scripts/anchorPassages.mts`)

- **Romans 9:1-24** -- election / sovereignty stress test
- **Hebrews 6:1-12** -- perseverance / apostasy stress test
- **Ephesians 2:1-10** -- grace / faith / works stress test
- **Psalm 23:1-6** -- doctrinally neutral control; all 12 profiles should
  converge here. (John 3:16 was considered and rejected as the control --
  "whosoever believes" sits on the same disputed Calvinist/Arminian axis
  as the three stress-test passages, not off it.)

## Three tiers of checking

1. **Assertion-only** (`scripts/runAssertionSuite.mts`) -- zero API cost,
   runs on every CI push. Re-checks every `APPROVED` fixture against the
   assertion rules *derived live* from `src/constants/theologyProfiles.ts`
   (never a duplicated list -- if that file changes, the rules change with
   it). Catches SSOT drift: "this fixture was approved, but the profile
   definition it was approved under has since changed."
2. **Staleness check** (`scripts/checkStaleness.mts`) -- zero API cost,
   runs on every CI push. Hashes every file that can affect a generated
   lesson's theology content (`scripts/computePipelineHash.mts`'s
   `PIPELINE_INPUT_FILES` list) and flags which fixtures were captured
   under an older pipeline state. Purely informational -- never fails CI,
   never triggers anything by itself.
3. **Regeneration** (`scripts/generateFixture.mts`) -- real API cost
   (~$0.05-0.15 per fixture), **always run locally/interactively, never in
   CI.** There is no GitHub Actions workflow for this tier and there
   should never be one: it requires an admin-authenticated call to the
   live `generate-lesson` function, and per Lynn's explicit directive no
   admin credential is ever scripted, stored, or made available to CI.

## Running a generation batch

Calls the **deployed** `generate-lesson` function exactly the way the
frontend does (same URL, same SSE contract) -- never a local
reimplementation of the prompt, which would test a copy of the product
instead of the product itself.

```
cd theology-golden-suite/scripts
SUPABASE_ADMIN_TOKEN=<short-lived admin access_token> node generateFixture.mts <profileId> <passageSlug>
```

or pass `--token=<jwt>` instead of the env var. The token is Lynn's own
admin session `access_token`, extracted from browser Local Storage the
same way the July 15 rejection-probe testing did it -- **never a scripted
login, never stored anywhere, supplied fresh for each run.**

Passage slugs: `romans-9`, `hebrews-6`, `ephesians-2`, `psalm-23`.

Each run:
1. Streams the real SSE response (parses `token`/`done`/`supplements`/
   `supplements_failed`/`error` events, mirroring
   `src/hooks/useEnhanceLesson.tsx` exactly).
2. Looks up which model actually generated Phase 1 (sections 1-5) via
   `generation_metrics.anthropic_model` -- **see Finding #4 below**: Phase
   2's model (sections 6-8 + teaser) is not observable from outside the
   function today, and the fixture frontmatter says so explicitly rather
   than guessing.
3. Writes `fixtures/<profileId>/<passageSlug>.md` (frontmatter + the raw
   lesson text, exactly as a teacher would read it).
4. Deletes the `lessons` and `generation_metrics` rows the run created --
   the fixture file is the permanent record; the DB row was only ever
   scratch space. Lynn's real LessonLibrary never sees these.

## Vetting workflow

Fixtures are plain Markdown -- read them like any generated lesson, no
JSON. Tell Claude your verdict per fixture (APPROVED / REJECTED) in
conversation; the fixture's frontmatter `vet_status` and
`reviewer_notes` get updated accordingly, same as every other decision
this session. On REJECTED, default assumption is "regenerate" (the model
is nondeterministic) unless the rejection reason points to a systemic gap
in the profile's terminology lists or guardrail text -- that gets logged
as a new numbered finding instead, and the fixture stays pending until
the follow-up lands.

**Review order** (front-loaded, per Lynn's own priority):
- Batch 1: Reformed Baptist + Primitive Baptist + Free Will Baptist ×
  Romans 9 + Hebrews 6 (6 fixtures) -- sharpest doctrinal markers ×
  most doctrinally live passages.
- Batch 2: same three profiles × Ephesians 2 + Psalm 23 (6 fixtures).
- Batch 3+: remaining 9 profiles × 4 passages (36 fixtures), ordered
  Southern Baptist 1963/2000 (documented historical drift risk) → CBF
  (orthogonal distinctive axis) → Regular Baptist GARBC → the four
  tonal/subtle profiles last (National Baptist, Independent, Missionary,
  General Baptist) → Baptist Core Beliefs.

## Logged findings (not fixed this session -- follow-up candidates)

1. **CLAUDE.md Architecture Principle #3 is inaccurate.** It claims
   prohibited theology terminology is "logged but never shown to users."
   Verified during Phase 1 diagnosis: no code anywhere checks generated
   lesson text against `avoidTerminology`/`requiredTerminology`. The
   `guardrail_violations` table that IS actively logged belongs entirely
   to the separate, unrelated `outputGuardrails.ts` truth/integrity
   system (fabricated events/quotes/statistics) -- it stores
   `theology_profile_id` as descriptive metadata only. Theology-term
   compliance today rests solely on the AI following a prompt
   instruction, with zero verification. Correcting the CLAUDE.md wording,
   and evaluating a production runtime assertion (reusing
   `checkFixture.mts`'s logic post-generation, writing violations to a
   table the way outputGuardrails.ts already does) are follow-up
   candidates once this suite has proven the assertion layer out.
2. **Fallback-path doctrine verification is unaddressed.** B4's fallback
   model (`claude-sonnet-4-5-20250929`) is a genuinely different model
   generation from the primary (`claude-sonnet-4-6`); its instruction-
   following on nuanced theological phrasing is not guaranteed identical.
   At least one deliberately-forced-fallback generation per high-
   assertion profile (Reformed, Primitive, Free Will, the two SBC
   profiles, CBF, GARBC) should eventually be vetted. Needs a safe way to
   force the fallback path for a single test call; not built this
   session.
3. **Prompt-assembly extraction.** The three-block prompt assembly
   (static / theology / dynamic) lives inline in
   `generate-lesson/index.ts`, not in an importable shared function.
   Extracting it would let this suite call the *exact* assembly function
   production uses even for a hypothetical future local-harness mode,
   and would be a small, low-risk refactor (no prompt wording change) --
   but it's still a production edge-function change, so it's logged as a
   future enabler, not done here.
4. **Phase 2's model-used is not observable.** For two-phase (full
   8-section) lessons, `generate-lesson`'s Phase 2 call
   (`callAnthropicNonStreaming` for sections 6-8 + teaser) has its own
   independent B4 retry/fallback, but `phase2Result.modelUsed` is never
   written to `generation_metrics` or included in the `supplements` SSE
   event -- discovered while building `generateFixture.mts`. Right now
   there is no way, even for this harness, to know whether Phase 2 fell
   back. A small addition to `generate-lesson/index.ts` (persist
   `phase2Result.modelUsed` the same way Phase 1's is persisted) would
   close this; out of scope this session per the scope fence.

## File map

| File | Purpose |
|---|---|
| `scripts/anchorPassages.mts` | The 4 passages, shared by generation + docs |
| `scripts/deriveAssertions.mts` | Profile -> assertion rules, derived live from theologyProfiles.ts |
| `scripts/checkFixture.mts` | Pure checker: profile + lesson text -> pass/fail + violations |
| `scripts/computePipelineHash.mts` | Hashes every theology-relevant pipeline input file |
| `scripts/generateFixture.mts` | Calls the deployed function, captures + cleans up |
| `scripts/runAssertionSuite.mts` | CI tier (a) entrypoint |
| `scripts/checkStaleness.mts` | CI tier (a.5) entrypoint |
| `MANIFEST.json` | Convenience index of fixture vet status |
| `fixtures/<profileId>/<passageSlug>.md` | The fixtures themselves (populated as generated) |

All scripts are `.mts`, run directly via `node` (Node 24+, relies on
native TypeScript type-stripping -- verified locally against v24.13.1, no
build step, no `tsx`/`ts-node` dependency added). None of them need
`npm ci` to run except `generateFixture.mts` (needs `@supabase/supabase-js`,
already a project dependency).
