-- Transfer Request System
-- SSOT: src/constants/transferRequestConfig.ts
-- Workflow: Org Manager confirms teacher agreement → Submits to Admin → Admin grants/denies

CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User being transferred
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Organizations involved
  from_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  to_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Transfer type: 'to_another_org' or 'leave_org'
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('to_another_org', 'leave_org')),
  
  -- Status: 'pending_admin', 'approved', 'denied', 'cancelled'
  status TEXT NOT NULL DEFAULT 'pending_admin' CHECK (status IN ('pending_admin', 'approved', 'denied', 'cancelled')),
  
  -- Reason for transfer
  reason TEXT NOT NULL CHECK (char_length(reason) >= 10 AND char_length(reason) <= 500),
  
  -- Teacher agreement (confirmed by Org Manager before submitting)
  teacher_agreement_confirmed BOOLEAN NOT NULL DEFAULT false,
  teacher_agreement_date TIMESTAMPTZ,
  
  -- Admin response
  admin_notes TEXT CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 500),
  
  -- Tracking
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  
  -- Ensure teacher agreement is confirmed before submission
  CONSTRAINT teacher_must_agree CHECK (teacher_agreement_confirmed = true),
  
  -- Ensure to_organization_id is set when transfer_type is 'to_another_org'
  CONSTRAINT destination_required_for_transfer CHECK (
    transfer_type = 'leave_org' OR to_organization_id IS NOT NULL
  )
);

-- Indexes for efficient lookups
CREATE INDEX idx_transfer_requests_user ON transfer_requests(user_id);
CREATE INDEX idx_transfer_requests_from_org ON transfer_requests(from_organization_id);
CREATE INDEX idx_transfer_requests_to_org ON transfer_requests(to_organization_id);
CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX idx_transfer_requests_pending ON transfer_requests(status) WHERE status = 'pending_admin';

-- RLS Policies
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own transfer requests
CREATE POLICY "Users can view own transfer requests"
ON transfer_requests FOR SELECT
USING (user_id = auth.uid());

-- Org Leaders can view and create requests for their organization members
CREATE POLICY "Org leaders can view org transfer requests"
ON transfer_requests FOR SELECT
USING (
  from_organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND organization_role IN ('leader', 'co-leader')
  )
);

CREATE POLICY "Org leaders can create transfer requests"
ON transfer_requests FOR INSERT
WITH CHECK (
  from_organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND organization_role IN ('leader', 'co-leader')
  )
  AND requested_by = auth.uid()
  AND teacher_agreement_confirmed = true
);

-- Org Leaders can cancel their own pending requests
CREATE POLICY "Org leaders can cancel pending requests"
ON transfer_requests FOR UPDATE
USING (
  requested_by = auth.uid()
  AND status = 'pending_admin'
)
WITH CHECK (
  status = 'cancelled'
);

-- Platform admins can view and manage all
CREATE POLICY "Admins can view all transfer requests"
ON transfer_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transfer requests"
ON transfer_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Comment for documentation
COMMENT ON TABLE transfer_requests IS 'Transfer requests for moving users between organizations. SSOT: src/constants/transferRequestConfig.ts';
