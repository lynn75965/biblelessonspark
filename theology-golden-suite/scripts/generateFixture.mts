// B6 theology golden suite -- fixture generator.
//
// Calls the DEPLOYED generate-lesson function over HTTPS, the exact same
// way the frontend does (same URL, same headers, same SSE contract --
// see src/hooks/useEnhanceLesson.tsx, which this mirrors). This is
// deliberate: testing a locally-reimplemented prompt would test a copy,
// not the product.
//
// AUTH: takes a short-lived admin access token via the SUPABASE_ADMIN_TOKEN
// env var (or --token=... CLI arg) for THIS RUN ONLY. Never stores a
// credential anywhere. No scripted login exists in this file or anywhere
// in this suite -- per Lynn's explicit directive, that must never change.
//
// After capturing the fixture, deletes the lessons row (and its
// generation_metrics row) that this run created, so fixture generation
// never pollutes the real LessonLibrary. The fixture's own text is the
// permanent record from this point on, not the DB row.
//
// LIMITATION (logged as part of B6 finding #4, see README): full 8-section
// lessons use generate-lesson's two-phase flow. Phase 1's model (sections
// 1-5) is recoverable via generation_metrics.anthropic_model. Phase 2's
// model (sections 6-8 + teaser) is NOT persisted anywhere by generate-lesson
// today -- not in the DB, not in the SSE stream -- so this harness cannot
// observe it. The fixture frontmatter records this explicitly rather than
// guessing.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ANCHOR_PASSAGES } from './anchorPassages.mts';
import { computePipelineHash } from './computePipelineHash.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUITE_ROOT = resolve(__dirname, '..');

// Same URL and anon key the frontend uses (src/hooks/useEnhanceLesson.tsx) --
// the anon key is a public/publishable key by design, safe to embed here
// exactly as it already is in the shipped frontend bundle.
const SUPABASE_URL = 'https://hphebzdftpjbiudpfcrs.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaGViemRmdHBqYml1ZHBmY3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDk0MjksImV4cCI6MjA3NjM4NTQyOX0.WSNtUrxihquk0ZV0tT7uaad8W3MNjIUwCD4hG0jr-eo';

function getAdminToken(): string {
  const argToken = process.argv.find((a) => a.startsWith('--token='));
  const token = argToken ? argToken.slice('--token='.length) : process.env.SUPABASE_ADMIN_TOKEN;
  if (!token) {
    throw new Error(
      'No admin token supplied. Set SUPABASE_ADMIN_TOKEN env var or pass --token=<jwt> for this run only.'
    );
  }
  return token;
}

interface GenerateResult {
  lessonId: string;
  fullText: string;
  phase1ModelUsed: string | null;
  twoPhase: boolean;
  supplementsCompleted: boolean;
}

async function callGenerateLesson(
  profileId: string,
  passageReference: string,
  adminToken: string
): Promise<GenerateResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-lesson`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      bible_passage: passageReference,
      age_group: 'midlife',
      theology_profile_id: profileId,
      generate_teaser: false,
      freshness_mode: 'fresh',
    }),
  });

  if (!response.ok) {
    let errorBody: any = {};
    try { errorBody = await response.json(); } catch { /* non-JSON body */ }
    throw new Error(
      `generate-lesson returned ${response.status}: ${errorBody.error || response.statusText}`
    );
  }
  if (!response.body) {
    throw new Error('generate-lesson response had no body (expected SSE stream)');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';
  let lessonId: string | null = null;
  let phase1Text = '';
  let twoPhase = false;
  let finalText: string | null = null;
  let supplementsCompleted = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    sseBuffer += decoder.decode(value, { stream: true });
    const messages = sseBuffer.split('\n\n');
    sseBuffer = messages.pop() ?? '';

    for (const message of messages) {
      const dataLine = message.split('\n').find((l) => l.startsWith('data: '));
      if (!dataLine) continue;

      let event: any;
      try { event = JSON.parse(dataLine.slice(6)); } catch { continue; }

      if (event.type === 'done') {
        lessonId = event.lesson.id;
        phase1Text = event.lesson.original_text;
        finalText = phase1Text;
        twoPhase = !!event.two_phase;
        if (!twoPhase) {
          // Single-phase lesson: nothing more will arrive on the stream.
        }
      } else if (event.type === 'supplements') {
        finalText = event.lesson.original_text;
        supplementsCompleted = true;
      } else if (event.type === 'supplements_failed') {
        console.warn(`  [warn] Phase 2 supplements failed: ${event.message}`);
      } else if (event.type === 'error') {
        throw new Error(`generate-lesson stream error: ${event.error}`);
      }
    }
  }

  if (!lessonId || finalText === null) {
    throw new Error('Stream ended without a "done" event -- no lesson captured');
  }
  if (twoPhase && !supplementsCompleted) {
    console.warn(
      '  [warn] Two-phase lesson but no "supplements" event arrived -- ' +
      'fixture only has sections 1-5. Re-run if a full 8-section fixture is needed.'
    );
  }

  return { lessonId, fullText: finalText, phase1ModelUsed: null, twoPhase, supplementsCompleted };
}

async function lookupPhase1Model(supabase: any, lessonId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('generation_metrics')
    .select('anthropic_model')
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (error) {
    console.warn(`  [warn] Could not look up generation_metrics for model tracking: ${error.message}`);
    return null;
  }
  return data?.anthropic_model ?? null;
}

async function cleanupLessonRow(supabase: any, lessonId: string): Promise<void> {
  const { error: metricsErr } = await supabase.from('generation_metrics').delete().eq('lesson_id', lessonId);
  if (metricsErr) console.warn(`  [warn] Could not delete generation_metrics row: ${metricsErr.message}`);

  const { error: lessonErr } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (lessonErr) {
    console.warn(`  [warn] Could not delete lessons row ${lessonId}: ${lessonErr.message}. Delete it by hand.`);
  } else {
    console.log(`  Cleaned up lessons row ${lessonId} (fixture text already captured to file).`);
  }
}

function writeFixtureFile(
  profileId: string,
  passageSlug: string,
  result: GenerateResult,
  pipelineHash: string
): string {
  const dir = resolve(SUITE_ROOT, 'fixtures', profileId);
  mkdirSync(dir, { recursive: true });
  const filePath = resolve(dir, `${passageSlug}.md`);

  const promptHash = createHash('sha256').update(pipelineHash).update(profileId).digest('hex').slice(0, 16);

  const frontmatter = [
    '---',
    `profile_id: ${profileId}`,
    `passage_slug: ${passageSlug}`,
    `generated_at: ${new Date().toISOString()}`,
    `phase1_model_used: ${result.phase1ModelUsed ?? 'unknown'}`,
    `phase2_model_used: ${result.twoPhase ? 'UNKNOWN -- not persisted by generate-lesson (see B6 finding #4)' : 'n/a (single-phase lesson)'}`,
    `two_phase: ${result.twoPhase}`,
    `supplements_completed: ${result.supplementsCompleted}`,
    `pipeline_hash: ${pipelineHash}`,
    `fixture_hash: ${promptHash}`,
    'vet_status: PENDING_REVIEW',
    'reviewer_notes: ""',
    '---',
    '',
  ].join('\n');

  writeFileSync(filePath, frontmatter + result.fullText, 'utf8');
  return filePath;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const [profileId, passageSlug] = args;
  if (!profileId || !passageSlug) {
    console.error('Usage: node generateFixture.mts <profileId> <passageSlug> [--token=<jwt>]');
    console.error(`Known passage slugs: ${ANCHOR_PASSAGES.map((p) => p.slug).join(', ')}`);
    process.exit(2);
  }

  const passage = ANCHOR_PASSAGES.find((p) => p.slug === passageSlug);
  if (!passage) {
    console.error(`Unknown passage slug: ${passageSlug}`);
    console.error(`Known: ${ANCHOR_PASSAGES.map((p) => p.slug).join(', ')}`);
    process.exit(2);
  }

  const adminToken = getAdminToken();
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${adminToken}` } },
  });

  console.log(`Generating fixture: ${profileId} / ${passage.reference} ...`);
  const result = await callGenerateLesson(profileId, passage.reference, adminToken);
  console.log(`  Lesson ${result.lessonId} captured (${result.fullText.length} chars, two_phase=${result.twoPhase}).`);

  result.phase1ModelUsed = await lookupPhase1Model(supabase, result.lessonId);
  console.log(`  Phase 1 model used: ${result.phase1ModelUsed ?? 'unknown'}`);
  if (result.twoPhase) {
    console.log('  Phase 2 model used: UNKNOWN (not observable -- see B6 finding #4)');
  }

  const pipelineHash = computePipelineHash();
  const filePath = writeFixtureFile(profileId, passageSlug, result, pipelineHash);
  console.log(`  Fixture written: ${filePath}`);

  await cleanupLessonRow(supabase, result.lessonId);

  console.log('Done.');
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
