-- Migration: add_org_deletion_request_columns
-- Adds deletion request tracking columns to organizations table.
-- Part of the org deletion approval workflow (SSOT: organizationConfig.ts ORG_DELETION_REQUEST).

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;