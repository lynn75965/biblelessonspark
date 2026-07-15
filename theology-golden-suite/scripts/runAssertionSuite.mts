// B6 theology golden suite -- CI entrypoint, tier (a): assertion-only.
// Zero API calls, zero cost. Walks every committed fixture and re-runs
// the assertion layer against it. Exists to catch SSOT drift: if
// theologyProfiles.ts changes in a way that makes an already-APPROVED
// fixture fail, this is the alarm. It does NOT re-generate anything and
// does NOT prove the current pipeline still produces compliant lessons --
// see checkStaleness.mts for that half of the picture.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFixtureText } from './checkFixture.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_ROOT = resolve(__dirname, '..', 'fixtures');

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: match[2] };
}

function main() {
  if (!existsSync(FIXTURES_ROOT)) {
    console.log('No fixtures directory yet -- nothing to check. Exiting clean.');
    process.exit(0);
  }

  const profileDirs = readdirSync(FIXTURES_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory());
  let checked = 0;
  let failed = 0;
  let skippedNotApproved = 0;

  for (const profileDir of profileDirs) {
    const profileId = profileDir.name;
    const profilePath = resolve(FIXTURES_ROOT, profileId);
    const files = readdirSync(profilePath).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const raw = readFileSync(resolve(profilePath, file), 'utf8');
      const { meta, body } = parseFrontmatter(raw);

      // Only APPROVED fixtures are the "known-good" baseline this check
      // protects. PENDING_REVIEW fixtures haven't been vetted yet, so a
      // failure there isn't a regression -- it just hasn't been looked at.
      if (meta.vet_status !== 'APPROVED') {
        skippedNotApproved++;
        continue;
      }

      checked++;
      const result = checkFixtureText(profileId, body);
      if (!result.passed) {
        failed++;
        console.error(`FAIL: ${profileId}/${file}`);
        for (const v of result.violations) {
          console.error(`  [${v.type}] "${v.term}"${v.context ? ` -- context: "${v.context}"` : ''}`);
        }
      }
    }
  }

  console.log('');
  console.log('==========================================');
  console.log(`THEOLOGY ASSERTION SUITE: ${checked} approved fixture(s) checked, ${failed} failed, ${skippedNotApproved} pending-review skipped`);
  console.log('==========================================');

  if (failed > 0) {
    console.error('One or more APPROVED fixtures now fail assertion -- theologyProfiles.ts likely changed underneath them. Re-vet before relying on these.');
    process.exit(1);
  }
  process.exit(0);
}

main();
