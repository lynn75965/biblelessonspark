/**
 * SSOT: Output Guardrails — Truth & Integrity Verification
 * Source: src/constants/outputGuardrails.ts
 * 
 * Frontend drives backend — defined here, synced to supabase/functions/_shared/
 * 
 * PURPOSE: Catch AI fabrications AFTER generation, BEFORE saving to database.
 * When violations are found, the offending section is automatically rewritten.
 * Clean lessons pass through with ZERO added cost or delay.
 *
 * TO ADD NEW RULES: Add patterns to VIOLATION_PATTERNS array below.
 * All patterns are checked against every generated lesson automatically.
 */

export const OUTPUT_GUARDRAILS_VERSION = "1.0.0";

// =========================================================================
// TYPES
// =========================================================================

export type ViolationCategory =
  | 'fabricated_event'      // Made-up news stories, current events
  | 'fabricated_quote'      // Invented quotes attributed to people
  | 'fabricated_statistic'  // Made-up percentages, studies, surveys
  | 'assumed_local'         // References to "our state/city" as if real
  | 'false_currency';       // Presenting fiction as "this week" or "recently"

export interface ViolationPattern {
  id: string;
  category: ViolationCategory;
  pattern: RegExp;
  description: string;
}

export interface SectionViolation {
  patternId: string;
  category: ViolationCategory;
  matchedText: string;
  description: string;
}

export interface SectionCheckResult {
  sectionId: number;
  sectionName: string;
  sectionContent: string;
  violations: SectionViolation[];
}

export interface GuardrailCheckResult {
  passed: boolean;
  sectionsChecked: number;
  sectionsWithViolations: number;
  results: SectionCheckResult[];
  totalViolations: number;
}

// =========================================================================
// VIOLATION PATTERNS — Add new non-negotiable rules here
// =========================================================================
// Each pattern is checked against sections 4-8 of every generated lesson.
// When a match is found, the section is automatically rewritten before
// the lesson reaches the teacher.
//
// Pattern IDs use category prefixes:
//   FE = Fabricated Event
//   FQ = Fabricated Quote
//   FS = Fabricated Statistic
//   AL = Assumed Local knowledge
//   FC = False Currency (fake "this week" claims)
// =========================================================================

export const VIOLATION_PATTERNS: ViolationPattern[] = [

  // --- FABRICATED EVENTS (FE) ---
  { id: 'FE01', category: 'fabricated_event', pattern: /you may have (?:seen|heard)(?: about)? the news/i, description: 'Fabricated news story reference' },
  { id: 'FE02', category: 'fabricated_event', pattern: /you might have (?:seen|heard|read)(?: about)? (?:the|a) /i, description: 'Fabricated news reference' },
  { id: 'FE03', category: 'fabricated_event', pattern: /(?:was|made|hit) (?:in )?the news (?:this|last) week/i, description: 'Fabricated weekly news reference' },
  { id: 'FE04', category: 'fabricated_event', pattern: /made (?:national |local |international )?headlines/i, description: 'Fabricated headline reference' },
  { id: 'FE05', category: 'fabricated_event', pattern: /(?:I |you may have )?(?:read|saw|seen) an article/i, description: 'Fabricated article reference' },
  { id: 'FE06', category: 'fabricated_event', pattern: /(?:I |you may have )?(?:read|saw|seen) a (?:news |recent )?story/i, description: 'Fabricated story reference' },
  { id: 'FE07', category: 'fabricated_event', pattern: /a (?:news|media) report (?:this|last) week/i, description: 'Fabricated media report' },
  { id: 'FE08', category: 'fabricated_event', pattern: /(?:just |recently )?broke ground in/i, description: 'Fabricated construction/project event' },
  { id: 'FE09', category: 'fabricated_event', pattern: /the reporter (?:interviewed|spoke with|asked|said)/i, description: 'Fabricated reporter interaction' },
  { id: 'FE10', category: 'fabricated_event', pattern: /(?:a |the )(?:local|national) (?:news )?(?:station|channel|outlet|newspaper) (?:reported|covered|ran|published)/i, description: 'Fabricated news coverage' },
  { id: 'FE11', category: 'fabricated_event', pattern: /there was a (?:story|report|segment|piece) (?:on|in|about) (?:the news|CNN|Fox|NBC|ABC|CBS|NPR)/i, description: 'Fabricated specific media reference' },
  { id: 'FE12', category: 'fabricated_event', pattern: /(?:a |the )viral (?:video|post|story|article|image) (?:this|last) week/i, description: 'Fabricated viral content reference' },

  // --- FABRICATED QUOTES (FQ) ---
  { id: 'FQ01', category: 'fabricated_quote', pattern: /(?:the|a) (?:project manager|construction manager|foreman|CEO|director|manager|supervisor|coordinator|spokesman|spokesperson) (?:said|told|explained|noted|remarked|stated)[^.]*["\u201C][^"\u201D]+["\u201D]/i, description: 'Fabricated quote from unnamed authority figure' },
  { id: 'FQ02', category: 'fabricated_quote', pattern: /(?:he|she) said something (?:fascinating|interesting|remarkable|profound|striking|surprising)[^.]*["\u201C][^"\u201D]+["\u201D]/i, description: 'Fabricated dramatic quote attribution' },
  { id: 'FQ03', category: 'fabricated_quote', pattern: /(?:a |one )(?:teacher|professor|coach|counselor|therapist|doctor|scientist|researcher|historian|expert) (?:once )?(?:said|told|shared|wrote)[^.]*["\u201C][^"\u201D]+["\u201D]/i, description: 'Fabricated professional quote' },
  { id: 'FQ04', category: 'fabricated_quote', pattern: /(?:as )?(?:one |a )(?:writer|author|poet|philosopher|thinker) (?:once )?(?:put it|said|wrote|observed)[^.]*["\u201C][^"\u201D]+["\u201D]/i, description: 'Fabricated intellectual quote' },

  // --- FABRICATED STATISTICS (FS) ---
  { id: 'FS01', category: 'fabricated_statistic', pattern: /a recent (?:study|survey|poll|report|analysis) (?:showed|found|revealed|indicated|confirmed|suggested) that \d/i, description: 'Fabricated study with specific numbers' },
  { id: 'FS02', category: 'fabricated_statistic', pattern: /according to (?:a |the )?recent (?:study|survey|poll|report|research)/i, description: 'Fabricated source attribution' },
  { id: 'FS03', category: 'fabricated_statistic', pattern: /(?:research|studies|data|statistics|experts) (?:show|suggest|indicate|confirm|reveal) that \d+%/i, description: 'Fabricated statistical claim' },
  { id: 'FS04', category: 'fabricated_statistic', pattern: /\d+(?:\.\d+)?% of (?:people|Americans|adults|teens|teenagers|students|Christians|churches|families|couples|workers|employees|respondents|participants)/i, description: 'Fabricated demographic percentage' },
  { id: 'FS05', category: 'fabricated_statistic', pattern: /(?:a |the )?(?:Gallup|Pew|Barna|Harvard|Stanford|MIT|Yale) (?:study|survey|poll|report|research) (?:found|showed|revealed|indicates)/i, description: 'Fabricated institutional study reference' },

  // --- ASSUMED LOCAL KNOWLEDGE (AL) ---
  { id: 'AL01', category: 'assumed_local', pattern: /(?:here )?in our (?:state|city|town|county|region|area|neighborhood|part of the country)(?:,| )/i, description: 'Assumed geographic locality' },
  { id: 'AL02', category: 'assumed_local', pattern: /(?:right here|just down the road|in our neighborhood|on our street|around the corner from)/i, description: 'Fabricated hyper-local reference' },
  { id: 'AL03', category: 'assumed_local', pattern: /(?:in|across|throughout) our state[^.]*(?:just|recently|this week|last week|this month)/i, description: 'Fabricated state-level current event' },
  { id: 'AL04', category: 'assumed_local', pattern: /our (?:local|city|town|county) (?:government|council|board|school district|police|fire department) (?:just|recently|this week)/i, description: 'Fabricated local government event' },

  // --- FALSE CURRENCY (FC) ---
  { id: 'FC01', category: 'false_currency', pattern: /(?:just |earlier |happened )?this (?:past )?week[^.]*(?:billion|million|massive|enormous|huge|major|infrastructure|construction|project|building)/i, description: 'False "this week" claim with specific event details' },
  { id: 'FC02', category: 'false_currency', pattern: /that (?:just )?happened (?:just )?(?:this week|yesterday|last week|this morning|today|last night)/i, description: 'False recent event claim' },
  { id: 'FC03', category: 'false_currency', pattern: /I want to start with something that (?:just )?happened/i, description: 'False current event opening' },
  { id: 'FC04', category: 'false_currency', pattern: /something (?:interesting|amazing|remarkable|incredible|fascinating) (?:just )?happened (?:in|this|last)/i, description: 'False remarkable current event claim' },
  { id: 'FC05', category: 'false_currency', pattern: /(?:did you|have you) (?:see|hear|read|catch|notice) (?:about |what happened )?(?:this|last) (?:week|weekend|month)/i, description: 'False "did you see" current event reference' },
];

// =========================================================================
// SECTIONS TO CHECK — only sections that generate illustrations/hooks
// Sections 1-3 are factual/structural and don't produce illustrations
// =========================================================================
export const SECTIONS_TO_CHECK = [4, 5, 6, 7, 8];

// =========================================================================
// REWRITE CONFIGURATION
// =========================================================================
export const REWRITE_CONFIG = {
  maxTokens: 4000,         // Enough for 1-3 section rewrites
  temperature: 0.4,        // Lower temp for controlled, safe output
  timeoutMs: 60000,        // 60 second timeout for rewrite call
};

// =========================================================================
// SECTION PARSER — extracts individual sections from generated lesson
// =========================================================================

export interface ParsedSection {
  id: number;
  name: string;
  content: string;
}

export function parseLessonSections(lessonText: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const sectionRegex = /## Section (\d+): ([^\n]+)\n([\s\S]*?)(?=## Section \d+:|$)/g;

  let match;
  while ((match = sectionRegex.exec(lessonText)) !== null) {
    const id = parseInt(match[1], 10);
    const name = match[2].trim();
    let content = match[3].trim();
    // Remove trailing --- separator
    content = content.replace(/\n---\s*$/, '').trim();

    sections.push({ id, name, content });
  }

  return sections;
}

// =========================================================================
// GUARDRAIL CHECKER — runs all patterns against lesson sections
// Returns immediately if no violations (zero cost for clean lessons)
// =========================================================================

export function checkOutputGuardrails(lessonText: string): GuardrailCheckResult {
  const parsedSections = parseLessonSections(lessonText);
  const results: SectionCheckResult[] = [];
  let totalViolations = 0;
  let sectionsWithViolations = 0;

  for (const section of parsedSections) {
    // Only check sections that generate illustrations
    if (!SECTIONS_TO_CHECK.includes(section.id)) continue;

    const violations: SectionViolation[] = [];

    for (const pattern of VIOLATION_PATTERNS) {
      const match = section.content.match(pattern.pattern);
      if (match) {
        // Extract context around the match (up to 200 chars)
        const fullText = section.content;
        const matchIndex = fullText.indexOf(match[0]);
        const contextStart = Math.max(0, matchIndex - 50);
        const contextEnd = Math.min(fullText.length, matchIndex + match[0].length + 100);
        const matchedText = fullText.substring(contextStart, contextEnd);

        violations.push({
          patternId: pattern.id,
          category: pattern.category,
          matchedText: matchedText.trim(),
          description: pattern.description
        });
      }
    }

    if (violations.length > 0) {
      sectionsWithViolations++;
      totalViolations += violations.length;
    }

    results.push({
      sectionId: section.id,
      sectionName: section.name,
      sectionContent: section.content,
      violations
    });
  }

  return {
    passed: totalViolations === 0,
    sectionsChecked: results.length,
    sectionsWithViolations,
    results,
    totalViolations
  };
}

// =========================================================================
// REWRITE PROMPT BUILDER — creates targeted prompt for ONLY violated sections
// =========================================================================

export function buildRewritePrompt(
  violatedSections: SectionCheckResult[]
): { system: string; user: string } {

  const violationDetails = violatedSections.map(section => {
    const violationList = section.violations.map(v =>
      `  - [${v.patternId}] ${v.description}\n    Context: "${v.matchedText}"`
    ).join('\n');

    return `## Section ${section.sectionId}: ${section.sectionName}

VIOLATIONS DETECTED:
${violationList}

ORIGINAL CONTENT TO REWRITE:
${section.sectionContent}`;
  }).join('\n\n=========\n\n');

  const system = `You are rewriting specific sections of a Baptist Bible study lesson to fix truth and integrity violations.

A teacher will read this content VERBATIM to their Sunday School class. If you fabricate a fact, a teacher will unknowingly present a lie to their students. This is a matter of ministerial integrity.

REWRITE RULES (NON-NEGOTIABLE):
1. Replace ALL fabricated events, news stories, quotes, and statistics with HONEST alternatives
2. Use CLEARLY HYPOTHETICAL framing: "Imagine...", "Think about...", "Picture this...", "Consider..."
3. OR use UNIVERSAL HUMAN EXPERIENCES: "Most of us have felt...", "We've all had moments where..."
4. OR use VERIFIABLE BIBLICAL EXAMPLES drawn directly from Scripture
5. Maintain the EXACT SAME approximate word count, tone, and teaching flow
6. Keep ALL theological content, scripture references, and teaching points intact
7. ONLY change the parts that contain violations — preserve everything else verbatim
8. Return the rewritten section(s) in the EXACT SAME markdown format

NEVER fabricate news stories, current events, statistics, surveys, studies, or quotes.
NEVER reference "our state", "our city", "our community" as if describing real events.
NEVER present fictional scenarios as if they actually happened.
NEVER invent quotes attributed to any person, real or fictional.`;

  const user = `The following section(s) of a generated Bible study lesson contain truth and integrity violations. Rewrite ONLY these section(s), fixing the violations while preserving all other content.

${violationDetails}

Return ONLY the rewritten section(s) in this EXACT format (one per violated section):

## Section [N]: [Section Name]

[Rewritten content here]

---

Fix ONLY the flagged violations. Preserve all teaching content, scripture references, and theological depth. Maintain the same word count target.`;

  return { system, user };
}

// =========================================================================
// SECTION REPLACER — swaps rewritten sections back into the full lesson
// =========================================================================

export function replaceSections(
  originalLesson: string,
  rewrittenSections: ParsedSection[]
): string {
  let updatedLesson = originalLesson;

  for (const rewritten of rewrittenSections) {
    // Build regex to match the original section (from header to next section or end)
    const sectionRegex = new RegExp(
      `## Section ${rewritten.id}: [^\\n]+\\n[\\s\\S]*?(?=## Section \\d+:|$)`,
    );

    const replacement = `## Section ${rewritten.id}: ${rewritten.name}\n\n${rewritten.content}\n\n---\n\n`;
    updatedLesson = updatedLesson.replace(sectionRegex, replacement);
  }

  return updatedLesson;
}
