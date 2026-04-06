## WHAT'S NEXT

### Voice Navigation -- IN PROGRESS, set aside April 6, 2026
Partial implementation deployed. Current state:
- Sidebar voice navigation working for most items -- "Publishing" label match unconfirmed
- "Build Lesson" voice command not navigating correctly -- tab switch vs route issue unresolved
- Microphone icons on Bible Passage and Topic or Question fields working
- Additional Notes field has microphone icon
- Scripture Foundation card selection (3 cards in Step 1) has no voice support
- Step 2 dropdowns (Age Group, Theology Profile, Bible Version) have no voice support
- Generate Lesson button has no voice activation
- Full interactive element map of Build Lesson flow needed before further work
- Fundamental requirement: a user who cannot type or use a mouse must be able to complete the entire Build Lesson flow by voice alone -- from Step 1 card selection through Generate
- Files involved: src/utils/useSpeechInput.ts, src/components/layout/AppShell.tsx, src/components/dashboard/EnhanceLessonForm.tsx
- Next step: complete interactive element map, then redesign voice system to cover every interaction point

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