-- Add Anthropic prompt-cache token columns to generation_metrics
-- Populated by generate-lesson after each Anthropic API call.
-- cache_creation_input_tokens: tokens written to the cache this call (charged 1.25x).
-- cache_read_input_tokens: tokens served from cache instead of re-processed (charged 0.1x).
-- Both are null for calls made before this migration, and for any call where the
-- Anthropic response omits these fields (e.g. cache miss = 0 read tokens, not null).

ALTER TABLE generation_metrics
  ADD COLUMN IF NOT EXISTS cache_creation_input_tokens integer,
  ADD COLUMN IF NOT EXISTS cache_read_input_tokens integer;
