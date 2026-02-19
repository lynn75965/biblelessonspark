/**
 * Transfer Request Configuration - SSOT
 * 
 * MUTUAL INITIATION WORKFLOW:
 *   Scenario A (Org Manager initiates):
 *     1. Org Manager creates request (status: pending_teacher)
 *     2. Teacher agrees (status: pending_admin) or declines (status: declined_by_teacher)
 *     3. Admin approves or denies
 * 
 *   Scenario B (Teacher initiates):
 *     1. Teacher creates request (status: pending_org_manager)
 *     2. Org Manager agrees (status: pending_admin) or declines (status: declined_by_org_manager)
 *     3. Admin approves or denies
 * 
 * SSOT Source: This file defines all transfer request constants
 * Database table: transfer_requests
 */

// Who initiated the transfer request
export const INITIATED_BY = {
  TEACHER: "teacher",
  ORG_MANAGER: "org_manager",
} as const;

export type InitiatedByKey = keyof typeof INITIATED_BY;
export type InitiatedByValue = typeof INITIATED_BY[InitiatedByKey];

// Transfer request statuses - mutual initiation flow
export const TRANSFER_STATUS = {
  PENDING_TEACHER: "pending_teacher",           // Org Manager initiated, awaiting teacher
  PENDING_ORG_MANAGER: "pending_org_manager",   // Teacher initiated, awaiting org manager
  PENDING_ADMIN: "pending_admin",               // Both agreed, awaiting admin
  APPROVED: "approved",                         // Admin granted, transfer executed
  DENIED: "denied",                             // Admin denied the request
  DECLINED_BY_TEACHER: "declined_by_teacher",   // Teacher declined org manager's request
  DECLINED_BY_ORG_MANAGER: "declined_by_org_manager", // Org manager declined teacher's request
  CANCELLED: "cancelled",                       // Initiator cancelled before other party responded
} as const;

export type TransferStatusKey = keyof typeof TRANSFER_STATUS;
export type TransferStatusValue = typeof TRANSFER_STATUS[TransferStatusKey];

// Status display configuration
export const TRANSFER_STATUS_CONFIG = {
  [TRANSFER_STATUS.PENDING_TEACHER]: {
    label: "Awaiting Teacher",
    description: "Waiting for teacher to agree",
    color: "bg-yellow-100 text-yellow-800",
    icon: "Clock",
  },
  [TRANSFER_STATUS.PENDING_ORG_MANAGER]: {
    label: "Awaiting Org Manager",
    description: "Waiting for organization manager to agree",
    color: "bg-yellow-100 text-yellow-800",
    icon: "Clock",
  },
  [TRANSFER_STATUS.PENDING_ADMIN]: {
    label: "Awaiting Admin",
    description: "Both parties agreed, awaiting platform admin",
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
    label: "Denied by Admin",
    description: "Admin denied the transfer request",
    color: "bg-red-100 text-red-800",
    icon: "XCircle",
  },
  [TRANSFER_STATUS.DECLINED_BY_TEACHER]: {
    label: "Declined by Teacher",
    description: "Teacher declined the transfer request",
    color: "bg-gray-100 text-gray-800",
    icon: "XCircle",
  },
  [TRANSFER_STATUS.DECLINED_BY_ORG_MANAGER]: {
    label: "Declined by Org Manager",
    description: "Organization manager declined the transfer request",
    color: "bg-gray-100 text-gray-800",
    icon: "XCircle",
  },
  [TRANSFER_STATUS.CANCELLED]: {
    label: "Cancelled",
    description: "Request was cancelled by initiator",
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
  RESPONSE_NOTE_MAX_LENGTH: 500,
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
  initiated_by: InitiatedByValue;        // Who started the request
  reason: string;                        // Why transfer is needed
  response_note: string | null;          // Note from responding party (agree/decline)
  responded_at: string | null;           // When other party responded
  admin_notes: string | null;            // Admin response notes
  requested_by: string;                  // User who created the request
  requested_by_name?: string;
  created_at: string;
  processed_at: string | null;           // When admin acted
  processed_by: string | null;           // Admin who processed
}

// ============================================================
// Helper Functions
// ============================================================

export function getStatusConfig(status: TransferStatusValue) {
  return TRANSFER_STATUS_CONFIG[status] || TRANSFER_STATUS_CONFIG[TRANSFER_STATUS.PENDING_ADMIN];
}

// Can the teacher respond to this request?
export function canTeacherRespond(status: TransferStatusValue): boolean {
  return status === TRANSFER_STATUS.PENDING_TEACHER;
}

// Can the org manager respond to this request?
export function canOrgManagerRespond(status: TransferStatusValue): boolean {
  return status === TRANSFER_STATUS.PENDING_ORG_MANAGER;
}

// Can admin process this request?
export function canAdminProcess(status: TransferStatusValue): boolean {
  return status === TRANSFER_STATUS.PENDING_ADMIN;
}

// Can the initiator cancel this request?
export function canInitiatorCancel(status: TransferStatusValue): boolean {
  return [
    TRANSFER_STATUS.PENDING_TEACHER,
    TRANSFER_STATUS.PENDING_ORG_MANAGER,
  ].includes(status);
}

// Is this a terminal (final) status?
export function isTerminalStatus(status: TransferStatusValue): boolean {
  return [
    TRANSFER_STATUS.APPROVED,
    TRANSFER_STATUS.DENIED,
    TRANSFER_STATUS.DECLINED_BY_TEACHER,
    TRANSFER_STATUS.DECLINED_BY_ORG_MANAGER,
    TRANSFER_STATUS.CANCELLED,
  ].includes(status);
}

// Is this request waiting for mutual agreement?
export function isPendingMutualAgreement(status: TransferStatusValue): boolean {
  return [
    TRANSFER_STATUS.PENDING_TEACHER,
    TRANSFER_STATUS.PENDING_ORG_MANAGER,
  ].includes(status);
}

// Is this request ready for admin?
export function isPendingAdmin(status: TransferStatusValue): boolean {
  return status === TRANSFER_STATUS.PENDING_ADMIN;
}

// Get the declined status based on who is declining
export function getDeclinedStatus(declinedByRole: "teacher" | "org_manager"): TransferStatusValue {
  return declinedByRole === "teacher"
    ? TRANSFER_STATUS.DECLINED_BY_TEACHER
    : TRANSFER_STATUS.DECLINED_BY_ORG_MANAGER;
}

// Deprecated - kept for backward compatibility during migration
export function isPending(status: TransferStatusValue): boolean {
  return status === TRANSFER_STATUS.PENDING_ADMIN;
}

export function canOrgManagerCancel(status: TransferStatusValue): boolean {
  return canInitiatorCancel(status);
}
