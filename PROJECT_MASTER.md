

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