ALTER TABLE devotionals
  ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES devotional_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_devotional_number INTEGER;

CREATE INDEX idx_devotionals_series_id ON devotionals(series_id);
