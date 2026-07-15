// B6 theology golden suite -- assertion rule derivation.
//
// Imports THEOLOGY_PROFILES and SOUTHERN_BAPTIST_SOTERIOLOGICAL_GUARDRAILS
// directly from the real frontend SSOT (src/constants/theologyProfiles.ts).
// This file adds ZERO new terminology of its own -- every rule below is
// read out of the profile data that already drives production prompts.
// If theologyProfiles.ts changes, these rules change with it automatically.
//
// What is NOT covered here: `guardrails` (prose content-prohibitions) and
// `filterContent` (the full doctrinal description) are not string-matchable
// and are intentionally excluded -- those require Lynn's human read.

import {
  THEOLOGY_PROFILES,
  SOUTHERN_BAPTIST_SOTERIOLOGICAL_GUARDRAILS,
  type TheologyProfile,
} from '../../src/constants/theologyProfiles.ts';

export interface AssertionRule {
  profileId: string;
  profileName: string;
  mustNotContain: string[];
  mustContain: string[];
  humanOnlyNote: string;
}

function deriveOne(profile: TheologyProfile): AssertionRule {
  const mustNotContain: string[] = [...profile.avoidTerminology];
  const mustContain: string[] = [...profile.requiredTerminology];

  const sbc = SOUTHERN_BAPTIST_SOTERIOLOGICAL_GUARDRAILS;
  if ((sbc.appliesToProfileIds as readonly string[]).includes(profile.id)) {
    for (const { phrase } of sbc.prohibitedPhrases) {
      mustNotContain.push(phrase);
    }
  }

  return {
    profileId: profile.id,
    profileName: profile.name,
    mustNotContain,
    mustContain,
    humanOnlyNote:
      'guardrails[] and filterContent are prose-level content prohibitions, ' +
      'not string-assertable -- doctrinal fidelity beyond the term lists above ' +
      'requires human review.',
  };
}

export function deriveAssertionRules(profileId: string): AssertionRule {
  const profile = THEOLOGY_PROFILES.find((p) => p.id === profileId);
  if (!profile) {
    throw new Error(`Unknown theology profile id: ${profileId}`);
  }
  return deriveOne(profile);
}

export function deriveAllAssertionRules(): AssertionRule[] {
  return THEOLOGY_PROFILES.map(deriveOne);
}

// CLI usage: node deriveAssertions.mts [profileId]
// Prints the derived rules as JSON -- useful for a quick sanity check.
import { fileURLToPath } from 'node:url';
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const arg = process.argv[2];
  if (arg) {
    console.log(JSON.stringify(deriveAssertionRules(arg), null, 2));
  } else {
    console.log(JSON.stringify(deriveAllAssertionRules(), null, 2));
  }
}
