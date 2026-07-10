-- Add two-phase duration columns to generation_metrics
-- Phase 1 = S1-S5 (doctrinal core); Phase 2 = S6-S8+Teaser (derived supplements)
ALTER TABLE generation_metrics
  ADD COLUMN IF NOT EXISTS phase1_duration_ms integer,
  ADD COLUMN IF NOT EXISTS phase2_duration_ms integer;
