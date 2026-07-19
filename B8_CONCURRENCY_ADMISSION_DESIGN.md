# B8 Concurrency Admission Control -- Design (diagnose + design only, no code shipped)
# Prepared 2026-07-19. Read-only session -- zero migrations, zero deploys, zero code changes made.

## SCOPE REMINDER
This document is the deliverable. Nothing in it has been implemented. See
"Implementation estimate" at the end for the recommended follow-up session(s).

---

## PHASE 1 -- DIAGNOSE

### 1. Current-state map -- all 6 Anthropic-calling functions

All 6 share ONE secret, `ANTHROPIC_API_KEY` -- meaning all 6 draw against the
SAME Anthropic account-level rate-limit bucket. That single fact is the most
important constraint on the whole design: this is not six independent
capacity problems, it is one shared capacity problem with six entry points.

Model sharing is tighter than it looks. From `_shared/modelConfig.ts`:
- `default` (claude-sonnet-4-6) -- generate-lesson (Phase 1 + Phase 2),
  reshape-lesson, generate-devotional, toolbelt-reflect, extract-lesson's
  heavy (PDF/DOCX/image) path.
- `fast` (Haiku 4.5) -- extract-lesson's cheap tagging/fast path only.
- `parable` / `fallback` -- **the same literal model id**
  (claude-sonnet-4-5-20250929) is generate-parable's PRIMARY model AND the
  fallback model every other function switches to when its own primary is
  overloaded. Under a real surge, generate-parable's normal traffic and
  everyone else's overflow retries land in the same bucket.

| Function | Model(s) | Streaming | Budget (total / first-attempt) | Retry/fallback | Today's 429/529 behavior |
|---|---|---|---|---|---|
| generate-lesson (Phase 1) | default -> fallback | **Yes (SSE)** | connect-phase only: 30s x4 attempts; **post-connect duration is unbounded**, bounded only by a 30s no-bytes stall guard that resets on every byte | connect-phase retry+fallback via `openAnthropicStreamWithRetry`; once streaming starts, no further retry (content already reached the client) | 429: bounded same-model retry, no switch. 529/5xx: 1 same-model retry then 1 fallback-model retry, then graceful `AI_TEMPORARILY_UNAVAILABLE` SSE `error` event |
| generate-lesson (Phase 2, non-streaming) | default -> fallback | No | 90,000ms / 60,000ms (`lessonPhase2`) | same pattern via `callAnthropicNonStreaming` | same |
| reshape-lesson | default -> fallback | No | 145,000ms / 140,000ms (`reshapeLesson`) -- the empirically-tuned budget | same pattern | same, but **zero `capacity_events` logging today** -- reshape-lesson isn't in `CapacitySource` at all |
| generate-devotional | default -> fallback | No | 145,000ms / 120,000ms (`devotional`) | same pattern | same; has `capacity_events` logging |
| generate-parable | parable -> default | No | 90,000ms / 60,000ms (`parable`) | same pattern (fallback direction reversed: parable -> default) | same; has `capacity_events` logging |
| extract-lesson (heavy: PDF/DOCX/image) | default -> fallback | No | 100,000ms / 75,000ms (`extractHeavy`) | same pattern | same; has `capacity_events` logging |
| extract-lesson (fast: tagging) | fast (Haiku) -> none | No | 20,000ms / 12,000ms (`extractFast`) | no model fallback (Haiku only) | same |
| toolbelt-reflect | default -> fallback | No | 90,000ms / 60,000ms (`toolbeltReflect`) | same pattern | same; **no `capacity_events` logging today** -- not in `CapacitySource` |

The retry/fallback orchestration itself (`_shared/anthropicRetry.ts`) is
solid and already centralized (Rule #29) -- this design does not touch it
except to add one new integration point (the cooldown flag, Phase 2 below).

**Existing volume/velocity controls are not concurrency controls.** Four
functions (extract-lesson, generate-parable, generate-devotional,
toolbelt-reflect) already call `_shared/edgeRateLimit.ts`'s
`checkRateLimits()` against the `rate_limits` table -- but every scope is a
per-hour or per-day cap (25/user/day, 15/IP/hour, 500/day global, etc.).
Nothing anywhere checks "how many calls are in flight against Anthropic
**right now**." A user could legitimately be under every existing cap while
25 different users all hit "Generate Lesson" in the same 10 seconds --
nothing today would even notice. **generate-lesson and reshape-lesson have
NO rate-limit/volume control of any kind** (only `check_lesson_limit`,
which is a 30-day tier quota, not a velocity or concurrency control) --
they are the two functions most exposed to a concurrency-driven surge, and
also the two under the tightest per-call latency budget.

### 2. Concurrency reality check -- confirmed from the codebase's own precedent

Supabase Edge Functions are isolate-per-request; there is no shared
in-process memory between concurrent invocations, so an in-memory semaphore
genuinely cannot work here (matches the CONTEXT's framing). The codebase
already solved an analogous problem this exact way: `rate_limits` +
`increment_rate_limit()` (migration `20260618120000`) is a **SECURITY
DEFINER RPC, service_role-only**, using `INSERT ... ON CONFLICT DO UPDATE
... RETURNING` for atomic cross-invocation counting. That pattern -- push
the atomicity into a single Postgres statement, never into application
memory -- is the model this design reuses for admission control (Section
2 of Phase 2 below), just with a threshold-check-then-insert instead of a
pure increment, which needs an explicit row lock (`FOR UPDATE`) rather than
`ON CONFLICT` alone.

There is also a second, directly relevant precedent already in production:
**`capacity_events`** (migration `20260716200000`, `_shared/capacityEvents.ts`),
built under Rule #31 specifically so the future Admin Panel can read
surge/capacity health without a retrofit. It already logs
`quota_denied_failclosed`, `quota_denied`, `rate_limited`, `truncated`, and
`anthropic_terminal_failure` for 4 of the 6 functions (missing
reshape-lesson and toolbelt-reflect). This is the correct home for
admission-control observability -- extend it, don't build a parallel
observability table. (See Phase 2, Section 1.)

### 3. Empirical budget verification

**What we already have (real production data, queried this session via
`generation_metrics`, `reshape_metrics`, `devotional_metrics`):**

| Function | n (completed) | p50 | p95 | max observed |
|---|---|---|---|---|
| generate-lesson | 423 | 97.9s | 117.7s | 139.5s |
| reshape-lesson | 58 | 45.0s | 107.8s | 125.7s |
| generate-devotional | 10 | 26.9s | 29.6s | 29.8s |

The generate-lesson max (139.5s) sits just under its 145s total budget --
consistent with the empirical ~150-180s gateway ceiling this project
already learned the hard way (2026-05-18 reshape-lesson 504, documented at
reshape-lesson/index.ts:39-42) and with the CONTEXT's instruction to trust
that number over Supabase's published 400s figure. But no observed row
here ever actually *hit* the real ceiling -- every one of these calls
succeeded within its own configured budget, so this data confirms the
budgets are safely under the ceiling, it does not pin down where the
ceiling actually is. That gap is real and worth closing before any
call-site budget is ever raised in the future.

**Proposed test (design only -- NOT run, needs your approval before
deploy):** a temporary diagnostic edge function, e.g.
`supabase/functions/_diag-gateway-sleep/index.ts`, whose entire body is
`await new Promise(r => setTimeout(r, N * 1000)); return new
Response("ok")`. Invoke it serially (never concurrently) at increasing N --
suggested sequence 140s, 150s, 160s, 170s, 180s, 190s -- stopping at the
first N that returns a gateway error instead of "ok". This isolates the
**Supabase gateway's own wall-clock ceiling** as a pure platform property:
it makes zero Anthropic API calls, burns zero tokens, and costs nothing,
so it sits entirely outside the "no load-testing production Anthropic
quota" boundary from the pre-prompt confirmation -- it's a different
question (platform ceiling, not vendor capacity) and a genuinely cheap one
to answer. Delete the diagnostic function immediately after the last
invocation. I have designed this test but have NOT deployed or run it --
say the word if you want it deployed, or tell me to skip it and keep
budgets exactly where they are.

**The concurrency-burst picture is weaker than I'd like, and I want to be
straight about that.** I computed max overlapping in-flight generations
(across generate-lesson + reshape-lesson + generate-devotional combined,
since they share the account) two ways:

- All-time: max 8 concurrent, on 2026-02-08. Inspecting those rows: all 4
  overlapping generate-lesson calls in that window belong to **your own
  admin account** (`b870...8762`), seconds apart -- almost certainly
  multiple browser tabs during testing, not 8 independent teachers.
- Last 30 days: max **2** concurrent, and the single busiest hour I found
  (18 requests in one hour, 2026-07-16 15:00 UTC) was also entirely your
  admin account, running serially back-to-back (each request starts only
  after the previous one's `generation_end`) -- that's sequential QA
  testing, not concurrency, despite the high hourly count.

Real distinct-user concurrent overlap, as far as this data shows, has
essentially never happened yet. That's expected for a pre-launch/soft-launch
product (207 of your generate-lesson rows are your own account; the next
busiest real user has 91 total lifetime, not concurrent). It means: **the
"observed peak burst" this design is asked to multiply by 2x/5x/10x is not
a meaningful stress signal on its own** -- seeing this design survive
4/10/20 concurrent calls proves the admission-control *logic* works, not
that it was ever actually needed at that scale. I've addressed this
directly in the surge walkthrough (Phase 2, Section 4) by also narrating a
second, illustrative scenario at a scale that would actually pressure a
real Anthropic account, so the design gets evaluated against a real stress
case and not just an artifact of low current traffic.

### 4. Anthropic-side limits

Not visible from code or config -- no rate-limit numbers, tier name, or
spend cap are stored anywhere in this repo (correctly; that's account
metadata, not application config). What I could confirm from code: a
single shared API key means a single shared account-level bucket per
model, and the fallback/parable model-id collision noted in Section 1
means generate-parable's normal traffic and every other function's
overflow share one bucket under stress.

**What you'd need to read off console.anthropic.com** (Settings -> Limits,
or the Usage page) for me to size real admission ceilings rather than
placeholder numbers:
- Requests-per-minute (RPM) for claude-sonnet-4-6 (the `default` bucket --
  by far the highest-traffic one, used by 5 of 6 functions).
- RPM for claude-sonnet-4-5-20250929 (the `parable`/`fallback` bucket).
- RPM for the Haiku model (the `fast` bucket -- lower priority, extract-lesson
  only, probably doesn't need gating at all given Haiku's typically much
  higher throughput ceiling, but worth confirming).
- Input+output tokens-per-minute (TPM) for each of the above, since a
  request storm can exhaust TPM before it exhausts RPM depending on lesson
  length.
- Whether your account tier has any documented max-concurrent-requests
  figure distinct from RPM (some Anthropic tiers do, some don't).

Until you have those numbers, any ceiling I propose below is a
**placeholder sized off today's traffic pattern with a safety margin**, not
a value derived from your actual account limit -- flagged explicitly at
the point it's used.

---

## PHASE 2 -- DESIGN

### 1. Admission control

> **SUPERSEDED 2026-07-19** -- the table shapes below (`generation_slot_counters`
> with `ceiling`/`active_count` columns) were revised after design review. See
> "SESSION 1 PRE-FLIGHT RESOLUTIONS" at the end of this document for the
> current, correct shapes. Left in place for the reasoning trail; do not
> build against this version.

**New table: `public.generation_slot_counters`** -- one row per shared
Anthropic model bucket, row-locked to make the threshold check atomic
(the `FOR UPDATE` here plays the same role `ON CONFLICT` plays for
`increment_rate_limit` -- both push the atomicity into one Postgres
statement instead of application memory).

```
model_bucket   text PRIMARY KEY   -- 'default' | 'fallback_parable' | 'fast'
active_count   integer NOT NULL DEFAULT 0   -- cheap-read cache; source of truth is a COUNT against active_generations
ceiling        integer NOT NULL             -- placeholder until Anthropic limits are known (Phase 1 Section 4)
cooldown_until timestamptz                  -- NULL = no cooldown; see Section 3
```

**New table: `public.active_generations`** -- one row per in-flight
Anthropic call, the actual ledger the count is taken against.

```
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
source        text NOT NULL          -- 'generate-lesson' | 'reshape-lesson' | ... (extend the same allowlist pattern capacity_events already uses)
model_bucket  text NOT NULL REFERENCES generation_slot_counters(model_bucket)
user_id       uuid                   -- nullable, anonymous generate-parable calls
claimed_at    timestamptz NOT NULL DEFAULT now()
expires_at    timestamptz NOT NULL   -- stale-slot safety net, see below
heartbeat_at  timestamptz NOT NULL DEFAULT now()
```

Follows Rule #36/Pattern B exactly: `REVOKE ALL ... FROM anon,
authenticated`, all access via SECURITY DEFINER RPCs granted to
`service_role` only (edge functions already use the service-role key for
`capacity_events` and `generation_metrics` writes, so this is zero new
credential surface).

**Claim RPC** -- `claim_generation_slot(p_source text, p_model_bucket
text, p_user_id uuid, p_ttl_seconds int)`:
1. Opportunistic GC: `DELETE FROM active_generations WHERE expires_at <
   now()` -- this is the stale-slot expiry for crashed invocations (an
   isolate that dies mid-request, OOM, or an uncaught exception before the
   release call, never runs a `finally`; nothing else ever reaps it, so
   the TTL is the only backstop).
2. `SELECT ceiling, cooldown_until FROM generation_slot_counters WHERE
   model_bucket = p_model_bucket FOR UPDATE` -- this lock is what makes
   two simultaneous claims against the same bucket serialize instead of
   racing.
3. If `cooldown_until` is set and still in the future: return
   `claimed=false, reason='cooldown'` immediately -- skip the ceiling
   check entirely (Section 3).
4. Count active rows for that bucket; if `count >= ceiling`, return
   `claimed=false, reason='at_capacity', active_count, ceiling`.
5. Otherwise `INSERT INTO active_generations (...) VALUES (..., now() +
   make_interval(secs => p_ttl_seconds))`, bump the cached
   `active_count`, return `claimed=true, slot_id`.

**Release RPC** -- `release_generation_slot(p_slot_id uuid)`: `DELETE FROM
active_generations WHERE id = p_slot_id`, decrement the cached count.
Called from the edge function's success path AND its failure path (every
`return`/`throw` branch after a successful claim) -- this is the
"release-on-error path" the brief asked for. It must NOT be skipped on an
`AI_ERROR`/`AI_TEMPORARILY_UNAVAILABLE` failure; only a genuinely crashed
isolate should ever fall through to TTL expiry instead of an explicit
release.

**TTL, and why generate-lesson needs a different mechanism than the other
five.** For the five non-streaming, hard-budget functions, TTL =
`totalBudgetMs` (already known precisely per call site, e.g. 145s for
reshape-lesson) plus a small safety margin -- simple, and matches the
existing timeout precision exactly. generate-lesson is different: Phase 1
streams with **unbounded total duration** (only a 30s no-bytes stall guard,
which resets on every token). A fixed TTL sized for the "normal" case would
either be too short (reaping a legitimately long, actively-streaming
lesson's slot while it's still running -- letting an extra request over
the ceiling) or too generous to mean anything as a crash backstop.
Recommended fix: **heartbeat renewal**, piggybacked on the stall-guard
interval that already runs every 5 seconds in generate-lesson
(`generate-lesson/index.ts:1003`, the existing `stallTimer` `setInterval`)
-- add one more line to that same interval calling a cheap
`renew_generation_slot(p_slot_id)` RPC (`UPDATE active_generations SET
heartbeat_at = now(), expires_at = now() + interval '60 seconds' WHERE id
= $1`) every time it fires. A healthy stream renews continuously and never
expires early; a crashed isolate stops heartbeating and the slot reaps
within ~60-65 seconds of the last one -- fast enough to matter, slow
enough to never cost an extra RPC round-trip per token.

**Model buckets and starting ceilings.** Three buckets matching
`ANTHROPIC_MODELS`: `default` (5 of 6 functions -- by far the dominant
one), `fallback_parable` (generate-parable's primary + everyone else's
overflow), `fast` (extract-lesson's Haiku path only). Recommend leaving
`fast` **ungated** initially -- Haiku throughput ceilings are typically
much higher and extract-lesson's fast path is cheap/high-volume by design;
gating it adds complexity for a bucket that isn't the risk. For `default`
and `fallback_parable`, I am not comfortable proposing a specific ceiling
number without your Anthropic console numbers (Phase 1 Section 4) --
whatever ceiling ships first should be read as "conservative placeholder,
tune once real RPM/TPM figures are in hand," not a tuned value.

**Admin-observable, per Rule #31.** Extend `capacity_events`'s two CHECK
constraints (source allowlist: add `'reshape-lesson'`, `'toolbelt-reflect'`;
event-type allowlist: add `'admission_rejected'`, `'admission_queued'`,
`'admission_cooldown_rejected'`) rather than building a second
observability table -- this is the exact table already built for the
Admin Panel's future Configuration-tab gauges to read, and it already has
the right RLS shape (admin-only SELECT, service-role-only INSERT). Do NOT
log `admission_admitted` for every successful claim -- that's every
generation ever run, pure noise; only log the rejection/degradation cases,
matching the table's existing "log the exceptional path" convention.

### 2. Queueing vs rejection policy

| Function | Policy | Why |
|---|---|---|
| generate-lesson | **Bounded poll-then-reject.** On a failed claim, retry the claim every ~2s for up to ~25s before giving up. | Streams, so the frontend already shows a loading/progress state the instant the SSE connection opens -- a brief pre-stream wait is invisible to the teacher as "still preparing your lesson," and generate-lesson has no fixed total budget to protect (only the per-connect-attempt 30s). |
| reshape-lesson | **Immediate rejection.** | Already runs its primary attempt at 140s against a 145s total budget -- there is no spare budget to carve a wait out of. A wait that ends in failure anyway is worse than an honest, fast no. |
| generate-devotional | **Immediate rejection.** | Same reasoning -- 120s/145s, equally tight. |
| generate-parable | **Immediate rejection.** | Includes anonymous traffic; queuing a request behind a slot it may never get is not worth the complexity for this surface. |
| extract-lesson | **Immediate rejection.** | Same as above; heavy path already has its own 75-100s budget with no slack. |
| toolbelt-reflect | **Immediate rejection.** | Lowest-stakes of the six; simplicity wins. |

Every rejection (immediate or after a bounded poll) returns the **same**
`code: 'AI_TEMPORARILY_UNAVAILABLE'` shape the retry layer already uses for
exhausted-retries failures -- see Section 5, this is what makes the
frontend change close to free.

### 3. 429/529 handling upgrade -- shared cooldown flag

Today, `anthropicRetry.ts`'s `runWithRetryAndFallback()` treats every
429/529 as purely local to that one request's retry sequence -- one
caller's overload signal teaches the platform nothing about the next
caller's request a second later, even though they're hitting the same
account bucket. Proposed upgrade: when `runWithRetryAndFallback()` finally
gives up on `errorClass === 'overloaded'` or `'rate_limit'` (the
`giveUp()` calls already in the file, `anthropicRetry.ts:141` and
`:148`/`:152`/`:173`/`:177`), also call a new
`setModelCooldown(model_bucket, seconds)` RPC that does `UPDATE
generation_slot_counters SET cooldown_until = GREATEST(cooldown_until,
now() + interval '$1 seconds') WHERE model_bucket = $2` -- the `GREATEST`
means repeated overload signals extend the cooldown forward rather than
resetting it backward. Recommended cooldown window: short, 15-30s -- long
enough to stop a fresh burst from piling onto a bucket Anthropic just
rejected, short enough that a transient blip self-clears fast. The claim
RPC's step 3 (above) already checks this before even trying the ceiling,
so every OTHER concurrent or queued request immediately gets the fast,
honest `AI_TEMPORARILY_UNAVAILABLE` rejection instead of being admitted
into a bucket that's already failing -- this is the reactive-retry-layer
and proactive-admission-layer composing the way the brief asked for.

### 4. Surge behavior walkthrough

Caveat up front (from Phase 1 Section 3): the real observed peak is ~2
concurrent, and even that is a thin signal from a pre-launch product.
Multiplying it by 2x/5x/10x mostly proves the admission logic behaves
correctly under load, not that Anthropic capacity is actually threatened
at these levels -- so I've walked through both the literal multiples and
a second, more realistic stress scenario.

**Literal 2x/5x/10x of observed peak (2 -> 4 / 10 / 20 concurrent, all
hitting `default`):**
- **4 concurrent:** almost certainly all admitted immediately (any
  reasonable placeholder ceiling clears this). No user-visible effect.
  This tier doesn't really test the system.
- **10 concurrent:** likely still under most plausible ceilings for a
  paid Anthropic account: still probably all admitted, maybe a couple of
  generate-lesson requests see a few seconds of extra poll-wait before a
  slot frees up as earlier calls complete (~100s median). Still invisible
  to the teacher.
- **20 concurrent:** first tier where a low placeholder ceiling could
  plausibly bind. generate-lesson requests beyond the ceiling poll for up
  to 25s; some succeed as slots free up, a fraction receive the "Service
  Busy" toast. The 5 immediate-reject functions: any request over the
  ceiling gets an instant, honest rejection rather than a slow failure.

**Illustrative realistic-surge scenario (a genuine viral/campaign moment --
50 / 250 / 500 concurrent teachers hitting Generate within the same
minute):**
- **50 concurrent:** this is the tier that actually exercises the design
  as intended. Ceiling binds for `default`; generate-lesson requests queue
  up to 25s, a meaningful fraction succeed as ~100s-median calls complete
  and free slots, the rest get a clear "try again shortly" instead of a
  30-90s hang ending in a timeout. The 5 immediate-reject functions fail
  fast and honestly for anything over ceiling -- no pile-up, no cascading
  retries hammering an already-strained Anthropic bucket.
- **250 concurrent:** admission control is now doing real work -- the vast
  majority of requests are rejected fast rather than queued (25s of
  polling for hundreds of requests would itself become a load problem, so
  the bounded poll is a real design choice here, not decoration). Anthropic
  never sees more in-flight requests than the ceiling allows, regardless of
  how many teachers clicked Generate. The cooldown flag matters most here:
  if Anthropic does start returning 529s despite the ceiling (e.g. ceiling
  set too high relative to the real account limit), the cooldown stops the
  platform from hammering it further while it recovers.
- **500 concurrent:** same behavior as 250, just more rejections. The
  system degrades to "most people get a fast, clear busy message" rather
  than "everyone waits 90 seconds and then a large fraction time out
  anyway" -- which is the actual goal of admission control: convert an
  unbounded queue of slow failures into a bounded queue of fast, honest
  ones.

### 5. Frontend touchpoints

The good news: this is nearly free. Every admission rejection (bounded-poll
timeout or immediate) is designed to return the exact same
`{ code: 'AI_TEMPORARILY_UNAVAILABLE', error: '...' }` shape the retry
layer already produces on exhausted retries -- and the frontend already
has a wired handler for it (`src/hooks/useReshapeLesson.tsx:107-114`,
"Service Busy" toast). Functions whose frontend hooks don't yet check for
this code need that same `if (parsed.code === 'AI_TEMPORARILY_UNAVAILABLE')`
branch added (a small, mechanical parity fix, not new copy -- the message
text (`BUSY_MESSAGE` in `anthropicRetry.ts:42`) is already SSOT'd in one
place). No Copy Governance review needed: this is a neutral system-status
message, not one of the three ministry-tone conversion moments that
section governs.

One genuinely new touchpoint, flagged but not designed here (scope
discipline -- verify-before-build item for the implementation session):
generate-lesson's up-to-25s poll-for-a-slot now happens *before* the SSE
connection opens. Need to confirm what the current frontend shows during
that pre-stream gap (today it's presumably near-instant) so a slightly
longer "preparing" state doesn't read as broken or frozen to the teacher.

### 6. Implementation estimate

Not trivial enough to bundle into this session -- this touches a new
migration, 6 call-site integrations, one of which (generate-lesson) has a
genuinely different mechanism (heartbeat renewal vs. fixed TTL, bounded
poll vs. immediate reject) from the other five. Recommended split:

- **Session 1 -- foundation + the 5 non-streaming functions.**
  Migration (`generation_slot_counters`, `active_generations`, claim/
  release RPCs, extended `capacity_events` CHECK constraints, placeholder
  ceilings clearly marked as such). Wire immediate-reject admission into
  reshape-lesson, generate-devotional, generate-parable, extract-lesson,
  toolbelt-reflect -- all identical policy, so this is largely repeating
  one pattern five times. This alone closes reshape-lesson's and
  toolbelt-reflect's existing `capacity_events` blind spots as a side
  effect. Ships first because it's lower-risk (immediate reject only, no
  new streaming interaction) and covers the two functions (reshape-lesson,
  generate-lesson) that currently have zero velocity control at all --
  well, half of that pair.
- **Session 2 -- generate-lesson's bounded-poll + heartbeat, and the
  429/529 cooldown flag.** generate-lesson is architecturally the outlier
  here (streaming, unbounded duration, needs the heartbeat renewal wired
  into the existing stall-guard interval, needs the poll-then-reject logic
  integrated with its SSE error-event path rather than a plain HTTP error
  response) -- isolating it means a mistake there doesn't block shipping
  protection for the other five. Also wires the shared cooldown flag into
  `anthropicRetry.ts`'s give-up path (natural to do once every caller is
  already on the new table) and does an end-to-end verification pass
  across all 6 functions plus a spot-check that `capacity_events` and
  `active_generations` are shaped correctly for the future Admin Panel
  Configuration tab to consume, per Rule #31.

Before Session 1 starts: the empirical gateway-ceiling test (Phase 1
Section 3) should run if you want the eventual ceiling-tuning to rest on
real numbers rather than the existing budget headroom, and you should
pull the Anthropic console RPM/TPM figures (Phase 1 Section 4) so Session
1's `ceiling` values are a real first estimate rather than a placeholder
that immediately needs revisiting.

---

## SESSION 1 PRE-FLIGHT RESOLUTIONS -- 2026-07-19 follow-up

Still design phase. Nothing below has been migrated, deployed, or coded.
This section resolves the four items raised in design review and
supersedes the parts of Phase 2 Section 1 marked above.

### Resolution 1 -- capacity_events vs. the two new tables

The original design accidentally let one new table (`generation_slot_counters`)
carry both configuration (`ceiling`) and a cached derived value
(`active_count`) that don't belong there. Corrected split, three tables,
three distinct jobs, none overlapping:

**(a) What lives where**

| Table | Nature | Holds |
|---|---|---|
| `capacity_events` (existing, extended) | Append-only history | One row per admission REJECTION or degradation event: `source`, `event_type`, `tier_at_event`, `meta jsonb`, `created_at`. Never updated after insert. This is the durable record of "what happened," for later analytics/trends. |
| `generation_slot_counters` (new, revised) | Live state, 2 rows total | `model_bucket text PRIMARY KEY` (`'default'` \| `'fallback_parable'`), `cooldown_until timestamptz`. Nothing else. It exists ONLY to give the claim RPC a row to lock (`FOR UPDATE`) per bucket and to hold the one piece of live cross-request state that genuinely needs a home: the cooldown flag. |
| `active_generations` (new, unchanged from original design) | Live ledger, N rows | One row per in-flight Anthropic call: `id`, `source`, `model_bucket`, `user_id`, `claimed_at`, `expires_at`, `heartbeat_at`. Deleted on release or reclaimed on staleness (Resolution 2). This is the thing actually being counted. |

Two changes from the original design, both removals:
- **`ceiling` is no longer a database column at all.** It moves to the
  Section 3 constants file below and is passed into the claim RPC as a
  parameter by the calling edge function. A cap is configuration, not
  runtime state -- it has no business living in a row a human could edit
  out-of-band from the code that depends on it matching. This is also
  what makes "no caps hardcoded in RPC bodies" (item 3) achievable: the
  RPC becomes generic and parameterized instead of reading a magic number
  out of a table.
- **`active_count` is dropped as a cached column.** It was redundant --
  the claim RPC already computes a live `COUNT(*) FROM active_generations
  WHERE model_bucket = ... AND expires_at >= now()` as part of its
  atomic check (Resolution 2 below shows this inline). Caching the same
  number in a second place is a second source of truth for no benefit;
  removing it removes a way for the two to drift.

**(b) What the Admin Panel (Rule #31) reads**

All three, for three different questions, none redundant:
- **`capacity_events`** -- "how often has this happened, and to whom" --
  historical rejection counts, trends over time, per-tier breakdown. This
  is the Configuration-tab trend/gauge data the table was originally built
  for.
- **`active_generations`** -- "how many calls are in flight right now" --
  a live `COUNT(*) GROUP BY model_bucket` is the only place this number
  exists; `capacity_events` (a log of past rejections) cannot answer "what
  is the current load" at all. This is a new capability the Admin Panel
  didn't have before this design.
- **`generation_slot_counters`** -- "is a bucket currently in cooldown, and
  until when" -- a live status flag, again not something an event log can
  represent (an event log has no cooldown ends but the cooldown itself is
  ongoing, not an entry).

**(c) No overlap confirmation.** `capacity_events` never stores a current
count or a current cooldown state, and the two live-state tables never
store a historical record of past events -- a rejection produces exactly
one write to `capacity_events` (the durable "this happened" record) and,
separately, zero rows added to `active_generations` (a rejected request
was never admitted, so it never got a slot to begin with) and at most one
write to `generation_slot_counters.cooldown_until` (only on the specific
429/529-exhaustion path, Phase 2 Section 3 -- not on every rejection).
Each fact lives in exactly one table.

### Resolution 2 -- orphaned slot reclamation, built into the claim RPC

Reclamation is a statement inside `claim_generation_slot()` itself, not a
separate cron/sweep job -- so it runs every single time anyone tries to
claim a slot, with no dependency on a scheduled process that might not be
running. Full RPC logic (design-level SQL, not yet migrated):

```sql
CREATE OR REPLACE FUNCTION public.claim_generation_slot(
  p_source          text,
  p_model_bucket    text,
  p_user_id         uuid,
  p_ceiling         integer,   -- passed in by the caller, sourced from
                                -- the frontend SSOT constants file
                                -- (Resolution 3) -- never hardcoded here
  p_ttl_seconds     integer    -- stale threshold for THIS call, also
                                -- sourced from the SSOT constants file
) RETURNS TABLE(claimed boolean, slot_id uuid, active_count integer, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cooldown_until timestamptz;
  v_count          integer;
  v_slot_id        uuid;
BEGIN
  -- STEP 1 -- Reclaim orphaned slots FIRST, inline, every call.
  -- A slot is stale once its expires_at has passed: for the 5 fixed-TTL
  -- functions that means "longer than this function's own totalBudgetMs
  -- + margin has elapsed since claim" (the call could not still be
  -- legitimately running); for generate-lesson (heartbeat-renewed) it
  -- means "no heartbeat renewed expires_at in the last ~60s", i.e. the
  -- isolate is gone. Either way, a stale row can ONLY belong to a crashed
  -- or killed invocation, never a healthy one, because a healthy
  -- invocation's own release call (or heartbeat) always runs first.
  DELETE FROM active_generations WHERE expires_at < now();

  -- STEP 2 -- Lock this bucket's row so concurrent claims against the
  -- SAME bucket serialize (this FOR UPDATE is the whole reason
  -- generation_slot_counters exists -- see Resolution 1).
  SELECT cooldown_until INTO v_cooldown_until
    FROM generation_slot_counters
    WHERE model_bucket = p_model_bucket
    FOR UPDATE;

  -- STEP 3 -- Cooldown check short-circuits before the ceiling even
  -- matters (Phase 2 Section 3).
  IF v_cooldown_until IS NOT NULL AND v_cooldown_until > now() THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'cooldown'::text;
    RETURN;
  END IF;

  -- STEP 4 -- Count against the now-guaranteed-fresh table (STEP 1 just
  -- swept anything stale), under the same row lock, so no other
  -- concurrent claim for this bucket can insert between the count and
  -- this claim's own insert.
  SELECT count(*) INTO v_count
    FROM active_generations
    WHERE model_bucket = p_model_bucket;

  IF v_count >= p_ceiling THEN
    RETURN QUERY SELECT false, NULL::uuid, v_count, 'at_capacity'::text;
    RETURN;
  END IF;

  -- STEP 5 -- Admit.
  INSERT INTO active_generations (source, model_bucket, user_id, expires_at)
  VALUES (p_source, p_model_bucket, p_user_id, now() + make_interval(secs => p_ttl_seconds))
  RETURNING id INTO v_slot_id;

  RETURN QUERY SELECT true, v_slot_id, v_count + 1, NULL::text;
END $$;

REVOKE EXECUTE ON FUNCTION public.claim_generation_slot(text, text, uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.claim_generation_slot(text, text, uuid, integer, integer) TO service_role;
```

Because STEP 1 runs unconditionally at the top of every claim, a quiet
period with no new claims simply leaves stale rows sitting inert (they
count toward nothing since nobody is counting) until the next claim
attempt, at which point they are swept before the count that matters.
There is never a scenario where a live invocation's slot is reclaimed
out from under it, because staleness is defined purely by elapsed time
against a threshold sized to exceed how long a legitimate call can
possibly still be running.

`release_generation_slot(p_slot_id uuid)` stays exactly as originally
designed: `DELETE FROM active_generations WHERE id = p_slot_id`, called
from every success and handled-failure exit path in the edge function.
`renew_generation_slot(p_slot_id uuid)` (generate-lesson only):
`UPDATE active_generations SET heartbeat_at = now(), expires_at = now() +
interval '60 seconds' WHERE id = p_slot_id`.

**Stale threshold per function/source:**

| Source | Mechanism | Stale threshold | Basis |
|---|---|---|---|
| reshape-lesson | Fixed TTL at claim time | 165s | `totalBudgetMs` 145s (`reshapeLesson`) + 20s margin |
| generate-devotional | Fixed TTL at claim time | 165s | `totalBudgetMs` 145s (`devotional`) + 20s margin |
| generate-parable | Fixed TTL at claim time | 110s | `totalBudgetMs` 90s (`parable`) + 20s margin |
| toolbelt-reflect | Fixed TTL at claim time | 110s | `totalBudgetMs` 90s (`toolbeltReflect`) + 20s margin |
| extract-lesson (heavy) | Fixed TTL at claim time | 120s | `totalBudgetMs` 100s (`extractHeavy`) + 20s margin |
| extract-lesson (fast) | N/A -- ungated | N/A | Haiku `fast` bucket intentionally not admission-controlled (Phase 2 Section 1) |
| generate-lesson | Heartbeat renewal, not fixed TTL | 60s since last heartbeat | Phase-1 stream duration is unbounded; a fixed budget-derived TTL would either reap a healthy long stream or be too loose to mean anything as a crash backstop. One slot is claimed once, before Phase 1 opens, and held through Phase 2 (both phases of one Generate click are one concurrency unit) -- released only when the whole invocation finishes or fails. The heartbeat piggybacks on the stall-guard interval that already runs every 5s in `generate-lesson/index.ts:1003`, extended to run for the invocation's full lifetime rather than just the Phase-1 SSE read loop. |

### Resolution 3 -- SSOT for concurrency caps

New file: **`src/constants/concurrencyConfig.ts`**, added to Rule #23's
`FILES_TO_SYNC` list (mirrored to
`supabase/functions/_shared/concurrencyConfig.ts` by
`scripts/sync-constants.cjs`, same as `modelConfig.ts` and
`rateLimitConfig.ts`). CLAUDE.md's Rule #23 file list and SSOT File Map
table both need a one-line addition when this ships. Proposed shape:

```ts
// src/constants/concurrencyConfig.ts
// SSOT for admission-control concurrency caps, queue/reject policy, stale
// thresholds, and cooldown duration. Consumed by every edge function that
// claims a generation slot, via the synced _shared/ mirror (Rule #23).
// No cap, threshold, or duration governed by this file may be hardcoded
// anywhere else -- RPC bodies receive these as parameters; edge functions
// import them from here (or the mirror).

export type ConcurrencySource =
  | 'generate-lesson'
  | 'reshape-lesson'
  | 'generate-devotional'
  | 'generate-parable'
  | 'extract-lesson'
  | 'toolbelt-reflect';

export type ModelBucket = 'default' | 'fallback_parable';
// 'fast' (Haiku, extract-lesson's fast path) is intentionally NOT a key
// here -- ungated by design, see B8_CONCURRENCY_ADMISSION_DESIGN.md
// Phase 2 Section 1.

export const CONCURRENCY_CONFIG = {
  // Which shared Anthropic-account bucket each source's gated call draws
  // against. Mirrors the model-sharing reality in modelConfig.ts's
  // ANTHROPIC_MODELS -- 'default' is claude-sonnet-4-6 (5 of 6 sources);
  // 'fallback_parable' is claude-sonnet-4-5-20250929 (generate-parable's
  // primary AND everyone else's fallback model -- see design doc Phase 1
  // Section 1 for why these collide under load).
  sourceBucket: {
    'generate-lesson': 'default',
    'reshape-lesson': 'default',
    'generate-devotional': 'default',
    'generate-parable': 'fallback_parable',
    'extract-lesson': 'default',
    'toolbelt-reflect': 'default',
  } satisfies Record<ConcurrencySource, ModelBucket>,

  // PLACEHOLDER VALUES -- NOT FINAL. Sized off today's traffic pattern
  // with a safety margin, not off a real Anthropic RPM/TPM figure. Do not
  // treat as tuned until the console numbers (design doc Phase 1 Section
  // 4 / the checklist below) are in hand and these are revisited.
  bucketCeiling: {
    default: 8,
    fallback_parable: 4,
  } satisfies Record<ModelBucket, number>,

  // Stale-slot threshold (seconds), passed to claim_generation_slot() as
  // p_ttl_seconds. See Resolution 2's table for the basis of each value.
  // generate-lesson's value here is the heartbeat renewal window, not a
  // budget-derived TTL -- see heartbeat block below.
  staleThresholdSeconds: {
    'generate-lesson': 60,
    'reshape-lesson': 165,
    'generate-devotional': 165,
    'generate-parable': 110,
    'extract-lesson': 120,
    'toolbelt-reflect': 110,
  } satisfies Record<ConcurrencySource, number>,

  // generate-lesson only -- heartbeat cadence piggybacked on the existing
  // stall-guard interval (generate-lesson/index.ts:1003).
  heartbeat: {
    intervalSeconds: 5,
    renewalWindowSeconds: 60,
  },

  // 'queue' polls claim_generation_slot() on a short interval up to
  // maxWaitMs before giving up; 'immediate' rejects on the first failed
  // claim. See design doc Phase 2 Section 2 for the reasoning per source.
  admissionPolicy: {
    'generate-lesson': 'queue',
    'reshape-lesson': 'immediate',
    'generate-devotional': 'immediate',
    'generate-parable': 'immediate',
    'extract-lesson': 'immediate',
    'toolbelt-reflect': 'immediate',
  } satisfies Record<ConcurrencySource, 'queue' | 'immediate'>,

  // generate-lesson's bounded poll-for-a-slot window (only consulted when
  // admissionPolicy is 'queue').
  admissionQueue: {
    pollIntervalMs: 2_000,
    maxWaitMs: 25_000,
  },

  // Shared cooldown window applied to a model_bucket when the retry layer
  // (_shared/anthropicRetry.ts) exhausts retries/fallback on 'overloaded'
  // or 'rate_limit'. Extended forward (GREATEST), never reset backward, on
  // repeated signals -- design doc Phase 2 Section 3.
  cooldownSeconds: 20,
} as const;
```

This intentionally mirrors `modelConfig.ts`'s `RETRY_CONFIG` shape and
`satisfies Record<...>` style so it reads as the same family of file, and
keeps `ConcurrencySource` aligned to `capacity_events.source` (not to the
finer-grained `RetryCallSite` in `modelConfig.ts`) since slot claims are
one-per-invocation (Resolution 2), matching the Admin Panel's per-function
reporting grain, not per-internal-call-site.

### Resolution 4 -- diagnostic function lifecycle spec

**(a) Admin-gated.** Same pattern already used by
`admin-management/index.ts:35-56` (verbatim precedent, not a new
mechanism): extract the `Authorization` bearer JWT, resolve the user via
`supabaseAdmin.auth.getUser(jwt)`, then `supabaseAdmin.rpc('has_role', {
_user_id: user.id, _role: 'admin' })`; a missing header, invalid JWT, or
`hasAdminRole !== true` returns 403 before the sleep ever starts. This
means the function needs the service-role key (already how every other
admin-gated function is built) purely to run the `has_role` check --  it
never uses that key for anything else.

**(b) Teardown.** Explicit last step of the test plan, not optional
cleanup: `npx supabase functions delete _diag-gateway-sleep --project-ref
hphebzdftpjbiudpfcrs` immediately after the ceiling is found (or after the
full 140-190s sequence completes, whichever comes first). The function is
not left deployed between sessions. `npx supabase functions list
--project-ref hphebzdftpjbiudpfcrs` should be re-run right after the
delete to confirm it's actually gone, not just that the delete command
exited 0.

**(c) Deployment command.** `npx supabase functions deploy
_diag-gateway-sleep --project-ref hphebzdftpjbiudpfcrs --use-api` --
Rule #20's documented mechanics, `--use-api` so no local Docker/Deno is
needed (confirmed neither is installed on this box).

**(d) Exact test procedure.** Function body (design only):

```ts
// supabase/functions/_diag-gateway-sleep/index.ts -- TEMPORARY, deleted
// immediately after use. Makes ZERO Anthropic API calls -- pure sleep,
// isolates the Supabase gateway wall-clock ceiling as a platform property,
// separate from and cheaper than any Anthropic-quota question.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  // [admin gate exactly as in (a) above]
  const { seconds } = await req.json();
  const start = Date.now();
  await new Promise((r) => setTimeout(r, seconds * 1000));
  return new Response(JSON.stringify({ ok: true, seconds, actualMs: Date.now() - start }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

Procedure, run by Lynn after deploy is separately approved:

1. Log into biblelessonspark.com as the admin account, in a normal
   browser tab (so the session already holds a valid admin JWT).
2. Open DevTools -> Console on that tab.
3. Paste and run this once per N, waiting for each call to finish (print
   its result) before starting the next -- **never run two at once**, this
   is a single-signal timing probe, not a load test:

```js
fetch('https://hphebzdftpjbiudpfcrs.supabase.co/functions/v1/_diag-gateway-sleep', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + (await window.supabase.auth.getSession()).data.session.access_token,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ seconds: 140 }), // change this number each run
}).then(async (r) => console.log(r.status, await r.text()));
```

   (The exact way to reach the live Supabase client as `window.supabase`
   depends on how the app exposes it in this build -- confirm that detail
   at implementation time rather than assuming it; if it isn't exposed,
   the same snippet works by pasting a valid access token copied from
   Application -> Local Storage in DevTools instead of the
   `getSession()` call.)
4. Run the sequence N = 140, 150, 160, 170, 180, 190 in order. Stop at the
   first N that does NOT return `{ok:true,...}` -- i.e. returns a gateway
   error, a connection reset, or simply never resolves.
5. For each N, record: the number itself, the HTTP status (or "no
   response"/timeout), and the console-printed `actualMs`.
6. Report the full table of results back. The empirical ceiling is
   between the last successful N and the first failing N.
7. Run the teardown command from (b) immediately, then confirm via
   `functions list` that it's gone.

I have not deployed this function. Waiting on your separate go-ahead
per item 4 before running `functions deploy`.

### Checklist for Lynn -- pull from console.anthropic.com before Session 1 caps are final

- [ ] **Account/org tier name** -- Settings page, usually labeled "Plan" or
      "Tier" (e.g. Build, Scale). Determines which limit table applies.
- [ ] **Requests per minute (RPM) -- claude-sonnet-4-6** ("default" bucket,
      the highest-traffic one -- 5 of 6 functions use it). Settings ->
      Limits (or Usage & Billing -> Limits, wording varies by console
      version).
- [ ] **Requests per minute (RPM) -- claude-sonnet-4-5-20250929**
      ("fallback_parable" bucket -- generate-parable's primary model AND
      every other function's fallback model). Same Limits page, separate
      row per model.
- [ ] **Requests per minute (RPM) -- the Haiku model in use** (extract-lesson's
      "fast" bucket). Not blocking Session 1 (this bucket is intentionally
      ungated) but worth confirming it's genuinely a non-issue.
- [ ] **Input tokens per minute (ITPM) -- claude-sonnet-4-6.** Same Limits
      page. If the console shows a combined TPM figure instead of split
      ITPM/OTPM, record that combined number and note it's combined.
- [ ] **Output tokens per minute (OTPM) -- claude-sonnet-4-6.**
- [ ] **ITPM / OTPM (or combined TPM) -- claude-sonnet-4-5-20250929.**
- [ ] **Any documented max-concurrent-requests figure**, if the console
      shows one separate from RPM (not all tiers have this; note "not
      shown" if absent rather than assuming zero).

Session 1's `bucketCeiling` values in `concurrencyConfig.ts` (Resolution
3) stay marked PLACEHOLDER until this checklist is filled in and the
numbers are reconciled against real traffic + the empirical gateway-ceiling
test above.

---

**Status: waiting for your approval on these four resolutions before any
Session 1 implementation (migration, edge function changes, or the
diagnostic function deploy) begins.**
