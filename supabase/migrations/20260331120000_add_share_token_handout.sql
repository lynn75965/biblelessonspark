-- Phase E Option A: Add handout-only share token columns
-- share_token = full lesson (all sections) -- already exists
-- share_token_handout = Group Handout only (Section 8) -- new

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS share_token_handout UUID UNIQUE DEFAULT NULL;
ALTER TABLE lesson_series ADD COLUMN IF NOT EXISTS share_token_handout UUID UNIQUE DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS lessons_share_token_handout_idx ON lessons(share_token_handout) WHERE share_token_handout IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lesson_series_share_token_handout_idx ON lesson_series(share_token_handout) WHERE share_token_handout IS NOT NULL;
