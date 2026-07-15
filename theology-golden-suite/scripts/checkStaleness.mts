// B6 theology golden suite -- CI entrypoint, tier (a.5): staleness check.
// Zero API calls, zero cost. Computes the current pipeline hash and
// compares it against every fixture's stored pipeline_hash. Reports which
// fixtures were captured under an older pipeline state -- these are
// CANDIDATES for a future manual regeneration run (tier b), not proof
// anything is actually wrong. Never triggers regeneration itself.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePipelineHash } from './computePipelineHash.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_ROOT = resolve(__dirname, '..', 'fixtures');

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return meta;
}

function main() {
  if (!existsSync(FIXTURES_ROOT)) {
    console.log('No fixtures directory yet -- nothing to check. Exiting clean.');
    process.exit(0);
  }

  const currentHash = computePipelineHash();
  const profileDirs = readdirSync(FIXTURES_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory());

  const stale: string[] = [];
  let total = 0;

  for (const profileDir of profileDirs) {
    const profilePath = resolve(FIXTURES_ROOT, profileDir.name);
    const files = readdirSync(profilePath).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      total++;
      const meta = parseFrontmatter(readFileSync(resolve(profilePath, file), 'utf8'));
      if (meta.pipeline_hash !== currentHash) {
        stale.push(`${profileDir.name}/${file}`);
      }
    }
  }

  console.log('==========================================');
  console.log(`THEOLOGY STALENESS CHECK: ${total} fixture(s), ${stale.length} stale (pipeline changed since capture)`);
  console.log(`Current pipeline hash: ${currentHash}`);
  console.log('==========================================');
  if (stale.length > 0) {
    console.log('Stale fixtures (candidates for a manual regeneration run, not an error):');
    for (const f of stale) console.log(`  - ${f}`);
  }

  // Always exits 0 -- staleness is informational, never a CI failure.
  // Whether to act on it is a manual, human decision (tier b).
  process.exit(0);
}

main();
