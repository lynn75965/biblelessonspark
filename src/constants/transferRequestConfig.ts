/**
 * Transfer Request Configuration - SSOT
 * 
 * Workflow: 
 *   1. Org Manager and Teacher reach agreement (outside or inside system)
 *   2. Org Manager creates Transfer Request to Admin (confirms teacher agreement)
 *   3. Admin reviews, grants or denies
 *   4. If granted, transfer is executed
 * 
 * SSOT Source: This file defines all transfer request constants
 * Database table: transfer_requests
 */

// Transfer request statuses (simpler - agreement happens before request)
export const TRANSFER_STATUS = {
  PENDING_ADMIN: "pending_admin",        // Submitted by Org Manager, awaiting admin
  APPROVED: "approved",                  // Admin granted, transfer executed
  DENIED: "denied",                      // Admin denied the request
  CANCELLED: "cancelled",                // Org manager cancelled before admin decision
} as const;

export type TransferStatusKey = keyof typeof TRANSFER_STATUS;
export type TransferStatusValue = typeof TRANSFER_STATUS[TransferStatusKey];

// Status display configuration
export const TRANSFER_STATUS_CONFIG = {
  [TRANSFER_STATUS.PENDING_ADMIN]: {
    label: "Pending Approval",
    description: "Awaiting platform admin review",
    color: "bg-blue-100 text-blue-800",
    icon: "Clock",
  },
  [TRANSFER_STATUS.APPROVED]: {
    label: "Approved",
    description: "Transfer completed successfully",
    color: "bg-green-100 text-green-800",
    icon: "CheckCircle",
  },
  [TRANSFER_STATUS.DENIED]: {
    label: "Denied",
    description: "Admin denied the transfer request",
    color: "bg-red-100 text-red-800",
    icon: "XCircle",
  },
  [TRANSFER_STATUS.CANCELLED]: {
    label: "Cancelled",
    description: "Request was cancelled by Org Manager",
    color: "bg-gray-100 text-gray-800",
    icon: "Ban",
  },
} as const;

// Transfer types
export const TRANSFER_TYPE = {
  TO_ANOTHER_ORG: "to_another_org",      // Moving to a different organization
  LEAVE_ORG: "leave_org",                // Leaving org, becoming individual user
} as const;

export type TransferTypeKey = keyof typeof TRANSFER_TYPE;
export type TransferTypeValue = typeof TRANSFER_TYPE[TransferTypeKey];

// Validation rules
export const TRANSFER_VALIDATION = {
  REASON_MIN_LENGTH: 10,
  REASON_MAX_LENGTH: 500,
  ADMIN_NOTES_MAX_LENGTH: 500,
} as const;

// TypeScript interface for transfer request
export interface TransferRequest {
  id: string;
  user_id: string;                       // Teacher being transferred
  user_name?: string;
  user_email?: string;
  from_organization_id: string;          // Current org
  from_organization_name?: string;
  to_organization_id: string | null;     // Destination org (null = leave only)
  to_organization_name?: string;
  transfer_type: TransferTypeValue;
  status: TransferStatusValue;
  reason: string;                        // Why transfer is needed
  teacher_agreement_confirmed: boolean;  // Org Manager confirms teacher agreed
  teacher_agreement_date: string | null; // When teacher agreed
  admin_notes: string | null;            // Admin response notes
  requested_by: string;                  // Org Manager who submitted
  requested_by_name?: string;
  created_at: string;
  processed_at: string | null;           // When admin acted
  processed_by: string | null;           // Admin who processed
}

// Helper functions
export function getStatusConfig(status: TransferStatusValue) {
  return TRANSFER_STATUS_CONFIG[status] || TRANSFER_STATUS_CONFIG[TRANSFER_STATUS.PENDING_ADMIN];
}

export function canAdminProcess(status: TransferStatusValue): boolean {
  return status === TRANSFER_STATUS.PENDING_ADMIN;
}

export function canOrgManagerCancel(status: TransferStatusValue): boolean {
  return status === TRANSFER_STATUS.PENDING_ADMIN;
}

export function isTerminalStatus(status: TransferStatusValue): boolean {
  return [
    TRANSFER_STATUS.APPROVED,
    TRANSFER_STATUS.DENIED,
    TRANSFER_STATUS.CANCELLED,
  ].includes(status);
}

export function isPending(status: TransferStatusValue): boolean {
  return status === TRANSFER_STATUS.PENDING_ADMIN;
}
