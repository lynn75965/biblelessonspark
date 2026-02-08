# PROJECT_MASTER.md - UPDATE SECTION
# Apply these changes to your PROJECT_MASTER.md
# Last Updated: February 7, 2026

---

## CHANGES TO APPLY:

### 1. Update Line 3 (Last Updated)
**FROM:**
```
**Last Updated:** February 4, 2026 (Three Stacks Framework defined, Self-Service Shepherd Entry planned, Lesson Visibility planned, Org Tiers updated)
```
**TO:**
```
**Last Updated:** February 7, 2026 (Self-Service Shepherd Entry Steps 1-6 COMPLETE, bundled checkout working)
```

---

### 2. Update Roadmap Items 1-7 (around lines 1045-1052)
**FROM:**
```
| 1 | **Self-Service Shepherd Entry** | Pastor creates org, selects tier, pays, becomes Org Manager — no admin intervention | 2 | 📋 Designed |
| 2 | **Shepherd Landing Page** | `/org` — dedicated landing page for church leaders with Shepherd-focused messaging | 2 | 📋 Designed |
| 3 | **Dashboard "Set Up Your Ministry Organization" prompt** | Post-signup prompt for logged-in users without an org | 2 | 📋 Designed |
| 4 | **Org Creation Form** | Collects: Org Name, Org Type (Church/Ministry/Network/Association/Convention/Other), Denomination, Org Leader Name/Email, Org Email | 2 | 📋 Designed |
| 5 | **Personal Subscription Check + Bundled Checkout** | Auto-detects if Org Leader has personal subscription; if not, adds $9/mo or $90/yr to checkout (matching org billing interval) | 2 | 📋 Designed |
| 6 | **Combined Stripe Checkout** | Single Stripe session with org tier + personal subscription (if needed) as line items | 2 | 📋 Designed |
| 7 | **Auto Org Creation on Payment** | Webhook creates org, assigns leader, activates pool — all in one transaction | 2 | 📋 Designed |
| 8 | **Interactive Org Manager Tour** | Post-purchase guided walkthrough: Lesson Pool → Invite Teachers → Shared Focus → Org Lessons | 2 | 📋 Designed |
```
**TO:**
```
| 1 | **Self-Service Shepherd Entry** | Pastor creates org, selects tier, pays, becomes Org Manager — no admin intervention | 2 | ✅ Complete (Feb 7) |
| 2 | **Shepherd Landing Page** | `/org` — dedicated landing page for ministry leaders with Shepherd-focused messaging | 2 | ✅ Complete (Feb 7) |
| 3 | **Dashboard "Set Up Your Ministry Organization" prompt** | Post-signup prompt for logged-in users without an org | 2 | 📋 Not Started |
| 4 | **Org Creation Form** | `/org/setup` — Collects: Org Name, Org Type, Denomination, Org Leader Name/Email, Org Email | 2 | ✅ Complete (Feb 7) |
| 5 | **Personal Subscription Check + Bundled Checkout** | Auto-detects if Org Leader has personal subscription; if not, adds $9/mo or $90/yr to checkout (matching org billing interval) | 2 | ✅ Complete (Feb 7) |
| 6 | **Combined Stripe Checkout** | Single Stripe session with org tier + personal subscription (if needed) as line items | 2 | ✅ Complete (Feb 7) |
| 7 | **Auto Org Creation on Payment** | Webhook creates org, assigns leader, activates pool — all in one transaction | 2 | ✅ Complete (Feb 7) |
| 8 | **Interactive Org Manager Tour** | Post-purchase guided walkthrough: Lesson Pool → Invite Teachers → Shared Focus → Org Lessons | 2 | 📋 Designed |
```

---

### 3. Insert NEW SECTION after line 1097 (after "---" following Self-Service spec)

**INSERT:**
```markdown
## SELF-SERVICE SHEPHERD ENTRY POINT (Steps 1-6 - COMPLETE ✅)

### Overview
Self-service flow enables ministry leaders to create organizations, subscribe, and begin managing their teaching team without Platform Admin intervention.

### Implementation Date: February 7, 2026

### Routes
| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/org` | Landing page - marketing, tier display | No |
| `/org/setup` | Org creation form + tier selection + checkout | Yes |
| `/org/success` | Post-payment confirmation + next steps | Yes |

### Files Created/Modified
| File | Purpose |
|------|---------|
| `src/pages/OrgLanding.tsx` | Landing page with 5 org tiers, monthly/annual toggle, inclusive language |
| `src/pages/OrgSetup.tsx` | 2-step form: Org Info → Plan Selection with personal sub check |
| `src/pages/OrgSuccess.tsx` | Success page with org details, lesson pool stats, next steps |
| `src/App.tsx` | Added routes: `/org`, `/org/setup`, `/org/success` |
| `supabase/functions/create-org-checkout-session/index.ts` | Modified for self-service mode with bundled checkout |
| `supabase/functions/stripe-webhook/index.ts` | Modified for auto org creation on payment |

### Edge Function: create-org-checkout-session
**Two Modes:**
1. **Existing Org Mode** (original) — Requires `organization_id`, upgrades existing org
2. **Self-Service Mode** (new) — Requires `orgMetadata`, creates org after payment

**Self-Service Request Body:**
```json
{
  "priceId": "price_xxx",
  "billingInterval": "annual",
  "orgMetadata": {
    "orgName": "First Baptist Church",
    "orgType": "church",
    "denomination": "Southern Baptist",
    "leaderName": "Pastor John",
    "leaderEmail": "pastor@church.org",
    "orgEmail": "office@church.org"
  },
  "includePersonalSubscription": true
}
```

**Bundled Checkout Line Items:**
- Line 0: Org subscription (priceId from frontend SSOT)
- Line 1: Personal subscription (if `includePersonalSubscription: true`)

**SSOT Compliance:**
- Org tier prices from `orgPricingConfig.ts` → frontend sends `priceId`
- Personal subscription prices from `pricing_plans` table (tier = 'personal')
- Fallback to hardcoded SSOT price IDs if database lookup fails

### Stripe Webhook: Self-Service Flow
**Trigger:** `checkout.session.completed` where `metadata.mode === 'self_service'`

**Actions:**
1. Creates organization record
2. Adds user as 'owner' in organization_members
3. Creates org_subscriptions record
4. If personal sub bundled: updates user_subscriptions
5. Sets user's primary_organization_id

### Language Updates (Inclusivity)
| From | To |
|------|-----|
| "AI-powered" | "BibleLessonSpark-powered" |
| "Church leaders" | "Ministry leaders" |
| "For Church Leaders" | "For Ministry Leaders" |
| "Set Up Your Church" | "Set Up Your Organization" |
| "church-wide" | "organization-wide" |

### Personal Subscription Bundling
- Frontend checks `user_subscriptions` for active personal tier
- If no subscription: shows info alert, adds to checkout automatically
- Matches billing interval (monthly/annual) to org selection
- Order Summary shows both line items with correct total

### Testing Verified
- [x] `/org` landing page displays all 5 tiers correctly
- [x] "Get Started" redirects to auth then `/org/setup`
- [x] Org creation form validates required fields
- [x] Tier selection shows correct prices (monthly/annual)
- [x] Personal subscription check works
- [x] Order Summary calculates total correctly ($190 + $90 = $280)
- [x] Stripe checkout shows both line items
- [x] Checkout allows promo codes (BETACHURCH2026)

### Remaining Work
- [ ] Item 3: Dashboard "Set Up Your Ministry Organization" prompt
- [ ] Item 8: Interactive Org Manager Tour
- [ ] Help page: Add "Organizations & Shepherds" section
- [ ] `/org` banner for logged-in users with existing org

### Key Decisions
- `/org` remains marketing URL (shareable by affiliates)
- `/org-manager` remains separate management dashboard
- Recommendation: Add banner on `/org` for logged-in org owners linking to `/org-manager`

---
```

---

### 4. Update SESSION HANDOFF NOTES (around line 1132)
**FROM:**
```
- **CURRENT PRIORITY** — Self-Service Shepherd Entry Point (items 1-8 in roadmap). Removes Platform Admin as bottleneck for org creation.
```
**TO:**
```
- **CURRENT PRIORITY** — Self-Service Shepherd Entry Point items 3 & 8 (dashboard prompt, interactive tour). Steps 1-6 COMPLETE as of Feb 7, 2026.
```

---

### 5. Update "📋 DESIGNED (Ready to Build)" section (around line 1173)
**FROM:**
```
- **Self-Service Shepherd Entry** - `/org` page, org creation form, bundled checkout, auto-creation on payment (next build priority)
```
**TO:**
```
- **Self-Service Shepherd Entry** - Steps 1-6 COMPLETE ✅ (Feb 7). Remaining: dashboard prompt, interactive tour
```

---

### 6. Update Launch Status section (around line 1254)
**FROM:**
```
- Self-Service Shepherd Entry: February 4, 2026 📋 DESIGNED (next build priority)
```
**TO:**
```
- Self-Service Shepherd Entry: February 7, 2026 ✅ Steps 1-6 COMPLETE (landing, setup, checkout, webhook, success)
```

---

### 7. Add to Key Commands section (around line 1142)
**ADD after `create-org-checkout-session` line:**
```
- `npx supabase functions deploy stripe-webhook` - Deploy Stripe webhook (handles self-service org creation)
```

---

## DEPLOYMENT INFO

**Tech Stack:**
- Frontend: React/TypeScript
- Backend: Supabase (PostgreSQL, Edge Functions, Auth)
- AI: Claude API
- Repo: GitHub
- **Deployment: Netlify** (NOT Lovable)

**Edge Functions Deployed Feb 7, 2026:**
- `create-org-checkout-session` — Self-service bundled checkout
- `stripe-webhook` — Auto org creation on payment

---

## NEXT SESSION PRIORITIES

1. **Help Page** — Add "Organizations & Shepherds" section, link from `/org` footer
2. **Dashboard Prompt** — "Set Up Your Ministry Organization" card for users without org
3. **`/org` Banner** — For logged-in users with existing org → link to `/org-manager`
4. **Interactive Tour** — Post-purchase walkthrough of Org Manager features
5. **returnTo Fix** — Auth component not respecting returnTo param after signup
