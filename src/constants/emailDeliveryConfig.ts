/**
 * EMAIL DELIVERY CONFIG - Single Source of Truth
 * =====================================================
 * Location: src/constants/emailDeliveryConfig.ts (MASTER)
 * Mirror: supabase/functions/_shared/emailDeliveryConfig.ts
 * DO NOT EDIT MIRROR DIRECTLY - sync from frontend SSOT
 *
 * SSOT Compliance: Frontend drives backend
 * All email delivery constants defined here, imported everywhere
 *
 * Version: 1.0.0
 * Created: 2026-02-01
 */

export const EMAIL_DELIVERY_VERSION = '1.0.0';

/**
 * Email delivery feature configuration
 */
export const EMAIL_DELIVERY_CONFIG = {
  // Limits
  maxRecipients: 25,
  maxPersonalMessageLength: 500,

  // Tier gating — minimum subscription tier required
  minimumTier: 'personal' as const,

  // Email subject template (used by edge function)
  subjectTemplate: '{senderName} shared a Bible lesson: {lessonTitle}',

  // UI Labels (used by frontend components)
  labels: {
    buttonText: 'Email',
    buttonTooltip: 'Email this lesson to others',
    dialogTitle: 'Email This Lesson',
    dialogDescription: 'Send this lesson directly to your students, co-teachers, or pastor.',
    recipientsLabel: 'Email Recipients',
    recipientsPlaceholder: 'Enter email addresses, one per line or separated by commas',
    recipientsHelp: 'Up to 25 recipients. Each receives their own copy.',
    messageLabel: 'Personal Message (optional)',
    messagePlaceholder: 'Add a note to include with the lesson...',
    messageHelp: '{remaining} characters remaining',
    sendButton: 'Send Lesson',
    sendingButton: 'Sending...',
    cancelButton: 'Cancel',

    // Success/error toasts
    successTitle: 'Lesson Sent!',
    successMessage: 'Lesson emailed to {count} recipient(s).',
    successPartial: 'Sent to {success} of {total} recipients. {failed} failed.',
    errorTitle: 'Send Failed',
    errorMessage: 'Unable to send lesson. Please try again.',
    errorNoRecipients: 'Please enter at least one email address.',
    errorInvalidEmail: 'Please check email addresses for errors.',
    errorTooManyRecipients: 'Maximum {max} recipients allowed.',

    // Upgrade prompts (free users)
    upgradeTitle: 'Email Delivery — Premium Feature',
    upgradeMessage: 'Email delivery is available for paid subscribers. Upgrade to send lessons directly to your students and fellow teachers.',
  },
} as const;

// =====================================================
// HELPER FUNCTIONS (shared by frontend + backend)
// =====================================================

/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Parse a string of email addresses (comma, semicolon, or newline separated)
 * Returns array of trimmed, non-empty, unique addresses
 */
export function parseRecipients(input: string): string[] {
  const addresses = input
    .split(/[,;\n]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);
  return [...new Set(addresses)];
}

/**
 * Validate a list of recipients
 * Returns { valid: string[], invalid: string[] }
 */
export function validateRecipients(recipients: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const email of recipients) {
    if (isValidEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }
  return { valid, invalid };
}

/**
 * Build email subject from template
 */
export function buildEmailSubject(senderName: string, lessonTitle: string): string {
  return EMAIL_DELIVERY_CONFIG.subjectTemplate
    .replace('{senderName}', senderName)
    .replace('{lessonTitle}', lessonTitle);
}
