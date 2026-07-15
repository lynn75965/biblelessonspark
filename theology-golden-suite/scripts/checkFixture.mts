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
  passed: boolean;
  violations: Violation[];
}

function findContext(haystack: string, needle: string): string | undefined {
  const idx = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return undefined;
  const start = Math.max(0, idx - 40);
  const end = Math.min(haystack.length, idx + needle.length + 40);
  return haystack.slice(start, end).replace(/\s+/g, ' ').trim();
}

export function checkFixtureText(profileId: string, lessonText: string): CheckResult {
  const rules = deriveAssertionRules(profileId);
  const violations: Violation[] = [];
  const lower = lessonText.toLowerCase();

  for (const term of rules.mustNotContain) {
    if (lower.includes(term.toLowerCase())) {
      violations.push({
        type: 'must-not-contain',
        term,
        context: findContext(lessonText, term),
      });
    }
  }

  for (const term of rules.mustContain) {
    if (!lower.includes(term.toLowerCase())) {
      violations.push({ type: 'missing-required', term });
    }
  }

  return {
    profileId,
    passed: violations.length === 0,
    violations,
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
