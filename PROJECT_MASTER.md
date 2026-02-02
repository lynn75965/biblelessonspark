# PROJECT_MASTER.md
## BibleLessonSpark - Master Project Documentation
**Last Updated:** February 2, 2026 (Email Lesson Delivery Phase 25 COMPLETE, Series/Theme Mode Phase 24 IN PROGRESS)
**Launch Date:** January 27, 2026 ✅ LAUNCHED

---

## QUICK REFERENCE

| Item | Value |
|------|-------|
| **Local URL** | http://localhost:8080 |
| **Production URL** | https://biblelessonspark.com |
| **Legacy URL** | https://lessonsparkusa.com (redirects to production) |
| **Branch** | biblelessonspark |
| **Local Path** | C:\Users\Lynn\lesson-spark-usa |
| **Supabase Project** | hphebzdftpjbiudpfcrs |
| **Platform Mode** | Production (as of Jan 10, 2026) |
| **Launch Date** | January 27, 2026 |
| **Reset Logic** | Rolling 30-day periods (per-user, not calendar month) |

---

## ARCHITECTURE PRINCIPLES

### SSOT (Single Source of Truth)
- **Frontend drives backend** - All constants defined in `src/constants/` and `src/config/`
- Backend mirrors auto-generated via `npm run sync-constants`
- Database branding synced via `npm run sync-branding`
- Database tier config synced via `npm run sync-tier-config`
- **Database org pricing synced via `npm run sync-org-pricing`**
- Never edit `supabase/functions/_shared/` directly

### Key SSOT Files
| File | Purpose |
|------|---------|
| `src/constants/ageGroups.ts` | Age group definitions |
| `src/constants/bibleVersions.ts` | Bible versions + copyright notices |
| `src/constants/theologyProfiles.ts` | 10 Baptist theological traditions |
| `src/constants/lessonStructure.ts` | 8-section lesson framework |
| `src/constants/devotionalConfig.ts` | DevotionalSpark configuration |
| `src/constants/toolbeltConfig.ts` | Teacher Toolbelt configuration |
| `src/constants/organizationConfig.ts` | **Organization hierarchy, types, visibility, health rules (Nested Org SSOT)** |
| `src/constants/orgManagerConfig.ts` | Org Manager drill-down tab configuration |
| `src/constants/pricingConfig.ts` | Individual tier sections, limits (MASTER for tier_config) |
| `src/constants/orgPricingConfig.ts` | **Organization billing tiers, packs, onboarding (Phase 13)** |
| `src/constants/trialConfig.ts` | Trial system configuration (rolling 30-day) |
| `src/constants/tenantConfig.ts` | White-label tenant configuration |
| `src/constants/feedbackConfig.ts` | Feedback mode (beta/production), auto-popup config |
| `src/constants/systemSettings.ts` | Platform mode helpers |
| `src/constants/uiSymbols.ts` | UI symbols (UTF-8 safe) |
| `src/constants/metricsViewerConfig.ts` | Chart colors for analytics |
| `src/constants/transferRequestConfig.ts` | Transfer request workflow statuses |
| `src/constants/emailDeliveryConfig.ts` | **Email lesson delivery + class roster config (Phase 25)** |
| `src/constants/seriesConfig.ts` | **Series/Theme Mode limits, statuses, interfaces (Phase 24)** |
| `src/config/branding.ts` | **SSOT for ALL colors** |
| `src/config/brand-values.json` | **SSOT for colors/typography** |

### Sync Commands
| Command | Purpose |
|---------|---------|
| `npm run sync-constants` | Syncs src/constants/ → supabase/functions/_shared/ |
| `npm run sync-branding` | Syncs branding → branding_config table |
| `npm run sync-tier-config` | Syncs individual tier config → tier_config table |
| `npm run sync-org-pricing` | **Syncs org pricing → org_tier_config, lesson_pack_config, onboarding_config** |

---

## NESTED ORGANIZATION ARCHITECTURE (Phases N1-N7 - COMPLETE ✅)

### Overview
The Nested Organization Architecture enables hierarchical relationships between Baptist organizations using a "Lego Block" design philosophy. Every organization is a sovereign, self-contained unit with identical internal structure. The `parent_org_id` column is the connector stud that describes how blocks *choose* to relate, never how they're *required* to behave. Baptist autonomy is honored from database to UI.

### Architectural Metaphor: Lego Blocks
- Every org is a complete, sovereign block (members, pool, lessons, subscription, branding)
- `parent_org_id` is a connector stud — it describes a relationship, not a dependency
- Detaching a block (setting `parent_org_id` to null) leaves the block fully functional
- No inheritance of subscriptions, billing, or member data between levels
- Focus sharing is voluntary — suggestion, never enforcement

### Hierarchy Depth (SSOT: organizationConfig.ts → ORG_HIERARCHY)
| Level | Name | Example |
|-------|------|---------|
| 1 | Organization | Convention / Network / Standalone Church |
| 2 | Sub-Organization | Association / Regional Group / Church (under convention) |
| 3 | Group | Church (under association) / Ministry (under standalone church) |
| 4 | Team | Ministry (under church under association) |

Maximum depth: 4 levels (enforced by Edge Function per SSOT `ORG_HIERARCHY.maxDepth`)

### Organization Types (SSOT: organizationConfig.ts → ORG_TYPES)
| Type | Label | Description |
|------|-------|-------------|
| `church` | Church | Local congregation (default) |
| `association` | Association | Regional grouping of churches |
| `network` | Network | Church planting or cooperative ministry network |
| `convention` | Convention | State or national Baptist convention |
| `ministry` | Ministry | Specialized ministry within a church |
| `enterprise` | Enterprise | Convention, denomination, or large institutional organization |

### SSOT Configuration (organizationConfig.ts)
The SSOT defines all hierarchy rules, visibility boundaries, health indicators, and shared focus behavior:

| Config Section | Purpose |
|----------------|---------|
| `ORG_TYPES` | Valid organization type definitions with labels and descriptions |
| `ORG_HIERARCHY` | Max depth (4), level name labels |
| `CHILD_ORG_CREATION` | Who can create child orgs (platform_admin, parent_org_manager) |
| `PARENT_VISIBILITY` | What summary data a parent sees about children (allowed vs. denied fields) |
| `CHILD_ORG_HEALTH` | Health status derivation rules (green/yellow/red with worst-condition-wins) |
| `SHARED_FOCUS_INHERITANCE` | Focus sharing mode (voluntary), adopt behavior (copy), parent visibility |
| `DISCONNECT_RULES` | Who can initiate disconnect, what's impacted for child and parent |

### Privacy Boundary (SSOT: PARENT_VISIBILITY)
**What a parent Org Manager CAN see about child orgs:**
- Organization name, Org Manager name, member count
- Lessons generated this month, pool utilization percentage
- Subscription tier, Shared Focus setting, health status

**What a parent Org Manager CANNOT see:**
- Individual member names, lesson content, teacher activity details

### Health Status Indicators (SSOT: CHILD_ORG_HEALTH)
| Status | Color | Hex | Condition |
|--------|-------|-----|-----------|
| Green | Healthy | `#22C55E` | Active subscription, pool > 20%, lessons generated recently |
| Yellow | Attention | `#EAB308` | Pool between 10-20% OR no lessons in 14+ days |
| Red | Critical | `#EF4444` | No active subscription OR pool exhausted OR no lessons in 30+ days |

Logic: worst-condition-wins (if any indicator is red, overall status is red)

### Database Schema Changes (N1)

#### organizations (columns added for hierarchy)
| Column | Type | Purpose |
|--------|------|---------|
| `org_type` | text | Organization type (default: 'church'). SSOT: organizationConfig.ts |
| `parent_org_id` | uuid | Parent org for hierarchy. FK to organizations(id), ON DELETE SET NULL |
| `org_level` | integer | Hierarchy depth (1=top-level, max 4). Computed by Edge Function per SSOT |
| `beta_access_level` | text | For beta_program orgs: 'private' or 'public' |

#### org_shared_focus (column added for N6)
| Column | Type | Purpose |
|--------|------|---------|
| `adopted_from_focus_id` | uuid | Links adopted focuses back to parent's original (NULL if self-created) |

#### Indexes
- `idx_organizations_parent` on `organizations(parent_org_id)` — query performance for hierarchy lookups
- `idx_organizations_type` on `organizations(org_type)` — query performance for type filtering

### Database Functions (N2, N6, N7)

| Function | Type | Purpose |
|----------|------|---------|
| `is_org_manager(org_id)` | SECURITY DEFINER | Returns true if current user is `created_by` of specified org |
| `get_managed_org_ids()` | SECURITY DEFINER | Returns all org IDs managed by current user |
| `is_ancestor_org_manager(org_id)` | SECURITY DEFINER | Walks up parent chain (max 4 levels) checking for management |
| `get_child_org_summaries(parent_id)` | SECURITY DEFINER | Returns child org cards with 13 fields including health lights |
| `get_parent_active_focus(child_org_id)` | SECURITY DEFINER | Child org sees parent's current active shared focus |
| `adopt_parent_focus(parent_focus_id, child_org_id)` | SECURITY DEFINER | Copies parent's focus into child's org_shared_focus (one-time copy) |
| `get_focus_adoption_map(parent_org_id)` | SECURITY DEFINER | Parent sees which children adopted the focus (informational only) |
| `disconnect_org_from_network(org_id)` | SECURITY DEFINER | Sets parent_org_id to null, resets org_level to 1 |

### RLS Policy (N2)

| Policy | Table | Purpose |
|--------|-------|---------|
| `parent_org_manager_view_children` | organizations | Parent Org Manager can SELECT child org rows. Privacy enforced by separate table RLS — organization_members and lessons tables retain their existing policies |

Note: Org Manager is identified by `organizations.created_by` (uuid), not a role in organization_members. The only role in organization_members is `member`.

### Frontend Components

#### New Components (N3-N7)
| Component | Location | Purpose |
|-----------|----------|---------|
| `ChildOrgDashboard.tsx` | `src/components/org/` | Network tab — displays child org cards with health indicators |
| `ChildOrgCard.tsx` | `src/components/org/` | Individual child org summary card with health light, adoption badge, disconnect hover |
| `CreateChildOrgDialog.tsx` | `src/components/org/` | Dialog for creating child organizations under a parent |
| `ParentFocusBanner.tsx` | `src/components/org/` | Banner shown to child orgs when parent has active focus — "Adopt" or "Adopted" state |
| `DisconnectNetworkDialog.tsx` | `src/components/org/` | Confirmation dialog showing what changes vs. what stays same on disconnect |

#### New Hooks (N3-N7)
| Hook | Location | Purpose |
|------|----------|---------|
| `useChildOrgSummaries.ts` | `src/hooks/` | Fetches child org data via `get_child_org_summaries()` RPC |
| `useParentSharedFocus.ts` | `src/hooks/` | Child org's view of parent's active focus + adopt function |
| `useFocusAdoptionMap.ts` | `src/hooks/` | Parent's view of which children adopted the focus |
| `useDisconnectFromNetwork.ts` | `src/hooks/` | Calls `disconnect_org_from_network()` RPC |

#### Modified Components (N3-N7)
| Component | Changes |
|-----------|---------|
| `OrgManager.tsx` | Added Network tab with ChildOrgDashboard, Create Child button, ParentFocusBanner in Focus tab, Disconnect card in Settings tab for child orgs |
| `OrgLessonsPanel.tsx` | Updated with funding source column |

### Phase N Progress

| Phase | Description | Date | Status |
|-------|-------------|------|--------|
| N1 | Database schema + SSOT (organizationConfig.ts) | Jan 31, 2026 | ✅ Complete |
| N2 | RLS policies + 4 secure functions | Jan 31, 2026 | ✅ Complete |
| N3 | Network dashboard UI (ChildOrgDashboard, ChildOrgCard) | Jan 31, 2026 | ✅ Complete |
| N4 | Child org creation workflow (CreateChildOrgDialog) | Jan 31, 2026 | ✅ Complete |
| N5 | Admin hierarchy display | Jan 31, 2026 | ✅ Complete |
| N6 | Shared Focus Awareness (ParentFocusBanner, voluntary adoption) | Jan 31, 2026 | ✅ Complete |
| N7 | Disconnect Workflow (DisconnectNetworkDialog, clean separation) | Jan 31, 2026 | ✅ Complete |

### Key Design Decisions
- **No business-logic constraints in database** — all validation in Edge Functions per SSOT
- **Org Manager = `organizations.created_by`** — not a role in organization_members
- **Focus adoption is one-time copy, not live sync** — child can modify or ignore freely after adoption
- **Disconnect preserves everything** — members, pool, lessons, subscription, shared focus, branding all untouched
- **Parent visibility is informational only** — no enforcement capability
- **Health status uses worst-condition-wins** — if any indicator is red, overall is red

### What the Platform Now Supports End-to-End
A Convention can create an Association, which can create a Church, which can create a Ministry — 4 levels deep. Parent orgs see child health at a glance. Parents can suggest a shared focus; children voluntarily adopt it. Any child can disconnect cleanly at any time with zero data loss.

---

## EMAIL LESSON DELIVERY SYSTEM (Phase 25 - COMPLETE ✅)

### Overview
Email Lesson Delivery enables paid subscribers (Personal tier or Admin) to email lesson teasers and student handouts (Section 8) directly to students via the Resend API. Teachers can save named email rosters (class lists) for quick loading. Emails are branded with BibleLessonSpark styling and sent individually for privacy.

### SSOT Architecture
```
src/constants/emailDeliveryConfig.ts (FRONTEND MASTER)
        ↓ npm run sync-constants
supabase/functions/_shared/emailDeliveryConfig.ts (BACKEND MIRROR)
        ↓
send-lesson-email Edge Function reads config (never hardcoded)
```

### SSOT Configuration (emailDeliveryConfig.ts)
| Config Section | Purpose |
|----------------|---------|
| `EMAIL_DELIVERY_CONFIG` | Max recipients (25), max message length (500), tier-gating rules |
| `EMAIL_DELIVERY_LABELS` | All UI strings for dialog, buttons, toasts |
| `EMAIL_DELIVERY_VERSION` | Version string for Resend tag tracking |
| `ROSTER_CONFIG` | Roster limits (max 10 rosters, max 25 emails each, 50-char name) |
| `buildEmailSubject()` | Constructs subject line from sender name + lesson title |
| `isValidEmail()` | Email validation regex |

### Email Content Strategy
Emails do NOT send the full lesson. Content is limited to:
1. **Lesson teaser** — From `lesson.metadata.teaser` (set during generation)
2. **Section 8: Student Handout** — Body content only, no section header

The `extractSection8Content()` function uses `parseSectionHeaderNumber()` to match multiple header formats:
- `## Section 8: Title` (markdown headers)
- `**Section 8: Title**` (bold markers)
- `## Section 8 – Title` (em-dash variant)
- `Section 8: Title` (plain text)

Sub-headers (###) within Section 8 are styled green in the email HTML.

### Database Table

#### email_rosters
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users, ON DELETE CASCADE |
| name | text | Roster name (max 50 chars, constraint enforced) |
| emails | text[] | Array of email addresses (max 25, constraint enforced) |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last modified |

- RLS enabled: users can only manage their own rosters
- Index: `idx_email_rosters_user_id` on `user_id`

### Edge Function: send-lesson-email

| Item | Value |
|------|-------|
| **Version** | 1.1.0 |
| **Delivery** | Resend API (individual emails per recipient for privacy) |
| **Auth** | Valid Supabase JWT required |
| **Tier Gate** | Paid subscribers only (personal or admin) |
| **Max Recipients** | 25 per call (from SSOT config) |
| **Tag Sanitization** | All Resend tag values sanitized (dots replaced with dashes/underscores) |

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `EmailLessonDialog.tsx` | `src/components/` | Email dialog with roster load/save/manage, personal message, lesson preview |
| `LessonExportButtons.tsx` | `src/components/` | **Updated: removed Share dropdown, added Email button** |
| `EnhanceLessonForm.tsx` | `src/components/dashboard/` | **Updated: passes isPaidUser + senderName props** |

### Phase 25 Progress

| Phase | Description | Date | Status |
|-------|-------------|------|--------|
| 25.0 | Edge function + SSOT + dialog + tier gating | Feb 1, 2026 | ✅ Complete |
| 25.1 | Class Email Rosters (database + inline UI) | Feb 1, 2026 | ✅ Complete |
| 25.2 | Resend tag sanitization fix (dots not allowed) | Feb 1, 2026 | ✅ Complete |
| 25.3 | Section 8 extraction fix (multi-format parser) | Feb 2, 2026 | ✅ Complete |

### Git Commits
| Commit | Message | Date |
|--------|---------|------|
| `81348d1` | Phase 25.1: Class Email Rosters | Feb 1, 2026 |
| `44dd1db` | Fix send-lesson-email: sanitize Resend tag values | Feb 1, 2026 |
| `88e2ac0` | Fix send-lesson-email: robust Section 8 extraction (## + ** formats) | Feb 2, 2026 |

### Key Design Decisions
- **Teaser + Section 8 only** — Full lesson never sent via email (protects content value)
- **Individual emails** — Each recipient gets their own email (no CC/BCC, privacy preserved)
- **Roster persistence** — Teachers save class lists once, load them instantly
- **Tier-gated** — Free users see upgrade prompt; paid users see email dialog
- **Frontend drives backend** — EmailLessonDialog defines the data contract; edge function mirrors it

---

## SERIES/THEME MODE (Phase 24 - ⚠️ IN PROGRESS)

### Overview
Series/Theme Mode enables multi-week sequential lesson planning with style consistency. Teachers name a series, set total lessons, and the system captures style metadata from Lesson 1 to maintain a unified teaching approach across subsequent lessons.

### SSOT Configuration (seriesConfig.ts)
| Config Section | Purpose |
|----------------|---------|
| `SERIES_LIMITS` | Min lessons (2), max lessons (12), max name length (100), max active series (10) |
| `SERIES_STATUSES` | in_progress, completed, abandoned |
| `SeriesStyleMetadata` | Style capture interface (8 fields + transition style) |
| `SeriesLessonSummary` | Per-lesson summary for content continuity |

### Database Table: lesson_series
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| series_name | text | Teacher-chosen series name |
| total_lessons | integer | Planned lesson count (2-12) |
| current_lesson | integer | Next lesson number |
| status | text | in_progress, completed, abandoned |
| style_metadata | jsonb | Captured from Lesson 1 for consistency |
| lesson_summaries | jsonb | Array of per-lesson summaries for continuity |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last modified |

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `seriesConfig.ts` | `src/constants/` | NEW SSOT — limits, statuses, interfaces |
| `useSeriesManager.ts` | `src/hooks/` | NEW hook — series CRUD, state management |
| `TeacherCustomization.tsx` | `src/components/dashboard/` | **MODIFIED — series selection UI replaces manual "Lesson X of Y"** |
| `EnhanceLessonForm.tsx` | `src/components/dashboard/` | **MODIFIED — wires useSeriesManager hook** |
| `freshnessOptions.ts` | `src/constants/` | **MODIFIED — re-exports SeriesStyleMetadata from seriesConfig (backward compat)** |

### Teacher Workflow
1. Select "Part of Series" in Lesson Sequence dropdown
2. "Start New Series" → name the series, set total lessons (2-12)
3. Generate Lesson 1 → style metadata captured automatically
4. Return later → select series from dropdown, lesson number auto-advances
5. Claude applies captured style + references previous lesson summaries
6. Final lesson includes series wrap-up

### Known Issues (In Progress)
- Series lesson count not tracking properly after first generation (shows 0 of N)
- `result.data.lesson` → `result.data.id` fix needed on lines 957-958 of EnhanceLessonForm
- Old duplicate files exist at `src/components/EnhanceLessonForm.tsx` and `src/components/TeacherCustomization.tsx` — correct location is `src/components/dashboard/`; duplicates should be deleted
- Phase 24 code exists locally but was not committed to git as of last known state

---

## ORGANIZATION BILLING SYSTEM (Phase 13 - COMPLETE ✅)

### Overview
Organization billing enables churches and associations to purchase shared lesson pools for their teachers. Uses a **lesson pool model** (not per-seat pricing) where organizations pay for pooled lessons shared among unlimited members.

### Pricing Structure

#### Organization Subscription Tiers
| Tier | Lessons/Month | Price/Mo | Price/Yr | Target Size |
|------|---------------|----------|----------|-------------|
| Starter | 25 | $29 | $290 | 2-10 teachers |
| Growth | 60 | $59 | $590 | 10-15 teachers |
| Ministry Full | 120 | $99 | $990 | 20-30 teachers |
| Enterprise | 250 | $179 | $1,790 | Large churches/associations |

#### Lesson Packs (One-Time, Never Expire)
| Pack | Lessons | Price |
|------|---------|-------|
| Small | 10 | $15 |
| Medium | 25 | $35 |
| Large | 50 | $60 |

#### Onboarding Options (One-Time)
| Option | Price | Description |
|--------|-------|-------------|
| Self-Service | $0 | Documentation + tutorials |
| Guided Setup | $99 | 30-min video call |
| White Glove | $249 | Full setup + training |

### Stripe Products (Live)

**Organization Subscriptions:**
| Tier | Product ID | Annual Price ID | Monthly Price ID |
|------|------------|-----------------|------------------|
| Starter | prod_Tt8suAq0Ba5Kyy | price_1SvMcVI4GLksxBfVLG7k1F12 | price_1SvMaWI4GLksxBfVn6FVKKiG |
| Growth | prod_Tt9AA0Mr8ggFm8 | price_1SvMsCI4GLksxBfVDy8YjZYu | price_1SvMt9I4GLksxBfV5hc6Rsox |
| Ministry Full | prod_Tt9GvWKjoPutRs | price_1SvMxmI4GLksxBfVVOY3cOpb | price_1SvN1lI4GLksxBfVEpU7eKq5 |
| Enterprise | prod_Tt9MztPmhtJnZ2 | price_1SvN4CI4GLksxBfVgdN7qjsr | price_1SvN5RI4GLksxBfVrtZ2aDN9 |

**Lesson Packs:**
| Pack | Product ID | Price ID |
|------|------------|----------|
| Small (10) | prod_Tt9VeUiXCse3Vf | price_1SvNC3I4GLksxBfVzzp79bQP |
| Medium (25) | prod_Tt9c9VetZN2qmn | price_1SvNImI4GLksxBfVl7fegaD8 |
| Large (50) | prod_Tt9fZtm3WFiKlh | price_1SvNM4I4GLksxBfVhC8Gt23X |

**Onboarding:**
| Option | Product ID | Price ID |
|--------|------------|----------|
| Guided Setup | prod_Tt9iETbbQosHiR | price_1SvNOjI4GLksxBfVddpRLRoS |
| White Glove | prod_Tt9lvUjuO8WJXK | price_1SvNRyI4GLksxBfVQCm17bXq |

### SSOT Architecture
```
src/constants/orgPricingConfig.ts (FRONTEND MASTER)
        ↓ npm run sync-org-pricing
org_tier_config, lesson_pack_config, onboarding_config (DATABASE)
        ↓
Edge Functions read from database (never hardcoded)
```

### Database Tables

#### org_tier_config
| Column | Type | Purpose |
|--------|------|---------|
| tier | text | Primary key (starter, growth, ministry, enterprise) |
| display_name | text | UI display name |
| lessons_limit | integer | Monthly lesson allocation |
| price_monthly | numeric | Monthly price in dollars |
| price_annual | numeric | Annual price in dollars |
| stripe_product_id | text | Stripe product ID |
| stripe_price_id_monthly | text | Stripe monthly price ID |
| stripe_price_id_annual | text | Stripe annual price ID |
| is_active | boolean | Enable/disable tier |

#### lesson_pack_config
| Column | Type | Purpose |
|--------|------|---------|
| pack_type | text | Primary key (small, medium, large) |
| display_name | text | UI display name |
| lessons_included | integer | Number of lessons in pack |
| price | numeric | One-time price in dollars |
| stripe_product_id | text | Stripe product ID |
| stripe_price_id | text | Stripe price ID |
| is_active | boolean | Enable/disable pack |

#### onboarding_config
| Column | Type | Purpose |
|--------|------|---------|
| onboarding_type | text | Primary key (self_service, guided_setup, white_glove) |
| display_name | text | UI display name |
| description | text | What's included |
| price | numeric | One-time price (0 for self-service) |
| stripe_product_id | text | Stripe product ID (null for free) |
| stripe_price_id | text | Stripe price ID (null for free) |
| is_active | boolean | Enable/disable option |

#### organizations (billing columns)
| Column | Type | Purpose |
|--------|------|---------|
| subscription_tier | text | Current tier (starter, growth, etc.) |
| stripe_customer_id | text | Stripe customer ID |
| stripe_subscription_id | text | Stripe subscription ID |
| subscription_status | text | active, past_due, cancelled |
| lessons_limit | integer | Monthly allocation from tier |
| lessons_used_this_period | integer | Usage counter |
| bonus_lessons | integer | From lesson pack purchases |
| current_period_start | timestamp | Billing period start |
| current_period_end | timestamp | Billing period end |
| billing_interval | text | monthly or annual |

#### lessons (column added - Phase 13.6)
| Column | Type | Purpose |
|--------|------|---------|
| org_pool_consumed | boolean | TRUE if lesson consumed from org pool, FALSE if personal tier |

#### org_lesson_pack_purchases
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| pack_type | text | small, medium, large |
| lessons_added | integer | Lessons credited |
| amount_paid | numeric | Payment amount |
| stripe_checkout_session_id | text | Stripe session ID |
| purchased_by | uuid | FK to auth.users |
| purchased_at | timestamp | Purchase timestamp |

#### org_onboarding_purchases
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| organization_id | uuid | FK to organizations |
| onboarding_type | text | guided_setup, white_glove |
| amount_paid | numeric | Payment amount |
| status | text | pending, scheduled, completed |
| scheduled_date | timestamp | Session date (if applicable) |
| completed_date | timestamp | Completion date |
| purchased_by | uuid | FK to auth.users |

### Edge Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `create-org-checkout-session` | Creates Stripe checkout for org subscriptions | ✅ Deployed |
| `purchase-lesson-pack` | Creates Stripe checkout for lesson packs | ✅ Deployed |
| `purchase-onboarding` | Creates Stripe checkout for onboarding | ✅ Deployed |
| `org-stripe-webhook` | Handles Stripe events for org billing | ✅ Deployed |
| `generate-lesson` | **Modified to check/consume org pool first (Phase 13.6)** | ✅ Updated |

### Stripe Webhook

| Item | Value |
|------|-------|
| **Name** | BibleLessonSpark Org Webhook |
| **URL** | `https://hphebzdftpjbiudpfcrs.supabase.co/functions/v1/org-stripe-webhook` |
| **Secret** | `STRIPE_ORG_WEBHOOK_SECRET` (set in Supabase) |
| **Events** | checkout.session.completed, customer.subscription.updated, customer.subscription.deleted |

### Pool Consumption Logic (Phase 13.6)
```
When org member generates a lesson:
1. Check subscription pool (lessons_limit - lessons_used_this_period)
2. If available → consume from subscription, set org_pool_consumed = true
3. Else check bonus pool (bonus_lessons)
4. If available → consume from bonus, set org_pool_consumed = true
5. Else fallback to individual tier (normal tier_config limits)
6. Set org_pool_consumed = false, lesson still associated with org
```

### Frontend Components (Phase 13.7-13.8)

| Component | Location | Purpose |
|-----------|----------|---------|
| `useOrgPoolStatus.ts` | `src/hooks/` | Hook fetching org pool data from database SSOT |
| `OrgPoolStatusCard.tsx` | `src/components/org/` | Org Leader pool status + purchase dialogs |
| `OrgLessonsPanel.tsx` | `src/components/org/` | **Updated with funding source column** |
| `MemberPoolStatusBanner.tsx` | `src/components/org/` | Member pool awareness with warnings |
| `OrgManager.tsx` | `src/pages/` | **Updated with Lesson Pool tab + Network tab + Disconnect** |
| `MyOrganizationSection.tsx` | `src/components/account/` | **Updated with pool banner** |

### Phase 13 Progress

| Phase | Description | Status |
|-------|-------------|--------|
| 13.1 | Stripe Products (9 created) | ✅ Complete |
| 13.2 | Database Schema + SSOT | ✅ Complete |
| 13.3 | Org Subscription Checkout | ✅ Deployed |
| 13.4 | Lesson Pack Purchase | ✅ Deployed |
| 13.5 | Org Webhook Handler | ✅ Deployed |
| 13.6 | Lesson Pool Tracking (Backend) | ✅ Complete |
| 13.7 | Org Leader Dashboard (Frontend) | ✅ Complete |
| 13.8 | Member Pool Awareness | ✅ Complete |

---

## TEACHER TOOLBELT SYSTEM (Phase 23 - COMPLETE ✅)

### Overview
Teacher Toolbelt is a free, public resource offering genuine help to volunteer Baptist Bible teachers through micro-tools that provide pastoral reflections. It serves as a pre-subscription marketing system that leads with service, not sales.

### Strategic Flow
```
eBook Download → Email Sequence → Toolbelt → Email Capture → Nurture Sequence → BLS Subscription
```

### Architecture
| Component | Location | Purpose |
|-----------|----------|---------|
| `toolbeltConfig.ts` | `src/constants/` | SSOT configuration |
| `ToolbeltLanding.tsx` | `src/pages/toolbelt/` | Landing page with tool cards |
| `ToolbeltLessonFit.tsx` | `src/pages/toolbelt/` | Tool 1: Does This Lesson Fit? |
| `ToolbeltLeftOut.tsx` | `src/pages/toolbelt/` | Tool 2: What Can Be Left Out? |
| `ToolbeltOneTruth.tsx` | `src/pages/toolbelt/` | Tool 3: One-Truth Focus Finder |
| `ToolbeltAdmin.tsx` | `src/pages/` | Admin management center |
| `toolbelt-reflect` | Edge Function | AI reflection generation |
| `send-toolbelt-sequence` | Edge Function | Nurture email automation |

### The Three Tools

| Tool | Purpose | Route |
|------|---------|-------|
| Does This Lesson Fit My Class? | Name mismatch patterns | `/toolbelt/lesson-fit` |
| What Can Be Left Out Safely? | Distinguish essential from supporting | `/toolbelt/left-out-safely` |
| One-Truth Focus Finder | Articulate central truth | `/toolbelt/one-truth` |

### Voice Guardrails ⚠️ CRITICAL

Claude's role is to **reflect, not instruct**. Every reflection must:

| Requirement | Implementation |
|-------------|----------------|
| **Reflect, don't instruct** | Never give advice ("You should...") |
| **Affirm, don't diagnose** | Never label problems ("Your issue is...") |
| **Pastoral tone** | Warm, calm, dignified |
| **Prose only** | No bullet points in reflections |
| **No questions** | Reflection, not interrogation |
| **No BLS mentions** | Product awareness only in emails |
| **No doctrinal positions** | Stay theologically neutral |

### Voice Prohibitions (Hard Rules)
- ❌ Do NOT give prescriptive advice
- ❌ Do NOT diagnose problems
- ❌ Do NOT mention BibleLessonSpark in tool reflections
- ❌ Do NOT take doctrinal positions
- ❌ Do NOT use bullet points in output
- ❌ Do NOT ask questions in output
- ❌ Do NOT imply the teacher is failing

### Output Structure (All Tools)
1. **Headline:** "Here's what your instincts are picking up" (or similar)
2. **2-3 reflective paragraphs:** Naming patterns, validating feelings
3. **Closing reassurance:** Affirming their attentiveness and care

### Database Tables

#### toolbelt_usage
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| tool_id | text | "lesson-fit", "left-out", "one-truth" |
| session_id | text | Anonymous session tracking |
| tokens_used | integer | Claude API tokens consumed |
| created_at | timestamp | When the call occurred |

#### toolbelt_email_captures
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| email | text | Captured email (unique) |
| tool_id | text | Which tool they used |
| reflection_sent | boolean | Immediate email delivered? |
| created_at | timestamp | When captured |

#### toolbelt_email_templates
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| tenant_id | text | Multi-tenant support |
| sequence_order | integer | Position in sequence |
| send_day | integer | Days after capture to send |
| subject | text | Email subject line |
| body | text | Email content |
| is_html | boolean | Rich text or plain text |
| is_active | boolean | Enable/disable |

#### toolbelt_email_tracking
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| email_capture_id | uuid | FK to captures |
| last_email_sent | integer | Count of emails sent |
| unsubscribed | boolean | Opt-out flag |

### Admin Panel Tabs

| Tab | Purpose |
|-----|---------|
| Usage Report | Calls today/week/month, API cost estimate, tool breakdown |
| Email Sequences | Rich text editor for nurture emails |
| Email Captures | List of captured emails with search/filter |
| Guardrails Status | Display current configuration (read-only) |

### Email Sequence (7 Emails)

| # | Day | Subject | Focus |
|---|-----|---------|-------|
| 0 | Immediate | Your reflection from [Tool Name] | Reflection + warm intro |
| 1 | Day 1 | When a lesson doesn't quite fit | Tool 1 value |
| 2 | Day 3-4 | When carrying everything feels heavy | Tool 2 value |
| 3 | Day 7 | When you want to teach with clarity | Tool 3 value |
| 4 | Day 14 | A quiet encouragement for your teaching | Teaching tip (value) |
| 5 | Day 21 | When preparation needs a home | Soft BLS bridge |
| 6 | Day 30 | Still here if helpful | Final gentle invitation |

### Routes

**Public (No Auth):**
```
/toolbelt                    → Landing page (tool index)
/toolbelt/lesson-fit         → Tool 1: Does This Lesson Fit?
/toolbelt/left-out-safely    → Tool 2: What Can Be Left Out?
/toolbelt/one-truth          → Tool 3: One-Truth Focus Finder
```

**Protected (Admin Only):**
```
/admin/toolbelt              → Toolbelt management center
```

### Key Design Decisions
- **No authentication required** for tools (reduces friction)
- **Session-only results** (never persist user inputs/outputs)
- **Email capture is optional** (service framing: "email this to yourself")
- **Separate admin page** (`/admin/toolbelt`, not tabs in main admin)
- **Pastoral tone always** (never commercial or pressured)

---

## DEVOTIONALSPARK SYSTEM (Phase 22 - v2.1 COMPLETE ✅)

### Overview
DevotionalSpark generates personal devotionals based on the same passage and focus as generated lessons. Available to Personal tier subscribers.

### Voice Guidelines (v2.1)
- **Smooth prose flow** - No bullet points, numbered lists, or choppy transitions
- **Reader-focused** - Uses "you" naturally, never "the reader"
- **Story-driven** - Opens with narrative/illustration, not instruction
- **Space for insight** - Creates room for reader-induced discovery
- **Prayer ends with Jesus** - Always closes prayer in Jesus' name

### Output Structure
1. **Opening narrative** (100-150 words) - Story, illustration, or observation
2. **Scripture connection** (75-100 words) - Links narrative to passage
3. **Reflection invitation** (75-100 words) - Questions for personal consideration
4. **Closing prayer** (50-75 words) - Ends "in Jesus' name, Amen"

---

## PRICING STRUCTURE

### Individual Plans
| Tier | Lessons/Period | Sections | Features | Price |
|------|----------------|----------|----------|-------|
| **Free** | 5 (2 full + 3 partial) | All 8 for first 2, then 1/5/8 | Basic generation | Forever free |
| **Personal** | 20 | All 8 | DevotionalSpark, Student Teaser, Email Lesson Delivery | $9/mo or $90/yr |

### Organization Plans
| Tier | Lessons/Month | Features | Price |
|------|---------------|----------|-------|
| **Starter** | 25 | Shared pool, unlimited members | $29/mo or $290/yr |
| **Growth** | 60 | Shared pool, unlimited members | $59/mo or $590/yr |
| **Ministry Full** | 120 | Shared pool, unlimited members | $99/mo or $990/yr |
| **Enterprise** | 250 | Shared pool, unlimited members | $179/mo or $1,790/yr |

---

## PROJECT STRUCTURE

### Frontend (React/TypeScript)
```
src/
├── components/
│   ├── lesson/                      # Lesson generation components
│   │   ├── LessonGenerator.tsx
│   │   ├── LessonDisplay.tsx
│   │   ├── SectionRenderer.tsx
│   │   └── DevotionalLibrary.tsx    # Devotional library
│   ├── admin/
│   │   ├── OrganizationManagement.tsx
│   │   ├── EmailSequenceManager.tsx # BLS onboarding emails
│   │   └── toolbelt/                # Toolbelt admin components
│   │       ├── ToolbeltUsageReport.tsx
│   │       ├── ToolbeltEmailManager.tsx
│   │       ├── ToolbeltEmailCaptures.tsx
│   │       └── ToolbeltGuardrailsStatus.tsx
│   ├── dashboard/
│   │   ├── EnhanceLessonForm.tsx    # Updated: Phase 24 series + Phase 25 email props
│   │   └── TeacherCustomization.tsx # Updated: Phase 24 series selection UI
│   ├── org/                         # Organization components
│   │   ├── OrgPoolStatusCard.tsx    # Pool status + purchase dialogs (Phase 13)
│   │   ├── OrgLessonsPanel.tsx      # Org lessons with funding source
│   │   ├── MemberPoolStatusBanner.tsx # Member pool awareness (Phase 13)
│   │   ├── ChildOrgDashboard.tsx    # Network tab — child org cards (N3)
│   │   ├── ChildOrgCard.tsx         # Individual child card with health light (N3)
│   │   ├── CreateChildOrgDialog.tsx # Create child org dialog (N4)
│   │   ├── ParentFocusBanner.tsx    # Parent focus adoption banner (N6)
│   │   ├── DisconnectNetworkDialog.tsx # Disconnect confirmation dialog (N7)
│   │   └── [other org components]
│   ├── account/
│   │   └── MyOrganizationSection.tsx # Updated with pool banner
│   ├── EmailLessonDialog.tsx        # NEW: Email dialog with roster support (Phase 25)
│   ├── LessonExportButtons.tsx      # Updated: Share removed, Email added (Phase 25)
│   └── toolbelt/                    # Toolbelt shared components
│       └── ToolbeltReflectionForm.tsx
├── hooks/
│   ├── useOrgPoolStatus.ts          # Org pool data hook (Phase 13)
│   ├── useChildOrgSummaries.ts      # Child org data via RPC (N3)
│   ├── useParentSharedFocus.ts      # Parent focus view + adopt (N6)
│   ├── useFocusAdoptionMap.ts       # Adoption status for parent (N6)
│   ├── useDisconnectFromNetwork.ts  # Disconnect RPC call (N7)
│   └── useSeriesManager.ts          # NEW: Series CRUD + state (Phase 24)
├── pages/
│   ├── Admin.tsx
│   ├── OrgManager.tsx               # Updated with Network tab, Focus banner, Disconnect
│   ├── ToolbeltAdmin.tsx            # Toolbelt admin center
│   └── toolbelt/                    # Toolbelt public pages
│       ├── ToolbeltLanding.tsx
│       ├── ToolbeltLessonFit.tsx
│       ├── ToolbeltLeftOut.tsx
│       └── ToolbeltOneTruth.tsx
├── config/
│   ├── branding.ts                  # SSOT: All brand colors
│   └── brand-values.json            # SSOT: Colors/typography JSON
├── constants/
│   ├── organizationConfig.ts        # Org hierarchy SSOT (Nested Orgs)
│   ├── orgManagerConfig.ts          # Org Manager tab config
│   ├── toolbeltConfig.ts            # Toolbelt SSOT
│   ├── pricingConfig.ts             # Individual tier config MASTER
│   ├── orgPricingConfig.ts          # Organization billing SSOT (Phase 13)
│   ├── devotionalConfig.ts          # DevotionalSpark config
│   ├── emailDeliveryConfig.ts       # NEW: Email delivery + roster SSOT (Phase 25)
│   ├── seriesConfig.ts              # NEW: Series/Theme Mode SSOT (Phase 24)
│   └── [other SSOT files]
```

### Backend (Edge Functions)
```
supabase/functions/
├── generate-lesson/                 # Modified: org pool (Phase 13.6), double-increment fix (Feb 2026)
├── generate-devotional/             # DevotionalSpark v2.1
├── send-sequence-email/             # BLS onboarding emails
├── send-lesson-email/               # NEW: Email lesson delivery via Resend (Phase 25)
├── toolbelt-reflect/                # Toolbelt AI reflection
├── send-toolbelt-sequence/          # Toolbelt nurture emails
├── create-org-checkout-session/     # Org subscription checkout (Phase 13)
├── purchase-lesson-pack/            # Lesson pack purchase (Phase 13)
├── purchase-onboarding/             # Onboarding purchase (Phase 13)
├── org-stripe-webhook/              # Org Stripe webhook (Phase 13)
└── _shared/
    ├── branding.ts
    ├── toolbeltConfig.ts            # Backend mirror
    ├── devotionalConfig.ts
    ├── organizationConfig.ts        # Backend mirror (Nested Orgs)
    ├── emailDeliveryConfig.ts       # Backend mirror (Phase 25)
    ├── orgPoolCheck.ts              # Pool consumption logic (Phase 13.6)
    └── [other mirrors]
```

### Database Tables
```
# Core BLS
tier_config                          # SSOT for individual tier limits/sections
user_subscriptions                   # User's current tier + usage
devotionals                          # Generated devotionals
branding_config                      # SSOT branding for edge functions
lessons                              # Generated lessons (+ org_pool_consumed column)
lesson_series                        # NEW: Series/Theme Mode tracking (Phase 24)

# Email (BLS Onboarding)
email_sequence_templates             # Onboarding email content (7 emails)
email_sequence_tracking              # User progress through sequence

# Email Lesson Delivery (Phase 25)
email_rosters                        # NEW: Named class email lists with RLS

# Teacher Toolbelt
toolbelt_usage                       # API call tracking
toolbelt_email_captures              # Email collection
toolbelt_email_templates             # Nurture sequence content
toolbelt_email_tracking              # Delivery progress

# Organizations
organizations                        # Org details + billing columns + hierarchy columns
organization_members                 # Org membership (role: 'member' only)
transfer_requests                    # Org member transfer workflow
org_shared_focus                     # Shared focus sets (+ adopted_from_focus_id for N6)

# Organization Billing (Phase 13)
org_tier_config                      # SSOT for org subscription tiers
lesson_pack_config                   # SSOT for lesson packs
onboarding_config                    # SSOT for onboarding options
org_lesson_pack_purchases            # Lesson pack purchase audit trail
org_onboarding_purchases             # Onboarding purchase audit trail
```

---

## DEPLOYMENT COMMANDS

```powershell
# SSOT Deployment (RECOMMENDED - prevents branch mismatch)
.\deploy.ps1 "commit message"

# Frontend hot reload
npm run dev

# Build for production
npm run build

# Sync constants to backend
npm run sync-constants

# Sync branding to database
npm run sync-branding

# Sync individual tier config to database
npm run sync-tier-config

# Sync organization pricing to database (Phase 13)
npm run sync-org-pricing

# Deploy all edge functions
npx supabase functions deploy

# Deploy specific edge function
npx supabase functions deploy toolbelt-reflect
npx supabase functions deploy create-org-checkout-session
npx supabase functions deploy send-lesson-email

# Regenerate Supabase types (after schema changes)
npx supabase gen types typescript --project-id hphebzdftpjbiudpfcrs > src/integrations/supabase/types.ts

# Git commit and push (PowerShell — use semicolons, not &&)
git add -A
git commit -m "message"
git push origin biblelessonspark
```

---

## POST-LAUNCH ROADMAP

### Priority: LOW (Post-Launch Enhancements)

| Feature | Description | Estimated Effort | Status |
|---------|-------------|------------------|--------|
| In-App Teacher Approval | Teacher receives notification, approves/declines transfer in app | 6-8 hours | Not Started |
| Export Formatting Admin Panel | Admin UI to adjust Print/DOCX/PDF formatting without code changes | 4-6 hours | Not Started |
| Organization-Scoped Beta Management | Org Leaders create own feedback surveys + analytics | 8-12 hours | Not Started |
| Series/Theme Mode | Sequential lesson planning across multiple weeks | 12-16 hours | ⚠️ Phase 24 IN PROGRESS |
| ~~Email/Text Lesson Delivery~~ | ~~Send lessons and teasers via email/SMS~~ | ~~6-8 hours~~ | ✅ Phase 25 COMPLETE |
| White-Label Personalized Footer | Custom footer text for enterprise tenants | 2-3 hours | Not Started |
| Email Unsubscribe Link | Add one-click unsubscribe to automated emails | 2-3 hours | Not Started |

---

## BETA TESTER TRANSITION

### Timeline
| Date | Event |
|------|-------|
| Jan 25, 2026 | Soft launch announcement sent to 16 beta testers |
| Jan 27, 2026 | Public launch ✅ |
| Feb 28, 2026 | Beta tester full access ends |
| Mar 1, 2026 | Beta testers transition to free tier or subscribe |

### Post-Transition Options
| Tier | Lessons | Sections | Reset | Cost |
|------|---------|----------|-------|------|
| **Free** | 5 per period (2 full + 3 partial) | 8 for first 2, then 1/5/8 | Rolling 30 days | Forever free |
| **Personal** | 20 per period | All 8 | Rolling 30 days | $9/month or $90/year |

---

## SESSION HANDOFF NOTES

**For next Claude instance:**
- Lynn is a non-programmer; provide complete, copy-paste ready solutions
- Follow Claude Debugging Protocol: diagnose root cause before proposing fixes
- All solutions must be SSOT compliant (frontend drives backend)
- Platform is in Production mode - no "Beta" references in UI

**Key Commands:**
- `.\deploy.ps1 "message"` - SSOT deployment (validates branch, prevents errors)
- `npm run sync-constants` - Syncs constants to edge functions
- `npm run sync-branding` - Syncs branding to database
- `npm run sync-tier-config` - Syncs individual tier limits to database
- `npm run sync-org-pricing` - **Syncs org pricing to database (Phase 13)**
- `npx supabase functions deploy toolbelt-reflect` - Deploy Toolbelt reflection
- `npx supabase functions deploy send-toolbelt-sequence` - Deploy Toolbelt emails
- `npx supabase functions deploy create-org-checkout-session` - **Deploy org checkout (Phase 13)**
- `npx supabase functions deploy send-lesson-email` - **Deploy email lesson delivery (Phase 25)**
- `npx supabase gen types typescript --project-id hphebzdftpjbiudpfcrs > src/integrations/supabase/types.ts` - Regenerate types

**Reset Logic (Important for Support):**
- All tiers use **rolling 30-day periods** (not calendar month)
- Each user's `reset_date` is stored in `user_subscriptions` table
- Free user period starts from email verification
- Subscriber period starts from subscription date (matches Stripe billing)

**SSOT Systems Status (All Complete ✅):**
- Color System (100% compliant - Forest Green #3D5C3D)
- Email Branding (BibleLessonSpark)
- UI Symbols (UTF-8 safe)
- Tier Config (database reads from tier_config table)
- Domain URLs (all Edge Functions use branding config)
- Transfer Request Statuses (transferRequestConfig.ts)
- Email Sequence Templates (database-driven, Admin Panel editable)
- Reset Logic (rolling 30-day, documented in trialConfig.ts)
- FeaturesSection (dynamic from 5 SSOT files, hover-activated)
- DevotionalSpark v2.1 (smooth prose, reader-focused, prayer ends with Jesus)
- Teacher Toolbelt (Phase 23) - Complete with 3 tools, admin panel, email sequence
- **Organization Billing (Phase 13)** - COMPLETE: Stripe products, SSOT, Edge Functions, Pool Tracking, Dashboards
- **Nested Organization Architecture (N1-N7)** - COMPLETE: Hierarchy, RLS, Network Dashboard, Child Creation, Focus Sharing, Disconnect
- **Email Lesson Delivery (Phase 25)** - COMPLETE: Resend API, class rosters, Section 8 extraction, tier-gated
- **Email Delivery Config (emailDeliveryConfig.ts)** - SSOT for delivery limits, labels, roster config

**⚠️ IN PROGRESS:**
- **Series/Theme Mode (Phase 24)** - Database + SSOT + hooks created; UI bugs remain (see Known Issues below)

**Organization Billing Status (Phase 13 - COMPLETE ✅):**
- ✅ 13.1: Stripe Products (9 products created)
- ✅ 13.2: Database Schema + SSOT (`orgPricingConfig.ts`, 5 new tables)
- ✅ 13.3: `create-org-checkout-session` Edge Function deployed
- ✅ 13.4: `purchase-lesson-pack` Edge Function deployed
- ✅ 13.5: `org-stripe-webhook` Edge Function deployed + webhook configured
- ✅ 13.6: Lesson Pool Tracking (`orgPoolCheck.ts`, modified `generate-lesson`)
- ✅ 13.7: Org Leader Dashboard (`OrgPoolStatusCard`, `useOrgPoolStatus`, Lesson Pool tab)
- ✅ 13.8: Member Pool Awareness (`MemberPoolStatusBanner`, Account page integration)

**Nested Organization Architecture (N1-N7 - COMPLETE ✅):**
- ✅ N1: Database schema + SSOT (`organizationConfig.ts`, hierarchy columns)
- ✅ N2: RLS policies + 4 secure functions (`is_org_manager`, `get_managed_org_ids`, `is_ancestor_org_manager`, `get_child_org_summaries`)
- ✅ N3: Network dashboard UI (`ChildOrgDashboard`, `ChildOrgCard`, `useChildOrgSummaries`)
- ✅ N4: Child org creation workflow (`CreateChildOrgDialog`)
- ✅ N5: Admin hierarchy display
- ✅ N6: Shared Focus Awareness (`ParentFocusBanner`, `useParentSharedFocus`, `useFocusAdoptionMap`, `get_parent_active_focus`, `adopt_parent_focus`, `get_focus_adoption_map`)
- ✅ N7: Disconnect Workflow (`DisconnectNetworkDialog`, `useDisconnectFromNetwork`, `disconnect_org_from_network`)

**Email Lesson Delivery (Phase 25 - COMPLETE ✅):**
- ✅ 25.0: Edge function + SSOT + dialog + tier gating
- ✅ 25.1: Class Email Rosters (database table + inline UI)
- ✅ 25.2: Resend tag sanitization fix
- ✅ 25.3: Section 8 extraction fix (multi-format parser)

**Supabase Secrets (Organization Billing):**
- `STRIPE_SECRET_KEY` - Already set (shared with individual billing)
- `STRIPE_ORG_WEBHOOK_SECRET` - Set January 30, 2026

**Teacher Toolbelt Status (All Complete ✅):**
- Public routes: `/toolbelt`, `/toolbelt/lesson-fit`, `/toolbelt/left-out-safely`, `/toolbelt/one-truth`
- Admin route: `/admin/toolbelt`
- Edge Functions: `toolbelt-reflect`, `send-toolbelt-sequence`
- Database: 4 tables created with RLS
- Email sequence: 7 templates loaded
- Admin panel: 4 tabs (Usage, Emails, Captures, Guardrails)
- ReactQuill editor with link toolbar

**Email Automation Status (All Complete ✅):**
- BLS Onboarding: `email_sequence_templates`, `email_sequence_tracking`
- Toolbelt Nurture: `toolbelt_email_templates`, `toolbelt_email_tracking`
- Triggers and cron jobs active for both sequences

**Database Protections:**
- UNIQUE constraint on `user_subscriptions.user_id` prevents duplicates
- UNIQUE constraint on `toolbelt_email_captures.email` prevents duplicates
- UNIQUE constraint on `email_rosters` name length (max 50) and email count (max 25)
- RLS enabled on all Toolbelt tables
- RLS enabled on org billing tables (org managers can view their org's purchases)
- RLS enabled on `email_rosters` (users manage their own rosters only)
- RLS policy `parent_org_manager_view_children` for hierarchy visibility (N2)
- `user_parable_usage` view fixed with SECURITY INVOKER
- All nested org functions are SECURITY DEFINER with `SET search_path = public`

**Dependencies:**
- `react-quill` - Rich text editor for email templates (both BLS and Toolbelt)

**Bug Fixes Applied (Feb 1-2, 2026):**
- ✅ **Resend Tag Sanitization** — Dots not allowed in Resend API tags; `EMAIL_DELIVERY_VERSION` `1.1.0` sanitized to `1-1-0` (commit `44dd1db`)
- ✅ **Section 8 Extraction** — Edge function regex only matched `**Section N**` bold markers; actual lessons use `## Section 8:` markdown headers. Replaced `extractLastSection()` with multi-format `extractSection8Content()` + `parseSectionHeaderNumber()` (commit `88e2ac0`)
- ✅ **Lesson Count Double-Increment** — Both frontend `incrementUsage()` AND edge function `incrementLessonUsage()` were counting each lesson. SSOT fix: removed `incrementLessonUsage` from `generate-lesson` edge function (frontend drives backend). SQL correction applied to sync all user counts to actual. Org pool consumption remains in edge function (org-level logic).

**Known Issues / Next Steps:**
- ⚠️ Phase 24 Series/Theme Mode: lesson count not tracking after first generation; `result.data.lesson` → `result.data.id` fix needed; old duplicate files at `src/components/` need deletion (correct path is `src/components/dashboard/`)
- ⚠️ Phase 24 code may not be committed to git — verify with `git log --oneline -5` before continuing work

**Launch Status:**
- Launch Date: January 27, 2026 ✅ LAUNCHED
- Teacher Toolbelt: January 29, 2026 ✅ COMPLETE
- Organization Billing System: January 30, 2026 ✅ PHASE 13 COMPLETE
- Nested Organization Architecture: January 31, 2026 ✅ N1-N7 COMPLETE
- Email Lesson Delivery: February 1-2, 2026 ✅ PHASE 25 COMPLETE
- Series/Theme Mode: February 1, 2026 ⚠️ PHASE 24 IN PROGRESS
- All routes verified ✅
- Email automation working ✅
- Admin panel functional ✅
