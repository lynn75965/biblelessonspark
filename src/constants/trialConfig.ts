// ============================================================================
// SSOT: Trial Feature Configuration
// LessonSparkUSA - Master Definition
// Database columns store data; THIS FILE defines logic and rules
// Mirror: supabase/functions/_shared/trialConfig.ts
// DO NOT EDIT MIRROR DIRECTLY - Run: npm run sync-constants
// ============================================================================

// ----------------------------------------------------------------------------
// TRIAL CONFIGURATION
// ----------------------------------------------------------------------------

export const TRIAL_CONFIG = {
  // Feature toggle
  enabled: true,

  // What the trial provides
  sectionsGranted: 8,           // Full tier (all 8 sections)

  // Reset rules
  resetPeriod: 'monthly' as const,  // Trial resets each calendar month

  // Who qualifies (in Production mode)
  appliesTo: ['free'] as const,     // Only Free tier users
  excludeBetaGraduates: false,      // Beta users also get trial when they become Free

  // -------------------------------------------------------------------------
  // ADMIN GRANT SETTINGS (controls Admin Panel UI)
  // -------------------------------------------------------------------------
  adminGrant: {
    enabled: true,                  // Show grant button in User Management
    defaultDays: 30,                // Pre-selected value in dropdown

    // Dropdown options for admin (value in days)
    dayOptions: [
      { value: 7, label: '7 days' },
      { value: 14, label: '14 days' },
      { value: 30, label: '30 days', isDefault: true },
      { value: 60, label: '60 days' },
      { value: 90, label: '90 days' },
    ],

    // UI Text (easily customizable)
    ui: {
      buttonTitle: 'Grant Trial',
      buttonTitleExtend: 'Extend Trial',
      dialogTitle: 'Grant Trial Access',
      dialogDescription: 'Grant temporary access to full lessons (all 8 sections).',
      activeTrialWarning: 'This user already has an active trial. Granting a new trial will replace the existing one.',
      expirationLabel: 'Trial will expire on:',
      daysLabel: 'Number of Days',
      cancelButton: 'Cancel',
      confirmButton: 'Grant Trial',
      confirmingButton: 'Granting...',
      successTitle: 'Trial Granted',
      successDescription: (userName: string, days: number, expireDate: string) =>
        `${userName} has been granted ${days} days of full lessons until ${expireDate}.`,
      errorTitle: 'Error',
      errorDescription: 'Failed to grant trial access.',
    },

    // Badge shown in user list for active trials
    badge: {
      show: true,
      prefix: 'Trial until',
    },
  },

  // -------------------------------------------------------------------------
  // ADMIN REVOKE SETTINGS (controls Admin Panel UI)
  // -------------------------------------------------------------------------
  adminRevoke: {
    enabled: true,                  // Show revoke button for users with active trials

    // UI Text (easily customizable)
    ui: {
      buttonTitle: 'Revoke Trial',
      dialogTitle: 'Revoke Trial Access',
      dialogDescription: 'Are you sure you want to revoke trial access? This user will immediately lose access to full lessons.',
      cancelButton: 'Keep Trial',
      confirmButton: 'Revoke Trial',
      revokingButton: 'Revoking...',
      successTitle: 'Trial Revoked',
      successDescription: (userName: string) =>
        `Trial access has been revoked for ${userName}.`,
      errorTitle: 'Error',
      errorDescription: 'Failed to revoke trial access.',
    },
  },

  // -------------------------------------------------------------------------
  // BULK TRIAL MANAGEMENT (Admin Panel - System Settings)
  // -------------------------------------------------------------------------
  bulkManagement: {
    enabled: true,                  // Show bulk management card in System Settings

    // Preset date options for quick selection
    presetDates: [
      { value: 7, label: '1 week from today' },
      { value: 14, label: '2 weeks from today' },
      { value: 30, label: '1 month from today' },
      { value: 60, label: '2 months from today' },
      { value: 90, label: '3 months from today' },
    ],

    // Default preset (index in presetDates array)
    defaultPresetIndex: 2, // 1 month

    // UI Text (SSOT for white-label customization)
    ui: {
      cardTitle: 'Beta Trial Management',
      cardDescription: 'Manage trial access for all beta testers. Extend or set a new expiration date for all users with active trials.',
      
      // Stats display
      statsTitle: 'Current Trial Status',
      activeTrialsLabel: 'Active Trials',
      expiringTrialsLabel: 'Expiring in 7 days',
      noTrialLabel: 'No Active Trial',
      
      // Extend action
      extendButtonText: 'Extend All Trials',
      extendDialogTitle: 'Extend All Beta Trials',
      extendDialogDescription: 'Set a new expiration date for all users who currently have an active trial.',
      newExpirationLabel: 'New Expiration Date',
      presetLabel: 'Quick Select',
      customDateLabel: 'Or choose a specific date',
      affectedUsersLabel: 'Users affected:',
      
      // Confirmation
      cancelButton: 'Cancel',
      confirmButton: 'Extend All Trials',
      confirmingButton: 'Extending...',
      
      // Success/Error
      successTitle: 'Trials Extended',
      successDescription: (count: number, date: string) =>
        `Successfully extended trials for ${count} user${count === 1 ? '' : 's'} until ${date}.`,
      errorTitle: 'Error',
      errorDescription: 'Failed to extend trials. Please try again.',
      
      // Revoke all action
      revokeAllButtonText: 'Revoke All Trials',
      revokeAllDialogTitle: 'Revoke All Trials',
      revokeAllDialogDescription: 'This will immediately remove trial access from all users. They will lose access to full lessons.',
      revokeAllConfirmButton: 'Revoke All',
      revokeAllSuccessTitle: 'Trials Revoked',
      revokeAllSuccessDescription: (count: number) =>
        `Successfully revoked trials for ${count} user${count === 1 ? '' : 's'}.`,
    },
  },

  // -------------------------------------------------------------------------
  // USER-FACING MESSAGES
  // -------------------------------------------------------------------------
  messages: {
    available: {
      title: "Your First Lesson This Month is FREE at Full Quality!",
      description: "Experience all 8 sections of a complete Bible study lesson.",
      cta: "Generate My Free Full Lesson",
    },
    used: {
      title: "You've Used Your Free Full Lesson This Month",
      description: "Your remaining lessons will include 3 core sections.",
      upsell: "Upgrade to Personal ($9/mo) for all 8 sections, every time.",
      cta: "Upgrade Now",
    },
    adminGranted: {
      title: "You've Been Granted a Free Full-Tier Lesson!",
      description: "Enjoy all 8 sections on your next lesson.",
    },
    nextReset: "Your free full lesson resets on the 1st of each month.",
  },
} as const;

// Type exports for TypeScript support
export type TrialDayOption = typeof TRIAL_CONFIG.adminGrant.dayOptions[number];
export type BulkPresetDate = typeof TRIAL_CONFIG.bulkManagement.presetDates[number];

// ----------------------------------------------------------------------------
// HELPER: Get default days value
// ----------------------------------------------------------------------------
export const getDefaultGrantDays = (): number => {
  const defaultOption = TRIAL_CONFIG.adminGrant.dayOptions.find(opt => opt.isDefault);
  return defaultOption?.value || TRIAL_CONFIG.adminGrant.defaultDays;
};

// ----------------------------------------------------------------------------
// HELPER: Get default bulk preset
// ----------------------------------------------------------------------------
export const getDefaultBulkPreset = (): BulkPresetDate => {
  return TRIAL_CONFIG.bulkManagement.presetDates[TRIAL_CONFIG.bulkManagement.defaultPresetIndex];
};

// ----------------------------------------------------------------------------
// TRIAL AVAILABILITY LOGIC
// ----------------------------------------------------------------------------

/**
 * Determines if a user's monthly trial is available
 * @param lastUsed - When user last consumed their trial (null if never)
 * @param grantedUntil - Admin override date (null if no override)
 * @returns boolean - true if trial is available
 */
export const isTrialAvailable = (
  lastUsed: Date | string | null,
  grantedUntil: Date | string | null
): boolean => {
  const now = new Date();

  // Admin override takes precedence
  if (grantedUntil) {
    const grantDate = typeof grantedUntil === 'string' ? new Date(grantedUntil) : grantedUntil;
    if (grantDate > now) {
      return true;
    }
  }

  // Never used = available
  if (!lastUsed) {
    return true;
  }

  // Monthly reset logic
  const lastUsedDate = typeof lastUsed === 'string' ? new Date(lastUsed) : lastUsed;
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Available if last used before this month started
  return lastUsedDate < currentMonthStart;
};

/**
 * Determines if trial applies to this user in current platform mode
 * @param platformMode - Current platform mode
 * @param userTier - User's subscription tier
 * @returns boolean - true if trial feature applies
 */
export const doesTrialApply = (
  platformMode: string,
  userTier: string
): boolean => {
  // Trial only applies in Production mode
  if (platformMode !== 'production') {
    return false;
  }

  // Trial only applies to configured tiers (default: free only)
  return (TRIAL_CONFIG.appliesTo as readonly string[]).includes(userTier);
};

/**
 * Calculate when user's trial resets
 * @returns Date - First day of next month
 */
export const getNextTrialReset = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

/**
 * Format the next reset date for display
 * @returns string - Formatted date string
 */
export const getNextTrialResetFormatted = (): string => {
  const resetDate = getNextTrialReset();
  return resetDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Check if a trial is active (not expired)
 * @param grantedUntil - Trial expiration date
 * @returns boolean - true if trial is active
 */
export const hasActiveTrial = (grantedUntil: string | Date | null | undefined): boolean => {
  if (!grantedUntil) return false;
  const expirationDate = typeof grantedUntil === 'string' ? new Date(grantedUntil) : grantedUntil;
  return expirationDate > new Date();
};

/**
 * Check if a trial is expiring within N days
 * @param grantedUntil - Trial expiration date
 * @param withinDays - Number of days to check
 * @returns boolean - true if expiring within specified days
 */
export const isTrialExpiringSoon = (
  grantedUntil: string | Date | null | undefined,
  withinDays: number = 7
): boolean => {
  if (!grantedUntil) return false;
  const expirationDate = typeof grantedUntil === 'string' ? new Date(grantedUntil) : grantedUntil;
  const now = new Date();
  const threshold = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return expirationDate > now && expirationDate <= threshold;
};
