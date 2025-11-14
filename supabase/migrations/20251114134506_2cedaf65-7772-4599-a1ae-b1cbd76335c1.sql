-- Trigger types regeneration
-- This migration ensures the TypeScript types are regenerated from the current database schema

-- Verify all tables exist and are accessible
DO $$
BEGIN
  -- This is a no-op migration that will trigger types regeneration
  -- without modifying any data or structure
  RAISE NOTICE 'Types regeneration triggered';
END $$;