# PROJECT MASTER -- Last updated: May 8, 2026

## WHAT'S NEXT

---

### May 8, 2026 -- FEATURE: Public Lesson Shapes Guide page at /lesson-shapes

#### Summary

New public page rendering all five lesson shapes (Passage Walk-Through,
Life Connection, Gospel-Centered, Focus-Discover-Respond, Story-Driven)
in a tabbed comparison view. Each shape card has a numbered circle
header, a four-column metadata grid (Teaching Movement, Best For,
Teacher Posture, Primary Skill), a description paragraph, and a
side-by-side "Shaped Lesson / Base Lesson (Before)" demonstration
using Luke 10:25-37 as the consistent transformation passage so
teachers can compare formats directly. One commit: `bfd91ca`.

#### bfd91ca -- FEATURE: Add public Lesson Shapes Guide page at /lesson-shapes

Four files changed (491 insertions, 0 deletions):

- `src/pages/LessonShapesGuide.tsx` (new, 470 lines) -- five-card
  layout following an identical template per shape, varied only by
  shape color, content, and "Back To Top" anchor (omitted from Shape 1
  since it is already at top). Shape colors after the post-localhost
  sweep: Shape 1 = primary, Shape 2 = secondary, Shape 3 = destructive,
  Shape 4 = primary, Shape 5 = accent. State uses
  `useState<Record<ShapeKey, TabState>>` keyed 1-5; `toggleTab` is the
  only mutator. Hero h1 reads "Five Ways to Shape a Lesson" in BLS
  forest green. `<nav aria-label="Lesson Shapes Navigation">` at top
  with five jump links. All non-ASCII glyphs (em-dash, en-dash,
  right-arrow) encoded as numeric HTML entities so the deploy guard
  never fired.
- `src/constants/routes.ts` -- added
  `LESSON_SHAPES_GUIDE: '/lesson-shapes'` immediately above the Legal
  routes block.
- `src/App.tsx` -- added `import LessonShapesGuide from "./pages/LessonShapesGuide"`
  and a public (non-`ProtectedRoute`) `<Route>` adjacent to the Help
  route.
- `supabase/functions/_shared/routes.ts` -- auto-synced via
  `npm run sync-constants` per Rule #23.

#### Cosmetic-fix flow (post-localhost review)

Lynn opened localhost and reported four issues (white-on-white
circles, hero color, etc.). Diagnostic surfaced the real cause: every
`bg-primary-dark`, `text-primary-dark`, `bg-secondary-dark`,
`text-secondary-dark`, `border-secondary-dark` class I had used was
unrecognized by the project's Tailwind theme. `tailwind.config.ts`
defines `primary` and `secondary` with only `DEFAULT/foreground/hover/light`
-- there is no `dark` variant. Tailwind silently emits no CSS for
unknown utilities, so headings, number circles, tabs, and
bordered-block accents on shapes 1, 2, and 4 were rendering with no
shape color at all.

Resolution applied in-place via Edit replace_all (not a regenerated
file): `primary-dark` -> `primary` (9 sites), `secondary-dark` ->
`secondary` (9 sites). h1 renamed from "Lesson Shapes" to "Five Ways
to Shape a Lesson". Five back-to-top chevron+text anchors added
(Shape 1 omitted as redundant). CSS bundle grew 165.96 kB -> 166.10 kB
confirming the now-valid utilities are emitting CSS.

Acknowledged collision: Shape 1 and Shape 4 now both render in
`primary` (forest green). Lynn approved as-is. Available follow-up if
visual distinction becomes important: swap Shape 4 to `burgundy`,
`warning`, or `success` (all defined in `tailwind.config.ts`).

#### Build verification

`npm run build` clean across all four iterations:
- Initial generation: 3917 modules, 22.43s.
- After cosmetic sweep: 3917 modules, 20.59s.
- After "Back To Top" label add: 3917 modules, 22.00s.
- After Shape 1 anchor removal: 3917 modules, 19.88s.

Module count up exactly 1 from the prior 3916 baseline -- the new
page. Zero TypeScript errors throughout. Only the pre-existing
chunk-size warnings.

#### Workflow

- Diagnostic-first reads of `lessonShapeProfiles.ts`, `routes.ts`,
  `App.tsx`, `tailwind.config.ts`, and the live `LessonShapesGuide.tsx`
  before any cosmetic edit. Pushed back twice on instructions that
  did not match file state (per Rule #14).
- Initial file generation via Node `.cjs` script per CLAUDE.md
  (write-lesson-shapes.cjs at repo root). Script self-checked every
  output byte <= 127 before exit. ASCII guard never fired.
- `routes.ts` and `App.tsx` updated via PowerShell
  `[System.IO.File]::WriteAllText` with
  `[System.Text.UTF8Encoding]::new($false)` per Lynn's spec for
  these two files.
- `npm run sync-constants` after `routes.ts` edit per Rule #23.
- `git add` -- explicit four-file list, NOT `git add .` -- bypassing
  `deploy.ps1` since its line 32 stages everything and the one-shot
  generator script should not enter the repo. `git push origin main`
  used directly.
- HELD twice before deploy: (1) before the cosmetic sweep, awaiting
  Lynn's choice on h1 text and sweep approval; (2) after final
  cosmetic pass, awaiting Lynn's localhost approval. Deploy authorized
  on second hold.
- `write-lesson-shapes.cjs` deleted post-deploy at Lynn's request.

#### Out of scope

No backend changes. No edge function changes. No SSOT constants
modified beyond the new route. No theology profile, age group,
pricing, or accessibility-elsewhere changes. The 18-instance
`*-primary-dark` / `*-secondary-dark` misuse was contained entirely
within the new `LessonShapesGuide.tsx`; no other file in `src/` uses
those class fragments (verified via grep).

#### Carry-forwards

1. **Pending feature**: Lynn asked for access to the Shape Guide from
   the Lesson Library "View" modal alongside the existing Copy /
   Download / Email / Publish / Reshape actions, "to better inform the
   user." Scoping next: locate where the Reshape button is rendered
   alongside the export buttons and propose placement options for a
   "Learn about shapes" link/button that opens `/lesson-shapes` (likely
   in a new tab, given the modal context).
2. **Optional**: differentiate Shape 4's color from Shape 1 (both
   currently render in `primary`). Lynn accepted as-is for now.

---

### May 5, 2026 (Session 4) -- Wire Tailwind Typography + render blog HTML content

#### Summary

Two tightly-coupled changes shipped in one commit. The Tailwind Typography
plugin was already in `devDependencies` (^0.5.16) but had never been wired
into `tailwind.config.ts`, so `prose` classes generated nothing. BlogPost
detail pages were rendering Supabase `content` as plain text via
`whitespace-pre-wrap` -- meaning HTML stored in the column would have
appeared as escaped markup. Both halves of the gap closed together so
formatted blog content now renders as intended.

#### c762e80 -- FEATURE: Wire Tailwind Typography, render blog HTML content

Two files changed (7 insertions, 5 deletions):

- `tailwind.config.ts` -- added `import typography from "@tailwindcss/typography";`
  alongside the existing `tailwindcssAnimate` import. Added `typography`
  to the `plugins` array (now `[tailwindcssAnimate, typography]`).
  Also fixed four pre-existing U+2192 arrow glyphs in the file's doc
  comment (line 11 "Color flow") to ASCII `->`. The arrows had been
  there since before this session but the ASCII guard fires on any
  non-ASCII byte in any file in the staged set, not just diffs --
  modifying the file forced the cleanup.
- `src/pages/BlogPost.tsx` -- replaced the body content block. Was:
  `<div className="whitespace-pre-wrap text-lg leading-8 text-slate-800">{post.content}</div>`.
  Now: `<div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />`.
  No other changes -- routing, slug lookup, 404 branch, focus
  management on heading via `tabIndex={-1}` + `useRef`, `aria-live`
  loading region, `role="alert"` error region, back link, and
  published-date `time` element are all unchanged.

#### Pre-task diagnostic

Before starting, verified the gap:
- `package.json` line 88 -- `@tailwindcss/typography: ^0.5.16` in
  `devDependencies` (not `dependencies`).
- `tailwind.config.ts` line 155 (pre-edit) -- `plugins: [tailwindcssAnimate]`,
  no typography import or reference. Confirmed `prose` classes would not
  generate.

#### Build verification

`npm run build` clean (3916 modules, 19.57s). CSS bundle size jumped
from 138.52 kB to 165.42 kB (+26.9 kB) -- direct evidence that the
typography plugin is now generating `prose-*` utilities into the
output stylesheet. No new TypeScript errors. Only the pre-existing
chunk-size warnings.

#### XSS posture

`dangerouslySetInnerHTML` on `post.content` is acceptable because the
`blog_posts` table RLS policy (migration `20260505180000_create_blog_posts.sql`)
restricts writes to `service_role` -- public users have SELECT-only access
to rows where `published = true`. Content is admin-authored and trusted.
If the write path ever expands to non-admin authors, content will need
to be sanitized (e.g. via `dompurify`) before this prop is set.

#### Workflow

- Diagnostic-first read of `package.json`, `tailwind.config.ts`, and
  `src/pages/BlogPost.tsx` before any edits.
- `npm run build` -- clean.
- ASCII verification on both files before commit.
- First commit attempt blocked by ASCII guard on the pre-existing arrows
  in `tailwind.config.ts` (4 x U+2192). Fixed in the same edit, re-committed
  successfully.
- `git add` -- explicit file list (NOT `git add .`), no deploy.ps1
  invocation.
- HELD before push -- awaiting Lynn's localhost verification on the
  detail page before deploy is authorized.

#### Out of scope

No backend changes. No edge function changes. No SSOT constants modified.
No accessibility-affecting changes to the page chrome (heading focus,
loading region, error region, back link all untouched). No other route
or component changed.

#### Carry-forwards

1. Lynn to verify on localhost: navigate to a published `/blog/:slug`
   post and confirm prose styling renders (headings, paragraphs, lists)
   with the typography plugin's defaults.
2. If/when blog authoring expands beyond admin-only, add content
   sanitization in `BlogPost.tsx` before the `dangerouslySetInnerHTML`
   prop -- per the XSS posture note above.

---

### May 5, 2026 (Session 3) -- Cleanup: untrack cli-latest + Rules 23-24 sync-constants policy

#### Summary

Three Session 2 carry-forwards closed in two commits, plus a follow-up
sweep that untracked the remaining 7 `supabase/.temp/` CLI cache files
that had been silently tracked alongside `cli-latest`. No code behavior
changed. CLAUDE.md gained two new rules documenting the sync-constants
workflow and the hand-maintained `_shared/` set.

#### ffdf3ed -- DOCS: Rules 23-24 sync-constants policy, remove tracked temp file

Two files changed (22 insertions, 1 deletion):

- `supabase/.temp/cli-latest` -- removed from git index via
  `git rm --cached`. File still exists on disk (CLI continues to write it)
  but is no longer tracked. `.gitignore` line 44 (`supabase/.temp/`) already
  covers it -- no .gitignore edit required. Closes Session 2 carry-forward #1.
- `CLAUDE.md` -- added Rule #23 and Rule #24 immediately after Rule #22,
  before the `---` divider that precedes `## DEBUGGING PROTOCOL`.
  Closes Session 2 carry-forwards #2 and #3.

#### Rule #23 -- npm run sync-constants policy

Documents the 14 files that auto-sync from `src/constants/` to
`supabase/functions/_shared/` via `scripts/sync-constants.cjs`:
ageGroups, bibleVersions, generationMetrics, lessonStructure, lessonTiers,
systemSettings, teacherPreferences, theologyProfiles, routes, contracts,
rateLimitConfig, freshnessOptions, devotionalConfig, toolbeltConfig.
Verified against the actual `FILES_TO_SYNC` array in sync-constants.cjs
lines 30-45 -- list matches exactly. Rule directs CC to run
`npm run sync-constants` immediately after editing any of these and to
never hand-edit the `_shared/` mirrors (they are overwritten on next sync).

#### Rule #24 -- intentionally hand-maintained _shared/ files

Documents the 16 `_shared/` files that are NOT in FILES_TO_SYNC and have
no clean frontend SSOT counterpart: pricingConfig, trialConfig, validation,
lessonShapeProfiles, seriesConfig, branding, uiSymbols, organizationConfig,
betaEnrollmentConfig, emailDeliveryConfig, outputGuardrails,
customizationDirectives, corsConfig, orgPoolCheck, subscriptionCheck,
rateLimit. When a frontend SSOT change touches one of these, the
corresponding `_shared/` mirror must be updated by hand in the same commit.
Rule explicitly forbids adding any of these to FILES_TO_SYNC.

#### c9864df -- CLEANUP: Untrack remaining supabase/.temp/ CLI cache files

Follow-up sweep after the Session 2 carry-forward review surfaced that
`cli-latest` was not the only stale-tracked file under `supabase/.temp/`.
Seven additional CLI cache files were also tracked despite being covered
by `.gitignore`: `gotrue-version`, `linked-project.json`, `pooler-url`,
`postgres-version`, `project-ref`, `rest-version`, `storage-version`.
Removed from index via `git rm --cached` -- 7 files, 7 deletions, no
working-tree changes (files remain on disk; supabase CLI continues to
write them). After this commit `git ls-files supabase/.temp/` returns
empty -- the directory is fully ignored.

#### Workflow

- `npm run build` -- clean (3916 modules, 21.7s). Only pre-existing
  chunk-size warnings.
- ASCII verification on edited CLAUDE.md -- 0 non-ASCII bytes.
- `git add CLAUDE.md` (cli-latest was already staged from `git rm --cached`)
  -- explicit file list, no `git add .`, no deploy.ps1 invocation.
- `git commit` -- ASCII guard passed on each commit.
- `git push origin main` -- direct push (Netlify auto-deploys from main).

#### Out of scope

No source code changes. No SSOT constants modified. No edge functions
touched. No Stripe / pricing / accessibility / copy changes.

#### Carry-forwards

None. All three Session 2 cleanup items resolved, plus the broader
`.temp/` sweep closed in the same session.

---

### May 5, 2026 (Session 2) -- Blog system (full stack: SSOT + migration + pages)

#### Summary

Complete public blog system shipped end to end. SSOT-first build:
`src/constants/blogConfig.ts` owns table name, status values, and all UI
copy; `src/constants/routes.ts` owns the path literals and `blogConfig`
derives its routes from it. New `blog_posts` table created via
migration with RLS allowing public read of published rows only.
Two new public pages render index and detail. One commit (`8934030`),
preceded by a drift-fix sync at the start of the session.

#### Pre-work -- backend mirror drift fix (no commit)

`npm run sync-constants` rewrote 14 backend `_shared/` files. Two real
diffs surfaced and were corrected: `routes.ts` had been missing
`CHURCH_PLANT_REPORT` and `WHY_CHURCHES_CAN_TRUST`; `contracts.ts` had
a 2-line frontend-vs-backend drift. The sync was the first time it had
run since at least the church-plant-report ship. These drifts were
shipped together with the blog commit since both backend mirrors are
auto-generated and the sync tool always touches all 14 files.

CLAUDE.md does not currently document the `npm run sync-constants`
command nor the `supabase/functions/_shared/` mirror policy.
Carry-forward: add a short SSOT-Sync section to CLAUDE.md so future
sessions run sync-constants before any ship that touches the
`FILES_TO_SYNC` set (`ageGroups`, `bibleVersions`, `generationMetrics`,
`lessonStructure`, `lessonTiers`, `systemSettings`, `teacherPreferences`,
`theologyProfiles`, `routes`, `contracts`, `rateLimitConfig`,
`freshnessOptions`, `devotionalConfig`, `toolbeltConfig`).

#### 8934030 -- FEATURE: blog system

`FEATURE: Blog system -- blog_posts table, Blog and BlogPost pages, SSOT blogConfig`

9 files (298 insertions, 1 deletion):

- `src/constants/blogConfig.ts` -- new SSOT. Exports `BLOG_CONFIG` with
  `table='blog_posts'`, `status.published='published'`,
  `status.draft='draft'`, `routes.index=ROUTES.BLOG`,
  `routes.post=ROUTES.BLOG_POST`, and UI copy
  (`title='Blog'`, `emptyState='No posts available.'`,
  `backLabel='Back to Blog'`). Also exports `BlogStatus` type and
  `BlogPost` row interface.
- `src/constants/routes.ts` -- added `BLOG: '/blog'` and
  `BLOG_POST: '/blog/:slug'` to the public block.
- `src/App.tsx` -- imported `Blog` and `BlogPost`; registered both as
  bare `<Route>` elements (no `ProtectedRoute`), placed alongside the
  other public marketing routes (Rule #3 satisfied).
- `src/pages/Blog.tsx` -- index page. Queries
  `BLOG_CONFIG.table` filtered by `published=true`, ordered
  `published_at desc`. Uses only `BLOG_CONFIG.ui.*` and
  `BLOG_CONFIG.routes.post` for path interpolation. Accessible:
  visible h1, h2 per post, `aria-live="polite"` loading region,
  `role="alert"` error state, `time` element with `dateTime` for
  published date.
- `src/pages/BlogPost.tsx` -- detail page. Looks up by `:slug` URL
  param, requires `published=true`. On load, programmatic focus
  moves to the post heading via `tabIndex={-1}` + `useRef`. 404
  branch renders "Post not found" headline (also focused on load).
  Back link points to `BLOG_CONFIG.routes.index`.
- `supabase/migrations/20260505180000_create_blog_posts.sql` -- creates
  `blog_posts` (id uuid, title, slug unique, excerpt, content, published
  bool default false, published_at timestamptz, created_at timestamptz),
  enables RLS, adds two policies: public-anonymous SELECT where
  `published=true` (roles: `anon, authenticated`), and
  `service_role for all` for admin content management.
- `supabase/functions/_shared/routes.ts` -- auto-synced.
- `supabase/functions/_shared/contracts.ts` -- auto-synced (drift fix).
- `CLAUDE.md` -- SSOT File Map gained the row
  `| Blog Config | src/constants/blogConfig.ts |`.

#### Migration verification

`npx supabase migration list --linked` showed `20260505180000` as
local-only (Remote column empty) before push -- confirming new file,
not a re-run. `npx supabase db push --linked` reported
`Applying migration 20260505180000_create_blog_posts.sql ... Finished`
and the post-push list showed the same timestamp now mirrored in both
columns. Live database verified.

#### SSOT discipline check (Step 7 verification)

- `'blog_posts'` literal appears only in `blogConfig.ts` and the
  migration SQL. Both pages reference `BLOG_CONFIG.table`.
- UI strings (`'Blog'`, `'No posts available.'`, `'Back to Blog'`)
  appear only in `blogConfig.ts`. Both pages reference
  `BLOG_CONFIG.ui.*`.
- Route literals (`'/blog'`, `'/blog/:slug'`) appear only in
  `routes.ts`. `blogConfig.ts` derives via `ROUTES.BLOG` and
  `ROUTES.BLOG_POST`; `App.tsx` references `ROUTES.*` directly;
  `Blog.tsx` builds detail URLs via
  `BLOG_CONFIG.routes.post.replace(':slug', slug)`.

#### Workflow

- `npm run build` -- clean (3916 modules, 19.7s). Only pre-existing
  chunk-size warnings.
- `npm run sync-constants` -- run twice: once at session start to fix
  drift, once after `routes.ts` edit to push BLOG/BLOG_POST.
- `npm run dev` -- Lynn verified empty-state list and 404 branch on
  localhost:8081 before approving deploy.
- `git add` -- explicit file list (NOT `git add .`) to keep
  `supabase/.temp/cli-latest` out of the commit. ASCII guard passed.
- `git push origin main` -- direct push, bypassing `deploy.ps1` so the
  scoped staging persisted. Same outcome as deploy.ps1 (Netlify watches
  `main`).

#### Carry-forwards

1. `supabase/.temp/cli-latest` is gitignored (line 44 of `.gitignore`)
   but is currently TRACKED in git, so every supabase CLI invocation
   leaves it as a modified working-tree file. Untrack it via
   `git rm --cached supabase/.temp/cli-latest supabase/.temp/linked-project.json`
   in a future cleanup commit.
2. CLAUDE.md does not document `npm run sync-constants` or the
   `supabase/functions/_shared/` mirror policy. Add a short section so
   the sync step is not skipped on future SSOT-touching sessions.
3. Several `_shared/` files are NOT in `FILES_TO_SYNC` despite having
   frontend SSOTs (`pricingConfig.ts`, `trialConfig.ts`,
   `validation.ts`, `lessonShapeProfiles.ts`, `seriesConfig.ts`,
   `branding.ts`, `uiSymbols.ts`, `organizationConfig.ts`,
   `betaEnrollmentConfig.ts`, `emailDeliveryConfig.ts`,
   `outputGuardrails.ts`, `customizationDirectives.ts`). They are
   hand-maintained mirrors. Decision needed: extend `FILES_TO_SYNC`,
   or document the hand-maintained set explicitly.

#### Out of scope

No edge function changes. No Stripe / pricing changes. No org-management
changes. No accessibility or copy changes outside the new blog pages.

---

### May 5, 2026 -- Public trust page (Why Churches Can Trust BibleLessonSpark)

#### Summary

New public-facing trust page added at `/why-churches-can-trust-biblelessonspark`,
intended for sharing with church leaders evaluating BLS. One feature commit, one
docs commit. Localhost verified before deploy.

#### 1c5e088 -- FEATURE: trust page + route wiring

`FEATURE: Add public Why Churches Can Trust BibleLessonSpark trust page (route + App.tsx wiring)`

Three files (3 files changed, 228 insertions):

- `src/pages/WhyChurchesCanTrustBibleLessonSpark.tsx` -- new page. Hero,
  ten thematic sections (Built for Faithful Bible Teaching, Aligned with
  Doctrinal Convictions, Real Teachers, Age Groups, More Than an Outline,
  Tool Serves the Church, Generic AI Drift, Small Churches/Plants,
  Disciplers, Trustworthy + Simple), and a closing summary box. Imports
  `ReactNode` only -- no AppShell, no auth, no BRANDING. Lightweight
  marketing page consistent with public-route pattern.
- `src/constants/routes.ts` -- added `WHY_CHURCHES_CAN_TRUST` to the
  public-routes block of `ROUTES`.
- `src/App.tsx` -- imported the new page, added `<Route>` element above
  the catch-all, using `ROUTES.WHY_CHURCHES_CAN_TRUST` (Rule #3 satisfied
  -- both files updated together).

#### Non-ASCII handling

Source content as supplied contained typographic apostrophes (U+2019)
and curly double quotes (U+201C / U+201D) that would have tripped the
ASCII guard. Resolved by encoding all 23 occurrences as JS escape
sequences inside JSX expression containers: `{'’'}`, `{'“'}`,
`{'”'}`. Source file is now zero non-ASCII bytes; browser still
renders proper curly typography. Rule #16 satisfied.

#### Workflow

- `npm run build` -- clean (29s, only pre-existing chunk-size warnings).
- `npm run dev` -- Lynn verified localhost:8080 before approving deploy.
- `.\deploy.ps1` -- ASCII guard passed, pushed `3aa7318..1c5e088`.

#### Carry-forwards

None. Page is self-contained; no SSOT files affected; no backend changes.

---

### May 2, 2026 (Session 5) -- Carry-forward sweep (gitignore, CLAUDE.md, FK audit)

#### Summary

Three carry-forwards from Sessions 3 and 4 closed in two commits. One
edge function redeployed via Supabase CLI; no deploy.ps1 invocation.
Final state: zero open carry-forwards from this stretch of sessions.

#### bc23bdf -- .gitignore + CLAUDE.md path fixes

`CLEANUP: Add supabase/.temp to .gitignore; fix stale seriesExportConfig path in CLAUDE.md`

Two unrelated cleanup items in a single commit (2 files, +4/-2):

- `.gitignore` -- appended `supabase/.temp/` so the two persistent
  CLI cache files (`cli-latest`, `linked-project.json`) stop showing
  up as untracked after every `supabase` CLI invocation. Carry-forward
  from Sessions 2 and 4 closed.
- `CLAUDE.md` lines 122 and 309 -- corrected the stale
  `src/config/seriesExportConfig.ts` path to
  `src/constants/seriesExportConfig.ts`. Line 219 was flagged in the
  task spec but on inspection contained only the bare filename
  (no path prefix) so it was left alone. Carry-forward from
  Sessions 3 and 4 closed.

#### b45bd96 -- approve-org-deletion FK audit and invites cleanup

`FIX: approve-org-deletion -- add invites cleanup before org record deletion (NO ACTION FK)`

Closes the Session 3 carry-forward on org-deletion FK orphan risk.

SQL audit of every foreign key referencing `organizations(id)` showed
that the `invites` table has a `NO ACTION` delete rule -- meaning a
pending invite would block the final `DELETE FROM organizations`
statement and abort the closure flow midway after member emails had
already been sent. All other FKs to `organizations` either `CASCADE`
or `SET NULL`, so no other tables required attention.

Fix is one line: `'invites'` was inserted as the first entry of the
`orgTables` cleanup array in
`supabase/functions/approve-org-deletion/index.ts`. The existing
loop deletes by `organization_id` so no other code change was needed.

Deployed via `npx supabase functions deploy approve-org-deletion
--project-ref hphebzdftpjbiudpfcrs --use-api`. Local commit pushed to
origin/main after the deploy completed.

#### Carry-forwards status

All three open items closed:

1. `supabase/.temp/` gitignore -- DONE (bc23bdf).
2. CLAUDE.md `seriesExportConfig` stale paths -- DONE (bc23bdf).
3. `approve-org-deletion` FK orphan sweep -- DONE (b45bd96).

#### Out of scope

No frontend changes. No SSOT constants modified. No other edge
function touched. No deploy.ps1 invocation. No Netlify deploy.

---

### May 2, 2026 (Session 4) -- Backend cleanup and non-ASCII audit

#### Summary

Two carry-forward items closed, one deferred. No frontend touched, no
edge function logic touched, no deploy.ps1 run. Two commits this
session: a cleanup commit deleting stale backup files and this docs
commit.

#### #7 closed (f68d40d) -- Stale .backup files removed

`CLEANUP: Delete 4 stale .backup files from supabase/functions`

Diagnostic find under `supabase/functions/` surfaced four orphan
`.backup` files left behind by prior edits:

```
supabase/functions/_shared/lessonTiers.ts.backup
supabase/functions/_shared/pricingConfig.ts.backup
supabase/functions/_shared/subscriptionCheck.ts.backup
supabase/functions/generate-lesson/index.ts.backup
```

Confirmed not deployed and not imported anywhere. Removed via
`git rm` in a single commit -- 4 files, 703 deletions.

#### #8 closed (no changes) -- Non-ASCII audit of _shared/ files

Seven non-sync files in `supabase/functions/_shared/` were scanned
byte-by-byte for characters above codepoint 127. All seven contained
non-ASCII; none required changes. Findings:

- `emailDeliveryConfig.ts`, `lessonShapeProfiles.ts`,
  `outputGuardrails.ts`, `trialConfig.ts` -- em dashes (U+2014) in
  comments and string literals.
- `branding.ts` -- single party emoji in the welcome-message string.
- `customizationDirectives.ts` -- empty-checkbox glyph (U+2610) used
  as a literal checkbox marker inside prompt strings sent to the AI
  model. Removing it would change AI output formatting.
- `uiSymbols.ts` -- intentional SSOT symbol map. The exported const
  `UI_SYMBOLS` defines `BULLET: '*'` (U+2022), `EM_DASH: '--'`
  (U+2014), `ELLIPSIS: '...'` (U+2026) etc. The whole purpose of the
  file is to centralize Unicode glyphs so the rest of the codebase
  imports rather than typing them inline. False-alarm note: my
  initial scan reported the bullet bytes as mojibake; they are
  correctly UTF-8 encoded.

Conclusion: the deploy.ps1 ASCII guard pre-commit hook only inspects
files staged through the frontend deploy path. Edge function source
files are deployed via `npx supabase functions deploy --use-api`
which has no ASCII enforcement, so intentional Unicode payloads in
backend SSOTs are fine. No action required.

#### #9 deferred -- pricingConfig.ts / orgPricingConfig.ts unification

Two pricing config files exist in the backend `_shared/` mirror layer.
Unifying them touches the Stripe webhook tier-resolution path
(Rule #17) and the org Stripe webhook path. Deferred to a dedicated
session where a full SSOT audit of every consumer can run before any
edit lands.

May 2 Session 5 audit: orgPricingConfig.ts does not exist in
supabase/functions/_shared/. The backend mirror has a single
pricingConfig.ts already serving both individual and org concerns
(exports ORG_TIERS, STRIPE_INDIVIDUAL, resolveTierFromPriceId,
TIER_LESSON_LIMITS alongside individual tier constants). Three edge
functions consume it correctly. Frontend src/constants/pricingConfig.ts
and src/constants/orgPricingConfig.ts are separate SSOTs for separate
domains -- correct as designed. Carry-forward closed as non-issue.

#### Carry-forwards still open

- CLAUDE.md SSOT File Map lists `seriesExportConfig` under
  `src/config/` but the actual file lives at `src/constants/`. Stale
  path note. Deferred to a future CLAUDE.md cleanup pass.
- `supabase/.temp/cli-latest` and `supabase/.temp/linked-project.json`
  are persistent untracked CLI cache files that reappear after every
  supabase CLI invocation. Carry forward a decision on whether to
  add `supabase/.temp/` to `.gitignore`.
- `approve-org-deletion` schema sweep (Session 3 carry-forward) --
  enumerate every `organization_id`-bearing table and verify FK
  cascade behavior to prevent orphan rows after org closure.

#### Out of scope

No frontend changes. No edge function logic changes. No SSOT
constants modified. No deploy.ps1 invocation. No Supabase functions
redeployed.

---

### May 2, 2026 (Session 3) -- Org deletion approval workflow (full stack)

#### Summary

Complete approval-gated organization closure workflow shipped end to end
in four phases. An org_manager can request closure from OrgManager
settings; a platform admin sees the pending queue in Admin > People >
Organizations and approves it; on approval all org members are emailed
and org-linked rows are deleted in dependency order. No org data is
removed until an admin clicks Approve.

#### Phase 1 -- SSOT contracts (c20066d)

`SSOT: Add ORG_DELETION_REQUEST constants and Organization deletion fields to contracts`

- `src/constants/organizationConfig.ts` -- new `ORG_DELETION_REQUEST`
  const exporting `statuses` (none/pending/approved), `rules`
  (whoCanRequest=org_manager, whoCanApprove=admin,
  requiresAdminApproval=true), `uiCopy` (request button, pending badge,
  confirm copy, admin badge, approve button label) and `notifications`
  (admin email recipients: eckbrosmediallc@gmail.com,
  support@biblelessonspark.com). New `OrgDeletionStatus` type.
- `src/constants/contracts.ts` -- `Organization` interface gained
  optional `deletion_requested_at: string | null` and
  `deletion_requested_by: string | null`.

#### Phase 2 -- Migration (8a5ae47)

`MIGRATION: Add deletion_requested_at and deletion_requested_by to organizations`

`supabase/migrations/20260502174508_add_org_deletion_request_columns.sql`
adds both columns to the `organizations` table. Applied via
`npx supabase db push --linked` per Rule #20. Live database confirmed.

#### Phase 3 -- Edge Functions (e3e0e55)

`FEATURE: Add request-org-deletion and approve-org-deletion Edge Functions`

Two new functions deployed via `npx supabase functions deploy --use-api`:

- `request-org-deletion` -- authorizes the caller is the org_manager of
  the current org, sets `deletion_requested_at = now()` and
  `deletion_requested_by = auth.uid()` on the row, and emails both admin
  addresses listed in `ORG_DELETION_REQUEST.notifications.adminEmails`
  via Resend. Idempotent on the row update.
- `approve-org-deletion` -- authorizes the caller via
  `has_role('admin')`, fetches all org members, emails every member a
  closure notification before any destructive operation, then deletes
  org-linked rows in dependency order and finally the organizations row.

#### Phase 4 -- Frontend wiring (40383ae)

`FEATURE: Org deletion request UI -- OrgManager request button + Admin approval queue`

Two files only, +148 lines:

- `src/pages/OrgManager.tsx` -- Settings tab gains a destructive-bordered
  "Organization Closure" card visible only when `userRole ===
  'org_manager'`. If `organization.deletion_requested_at` is already set,
  shows the amber pending badge with awaiting-review copy; otherwise
  shows the Request button which fires `window.confirm` using
  `ORG_DELETION_REQUEST.uiCopy.confirmTitle/confirmBody` then POSTs to
  `request-org-deletion`. All copy sourced from the SSOT const --
  zero hardcoded strings.
- `src/pages/Admin.tsx` -- Organizations sub-tab queries
  `organizations` for rows with `deletion_requested_at IS NOT NULL`
  ordered ascending and renders them above `<OrganizationManagement />`
  as a destructive-styled queue. Each row has an Approve button that
  POSTs to `approve-org-deletion` with `org_id` and removes the row from
  local state on success. Count badge has `aria-label`, each queue row
  has `role="alert"` and `aria-live="polite"`. All copy sourced from
  `ORG_DELETION_REQUEST.uiCopy`.

#### Verification

- ASCII guard PASS on both frontend files.
- `npm run build` clean -- 3912 modules, 38.33s, zero errors.
- Manual `git add` of the two named files (avoided deploy.ps1's
  `git add .` per the narrow-scope rule for the source-code commit).

#### Deploy (3504ce7)

`FEATURE: Org deletion approval workflow -- full stack complete`

`.\deploy.ps1` ran clean and pushed to origin/main. The deploy commit
also picked up the two unstaged supabase CLI cache files
(`supabase/.temp/cli-latest`, `supabase/.temp/linked-project.json`)
that were already present in the working tree at session start --
no new src files were added by the deploy commit.

#### Carry-forwards CC flagged

1. `approve-org-deletion` cleans 5 org-linked tables only. If other
   tables carry an `organization_id` FK without `ON DELETE CASCADE`,
   orphan rows are possible after closure. Audit deferred -- needs a
   schema sweep to enumerate all `organization_id`-bearing tables and
   their FK behavior.
2. CLAUDE.md SSOT File Map lists `seriesExportConfig` under
   `src/config/` but the actual file lives at `src/constants/`. Stale
   path note. Deferred to a future CLAUDE.md cleanup.

#### Out of scope

No other pages, components, or edge functions touched. No SSOT
constants modified outside `organizationConfig.ts` (Phase 1).

---

### May 2, 2026 (Session 2) -- admin-delete-user rewrite + teaching team dissolution emails

#### Two carry-forwards closed in one commit

c28d699 -- FIX: admin-delete-user -- 30-table explicit cleanup + teaching
team dissolution emails. Edge function rewritten and deployed directly via
`npx supabase functions deploy admin-delete-user --project-ref hphebzdftpjbiudpfcrs --use-api`.
Local commit pushed to origin/main after the deploy completed. (1 file,
+137/-49.)

Edge function deployments bypass deploy.ps1 and Netlify entirely; the
Netlify pipeline only handles the React frontend. Supabase functions ship
directly via the supabase CLI to project hphebzdftpjbiudpfcrs.

#### Carry-forward (a) -- 30-table explicit cleanup (never previously shipped)

Despite an April 13 session-log entry that referenced this work, the
deployed admin-delete-user function (verified May 2 via
`supabase functions download admin-delete-user --use-api` then
`git diff` -- zero diff) was still the original minimal version. It only
called `adminClient.auth.admin.deleteUser(user_id)` and relied on database
FK cascade rules for the rest of the cleanup. No explicit table deletes
were present; no notification logic was present.

The new STEP 3 block deletes from 30 user-linked tables in dependency
order before invoking the auth admin delete in STEP 4. Each table delete
is best-effort: failures log a `WARN: cleanup failed for <table>` prefix
and the loop continues, so a missing table or permission gap does not
abort the user deletion. The single special case is `teaching_teams`,
which keys on `lead_teacher_id` instead of `user_id`. Table list, in
dependency order:

generation_metrics, reshape_metrics, guardrail_violations, events,
outputs, beta_feedback, feedback, email_sequence_tracking, email_rosters,
notifications, parable_usage, modern_parables, devotional_usage,
devotionals, devotional_series, refinements, lessons, lesson_series,
teaching_team_members, teaching_teams, transfer_requests, credits_ledger,
setup_progress, org_shared_focus, organization_focus,
organization_members, beta_testers, invites, user_roles,
teacher_preference_profiles, user_subscriptions, profiles.

#### Carry-forward (b) -- teaching team dissolution notification

New STEP 1 finds all teams where the deleted user is `lead_teacher_id`
and joins to gather the other members of those teams via
`teaching_team_members` and the `profiles` table (full_name + email).
STEP 2 sends each member a Resend email titled "Your Teaching Team Has
Been Dissolved" before any destructive operation runs. Email failures are
non-fatal -- they log a `WARN: Failed to send dissolution email` line but
do not block the subsequent deletion steps.

#### Two minor items CC flagged, accepted as-is

1. Email-before-delete ordering. STEP 2 sends emails before STEP 3/4 run.
   If cleanup or auth-delete fails after the email is sent, members
   receive a "team dissolved" message about a team that still exists.
   Accepted intentionally -- the alternative (email after success) leaves
   recipients uninformed if the function crashes between the cleanup and
   the email send.

2. Hardcoded `from` address. The Resend send uses
   `'BibleLessonSpark <support@biblelessonspark.com>'` directly rather
   than reading `getEmailFrom()` from `_shared/branding.ts` (the SSOT
   used by `notify-team-invitation/index.ts`). Minor SSOT drift on
   outbound email branding; deferred to a future cleanup pass.

#### Verification

- File written via `[System.IO.File]::WriteAllText` with
  `UTF8Encoding($false)` (the CLAUDE.md-mandated method for source files).
  First 3 bytes `69 6D 70` ("imp...") confirm no BOM, 7,719 bytes total.
- ASCII guard PASS: zero non-ASCII characters in the rewritten file.
- Pre-commit hook PASS: `All staged files are ASCII-clean.`
- `npx supabase functions deploy --use-api` succeeded; dashboard URL:
  https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions
- Two unstaged CLI cache files (`supabase/.temp/cli-latest`,
  `supabase/.temp/linked-project.json`) appeared during the diagnostic
  download/deploy passes. Left unstaged per the narrow-scope rule;
  consider .gitignoring them in a future cleanup.

#### Out of scope

No frontend changes. No SSOT constants modified. No other edge function
touched. PROJECT_MASTER.md updated in a separate DOCS commit immediately
after this entry was added.

---

### May 2, 2026 -- Church Plant Teaching Capacity Report public page

#### One commit, one new public route

eeec5de -- FEATURE: Add 2026 Church Plant Teaching Capacity Report public
page. Standalone marketing/research page at /church-plant-teaching-capacity-report
publishing a literature-based ministry analysis of volunteer readiness and
multi-age teaching challenges in church plants. (3 files, +261/-1.)

#### Files changed

1. src/constants/routes.ts -- added CHURCH_PLANT_REPORT public route constant
   in the public-routes block immediately after COMMUNITY.
2. src/App.tsx -- imported ChurchPlantReport page component, registered a
   public Route (no ProtectedRoute wrapper) between COMMUNITY and PRIVACY in
   the public-routes group.
3. src/pages/ChurchPlantReport.tsx (NEW, 261 lines) -- standalone public page,
   no auth or subscription gates. Uses BRANDING.layout.legalPageWrapper /
   legalPageCard for site-consistent styling. Semantic HTML throughout
   (main / article / section / h1-h3 / ul / p) with aria-labelledby on every
   section. useEffect sets document.title and meta description on mount and
   restores both on unmount (no react-helmet dependency in this project).
   Zero imports from any SSOT constant file (pricingConfig, trialConfig,
   theologyProfiles, ageGroups) -- the page is pure content. ASCII-only.

#### Content (verbatim from Lynn's brief, not summarized)

Executive Summary, Introduction, Methodology (with bulleted source list),
five Key Findings as H3 subsections, Implications for Church Plants,
Conclusion, and Sources. Hero section labels the report type as "Literature-
Based Ministry Analysis" and includes an italicized disclosure that the
report does not claim original survey data. Sources cited: Barna, Lifeway,
Pew, NAMB / Send Network (2015-2024).

#### Verification performed before deploy

- ASCII guard ran clean on all three modified/new files (zero non-ASCII chars).
- npm run build -- PASS in 30.60s, 3912 modules transformed, zero errors.
- Dev server started on port 8080; Lynn verified the page on localhost and
  approved the deploy explicitly.
- git status --short before deploy.ps1 showed only the three task files;
  no unrelated drift, so deploy.ps1's `git add .` was safe to use as-is.

#### Out of scope on purpose

No backend work, no SSOT constants modified, no theology / pricing / trial /
auth / lesson / export / subscription file touched. The page is a pure
read-only public landing page; it does not need a backend mirror in
supabase/functions/_shared/.

---

### April 28, 2026 -- Baptist Terminology Guardrails SSOT Remediation + Backend Mirror Sync

#### Two commits, two carry-forwards closed

1. 03068f2 -- FIX: Port Baptist terminology guardrails from backend mirror to
   frontend SSOT. Closes carry-forward (i) from April 27 Session 2. Ported the
   protective content that had been hand-edited into the backend mirror in
   January 2026 but never made it into the frontend SSOT, where it would have
   been silently erased on the next sync run. (1 file, +280/-20.)

2. f0def85 -- SYNC: Regenerate backend mirrors from frontend SSOT -- ports
   Baptist terminology guardrails. Closes carry-forward (g) from April 27
   Session 2. The deferred backend-mirror sync that had been blocked on (i).
   All 14 mirror files in supabase/functions/_shared/ regenerated from the
   now-protective frontend SSOT. (14 files, +773/-636.)

#### Carry-forward (i) -- ministry-critical terminology remediation

The April 27 Session 2 audit found the backend mirror at HEAD contained a
CRITICAL TERMINOLOGY FIX block dated January 2026 that was NOT in the
frontend SSOT. The mirror was therefore the de-facto source of truth for
the universal Baptist terminology guardrails -- a direct SSOT inversion
that would have caused those guardrails to be silently deleted on the
next sync. Today's work brings the frontend to parity.

Three-step protocol with explicit approval gates: AUDIT (read both files,
inventory what's missing) -> PLAN (23 surgical edits with approval) ->
IMPLEMENT (Edit tool only, no Write tool, byte-level checks on each anchor).

The 23 edits, by category:
- 1 docblock note: "CRITICAL TERMINOLOGY FIX (January 2026)" added to the
  file header explaining why the per-profile additions exist and which
  profile (Reformed Baptist) is exempt.
- 9 per-profile avoidTerminology additions: "sacrament", "sacraments",
  "Eucharist" added to the end of the array on profiles 1-9 (NOT Reformed
  Baptist), each preceded by a `// CRITICAL: Baptists use "ordinance" not
  "sacrament" (except Reformed Baptist)` comment.
- 9 per-profile preferredTerminology additions: sacrament -> ordinance,
  sacraments -> ordinances, Eucharist -> Lord's Supper added to the same
  9 profiles, each preceded by a `// CRITICAL: Baptist terminology for
  ordinances` comment.
- 1 BAPTIST_TERMINOLOGY_GUARDRAILS const block (~135 lines) inserted
  between THEOLOGY_PROFILES array close and HELPER FUNCTIONS banner.
  Contains 4 sub-objects: prohibitedForBaptistPractices (19 terms),
  substitutions (19 mappings), contextualExceptions (4 entries),
  preferredTerms (30 terms).
- 1 generateBaptistTerminologyGuardrails() function inserted before
  generateTheologicalGuardrails(). Renders the const into a prompt block.
- 1 wiring line: `guardrailsBlock += '\n\n' + generateBaptistTerminologyGuardrails();`
  appended inside generateTheologicalGuardrails() so every per-profile
  prompt now also receives the universal Baptist terminology rules.
- 1 verification step #6 added to the FINAL VERIFICATION checklist:
  "No non-Baptist terminology appears (see Baptist Terminology Guardrails below)".

ASCII conversions performed during port (the backend mirror had non-ASCII
chars that would fail the frontend ASCII guard):
- Em dash in heading: `BAPTIST TERMINOLOGY GUARDRAILS — UNIVERSAL COMPLIANCE`
  -> `BAPTIST TERMINOLOGY GUARDRAILS -- UNIVERSAL COMPLIANCE`
  (matches existing convention at the older `THEOLOGICAL GUARDRAILS --
  MANDATORY COMPLIANCE` heading).
- Arrow in substitution template: `Instead of "${avoid}" → use "${use}"`
  -> `Instead of "${avoid}" ? use "${use}"` (matches the existing `?`
  placeholder pattern in generateTheologicalGuardrails template at
  pre-edit line 964).

Build clean (`✓ built in 25.17s`, 3911 modules, zero errors). ASCII guard
passed. Working tree clean after commit.

#### Carry-forward (g) -- backend mirror sync (deferred from April 27)

After (i) landed, ran `npm run sync-constants`. All 14 mirror files in
supabase/functions/_shared/ regenerated from the frontend SSOT. The sync
pre-flight script-fix (227a674 from April 27 Session 2) worked: the
header timestamp is now static, so future no-change runs will produce
zero diffs.

Beyond the Baptist guardrails port, the sync also captured several latent
SSOT-mirror divergences that had accumulated since the mirror was last
regenerated (Jan 28, 2026):

1. theologyProfiles.ts mirror gained:
   - `import type { TheologyProfileId, SecurityDoctrine, TulipStance } from './contracts';`
     (mirror had been inlining the union types).
   - `badgeClass: string` field on the interface and on all 10 profile
     entries (added to frontend in Feb-Apr 2026 but never synced).
   - `DEFAULT_THEOLOGY_PROFILE_ID`, `DEFAULT_BADGE_CLASS`,
     `getProfileBadgeClass` SSOT helpers (frontend-only until today).
   - Em-dash conversions in summary strings on 3 profiles
     (southern-baptist-bfm-1963, southern-baptist-bfm-2000, free-will-baptist)
     and the inner `--but does not coerce` clause on NBC -- the mirror had
     literal `—` (U+2014) glyphs from prior hand-edits; sync replaced them
     with the frontend's `--` ASCII convention.

2. systemSettings.ts mirror diff: +354 lines net. Largest file delta in
   the sync. (Reflects accumulated drift between SSOT and mirror; not
   reviewed line-by-line in this session.)

3. contracts.ts mirror diff: +273 lines. Includes union-type updates that
   propagate to other consumer mirrors (notably theologyProfiles.ts).

4. generationMetrics.ts: +252 lines.

5. Smaller deltas across the remaining 10 files (rateLimitConfig,
   routes, lessonStructure, freshnessOptions, bibleVersions, ageGroups,
   teacherPreferences, lessonTiers, devotionalConfig, toolbeltConfig).

Edge-function code-path audit was performed in April 27 Session 2:
zero active code references to the renamed/removed types
(theologicalPreference, sbConfessionVersion, TheologicalPreferenceKey,
SBConfessionVersionKey). All matches were in `.backup` files (not
deployed) or in the new contracts.ts CHANGELOG comment. The sync was
runtime-safe.

Pre-commit ASCII guard passed cleanly on the 14-file commit -- the
script's em-dash/arrow normalization avoided what would have been a
hard block.

Note: 9 of 14 mirror files triggered a `LF will be replaced by CRLF`
warning from git (autocrlf normalization on next checkout). This is
preexisting working-tree behavior and did not affect what was committed
(the index stores LF). Not introduced by this session's work.

#### Closed carry-forwards (from April 27 Session 2 list)

(g) Backend mirror sync -- closed via f0def85.
(i) Baptist terminology guardrails remediation -- closed via 03068f2.

#### Open carry-forwards (renumbered)

(b) Full Parables sweep -- separate session (unchanged).
(j) Backend mirror backup file cleanup -- 8 .backup files in
    supabase/functions/ awaiting decision (unchanged).
(k) supabase/functions/_shared/ non-ASCII cleanup for 7 non-sync files
    (emailDeliveryConfig.ts, branding.ts, lessonShapeProfiles.ts,
    outputGuardrails.ts, customizationDirectives.ts, trialConfig.ts,
    uiSymbols.ts; uiSymbols.ts has actual mojibake on line 10).
    Unchanged. These are NOT in FILES_TO_SYNC so today's sync did not
    touch them.

#### Build / verification

- npm run build: clean (25.17s, 3911 modules, zero errors).
- ASCII guard: passed on both code commits (03068f2 and f0def85).
- Working tree state at session end (before this PROJECT_MASTER commit):
  clean. Both code commits pushed to origin/main.

#### Process notes worth keeping

- Combined-block anchoring is the right move when multiple Baptist
  profiles share byte-for-byte-identical preferredTerminology objects
  (SBC 1963 and SBC 2000). Used the unique `"the elect" ,` (space-comma)
  pattern in SBC 1963 vs `"the elect",` (no space) in SBC 2000 as the
  disambiguator. Worked on first try; no Edit-tool ambiguity errors.
- The frontend's existing `?` placeholder for the substitution arrow
  (line 964 pre-edit) is a deliberate ASCII-safe stand-in for `→`.
  New content added in Edit E must match that convention to avoid
  re-introducing non-ASCII into src/.
- The sync reliably converts non-ASCII glyphs in mirror summaries to
  the frontend's ASCII conventions. This means a clean `npm run
  sync-constants` is also a passive ASCII-cleanup pass for the 14 files
  in FILES_TO_SYNC. The 7 non-sync `_shared/` files (carry-forward (k))
  do not get this treatment and need a separate scrub.
- The April 27 Session 2 decision to NOT push the partial sync, and
  instead surface (i) as a blocker before any sync hit production, was
  correct. Pushing yesterday's sync would have erased the protective
  Baptist terminology guardrails from production AI prompts. The
  guardrails-erased state would have been undetectable from build logs,
  type checks, or grep on src/ -- only manifest as gradual non-Baptist
  language seeping into generated lessons over time.

#### Commits This Session

- 03068f2 FIX: Port Baptist terminology guardrails from backend mirror
  to frontend SSOT
- f0def85 SYNC: Regenerate backend mirrors from frontend SSOT -- ports
  Baptist terminology guardrails
- (this commit) DOCS: Update PROJECT_MASTER.md with April 28 session log

#### Pending Uncommitted Modifications (Carry Forward)

None. Working tree clean before this DOCS commit.

---

### April 27, 2026 (Session 2) -- ASCII Sweep + generate-css.cjs Fix + Sync Attempt Blocked

#### Three commits landed
1. 12b0ca0 -- CLEANUP: ASCII sweep NotificationBell/index/BetaAnalytics
   + remove dead code UpgradePromptModal. Closes carry-forwards (c),
   (d), and (h) from the morning session in one bundled commit.
   (4 files, +7/-10.)

2. 994d599 -- CLEANUP: Fix generate-css.cjs ASCII arrows + remove
   timestamp -- stops index.css build-dirt. Closes carry-forward (e).
   Replaced the literal U+2192 arrows on lines 132/133/134 of the
   generated CSS comment header with ASCII '->' and replaced the
   per-build `Generated: ${new Date().toISOString()}` line on line 129
   with a static `Generated by scripts/generate-css.cjs`. Bundled the
   regenerated src/index.css in the same commit so HEAD matches what
   the deterministic generator produces; future builds no longer dirty
   the working tree. Required two iterations: the first attempt left
   `→` JS escapes in the .cjs source, which the template literal
   evaluated back to the arrow glyph at build time, so index.css was
   still non-ASCII. Diagnosis surfaced that the recurring
   `M src/index.css` after every build was driven by the timestamp
   line, not the arrows. Final fix dropped both. (2 files, +8/-8.)

3. 227a674 -- CLEANUP: Fix sync-constants.cjs timestamp -- removes
   per-run header churn from backend mirrors. Same pattern as 994d599:
   replaced the per-run timestamp line in the generateHeader template
   with a static `Generated by scripts/sync-constants.cjs` so future
   sync runs do not produce timestamp-only diffs across all 14 mirror
   files. (1 file, +1/-1.)

#### Carry-forward (g) backend mirror sync -- ATTEMPTED then REVERTED

The script timestamp fix landed cleanly as 227a674. The actual sync of
all 14 mirror files (npm run sync-constants from repo root) ran
successfully and produced 14 modified files with +783/-906 line deltas.
Pre-flight inventory and ASCII verification on the synced output were
clean (zero non-ASCII in any of the 14 sync targets).

However a deeper drift audit BEFORE staging surfaced a critical SSOT
inversion in theologyProfiles.ts: the backend mirror at HEAD contains a
CRITICAL TERMINOLOGY FIX block dated January 2026 that is NOT present
in the frontend SSOT src/constants/theologyProfiles.ts. The fix added
universal Baptist terminology guardrails to every Baptist profile
except Reformed Baptist. Specifically, the backend mirror has -- and
the sync would silently delete:

  - Per-profile sacrament/sacraments/Eucharist entries in
    avoidTerminology arrays of 9 of 10 profiles
  - Per-profile sacrament -> ordinance and Eucharist -> Lord's Supper
    entries in preferredTerminology of those same 9 profiles
  - The entire BAPTIST_TERMINOLOGY_GUARDRAILS const block (~136 lines)
    containing prohibitedForBaptistPractices (19 terms),
    substitutions (19 mappings), contextualExceptions (4 entries), and
    preferredTerms (30 Baptist-authentic vocabulary entries)
  - The generateBaptistTerminologyGuardrails() function (~40 lines)
    that injects the universal rules into every AI prompt
  - The call to that function from generateTheologicalGuardrails() so
    the universal rules are appended to per-profile guardrails
  - Verification step #6 ("No non-Baptist terminology appears...")
    from the AI's self-check checklist

Frontend audit confirmed: src/constants/theologyProfiles.ts contains
ZERO references to "sacrament" or "Eucharist" -- the frontend has no
mechanism to prevent the AI from emitting Catholic/Anglican
terminology in generated lessons.

Edge function audit (grep on supabase/functions/ for
theologicalPreference, sbConfessionVersion, TheologicalPreferenceKey,
SBConfessionVersionKey): ZERO active code references. All matches were
in .backup files (not deployed) or in the new contracts.ts CHANGELOG
comment. The contracts.ts portion of the sync would have been
runtime-safe.

Resolution: All 14 synced mirror files were reverted to HEAD via
`git checkout HEAD -- supabase/functions/_shared/`. No mirror sync
content was committed. Carry-forward (g) is therefore PARTIALLY
COMPLETE: the script fix (227a674) ships, the actual sync is deferred
until the frontend SSOT is brought up to parity with the backend
mirror's protective content (carry-forward (i) below).

#### Out-of-band SSOT violation -- circumstantial evidence

Eight .backup files were found in supabase/functions/ during the audit:
  - generate-lesson/index.ts.backup-20260118 (31,722 bytes)
  - generate-lesson/index.ts.backup-20251122-132149 (17,990 bytes)
  - generate-lesson/index.ts.backup (22,618 bytes)
  - generate-parable/index.ts.backup-guardrails-20251221-172747
    (32,540 bytes)
  - create-org-checkout-session/index.backup.ts (5,019 bytes)
  - _shared/lessonTiers.ts.backup (2,375 bytes; has BOM at byte 0)
  - _shared/pricingConfig.ts.backup (1,193 bytes)
  - _shared/subscriptionCheck.ts.backup (1,590 bytes)

The 20260118 (Jan 18, 2026) date sits ~10 days before the original
mirror header timestamp (Jan 28, 2026 per the prior auto-generated
header). Combined with the BOM on lessonTiers.ts.backup and BOMs
previously found on the contracts.ts and ageGroups.ts mirrors before
sync, this is consistent with -- though not proof of -- past direct
edits to the backend mirror tree, violating SSOT in spirit.

#### New carry-forwards

(i) Baptist terminology guardrails remediation -- MINISTRY-CRITICAL.
    Port the BAPTIST_TERMINOLOGY_GUARDRAILS const block, the
    per-profile sacrament/Eucharist entries, the
    generateBaptistTerminologyGuardrails() function, the call to it
    from generateTheologicalGuardrails(), and verification step #6
    from supabase/functions/_shared/theologyProfiles.ts (current HEAD)
    into src/constants/theologyProfiles.ts. After that lands, re-run
    npm run sync-constants. Until this is done, the frontend SSOT
    cannot drive backend safely -- the sync will erase production
    guardrails on every run. This blocks (g).

(j) Backend mirror backup file cleanup. 8 .backup files scattered
    across supabase/functions/ (3 in _shared/, 5 in function dirs).
    They are not deployed but they clutter the tree, obscure git
    status, and provide circumstantial evidence of past out-of-band
    edits. Decide which (if any) to keep; delete the rest.

(k) supabase/functions/_shared/ non-ASCII cleanup for 7 files outside
    the sync scope: emailDeliveryConfig.ts, branding.ts,
    lessonShapeProfiles.ts, outputGuardrails.ts,
    customizationDirectives.ts, trialConfig.ts, uiSymbols.ts. Note:
    uiSymbols.ts line 10 has actual mojibake (double-encoded UTF-8
    sequences) that should be repaired. These 7 files are NOT in the
    sync FILES_TO_SYNC list so sync-constants.cjs will not overwrite
    them; they need a separate pass.

#### Closed carry-forwards (from morning session list)

(c) NotificationBell.tsx ASCII sweep -- closed via 12b0ca0.
(d) src/constants/index.ts + BetaAnalyticsDashboard.tsx ASCII sweep
    -- closed via 12b0ca0.
(e) scripts/generate-css.cjs arrow glyph fix (src/index.css regen)
    -- closed via 994d599.
(h) UpgradePromptModal.tsx dead code -- closed via 12b0ca0.

#### Open carry-forwards (renumbered)

(b) Full Parables sweep -- separate session (unchanged from morning).
(g) Backend mirror sync -- partially complete; blocked on (i).
(i) Baptist terminology guardrails remediation [new].
(j) Backend mirror backup file cleanup [new].
(k) supabase/functions/_shared/ non-ASCII cleanup for 7 non-sync
    files [new].

#### Build / verification

- npm run build: clean across all three commits (23.32s and 27.21s
  observed; zero errors; 3911 modules transformed).
- ASCII guard: passed on all three commits.
- Working tree state at session end (before this PROJECT_MASTER
  commit): clean. src/index.css no longer dirties on build (closed
  via 994d599).

#### Process notes worth keeping

- generate-css.cjs fix surfaced that the recurring `M src/index.css`
  after every build was timestamp-driven, not arrow-driven. The
  arrows had been in committed HEAD all along (deploy ASCII guard
  apparently does not gate .css files). The .cjs `→` JS escape
  evaluates to the arrow glyph at build time, so escape-only fixes
  do not solve the index.css cleanliness goal -- need ASCII '->' in
  the template literal directly.
- Same pattern (per-run timestamp causing build-dirt) was confirmed
  in sync-constants.cjs and fixed proactively before running the
  sync, avoiding 14 timestamp-only diffs on every future sync run.
- The Edit tool can normalize between literal Unicode and \uXXXX
  escapes silently. For source-file fixes that must round-trip
  through Read/Edit, byte-level PowerShell or a Node .cjs helper is
  more reliable. Used a one-shot Node helper (fix-generate-css.cjs,
  deleted after run) for the generate-css.cjs fix when PowerShell
  string matching produced confusing zero-match results.

#### Commits This Session

- 12b0ca0 CLEANUP: ASCII sweep NotificationBell/index/BetaAnalytics
  + remove dead code UpgradePromptModal
- 994d599 CLEANUP: Fix generate-css.cjs ASCII arrows + remove
  timestamp -- stops index.css build-dirt
- 227a674 CLEANUP: Fix sync-constants.cjs timestamp -- removes
  per-run header churn from backend mirrors
- (this commit) DOCS: Update PROJECT_MASTER.md with April 27 Session
  2 log

#### Pending Uncommitted Modifications (Carry Forward)

None. The morning session's pending src/index.css modification is
closed via 994d599 above.

---

### April 27, 2026 -- Per-Item Locked Sidebar Micro-Copy + Carry-Forward Cleanup

#### Three commits, two carry-forwards closed
This session executed three discrete tasks, each landed as its own commit:

1. 40cba75 -- DOCS: Append April 26 Pass 2 session log; fix backend mirror
   BETA_SIGNUP drift; register sync-constants script. Resolved the
   PROJECT_MASTER.md update deferred from April 26, plus the post-push
   correction to supabase/functions/_shared/routes.ts (surgical BETA_SIGNUP
   removal) and added "sync-constants": "node scripts/sync-constants.cjs"
   to package.json so future backend-mirror sync runs work. The original
   routes.ts had a UTF-8 BOM at byte 0 (likely from the 2026-02-18 last
   regeneration) that blocked the ASCII guard on first commit attempt;
   stripped it byte-level via [System.IO.File]::ReadAllBytes /
   WriteAllBytes then re-staged. (3 files, +290/-8.)

2. d08378b -- CLEANUP: Delete BetaSignup.tsx -- zero consumers, route
   deprecated April 26. Closes carry-forward (a) from April 26. Pre-delete
   grep verified zero live consumers in src/ or supabase/. Build clean.
   (1 file, -317.)

3. b534f6a -- FEATURE: Wire per-item locked sidebar micro-copy into
   UpgradePromptModal. Closes carry-forward (f) from April 26. Three-step
   audit / plan / implement workflow with explicit approval gates between
   steps. (3 files, +30/-7.)

#### Per-item locked sidebar micro-copy -- wiring details
Architecture: trigger value === sidebar item id, so the modal can do
SIDEBAR_ITEMS[trigger]?.lockedCopy with no separate lookup table.
Trigger names are camelCase ('devotionalLibrary', 'seriesLibrary',
'teachingTeam') matching the SIDEBAR_ITEMS keys exactly. The existing
'feature_teaser' / 'limit_reached' / 'manual' triggers continue to work
unchanged and fall through to the generic teacher-step copy.

Files touched (all in commit b534f6a):
- src/constants/sidebarConfig.ts -- added lockedCopy?: string field to
  SidebarItem interface; populated on devotionalLibrary, seriesLibrary,
  and teachingTeam with copy verbatim from CLAUDE.md.
- src/components/subscription/UpgradePromptModal.tsx -- imported
  SIDEBAR_ITEMS; widened trigger union; ternary-branched the
  DialogDescription body on the three sidebar triggers (per-item copy
  vs. generic Fragment-wrapped fallback). Existing JSX em-dash escape
  on the fallback line preserved unchanged.
- src/components/layout/AppShell.tsx -- widened
  SidebarContentProps.onLockedItemClick to (item: SidebarItem) => void;
  threaded item through the locked-button onClick + onKeyDown handlers;
  added upgradeTrigger state with default 'feature_teaser';
  handleLockedItemClick narrows item.id to the three known ids and
  sets the trigger accordingly (else fallback to 'feature_teaser');
  the Pricing button (action: 'openUpgradeModal') resets trigger to
  'feature_teaser' so a stale per-item value cannot leak in across
  consecutive opens; the modal mount now uses trigger={upgradeTrigger}.

Defensive-code note: the else branch in handleLockedItemClick covers any
future paid_only item added without lockedCopy. The modal still works,
just with the generic fallback.

No other callers of UpgradePromptModal needed changes; the trigger union
widening is purely additive.

#### STATUS block trigger-name note
Lynn's session-end protocol prompt requested STATUS block trigger names
in a mixed casing ('devotionalLibrary' | 'series_library' |
'teaching_team'). The actual implementation uses camelCase across all
three (matching the SIDEBAR_ITEMS keys, since the modal does
SIDEBAR_ITEMS[trigger] lookup; snake_case names would require a separate
translation map). Flagged the discrepancy in the assistant reply before
writing this commit. CLAUDE.md and PROJECT_MASTER.md document the actual
implementation. If snake_case is preferred for any reason, that is a
follow-up code change (rename the union members + sidebarConfig keys +
modal lookup).

#### Accessibility verification (Rule 22)
- Locked sidebar buttons unchanged: aria-disabled="true", aria-label
  "{Label}, Personal Plan required", tabIndex={0}, aria-hidden on icons,
  Enter/Space keyboard handler -- all preserved.
- Per-item description renders inside Radix DialogDescription which is
  automatically wired to aria-describedby on the dialog. Not inside any
  aria-hidden container. Screen readers announce it as part of dialog
  opening.
- No new aria-live region; no role="alert" introduced -- avoids the
  "fires on mount" risk.
- Tab order through the modal is unchanged (only text body changes; no
  new focusable elements).

#### Build / verification
- npm run build: clean, 23.36s, zero errors, 3911 modules transformed.
- Per-file ASCII grep on all three changed files: zero hits each.
- Pre-commit ASCII guard: passed on all three commits this session.
- git diff --check: clean (only LF/CRLF info warnings on AppShell.tsx,
  benign Windows line-ending notice).

#### Closed carry-forwards (from April 26 list)
(a) BetaSignup.tsx file deletion -- closed via d08378b.
(f) Per-item locked sidebar micro-copy implementation -- closed via b534f6a.

#### Open carry-forwards (renumbered from April 26 list)
(b) Full Parables sweep -- separate session.
(c) NotificationBell.tsx ASCII sweep -- separate session.
(d) src/constants/index.ts + BetaAnalyticsDashboard.tsx ASCII sweep --
    bundle with (c) for one-pass cleanup.
(e) scripts/generate-css.cjs arrow glyph fix (src/index.css regen) --
    backend / build-script scope.
(g) Full backend mirror regeneration -- separate session. Surfaced this
    session that supabase/functions/_shared/routes.ts had a UTF-8 BOM at
    byte 0. The BOM-strip is now part of pushed routes.ts content, but
    the mirror generator script may still emit the BOM on next regen.
    The future session that runs npm run sync-constants must verify byte
    0 of every regenerated file is not 0xEF.

#### New carry-forward
(h) UpgradePromptModal.tsx dead code (lines 42-46): the
    `const prompt = trigger === 'limit_reached' ? UPGRADE_PROMPTS.limitReached
    : UPGRADE_PROMPTS.featureTeaser;` declaration is unused. Removing it
    also makes the `UPGRADE_PROMPTS` import (line 22) the file's last
    consumer-free import -- both should be deleted together. Recommend
    bundling with the next planned change to UpgradePromptModal.

#### Commits This Session
- 40cba75 DOCS: Append April 26 Pass 2 session log; fix backend mirror
  BETA_SIGNUP drift; register sync-constants script
- d08378b CLEANUP: Delete BetaSignup.tsx -- zero consumers, route
  deprecated April 26
- b534f6a FEATURE: Wire per-item locked sidebar micro-copy into
  UpgradePromptModal
- (this commit) DOCS: Update CLAUDE.md STATUS block + PROJECT_MASTER for
  April 27 session

#### Pending Uncommitted Modifications (Carry Forward)
- src/index.css -- carry-forward (e) above; auto-regenerated by every
  npm run build. Do not stage manually; fix lives in
  scripts/generate-css.cjs.

---

### April 26, 2026 -- Pass 2 Stale-UI Sweep

#### Pass 1 audit + Pass 2 implementation
Lynn ran a two-pass audit-then-implement on stale, contradictory, or
inaccurate UI copy. Pass 1 produced a complete findings report (no
edits). Pass 2 implemented the items Lynn approved.

#### Approved findings implemented (16 total, one commit)
- **Protected line restoration:** `"A free account prepares a lesson.
  The Personal Plan equips a class."` was lost in commit 0f438a5
  (April 5, 2026) when the right-column tagline was overwritten with
  `"Not a different lesson. A fuller way to lead."` Restored as a
  full-width italic closing anchor below the two-column grid in
  UpgradePromptModal.tsx, mirroring the existing opening anchor
  `"A good lesson teaches. An equipped teacher disciples."` Both
  protected lines now bookend the modal.
- **Finding #11 -- Header pricing wiring:** The header dropdown's
  "Pricing" item previously routed to /dashboard, doing nothing
  visible. Wired it through Header.tsx with the same special-case
  pattern used for `settings` and `signOut`: a new `showUpgradeModal`
  state, an `item.id === 'pricing'` branch in the `navigationItems.map`
  that opens UpgradePromptModal, and the modal mounted alongside
  UserProfileModal. Removed the now-unused `pricing: APP_ROUTES.DASHBOARD`
  entry from `NAV_ROUTES`. The sidebar's existing
  `action: 'openUpgradeModal'` behavior is unchanged; both surfaces
  now open the same modal.
- **Finding #16 -- Beta deprecation:** The /beta-signup route + its
  App.tsx import + the BETA_SIGNUP constant in routes.ts were all
  removed. BetaSignup.tsx body was replaced with a closure notice
  ("Beta Program Concluded" + "The BibleLessonSpark Beta Program
  concluded on February 28, 2026" + redirect/support buttons). The
  Facebook group reference and the `lynn@biblelessonspark.com`
  reference were removed in the same edit. The original `<form>` is
  retained with `className="hidden"` plus a comment, pending Lynn's
  approval for full file deletion (zero live consumers confirmed).
- **Finding #18 -- pricingSource.ts deletion:** Confirmed zero
  consumers in the entire repo. Queries a non-existent
  `subscription_plans` table; uses tier names that do not match the
  SSOT (free/personal/starter/growth/full/enterprise). Deleted.
- **Finding #6 -- subscription/UsageDisplay.tsx deletion:** Orphan
  duplicate of dashboard/UsageDisplay.tsx; zero imports anywhere.
  Carried "Upgrade Now" CTA copy that violated Copy Governance Rule
  5. Deleted.
- **Findings #2 + #3:** pricingConfig.ts -- renamed
  `displayName: 'Teacher Plan'` to `'Personal Plan'`; deleted unused
  `upgradeButton: 'Upgrade to Personal Plan'` field.
- **Findings #4 + #5:** trialConfig.ts -- replaced two `cta: "Upgrade
  Now"` with `cta: "Yes -- Equip My Class"` (under
  `messages.fullExhausted` and `messages.used`), per Copy Governance
  Rule 5.
- **Finding #7 -- Help.tsx FAQ org-tier example:** Replaced
  `"Growth includes 100 lessons/month"` with
  `"Multiplication includes 60 lessons/month"`. The previous example
  contradicted orgPricingConfig.ts on two counts: there is no display
  tier called "Growth" (display names are
  Foundation/Strengthening/Multiplication/Expansion/Network), and the
  100-lesson tier is "Expansion" not org_growth.
- **Finding #8 -- Rule 22 accessibility fix:**
  UpgradePromptModal.tsx:335 had
  `aria-hidden="true"` on the visible "What Begins to Change" section
  header, hiding it from assistive tech. Removed.
- **Finding #9 -- stale code comment:** Renamed
  `{/* Band 2 -- Beyond Sunday */}` to
  `{/* Band 2 -- What Begins to Change */}` (band was renamed
  April 5, 2026).
- **Finding #10 -- stale code comment:** PricingSection.tsx header
  comment removed dead reference
  `same SSOT as PricingPage.tsx` (PricingPage was deleted April 5).
- **Finding #12 -- broken arrow glyph:** Help.tsx Quick Links rendered
  `"Learn more ?"` -- a literal `?` instead of an arrow. Replaced with
  `Learn more {'→'}` (the BLS-approved JSX escape pattern; source
  stays ASCII, glyph renders at runtime).
- **Finding #14 -- backup/.txt sweep:** Deleted 13 stale files (10
  flagged in Pass 1, plus 3 newly surfaced during the cleanup verify
  step):
    - src/components/dashboard/EnhanceLessonForm.tsx.backup
    - src/components/dashboard/EnhanceLessonForm.tsx.backup-20260118
    - src/components/dashboard/EnhanceLessonForm.tsx.accordion-backup
    - src/components/dashboard/TeacherCustomization.tsx.backup-20251122-140234
    - src/pages/Admin.tsx.backup
    - src/constants/pricingConfig.ts.backup
    - src/constants/lessonTiers.ts.backup
    - src/constants/theologyProfiles.ts.backup-20260118
    - src/lib/theologyPrompt.ts.txt
    - src/lib/tenant/TenantProvider.tsx.txt
    - src/lib/theology.ts.txt
    - src/config/theology_profiles.ts.txt
    - src/types/TheologyProfile.ts.txt
- **Finding #15 -- CLAUDE.md governance correction:** The "Locked
  Sidebar Item Micro-Copy" section in Copy Governance defines distinct
  per-item copy for Devotional Library, Series Library, and Teaching
  Team, but UpgradePromptModal currently has only one trigger
  (`feature_teaser`) and shows the same description for all three.
  Documented copy was not actually wired into the UI. Added a STATUS
  block at the top of the section marking it
  "specified but not yet implemented -- carry-forward to a dedicated
  session" and naming the two wiring requirements (per-item trigger
  variant on UpgradePromptModal + AppShell.handleLockedItemClick(item)
  passing the trigger through).
- **Finding #17 -- Help.tsx team-accounts copy:** Replaced
  `"Organizations can set up team accounts - contact us for details."`
  with
  `"To set up a team account, visit biblelessonspark.com/org to create
  an organization."`

#### Two Unicode-trap incidents during implementation
Both caught before commit by the ASCII grep verification step.
Neither shipped to production.

1. **BetaSignup.tsx closure notice (incident 1):** The first
   new_string for the closure notice contained literal U+2019
   (right-single-quote) in `you{'’'}re` and literal U+2014
   (em-dash) in `{'—'}` -- typed as glyphs inside JSX braces
   instead of as the `{'\\u2019'}` / `{'\\u2014'}` escape patterns.
   The Edit tool preserved the literal bytes. Caught immediately by
   the per-file ASCII grep. Reverted to the originally-approved
   ASCII-only wording (straight apostrophe `you're`, double-hyphen
   `--`).
2. **Help.tsx arrow escape (incident 2):** First Edit tried to write
   `Learn more {'\\u2192'}` (the explicit escape). The Edit tool
   normalized the new_string back to a literal U+2192 arrow glyph on
   round-trip, then refused a corrective Edit because old_string and
   new_string compared equal (both literal arrows). Repaired with a
   byte-level PowerShell splice: search bytes
   `0xE2 0x86 0x92` (UTF-8 for U+2192), replacement bytes
   `0x5C 0x75 0x32 0x31 0x39 0x32` (six ASCII bytes for `\\u2192`).
   Both byte arrays were built from explicit byte values, never from
   typed glyphs. One replacement made; verified ASCII-clean by grep.

#### Pattern reinforced
Same Edit-tool behavior as the April 26 Pass 0 line 333 incident on
UserProfileModal.tsx (already in user memory
`feedback_unicode_escape_traps`). The trap recurs whenever Claude
types a Unicode glyph in any tool input -- the Edit tool transports
the literal bytes faithfully. For ASCII-guard repairs the only
reliable path is byte-level splice with explicit byte arrays. Memory
note remains accurate; no update needed.

#### Build / verification
- npm run build: clean, 26.41s, zero errors
- Non-ASCII bytes scan after all edits: zero new hits. Pre-existing
  hits unchanged (src/index.css auto-generated timestamp,
  src/constants/index.ts, NotificationBell.tsx,
  BetaAnalyticsDashboard.tsx -- all carry-forward).
- Pre-commit ASCII guard: passed.
- Live grep ROUTES.PRICING / ROUTES.PARABLES / BookletPrintModal /
  useSpeechInput in src/: zero hits each.
- Protected lines verified: "A good lesson teaches..." unchanged;
  "WHERE YOU ARE" / "WHERE YOU COULD TAKE THEM" unchanged;
  "A free account prepares a lesson..." restored.

#### Files Changed This Session
26 paths in commit c46a657 -- 11 modifications + 15 deletions:

Modifications:
- CLAUDE.md
- src/App.tsx
- src/components/landing/PricingSection.tsx
- src/components/layout/Header.tsx
- src/components/subscription/UpgradePromptModal.tsx
- src/constants/navigationConfig.ts
- src/constants/pricingConfig.ts
- src/constants/routes.ts
- src/constants/trialConfig.ts
- src/pages/BetaSignup.tsx
- src/pages/Help.tsx

Deletions: see Finding #14 list above (13 backup/.txt files), plus
src/components/subscription/UsageDisplay.tsx (#6) and
src/lib/pricingSource.ts (#18).

PROJECT_MASTER.md update committed separately after the implementation
commit, per session-end protocol.

#### Commits This Session
- c46a657 CLEANUP: Pass 2 stale-UI sweep -- protected-line
  restoration, header pricing wiring, beta deprecation, copy SSOT
  fixes (26 files, 68 insertions, 8309 deletions). Pushed to
  origin/main; Netlify auto-deploy.
- (pending) DOCS: Update PROJECT_MASTER for April 26, 2026 Pass 2
  session log

#### Carry-Forward Items (Open After This Session)

(a) **BetaSignup.tsx file deletion -- pending Lynn approval.** Zero
    live consumers confirmed after the route + import + constant were
    removed. The file remains only as a closure notice inside an
    `AppShell`-less Card; the original `<form>` is hidden behind
    `className="hidden"` plus a comment. Lynn explicitly held the
    file deletion this session for separate approval.

(b) **Full Parables sweep (separate session).** Carried forward from
    Pass 0 (April 26 morning session). Orphan source files in
    src/components/ParableGenerator.tsx,
    src/constants/ParableGenerator.tsx,
    src/constants/parableConfig.ts,
    src/constants/parableDirectives.ts; the
    `'Modern Parables Generator'` line in pricingConfig.ts
    PLAN_FEATURES; the parables featureFlag entry; the
    `includesModernParables` field in usePricingPlans.tsx; the
    LessonLibrary "sparkle button" target verification; and the
    Supabase `modern_parables` table + `includes_modern_parables`
    column removal via migration. Estimated 1-2 sessions.

(c) **NotificationBell.tsx ASCII sweep (separate session).** Lines
    105 (bell emoji), 117 (refresh arrow), 120 (ellipsis) contain
    literal Unicode. Fix requires Lucide icon imports (Bell,
    RefreshCw) and JSX restructuring -- beyond a one-line surgical
    edit. Carried forward from Pass 0.

(d) **src/constants/index.ts + BetaAnalyticsDashboard.tsx ASCII
    sweep (separate session).** Both flagged by Pass 0 Finding 3.1
    and confirmed in Pass 2 grep. Recommend bundling with item (c)
    for one-pass cleanup of the three remaining carry-forward
    non-ASCII source files.

(e) **scripts/generate-css.cjs arrow glyph fix (separate session,
    backend / build-script scope).** src/index.css is auto-generated
    on every `npm run build` and emits literal `->` arrows as
    U+2192 glyphs in the comment header (Color Reference / Typography
    sections). Hand-editing src/index.css regresses on the next
    build; the fix lives in the generator script. Pass 2 Finding
    #13. Out of scope for any pure-frontend session.

(f) **Per-item locked sidebar micro-copy implementation (separate
    session).** UpgradePromptModal needs a per-item `trigger` variant
    so the modal description can switch by sidebar source
    (Devotional Library -- "Your group's faith doesn't pause on
    Monday..."; Series Library -- "One lesson teaches a truth. A
    series builds a disciple..."; Teaching Team -- "Moses had Aaron.
    Paul had Timothy..."). AppShell.handleLockedItemClick(item) must
    pass the trigger through. Approved copy already lives in
    CLAUDE.md Copy Governance with a STATUS block flagging it
    not-yet-implemented (added this session under Finding #15).

(g) **Full backend mirror regeneration (separate session).** The
    `supabase/functions/_shared/` mirror was last regenerated
    `2026-02-18T18:17:21.483Z`. Only `routes.ts` was touched in this
    session (surgical BETA_SIGNUP removal); the other 13 files in the
    sync-constants FILES_TO_SYNC list (ageGroups, bibleVersions,
    generationMetrics, lessonStructure, lessonTiers, systemSettings,
    teacherPreferences, theologyProfiles, contracts, rateLimitConfig,
    freshnessOptions, devotionalConfig, toolbeltConfig) are also
    likely stale. Running `npm run sync-constants` (now registered in
    package.json) will overwrite all 14 backend mirror files with the
    current frontend SSOT. The diff is expected to be large and must
    be reviewed carefully -- some divergent values may have non-stale
    reasons. Recommend a dedicated session that (1) runs the sync,
    (2) diffs each file before committing, (3) verifies edge function
    callers (`send-invite/index.ts` is the only known consumer
    today), and (4) considers wiring sync-constants into a build hook
    so the mirror cannot drift again.

#### Mirror Sync Note (post-push correction)
The original commit message of c46a657 told Lynn to run
`npm run sync-constants` to reconcile
`supabase/functions/_shared/routes.ts`. That guidance was wrong on
two levels and was corrected post-push:

1. **The npm script did not exist.** package.json had no
   `sync-constants` entry. The correct invocation was
   `node scripts/sync-constants.cjs`. Fixed in a follow-up commit by
   adding the script entry to package.json so future references work.
2. **The mirror was already grossly stale -- not just BETA_SIGNUP.**
   The `AUTO-GENERATED` header on the backend mirror was timestamped
   `2026-02-18T18:17:21.483Z` and the file had drifted by 14+ route
   changes (e.g., still had `PRICING`, `CREATE_LESSON`, `MY_LESSONS`;
   missing FAQS, ORG_SETUP, ORG_SUCCESS, ORG_MANAGER, TEACHING_TEAM,
   PUBLISH, SHARE, BONUSES, MORE_TOOLS, DEVOTIONALS; legal paths
   diverged; DASHBOARD_TAB_VALUES diverged). Only one edge function
   currently consumes the mirror (`send-invite/index.ts` uses
   `buildInviteUrl` which references `ROUTES.AUTH` -- aligned in both
   files), so the drift has not yet broken production.

Resolution this session: surgical manual removal of the BETA_SIGNUP
line from the backend mirror (Option A), plus
`"sync-constants": "node scripts/sync-constants.cjs"` added to
package.json (Option C). Full mirror regeneration is deferred -- see
carry-forward (g) below.

---

### April 26, 2026 -- Pass 0 Cleanup (Tasks 1-5)

#### Pass 0 baseline integrity report
Lynn ran a Pass 0 baseline integrity check at session start. The report
identified five HOLDS that warranted resolution before further session
work. This session resolved all five.

#### Task 1: Parables route + page removal (narrow scope per Option A)
Removed the orphaned Parables page and its route plumbing. Files touched:
- src/pages/Parables.tsx (DELETED, 95 lines)
- src/constants/routes.ts (removed PARABLES constant)
- src/constants/navigationConfig.ts (removed parables NAV_ROUTES entry,
  parables NAVIGATION_ITEMS entry, Star icon import, and obsolete NOTE
  comment)
- src/App.tsx (verified -- no edits needed; no Parables import or route
  was registered)

Lynn approved Option A (narrow four-file scope). The full Parables sweep
of dependent code is deferred -- see "Pending Carry-Forward" below.

#### Task 2: Removed dead ROUTES.PRICING constant
PricingPage.tsx was deleted April 5, 2026 (commit 0f438a5). Pass 0
confirmed zero live consumers of ROUTES.PRICING (only stale .backup
files). Removed the constant from src/constants/routes.ts.

#### Task 3: Widened SidebarItem.action union type
src/constants/sidebarConfig.ts line 173 set action: 'openUpgradeModal'
on the pricing item, but the SidebarItem.action type at line 75 only
listed 'openProfile' | 'signOut'. Widened the union to include
'openUpgradeModal' and updated the leading comment.

#### Task 4: Fixed CLAUDE.md SSOT File Map paths
The SSOT File Map table listed Pricing and Trial Config under src/config/
but the actual files live under src/constants/. Fixed both rows. Also
fixed a third occurrence of the same drift in the SUBSCRIPTION TIERS
section header (line 335) per Lynn's approval during the diff review.

#### Task 5: Non-ASCII sweep on two files (em-dashes only, per Option B)
Lynn approved Option B (em-dashes only, two files). NotificationBell.tsx
deferred to its own session because the emoji/arrow swaps require Lucide
icon imports beyond a one-line edit. src/constants/index.ts and
src/components/analytics/BetaAnalyticsDashboard.tsx (also flagged by
Pass 0 Finding 3.1) were excluded from this session's scope.

Files touched:
- src/constants/audienceConfig.ts (6 em-dashes in JSDoc converted to --)
- src/components/UserProfileModal.tsx
    - 4 em-dashes in code comments converted to --
    - 1 user-visible em-dash on line 333 converted to {'\u2014'} JSX
      escape (Lynn's Option B election preserves the rendered em-dash
      while keeping source ASCII-safe)
    - 1 JSX comment on line 337 -- two middle-dot separators (U+00B7)
      converted to | and one em-dash converted to --

#### Incident: literal em-dash regression on line 333 of UserProfileModal.tsx
While applying the Task 5 line 333 user-visible change, the new_string
passed to the Edit tool included a literal em-dash glyph inside JSX
braces instead of the six-ASCII-character escape \u2014. The Edit tool
preserved the literal byte sequence, leaving one new non-ASCII byte in
the file -- the exact regression Task 5 was meant to remove.

Two PowerShell repair attempts using String.Replace also failed:
1. First attempt: the replacement string passed to Replace() included a
   literal em-dash glyph again -- the same input-channel error recurring
   at the PowerShell-tool boundary.
2. Second attempt: correctly built the replacement from char codes
   ([char]0x5C + 'u2014' = 6 ASCII bytes), but Replace(char, string)
   mis-resolved overloads and silently failed (zero replacements made).

Resolution (per Lynn's instruction): byte-level splice using
ReadAllBytes / WriteAllBytes. The search bytes (UTF-8 em-dash sequence
0xE2 0x80 0x94) and replacement bytes (ASCII for the JSX escape:
0x5C 0x75 0x32 0x30 0x31 0x34) were both built from explicit byte
values, never from typed or pasted Unicode glyphs. Verified before
and after byte counts: 1 -> 0.

Pattern reinforced (already in user memory feedback_unicode_escape_traps):
the Edit tool can silently emit a literal Unicode glyph from typed input,
and PowerShell's String.Replace will not always cooperate because of
character/string overload resolution. For surgical ASCII-guard repairs,
prefer byte-level splice: build search and replacement arrays from
explicit byte values, never from typed glyphs.

#### Build / verification
- npm run build: clean, 25.90s, zero errors
- Non-ASCII bytes scan in all five edited source files: zero
- git diff --check: clean (only LF/CRLF info warnings on Windows)
- Live grep ROUTES.PRICING / ROUTES.PARABLES in src/: zero hits

#### Files Changed This Session
- src/pages/Parables.tsx (DELETED)
- src/constants/routes.ts
- src/constants/navigationConfig.ts
- src/constants/sidebarConfig.ts
- src/constants/audienceConfig.ts
- src/components/UserProfileModal.tsx
- CLAUDE.md
- PROJECT_MASTER.md (this session log)

#### Commits This Session
- (pending) CLEANUP: Remove Parables, dead ROUTES.PRICING, fix action
  type, fix CLAUDE.md paths, two-file non-ASCII sweep

#### Pending Carry-Forward -- Full Parables sweep (separate session)
Pass 0 Option A removed only the four explicitly listed files. The
following Parables-related code remains in the repo and must be removed
in a dedicated future session before /audit-ssot returns clean:

  Live source files (orphaned dead code, no live consumers after
  Parables.tsx deletion):
    - src/components/ParableGenerator.tsx
    - src/constants/ParableGenerator.tsx (unusual location -- second
      copy of the component, almost certainly a refactor leftover)
    - src/constants/parableDirectives.ts (TEACHING_DIRECTIVE,
      STANDALONE_DIRECTIVE prompts)
    - src/constants/parableConfig.ts (PARABLE_STEPS, parablesPerMonth
      tier limits)

  Configuration / SSOT entries:
    - src/constants/featureFlags.ts -- parables feature flag entry
      (line 75)
    - src/constants/pricingConfig.ts -- 'Modern Parables Generator' line
      in PLAN_FEATURES (line 225) AND includes_modern_parables column
      on the DB-mirror PricingPlanFromDB type (line 352)
    - src/hooks/usePricingPlans.tsx -- includesModernParables field
      (lines 22, 70)

  UI surface that needs verification before deletion:
    - LessonLibrary.tsx "sparkle button" was documented in the deleted
      Parables.tsx header as a teaching-context entry point. If the
      sparkle button still navigates to /parables, the click target is
      now broken. Sweep session must locate, verify, and remove or
      repurpose.

  Auto-generated (do NOT touch manually):
    - src/integrations/supabase/types.ts -- modern_parables table type
      and includes_modern_parables columns are in the live Supabase
      schema. These must be removed via a Supabase migration that drops
      the table and column, after which `npx supabase gen types
      typescript` will regenerate the file with the references gone.
      Editing types.ts by hand is forbidden -- it regenerates on every
      schema change.

  Database considerations:
    - The modern_parables table contains user-generated content. Decide
      data retention before dropping (export, archive, or delete?).
    - If the table is dropped, any RLS policies, triggers, and indexes
      attached to it must also be removed in the same migration.

  Estimated scope: 1-2 sessions. Recommend running /audit-ssot at the
  start of the sweep session and again after to confirm zero residual
  Parables references.

#### Pending Carry-Forward -- NotificationBell.tsx ASCII sweep
Pass 0 Finding 3.1 also identified NotificationBell.tsx as containing
literal Unicode at lines 105 (bell emoji), 117 (refresh arrow), and 120
(ellipsis). Lynn deferred this file to its own session because the
emoji/arrow swaps require importing Lucide icon components (Bell,
RefreshCw) and adjusting JSX -- beyond a one-line surgical edit.

#### Pending Carry-Forward -- Two more files identified by Pass 0
src/constants/index.ts and src/components/analytics/BetaAnalyticsDashboard.tsx
were both flagged by Pass 0 Finding 3.1 as containing non-ASCII bytes.
Lynn limited this session's Task 5 scope to the two files explicitly
named, so these two remain unfixed. Recommend bundling them into the
NotificationBell sweep session for one-pass cleanup.

---

### April 25, 2026 -- Markdown Rendering for Reshape Preview Expander

#### Feature: Render basic markdown inside the lesson card reshape preview
The "View Reshaped" expander on lesson cards in LessonLibrary previously
displayed a 300-character substring of shaped_content as a plain <p> with
whitespace-pre-line. Headings (#, ##, ###) and **bold** spans rendered as
literal markdown punctuation, which read poorly on the dashboard.

Added a small renderMarkdown(text) helper above the LessonLibrary component
(LessonLibrary.tsx:183-192) that line-splits the input and emits:
- <h1>/<h2>/<h3> for #, ##, ### lines
- <strong> for **bold** spans
- <p> for everything else (text-xs, muted-foreground, mb-0.5)

Replaced the truncated <p> at LessonLibrary.tsx:769-771 with a scrollable
<div className="text-xs text-muted-foreground max-h-40 overflow-y-auto">
that calls renderMarkdown(lesson.shaped_content.slice(0, 600)). Preview now
shows roughly twice as much content with proper heading and bold formatting.
No new dependencies (no react-markdown / remark) -- the helper is local.

#### Incident: Literal en-dash inserted by Write tool, caught and reverted
The first attempt used the Write tool for a full-file replacement and
silently introduced a literal U+2013 en-dash on line 836 (the "2-13 lessons
per series" caption that previously used the \u201313 escape). This would
have failed the ASCII guard on deploy.

Per Rule #13, restored the file via git checkout HEAD -- LessonLibrary.tsx,
then reapplied both edits using PowerShell with [System.IO.File]::WriteAllText
and the UTF-8 (no BOM) encoder. PowerShell here-strings were normalized to
the file's existing line endings (CRLF) before the .Replace calls so the
multi-line block match would not silently miss. Verified zero non-ASCII
bytes via grep before deploy.

Lesson learned this session:
The Write tool can normalize escape sequences into literal Unicode glyphs
during a full-file rewrite. For BibleLessonSpark source files prefer Edit
(surgical) or PowerShell with [System.IO.File]::WriteAllText when the
change set is small. If Write must be used for a full file rewrite, grep
the result for [^\x00-\x7F] before deploy. Existing Rule #16 already bans
literal Unicode -- this incident reinforced that the verification step
must run on every full-file write, not just hand-typed edits.

#### Deploy Workflow
Reverted the auto-generated src/index.css timestamp before commit (same
pattern as April 23 cleanup commit 0778082). deploy.ps1 then staged only
LessonLibrary.tsx because it was the lone remaining modification. ASCII
guard passed on the pre-commit hook; pushed to main; Netlify auto-deploy.

#### Feature 2: Rich-text clipboard copy for Google Docs paste
The Copy button inside the reshape preview expander previously called
navigator.clipboard.writeText with the raw markdown string, so pasting into
Google Docs landed literal "# Heading" / "**bold**" markers. Replaced with
the multi-format Async Clipboard API (LessonLibrary.tsx:760-780): converts
the shaped content into both an HTML representation (h1/h2/h3 + strong) and
a plain-text fallback, then writes a ClipboardItem holding both MIME types.
Google Docs reads the text/html representation and renders proper headings
and bold spans on paste.

The onClick handler also had to switch from sync to async because the new
flow uses await navigator.clipboard.write([...]). No try/catch was added --
matches the existing handler pattern; a clipboard write rejection will
surface in the devtools console and skip the success toast. Tested in
browser; paste into Google Docs renders as formatted content.

Same deploy pattern as Feature 1: reverted auto-generated src/index.css
timestamp before deploy.ps1 so only LessonLibrary.tsx shipped.

#### Files Changed This Session
- src/components/dashboard/LessonLibrary.tsx
  - Commit 1: renderMarkdown helper + expander markup
  - Commit 2: rich-text clipboard write in Copy onClick (now async)
- PROJECT_MASTER.md (this session log, both updates)

#### Commits This Session
- 1e69ff5 FEATURE: Render markdown in reshaped lesson preview expander
- a5267ba FEATURE: Copy reshaped lesson content as rich-text HTML for Google Docs paste

#### Pending Uncommitted Modifications (Carry Forward)
None at session end (after this PROJECT_MASTER.md update is committed).

---

### April 24, 2026 -- Sidebar Scrollbar Eliminated (Outermost Container Fix)

#### Bug: Persistent sidebar scrollbar after two prior fix attempts
The desktop sidebar in AppShell.tsx still rendered a vertical scrollbar even after
prior commits attempted to remove it:
- 135cf4c (April 23) removed overflow-y-auto from the inner nav wrapper
- An earlier session targeted SidebarContent's flex-1 region

Both prior fixes touched inner elements while leaving the outermost <aside>
container with overflow-y-auto. Whenever the sidebar's intrinsic content height
exceeded h-screen by even a few pixels (logo block + theme selector + collapse
toggle + nav list), the aside itself produced the scrollbar -- inner-element
fixes could not suppress it.

Fix (commit 859a9fa): Changed the <aside> at AppShell.tsx:344 from
overflow-y-auto to overflow-hidden. The outermost container now clips any
overflow regardless of inner content height. Main content area scrollbar
(<main> at line 373) remains untouched -- its scrolling behavior is unchanged.

Lesson learned this session:
When a scrollbar appears on a fixed-height layout container, fix the outermost
element first. Inner overflow rules cannot override an ancestor that still has
overflow-y-auto.

#### Deploy Workflow (Continued from April 22 Pattern)
Bypassed deploy.ps1 again because two pre-existing unrelated modifications
(.claude/settings.local.json, src/index.css) were present at session start.
Manual sequence used: npm run build -> git add <single file> -> git commit
-> git push origin main. Netlify auto-deployed from push.

#### Files Changed This Session
- src/components/layout/AppShell.tsx (overflow-y-auto -> overflow-hidden on <aside>)
- PROJECT_MASTER.md (session log)

#### Commits This Session
- 859a9fa FIX: set overflow-hidden on outermost sidebar aside to remove sidebar scrollbar

#### Pending Uncommitted Modifications (Carry Forward)
The same two pre-existing uncommitted modifications from the April 22 session
remain untouched per task-scope rule:
- .claude/settings.local.json -- Claude Code permission allowlist additions
- src/index.css -- auto-regenerated build timestamp comment header
Neither affects production behavior. Commit or discard at Lynn's discretion.

---

### April 22, 2026 -- CSP Consolidation and Vimeo Training Videos Fix

#### Bug: Vimeo videos at /training blocked despite netlify.toml allowing player.vimeo.com
The five prior CSP-related commits (9df3f99, fe2b0d2, 41d5b70, 8be34ad, 0a0a51c) all
edited netlify.toml, but a conflicting meta CSP in index.html line 14 had
frame-src 'none'. Browsers enforce the intersection of HTTP-header CSP and
meta-tag CSP -- the most restrictive wins -- so frame-src 'none' silently overrode
the Netlify header. Root cause was dual CSP sources, not any Netlify configuration
problem.

Immediate fix (commit baf2c9d): Changed meta CSP frame-src 'none' to
frame-src https://player.vimeo.com. Videos load.

Consolidation (commit 5237b43): Deleted the meta CSP tag from index.html entirely.
netlify.toml is now the single source of truth for CSP. Also added Google Fonts
to netlify.toml CSP (style-src https://fonts.googleapis.com, font-src
https://fonts.gstatic.com) -- the prior intersection was also silently blocking
Google Fonts because the Netlify CSP did not include them.

New architectural rule established this session:
CSP is SSOT in netlify.toml. No meta CSP in index.html. Future CSP changes touch
netlify.toml only.

#### Deploy Script Workflow Note
deploy.ps1 line 32 does `git add .` which stages ALL pending git modifications
into one commit, not only task-named files. When task scope must be narrow
(standing rule), bypass deploy.ps1 with a manual sequence: verify on main,
git add <specific-files>, git commit -m, git push origin main. Netlify
auto-deploys from push either way.

#### Files Changed This Session
- index.html (meta CSP removed)
- netlify.toml (Google Fonts added to style-src and font-src)
- PROJECT_MASTER.md (session log)

#### Commits This Session
- baf2c9d fix: allow Vimeo iframes in index.html meta CSP
- 5237b43 fix: consolidate CSP to netlify.toml; allow Google Fonts

#### Pending Uncommitted Modifications (Carry Forward)
Two pre-existing uncommitted modifications were present at session start and
remain untouched per task-scope rule:
- .claude/settings.local.json -- Claude Code permission allowlist additions
- src/index.css -- auto-regenerated build timestamp comment header
Neither affects production behavior. Commit or discard at Lynn's discretion.

---

### April 13, 2026 -- Build Lesson Sidebar Tab Switch Fix

#### Bug #35: Build Lesson sidebar click did nothing when already on /dashboard (commit 7a19527)
When a user was already on /dashboard (e.g., viewing a lesson in the Lesson Library)
and clicked "Build Lesson" in the sidebar, nothing happened. React Router did not
process the navigate() call because the path was already /dashboard.

Root cause: Two issues working together:
1. AppShell.tsx navigate() call lacked `replace: true`, so React Router treated
   same-path navigation as a no-op.
2. Dashboard.tsx useEffect depended on `location.state` instead of `location`.
   Since the state object reference might not change for same-path navigation,
   the effect did not re-fire.

Fix:
- AppShell.tsx line 336: Added `replace: true` to the navigate() call for tab items.
  This forces React Router to process the navigation and create a new location object.
- Dashboard.tsx line 118: Changed useEffect dependency from `[location.state]` to
  `[location]`. Each navigate() call creates a new location with a unique key,
  guaranteeing the tab-switch effect fires every time.

#### Print Code Removal Confirmed (April 13, 2026)
Verified that all print-related code has been fully removed:
- src/components/dashboard/EnhanceLessonForm.tsx -- zero matches for "print" (case-insensitive)
- src/components/dashboard/BookletPrintModal.tsx -- file does not exist
No print button or booklet print modal remains in the codebase.

#### Voice Navigation Removed (commit 71f53e4)
Voice navigation feature removed entirely from the BLS feature set.
- Deleted src/utils/useSpeechInput.ts (Web Speech API hook)
- Removed Voice Navigate button and all useSpeechInput references from AppShell.tsx
- Removed microphone icons and all useSpeechInput references from EnhanceLessonForm.tsx
- 257 lines deleted across 3 files. Zero voice nav code remains in codebase.

#### .docx Format Description Fix (commit 9208fd9)
Updated LessonExportModal.tsx .docx description to clarify Google Docs requires
manual Drive upload. Copied from Lynn's corrected file.

#### Files Changed This Session
- src/utils/useSpeechInput.ts (DELETED)
- src/components/layout/AppShell.tsx (navigate replace: true + voice nav removal)
- src/components/dashboard/EnhanceLessonForm.tsx (voice nav removal)
- src/components/dashboard/LessonExportModal.tsx (.docx description fix)
- src/pages/Dashboard.tsx (useEffect dependency)
- CLAUDE.md (date update + deleted files table)
- PROJECT_MASTER.md (session log)

#### Commits This Session
- 7a19527 FIX: Build Lesson sidebar click switches tab when already on dashboard
- 895852b DOCS: Add print code removal confirmation and BookletPrintModal to deleted files
- 9208fd9 FIX: Correct .docx format description -- Google Docs requires manual Drive upload
- 71f53e4 REFACTOR: Remove all voice navigation code from codebase

---

### April 6, 2026 -- Counter Fix, Mobile Scroll, Sidebar Collapse, Upgrade Modal, Voice Nav

#### Bug #33: Free-tier lesson counter showed 0/3 (commit 7dd77c5)
Lesson Usage widget read from user_subscriptions.lessons_used via the
check_lesson_limit RPC, which is never incremented for free-tier users. Edge
Function writes to profiles.trial_full_lessons_used and
profiles.trial_short_lessons_used instead. Fix: added trialFullUsed and
trialShortUsed fields to useSubscription.tsx via a direct profiles query for
free-tier users. UsageDisplay.tsx uses these for progress bar display only.
Exhausted banner condition remains on the RPC-derived lessonsUsed value --
untouched.

#### Bug #34: Free-tier lesson counter showed 0/3 regardless of actual usage
Resolved commit 7dd77c5, April 6, 2026. Same root cause as Bug #33 -- the
display read from the wrong data source. The Edge Function correctly incremented
profiles.trial_full_lessons_used but the frontend read from user_subscriptions
via the check_lesson_limit RPC. Fix added separate trialFullUsed/trialShortUsed
fields that read directly from profiles for free-tier users.

#### Mobile Sidebar Touch Scrolling (commits badc0ca)
iPhone 13 sidebar opened but could not be scrolled by touch. Desktop aside had
overflow-y-auto h-screen but the mobile Sheet had neither. Fix: wrapped nav
element in a div with flex-1 min-h-0 overflow-y-auto and
style={{ WebkitOverflowScrolling: 'touch' }} for iOS Safari momentum scrolling.

#### Desktop Sidebar Collapse Toggle (commit 02b3d96)
Added collapse/expand toggle to the desktop sidebar. Collapsed state shows
narrow strip (w-14) with icons only, no text labels, no theme selector.
Expanded state shows full sidebar (w-56 lg:w-64) exactly as before. Toggle
button at top uses ChevronLeft/ChevronRight. State persists in localStorage
key bls_sidebar_collapsed. Mobile Sheet completely unaffected. Locked items
show mini lock badge overlay in collapsed state. Tooltips via title attribute
on hover.

#### Upgrade Modal Restructure (commit cae2ca6)
Moved billing toggle (Monthly/Yearly) and button row above the fold --
immediately after DialogHeader. Teacher sees CTA without scrolling. Spacing
tightened: tagline py-3 my-4 to py-2 my-2, grid gap-4 to gap-3, button row
mt-6 to mt-3, cancellation mt-2 to mt-1. CTA button label changed from
"Yes -- Equip My Class" to "Yes - I'll Make Disciples".

#### Voice Navigation -- Partial (commit cae2ca6)
Created src/utils/useSpeechInput.ts hook wrapping browser-native Web Speech API.
Added mic buttons to Bible Passage, Topic, and Additional Notes fields in
EnhanceLessonForm.tsx. Added Voice Navigate button at bottom of sidebar in
AppShell.tsx (both desktop and mobile). Set aside for redesign -- see WHAT'S NEXT.

#### Files Changed This Session
- src/hooks/useSubscription.tsx
- src/components/dashboard/UsageDisplay.tsx
- src/components/layout/AppShell.tsx
- src/components/dashboard/EnhanceLessonForm.tsx
- src/components/subscription/UpgradePromptModal.tsx
- src/utils/useSpeechInput.ts (NEW)
- PROJECT_MASTER.md

#### Commits This Session
- 7dd77c5 FIX: Free-tier lesson counter displays real usage from profiles trial columns
- badc0ca FIX: Mobile sidebar touch scrolling - wrap nav in overflow-y-auto flex container
- 02b3d96 FEATURE: Desktop sidebar collapse toggle - icons-only narrow strip with persistence
- cae2ca6 FEATURE: Upgrade modal - billing toggle and buttons above fold, new CTA label

---

### April 5, 2026 -- Upgrade Modal Rewrite, Pricing Page Removal, Calling-Moment Copy

#### PricingPage Deleted and All Routes Resolved (commit 0f438a5)
Deleted src/pages/PricingPage.tsx entirely. Removed import and route from App.tsx.
Every navigate(ROUTES.PRICING) and href="/pricing" across the codebase was replaced
with UpgradePromptModal triggers. Files updated:
- src/components/dashboard/UsageDisplay.tsx -- added modal state + UpgradePromptModal
- src/components/dashboard/EnhanceLessonForm.tsx -- 3 navigate calls changed to setShowUpgradeModal
- src/components/DevotionalGenerator.tsx -- replaced navigateUpgrade alias with modal
- src/components/dashboard/LessonLibrary.tsx -- added modal state + UpgradePromptModal
- src/pages/TeachingTeam.tsx -- onUpgrade callback now opens modal
- src/components/subscription/SubscriptionManagement.tsx -- window.location.href replaced with modal
- src/pages/PublishingHub.tsx -- anchor tag replaced with button opening modal
- src/components/landing/PricingSection.tsx -- auth redirect changed to ROUTES.DASHBOARD; error fallback text simplified
- src/config/footerLinks.ts -- /pricing changed to /#pricing (landing page anchor)
- src/constants/navigationConfig.ts -- pricing route changed to ROUTES.DASHBOARD
- src/components/admin/EmailSequenceManager.tsx -- /pricing URL detection changed to /#pricing

#### Sidebar Pricing Tab Opens Modal (commit 0f438a5)
sidebarConfig.ts: Pricing item changed from route: ROUTES.PRICING to action: 'openUpgradeModal'.
AppShell.tsx: Added 'openUpgradeModal' case in handleItemClick to trigger setShowUpgradeModal.
For free users the modal opens; for paid users it also opens (shows current plan info).

#### UpgradePromptModal -- Section Collapse and Band Rename (commit 0f438a5)
Removed the two .map() blocks listing individual section names (freeIncluded and paidAdds).
Replaced with one compact summary row. Band title changed from "Beyond Sunday" to
"Becoming a Discipler". Three star items and italic summary kept.

#### PricingPage Beyond Sunday Section (commit 0f438a5, before deletion)
Added hr divider, "Beyond Sunday" label, and three Star items (DevotionalSpark,
Series, Publish) to the Personal plan card on PricingPage before it was deleted.

#### Calling-Moment Copy -- UsageDisplay Exhausted Banner (commit 0f438a5)
Heading: "You've prepared lessons. You've shown up faithfully."
Subtext: "The Personal Plan doesn't change what you prepare. It changes what happens to your people."
Reset line includes "No long contract."
Button: "Yes -- Equip My Class"
Feature line: "Not more curriculum. The difference between a classroom and a community."

#### Calling-Moment Copy -- EnhanceLessonForm Blocked Notice (commit 0f438a5)
Full pastoral paragraph about classroom vs. community. Separate reset line with
"No long contract." Button: "Yes -- Equip My Class". role="alert" and
aria-live="polite" preserved.

#### Calling-Moment Copy -- UpgradePromptModal Final Revision (commit 0f438a5)
Title: "Ready to Do Even More for Your Class?"
Description: shortened to focus on what happens in the room and the week.
Free column: honoring italic line + simplified 3-item list (no individual section names).
Personal column: compact summary "More room to prepare. More continuity. More capacity to lead."
Band renamed to "WHAT BEGINS TO CHANGE" with three transformation-focused items:
  - Your class begins to engage, not just listen.
  - Truth that is heard on Sunday starts to take root.
  - One lesson builds into another -- people begin to grow.
Italic summary: "Not a different lesson. A fuller way to lead."
Primary CTA: "Yes -- Equip My Class" (aria-label updated).
Secondary: "I'll stay here for now".
Sizing: max-h-[90vh] overflow-y-auto on DialogContent.
ASCII compliance verified -- zero non-ASCII characters.

#### Protected Lines Preserved
- "A good lesson teaches. An equipped teacher disciples." -- unchanged
- "WHERE YOU ARE" / "WHERE YOU COULD TAKE THEM" column headers -- unchanged
- All aria attributes, role="alert", aria-hidden values -- unchanged

#### Files Changed This Session
- src/pages/PricingPage.tsx (DELETED)
- src/App.tsx
- src/components/dashboard/UsageDisplay.tsx
- src/components/dashboard/EnhanceLessonForm.tsx
- src/components/subscription/UpgradePromptModal.tsx
- src/components/subscription/SubscriptionManagement.tsx
- src/components/DevotionalGenerator.tsx
- src/components/dashboard/LessonLibrary.tsx
- src/components/layout/AppShell.tsx
- src/components/landing/PricingSection.tsx
- src/pages/TeachingTeam.tsx
- src/pages/PublishingHub.tsx
- src/constants/sidebarConfig.ts
- src/constants/navigationConfig.ts
- src/config/footerLinks.ts
- src/components/admin/EmailSequenceManager.tsx

#### Commits This Session
- 0f438a5 FEATURE: Upgrade modal rewrite - teacher to discipler calling-moment copy, sizing fix, all upgrade surfaces updated

---

### April 4, 2026 -- Continued Session (Free-Tier UX, Upgrade Messaging, Trial Enforcement)

#### Dashboard Crash Fix (commit 16522e8)
useSubscription() was destructured at line 556, but tier was used at line 369
in a useState initializer (lessonViewMode). "Cannot access before initialization"
crash on every dashboard load. Fix: moved useSubscription() block to line 364,
immediately after expandedStep useState.

#### Free-Tier Lesson Viewer Default (commits a3d84fe, 16522e8)
lessonViewMode useState initialized to "full" unconditionally. Free-tier user
(Jana Thomas) saw all 8 sections by default. Fix: useState now conditionally
initializes based on tier; useEffect sets "free" for non-paid users.
aria-pressed and aria-label added to Preview Mode toggle buttons per Rule 22.

#### Trial Counter Error Handling (commit a737c3f)
generate-lesson Edge Function trial increment (profiles.update) had no error
handling. Silent failure would leave counter at 0 permanently, granting
unlimited free lessons. Fix: destructure { error: trialUpdateError }, log
CRITICAL on failure. Edge Function redeployed via npx supabase functions deploy.

#### Hybrid Free-Tier Sidebar Navigation (commit fa8561f)
sidebarConfig.ts: Added NavItemTierGate type and tierGate property to every
SidebarItem. AppShell.tsx: useSubscription() added; locked items render at
opacity-50 with Lock icon, open UpgradePromptModal on click; hidden_free
items use conditional rendering. WCAG 2.1 AA: aria-disabled, aria-label,
tabIndex, aria-hidden on icons, onKeyDown for Enter/Space.

#### Upgrade Modal -- Iterative Copy and Structure (commits fa8561f, 161cda9)
Multiple rounds of copy refinement on UpgradePromptModal.tsx:
- Default billing interval changed from monthly to yearly
- Title: "Ready to Do Even More for Your Class?"
- Description: acknowledges teacher's first step, describes Personal Plan value
- Contrast anchor line: "A good lesson teaches. An equipped teacher disciples."
- Two columns: "WHERE YOU ARE" vs "WHERE YOU COULD TAKE THEM"
- Band 1: all 10 lesson sections with Check icons
- Band 2 "BEYOND SUNDAY": DevotionalSpark, Series, Publish with Star icons
- Summary: "A free account prepares a lesson. The Personal Plan equips a class."
- Button: "Yes -- Let's Do More"
- Cancellation notice: "Cancel anytime before your next billing date."
- All icons aria-hidden="true", buttons have descriptive aria-labels

#### UsageDisplay Exhausted Banner (commit 161cda9)
When both full and short lessons exhausted, UsageDisplay shows amber banner
with heading, reset date, class-focused upgrade messaging, "Equip My Class"
button, and feature summary line. role="alert" for screen reader announcement.

#### EnhanceLessonForm Blocked Notice (commit 161cda9)
Amber banner above Step 1 when subLessonsUsed >= subLessonsLimit. Lock icon
(aria-hidden), class-focused subtext, "Equip My Class -- Upgrade Now" button.
role="alert" and aria-live="polite" for screen readers.

#### Welcome Banner Condition Fix (commit 161cda9)
Changed from !step1Complete && !step2Complete to subLessonsUsed < subLessonsLimit.
Banner now hidden when limit is reached, preventing confusing juxtaposition of
"Welcome!" and "Limit reached" messages.

#### DOCX Export Crash Fix (commit e6398a3)
buildTeaserBox used bodyFontHalfPt from wrong scope (module-level function
referencing local variable). Added fontHalfPt parameter. buildTextRuns default
parameter had same scope bug -- changed to body.fontHalfPt.

#### CLAUDE.md Structural Obligations (commit 1e5d7ba)
Added three missing governance sections: Mandatory Session-End Protocol,
Hold-Before-Deploy discipline in deploy sequence, Path Verification Before
Every File Write. Date header updated to April 4, 2026.

#### Files Changed This Session
- src/components/dashboard/EnhanceLessonForm.tsx
- src/components/dashboard/TeacherCustomization.tsx
- src/components/dashboard/UsageDisplay.tsx
- src/components/subscription/UpgradePromptModal.tsx
- src/components/layout/AppShell.tsx
- src/constants/sidebarConfig.ts
- src/constants/pricingConfig.ts
- src/utils/exportToDocx.ts
- supabase/functions/generate-lesson/index.ts
- CLAUDE.md
- PROJECT_MASTER.md

#### Edge Functions Deployed This Session
- generate-lesson (trial counter error handling)

#### Commits This Session
- dd06127 ACCESSIBILITY: Accordion keyboard nav, auto-advance removal, aria labels
- 4fd7008 ACCESSIBILITY: Bible passage ARIA combobox pattern
- 3f02157 DOCS: Append Phase E, theme, accessibility session logs
- fa8561f FEATURE: Hybrid free-tier sidebar nav, upgrade modal, accessibility
- 700b240 DOCS: Add Rule 22 accessibility governance
- e6398a3 FIX: exportToDocx scope bug in buildTeaserBox/buildTextRuns
- a3d84fe FIX: Free-tier lesson viewer defaults to free preview mode
- f9d736c DOCS: Update PROJECT_MASTER and CLAUDE for April 4 session
- 1e5d7ba DOCS: Add missing structural obligations to CLAUDE.md
- 16522e8 FIX: Move useSubscription before lessonViewMode useState
- a737c3f FIX: Trial counter increment error handling in generate-lesson
- 161cda9 FIX: April 4 2026 production fixes

### April 4, 2026 -- Planning Session (Copy Governance, Conversion Messaging Strategy)

#### Context
This was a Claude.ai planning session, not a Claude Code implementation session.
No source files were changed. One governance document was updated and committed.

#### Conversion Moment Strategy -- Three Moments Identified
Reviewed free-tier upgrade messaging across the dashboard. Established that the
three upgrade prompts are not software purchasing moments -- they are ministry
calling moments. The teacher is silently answering: "What kind of shepherd am I
going to be for these people?" (Matthew 28:19). Feature-list copy fails here.
Calling-focused copy succeeds.

Three conversion moments defined and documented:
1. Lesson Usage Card (top-right) -- tone: honoring + invitational
2. Exhausted Lessons Banner (center dashboard + EnhanceLessonForm) -- tone:
   honest + pastoral + clear consequence without manipulation. Most important
   copy on the platform.
3. Locked Sidebar Items (Devotional Library, Series Library, Teaching Team) --
   each requires its own micro-copy tied to that tool's specific ministry purpose.
   ChatGPT analysis identified moments 1 and 2 only. Moment 3 was identified
   here and added to governance.

#### Protected Lines Established
Two lines already in production in UpgradePromptModal.tsx were identified as
non-negotiable anchors. All future copy must be consistent with their weight:
  "A good lesson teaches. An equipped teacher disciples."
  "A free account prepares a lesson. The Personal Plan equips a class."
These lines must never be weakened, softened, or removed without explicit
instruction from Lynn.

#### Locked Sidebar Micro-Copy (for UpgradePromptModal variant by trigger)
Devotional Library: "Your group's faith doesn't pause on Monday. DevotionalSpark
  follows them all week -- connecting Sunday's lesson to Tuesday's life."
Series Library: "One lesson teaches a truth. A series builds a disciple.
  Plan weeks ahead and let your group see where you're taking them."
Teaching Team: "Moses had Aaron. Paul had Timothy. You were never meant to lead
  alone. Invite your co-teachers and carry this together."

#### Two Reusable Prompts Written
Prompt 1 -- For Claude.ai planning sessions touching upgrade copy or onboarding
  language. Establishes the Great Commission framing, three conversion moments,
  protected lines, copy rules, and voice standard. Paste at session start.
Prompt 2 -- For Claude Code implementation sessions touching conversion-moment
  files. Identifies the three files, the required voice for each, the protected
  lines, locked sidebar micro-copy, and button copy rules. Paste at session start
  before any file changes.

#### CLAUDE.md Updated (commit a3167e0)
Added new section: ## COPY GOVERNANCE -- UPGRADE & CONVERSION MESSAGING
Inserted between ## SLASH COMMANDS and ## PROJECT ROOT AUDIT FILES.
130 insertions. ASCII guard passed. Clean push to main.
Section governs: UsageDisplay.tsx, EnhanceLessonForm.tsx,
UpgradePromptModal.tsx, sidebarConfig.ts.

#### Files Changed This Session
- CLAUDE.md (Copy Governance section added)

#### Commits This Session
- a3167e0  DOCS: Add Copy Governance section for upgrade conversion messaging

---

## SESSION LOG: April 13, 2026 -- Admin Delete Fix + Org Deletion Workflow Design

### Fix 1: admin-delete-user Edge Function -- Complete Rewrite
Root cause: Edge Function called `auth.admin.deleteUser()` directly, trusting
Supabase to cascade. It does not. `org_shared_focus.created_by` has a NOT NULL
constraint that blocked deletion with AuthApiError: unexpected_failure.

Fix: Rewrote Edge Function to manually delete all user data across 30 tables
in correct dependency order before calling deleteUser(). Jana Thomas was the
failing test case -- manually deleted via SQL to unblock. Fix deployed and
verified: "User deleted successfully" toast confirmed live.

Tables now cleaned in order before auth deletion:
generation_metrics, reshape_metrics, guardrail_violations, events, outputs,
beta_feedback, feedback, email_sequence_tracking, email_rosters, notifications,
parable_usage, modern_parables, devotional_usage, devotionals, devotional_series,
refinements, lessons, lesson_series, teaching_team_members, teaching_teams,
transfer_requests, credits_ledger, setup_progress, org_shared_focus,
organization_focus, organization_members, beta_testers, invites, user_roles,
teacher_preference_profiles, user_subscriptions, profiles

Commit: FIX: admin-delete-user -- explicit cleanup of all 30 user-linked tables
before auth deletion

### Fix 2: Teaching Team Dissolution Notification -- Designed, NOT YET BUILT
When a lead teacher is deleted, the two team members lose their team silently.
Notification emails must be sent BEFORE the cleanup sequence runs.
Carry forward to next session.

### Fix 3: Org Deletion Approval Workflow -- Designed, NOT YET BUILT

Full design approved. Implementation requires these four files first:
- src/pages/OrgManager.tsx
- src/pages/Admin.tsx
- src/hooks/useAdminOperations.tsx
- src/constants/orgManagerConfig.ts

Approved build plan:

1. organizationConfig.ts -- add ORG_DELETION_REQUEST constant block (SSOT first):
   statuses: none/pending/approved
   uiCopy: button labels, confirm dialog copy, admin badge text
   rules: whoCanRequest, whoCanApprove, requiresAdminApproval: true

2. contracts.ts -- add deletion_requested_at and deletion_requested_by to
   Organization interface

3. Migration file -- ALTER TABLE organizations ADD COLUMN deletion_requested_at
   TIMESTAMPTZ, deletion_requested_by UUID

4. Two new Edge Functions:
   - request-org-deletion: org manager calls; sets columns; emails Lynn at
     eckbrosmediallc@gmail.com AND support@biblelessonspark.com
   - approve-org-deletion: admin-only; emails all org members; deletes org data

5. Two new email templates:
   - org-deletion-request-email.tsx (to admin/Lynn)
   - org-dissolution-notice-email.tsx (to org members)

6. Frontend:
   - OrgManager.tsx: "Request Organization Closure" button (org manager only)
     shows "Pending Admin Approval" badge if already requested
   - Admin.tsx: amber badge on pending orgs, "Approve Deletion" button

Org member dissolution email content:
- Organization name and closure date
- Requested by: manager name
- Personal account remains fully active
- All personal lessons retained in Lesson Library
- Subscription unchanged
- No longer part of a teaching organization
- Contact support@biblelessonspark.com if in error

Lynn personal notification email: eckbrosmediallc@gmail.com
Admin notification email: support@biblelessonspark.com
Both addresses receive the deletion request notification.

### Bug History Additions
33. admin-delete-user assumed Supabase cascades all FK relationships on
    auth.users delete. It does not. org_shared_focus.created_by is NOT NULL
    with no CASCADE, blocking deletion. Fix: explicit 30-table cleanup sequence
    before deleteUser() call. April 13, 2026.

---

## SESSION LOG: April 24, 2026 -- Memory Sync

No code changes this session. PROJECT_MASTER.md header date updated. 
Claude.ai project memory synced by Lynn to reflect all March 20, 2026 session work.

Carry-forward items unchanged -- see WHAT'S NEXT section.