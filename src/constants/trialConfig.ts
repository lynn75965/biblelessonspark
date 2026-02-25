// ============================================================================
// SSOT: Trial Feature Configuration
// BibleLessonSpark - Master Definition
// Database columns store data; THIS FILE defines logic and rules
// Mirror: supabase/functions/_shared/trialConfig.ts
// DO NOT EDIT MIRROR DIRECTLY - Run: npm run sync-constants
// Last Updated: 2026-02-21 - Rolling 30-day period, 3 full + 2 short lessons
// ============================================================================

export const TRIAL_CONFIG = {
  enabled: true,

  // Section counts
  sectionsGranted:      8,   // Full trial = all 8 sections
  shortSectionsGranted: 3,   // Short lesson = sections 1, 5, 8

  // Allowances per rolling 30-day period
  fullLessonsPerPeriod:  3,  // Full (8-section) lessons per period
  shortLessonsPerPeriod: 2,  // Short (3-section) lessons per period

  // Reset: rolling 30 days from the FIRST full lesson generated
  // Short lessons alone do NOT start the clock
  resetPeriod:          'rolling30' as const,
  resetIntervalDays:    30,
  periodStartTrigger:   'first_full_lesson' as const,

  // Who qualifies (Production mode only)
  appliesTo:            ['free'] as const,
  excludeBetaGraduates: false,

  // -------------------------------------------------------------------------
  // ADMIN GRANT SETTINGS
  // -------------------------------------------------------------------------
  adminGrant: {
    enabled:     true,
    defaultDays: 30,

    dayOptions: [
      { value: 7,  label: '7 days'  },
      { value: 14, label: '14 days' },
      { value: 30, label: '30 days', isDefault: true },
      { value: 60, label: '60 days' },
      { value: 90, label: '90 days' },
    ],

    presetDates: [
      { value: '2026-02-28', label: 'Feb 28, 2026 (Beta End)' },
      { value: '2026-03-31', label: 'Mar 31, 2026'            },
      { value: '2026-06-30', label: 'Jun 30, 2026'            },
    ],

    defaultMode: 'days' as const,

    ui: {
      buttonTitle:       'Grant Trial',
      buttonTitleExtend: 'Extend Trial',
      dialogTitle:       'Grant Trial Access',
      dialogDescription: 'Grant temporary access to full lessons (all 8 sections).',
      activeTrialWarning:'This user already has an active trial. Granting a new trial will replace the existing one.',
      expirationLabel:   'Trial will expire on:',
      daysLabel:         'Number of Days',
      cancelButton:      'Cancel',
      confirmButton:     'Grant Trial',
      confirmingButton:  'Granting...',
      successTitle:      'Trial Granted',
      successDescription: (userName: string, days: number, expireDate: string) =>
        `${userName} has been granted ${days} days of full lessons until ${expireDate}.`,
      errorTitle:        'Error',
      errorDescription:  'Failed to grant trial access.',
    },

    badge: {
      show:   true,
      prefix: 'Trial until',
    },
  },

  // -------------------------------------------------------------------------
  // ADMIN REVOKE SETTINGS
  // -------------------------------------------------------------------------
  adminRevoke: {
    enabled: true,

    ui: {
      buttonTitle:      'Revoke Trial',
      dialogTitle:      'Revoke Trial Access',
      dialogDescription:'Are you sure you want to revoke trial access? This user will immediately lose access to full lessons.',
      cancelButton:     'Keep Trial',
      confirmButton:    'Revoke Trial',
      revokingButton:   'Revoking...',
      successTitle:     'Trial Revoked',
      successDescription: (userName: string) =>
        `Trial access has been revoked for ${userName}.`,
      errorTitle:       'Error',
      errorDescription: 'Failed to revoke trial access.',
    },
  },

  // -------------------------------------------------------------------------
  // BULK MANAGEMENT SETTINGS
  // -------------------------------------------------------------------------
  bulkManagement: {
    enabled:             true,
    defaultPresetIndex:  0,

    presetDates: [
      { value: '2026-02-28', label: 'Feb 28, 2026 (Beta End)' },
      { value: '2026-03-31', label: 'Mar 31, 2026'            },
      { value: '2026-06-30', label: 'Jun 30, 2026'            },
    ],

    ui: {
      buttonTitle:        'Grant Trials to All Free Users',
      dialogTitle:        'Bulk Trial Grant',
      dialogDescription:  'Grant trial access to all free-tier users at once.',
      cancelButton:       'Cancel',
      confirmButton:      'Grant to All',
      confirmingButton:   'Granting...',
      successTitle:       'Trials Granted',
      successDescription: (count: number, date: string) =>
        `Successfully granted trials to ${count} user${count === 1 ? '' : 's'} until ${date}.`,
      errorTitle:         'Error',
      errorDescription:   'Failed to grant trials. Please try again.',
      revokeAllButtonText:     'Revoke All Trials',
      revokeAllDialogTitle:    'Revoke All Trials',
      revokeAllDialogDescription: 'This will immediately remove trial access from all users.',
      revokeAllConfirmButton:  'Revoke All',
      revokeAllSuccessTitle:   'Trials Revoked',
      revokeAllSuccessDescription: (count: number) =>
        `Successfully revoked trials for ${count} user${count === 1 ? '' : 's'}.`,
    },
  },

  // -------------------------------------------------------------------------
  // USER-FACING MESSAGES
  // -------------------------------------------------------------------------
  messages: {
    available: {
      title:       "Your First 3 Full Lessons Each Period are FREE!",
      description: "Experience all 8 sections of a complete Bible study lesson.",
      cta:         "Generate My Free Full Lesson",
    },
    fullExhausted: {
      title:       "Full Lessons Used for This Period",
      description: "You have 2 short lessons (3 core sections) remaining this period.",
      upsell:      "Upgrade to Personal Plan for all 8 sections, every lesson.",
      cta:         "Upgrade Now",
    },
    used: {
      title:       "You've Used All Your Free Lessons This Period",
      description: "Your lesson allowance resets 30 days after your first lesson this period.",
      upsell:      "Upgrade to Personal Plan for unlimited access to all 8 sections.",
      cta:         "Upgrade Now",
    },
    adminGranted: {
      title:       "You've Been Granted a Free Full-Tier Lesson!",
      description: "Enjoy all 8 sections on your next lesson.",
    },
    nextReset:          "Your lessons reset 30 days after your first lesson this period.",
    nextResetWithDate:  (resetDate: string) => `Your lessons reset on ${resetDate}.`,
  },
} as const;

// ----------------------------------------------------------------------------
// TYPE EXPORTS
// ----------------------------------------------------------------------------
export type TrialDayOption  = typeof TRIAL_CONFIG.adminGrant.dayOptions[number];
export type TrialPresetDate = typeof TRIAL_CONFIG.adminGrant.presetDates[number];
export type BulkPresetDate  = typeof TRIAL_CONFIG.bulkManagement.presetDates[number];
export type TrialGrantMode  = 'days' | 'date';

export interface TrialStatus {
  fullAvailable:         boolean;
  shortAvailable:        boolean;
  canGenerateAny:        boolean;
  isAdminGrant:          boolean;
  periodExpired:         boolean;
  fullLessonsUsed:       number;
  shortLessonsUsed:      number;
  fullLessonsRemaining:  number;
  shortLessonsRemaining: number;
  periodStart:           Date | null;
  periodEnd:             Date | null;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
export const getDefaultGrantDays = (): number => {
  const opt = TRIAL_CONFIG.adminGrant.dayOptions.find(o => o.isDefault);
  return opt?.value || TRIAL_CONFIG.adminGrant.defaultDays;
};

export const getDefaultBulkPreset = (): BulkPresetDate =>
  TRIAL_CONFIG.bulkManagement.presetDates[TRIAL_CONFIG.bulkManagement.defaultPresetIndex];

export const getDefaultGrantMode = (): TrialGrantMode =>
  TRIAL_CONFIG.adminGrant.defaultMode;

export const getDefaultPresetDate = (): string =>
  TRIAL_CONFIG.adminGrant.presetDates[0]?.value || '';

// ----------------------------------------------------------------------------
// CORE: getTrialStatus
// Single source of truth for trial availability logic.
// Called by: generate-lesson edge function, frontend hooks
// ----------------------------------------------------------------------------
export const getTrialStatus = (
  periodStart:        Date | string | null,
  fullLessonsUsed:    number,
  shortLessonsUsed:   number,
  grantedUntil:       Date | string | null
): TrialStatus => {
  const now = new Date();

  // Admin grant overrides everything
  if (grantedUntil) {
    const grantDate = typeof grantedUntil === 'string' ? new Date(grantedUntil) : grantedUntil;
    if (grantDate > now) {
      return {
        fullAvailable:         true,
        shortAvailable:        true,
        canGenerateAny:        true,
        isAdminGrant:          true,
        periodExpired:         false,
        fullLessonsUsed:       0,
        shortLessonsUsed:      0,
        fullLessonsRemaining:  TRIAL_CONFIG.fullLessonsPerPeriod,
        shortLessonsRemaining: TRIAL_CONFIG.shortLessonsPerPeriod,
        periodStart:           null,
        periodEnd:             grantDate,
      };
    }
  }

  // No period started (no full lesson ever generated this cycle)
  if (!periodStart) {
    const fullRem  = Math.max(0, TRIAL_CONFIG.fullLessonsPerPeriod  - fullLessonsUsed);
    const shortRem = Math.max(0, TRIAL_CONFIG.shortLessonsPerPeriod - shortLessonsUsed);
    return {
      fullAvailable:         fullRem > 0,
      shortAvailable:        shortRem > 0,
      canGenerateAny:        fullRem > 0 || shortRem > 0,
      isAdminGrant:          false,
      periodExpired:         false,
      fullLessonsUsed,
      shortLessonsUsed,
      fullLessonsRemaining:  fullRem,
      shortLessonsRemaining: shortRem,
      periodStart:           null,
      periodEnd:             null,
    };
  }

  const start     = typeof periodStart === 'string' ? new Date(periodStart) : periodStart;
  const periodEnd = new Date(start.getTime() + TRIAL_CONFIG.resetIntervalDays * 24 * 60 * 60 * 1000);
  const expired   = now >= periodEnd;

  // Period expired: signal reset, counts treated as zero
  if (expired) {
    return {
      fullAvailable:         true,
      shortAvailable:        true,
      canGenerateAny:        true,
      isAdminGrant:          false,
      periodExpired:         true,
      fullLessonsUsed:       0,
      shortLessonsUsed:      0,
      fullLessonsRemaining:  TRIAL_CONFIG.fullLessonsPerPeriod,
      shortLessonsRemaining: TRIAL_CONFIG.shortLessonsPerPeriod,
      periodStart:           null,
      periodEnd:             null,
    };
  }

  // Active period
  const fullRem  = Math.max(0, TRIAL_CONFIG.fullLessonsPerPeriod  - fullLessonsUsed);
  const shortRem = Math.max(0, TRIAL_CONFIG.shortLessonsPerPeriod - shortLessonsUsed);

  return {
    fullAvailable:         fullRem > 0,
    shortAvailable:        shortRem > 0,
    canGenerateAny:        fullRem > 0 || shortRem > 0,
    isAdminGrant:          false,
    periodExpired:         false,
    fullLessonsUsed,
    shortLessonsUsed,
    fullLessonsRemaining:  fullRem,
    shortLessonsRemaining: shortRem,
    periodStart:           start,
    periodEnd,
  };
};

// ----------------------------------------------------------------------------
// COMPAT: isTrialAvailable -- legacy callers only
// ----------------------------------------------------------------------------
export const isTrialAvailable = (
  lastUsed:     Date | string | null,
  grantedUntil: Date | string | null
): boolean => getTrialStatus(lastUsed, 0, 0, grantedUntil).canGenerateAny;

// ----------------------------------------------------------------------------
// HELPER: doesTrialApply
// ----------------------------------------------------------------------------
export const doesTrialApply = (
  platformMode: string,
  userTier:     string
): boolean => {
  if (platformMode !== 'production') return false;
  return (TRIAL_CONFIG.appliesTo as readonly string[]).includes(userTier);
};

// ----------------------------------------------------------------------------
// HELPER: getPeriodEndDate
// ----------------------------------------------------------------------------
export const getPeriodEndDate = (periodStart: Date | string): Date => {
  const start = typeof periodStart === 'string' ? new Date(periodStart) : periodStart;
  return new Date(start.getTime() + TRIAL_CONFIG.resetIntervalDays * 24 * 60 * 60 * 1000);
};

export const getPeriodEndFormatted = (periodStart: Date | string): string =>
  getPeriodEndDate(periodStart).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
