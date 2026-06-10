# Source Citations -- Factual Claims About Competitors

Every factual claim made about the five competitors on the BLS Competitive Comparison page (/compare) is documented below with its source. Claims about BLS itself are sourced from the PROJECT_MASTER.md product specification and the pricing SSOT (src/constants/pricingConfig.ts, trialConfig.ts).

This file is the citation record relocated from the import package (originally _import/comparison/SOURCES.md). Em/en dashes were converted to ASCII when relocated.

---

## 1. LifeWay Christian Resources

| Claim | Source |
|-------|--------|
| SBC's default publisher since 1891 | LifeWay corporate history; Faith Baptist Theological Seminary, "An Overview of Sunday School Publishers" (faith.edu/faith-pulpit/posts/an-overview-of-sunday-school-publishers/) |
| Serves approximately 47,000 SBC-affiliated churches | Southern Baptist Convention Annual Church Profile data; SBC.net denominational statistics |
| Product lines: Explore the Bible, Bible Studies for Life, The Gospel Project | LifeWay.com curriculum catalog (lifeway.com/en/shop/bible-studies) |
| Hyfi digital platform | myhyfi.com -- LifeWay's digital curriculum delivery platform launched 2024 |
| Quarterly purchases per age group at $15-30+ per department | LifeWay.com pricing pages for leader guides and learner guides per quarter; pricing varies by product line and format |
| Pre-written centralized curriculum, identical content per quarter | Structural observation: all LifeWay curriculum follows a fixed editorial calendar published annually; churches purchasing the same product line receive identical content |
| Teachers cannot customize passage selection | Structural observation: LifeWay curriculum is pre-authored; teachers receive a leader guide with fixed passages per session |

---

## 2. Regular Baptist Press

| Claim | Source |
|-------|--------|
| GARBC publishing arm since 1952 | Faith Baptist Theological Seminary, "An Overview of Sunday School Publishers" (faith.edu/faith-pulpit/posts/an-overview-of-sunday-school-publishers/); RBP corporate history at regularbaptistpress.org |
| 4-year departmental cycle | RBP curriculum scope and sequence documentation; Faith.edu overview article confirms the multi-year rotating cycle structure |
| Serves fundamental Baptist churches | RBP's stated mission and GARBC denominational affiliation |
| KJV/NKJV preference | RBP product descriptions specify KJV and NKJV as primary Bible versions used |
| Dispensational theology | RBP doctrinal statement and GARBC Articles of Faith (premillennial, dispensational) |
| Print-primary model with PDF supplements | RBP ordering system at regularbaptistpress.org; digital supplements are secondary to print quarterlies |
| Pricing exceeds $9/month per department per quarter | RBP ordering catalog; individual department quarterlies range $3-6 per student copy plus teacher materials, totaling well above $9/quarter for any single department |

---

## 3. Randall House / D6 Curriculum

| Claim | Source |
|-------|--------|
| Free Will Baptist publisher | Randall House Publications corporate identity; d6family.com "About" page |
| D6 family-aligned discipleship model | d6family.com -- the D6 model is named after Deuteronomy 6 and explicitly markets family-aligned, all-ages-same-theme curriculum |
| All ages study same theme with take-home devotionals | D6 Curriculum product descriptions at d6curriculum.com; the "D6 EveryDay" devotional magazine is the take-home component |
| Connecting church teaching to home | Core D6 marketing proposition stated on d6family.com and in Ron Hunter Jr.'s published works on the D6 model |
| Fixed editorial calendar from Nashville | Randall House is headquartered in Nashville, TN; curriculum themes are set by the editorial team on a quarterly cycle |

---

## 4. Answers Bible Curriculum

| Claim | Source |
|-------|--------|
| Published by Answers in Genesis | answersingenesis.org/bible-curriculum/ |
| 3-year chronological Bible survey | ABC product description: "a 3-year chronological study through the entire Bible" (answersingenesis.org/bible-curriculum/) |
| Young-earth creation apologetics emphasis | Answers in Genesis organizational mission; ABC integrates apologetics and young-earth creation teaching throughout every lesson |
| "Whole family studying the same passage" model | ABC marketing: "The whole church -- from preschool through adult -- studies the same lesson theme each week" |
| myAnswers app (ABC Digital) | answersingenesis.org/bible-curriculum/digital/ -- the myAnswers platform/app for digital access |
| $20-30 per quarter per age group | ABC pricing at answersingenesis.org store; teacher/student packs priced per age group per quarter |
| Zero customization for teacher's specific class | Structural observation: ABC is pre-authored with fixed lessons per week; no customization interface exists |
| Rigid three-year commitment | Structural observation: ABC is designed as a continuous 3-year cycle; entering mid-cycle means starting mid-narrative |

---

## 5. Bogard Press

| Claim | Source |
|-------|--------|
| American Baptist Association's publisher | bogardpress.org "About" page; Faith Baptist Theological Seminary overview article |
| KJV-only | Bogard Press product descriptions exclusively reference the King James Version |
| Serving Landmark/Missionary Baptist churches | ABA denominational identity; Bogard Press serves ABA-affiliated churches which identify as Landmark Baptist |
| Over 100 years of publishing | Bogard Press history; the ABA publishing ministry traces to the early 1900s |
| Denominationally subsidized pricing | Bogard Press pricing is notably lower than commercial publishers due to ABA denominational support |
| Primarily a print publisher | Observation: bogardpress.org offers ordering but no digital curriculum delivery platform, no app, no online lesson viewer |
| Fixed quarterly cycle | Standard quarterly publication model matching all traditional Sunday School publishers |
| Print-only distribution model | Bogard Press ships physical quarterlies; no digital download or online access option available |
| Shipping delays and minimum-order requirements | Standard print-publisher logistics; rural churches report ordering lead times |

---

## BLS Claims (sourced from PROJECT_MASTER.md and the pricing SSOT)

| Claim | Source Location |
|-------|-----------------|
| $9/month or $90/year pricing | PRICING_DISPLAY.personal (src/constants/pricingConfig.ts) |
| Free tier: 5 lessons/month | TIER_LESSON_LIMITS.free = 5 (pricingConfig.ts); TRIAL_CONFIG 3 full + 2 short per rolling 30 days (trialConfig.ts) |
| 14 teacher/class customization descriptors | Step 3 customization system (TeacherCustomization.tsx) |
| 10 Baptist theology profiles | Theology profile system (theologyProfiles.ts) |
| 5 pedagogical lesson shapes (reshape) | Lesson Shapes Guide (LessonShapesGuide.tsx, lessonShapeProfiles.ts) |
| Publishable series (2-13 lessons) | Publishing Hub (PublishingHub.tsx, series system) |
| DevotionalSpark (7 devotionals/month) | DevotionalSpark feature (devotionalConfig.ts) |
| Sermon-aligned all-age curriculum | Sermon-alignment generation capability |
| Age range: 3 years to senior adults | Age group selection system (ageGroups.ts) |
| Paperless / digital-native | Architecture: Vite + React + Supabase web platform |
| Export to PDF and DOCX | DOCX/PDF export system (export utils) |
| Church plant optimized | ChurchPlantReport.tsx marketing page |
| Family/home/mixed-ages descriptors | Step 3 class context selections |
| Reshape consumes one lesson credit | Reshape credit system (usage/billing logic) |

---

## Research Method

Primary research was conducted via:
1. Faith Baptist Theological Seminary -- "An Overview of Sunday School Publishers" (faith.edu) -- comprehensive denominational publisher survey
2. Direct publisher websites -- LifeWay.com, regularbaptistpress.org, d6family.com, d6curriculum.com, answersingenesis.org, bogardpress.org
3. myhyfi.com -- LifeWay's digital platform documentation
4. PROJECT_MASTER.md -- BLS product specification and development history

All competitor pricing claims represent approximate ranges based on publicly listed catalog prices at the time of research (June 2026) and may vary by format, quantity, or promotional pricing.
