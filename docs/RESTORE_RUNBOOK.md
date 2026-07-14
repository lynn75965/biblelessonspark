# Production Backup Restore Runbook

Last verified: July 14, 2026 (session B2), against production project
`hphebzdftpjbiudpfcrs` (LessonSparkUSA) restored into a dedicated staging
project `hfamquasdbiumpzjwqsy` (BLS-staging), same Supabase org, us-east-1.

This is a tested, end-to-end procedure, not a hope. Every command below was
run for real in session B2 and its actual output (including every error) is
reflected in this document. Where a number is quoted as a pass/fail
criterion, it is described as "live" -- re-derive it at restore time, do not
hardcode the July 14, 2026 figures forward.

---

## 1. Scope

This runbook restores the `public` and `extensions` schemas -- application
tables, views, functions, triggers, RLS policies, and extension
declarations -- from a `pg_dump` of production into a target Postgres
database (tested against a fresh Supabase project).

**Explicitly out of scope** -- see Section 7 for what to do instead if any
of these are ever actually needed:

- `auth` schema (Supabase-managed user accounts, password hashes, MFA)
- `storage` schema / actual file blobs
- Edge Function secrets
- DNS records
- Stripe configuration

---

## 2. Prerequisites

### 2.1 Native PostgreSQL 17 client tools (required)

The Supabase CLI's own `supabase db dump` / `db push` commands invoke
`pg_dump` through a **Docker container** on Windows. If Docker Desktop is
not installed, `db dump` fails immediately with:

```
{"code":"LegacyDockerRunError","message":"failed to run docker. Docker Desktop is a prerequisite for local development..."}
```

This runbook does not use the Supabase CLI's dump/push commands for this
reason. Instead it uses native `pg_dump` / `pg_dumpall` / `psql` binaries,
installed once via:

```
winget install --id PostgreSQL.PostgreSQL.17 --interactive
```

In the installer wizard, select **Command Line Tools only** -- uncheck
PostgreSQL Server, pgAdmin 4, and Stack Builder. This installs
`pg_dump.exe`, `pg_dumpall.exe`, `psql.exe`, `pg_restore.exe`, and
`pg_basebackup.exe` to `C:\Program Files\PostgreSQL\17\bin\` with **no
Windows service and no initialized data directory** -- verified after
install by confirming `C:\Program Files\PostgreSQL\17\` has no `data\`
subdirectory and `Get-Service postgresql*` returns nothing.

If this is already installed, skip this step -- do not reinstall.

### 2.2 Connection strings -- Session Pooler, not Direct or Transaction Pooler

For both the source (production, read) and target (staging, write)
connections, use the **Session pooler** connection string from
**Dashboard -> [project] -> Settings -> Database -> Connection string ->
Session pooler tab**, not Direct connection and not Transaction pooler.

- **Not Direct connection**: Supabase's direct connection is IPv6-only
  unless the paid IPv4 add-on is purchased. Most networks can't reach it.
- **Not Transaction pooler** (port 6543): multiplexes connections
  per-transaction, which silently resets session-scoped state. The FK
  handling in Section 5 depends on `SET session_replication_role = replica`
  staying in effect across the entire data-restore file -- transaction
  pooling breaks this.
- **Session pooler** (port 5432, via Supavisor): preserves full session
  semantics, works over plain IPv4. This is what was used for both the
  production dump and the staging restore in this session.

The pooler hostname is **not** guaranteed identical across projects even in
the same region -- production resolved to `aws-1-us-east-1.pooler.supabase.com`
and staging to `aws-0-us-east-1.pooler.supabase.com` despite both being
us-east-1. Always copy the actual string per-project; don't assume.

The username has the project ref appended: `postgres.<project-ref>`, e.g.
`postgres.hphebzdftpjbiudpfcrs`. This is correct, not a typo -- Supavisor
uses it for routing.

If the connection string's password contains a character like `#` that is
URI-reserved (marks a fragment delimiter), don't try to percent-encode it.
Set it as a literal value in the `PGPASSWORD` environment variable instead
of embedding it in a single URI string -- libpq takes `PGPASSWORD` as a raw
literal, no escaping needed.

### 2.3 Script-file execution pattern (not inline commands)

Long inline PowerShell commands mixing path variables, `&` call operator
invocations, and `Remove-Item` calls have tripped a safety-check false
positive in this environment (a block containing an unrelated `$pgdump`
path variable and a later `Remove-Item Env:\...` call was blocked as an
attempted removal of `C:\Program Files`). The reliable pattern is:

1. Write the full script to a `.ps1` file inside the gitignored
   `backups/` folder (credentials live in the script, never in a committed
   file).
2. Show the complete file content for review before running.
3. Execute as a single short command: `powershell -File "path\to\script.ps1"`.

This is the pattern used for every dump/restore script in this session.

### 2.4 Password handling and rotation

Every DB password used in a session like this passes through the chat
transcript with the AI assistant and lives in a plaintext `.ps1` script
file (gitignored, never committed, but present on disk and in the
conversation transcript). Treat both as compromised for that password by
definition. **Rotate both the production and staging DB passwords at the
end of any session that follows this runbook**, and delete or strip the
password line from every `.ps1` script the session created. See Section 9.

---

## 3. Dump procedure (source project, READ-ONLY)

Run from repo root. All three commands only read from the source -- nothing
is written to the project being dumped.

```powershell
$env:PGPASSWORD = '<source DB password>'
$env:PGHOST = '<source pooler host from Dashboard>'
$env:PGPORT = '5432'
$env:PGUSER = 'postgres.<source-project-ref>'
$env:PGDATABASE = 'postgres'

# 1. Schema (public + extensions)
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" --schema-only --quote-all-identifiers --schema public --schema extensions -f "schema.sql"

# 2. Data (public only)
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" --data-only --quote-all-identifiers --schema public --column-inserts --rows-per-insert 100000 -f "data_body.sql"

# 3. Roles (documentation / completeness -- expect near-total no-op, see Section 6)
& "C:\Program Files\PostgreSQL\17\bin\pg_dumpall.exe" --roles-only --quote-all-identifiers --no-role-passwords --no-comments -f "roles.sql"
```

**Flag note:** the correct flag is `--quote-all-identifiers` (plural). A
singular `--quote-all-identifier` (as Supabase CLI's own `--dry-run` output
literally prints) is not a real `pg_dump` flag on vanilla PostgreSQL 17.10
and errors with "illegal option."

**Wrap the data dump manually** in the FK-safety guard (`pg_dump` does not
do this on its own -- see Section 5 for why):

```powershell
$body = Get-Content -Path "data_body.sql" -Raw
$final = "SET session_replication_role = replica;`r`n`r`n" + $body + "`r`nRESET ALL;`r`n"
[System.IO.File]::WriteAllText("data.sql", $final, [System.Text.UTF8Encoding]::new($false))
```

Use `[System.IO.File]::WriteAllText(...,[System.Text.UTF8Encoding]::new($false))`
for this, never `Set-Content -Encoding UTF8` or `Out-File -Encoding utf8`
-- both add a UTF-8 BOM in Windows PowerShell 5.1, which can trip other
tooling downstream.

**Expect a `pg_dump` warning**, not an error, on the data dump:

```
pg_dump: warning: there are circular foreign-key constraints among these tables:
pg_dump: detail: profiles
pg_dump: detail: organizations
...
pg_dump: hint: You might not be able to restore the dump without using --disable-triggers or temporarily dropping the constraints.
```

This is expected and handled -- see Section 5.

**Timing observed:** all three dumps for an ~11 MB data set (59 public
tables, ~14,000 total rows) completed in under a minute combined.

---

## 4. Where dump files live

Save dump output to a folder under the repo's `backups/` directory (already
gitignored), e.g. `backups/B2_2026-07-14/`. Never save dumps directly in
the repo root or anywhere not covered by `.gitignore`. After dumping,
always confirm with:

```powershell
git status --short
git check-ignore -v backups/<session-folder>/schema.sql backups/<session-folder>/data.sql backups/<session-folder>/roles.sql
```

Both should show the files are ignored and nothing shows as untracked.

---

## 5. The auth.users foreign-key problem (read this before restoring)

Since `auth` is intentionally excluded from this restore (Section 7), any
target database's `auth.users` table is empty or has different rows than
production's. Production has roughly 14 `public` tables with foreign keys
into `auth.users(id)` (profiles, lessons, generation_metrics,
user_subscriptions, events, invites, user_roles, and others) plus, as the
July 14, 2026 dump additionally surfaced, **circular foreign keys entirely
within `public`** among `profiles`, `organizations`, `lessons`, and
`org_shared_focus`. A plain data-only restore violates both classes of
constraint on nearly every insert.

**This is not unique to a staging drill.** A real disaster-recovery restore
into a brand-new project hits the identical problem if `auth.users` isn't
restored first. The correct DR order is: (1) restore `auth.users` via
Supabase's own project-level backup/PITR for that schema -- not a manual
dump/reconstruction -- **then** (2) apply the public-schema data. This
runbook's staging drill intentionally skips step 1, so the dangling FK
references described below are a deliberate, documented scope decision, not
a defect.

**Chosen mechanism: `SET session_replication_role = replica`**, wrapped
around the entire data-only file (Section 3). This suppresses FK
enforcement (implemented internally as triggers) for the session, and also
correctly suppresses ordinary business-logic triggers -- desirable here
since we want historical row values loaded verbatim, not recomputed.

Two alternatives were considered and rejected:
- **Seeding `auth.users` with stub rows** for referenced IDs -- rejected,
  since it requires either reading real auth data (out of scope) or
  fabricating rows with fake password hashes that look like a real user
  backup but aren't, and doesn't solve real DR either (which still needs
  the actual PITR restore).
- **Dropping and recreating the ~14 FK constraints** around the load --
  rejected, since Postgres validates existing rows by default on
  `ADD CONSTRAINT`, so this just re-fails on the same orphaned rows unless
  you also add `NOT VALID`, which is strictly more moving parts for the
  same end state as the `replica` approach.

**Known consequence, accepted:** after restore, rows in FK-constrained
tables (e.g. `profiles.id`) point at `auth.users` rows that don't exist in
the target. The constraint stays defined but was never validated against
those specific rows during load -- Postgres does not retroactively
re-validate, so this is stable and won't error later. This is expected and
matches "auth excluded from restore" (Section 7); it is not restore
corruption.

---

## 6. Restore procedure (target project)

Run in this exact order: **roles -> schema -> data -> sequence fixup**.
Every step logs full output to a file rather than the terminal.

```powershell
$env:PGPASSWORD = '<target DB password>'
$env:PGHOST = '<target pooler host from Dashboard>'
$env:PGPORT = '5432'
$env:PGUSER = 'postgres.<target-project-ref>'
$env:PGDATABASE = 'postgres'

$psqlExe = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

function Run-PsqlLogged($file, $logPath) {
    $raw = & $psqlExe -f $file -v ON_ERROR_STOP=0 2>&1
    $text = ($raw | Out-String)
    [System.IO.File]::WriteAllText($logPath, $text, [System.Text.UTF8Encoding]::new($false))
    return $LASTEXITCODE
}

Run-PsqlLogged "roles.sql"  "roles_restore_log.txt"
Run-PsqlLogged "schema.sql" "schema_restore_log.txt"
# CHECKPOINT -- read schema_restore_log.txt before proceeding. Grep for
# "table" / "relation" in ERROR lines. If any CREATE TABLE failed, stop and
# diagnose before touching data -- do not proceed to data restore.
Run-PsqlLogged "data.sql"   "data_restore_log.txt"
Run-PsqlLogged "sequence_fixup.sql" "sequence_fixup_log.txt"
```

**Critical: do not use `*>` or `Out-File -Encoding utf8` for these logs.**
Windows PowerShell 5.1's `*>` redirect operator (and `Out-File -Encoding
utf8`) writes **UTF-16LE** by default. A plain-ASCII `grep "ERROR"` against
that file silently returns zero matches -- not because there are no errors,
but because the bytes are UTF-16 and don't match an ASCII pattern. This
produced a false "clean" read during this session's first restore attempt.
The `Run-PsqlLogged` function above avoids this entirely by capturing
output into a variable and writing it with
`[System.IO.File]::WriteAllText(...,[System.Text.UTF8Encoding]::new($false))`
(true UTF-8, no BOM). If you ever do end up with a UTF-16 log, convert
before grepping:

```powershell
$content = Get-Content -Path $path -Raw -Encoding Unicode
[System.IO.File]::WriteAllText($utf8Path, $content, [System.Text.UTF8Encoding]::new($false))
```

### 6.1 Sequence fixup -- mandatory step, even when it's a no-op

`--column-inserts` (Section 3) writes explicit primary-key values into every
row rather than relying on `nextval()`. This means every sequence in
`public` is left at its fresh-project starting value even though rows now
exist with much higher IDs. Any future write that relies on a sequence
default risks colliding with an already-restored ID.

Run this after the data restore, every time, regardless of whether the
target schema is known to use serial/identity columns:

```sql
-- sequence_fixup.sql
DO $$
DECLARE
    r RECORD;
    max_val BIGINT;
BEGIN
    FOR r IN
        SELECT
            n.nspname AS schema_name,
            c.relname AS table_name,
            a.attname AS column_name,
            pg_get_serial_sequence(n.nspname || '.' || c.relname, a.attname) AS seq_name
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND pg_get_serial_sequence(n.nspname || '.' || c.relname, a.attname) IS NOT NULL
    LOOP
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I.%I', r.column_name, r.schema_name, r.table_name) INTO max_val;
        IF max_val > 0 THEN
            EXECUTE format('SELECT setval(%L, %s, true)', r.seq_name, max_val);
            RAISE NOTICE 'setval % to % (from %.%)', r.seq_name, max_val, r.table_name, r.column_name;
        ELSE
            RAISE NOTICE 'skipped % (%.% has no rows)', r.seq_name, r.table_name, r.column_name;
        END IF;
    END LOOP;
END $$;
```

**As of July 14, 2026, this schema uses zero serial/identity columns
anywhere** (confirmed by `grep -c "nextval(" schema.sql`,
`grep -c "GENERATED.*AS IDENTITY" schema.sql`, and
`grep -c "^CREATE SEQUENCE" schema.sql` all returning 0) -- so the fixup
correctly finds nothing and its log will contain only `DO` with no
`RAISE NOTICE` lines. That is the correct result for this schema today,
not a sign the step was skipped or broken. Keep running it anyway: if the
schema ever gains a serial/identity column, this step is what prevents a
silent future collision, and there's no cost to running it against an
all-UUID schema.

---

## 7. Expected errors and dispositions

These errors were captured from the actual July 14, 2026 restore logs.
They occur because this runbook uses raw `pg_dump`/`psql` rather than the
Supabase CLI's own dump command, which applies a large `sed` cleanup
pipeline to suppress exactly this class of error. That pipeline was
deliberately not replicated here -- errors are surfaced and dispositioned
explicitly instead of hidden, since a restore runbook should show what a
raw dump/restore actually does against a managed Supabase project.

### Roles (`roles.sql`) -- expect ~60 errors, all benign

| Error | Disposition |
|---|---|
| `role "X" already exists` | Expected. Every fresh Supabase project already has the full standard role set (anon, authenticated, service_role, postgres, etc.) provisioned at creation. |
| `"X" is a reserved role, only superusers can modify it` | Expected. Same reason -- these are platform-managed. |
| `permission denied to alter role` (SUPERUSER attribute) | Expected. Tenant `postgres` role can't alter SUPERUSER-attributed roles. |
| `permission denied to grant role / grant privileges as role` | Expected, same theme. |
| One `CREATE ROLE "cli_login_postgres"` may succeed | Harmless. This is the Supabase CLI's own ephemeral, self-expiring login credential (has a `VALID UNTIL` clause), not a real persistent role -- it got captured because it existed transiently during CLI diagnostics run against the source project before the dump. |

`roles.sql` is effectively audit-trail only; the target project's role set
needs no restoration.

### Schema (`schema.sql`) -- expect ~30 errors, all traced to platform-internal objects

**The one error type that would actually matter -- `CREATE TABLE` /
`relation` failures -- should be zero.** Check this explicitly:
`grep -i "ERROR" schema_restore_log.txt | grep -i "table\|relation"` should
return nothing. If it returns anything, stop before restoring data.

| Error | Disposition |
|---|---|
| `schema "public"` / `"extensions"` already exists | Expected -- both pre-provisioned on every project. |
| `permission denied to change default [privileges]` | Expected. From `ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"` -- platform-reserved. |
| `must be owner of function` (traced to `grant_pg_net_access`, `grant_pg_cron_access`, `pgrst_ddl_watch`, `pgrst_drop_watch`) | Expected. These are Supabase-platform-internal helper functions (extension access grants, PostgREST schema-reload watchers), not application code -- already provisioned, owned by an internal role. |
| `grant options cannot be granted back to your own grantor` | Expected, same functions as above. |
| `function "X" already exists` (same function names as above) | Expected, same reason. |
| `CREATE EVENT TRIGGER` / `ALTER EVENT TRIGGER` / `CREATE POLICY "cron_job_*"` / `ALTER TABLE "cron".*` permission denied | Expected if present -- cluster-wide or cron-schema objects a tenant role can't touch directly. |
| `CREATE PUBLICATION "supabase_realtime"` already exists | Expected -- every project gets a default empty Realtime publication. **Note:** production's table membership in this publication is NOT restored by this process. If Realtime parity in the target is ever needed, tables must be added to the publication manually. |
| `CREATE EXTENSION ... VERSION 'x.y'` fails as "not available" (possible, not observed July 14) | If it occurs: strip the `VERSION` clause from that one statement and retry it manually. Specific to `pg_tle`/`pgsodium`/`pgmq`, which pin exact versions that may not match the target's available build. |

No application table, view, function, or RLS policy from this project's own
migrations appeared in any error on July 14, 2026.

### Data (`data.sql`) -- expect zero errors

Confirmed clean on July 14, 2026: only `SET` / `INSERT 0 <n>` / `RESET`
lines, one `INSERT` per table with its row count. If FK errors appear here,
re-check that the `SET session_replication_role = replica` wrapper
(Section 3) is actually present at the top of the file and that the
connection used **Session pooler**, not Transaction pooler (Section 2.2) --
transaction pooling can silently drop the session-scoped `SET`.

---

## 8. Verification queries and pass criteria

Run each of these on **both** the source and target project via their
Dashboard SQL editors. Pass criteria reference **live counts at restore
time** -- re-derive them, do not carry forward the July 14, 2026 numbers
below as fixed targets. They're included only as a worked example of what a
passing restore looks like.

**1. Table counts per schema**
```sql
SELECT schemaname, count(*) AS table_count
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY schemaname;
```
Pass: `public` count matches **exactly** between source and target. Other
schemas (auth, storage, realtime, vault, cron, etc.) are expected to differ
-- not a gate. (July 14, 2026 example: both sides showed `public = 59`.)

**2. Row counts, largest public tables**
```sql
DROP TABLE IF EXISTS _tbl_counts;
CREATE TEMP TABLE _tbl_counts (table_name text, row_count bigint);
DO $$
DECLARE
    r RECORD;
    cnt BIGINT;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('SELECT count(*) FROM public.%I', r.tablename) INTO cnt;
        INSERT INTO _tbl_counts VALUES (r.tablename, cnt);
    END LOOP;
END $$;
SELECT * FROM _tbl_counts ORDER BY row_count DESC LIMIT 10;
```
Pass: every table name in the top 10 shows an identical row count on both
sides. (July 14, 2026 example: `events` 12347, `generation_metrics` 420,
`lessons` 369, `devotionals` 83, `rate_limits` 71, `reshape_metrics` 57,
`profiles` 52, `user_subscriptions` 41, `email_sequence_tracking` 31,
`teacher_preference_profiles` 29 -- identical on both sides.)

**3. Migration history comparison**
```sql
SELECT count(*) AS migration_count FROM supabase_migrations.schema_migrations;
```
Pass on source: matches the **live** count of `.sql` files in
`supabase/migrations/` at restore time --
`ls supabase/migrations | grep -c "\.sql$"` (verified **94** on July 14,
2026; do not assume this number later without re-counting, and exclude any
non-`.sql` files such as stray `.bak` copies from the count -- see the
July 14, 2026 session note in Section 10 for why that distinction matters).

Pass on target: **relation does not exist (error 42P01)**, or a count of 0
if the relation does exist. Either is a pass, not a failure. This restore
method dumps the public schema's *current end-state*, not migration
history, so `supabase_migrations.schema_migrations` is never touched on the
target. **This is a permanent, documented limitation of this restore
method, not a one-off gap:** if anyone later runs `supabase db push`
against the restored target expecting incremental migrations to apply
cleanly, it will attempt to replay the entire local migration history from
scratch against a database that already has their equivalent end-state
schema, and fail with mass "already exists" errors across nearly every
statement.

**4. RLS policy counts**
```sql
SELECT count(*) AS total_rls_policies FROM pg_policies WHERE schemaname = 'public';
```
Pass: exact match. (July 14, 2026 example: 147 on both sides.)

---

## 9. Session-end checklist

Every time this runbook is followed against real production credentials:

1. **Rotate the production DB password.** It passed through a chat
   transcript and a plaintext script file during the dump.
2. **Rotate the target/staging DB password**, same reason, from the
   restore side.
3. **Delete or strip the password line** from every `.ps1` script written
   during the session (they live under gitignored `backups/`, so they were
   never at risk of being committed, but they persist on disk with a live
   credential otherwise).
4. Confirm `git status --short` is clean and no dump/log/script file is
   tracked (`git check-ignore -v` on each, per Section 4).

---

## 10. What this restore does NOT cover, and where the real recovery path lives

| Excluded | Where it actually lives / how it's really recovered |
|---|---|
| `auth` schema (user accounts, password hashes, MFA, sessions) | Supabase's own project-level backups / point-in-time recovery (PITR) for the source project. GoTrue-managed; not something to reconstruct via manual SQL dump/restore across projects -- see Section 5. |
| `storage` schema objects / actual file blobs | The blobs themselves live in S3-backed storage, not Postgres, and are never touched by `pg_dump`. Recovery is on the storage/S3 side, via Supabase's storage backup mechanism, not this runbook. |
| Edge Function secrets | Whatever credentials-escrow process the team uses outside of git and outside of Postgres entirely. Not in scope for a database restore. |
| Edge Function deployments | Not restored by this process -- a restored project has the schema and data but no deployed functions. Redeploy separately, one at a time, per CLAUDE.md's edge-function deploy rules. |
| DNS records | Unrelated to the database; managed wherever the domain's DNS is hosted. |
| Realtime publication table membership | See Section 7 -- `supabase_realtime` publication exists in the target but with none of production's tables added to it. |
| Stripe configuration / webhooks | Untouched by this process; a restored staging project is not wired to live Stripe in any way. |

### Staging-parity gaps as of July 14, 2026 (carry-forward)

BLS-staging (`hfamquasdbiumpzjwqsy`) after this runbook has: the `public`
and `extensions` schema and data, verified via Section 8. It does **not**
have: any deployed Edge Functions, any Edge Function secrets/environment
config, Realtime publication membership, Stripe webhooks pointed at it, or
a populated `auth.users` (so no one can actually log in to it yet). Treat
it as a database-only staging environment until/unless a future session
explicitly extends it toward fuller parity.
