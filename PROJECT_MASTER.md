# PROJECT_MASTER.md
# LessonSparkUSA - Single Source of Truth

**Last Updated:** January 8, 2026  
**Current Phase:** 22 Complete (Tenant Configuration Architecture)  
**Platform Mode:** Public Beta  
**Production Readiness:** Ready (pending mode switch)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [SSOT File Reference](#ssot-file-reference)
5. [Lesson Framework](#lesson-framework)
6. [Theology Profiles](#theology-profiles)
7. [Age Groups](#age-groups)
8. [Bible Versions](#bible-versions)
9. [DevotionalSpark](#devotionalspark)
10. [Platform Modes & Tiers](#platform-modes--tiers)
11. [Admin Panel](#admin-panel)
12. [White-Label Architecture](#white-label-architecture)
13. [Database Schema](#database-schema)
14. [Edge Functions](#edge-functions)
15. [Deployment](#deployment)
16. [Phase History](#phase-history)
17. [Technical Debt](#technical-debt)
18. [Debugging Protocol](#debugging-protocol)
19. [Contact & Resources](#contact--resources)

---

## Project Overview

**LessonSparkUSA** is a Baptist Bible study lesson generator platform designed for volunteer Sunday School teachers. The platform uses AI (Claude) to generate comprehensive, theologically-sound lesson plans based on Scripture passages.

| Attribute | Value |
|-----------|-------|
| **Developer** | Lynn (non-programmer solopreneur) |
| **Background** | Retired Baptist minister, PhD from SWBTS, 55 years ministry experience |
| **Target Users** | Volunteer Sunday School teachers in Baptist churches |
| **Mission** | Equip teachers with professional-quality lesson materials |
| **Values** | Christian values guide all development decisions |

### Companion Platform

**DevotionalSpark** - Personal devotional generation system integrated into LessonSparkUSA. Generates devotional content aligned with generated lessons for personal spiritual growth.

### Enterprise Vision

**Spark Platform Family** - White-label architecture enables enterprise sales:
- Large churches ($15,000 - $50,000 annual licenses)
- Baptist conventions ($75,000 - $150,000+ annual licenses)
- Two deployment models: Managed (subdomain) and Independent (separate deployment)

---

## Architecture Principles

### SSOT (Single Source of Truth)

All constants are defined **once** in frontend files and synced to backend.

```
Frontend Constants (AUTHORITATIVE)
        ↓
    npm run sync-constants
        ↓
Backend Shared Constants (DERIVED)
```

### Frontend Drives Backend

- Frontend constants define all business logic, validation rules, and UI text
- Backend stores data with minimal constraints
- Database schema MIRRORS frontend type definitions
- RLS policies enforce security at database level

### Tenant Configuration Flow

```
tenantConfig.ts (SSOT - defines types, defaults, mappings)
        ↓
tenant_config table (Database - mirrors SSOT structure)
        ↓
useTenantConfig hook (loads from database)
        ↓
TenantProvider in App.tsx (wraps app)
        ↓
useTenant() (components consume)
        ↓
TenantBrandingPanel (Admin edits, saves to database)
```

### Key Rules

1. **Never duplicate constants** - Import from SSOT files
2. **Never hardcode text** - All UI text comes from tenant config or branding.ts
3. **Complete solutions only** - Full copy-paste ready PowerShell commands
4. **Root-cause diagnosis first** - Identify problem before proposing solutions
5. **Verify SSOT compliance** - Check that changes follow architecture

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI Components** | Shadcn/ui, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **AI** | Claude API (Anthropic) |
| **Payments** | Stripe (subscriptions, webhooks) |
| **Hosting** | Netlify (auto-deploy from GitHub) |
| **Email** | Google Workspace (lynn@lessonsparkusa.com) |
| **Repository** | GitHub (lynn75965/lesson-spark-usa) |

### Development Environment

| Tool | Path/Setting |
|------|--------------|
| **Local Repository** | `C:\Users\Lynn\lesson-spark-usa` |
| **Node Version** | 18+ |
| **Package Manager** | npm |
| **IDE** | VS Code / Notepad (for quick edits) |
| **Shell** | PowerShell |

---

## SSOT File Reference

### Core Constants

| File | Purpose | Location |
|------|---------|----------|
| `branding.ts` | Design system (colors, fonts, layouts) - STATIC | `src/config/` |
| `tenantConfig.ts` | Tenant content (text, features, contact) - DATABASE-BACKED | `src/constants/` |
| `lessonStructure.ts` | 8-section lesson framework | `src/constants/` |
| `theologyProfiles.ts` | 10 Baptist theology profiles | `src/constants/` |
| `ageGroups.ts` | 11 age group definitions | `src/constants/` |
| `bibleVersions.ts` | Bible version configurations | `src/constants/` |
| `customizationOptions.ts` | Teacher preference options | `src/constants/` |
| `teacherPreferences.ts` | Teacher profile field definitions | `src/constants/` |

### Feature Constants

| File | Purpose | Location |
|------|---------|----------|
| `devotionalConfig.ts` | DevotionalSpark configuration | `src/constants/` |
| `betaEnrollmentConfig.ts` | Beta BEHAVIOR toggles (not text) | `src/constants/` |
| `trialConfig.ts` | Trial duration options | `src/constants/` |
| `organizationConfig.ts` | Organization types | `src/constants/` |
| `accessControl.ts` | Role definitions and permissions | `src/constants/` |
| `helpVideos.ts` | Help video registry | `src/constants/` |

### Tenant Configuration (NEW - Phase 22)

| File | Purpose | Location |
|------|---------|----------|
| `tenantConfig.ts` | SSOT for tenant settings (types, defaults, mappings) | `src/constants/` |
| `useTenantConfig.ts` | Hook to load tenant config from database | `src/hooks/` |
| `TenantContext.tsx` | Context provider for tenant config | `src/contexts/` |
| `TenantBrandingPanel.tsx` | Admin UI for editing tenant settings | `src/components/admin/` |

### SSOT Separation (branding.ts vs tenantConfig.ts)

| File | Contains | Editable Via | Changes Require |
|------|----------|--------------|-----------------|
| `branding.ts` | Design system (colors, fonts, CSS, layouts) | Code only | Developer deploy |
| `tenantConfig.ts` | Content (text, messages, feature flags) | Admin Panel | Database update |
| `betaEnrollmentConfig.ts` | Behavior (toggles, helpers, referral options) | Code only | Developer deploy |

### Backend Shared (Auto-generated)

| File | Source | Location |
|------|--------|----------|
| `lessonStructure.ts` | Synced from frontend | `supabase/functions/_shared/` |
| `theologyProfiles.ts` | Synced from frontend | `supabase/functions/_shared/` |
| `ageGroups.ts` | Synced from frontend | `supabase/functions/_shared/` |
| `devotionalConfig.ts` | Synced from frontend | `supabase/functions/_shared/` |

---

## Lesson Framework

### 8-Section Structure

| # | Section | Word Target | Purpose |
|---|---------|-------------|---------|
| 1 | Theological Lens + Lesson Overview | 150-250 | Frame the passage through theology profile |
| 2 | Learning Objectives + Key Scriptures | 150-250 | Clear goals and Scripture references |
| 3 | Theological Background (Deep-Dive) | 450-600 | **All theology lives here** |
| 4 | Opening Activities | 120-200 | Engagement hooks |
| 5 | Main Teaching Content (Teacher Transcript) | 630-840 | **Spoken dialogue for classroom** |
| 6 | Interactive Activities | 150-250 | Hands-on learning |
| 7 | Discussion & Assessment | 200-300 | Questions and evaluation |
| 8 | Student Handout (Standalone) | 250-400 | **Creatively distinct** take-home |

**Total Target:** 2100-3090 words

### Tier-Based Access

| Tier | Sections | Activation |
|------|----------|------------|
| Free | 3 sections (1, 2, 3) | When platform_mode = `production` |
| Personal | 8 sections (all) | Always |
| Admin | 8 sections (all) | Always |

### Redundancy Locks

- Sections 4, 5, 6, 7, 8 must NOT repeat Section 3 theology
- Section 8 must be creatively distinct from all teacher content
- No word counts displayed in section headers
- Student Teaser extracted and displayed separately (no Section 9 duplication)

---

## Theology Profiles

### 10 Baptist Profiles

| ID | Profile Name | Key Distinctives |
|----|--------------|------------------|
| `southern_baptist_bfm2000` | Southern Baptist (BF&M 2000) | Current SBC standard |
| `southern_baptist_bfm1963` | Southern Baptist (BF&M 1963) | Traditional SBC |
| `reformed_baptist` | Reformed Baptist | 1689 London Confession, TULIP |
| `independent_baptist` | Independent Baptist | KJV preference, autonomy |
| `free_will_baptist` | Free Will Baptist | Arminian soteriology |
| `primitive_baptist` | Primitive Baptist | Hyper-Calvinism, a cappella |
| `general_baptist` | General Baptist | General atonement |
| `landmark_baptist` | Landmark Baptist | Trail of Blood ecclesiology |
| `conservative_baptist` | Conservative Baptist | Evangelical, inerrant |
| `cooperative_baptist` | Cooperative Baptist Fellowship | Moderate Baptist |

### Guardrail Integration

Each profile includes:
- Doctrinal boundaries (what to affirm/avoid)
- Vocabulary preferences
- Scripture interpretation guidelines
- Application style guidance

---

## Age Groups

### 11 Age Group Definitions

| ID | Label | Age Range | Characteristics |
|----|-------|-----------|-----------------|
| `preschool` | Preschoolers | 3-5 | Concrete, simple, repetitive |
| `elementary` | Elementary Kids | 6-10 | Story-based, active |
| `preteen` | Preteens & Middle Schoolers | 11-14 | Identity formation |
| `high_school` | High School Students | 15-18 | Abstract thinking |
| `college` | College & Early Career | 19-25 | Worldview integration |
| `young_adult` | Young Adults | 26-35 | Life application |
| `mid_life` | Mid-Life Adults | 36-50 | Depth and nuance |
| `experienced` | Experienced Adults | 51-65 | Wisdom perspective |
| `active_senior` | Active Seniors | 66-75 | Legacy and reflection |
| `senior` | Senior Adults | 76+ | Simplicity and comfort |
| `mixed` | Mixed Groups | All ages | Adaptable content |

---

## Bible Versions

### Supported Versions

| ID | Name | Copyright Handling |
|----|------|-------------------|
| `kjv` | King James Version | Public domain - direct quotes allowed |
| `nkjv` | New King James Version | Paraphrase required |
| `esv` | English Standard Version | Paraphrase required |
| `nasb` | New American Standard Bible | Paraphrase required |
| `niv` | New International Version | Paraphrase required |
| `csb` | Christian Standard Bible | Paraphrase required |
| `nlt` | New Living Translation | Paraphrase required |
| `amp` | Amplified Bible | Paraphrase required |

---

## DevotionalSpark

### Overview

DevotionalSpark generates personal devotional content aligned with generated lessons. It speaks directly to the reader's heart for personal quiet time, distinct from lessons which equip teachers for classroom instruction.

### Architecture

| Component | Location | Purpose |
|-----------|----------|---------|
| `devotionalConfig.ts` | `src/constants/` | SSOT configuration |
| `DevotionalGenerator.tsx` | `src/components/dashboard/` | Generation UI |
| `DevotionalLibrary.tsx` | `src/components/dashboard/` | Library with actions |
| `useDevotionals.ts` | `src/hooks/` | Data fetching hook |
| `generate-devotional` | Edge Function | AI generation |

### Configuration

| Setting | Options |
|---------|---------|
| **Target** | Preschool, Children, Youth, Adult |
| **Length** | 3 min (~400-500 words), 5 min (~700-900 words), 10 min (~1200-1500 words) |

### Inherited Parameters (Hidden)

- Theology Profile (from lesson)
- Bible Version (from lesson)
- Copyright handling (always paraphrase)
- Age-appropriate vocabulary (from lesson, overridable by Target)

### Moral Valence Guardrails

**Critical:** Prevents theological inversion (the flaw that killed Modern Parable Generator)

| Valence | Scripture Type | Theme Direction |
|---------|---------------|-----------------|
| VIRTUE | Grace, love, faith passages | Encouragement, gratitude, worship |
| CAUTIONARY | Warning, judgment passages | Conviction, confession, humility |

**Rules:**
- Judgment texts (Isaiah 14, Ezekiel 28) = Cautionary passages ONLY
- Grace texts (Romans 8, Ephesians 2, Psalm 23) = Virtue/encouragement passages
- NEVER pair judgment Scripture with virtue stories
- NEVER pair grace Scripture with condemnation themes

### Rate Limiting

| Role | Limit |
|------|-------|
| User | 7 devotionals/month |
| Admin | Unlimited |

---

## Platform Modes & Tiers

### Platform Modes

| Mode | Description | Tier Enforcement |
|------|-------------|------------------|
| `private_beta` | Invite-only access | OFF (all get 8 sections) |
| `public_beta` | Self-join enrollment | OFF (all get 8 sections) |
| `production` | Full launch | ON (free=3, paid=8 sections) |

### Subscription Tiers

| Tier | Price | Sections | Features |
|------|-------|----------|----------|
| Free | $0 | 3 | Basic generation |
| Personal | $90/year | 8 | Full lessons + devotionals |
| Ministry | Contact | 8 | Multi-user, analytics |

### Trial System

| Duration | Use Case |
|----------|----------|
| 7 days | Quick evaluation |
| 14 days | Standard trial |
| 30 days | Extended evaluation |
| 60 days | Ministry partners |
| 90 days | Strategic relationships |

**Admin Controls:**
- Grant trial: Gift icon in User Management
- Revoke trial: Orange X button (appears for active trials only)

---

## Admin Panel

### Tab Structure (9 Tabs)

| Tab | Component | Purpose |
|-----|-----------|---------|
| User Management | `UserManagement` | Users, roles, trial grant/revoke |
| Organizations | `OrganizationManagement` | Churches, members, invitations |
| All Lessons | `AllLessonsPanel` | Platform-wide lesson view |
| Beta Program | `BetaAnalyticsDashboard` | Analytics + enrollment data |
| System Analytics | `SystemAnalyticsDashboard` | Platform metrics |
| System Settings | `SystemSettingsPanel` | Platform mode, configuration |
| Security | `AdminSecurityPanel` | Security events + Guardrail violations |
| Branding | `TenantBrandingPanel` | White-label configuration |

### Branding Tab Sections (NEW - Phase 22)

| Section | Fields | Purpose |
|---------|--------|---------|
| Identity | App name, logo URL | Basic branding |
| Colors | Primary, secondary colors | Visual theming |
| Typography | Font family | Text styling |
| UI Text | App title, tagline, primary CTA | Core messaging |
| Contact & Email | Support email, from email, from name | Tenant email config |
| Feature Flags | Devotionals, PDF export, white-label | Feature toggles |
| Beta Text | 5 subsections (41 fields) | Beta mode messaging |
| Production Text | Badge, CTA button, trust text | Production mode messaging |

### Tab Consolidation Notes

- **Guardrails** merged into Security tab (as sub-tab)
- **Pricing & Plans** accessible via dedicated route
- **Enrollment Analytics** integrated into Beta Program tab

---

## White-Label Architecture

### Two Deployment Models

| Model | Description | Best For |
|-------|-------------|----------|
| **Model A: Subdomain** | yourchurch.lessonsparkusa.com | Churches wanting turnkey simplicity |
| **Model B: Separate** | Your own domain, your own infrastructure | Conventions wanting full control |

### Model A: Subdomain (Multi-Tenant)

| Component | Status | Notes |
|-----------|--------|-------|
| tenant_config table | ✅ Exists | 47+ columns for full customization |
| TenantContext/Provider | ✅ Wired | App.tsx wraps with TenantProvider |
| useTenantConfig hook | ✅ Exists | Loads from database, falls back to defaults |
| resolveTenantFromHost() | ✅ Exists | In tenantConfig.ts |
| Wildcard DNS | ❌ Not configured | Needs *.lessonsparkusa.com |
| tenant_id on tables | ⚠️ Partial | Needs adding to profiles, lessons, organizations |
| Multi-tenant RLS | ❌ Not built | Needs tenant-scoped policies |
| Usage tracking | ❌ Not built | For billing per tenant |
| Tenant admin role | ❌ Not built | Restrict admin to own tenant |

### Model B: Separate Deployment

| Component | Status | Notes |
|-----------|--------|-------|
| Codebase | ✅ Ready | GitHub repository |
| Environment variables | ⚠️ Partial | Some hardcoded values |
| Setup documentation | ❌ Not written | Deployment guide needed |
| Supabase schema export | ❌ Not packaged | Migration scripts needed |
| Branding reset | ❌ Not built | Fresh tenant defaults |

### Tenant Configuration Database Columns

| Category | Column Count | Examples |
|----------|--------------|----------|
| Branding | 5 | brand_name, logo_url, primary_color |
| UI Text | 3 | app_title, tagline, primary_cta |
| Features | 3 | feature_devotionals, feature_pdf_export |
| Contact | 3 | contact_support_email, contact_from_email |
| Beta Landing | 4 | beta_landing_cta_title, beta_landing_trust_text |
| Beta Form | 19 | beta_form_title, beta_form_email_label |
| Beta Dashboard | 4 | beta_dashboard_title, beta_dashboard_button |
| Beta Messages | 8 | beta_msg_enrollment_success_title |
| Beta Validation | 6 | beta_val_email_required |
| Production | 3 | prod_landing_badge_text, prod_landing_cta_button |

**Total: 58 columns** (including id, tenant_id, timestamps)

### Tenant Admin Visibility Matrix

| Tab | Platform Admin | Tenant Admin |
|-----|----------------|--------------|
| User Management | ✅ All users | ✅ Their users only |
| Organizations | ✅ All orgs | ❌ Hidden |
| All Lessons | ✅ All lessons | ✅ Their lessons only |
| Beta Program | ✅ Platform-wide | ✅ Their program |
| System Analytics | ✅ Platform-wide | ✅ Their analytics |
| System Settings | ✅ Full edit | ✅ Scoped to tenant |
| Security | ✅ Platform-wide | ✅ Their events |
| Branding | ✅ Any tenant | ✅ Their branding |

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, organization membership |
| `lessons` | Generated lesson content |
| `devotionals` | Generated devotional content |
| `organizations` | Churches and groups |
| `organization_members` | Junction table for membership |
| `organization_invites` | Pending invitations |

### Subscription Tables

| Table | Purpose |
|-------|---------|
| `pricing_plans` | Subscription tier definitions |
| `user_subscriptions` | Active subscriptions |
| `stripe_customers` | Stripe customer mapping |

### Configuration Tables

| Table | Purpose |
|-------|---------|
| `system_settings` | Platform-wide settings (platform_mode, maintenance_mode) |
| `tenant_config` | Per-tenant branding and settings (47+ columns) |
| `user_roles` | User permission assignments |

### Security Tables

| Table | Purpose |
|-------|---------|
| `security_events` | Admin action logging |
| `guardrail_violations` | Theological guardrail tracking |

---

## Edge Functions

### Active Functions

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `generate-lesson` | Lesson generation | Yes |
| `generate-devotional` | Devotional generation | Yes |
| `send-invite` | Organization invitations | Yes |
| `stripe-webhook` | Payment processing | No (webhook secret) |
| `create-checkout-session` | Stripe checkout | Yes |
| `create-customer-portal` | Subscription management | Yes |

### Deprecated Functions

| Function | Status |
|----------|--------|
| `setup-lynn-admin` | Initial admin setup |

---

## Deployment

### Commands

```powershell
# Frontend build
npm run build
npm run dev

# Sync constants to backend
npm run sync-constants

# Deploy Edge Function
npx supabase functions deploy <function-name> --project-ref hphebzdftpjbiudpfcrs

# Generate TypeScript types
npx supabase gen types typescript --project-id hphebzdftpjbiudpfcrs > src/integrations/supabase/types.ts
```

### Git Workflow

```powershell
git add <files>
git commit -m "message"
git push
```

### Auto-Deploy

- Netlify watches GitHub `main` branch
- Push triggers automatic deployment
- Build takes ~1-2 minutes

---

## Phase History

### Phase 1-6: Foundation (October-November 2024)

- Initial platform architecture
- Supabase setup, Auth integration
- Basic lesson generation
- UI scaffolding

### Phase 7: AI Output & Export (November 2024) ✅

- Section 5 enforcement (630-840 words)
- PDF export (Calibri 11pt, professional formatting)
- DOCX export (editable format)
- Print function optimization

### Phase 8: Teacher Profiles (November 2024) ✅

- Profile save/load/delete functionality
- Smart Collapse behavior
- Part of Series validation
- Teacher preferences SSOT

### Phase 9: Beta Preparation (November 2024) ✅

- Signup page implementation
- Feedback modal
- Rate limiting (5 lessons/24hrs → later 7/24hrs)
- Admin dashboard foundation

### Phase 10: Security Hardening (November-December 2024) ✅

- RLS policy audit and standardization
- Removed `{public}` role vulnerabilities
- Reduced policies from 80 to 66
- Function search path security

### Phase 11: Organization Features (December 2024) ✅

- Organization structure (Org Structure)
- Members tab and invite system
- Role-based access control
- Invitation email system

### Phase 12: Shared Features (December 2024) ✅

- Text paste input option
- File validation SSOT
- Supported formats: PDF, TXT, JPG, JPEG, PNG
- Input mode toggle (paste vs upload)

### Phase 13-14: Admin Enhancements (December 2024) ✅

- Admin panel tab consolidation
- System Analytics dashboard
- Security tab implementation
- Guardrail violations panel

### Phase 15: Stripe Integration (December 2024) ✅

- Pricing plans table
- Checkout session flow
- Webhook handling
- Subscription sync

### Phase 16: White-Label Foundation (December 2024) ✅

- Tenant config SSOT
- Branding admin panel
- Multi-tenant architecture design
- CSS variable generation

### Phase 17: Modern Parable Generator (December 2024) ⚠️ DEPRECATED

- Implemented but theologically flawed
- Moral valence inversion problem
- Replaced by DevotionalSpark

### Phase 18: Subscription & Payment (December 2024) ✅

- Customer portal integration
- Subscription management
- Payment flow verification

### Phase 19: DevotionalSpark (December 28-29, 2025) ✅

- Complete devotional generation system
- Moral valence guardrails
- Target and length options
- Library with copy/print/delete
- Replaced Modern Parable Generator

### Phase 20: Beta-to-Production Architecture (December 31, 2025 - January 1, 2026) ✅

- Platform mode system (private_beta, public_beta, production)
- Tier-based section filtering
- Trial grant/revoke admin features
- Public beta enrollment flow
- SSOT configuration files

### Phase 21: UI/UX Consistency & Help Videos (January 5-7, 2026) ✅

- Complete UI/UX consistency audit
- BRANDING layout system standardization
- Help video infrastructure (VideoModal, useHelpVideo, registry)
- Organization invitation bug fixes
- Data integrity fix (lessons follow user)
- Auth.tsx BRANDING import fix

### Phase 22: Tenant Configuration Architecture (January 8, 2026) ✅

- Complete tenant config system with database backing
- useTenantConfig hook for loading from database
- TenantProvider wired into App.tsx
- Contact & Email section (support email, from email, from name)
- Beta text moved from branding.ts to tenantConfig.ts (Admin-editable)
- Production text section (badge, CTA button, trust text)
- HeroSection reads from tenant config based on platform mode
- 47+ database columns for full tenant customization
- SSOT separation: branding.ts (design), tenantConfig.ts (content), betaEnrollmentConfig.ts (behavior)
- White-label tenants can customize all text via Admin Panel

---

## Recent Commits

### January 8, 2026

| Commit | Description |
|--------|-------------|
| `6a76cb4` | feat: add production mode text to tenant config for white-label self-service |
| `2287fb4` | feat: complete tenant configuration architecture with contact email support |

---

## Technical Debt

### Low Priority (Deferred)

| Item | Notes |
|------|-------|
| Schema cleanup | Migrate `user_roles.role` from enum to text |
| Failed access logging | RLS silent filtering by design |
| Chunk size warnings | Build optimization (non-critical) |

### White-Label Implementation Needed

| Item | Model | Priority |
|------|-------|----------|
| Wildcard DNS configuration | A | High (for subdomain model) |
| tenant_id on all tables | A | High |
| Multi-tenant RLS policies | A | High |
| Usage tracking per tenant | A | Medium |
| Tenant admin role restrictions | A | Medium |
| Environment variable externalization | B | High (for separate deployment) |
| Deployment documentation | B | High |
| Supabase migration scripts | B | Medium |

---

## Debugging Protocol

### Claude's Debugging Rules

1. **STOP** before proposing fixes
2. **Query** the database to understand current state
3. **Identify** root cause with evidence
4. **Then** propose targeted solution
5. **Verify** SSOT compliance before implementation

### Common Commands

```powershell
# View file content
Get-Content "path\to\file.ts"

# Search for pattern
Select-String -Path "src\**\*.tsx" -Pattern "searchterm"

# List files
Get-ChildItem -Path "src\components" -Recurse -Name

# Check if file exists
Test-Path "path\to\file.ts"
```

---

## Contact & Resources

### Links

| Resource | URL |
|----------|-----|
| **Production Site** | https://lessonsparkusa.com |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs |
| **Supabase Functions** | https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions |
| **Supabase Logs** | https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/logs |
| **GitHub Repository** | https://github.com/lynn75965/lesson-spark-usa |
| **Netlify Dashboard** | https://app.netlify.com/projects/lesson-spark-usa |

### Contact

| Method | Value |
|--------|-------|
| **Email** | lynn@lessonsparkusa.com |
| **Phone** | 214.893.5179 |

### Project Info

| Attribute | Value |
|-----------|-------|
| **Supabase Project ID** | hphebzdftpjbiudpfcrs |
| **Local Repository** | C:\Users\Lynn\lesson-spark-usa |

---

## Next Priorities

1. **White-Label Architecture Decision**
   - Choose which model to build first: Model A (Subdomain) or Model B (Separate)
   - Model A requires: wildcard DNS, multi-tenant RLS, usage tracking
   - Model B requires: deployment docs, migration scripts, env externalization

2. **Help Video Activation**
   - Record first video in Camtasia
   - Upload to Vimeo (unlisted)
   - Set `helpVideos.enabled: true` in branding.ts

3. **Production Launch**
   - Final testing of tier enforcement
   - Review PRE_LAUNCH_CHECKLIST.md
   - Switch platform_mode to `production` in System Settings

---

**END OF MASTER DOCUMENT**

*This document is the Single Source of Truth for project continuity.*  
*Update at the end of every session.*  
*Reference at the start of every new chat.*
