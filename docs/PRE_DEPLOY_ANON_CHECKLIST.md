# PRE-DEPLOY ANONYMOUS SMOKE TEST CHECKLIST

Last updated: July 14, 2026

---

## WHEN REQUIRED

Before approving any deploy that touches RLS policies, table grants,
anon-facing pages, auth flows, or edge functions called from public pages.
Optional but recommended for all other deploys.

## WHY

Public paths are designed to run through service-role edge functions, but
the June 2026 security audit flagged "unknown call paths" (browser anon-key
access) as a residual risk that code review cannot fully discharge. This
test catches anon breakage before users do.

## HOW

Use a private/incognito browser window with NO login session. Test against
localhost:8080 pre-deploy; re-run against biblelessonspark.com post-deploy.

---

## CHECKLIST

- [ ] Landing page loads without errors (check browser console for red
      errors).
- [ ] Pricing page loads and displays all tiers with correct prices.
- [ ] Blog (if public) loads; individual post opens.
- [ ] Signup flow: create account with a throwaway email -> verification
      email arrives -> verification link works and lands on the correct
      biblelessonspark.com page (NOT any legacy/dead domain).
- [ ] Login page loads; password reset request sends email.
- [ ] Toolbelt public pages: load each public toolbelt/parable page; submit
      the email-capture form with a test address -> confirm the capture row
      appears in `toolbelt_email_captures` -> delete the test row.
- [ ] Shared-content link (`/share/:token`): open a known-good share link
      logged out -> content renders.
- [ ] Invite accept page: open a known-good invite link logged out -> invite
      card renders (name/org display, no error).
- [ ] Console/network sweep: on each page above, confirm no 401/403/500
      responses in the network tab for resources the page needs.
- [ ] Cleanup: delete any test accounts, captures, or rows created during
      the test.

---

## PASS CRITERIA

All 10 items green. Any failure = HOLD the deploy, diagnose root cause
before proceeding.
