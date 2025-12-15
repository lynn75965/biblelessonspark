-- Add default_bible_version column to organizations table
-- SSOT: Frontend bibleVersions.ts defines valid values

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS default_bible_version TEXT DEFAULT 'kjv';

-- Add comment for SSOT reference
COMMENT ON COLUMN organizations.default_bible_version IS 'SSOT: src/constants/bibleVersions.ts - Default Bible version for org members';
