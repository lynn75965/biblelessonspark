-- Phase 10B: Shared Focus for Organizations
-- SSOT Source: src/constants/sharedFocusConfig.ts
-- Allows Org Leaders to set church-wide passage/theme for date ranges

CREATE TABLE IF NOT EXISTS org_shared_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  focus_type TEXT NOT NULL CHECK (focus_type IN ('passage', 'theme', 'both')),
  passage TEXT,
  theme TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT passage_or_theme_required CHECK (
    (focus_type = 'passage' AND passage IS NOT NULL) OR
    (focus_type = 'theme' AND theme IS NOT NULL) OR
    (focus_type = 'both' AND passage IS NOT NULL AND theme IS NOT NULL)
  ),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT passage_max_length CHECK (char_length(passage) <= 200),
  CONSTRAINT theme_max_length CHECK (char_length(theme) <= 200),
  CONSTRAINT notes_max_length CHECK (char_length(notes) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_org_shared_focus_org_dates 
ON org_shared_focus(organization_id, start_date, end_date);

ALTER TABLE org_shared_focus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view shared focus"
ON org_shared_focus FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Org leaders can insert shared focus"
ON org_shared_focus FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (p.organization_role = 'leader' OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Org leaders can update shared focus"
ON org_shared_focus FOR UPDATE
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (p.organization_role = 'leader' OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Org leaders can delete shared focus"
ON org_shared_focus FOR DELETE
USING (
  organization_id IN (
    SELECT p.organization_id 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (p.organization_role = 'leader' OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Admins can manage all shared focus"
ON org_shared_focus FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_org_shared_focus_updated_at
  BEFORE UPDATE ON org_shared_focus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE org_shared_focus IS 'Stores church-wide passage/theme assignments for organizations. SSOT: src/constants/sharedFocusConfig.ts';
