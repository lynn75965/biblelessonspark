// Deterministic, zero-API-cost regression test for outputGuardrails.ts's
// VIOLATION_PATTERNS. Runs the real checkOutputGuardrails() -- the exact
// function generate-lesson calls in production -- against synthetic
// section-5-shaped fixtures. Exists to catch regressions like the AL02
// "right here" over-firing incident (2026-07: 5 real false positives
// logged in guardrail_violations before this suite existed).
//
// Not part of theology-golden-suite/ -- that suite's own README explicitly
// excludes outputGuardrails.ts from its charter. This is a separate,
// narrower check of the Truth & Integrity fabrication patterns only.

import { checkOutputGuardrails } from '../src/constants/outputGuardrails.ts';

interface Fixture {
  description: string;
  text: string;
  expectFlag: boolean; // true: AL02 must fire; false: AL02 must NOT fire
}

const FIXTURES: Fixture[] = [
  // Must NOT flag -- the 5 real false positives that prompted this suite.
  {
    description: 'Joshua: rhetorical "right here" referring to Scripture',
    expectFlag: false,
    text: 'That is a Baptist conviction rooted right here in the Old Testament.',
  },
  {
    description: 'Encourage a loved one: "right here" in a modeled prayer',
    expectFlag: false,
    text: 'Short prayer: "Meet her right here." Short. Honest. Directed.',
  },
  {
    description: 'Genesis 1: "right here" referring to the passage itself',
    expectFlag: false,
    text: 'This is not just a political position; it is a theological one, rooted right here in Genesis 1.',
  },
  {
    description: '2 Kings 1:1-18: "right here, right now" as a rhetorical device',
    expectFlag: false,
    text: "Obedience is not somewhere out in the future. It's right here, right now, in the next faithful step.",
  },
  {
    description: '1961 Letter (Carl Jung/Bill Wilson): "right here, right now" applied to the class',
    expectFlag: false,
    text: 'What would it look like for our class -- right here, right now -- to be the kind of community where someone in the grip of addiction could find genuine hope?',
  },

  // Must still flag AL02 -- genuine invented hyper-local claims.
  {
    description: 'Invented specific address ("just down the road")',
    expectFlag: true,
    text: 'I know a family that lives just down the road, at the old Hutchins place, going through this exact same struggle right now.',
  },
  {
    description: 'Invented named business ("around the corner from")',
    expectFlag: true,
    text: "There's a shop around the corner from my house, Miller's Hardware, where the owner told me this same story last week.",
  },
  {
    description: 'Invented named landmark ("in our neighborhood")',
    expectFlag: true,
    text: 'In our neighborhood, right next to Riverside Elementary, a family is dealing with this very issue this week.',
  },
  {
    description: 'Invented named family ("on our street")',
    expectFlag: true,
    text: 'On our street, the Alvarez family just went through a health scare almost identical to what we are studying today.',
  },
];

function wrapAsSection(text: string): string {
  return `## Section 5: Main Teaching Content (Teacher Transcript)\n\n${text}\n\n---\n\n`;
}

let failures = 0;

for (const fixture of FIXTURES) {
  const result = checkOutputGuardrails(wrapAsSection(fixture.text));
  const al02Fired = result.results.some((r) => r.violations.some((v) => v.patternId === 'AL02'));

  const pass = al02Fired === fixture.expectFlag;
  const label = pass ? 'PASS' : 'FAIL';
  console.log(
    `[${label}] ${fixture.description} -- expected AL02 ${fixture.expectFlag ? 'TO FIRE' : 'NOT to fire'}, got ${al02Fired ? 'FIRED' : 'did not fire'}`
  );

  if (!pass) failures++;
}

console.log('');
if (failures > 0) {
  console.log(`GUARDRAIL PATTERN FIXTURES: ${failures}/${FIXTURES.length} FAILED`);
  process.exit(1);
} else {
  console.log(`GUARDRAIL PATTERN FIXTURES: all ${FIXTURES.length} passed`);
  process.exit(0);
}
