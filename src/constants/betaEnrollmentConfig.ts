// ============================================================================
// SSOT: Beta Enrollment Configuration
// BibleLessonSpark - Master Definition
// Controls Public Beta enrollment flow UI and behavior
// Mirror: supabase/functions/_shared/betaEnrollmentConfig.ts
// DO NOT EDIT MIRROR DIRECTLY - Run: npm run sync-constants
// ============================================================================

// ----------------------------------------------------------------------------
// ENROLLMENT CONFIGURATION
// ----------------------------------------------------------------------------

export const BETA_ENROLLMENT_CONFIG = {
  // -------------------------------------------------------------------------
  // FEATURE TOGGLES
  // -------------------------------------------------------------------------
  features: {
    showLandingPageCTA: true,       // Show "Join Beta" on landing page
    showDashboardPrompt: true,      // Show prompt for users without an org
    collectChurchName: true,        // Ask for church name
    collectReferralSource: true,    // Ask how they heard about us
    requireEmailVerification: true, // Require email verification before access
  },

  // -------------------------------------------------------------------------
  // FORM FIELD OPTIONS
  // -------------------------------------------------------------------------
  referralSources: [
    { value: 'pastor', label: 'My pastor recommended it' },
    { value: 'colleague', label: 'Fellow Sunday School teacher' },
    { value: 'denomination', label: 'Baptist association or convention' },
    { value: 'social', label: 'Social media' },
    { value: 'search', label: 'Google search' },
    { value: 'friend', label: 'Friend or family member' },
    { value: 'other', label: 'Other' },
  ],

  // -------------------------------------------------------------------------
  // LANDING PAGE UI
  // -------------------------------------------------------------------------
  landingPage: {
    // CTA Section
    ctaTitle: 'Join the Free Public Beta',
    ctaSubtitle: 'Create engaging Bible study lessons for your Sunday School class in minutes.',
    ctaButton: 'Get Started Free',
    
    // Features to highlight
    features: [
      'Personalized lesson generation',
      'Theologically sound Baptist content',
      'Age-appropriate for any class',
      'Ready in under 2 minutes',
    ],
    
    // Trust indicators
    trustText: 'Join hundreds of Baptist teachers already using BibleLessonSpark',
  },

  // -------------------------------------------------------------------------
  // ENROLLMENT FORM UI
  // -------------------------------------------------------------------------
  form: {
    title: 'Join the BibleLessonSpark Beta',
    subtitle: 'Start creating Bible study lessons in minutes.',
    
    // Field labels and placeholders
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    fullNameRequired: true,
    
    emailLabel: 'Email Address',
    emailPlaceholder: 'you@church.org',
    emailRequired: true,
    
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create a secure password',
    passwordRequired: true,
    passwordMinLength: 8,
    
    churchNameLabel: 'Church Name (optional)',
    churchNamePlaceholder: 'First Baptist Church',
    churchNameRequired: false,
    
    referralSourceLabel: 'How did you hear about us? (optional)',
    referralSourcePlaceholder: 'Select an option',
    referralSourceRequired: false,
    
    // Buttons
    submitButton: 'Create My Free Account',
    submittingButton: 'Creating Account...',
    
    // Links
    alreadyHaveAccount: 'Already have an account?',
    signInLink: 'Sign in',
    
    // Terms
    termsText: 'By creating an account, you agree to our',
    termsLink: 'Terms of Service',
    privacyLink: 'Privacy Policy',
  },

  // -------------------------------------------------------------------------
  // DASHBOARD PROMPT UI (for orphan users)
  // -------------------------------------------------------------------------
  dashboardPrompt: {
    title: 'Join the Public Beta Program',
    description: 'Get access to all features by joining our public beta program.',
    button: 'Join Now',
    dismissible: true,
    dismissButton: 'Maybe Later',
  },

  // -------------------------------------------------------------------------
  // SUCCESS / ERROR MESSAGES
  // -------------------------------------------------------------------------
  messages: {
    enrollmentSuccess: {
      title: 'Welcome to BibleLessonSpark!',
      description: 'Your account has been created. Check your email to verify your account.',
    },
    enrollmentError: {
      title: 'Enrollment Failed',
      description: 'Something went wrong. Please try again or contact support.',
    },
    alreadyEnrolled: {
      title: 'Already Enrolled',
      description: 'You are already part of the beta program.',
    },
    verificationSent: {
      title: 'Verification Email Sent',
      description: 'Please check your inbox and click the verification link.',
    },
  },

  // -------------------------------------------------------------------------
  // VALIDATION MESSAGES
  // -------------------------------------------------------------------------
  validation: {
    fullNameRequired: 'Please enter your full name',
    fullNameMinLength: 'Name must be at least 2 characters',
    emailRequired: 'Please enter your email address',
    emailInvalid: 'Please enter a valid email address',
    passwordRequired: 'Please create a password',
    passwordMinLength: 'Password must be at least 8 characters',
  },
} as const;

// ----------------------------------------------------------------------------
// TYPE EXPORTS
// ----------------------------------------------------------------------------

export type ReferralSource = typeof BETA_ENROLLMENT_CONFIG.referralSources[number]['value'];

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Check if public beta enrollment should be shown based on platform mode
 */
export const shouldShowPublicBetaEnrollment = (platformMode: string): boolean => {
  return platformMode === 'public_beta';
};

/**
 * Check if user needs to be prompted to join an org
 */
export const shouldPromptOrgEnrollment = (
  platformMode: string,
  userOrgId: string | null
): boolean => {
  if (platformMode !== 'public_beta') return false;
  if (!BETA_ENROLLMENT_CONFIG.features.showDashboardPrompt) return false;
  return !userOrgId;
};

