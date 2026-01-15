/**
 * BibleLessonSpark Branding Configuration
 * ========================================
 *
 * This file provides branding configuration for the application.
 * Colors and typography are imported from the SINGLE SOURCE OF TRUTH:
 *   src/config/brand-values.json
 *
 * For white-label deployments, modify brand-values.json to rebrand colors/fonts.
 * Other branding elements (text, emails, features) are configured here.
 *
 * Location: src/config/branding.ts
 *
 * ARCHITECTURE (SSOT):
 *   brand-values.json → branding.ts → BrandingProvider → CSS Variables → Tailwind
 *   brand-values.json → generate-css.cjs → index.css → Tailwind → Build
 *
 * USAGE:
 *   import { BRANDING } from '@/config/branding';
 *   <h1>{BRANDING.appName}</h1>
 *   <img src={BRANDING.logo.primary} alt={BRANDING.appName} />
 *
 * REBRAND: January 2026 - LessonSparkUSA → BibleLessonSpark
 * Color palette derived from logo: forest green book, golden flame, cream background
 */

// ============================================================================
// IMPORT SSOT VALUES FROM JSON
// ============================================================================

import brandValues from './brand-values.json';

// ============================================================================
// COLOR UTILITY FUNCTIONS (HEX to HSL conversion for Tailwind)
// ============================================================================

/**
 * Convert HEX color to HSL values
 * @param hex - Hex color string (e.g., "#3D5C3D" or "3D5C3D")
 * @returns HSL string in format "H S% L%" (e.g., "120 20% 30%")
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex to RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to degrees and percentages, round to reasonable precision
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Adjust lightness of an HSL color string
 * @param hsl - HSL string in format "H S% L%"
 * @param adjustment - Amount to adjust lightness (positive = lighter, negative = darker)
 * @returns Adjusted HSL string
 */
export function adjustLightness(hsl: string, adjustment: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return hsl;

  const h = parseInt(parts[1]);
  const s = parseInt(parts[2]);
  let l = parseInt(parts[3]) + adjustment;

  // Clamp lightness to valid range
  l = Math.max(0, Math.min(100, l));

  return `${h} ${s}% ${l}%`;
}

/**
 * Adjust saturation of an HSL color string
 * @param hsl - HSL string in format "H S% L%"
 * @param adjustment - Amount to adjust saturation
 * @returns Adjusted HSL string
 */
export function adjustSaturation(hsl: string, adjustment: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return hsl;

  const h = parseInt(parts[1]);
  let s = parseInt(parts[2]) + adjustment;
  const l = parseInt(parts[3]);

  // Clamp saturation to valid range
  s = Math.max(0, Math.min(100, s));

  return `${h} ${s}% ${l}%`;
}


// ============================================================================
// COLOR ADJUSTMENT CONSTANTS (SSOT)
// ============================================================================
// These values are used by generateTailwindCSSVariables() AND BrandingProvider
// for tenant overrides. Change here to affect both.
// ============================================================================

/**
 * Lightness adjustment values for generating color variants
 * Used by: generateTailwindCSSVariables(), BrandingProvider tenant overrides
 * SSOT: Change these values to adjust how light/dark variants are generated globally
 */
export const COLOR_ADJUSTMENTS = {
  /** Light mode variant adjustments */
  light: {
    /** --primary-light adjustment */
    primaryLight: 65,
    /** --secondary-light adjustment */
    secondaryLight: 39,
    /** --destructive-light adjustment */
    destructiveLight: 70,
  },
  /** Hover state adjustments */
  hover: {
    /** Primary hover - lighten */
    primaryHover: 10,
    /** Secondary hover - darken */
    secondaryHover: -6,
  },
  /** Gradient adjustments */
  gradient: {
    /** gradient-primary start (darker) */
    primaryStart: -2,
    /** gradient-primary end (lighter) */
    primaryEnd: 8,
    /** gradient-hero start */
    heroStart: -5,
    /** gradient-hero middle */
    heroMiddle: 5,
    /** gradient-secondary start/hero end */
    secondaryShift: -6,
    /** gradient-card start */
    cardStart: 2,
    /** gradient-card end */
    cardEnd: 4,
  },
  /** Dark mode adjustments */
  dark: {
    primaryShift: 10,
    primaryHoverShift: 15,
    secondaryShift: 4,
    secondaryHoverShift: -1,
    backgroundMuted: -12,
    cardShift: 2,
    borderShift: -8,
    burgundyShift: 10,
    burgundyHoverShift: 7,
    burgundyLightShift: 5,
    destructiveShift: 15,
    mutedForegroundShift: 9,
    accentShift: -6,
  },
  /** Layout tokens */
  layout: {
    /** Container max-width */
    containerMaxWidth: '1400px',
    /** Accent border width */
    accentBorderWidth: '3px',
    /** Standard border width */
    borderWidth: '2px',
  },
} as const;

// ============================================================================
// CORE IDENTITY
// ============================================================================

export const BRANDING = {
  /**
   * Application name - appears in headers, titles, emails, etc.
   */
  appName: "BibleLessonSpark",

  /**
   * Short name for compact displays (mobile nav, favicon title, etc.)
   */
  appNameShort: "BibleLessonSpark",

  /**
   * Primary tagline - used on landing page, meta descriptions
   */
  tagline: "Personalized Bible Study Lessons for Baptist Teachers",

  /**
   * Extended description for marketing/SEO
   */
  description: "Personalized Bible study lesson generator for Baptist Sunday School teachers. Create customized, theologically sound lessons in minutes.",

  /**
   * Keywords for SEO (array format for flexibility)
   */
  keywords: [
    "Baptist",
    "Bible study",
    "Sunday School",
    "lesson generator",
    "Southern Baptist",
    "church curriculum",
    "teacher resources",
    "Bible lesson"
  ],

  // ==========================================================================
  // DOMAIN & URLS
  // ==========================================================================

  urls: {
    domain: "biblelessonspark.com",
    baseUrl: "https://biblelessonspark.com",
    support: "https://biblelessonspark.com/support",
    termsOfService: "https://biblelessonspark.com/terms",
    privacyPolicy: "https://biblelessonspark.com/privacy",
    documentation: "https://biblelessonspark.com/help",
    unsubscribe: "https://biblelessonspark.com/unsubscribe?token={token}",
    emailPreferences: "https://biblelessonspark.com/settings/notifications",
  },

  // ==========================================================================
  // CONTACT INFORMATION
  // ==========================================================================

  contact: {
    supportEmail: "support@biblelessonspark.com",
    infoEmail: "info@biblelessonspark.com",
    noReplyEmail: "noreply@biblelessonspark.com",
    emailSenderName: "BibleLessonSpark",
    phone: null,
    address: {
      line1: "BibleLessonSpark",
      line2: null,
      city: "Nacogdoches",
      state: "TX",
      zip: "75965",
      country: "USA",
    },
    get formattedAddress() {
      const addr = this.address;
      const line2 = addr.line2 ? `, ${addr.line2}` : '';
      return `${addr.line1}${line2}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`;
    },
  },

  // ==========================================================================
  // VISUAL IDENTITY - LOGOS
  // ==========================================================================

  logo: {
    primary: "/assets/logo-primary.png",
    light: "/assets/logo-light.png",
    icon: "/assets/logo-icon.png",
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    ogImage: "/assets/og-image.png",
    altText: "BibleLessonSpark Logo - Golden flame rising from open Bible",
  },

  // ==========================================================================
  // VISUAL IDENTITY - COLORS (FROM SSOT: brand-values.json)
  // ==========================================================================
  // Colors are imported from brand-values.json for single source of truth.
  // To change colors, edit src/config/brand-values.json

  colors: {
    /**
     * Primary brand color - Forest Green (from Bible/book in logo)
     * Used for: buttons, links, primary actions, headers
     */
    primary: {
      DEFAULT: brandValues.colors.primary.DEFAULT,
      light: brandValues.colors.primary.light,
      dark: brandValues.colors.primary.dark,
      foreground: brandValues.colors.background.primary, // Cream text on primary
    },

    /**
     * Secondary brand color - Antique Gold (from flame in logo)
     * Used for: secondary buttons, accents, highlights
     */
    secondary: {
      DEFAULT: brandValues.colors.secondary.DEFAULT,
      light: brandValues.colors.secondary.light,
      dark: brandValues.colors.secondary.dark,
      foreground: brandValues.colors.text.primary, // Dark text on secondary
    },

    /**
     * Accent color - Deep Gold (from ring around logo)
     * Used for: highlights, notifications, badges, hover states
     */
    accent: {
      DEFAULT: brandValues.colors.accent.DEFAULT,
      light: "#DBBF6E",    // Light gold (derived)
      dark: "#A88B3D",     // Dark gold (derived)
      foreground: brandValues.colors.text.primary,
    },

    /**
     * Tertiary color - Burgundy (Baptist heritage, reverence, importance)
     * Used for: errors, warnings, important badges, heritage elements
     */
    burgundy: {
      DEFAULT: brandValues.colors.destructive.DEFAULT,
      light: brandValues.colors.destructive.light,
      dark: "#4D1426",     // Darker burgundy (derived)
      hover: "#8C3352",    // Wine - hover states (derived)
    },

    /**
     * Background colors - Warm Cream theme
     */
    background: {
      primary: brandValues.colors.background.primary,
      secondary: brandValues.colors.background.secondary,
      dark: brandValues.colors.background.dark,
    },

    /**
     * Text colors
     */
    text: {
      primary: brandValues.colors.text.primary,
      secondary: brandValues.colors.text.secondary,
      light: brandValues.colors.text.light,
      inverse: brandValues.colors.background.primary, // Cream for dark backgrounds
    },

    /**
     * UI Element colors (derived from above for semantic use)
     */
    card: {
      DEFAULT: "#FFFFFF",    // White cards
      foreground: brandValues.colors.text.primary,
    },

    muted: {
      DEFAULT: "#F5F3EE",    // Warm muted background
      foreground: brandValues.colors.text.secondary,
    },

    border: brandValues.colors.border.DEFAULT,
    input: brandValues.colors.border.DEFAULT,
    ring: brandValues.colors.primary.DEFAULT,
  },

  // ==========================================================================
  // TYPOGRAPHY (FROM SSOT: brand-values.json)
  // ==========================================================================

  typography: {
    fontFamily: {
      primary: brandValues.typography.fontFamily.primary,
      secondary: brandValues.typography.fontFamily.secondary,
    },
    googleFontsUrl: brandValues.typography.googleFontsUrl,
  },

  // ==========================================================================
  // LAYOUT & STRUCTURE
  // ==========================================================================

  layout: {
    pageWrapper: "min-h-screen bg-background flex flex-col",
    mainContent: "flex-1",
    containerPadding: "py-6 sm:py-8 px-4 sm:px-6",
    containerNarrow: "max-w-2xl mx-auto",
    containerWide: "max-w-6xl mx-auto",
    pageHeaderMargin: "mb-6 sm:mb-8",
    sectionSpacing: "mb-6 sm:mb-8",
    gridGap: "gap-4 sm:gap-6",
    statsGrid: "grid grid-cols-2 gap-3 sm:gap-4",
    cardPadding: "p-4 sm:p-6",
    authPageWrapper: "min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4",
    authFormContainer: "w-full max-w-md px-4 sm:px-0",
    legalPageWrapper: "min-h-screen bg-gradient-to-br from-green-50 to-amber-50 py-12 px-4",
    legalPageCard: "max-w-4xl mx-auto bg-card rounded-lg shadow-lg p-4 sm:p-6 lg:p-8",
  },

  // ==========================================================================
  // DESIGN TOKENS (non-color) - uses SSOT font sizes
  // ==========================================================================

  tokens: {
    radius: {
      sm: "0.5rem",
      DEFAULT: "0.75rem",
      lg: "1rem",
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
    },
    fontSize: {
      xs: brandValues.typography.fontSize.xs,
      sm: brandValues.typography.fontSize.sm,
      base: brandValues.typography.fontSize.base,
      lg: brandValues.typography.fontSize.lg,
      xl: brandValues.typography.fontSize.xl,
      "2xl": brandValues.typography.fontSize["2xl"],
      "3xl": brandValues.typography.fontSize["3xl"],
      "4xl": brandValues.typography.fontSize["4xl"],
    },
    transition: {
      fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
      normal: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
      slow: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
    },
    section: {
      y: "2.5rem",
      yLg: "3.5rem",
    },
  },

  // ==========================================================================
  // LEGAL & COPYRIGHT
  // ==========================================================================

  legal: {
    copyrightHolder: "BibleLessonSpark",
    copyrightYear: "2024",
    get copyrightNotice() {
      const currentYear = new Date().getFullYear();
      const yearRange = this.copyrightYear === String(currentYear)
        ? this.copyrightYear
        : `${this.copyrightYear}-${currentYear}`;
      return `© ${yearRange} ${this.copyrightHolder}. All rights reserved.`;
    },
    legalEntityName: "BibleLessonSpark",
    jurisdiction: "Texas, United States",
  },

  // ==========================================================================
  // SOCIAL MEDIA (optional)
  // ==========================================================================

  social: {
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    linkedin: null,
  },

  // ==========================================================================
  // FEATURE FLAGS
  // ==========================================================================

  features: {
    showPoweredBy: false,
    allowPublicSignup: true,
    multiLanguage: true,
    availableLanguages: [
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "es", name: "Español", flag: "🇲🇽" },
      { code: "fr", name: "Français", flag: "🇫🇷" },
    ],
    defaultLanguage: "en",
    organizationsEnabled: true,
    betaFeaturesEnabled: false,
    showFeedbackButton: true,
  },

  // ==========================================================================
  // HELP VIDEOS
  // ==========================================================================

  helpVideos: {
    enabled: false,
    showBanner: true,
    showFloatingButton: true,
    autoPlayOnFirstVisit: false,
    videos: {
      createLesson: {
        id: 'create_first_lesson',
        title: 'Create Your First Lesson',
        description: 'Learn how to generate a customized Bible study lesson in under 2 minutes.',
        url: '',
        durationSeconds: 60,
        storageKey: 'bls_help_create_first_lesson_seen',
      },
      understandingOutput: {
        id: 'understanding_output',
        title: 'Understanding Your Lesson',
        description: 'See how to navigate and use your generated lesson sections.',
        url: '',
        durationSeconds: 45,
        storageKey: 'bls_help_understanding_output_seen',
      },
      creditsAndUsage: {
        id: 'credits_usage',
        title: 'Credits & Subscription',
        description: 'Understand your lesson credits and subscription options.',
        url: '',
        durationSeconds: 30,
        storageKey: 'bls_help_credits_usage_seen',
      },
      exportLesson: {
        id: 'export_lesson',
        title: 'Export & Share Your Lesson',
        description: 'Download your lesson as PDF or Word document.',
        url: '',
        durationSeconds: 30,
        storageKey: 'bls_help_export_lesson_seen',
      },
      step1: {
        id: 'step1_scripture',
        title: 'Step 1: Choose Your Scripture',
        description: 'Learn how to enter Bible passages or paste curriculum content.',
        url: '',
        durationSeconds: 45,
        storageKey: 'bls_help_step1_seen',
      },
      step2: {
        id: 'step2_context',
        title: 'Step 2: Set Your Teaching Context',
        description: 'Configure age group, theology profile, and Bible version.',
        url: '',
        durationSeconds: 60,
        storageKey: 'bls_help_step2_seen',
      },
      step3: {
        id: 'step3_personalize',
        title: 'Step 3: Personalize Your Lesson',
        description: 'Save teacher profiles and customize lesson generation settings.',
        url: '',
        durationSeconds: 90,
        storageKey: 'bls_help_step3_seen',
      },
    },
    bannerStyles: {
      backgroundColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconBackgroundColor: 'bg-amber-100',
      iconColor: 'text-amber-700',
      titleColor: 'text-green-900',
      subtitleColor: 'text-primary',
      buttonBackgroundColor: 'bg-primary',
      buttonHoverColor: 'hover:bg-green-800',
    },
    floatingButtonStyles: {
      backgroundColor: 'bg-primary',
      hoverColor: 'hover:bg-green-800',
      textColor: 'text-white',
    },
  },

  // ==========================================================================
  // THEOLOGICAL IDENTITY
  // ==========================================================================

  theological: {
    denomination: "Baptist",
    tradition: "Southern Baptist",
    defaultBibleTranslation: "KJV",
    theologicalTagline: "Rooted in Baptist Heritage, Relevant for Today",
    theologicalStatement: "BibleLessonSpark creates Bible study content aligned with historic Baptist theology and the Baptist Faith & Message.",
  },

  // ==========================================================================
  // EMAIL CONFIGURATION (uses SSOT colors)
  // ==========================================================================

  email: {
    fromEmail: "noreply@biblelessonspark.com",
    fromName: "BibleLessonSpark",
    get from() {
      return `${this.fromName} <${this.fromEmail}>`;
    },
    replyTo: "support@biblelessonspark.com",

    // Email styles reference brand colors from SSOT
    styles: {
      headerBackground: brandValues.colors.primary.DEFAULT,
      headerTextColor: "#FFFFFF",
      bodyBackground: brandValues.colors.background.secondary,
      contentBackground: "#FFFFFF",
      textColor: brandValues.colors.text.primary,
      mutedTextColor: brandValues.colors.text.secondary,
      linkColor: brandValues.colors.primary.DEFAULT,
      buttonBackground: brandValues.colors.primary.DEFAULT,
      buttonTextColor: "#FFFFFF",
      secondaryButtonBackground: brandValues.colors.secondary.DEFAULT,
      secondaryButtonTextColor: brandValues.colors.text.primary,
      footerBackground: brandValues.colors.background.secondary,
      footerTextColor: brandValues.colors.text.secondary,
      borderColor: brandValues.colors.border.DEFAULT,
      borderRadius: "6px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },

    images: {
      headerLogo: "https://biblelessonspark.com/assets/email-logo.png",
      headerLogoWidth: 180,
      headerLogoHeight: 40,
      headerLogoAlt: "BibleLessonSpark",
      iconLogo: "https://biblelessonspark.com/assets/email-icon.png",
      socialIcons: {
        facebook: "https://biblelessonspark.com/assets/email/icon-facebook.png",
        twitter: "https://biblelessonspark.com/assets/email/icon-twitter.png",
        instagram: "https://biblelessonspark.com/assets/email/icon-instagram.png",
      },
    },

    subjects: {
      welcome: "Welcome to BibleLessonSpark! 🎉",
      emailVerification: "Verify your BibleLessonSpark email address",
      passwordReset: "Reset your BibleLessonSpark password",
      passwordChanged: "Your BibleLessonSpark password has been changed",
      orgInvitation: "You've been invited to join {orgName} on BibleLessonSpark",
      orgInvitationAccepted: "{userName} has joined {orgName}",
      orgRoleChanged: "Your role in {orgName} has been updated",
      orgRemoved: "You've been removed from {orgName}",
      lessonShared: "{userName} shared a lesson with you",
      lessonComplete: "Your lesson is ready: {lessonTitle}",
      feedbackReceived: "New feedback received from {userName}",
      weeklyDigest: "Your BibleLessonSpark weekly summary",
      systemNotice: "Important notice from BibleLessonSpark",
      betaInvitation: "You're invited to try BibleLessonSpark!",
      featureAnnouncement: "New feature: {featureName}",
    },

    content: {
      footerTagline: "Helping Baptist teachers create engaging Bible studies",
      unsubscribeText: "Unsubscribe from these emails",
      preferencesText: "Manage email preferences",
      disclaimer: "This email was sent by BibleLessonSpark. You received this email because you have an account with us or someone invited you to join.",
      supportPrompt: "Questions? Contact us at",
      greetings: {
        default: "Hello {firstName},",
        formal: "Dear {firstName},",
        friendly: "Hi {firstName}!",
        noName: "Hello,",
      },
      signoffs: {
        default: "Blessings,",
        formal: "Sincerely,",
        friendly: "God bless,",
        team: "The BibleLessonSpark Team",
      },
      buttons: {
        verifyEmail: "Verify Email Address",
        resetPassword: "Reset Password",
        acceptInvitation: "Accept Invitation",
        viewLesson: "View Lesson",
        getStarted: "Get Started",
        login: "Log In",
        learnMore: "Learn More",
      },
    },

    templates: {
      welcome: {
        heading: "Welcome to BibleLessonSpark!",
        body: `Thank you for joining BibleLessonSpark! We're excited to help you create engaging, theologically sound Bible study lessons for your Sunday School class.

With BibleLessonSpark, you can:
• Generate customized lessons in minutes
• Tailor content to your specific teaching context
• Access lessons aligned with Baptist theology

Ready to create your first lesson?`,
        buttonText: "Create Your First Lesson",
        buttonUrl: "{baseUrl}/dashboard",
      },
      orgInvitation: {
        heading: "You've Been Invited!",
        body: `{inviterName} has invited you to join {orgName} on BibleLessonSpark.

As a member of {orgName}, you'll be able to:
• Access shared lesson resources
• Collaborate with other teachers
• Use organization-wide settings and preferences

Click the button below to accept this invitation:`,
        buttonText: "Accept Invitation",
        buttonUrl: "{invitationUrl}",
        expirationNote: "This invitation will expire in {expirationDays} days.",
      },
      passwordReset: {
        heading: "Reset Your Password",
        body: `We received a request to reset your password for your BibleLessonSpark account.

Click the button below to create a new password:`,
        buttonText: "Reset Password",
        buttonUrl: "{resetUrl}",
        expirationNote: "This link will expire in 1 hour.",
        securityNote: "If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.",
      },
      emailVerification: {
        heading: "Verify Your Email Address",
        body: `Please verify your email address to complete your BibleLessonSpark registration.

Click the button below to verify:`,
        buttonText: "Verify Email",
        buttonUrl: "{verificationUrl}",
        expirationNote: "This link will expire in 24 hours.",
      },
      lessonShared: {
        heading: "A Lesson Has Been Shared With You",
        body: `{sharerName} has shared a Bible study lesson with you on BibleLessonSpark.

Lesson: {lessonTitle}
Scripture: {lessonScripture}

Click below to view the lesson:`,
        buttonText: "View Lesson",
        buttonUrl: "{lessonUrl}",
      },
    },

    resend: {
      defaultTags: [
        { name: "app", value: "biblelessonspark" },
        { name: "environment", value: "production" },
      ],
      webhookEndpoint: "https://biblelessonspark.com/api/webhooks/resend",
      trackOpens: true,
      trackClicks: true,
    },
  },

  // ==========================================================================
  // UI TEXT / MICROCOPY
  // ==========================================================================

  text: {
    heroHeadline: "Create Engaging Bible Studies in Minutes",
    heroSubheadline: "Personalized lesson generation for Baptist Sunday School teachers",
    ctaPrimary: "Get Started Free",
    ctaSecondary: "See How It Works",
    loading: {
      lessons: "Generating your lesson...",
      default: "Loading...",
    },
    empty: {
      lessons: "No lessons yet. Create your first lesson to get started!",
      organizations: "You haven't joined any organizations yet.",
    },
    success: {
      lessonCreated: "Your lesson has been created successfully!",
      lessonSaved: "Lesson saved.",
      profileUpdated: "Your profile has been updated.",
    },
  },

  // ==========================================================================
  // BETA PROGRAM UI TEXT
  // ==========================================================================

  beta: {
    landingPage: {
      ctaTitle: 'Get Started Free',
      ctaSubtitle: 'Create engaging Bible study lessons for your Sunday School class in minutes.',
      ctaButton: 'Get Started Free',
      features: [
        'Personalized lesson generation',
        'Theologically sound Baptist content',
        'Age-appropriate for any class',
        'Ready in under 2 minutes',
      ],
      trustText: 'Trusted by Baptist teachers across the country',
    },
    form: {
      title: 'Join BibleLessonSpark',
      subtitle: 'Start creating Bible study lessons in minutes.',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      emailLabel: 'Email Address',
      emailPlaceholder: 'you@church.org',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Create a secure password',
      churchNameLabel: 'Church Name (optional)',
      churchNamePlaceholder: 'First Baptist Church',
      referralSourceLabel: 'How did you hear about us? (optional)',
      referralSourcePlaceholder: 'Select an option',
      submitButton: 'Create My Free Account',
      submittingButton: 'Creating Account...',
      alreadyHaveAccount: 'Already have an account?',
      signInLink: 'Sign in',
      termsText: 'By creating an account, you agree to our',
      termsLink: 'Terms of Service',
      privacyLink: 'Privacy Policy',
    },
    dashboardPrompt: {
      title: 'Complete Your Registration',
      description: 'Complete your registration to access all features.',
      button: 'Join Now',
      dismissButton: 'Maybe Later',
    },
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
        description: 'You already have an account.',
      },
      verificationSent: {
        title: 'Verification Email Sent',
        description: 'Please check your inbox and click the verification link.',
      },
    },
    validation: {
      fullNameRequired: 'Please enter your full name',
      fullNameMinLength: 'Name must be at least 2 characters',
      emailRequired: 'Please enter your email address',
      emailInvalid: 'Please enter a valid email address',
      passwordRequired: 'Please create a password',
      passwordMinLength: 'Password must be at least 8 characters',
    },
  },

} as const;

// ============================================================================
// TAILWIND CSS VARIABLES GENERATOR (SSOT OUTPUT)
// ============================================================================

/**
 * Generate CSS variables for Tailwind consumption
 * This is the SSOT output - all colors flow from brand-values.json via BRANDING.colors
 *
 * Format: CSS variables in "H S% L%" format (no hsl() wrapper)
 * Tailwind config uses: hsl(var(--primary))
 *
 * @returns Full CSS string to inject into document head
 */
export function generateTailwindCSSVariables(): string {
  const c = BRANDING.colors;

  // Convert all brand colors to HSL
  const primary = hexToHsl(c.primary.DEFAULT);
  const primaryLight = hexToHsl(c.primary.light);
  const primaryDark = hexToHsl(c.primary.dark);
  const primaryForeground = hexToHsl(c.primary.foreground);

  const secondary = hexToHsl(c.secondary.DEFAULT);
  const secondaryLight = hexToHsl(c.secondary.light);
  const secondaryDark = hexToHsl(c.secondary.dark);
  const secondaryForeground = hexToHsl(c.secondary.foreground);

  const accent = hexToHsl(c.accent.DEFAULT);
  const accentForeground = hexToHsl(c.accent.foreground);

  const burgundy = hexToHsl(c.burgundy.DEFAULT);
  const burgundyLight = hexToHsl(c.burgundy.light);
  const burgundyHover = hexToHsl(c.burgundy.hover);

  const background = hexToHsl(c.background.primary);
  const backgroundSecondary = hexToHsl(c.background.secondary);
  const backgroundDark = hexToHsl(c.background.dark);

  const textPrimary = hexToHsl(c.text.primary);
  const textSecondary = hexToHsl(c.text.secondary);
  const textLight = hexToHsl(c.text.light);
  const textInverse = hexToHsl(c.text.inverse);

  const card = hexToHsl(c.card.DEFAULT);
  const cardForeground = hexToHsl(c.card.foreground);

  const muted = hexToHsl(c.muted.DEFAULT);
  const mutedForeground = hexToHsl(c.muted.foreground);

  const border = hexToHsl(c.border);
  const input = hexToHsl(c.input);
  const ring = hexToHsl(c.ring);

  // Design tokens
  const t = BRANDING.tokens;

  return `
:root {
  /* ========================================
   * GENERATED FROM brand-values.json (SSOT)
   * Do not edit - change brand-values.json instead
   * ======================================== */

  /* Background: Warm Cream */
  --background: ${background};
  --foreground: ${textPrimary};

  /* Card System */
  --card: ${card};
  --card-foreground: ${cardForeground};

  /* Popover */
  --popover: ${card};
  --popover-foreground: ${cardForeground};

  /* Primary - Forest Green */
  --primary: ${primary};
  --primary-foreground: ${primaryForeground};
  --primary-hover: ${primaryLight};
  --primary-light: ${adjustLightness(primary, COLOR_ADJUSTMENTS.light.primaryLight)};

  /* Secondary - Antique Gold */
  --secondary: ${secondary};
  --secondary-foreground: ${secondaryForeground};
  --secondary-hover: ${secondaryDark};
  --secondary-light: ${adjustLightness(secondary, COLOR_ADJUSTMENTS.light.secondaryLight)};

  /* Success - Forest Green */
  --success: ${primary};
  --success-foreground: ${primaryForeground};
  --success-light: ${adjustLightness(primary, COLOR_ADJUSTMENTS.light.primaryLight)};

  /* Warning - Antique Gold */
  --warning: ${secondary};
  --warning-foreground: ${secondaryForeground};
  --warning-light: ${adjustLightness(secondary, COLOR_ADJUSTMENTS.light.secondaryLight)};

  /* Destructive - Burgundy */
  --destructive: ${burgundy};
  --destructive-foreground: ${primaryForeground};
  --destructive-light: ${adjustLightness(burgundy, COLOR_ADJUSTMENTS.light.destructiveLight)};

  /* Burgundy variants */
  --burgundy: ${burgundy};
  --burgundy-hover: ${burgundyHover};
  --burgundy-light: ${burgundyLight};

  /* Muted Tones */
  --muted: ${muted};
  --muted-foreground: ${mutedForeground};

  /* Accent - Deep Gold */
  --accent: ${accent};
  --accent-foreground: ${accentForeground};

  /* Borders & Inputs */
  --border: ${border};
  --input: ${input};
  --ring: ${ring};

  /* Design Tokens */
  --radius: ${t.radius.DEFAULT};
  --radius-sm: ${t.radius.sm};
  --radius-lg: ${t.radius.lg};

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, hsl(${primary}), hsl(${primaryLight}));
  --gradient-secondary: linear-gradient(135deg, hsl(${secondary}), hsl(${secondaryLight}));
  --gradient-hero: linear-gradient(135deg, hsl(${primaryDark}) 0%, hsl(${primary}) 50%, hsl(${secondary}) 100%);
  --gradient-card: linear-gradient(145deg, hsl(${card}) 0%, hsl(${backgroundSecondary}) 100%);

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 hsl(${primary} / 0.05);
  --shadow-md: 0 4px 6px -1px hsl(${primary} / 0.1), 0 2px 4px -1px hsl(${primary} / 0.06);
  --shadow-lg: 0 10px 15px -3px hsl(${primary} / 0.1), 0 4px 6px -2px hsl(${primary} / 0.05);
  --shadow-glow: 0 0 0 1px hsl(${primary} / 0.05), 0 8px 32px -8px hsl(${primary} / 0.3);

  /* Typography Scale */
  --font-size-xs: ${t.fontSize.xs};
  --font-size-sm: ${t.fontSize.sm};
  --font-size-base: ${t.fontSize.base};
  --font-size-lg: ${t.fontSize.lg};
  --font-size-xl: ${t.fontSize.xl};
  --font-size-2xl: ${t.fontSize['2xl']};
  --font-size-3xl: ${t.fontSize['3xl']};
  --font-size-4xl: ${t.fontSize['4xl']};

  /* Spacing */
  --spacing-xs: ${t.spacing.xs};
  --spacing-sm: ${t.spacing.sm};
  --spacing-md: ${t.spacing.md};
  --spacing-lg: ${t.spacing.lg};
  --spacing-xl: ${t.spacing.xl};
  --spacing-2xl: ${t.spacing['2xl']};

  /* Transitions */
  --transition-fast: ${t.transition.fast};
  --transition-normal: ${t.transition.normal};
  --transition-slow: ${t.transition.slow};

  /* Section Spacing */
  --section-y: ${t.section.y};
  --section-y-lg: ${t.section.yLg};

  /* Layout tokens from COLOR_ADJUSTMENTS */
  --border-accent-width: ${COLOR_ADJUSTMENTS.layout.accentBorderWidth};
  --border-standard-width: ${COLOR_ADJUSTMENTS.layout.borderWidth};
  --container-max-width: ${COLOR_ADJUSTMENTS.layout.containerMaxWidth};

  /* Sidebar colors (derived from primary/secondary) */
  --sidebar-background: ${background};
  --sidebar-foreground: ${textPrimary};
  --sidebar-primary: ${primary};
  --sidebar-primary-foreground: ${primaryForeground};
  --sidebar-accent: ${secondary};
  --sidebar-accent-foreground: ${secondaryForeground};
  --sidebar-border: ${border};
  --sidebar-ring: ${primary};
}

@media (min-width: 1024px) {
  :root {
    --section-y: 3rem;
    --section-y-lg: 4rem;
  }
}

.dark {
  /* Dark mode - Deep forest green background */
  --background: ${backgroundDark};
  --foreground: ${textInverse};

  --card: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.cardShift)};
  --card-foreground: ${textInverse};

  --popover: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.cardShift)};
  --popover-foreground: ${textInverse};

  --primary: ${adjustLightness(primary, COLOR_ADJUSTMENTS.dark.primaryShift)};
  --primary-foreground: ${primaryForeground};
  --primary-hover: ${adjustLightness(primary, COLOR_ADJUSTMENTS.dark.primaryHoverShift)};
  --primary-light: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.backgroundMuted)};

  --secondary: ${adjustLightness(secondary, COLOR_ADJUSTMENTS.dark.secondaryShift)};
  --secondary-foreground: ${backgroundDark};
  --secondary-hover: ${adjustLightness(secondary, COLOR_ADJUSTMENTS.dark.secondaryHoverShift)};
  --secondary-light: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.backgroundMuted)};

  --success: ${adjustLightness(primary, COLOR_ADJUSTMENTS.dark.primaryShift)};
  --success-foreground: ${primaryForeground};
  --success-light: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.backgroundMuted)};

  --warning: ${adjustLightness(secondary, COLOR_ADJUSTMENTS.dark.secondaryShift)};
  --warning-foreground: ${backgroundDark};
  --warning-light: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.backgroundMuted)};

  --destructive: ${adjustLightness(burgundy, COLOR_ADJUSTMENTS.dark.destructiveShift)};
  --destructive-foreground: ${primaryForeground};
  --destructive-light: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.backgroundMuted)};

  --burgundy: ${adjustLightness(burgundy, COLOR_ADJUSTMENTS.dark.burgundyShift)};
  --burgundy-hover: ${adjustLightness(burgundyHover, COLOR_ADJUSTMENTS.dark.burgundyHoverShift)};
  --burgundy-light: ${adjustLightness(burgundyLight, COLOR_ADJUSTMENTS.dark.burgundyLightShift)};

  --muted: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.backgroundMuted)};
  --muted-foreground: ${adjustLightness(secondary, COLOR_ADJUSTMENTS.dark.mutedForegroundShift)};

  --accent: ${adjustLightness(accent, COLOR_ADJUSTMENTS.dark.accentShift)};
  --accent-foreground: ${textInverse};

  --border: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.borderShift)};
  --input: ${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.borderShift)};
  --ring: ${adjustLightness(primary, COLOR_ADJUSTMENTS.dark.primaryShift)};

  /* Dark mode gradients */
  --gradient-primary: linear-gradient(135deg, hsl(${adjustLightness(primary, COLOR_ADJUSTMENTS.gradient.primaryStart)}), hsl(${adjustLightness(primary, COLOR_ADJUSTMENTS.gradient.primaryEnd)}));
  --gradient-secondary: linear-gradient(135deg, hsl(${adjustLightness(secondary, COLOR_ADJUSTMENTS.gradient.secondaryShift)}), hsl(${adjustLightness(secondary, COLOR_ADJUSTMENTS.dark.secondaryShift)}));
  --gradient-hero: linear-gradient(135deg, hsl(${adjustLightness(primary, COLOR_ADJUSTMENTS.gradient.heroStart)}) 0%, hsl(${adjustLightness(primary, COLOR_ADJUSTMENTS.gradient.heroMiddle)}) 50%, hsl(${adjustLightness(secondary, COLOR_ADJUSTMENTS.gradient.secondaryShift)}) 100%);
  --gradient-card: linear-gradient(145deg, hsl(${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.dark.cardShift)}) 0%, hsl(${adjustLightness(backgroundDark, COLOR_ADJUSTMENTS.gradient.cardEnd)}) 100%);
}
  `.trim();
}

// ============================================================================
// LEGACY CSS VARIABLES GENERATOR (for reference/email)
// ============================================================================

/**
 * Generate CSS custom properties with HEX values
 * Used for contexts where HSL isn't needed (emails, static exports)
 */
export function generateCSSVariables(): string {
  const c = BRANDING.colors;
  return `
:root {
  /* Primary Colors - Forest Green */
  --color-primary: ${c.primary.DEFAULT};
  --color-primary-light: ${c.primary.light};
  --color-primary-dark: ${c.primary.dark};

  /* Secondary Colors - Antique Gold */
  --color-secondary: ${c.secondary.DEFAULT};
  --color-secondary-light: ${c.secondary.light};
  --color-secondary-dark: ${c.secondary.dark};

  /* Accent Colors - Deep Gold */
  --color-accent: ${c.accent.DEFAULT};
  --color-accent-light: ${c.accent.light};
  --color-accent-dark: ${c.accent.dark};

  /* Tertiary Colors - Burgundy */
  --color-burgundy: ${c.burgundy.DEFAULT};
  --color-burgundy-light: ${c.burgundy.light};
  --color-burgundy-dark: ${c.burgundy.dark};
  --color-burgundy-hover: ${c.burgundy.hover};

  /* Background Colors - Warm Cream */
  --color-bg-primary: ${c.background.primary};
  --color-bg-secondary: ${c.background.secondary};
  --color-bg-dark: ${c.background.dark};

  /* Text Colors */
  --color-text-primary: ${c.text.primary};
  --color-text-secondary: ${c.text.secondary};
  --color-text-light: ${c.text.light};
  --color-text-inverse: ${c.text.inverse};

  /* Typography */
  --font-primary: ${BRANDING.typography.fontFamily.primary};
  --font-secondary: ${BRANDING.typography.fontFamily.secondary};
}
  `.trim();
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BrandingConfig = typeof BRANDING;
export type BrandingColors = typeof BRANDING.colors;
export type BrandingFeatures = typeof BRANDING.features;
export type BrandingHelpVideos = typeof BRANDING.helpVideos;
export type BrandingBeta = typeof BRANDING.beta;
export type EmailStyles = typeof BRANDING.email.styles;
export type EmailSubjects = typeof BRANDING.email.subjects;
export type EmailTemplates = typeof BRANDING.email.templates;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return BRANDING.appName;
  return `${pageTitle} | ${BRANDING.appName}`;
}

export function getCopyrightNotice(): string {
  return BRANDING.legal.copyrightNotice;
}

export function isFeatureEnabled(feature: keyof typeof BRANDING.features): boolean {
  const value = BRANDING.features[feature];
  return typeof value === 'boolean' ? value : Boolean(value);
}

export function getAvailableLanguages() {
  if (!BRANDING.features.multiLanguage) {
    return [BRANDING.features.availableLanguages[0]];
  }
  return BRANDING.features.availableLanguages;
}

// ============================================================================
// EMAIL HELPER FUNCTIONS
// ============================================================================

export function getEmailSubject(
  templateKey: keyof typeof BRANDING.email.subjects,
  replacements: Record<string, string> = {}
): string {
  let subject = BRANDING.email.subjects[templateKey];
  Object.entries(replacements).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return subject;
}

export function getEmailFrom(): string {
  return BRANDING.email.from;
}

export function getEmailTemplate(
  templateKey: keyof typeof BRANDING.email.templates,
  replacements: Record<string, string> = {}
): typeof BRANDING.email.templates[typeof templateKey] {
  const template = { ...BRANDING.email.templates[templateKey] };
  Object.keys(template).forEach((key) => {
    const typedKey = key as keyof typeof template;
    if (typeof template[typedKey] === 'string') {
      let value = template[typedKey] as string;
      Object.entries(replacements).forEach(([placeholder, replacement]) => {
        value = value.replace(new RegExp(`{${placeholder}}`, 'g'), replacement);
      });
      (template as any)[typedKey] = value;
    }
  });
  return template;
}

export function getEmailGreeting(
  firstName?: string,
  style: keyof typeof BRANDING.email.content.greetings = 'default'
): string {
  if (!firstName) {
    return BRANDING.email.content.greetings.noName;
  }
  return BRANDING.email.content.greetings[style].replace('{firstName}', firstName);
}

export function getEmailSignoff(
  style: keyof typeof BRANDING.email.content.signoffs = 'default'
): string {
  return BRANDING.email.content.signoffs[style];
}

export function getResendEmailOptions(overrides: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}) {
  return {
    from: BRANDING.email.from,
    replyTo: overrides.replyTo || BRANDING.email.replyTo,
    tags: [
      ...BRANDING.email.resend.defaultTags,
      ...(overrides.tags || []),
    ],
    ...overrides,
  };
}

/**
 * Generate inline CSS for email templates
 */
export function getEmailInlineStyles() {
  const s = BRANDING.email.styles;
  return {
    wrapper: `background-color: ${s.bodyBackground}; padding: 40px 20px; font-family: ${s.fontFamily};`,
    container: `max-width: 600px; margin: 0 auto; background-color: ${s.contentBackground}; border-radius: ${s.borderRadius}; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);`,
    header: `background-color: ${s.headerBackground}; padding: 24px; text-align: center;`,
    headerText: `color: ${s.headerTextColor}; margin: 0; font-size: 24px; font-weight: 600;`,
    body: `padding: 32px 24px; color: ${s.textColor}; font-size: 16px; line-height: 1.6;`,
    heading: `color: ${s.textColor}; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;`,
    paragraph: `color: ${s.textColor}; margin: 0 0 16px 0;`,
    mutedText: `color: ${s.mutedTextColor}; font-size: 14px;`,
    link: `color: ${s.linkColor}; text-decoration: underline;`,
    button: `display: inline-block; background-color: ${s.buttonBackground}; color: ${s.buttonTextColor}; padding: 12px 24px; border-radius: ${s.borderRadius}; text-decoration: none; font-weight: 500;`,
    secondaryButton: `display: inline-block; background-color: ${s.secondaryButtonBackground}; color: ${s.secondaryButtonTextColor}; padding: 12px 24px; border-radius: ${s.borderRadius}; text-decoration: none; font-weight: 500;`,
    footer: `background-color: ${s.footerBackground}; padding: 24px; text-align: center; border-top: 1px solid ${s.borderColor};`,
    footerText: `color: ${s.footerTextColor}; font-size: 12px; margin: 0 0 8px 0;`,
    divider: `border: none; border-top: 1px solid ${s.borderColor}; margin: 24px 0;`,
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default BRANDING;
