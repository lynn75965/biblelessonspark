-- Phase E Option B: Store teacher font and color scheme with share tokens
-- When a teacher enables sharing, their current font/color selection is saved
-- Both full and handout links use the same stored style for that content item

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS share_font_id TEXT DEFAULT NULL;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS share_color_scheme_id TEXT DEFAULT NULL;
ALTER TABLE devotionals ADD COLUMN IF NOT EXISTS share_font_id TEXT DEFAULT NULL;
ALTER TABLE devotionals ADD COLUMN IF NOT EXISTS share_color_scheme_id TEXT DEFAULT NULL;
ALTER TABLE lesson_series ADD COLUMN IF NOT EXISTS share_font_id TEXT DEFAULT NULL;
ALTER TABLE lesson_series ADD COLUMN IF NOT EXISTS share_color_scheme_id TEXT DEFAULT NULL;
