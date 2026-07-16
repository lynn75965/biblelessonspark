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
   definition it was approved under has since changed." `avoidTerminology`
   hits are blocking (fail the build); `requiredTerminology` misses are
   advisory only and never fail the build -- see "requiredTerminology
   semantics" below.
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

## Checker semantics: required vs. prohibited terminology

Ruled by Lynn during Batch 1 review (2026-07-16).

`avoidTerminology` (a profile's prohibited terms) is a hard boundary --
if it appears, the lesson has said something that profile's tradition
does not say, full stop. A hit is a **blocking failure** in both
`checkFixture.mts` (`result.passed = false`) and the CI assertion suite.

`requiredTerminology` is different in kind, not just in degree. It does
not mean "this exact passage must use this exact word." It means "a
faithful teacher working in this tradition, teaching topically-relevant
material, works with this vocabulary." Romans 9 is the passage where a
Reformed Baptist lesson should reach for "unconditional election"; a
lesson on Psalm 23 has no natural occasion to. Whether a given passage +
profile combination is topically relevant enough for a specific required
term to actually appear is a judgment call, not a mechanical rule -- and
that judgment belongs to Lynn's read of the fixture, not to a string
match. Treating a missing required term as a failure would punish
fixtures for not forcing vocabulary into passages where it doesn't
belong, which is its own kind of unfaithfulness.

Consequently: `checkFixtureText()` reports missing-required terms in a
separate `advisories` array and they carry zero weight in `passed`. The
CI assertion suite prints every advisory (fixture, term) so drift is
visible, then reports `0 failed` as long as no `avoidTerminology` term
was hit -- an all-advisory run is a green build. This is intentional,
not a gap: the human review documented in "Vetting workflow" above is
the actual check on required-terminology coverage; the automated
advisory list exists to inform that review, not replace it.

The Batch 1 missing-required flags surfaced during initial generation
are resolved as non-issues under this semantic -- they were never
doctrinal problems, just topics the passage didn't reach for.

## Known checker limitation: negation context

`checkFixture.mts` does plain word-boundary substring matching -- it has
no grammar and cannot tell a term used affirmatively from the same term
used inside a denial. The concrete case found during Batch 1: a Reformed
Baptist fixture's own text reads "...not in human merit or foreseen
faith" -- correctly *rejecting* foreseen-faith election -- but the
literal phrase "foreseen faith" is present, so a checker rule treating
that phrase as prohibited would flag it as a false positive.

This is a known, accepted limitation, not a bug to chase. The fix is not
a negation-detection engine bolted onto a string matcher -- that is a
disproportionate amount of NLP machinery for a mechanical pre-check
whose entire job is to narrow what Lynn has to read closely, never to
render the final verdict. Lynn's human read is the backstop for exactly
this class of false positive, and it will remain so regardless of how
sophisticated the mechanical layer gets.

Because a `must-not-contain` hit is a *blocking* failure (unlike
`requiredTerminology`), an already-`APPROVED` fixture that legitimately
contains a denied phrase would otherwise fail the assertion suite on
every future CI run forever -- a permanent false alarm for a fixture a
human already read and confirmed. The resolution is a fixture-level
frontmatter field, `known_false_positives`, that only a human sets after
reading the actual context: a comma-separated list of terms
(`known_false_positives: "foreseen faith"`), paired with
`known_false_positives_notes` explaining why. `runAssertionSuite.mts`
excludes any violation whose term appears in that fixture's list from
the failure count and instead prints it under an `ACKNOWLEDGED` line.
This is deliberately not automatic: nothing in the checker infers
negation on its own, so a new false positive in a future fixture will
still fail loudly until a human reads it and adds it here. See
`fixtures/reformed-baptist/romans-9.md` for the live example ("foreseen
faith" inside "not in human merit or foreseen faith").

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
  most doctrinally live passages. **APPROVED 2026-07-16** (all 6; see
  MANIFEST.json).
- Batch 2: same three profiles × Ephesians 2 + Psalm 23 (6 fixtures).
  **APPROVED 2026-07-16** (all 6; see MANIFEST.json). Surfaced the Psalm
  23 control-divergence question -- see Finding #5 below.
- Batch 3+: remaining 9 profiles × 4 passages (36 fixtures), ordered
  Southern Baptist 1963/2000 (documented historical drift risk) → CBF
  (orthogonal distinctive axis) → Regular Baptist GARBC → the four
  tonal/subtle profiles last (National Baptist, Independent, Missionary,
  General Baptist) → Baptist Core Beliefs. **APPROVED 2026-07-16** (all
  36; see MANIFEST.json). GARBC's initial batch was held and regenerated
  after the profile fix in Finding #7; Baptist Core Beliefs' hebrews-6
  was held and regenerated after the pipeline fix in Finding #8.

**All 48 fixtures (12 profiles x 4 passages) generated and APPROVED as
of 2026-07-16.** B6's fixture-generation phase is complete. Two real
product bugs were caught and fixed along the way (Findings #7 and #8) --
this is the suite doing exactly what it was built to do. Remaining open
items are the standing findings below (#1-4, #6) and the provisional
Finding #5 pattern, none of which block calling this phase done.

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
5. **Psalm 23 control cell does not converge across profiles --
   possible over-injection.** Discovered during Batch 2 review,
   2026-07-16. Psalm 23 was chosen specifically as the "doctrinally
   neutral control" passage that "all profiles should converge" on (see
   Anchor passages above). In practice, the Reformed Baptist and
   Primitive Baptist Batch 2 fixtures both weave full TULIP vocabulary
   into the psalm -- irresistible grace, particular redemption,
   perseverance of the saints, unconditional election -- none of which
   the text itself calls for, and the Free Will Baptist fixture puts a
   conditional-security caveat directly in its lesson title ("The
   Shepherd Who Never Lets Go -- Unless You Walk Away") against a verse
   (23:6) that reads as unconditional on its face. Lynn's ruling on
   Batch 2 (2026-07-16): approved all three as within the range of
   emphasis rather than distortion, but logged this as a standing
   open question for the theology prompt/guardrail layer, not resolved
   here -- see "What this suite is NOT." Future batches should keep
   judging each Psalm 23 fixture individually against this same
   emphasis-vs-distortion line rather than assuming Batch 2's outcome
   generalizes; if a future profile's Psalm 23 fixture crosses further
   into distortion, that becomes the concrete case for a prompt-tuning
   session to address guardrail over-injection on low-doctrinal-density
   passages.

   **Third data point (GARBC, 2026-07-16):** `regular-baptist-garbc`'s
   Psalm 23 fixture adds a distinct pattern to the two above. It carries
   real doctrinal weight -- covenant theology, *hesed*, eternal security,
   substitutionary atonement -- so it is not the plain convergence CBF
   showed. But none of that weight sits on the TULIP/Calvinist-Arminian
   axis Finding #5 was originally tracking; it's GARBC's own affirmed
   doctrine (eternal security, the cross) surfacing in a passage that
   invites it, not off-axis injection. Approved by Lynn, 2026-07-16, as
   on-profile. Three data points now on file: Reformed/Primitive Baptist
   (TULIP-loaded, off-axis), CBF (plain, fully convergent), GARBC
   (doctrinally loaded, but on-axis for that profile, not off-axis). The
   emerging pattern -- still provisional at three points -- is that
   Psalm 23 divergence tracks how central a profile's own distinctive
   doctrine is to its identity, not a uniform tendency toward
   over-injection across all profiles alike.
6. **All 12 fixtures generated so far run longer than the documented
   8-section word target.** CLAUDE.md's 8-Section Lesson Framework
   documents a 2,100-3,090 word total target. Every fixture in Batch 1
   and Batch 2 (12 of 12) lands between 3,112 and 3,453 words --
   consistently above that range, not a one-off. Pre-existing pipeline
   behavior, not something this suite's fixtures introduced or can fix
   (this suite never touches prompts -- see "What this suite is NOT").
   Logged as a standing finding and a candidate for whichever future
   session next tunes the generation prompts.
7. **GARBC profile shipped with underspecified soteriology -- fixed
   2026-07-16.** `regular-baptist-garbc`'s `tulipStance` was `'anti'`,
   and its `avoidTerminology`/`filterContent` said nothing about the
   extent of the atonement, irresistible grace, or individual election
   -- a real doctrinal-accuracy gap, not a mechanical checker miss.
   Caught during Batch 3+ vetting: the first-generated `romans-9`
   fixture asserted "God's election is real, unconditional, and
   grounded solely in His sovereign will" as GARBC's position, which
   the Articles of Faith do not state -- no individual-election article
   exists; only Art. XVIII's national-Israel "sovereign selection."
   Lynn supplied the authoritative correction from the Articles (Total
   Depravity and divine-initiative regeneration affirmed per Art.
   VI/X; Unconditional individual Election, Limited Atonement, and
   Irresistible Grace deliberately left unstated per Art. VIII), fixed
   same session: `tulipStance` widened to a three-value union (`'anti'
   | 'pro' | 'partial'`), `filterContent` gained new Regeneration and
   Election subsections, `avoidTerminology` and `guardrails` gained
   U/L/I-assertion blocks plus a symmetric guard protecting the
   correctly-affirmed Total Depravity from overcorrection.
   `generate-lesson` and `generate-devotional` (the two consumers of
   the shared guardrail-generation function) were redeployed same
   session; the 4 held GARBC fixtures were deleted and regenerated
   against the corrected, live profile -- the regenerated `romans-9`
   now explicitly states the corporate/national election reading "is
   critical for GARBC interpretation." This is the suite doing exactly
   its intended job: catching a real doctrinal-accuracy bug before any
   GARBC church ever saw it, entirely from Lynn's read of a held
   fixture, not from the mechanical checker (which reported 0
   violations against the old profile, because the old
   `avoidTerminology` list had nothing in it to flag).
8. **`generate-lesson`'s word-budget prompt was wrong for two-phase
   generation -- caught and fixed 2026-07-16.** Also caught by golden-
   suite vetting: `baptist-core-beliefs/hebrews-6`'s Section 5 (Main
   Teaching Content) came back at 329 words against a 630-840 target and
   a ~900-965 word norm across every other fixture -- just the raw Bible
   text with no teacher commentary. Root cause: `buildCompressionRules()`
   (`generate-lesson/index.ts`) always computed its word-budget
   instructions from the full 8-section total (2,100-3,090 words, hard
   cap ~3,200), even when called for Phase 1 (sections 1-5 only, correct
   target 1,500-2,140) or Phase 2 (sections 6-8 only, correct target
   ~600-950) of a two-phase generation. The model was told in the same
   prompt "EXACTLY 5 SECTIONS... generate all 5" right next to "Total
   lesson target: 2,100-3,090 words" -- a self-contradictory budget
   signal on every two-phase (full 8-section, paid-tier) generation, not
   just this one fixture. Fixed same session: `buildCompressionRules()`
   now derives its word budget from the actual sections passed to it
   (`phase1Sections`/`phase2Sections`), defaulting to the full list only
   when none are passed. Deployed to `generate-lesson` (v182) after
   Lynn's line-by-line approval of the diagnosis and fix. Verified by
   regenerating `baptist-core-beliefs/hebrews-6`: Section 5 came back at
   980 words of genuine teaching content, Phase 1 total 2,116 words --
   both within the corrected targets. This bug affected live production
   generation for every full 8-section lesson, not just this suite's
   fixtures -- the golden suite caught a real product defect, which is
   exactly the case B6 was built to make for itself.

## File map

| File | Purpose |
|---|---|
| `scripts/anchorPassages.mts` | The 4 passages, shared by generation + docs |
| `scripts/deriveAssertions.mts` | Profile -> assertion rules, derived live from theologyProfiles.ts |
| `scripts/checkFixture.mts` | Pure checker: profile + lesson text -> passed (avoidTerminology only) + violations + advisories (requiredTerminology) |
| `scripts/computePipelineHash.mts` | Hashes every theology-relevant pipeline input file |
| `scripts/generateFixture.mts` | Calls the deployed function, captures + cleans up |
| `scripts/runAssertionSuite.mts` | CI tier (a) entrypoint; also applies each fixture's `known_false_positives` frontmatter field |
| `scripts/checkStaleness.mts` | CI tier (a.5) entrypoint |
| `MANIFEST.json` | Convenience index of fixture vet status |
| `fixtures/<profileId>/<passageSlug>.md` | The fixtures themselves (populated as generated) |

All scripts are `.mts`, run directly via `node` (Node 24+, relies on
native TypeScript type-stripping -- verified locally against v24.13.1, no
build step, no `tsx`/`ts-node` dependency added). None of them need
`npm ci` to run except `generateFixture.mts` (needs `@supabase/supabase-js`,
already a project dependency).
