CREATE TABLE devotional_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pin_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE devotional_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devotional series"
  ON devotional_series
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_devotional_series_user_id ON devotional_series(user_id);
CREATE INDEX idx_devotional_series_pin_order ON devotional_series(user_id, pin_order);
