// B6 theology golden suite -- pipeline staleness hash.
//
// Hashes every file that can change what a generated lesson's theology
// content looks like. Deliberately whole-file (not just the "relevant"
// lines) -- a false positive (flag a fixture as stale when nothing
// theology-relevant actually changed) just means an extra look before
// the next regeneration run; a false negative (miss a real prompt change)
// is the failure mode this exists to prevent, so it errs toward
// over-triggering rather than under-triggering.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

// Files that determine what goes into the theology-relevant portion of a
// generate-lesson prompt. If any of these change, every fixture's
// prompt_hash goes stale.
export const PIPELINE_INPUT_FILES = [
  'src/constants/theologyProfiles.ts',
  'supabase/functions/_shared/customizationDirectives.ts',
  'supabase/functions/_shared/outputGuardrails.ts',
  'src/constants/modelConfig.ts',
  'supabase/functions/generate-lesson/index.ts',
];

export function computePipelineHash(): string {
  const hash = createHash('sha256');
  for (const relPath of PIPELINE_INPUT_FILES) {
    const absPath = resolve(REPO_ROOT, relPath);
    let content: string;
    try {
      content = readFileSync(absPath, 'utf8');
    } catch {
      content = `<<MISSING: ${relPath}>>`;
    }
    hash.update(relPath);
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  }
  return hash.digest('hex');
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  console.log(computePipelineHash());
}
