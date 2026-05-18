-- ============================================================
-- Migration: add reshape_of and lesson_type to lessons
-- Generated: 2026-05-18
--
-- Adds two columns to the lessons table:
--
--   1. reshape_of (uuid, nullable, FK to lessons.id)
--      Back-link from a reshape lesson to its parent. NULL means an
--      original generated lesson. ON DELETE SET NULL preserves the
--      reshape if the parent is removed.
--
--   2. lesson_type (text, NOT NULL, default 'full', CHECK constraint)
--      Persists whether a lesson is full (8 sections) or short (3 sections,
--      sections 1, 5, 8). Set at generation time by generate-lesson.
--      Required by RESHAPE_RULE -- only full lessons can be reshaped.
--      All existing rows backfill to 'full' (paid users only ever
--      generated full lessons; trial short-lesson rows are rare enough
--      that the conservative default is preferred).
-- ============================================================

ALTER TABLE lessons
ADD COLUMN reshape_of uuid REFERENCES lessons(id) ON DELETE SET NULL;

COMMENT ON COLUMN lessons.reshape_of IS
'If set, this lesson is a reshape of the lesson with this id. NULL means an original generated lesson.';

ALTER TABLE lessons
ADD COLUMN lesson_type text NOT NULL DEFAULT 'full'
CHECK (lesson_type IN ('full', 'short'));

COMMENT ON COLUMN lessons.lesson_type IS
'full = 8-section lesson. short = 3-section trial lesson (sections 1, 5, 8). Set at generation time. Reshape requires full.';
