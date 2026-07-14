# Email Deliverability -- BibleLessonSpark

Last updated: July 14, 2026 (Session B1: Email Deliverability Hardening + Health Monitor)

This document is the reference for BibleLessonSpark's transactional/marketing
email posture: every code path that sends mail, the DNS configuration that
authenticates it, and the inbox-placement results that prove it lands.
Re-run the test procedure at the bottom whenever a sending path, the sending
domain, or DNS records change.

---

## 1. Sending Infrastructure

- **Provider:** Resend (`https://api.resend.com/emails`) -- the ONLY email
  provider used by BibleLessonSpark. No other transactional email service is
  wired into the codebase.
- **Sending domain:** biblelessonspark.com
- **From addresses:** `noreply@biblelessonspark.com` (transactional/system) or
  `support@biblelessonspark.com` (account-lifecycle notices where a reply is
  meaningful -- org deletion, team dissolution).
- **From-address SSOT:** `supabase/functions/_shared/branding.ts` ->
  `getEmailFrom(branding)` returns `"BibleLessonSpark <noreply@biblelessonspark.com>"`
  by resolving `branding.email.fromEmail` (DB-driven via `get_branding_config`
  RPC, with `FALLBACK_BRANDING` as the hardcoded fallback if that RPC fails).
  `getReplyTo(branding)` resolves the reply-to address the same way.
- Four of the eleven sending paths below bypass the SSOT helper and hardcode
  the from-address as a string literal instead of calling `getEmailFrom()`.
  This is a known, accepted inconsistency, not a bug -- see the sending-path
  inventory below for which four.

---

## 2. Sending-Path Inventory (11 confirmed)

Verified July 14, 2026 by grepping every `supabase/functions/**/index.ts` for
Resend usage (`api.resend.com/emails`, `getEmailFrom`, `Resend(...)`). Exactly
11 edge functions send mail; none use any other provider.

| # | Function | Purpose | From address | Via SSOT helper? |
|---|---|---|---|---|
| 1 | send-focus-notification | Notifies org members when an organization "Focus" item is created/updated | noreply@ | Yes (`getEmailFrom`) |
| 2 | send-invite | Org invitation email | noreply@ | Yes (`getEmailFrom`) |
| 3 | send-auth-email | Supabase auth hook: signup/magic-link/recovery/email-verification | noreply@ | Yes (`getEmailFrom`) |
| 4 | send-toolbelt-reflection | Sends a caller-authored toolbelt reflection to a user-supplied address | noreply@ | No -- hardcoded literal |
| 5 | send-sequence-email | Bulk onboarding email-sequence sender (cron-driven) | noreply@ | No -- hardcoded literal |
| 6 | send-lesson-email | Emails a generated lesson to the teacher | noreply@ | Yes (`getEmailFrom`), reply-to via `getReplyTo` |
| 7 | approve-org-deletion | Notifies org contacts an org deletion request was approved/closed | support@ | No -- hardcoded literal |
| 8 | request-org-deletion | Notifies org contacts a deletion request was filed | support@ | No -- hardcoded literal |
| 9 | admin-delete-user | Notifies Teaching Team members when their team is dissolved (admin-initiated user deletion) | support@ | No -- hardcoded literal |
| 10 | send-toolbelt-sequence | Toolbelt-specific onboarding email-sequence sender (cron-driven) | noreply@ | No -- hardcoded literal |
| 11 | notify-team-invitation | Teaching Team invitation email | noreply@ | Yes (`getEmailFrom`) |

**Reply-to:** all confirmed paths that set an explicit `reply_to` use
`support@biblelessonspark.com` (either via `getReplyTo(branding)` or a
matching hardcoded literal).

---

## 3. Bugs Found and Fixed This Session

### Bug 1 -- resend-verification: dead redirect domain
**Found/fixed:** July 13, 2026 (commit cdd587f, Lovable-scaffold-purge session)
`redirectTo` was built as
`` `${SUPABASE_URL.replace('.supabase.co', '.lovable.app')}/setup` `` -- every
"resend verification email" click sent real users to a nonexistent Lovable
preview domain instead of the live site. Fixed by importing `getBranding` +
`getBaseUrl` from `_shared/branding.ts` (the same SSOT pattern
notify-team-invitation already used) and building
`` `${getBaseUrl(branding)}/setup` ``, which correctly resolves to
`https://biblelessonspark.com/setup`.

### Bug 2 -- send-focus-notification: 6-month-stale deploy sending from a dead domain
**Found/fixed:** July 13, 2026 (commit ad10ef5)
The *deployed* function (not the git source) was frozen at commit 4aacf1f,
roughly six months stale -- predating the domain-rename cleanup (commit
0ba2764). It silently sent from the dead `lessonsparkusa.com` domain, which
Resend rejected on every send with a 403 `validation_error`. Git source
already had the correct domain reference; the deployed artifact simply
hadn't been redeployed since the rename. Fixed by routing the from-address
through `getEmailFrom(branding)` (removing the last hardcoded-domain literal
in that file) and redeploying via
`npx supabase functions deploy send-focus-notification --use-api`.
Verified live post-deploy.

**Pattern to watch for:** a function's *live deployed code* can silently
drift from its *git source* indefinitely -- there is no CI check today that
compares a deployed function's bundle against the current git HEAD. Two
more functions (`create-checkout-session`, `create-portal-session`) are
flagged in PROJECT_MASTER.md as carrying comment-only diffs against HEAD and
are suspected of the same kind of drift; a proper fix is a B3 CI staleness
check (deployed-timestamp vs. git-commit-date), tracked as a carry-forward.

---

## 4. DNS Records

Captured live via `nslookup`, July 14, 2026.

- **Send subdomain SPF record:**
  `send.biblelessonspark.com TXT "v=spf1 include:amazonses.com ~all"`
- **Send subdomain MX record:**
  `send.biblelessonspark.com MX 10 feedback-smtp.us-east-1.amazonses.com`
- **DKIM record:**
  `resend._domainkey.biblelessonspark.com TXT "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDQY/wpReMdAyZubUntt0nkeYi6hOF2vF9xUUDwZ+giEqzRd8KHQOMxHRRgVtb7+wJVtOIkA4LUhiVnQQYvP9UmAtJxnHNSOGbgxyVvVcKGHyTV3hZ/KeMiMaWWWsEaiRZsTwB2elOi+Yyhf83r6XX0HQGV5CRnsjNq+ZMlZtgG+wIDAQAB"`
- **DMARC record:**
  `_dmarc.biblelessonspark.com TXT "v=DMARC1; p=none; rua=mailto:dmarc-reports@biblelessonspark.com; fo=1;"`

---

## 5. Inbox Placement Matrix

All 11 sending paths tested July 13, 2026; 11/11 inboxed across Gmail,
Outlook, and Yahoo test addresses; zero spam placements. Per-send detail
(which address received which of the 11 paths, exact timestamps) was not
preserved -- this is a summary-level record, not a reconstruction. Re-run
the full per-path matrix on the next DNS or sending-domain change and
preserve the detail that time.

---

## 6. Re-Test Procedure

Run this whenever a sending path changes, the sending domain's DNS changes,
or Resend account/domain configuration changes.

1. **Confirm DNS is live** -- verify SPF/DKIM/DMARC/MX records have
   propagated (a `dig`/`nslookup` against the send subdomain and root domain,
   or the DNS host's own propagation checker).
2. **Use real, disposable test inboxes** -- one each on Gmail, Outlook, and
   Yahoo at minimum. Per [[feedback_never_invent_test_emails]], never
   fabricate a throwaway address; use real inboxes you control (Gmail
   plus-addressing off a confirmed account is acceptable).
3. **Exercise every one of the 11 sending paths** listed above at least once
   -- either through the real app flow that triggers each function, or (for
   a fast one-off check) an isolated replica script that copies the exact
   `from`/`reply_to`/subject/HTML from the live function's source, sent
   directly via the Resend API, so no real user data or tracking tables are
   touched. (See the git history for
   `scripts/tmp-deliverability-sequence-test.ps1` -- a one-off script of
   this shape used for the sequence-email paths this session; delete any
   such script after use, never commit it.)
4. **Check placement, not just delivery** -- confirm each test email lands
   in the primary inbox, not spam/junk/promotions, on every provider tested.
   A "delivered" status from Resend's dashboard does not confirm inbox
   placement.
5. **Record results** in the placement matrix above (provider, address,
   result, date) and update this document.
6. **Clean up test data** -- delete any test auth accounts created, any
   throwaway organizations/teams, and remove test addresses from
   `toolbelt_email_tracking` / `toolbelt_email_captures` /
   `email_sequence_tracking` so they don't pollute real usage metrics or
   receive future real sends. See PROJECT_MASTER.md's July 14, 2026 test-data
   cleanup entry for the exact SQL pattern (lookup-first via
   `pg_catalog.pg_constraint` FK checks, not `information_schema` -- that
   view is ownership-filtered in Supabase and under-reports FKs referencing
   `auth.users`).
