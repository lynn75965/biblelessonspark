/**
 * Scripture Integrity Guardrail (SSOT)
 *
 * Single authoritative source for the "Rule 5" scripture-integrity instruction
 * shared across ALL content generators and the frontend-assembled reshape prompt.
 *
 * Consumers:
 * - supabase/functions/generate-lesson/index.ts      (buildTruthGuardrails)
 * - supabase/functions/generate-devotional/index.ts  (buildSystemPrompt)
 * - supabase/functions/generate-parable/index.ts     (STANDALONE_DIRECTIVE + TEACHING_DIRECTIVE)
 * - src/constants/lessonShapeProfiles.ts             (RESHAPE_UNIVERSAL_GUARDRAIL -> assembleReshapePrompt)
 *
 * Auto-synced to supabase/functions/_shared/scriptureIntegrityGuardrail.ts
 * via scripts/sync-constants.cjs (FILES_TO_SYNC). Never hand-edit the _shared copy.
 */

export const SCRIPTURE_INTEGRITY_GUARDRAIL = `RULE 5: DISTINGUISH SCRIPTURE FROM INFERENCE AND TRADITION
When referencing Jesus, the apostles, or any biblical figure, you must distinguish clearly between what Scripture states explicitly and what is inference, tradition, or scholarly interpretation. Never present inference or tradition as direct biblical statement. If a claim is inferred rather than explicitly stated in Scripture, flag it with language such as 'Scripture suggests,' 'tradition holds,' or 'it is reasonably inferred.' This standard applies to all cross-references, biographical details, and contextual background statements.`;
