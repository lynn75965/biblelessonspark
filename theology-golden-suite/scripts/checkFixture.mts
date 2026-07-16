// B6 theology golden suite -- pure assertion checker.
// No API calls, no filesystem I/O beyond what the caller passes in.
// Given a theology profile id and a block of lesson text, reports every
// mustNotContain hit and every missing mustContain term.

import { deriveAssertionRules } from './deriveAssertions.mts';

export interface Violation {
  type: 'must-not-contain' | 'missing-required';
  term: string;
  context?: string;
}

export interface CheckResult {
  profileId: string;
  // passed reflects mustNotContain (avoidTerminology) hits ONLY.
  // requiredTerminology is advisory -- see README.md "requiredTerminology
  // semantics": it describes how a faithful teacher in that tradition
  // works, not a per-lesson checklist a single passage must tick every
  // box of. A missing-required flag is surfaced for human review, never
  // treated as a fixture regression on its own.
  passed: boolean;
  violations: Violation[];
  advisories: Violation[];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Word-boundary-anchored, case-insensitive. Plain substring matching would
// false-positive "conditional election" inside "UNconditional election" --
// a required phrase for several profiles containing a banned one as a
// literal substring. \b correctly does NOT match between "un" and
// "conditional" (both word characters, no boundary), so this fixes that
// whole class of false positive without needing a manual exceptions list.
function findMatch(haystack: string, term: string): RegExpMatchArray | null {
  const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
  return haystack.match(pattern);
}

function findContext(haystack: string, match: RegExpMatchArray): string {
  const idx = match.index ?? 0;
  const start = Math.max(0, idx - 40);
  const end = Math.min(haystack.length, idx + match[0].length + 40);
  return haystack.slice(start, end).replace(/\s+/g, ' ').trim();
}

export function checkFixtureText(profileId: string, lessonText: string): CheckResult {
  const rules = deriveAssertionRules(profileId);
  const violations: Violation[] = [];
  const advisories: Violation[] = [];

  for (const term of rules.mustNotContain) {
    const match = findMatch(lessonText, term);
    if (match) {
      violations.push({
        type: 'must-not-contain',
        term,
        context: findContext(lessonText, match),
      });
    }
  }

  for (const term of rules.mustContain) {
    if (!findMatch(lessonText, term)) {
      advisories.push({ type: 'missing-required', term });
    }
  }

  return {
    profileId,
    passed: violations.length === 0,
    violations,
    advisories,
  };
}

// CLI usage: node checkFixture.mts <profileId> <path-to-fixture.md>
import { fileURLToPath } from 'node:url';
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const [, , profileId, filePath] = process.argv;
  if (!profileId || !filePath) {
    console.error('Usage: node checkFixture.mts <profileId> <path-to-fixture.md>');
    process.exit(2);
  }
  const fs = await import('node:fs');
  const text = fs.readFileSync(filePath, 'utf8');
  // Strip YAML frontmatter if present before checking.
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  const result = checkFixtureText(profileId, body);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}
