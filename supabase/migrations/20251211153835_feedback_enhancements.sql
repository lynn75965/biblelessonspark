-- Migration: Enhance beta_feedback table for multi-submission and quick ratings
-- Date: 2025-12-11
-- Purpose: Support Option 1 (Submit Another) + Option 3 (Post-Export Quick Rating)
-- SSOT: Values mirror src/constants/feedbackConfig.ts

-- 1. Make feedback_text optional (for quick ratings without comments)
ALTER TABLE beta_feedback 
ALTER COLUMN feedback_text DROP NOT NULL;

-- 2. Add feedback_source to distinguish form vs post-export
-- Values from FEEDBACK_SOURCE in feedbackConfig.ts: 'form', 'post_export'
ALTER TABLE beta_feedback 
ADD COLUMN IF NOT EXISTS feedback_source TEXT DEFAULT 'form';

-- 3. Add constraint for feedback_source values (mirrors FEEDBACK_SOURCE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'beta_feedback_source_check'
  ) THEN
    ALTER TABLE beta_feedback 
    ADD CONSTRAINT beta_feedback_source_check 
    CHECK (feedback_source IN ('form', 'post_export'));
  END IF;
END
$$;

-- 4. Update category constraint to include 'lesson_rating' (mirrors FEEDBACK_CATEGORY)
ALTER TABLE beta_feedback 
DROP CONSTRAINT IF EXISTS beta_feedback_category_check;

ALTER TABLE beta_feedback 
ADD CONSTRAINT beta_feedback_category_check 
CHECK (category IN ('bug_report', 'feature_request', 'general_feedback', 'lesson_rating') OR category IS NULL);

-- 5. Index for analytics queries by source
CREATE INDEX IF NOT EXISTS idx_beta_feedback_source ON beta_feedback(feedback_source);

-- Documentation
COMMENT ON COLUMN beta_feedback.feedback_source IS 'SSOT: feedbackConfig.ts FEEDBACK_SOURCE - form or post_export';
COMMENT ON COLUMN beta_feedback.category IS 'SSOT: feedbackConfig.ts FEEDBACK_CATEGORY - bug_report, feature_request, general_feedback, lesson_rating';
