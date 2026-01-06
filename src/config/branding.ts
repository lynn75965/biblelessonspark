/**
 * LessonSparkUSA Branding Configuration
 * ======================================
 * 
 * This file centralizes ALL branding elements for the application.
 * For white-label deployments, modify ONLY this file to rebrand the entire app.
 * 
 * Location: src/config/branding.ts
 * 
 * USAGE:
 *   import { BRANDING } from '@/config/branding';
 *   <h1>{BRANDING.appName}</h1>
 *   <img src={BRANDING.logo.primary} alt={BRANDING.appName} />
 */

// ============================================================================
// CORE IDENTITY
// ============================================================================

export const BRANDING = {
  /**
   * Application name - appears in headers, titles, emails, etc.
   */
  appName: "LessonSpark USA",
  
  /**
   * Short name for compact displays (mobile nav, favicon title, etc.)
   */
  appNameShort: "LessonSpark",
  
  /**
   * Primary tagline - used on landing page, meta descriptions
   */
  tagline: "Baptist Bible Study Enhancement Platform",
  
  /**
   * Extended description for marketing/SEO
   */
  description: "AI-powered Bible study lesson generator for Baptist Sunday School teachers. Create customized, theologically sound lessons in minutes.",
  
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
    "teacher resources"
  ],

  // ==========================================================================
  // DOMAIN & URLS
  // ==========================================================================
  
  urls: {
    /**
     * Primary domain (without protocol)
     */
    domain: "lessonsparkusa.com",
    
    /**
     * Full base URL (with protocol)
     */
    baseUrl: "https://lessonsparkusa.com",
    
    /**
     * Support/help page URL
     */
    support: "https://lessonsparkusa.com/support",
    
    /**
     * Terms of Service URL
     */
    termsOfService: "https://lessonsparkusa.com/terms",
    
    /**
     * Privacy Policy URL
     */
    privacyPolicy: "https://lessonsparkusa.com/privacy",
    
    /**
     * Documentation/Help URL (if separate)
     */
    documentation: "https://lessonsparkusa.com/help",
    
    /**
     * Unsubscribe URL template (for email compliance)
     * {token} will be replaced with user-specific unsubscribe token
     */
    unsubscribe: "https://lessonsparkusa.com/unsubscribe?token={token}",
    
    /**
     * Email preferences URL
     */
    emailPreferences: "https://lessonsparkusa.com/settings/notifications",
  },

  // ==========================================================================
  // CONTACT INFORMATION
  // ==========================================================================
  
  contact: {
    /**
     * Primary support email
     */
    supportEmail: "support@lessonsparkusa.com",
    
    /**
     * General inquiries email
     */
    infoEmail: "info@lessonsparkusa.com",
    
    /**
     * No-reply email for automated messages
     */
    noReplyEmail: "noreply@lessonsparkusa.com",
    
    /**
     * Display name for email sender
     */
    emailSenderName: "LessonSpark USA",
    
    /**
     * Phone number (optional - set to null if not used)
     */
    phone: null,
    
    /**
     * Physical address (REQUIRED for CAN-SPAM compliance in emails)
     * Even a PO Box is acceptable
     */
    address: {
      line1: "LessonSpark USA",
      line2: null,  // Optional second line
      city: "Nacogdoches",
      state: "TX",
      zip: "75965",
      country: "USA",
    },
    
    /**
     * Formatted address for email footer (single line)
     */
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
    /**
     * Primary logo (for light backgrounds)
     * Recommended: SVG format, ~200px width
     */
    primary: "/assets/logo-primary.svg",
    
    /**
     * Logo for dark backgrounds
     */
    light: "/assets/logo-light.svg",
    
    /**
     * Small logo/icon for compact spaces (navbar, mobile)
     * Recommended: Square format, ~40px
     */
    icon: "/assets/logo-icon.svg",
    
    /**
     * Favicon (browser tab icon)
     */
    favicon: "/favicon.ico",
    
    /**
     * Apple touch icon (iOS home screen)
     */
    appleTouchIcon: "/apple-touch-icon.png",
    
    /**
     * Open Graph image (social media sharing)
     * Recommended: 1200x630px
     */
    ogImage: "/assets/og-image.png",
    
    /**
     * Logo alt text for accessibility
     */
    altText: "LessonSpark USA Logo",
  },

  // ==========================================================================
  // VISUAL IDENTITY - COLORS
  // ==========================================================================
  
  colors: {
    /**
     * Primary brand color
     * Used for: buttons, links, primary actions
     * Current: Indigo (adjust to match your Tailwind config)
     */
    primary: {
      DEFAULT: "#4F46E5",  // indigo-600
      light: "#818CF8",    // indigo-400
      dark: "#3730A3",     // indigo-800
    },
    
    /**
     * Secondary brand color
     * Used for: secondary buttons, accents
     */
    secondary: {
      DEFAULT: "#10B981",  // emerald-500
      light: "#34D399",    // emerald-400
      dark: "#059669",     // emerald-600
    },
    
    /**
     * Accent color
     * Used for: highlights, notifications, badges
     */
    accent: {
      DEFAULT: "#F59E0B",  // amber-500
      light: "#FBBF24",    // amber-400
      dark: "#D97706",     // amber-600
    },
    
    /**
     * Success color (confirmations, completions)
     */
    success: "#22C55E",    // green-500
    
    /**
     * Warning color (cautions, alerts)
     */
    warning: "#F59E0B",    // amber-500
    
    /**
     * Error/Danger color
     */
    error: "#EF4444",      // red-500
    
    /**
     * Info color
     */
    info: "#3B82F6",       // blue-500
    
    /**
     * Background colors
     */
    background: {
      primary: "#FFFFFF",
      secondary: "#F9FAFB",  // gray-50
      dark: "#111827",       // gray-900
    },
    
    /**
     * Text colors
     */
    text: {
      primary: "#111827",    // gray-900
      secondary: "#6B7280",  // gray-500
      light: "#9CA3AF",      // gray-400
      inverse: "#FFFFFF",
    },
  },

  // ==========================================================================
  // TYPOGRAPHY (if using custom fonts)
  // ==========================================================================
  
  typography: {
    /**
     * Primary font family (headings, UI)
     */
    fontFamily: {
      primary: '"Inter", system-ui, sans-serif',
      secondary: '"Merriweather", Georgia, serif',  // For Scripture text
    },
    
    /**
     * Google Fonts URL (if loading external fonts)
     * Set to null if using system fonts only
     */
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap",
  },

  // ==========================================================================
  // LAYOUT & STRUCTURE (Page-level styling for white-label customization)
  // ==========================================================================
  
  layout: {
    /**
     * Page wrapper - outermost container for all pages
     */
    pageWrapper: "min-h-screen bg-background flex flex-col",
    
    /**
     * Main content area - flex-1 to fill available space
     */
    mainContent: "flex-1",
    
    /**
     * Container padding (responsive)
     */
    containerPadding: "py-6 sm:py-8 px-4 sm:px-6",
    
    /**
     * Container max-width for centered content
     */
    containerNarrow: "max-w-2xl mx-auto",
    
    /**
     * Container max-width for wider content
     */
    containerWide: "max-w-6xl mx-auto",
    
    /**
     * Page header bottom margin
     */
    pageHeaderMargin: "mb-6 sm:mb-8",
    
    /**
     * Section vertical spacing
     */
    sectionSpacing: "mb-6 sm:mb-8",
    
    /**
     * Card/grid gaps (responsive)
     */
    gridGap: "gap-4 sm:gap-6",
    
    /**
     * Stats card grid columns
     */
    statsGrid: "grid grid-cols-2 gap-3 sm:gap-4",
    
    /**
     * Standard card padding
     */
    cardPadding: "p-4 sm:p-6",
    
    /**
     * Auth page wrapper - centered form with gradient background
     */
    authPageWrapper: "min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4",
    
    /**
     * Auth form container - max-width centered
     */
    authFormContainer: "w-full max-w-md px-4 sm:px-0",
    
    /**
     * Legal pages wrapper - gradient background for Privacy/Terms
     */
    legalPageWrapper: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4",
    
    /**
     * Legal page content card
     */
    legalPageCard: "max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8",
  },
  // ==========================================================================
  // LEGAL & COPYRIGHT
  // ==========================================================================
  
  legal: {
    /**
     * Copyright holder name
     */
    copyrightHolder: "LessonSpark USA",
    
    /**
     * Copyright start year
     */
    copyrightYear: "2024",
    
    /**
     * Full copyright notice (auto-generated with current year)
     */
    get copyrightNotice() {
      const currentYear = new Date().getFullYear();
      const yearRange = this.copyrightYear === String(currentYear) 
        ? this.copyrightYear 
        : `${this.copyrightYear}-${currentYear}`;
      return `© ${yearRange} ${this.copyrightHolder}. All rights reserved.`;
    },
    
    /**
     * Company/Organization legal name (for ToS, etc.)
     */
    legalEntityName: "LessonSpark USA",
    
    /**
     * State/Jurisdiction for legal purposes
     */
    jurisdiction: "Texas, United States",
  },

  // ==========================================================================
  // SOCIAL MEDIA (optional)
  // ==========================================================================
  
  social: {
    /**
     * Set any to null if not used
     */
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    linkedin: null,
  },

  // ==========================================================================
  // FEATURE FLAGS (White-label customization options)
  // ==========================================================================
  
  features: {
    /**
     * Show "Powered by LessonSpark USA" badge in footer
     * White-label customers may want this false
     */
    showPoweredBy: false,
    
    /**
     * Allow public user registration
     * Some organizations may want invite-only
     */
    allowPublicSignup: true,
    
    /**
     * Enable multi-language support
     */
    multiLanguage: true,
    
    /**
     * Available languages (if multiLanguage is true)
     */
    availableLanguages: [
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "es", name: "Español", flag: "🇲🇽" },
      { code: "fr", name: "Français", flag: "🇫🇷" },
    ],
    
    /**
     * Default language
     */
    defaultLanguage: "en",
    
    /**
     * Enable organization/church features
     */
    organizationsEnabled: true,
    
    /**
     * Enable beta features
     */
    betaFeaturesEnabled: false,
    
    /**
     * Show feedback button
     */
    showFeedbackButton: true,
  },

  // ==========================================================================
  // THEOLOGICAL IDENTITY (specific to LessonSpark)
  // ==========================================================================
  
  theological: {
    /**
     * Primary denominational identity
     */
    denomination: "Baptist",
    
    /**
     * Theological tradition description
     */
    tradition: "Southern Baptist",
    
    /**
     * Default Bible translation
     */
    defaultBibleTranslation: "KJV",
    
    /**
     * Tagline for theological positioning
     */
    theologicalTagline: "Rooted in Baptist Heritage, Relevant for Today",
    
    /**
     * Statement shown to users about theological approach
     */
    theologicalStatement: "LessonSpark USA creates Bible study content aligned with historic Baptist theology and the Baptist Faith & Message.",
  },

  // ==========================================================================
  // RESEND EMAIL CONFIGURATION
  // ==========================================================================
  
  email: {
    /**
     * =========================================
     * SENDER CONFIGURATION
     * =========================================
     */
    
    /**
     * Default "From" email address
     * Must be verified in Resend dashboard
     */
    fromEmail: "noreply@lessonsparkusa.com",
    
    /**
     * Default "From" name that appears in inbox
     */
    fromName: "LessonSpark USA",
    
    /**
     * Combined "From" field for Resend API
     * Format: "Name <email@domain.com>"
     */
    get from() {
      return `${this.fromName} <${this.fromEmail}>`;
    },
    
    /**
     * Reply-To email address
     * Where replies should go (usually support)
     */
    replyTo: "support@lessonsparkusa.com",
    
    /**
     * =========================================
     * EMAIL TEMPLATE STYLING
     * =========================================
     */
    
    styles: {
      /**
       * Email header background color
       */
      headerBackground: "#4F46E5",  // Match primary brand color
      
      /**
       * Email header text color
       */
      headerTextColor: "#FFFFFF",
      
      /**
       * Email body background color
       */
      bodyBackground: "#F9FAFB",
      
      /**
       * Email content area background
       */
      contentBackground: "#FFFFFF",
      
      /**
       * Primary text color in emails
       */
      textColor: "#111827",
      
      /**
       * Secondary/muted text color
       */
      mutedTextColor: "#6B7280",
      
      /**
       * Link color in emails
       */
      linkColor: "#4F46E5",
      
      /**
       * Primary button background
       */
      buttonBackground: "#4F46E5",
      
      /**
       * Primary button text color
       */
      buttonTextColor: "#FFFFFF",
      
      /**
       * Secondary button background
       */
      secondaryButtonBackground: "#E5E7EB",
      
      /**
       * Secondary button text color
       */
      secondaryButtonTextColor: "#374151",
      
      /**
       * Footer background color
       */
      footerBackground: "#F3F4F6",
      
      /**
       * Footer text color
       */
      footerTextColor: "#6B7280",
      
      /**
       * Border color for cards/sections
       */
      borderColor: "#E5E7EB",
      
      /**
       * Border radius for buttons/cards
       */
      borderRadius: "6px",
      
      /**
       * Font family for emails (use web-safe fonts)
       */
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    
    /**
     * =========================================
     * EMAIL LOGO & IMAGES
     * =========================================
     */
    
    images: {
      /**
       * Logo for email header
       * MUST be full URL (not relative path) for email clients
       * Recommended: PNG format, ~200px width, transparent background
       */
      headerLogo: "https://lessonsparkusa.com/assets/email-logo.png",
      
      /**
       * Logo width in pixels
       */
      headerLogoWidth: 180,
      
      /**
       * Logo height in pixels (maintain aspect ratio)
       */
      headerLogoHeight: 40,
      
      /**
       * Logo alt text
       */
      headerLogoAlt: "LessonSpark USA",
      
      /**
       * Icon for transactional emails (smaller logo)
       */
      iconLogo: "https://lessonsparkusa.com/assets/email-icon.png",
      
      /**
       * Social media icons (if used in footer)
       */
      socialIcons: {
        facebook: "https://lessonsparkusa.com/assets/email/icon-facebook.png",
        twitter: "https://lessonsparkusa.com/assets/email/icon-twitter.png",
        instagram: "https://lessonsparkusa.com/assets/email/icon-instagram.png",
      },
    },
    
    /**
     * =========================================
     * EMAIL SUBJECTS
     * =========================================
     * Use {placeholders} for dynamic content
     */
    
    subjects: {
      // Authentication emails
      welcome: "Welcome to LessonSpark USA! 🎉",
      emailVerification: "Verify your LessonSpark USA email address",
      passwordReset: "Reset your LessonSpark USA password",
      passwordChanged: "Your LessonSpark USA password has been changed",
      
      // Organization emails
      orgInvitation: "You've been invited to join {orgName} on LessonSpark USA",
      orgInvitationAccepted: "{userName} has joined {orgName}",
      orgRoleChanged: "Your role in {orgName} has been updated",
      orgRemoved: "You've been removed from {orgName}",
      
      // Lesson emails
      lessonShared: "{userName} shared a lesson with you",
      lessonComplete: "Your lesson is ready: {lessonTitle}",
      
      // Admin/System emails
      feedbackReceived: "New feedback received from {userName}",
      weeklyDigest: "Your LessonSpark USA weekly summary",
      systemNotice: "Important notice from LessonSpark USA",
      
      // Beta/Special
      betaInvitation: "You're invited to try LessonSpark USA Beta!",
      featureAnnouncement: "New feature: {featureName}",
    },
    
    /**
     * =========================================
     * EMAIL CONTENT / COPY
     * =========================================
     */
    
    content: {
      /**
       * Footer tagline (appears above address)
       */
      footerTagline: "Helping Baptist teachers create engaging Bible studies",
      
      /**
       * Unsubscribe text
       */
      unsubscribeText: "Unsubscribe from these emails",
      
      /**
       * Email preferences text
       */
      preferencesText: "Manage email preferences",
      
      /**
       * Legal disclaimer for footer
       */
      disclaimer: "This email was sent by LessonSpark USA. You received this email because you have an account with us or someone invited you to join.",
      
      /**
       * Support prompt
       */
      supportPrompt: "Questions? Contact us at",
      
      /**
       * Common greetings
       */
      greetings: {
        default: "Hello {firstName},",
        formal: "Dear {firstName},",
        friendly: "Hi {firstName}!",
        noName: "Hello,",
      },
      
      /**
       * Common sign-offs
       */
      signoffs: {
        default: "Blessings,",
        formal: "Sincerely,",
        friendly: "God bless,",
        team: "The LessonSpark USA Team",
      },
      
      /**
       * Button labels
       */
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
    
    /**
     * =========================================
     * EMAIL TEMPLATES - FULL CONTENT
     * =========================================
     * Complete email body content with {placeholders}
     */
    
    templates: {
      /**
       * Welcome email body
       */
      welcome: {
        heading: "Welcome to LessonSpark USA!",
        body: `Thank you for joining LessonSpark USA! We're excited to help you create engaging, theologically sound Bible study lessons for your Sunday School class.

With LessonSpark USA, you can:
• Generate customized lessons in minutes
• Tailor content to your specific teaching context
• Access lessons aligned with Baptist theology

Ready to create your first lesson?`,
        buttonText: "Create Your First Lesson",
        buttonUrl: "{baseUrl}/dashboard",
      },
      
      /**
       * Organization invitation email body
       */
      orgInvitation: {
        heading: "You've Been Invited!",
        body: `{inviterName} has invited you to join {orgName} on LessonSpark USA.

As a member of {orgName}, you'll be able to:
• Access shared lesson resources
• Collaborate with other teachers
• Use organization-wide settings and preferences

Click the button below to accept this invitation:`,
        buttonText: "Accept Invitation",
        buttonUrl: "{invitationUrl}",
        expirationNote: "This invitation will expire in {expirationDays} days.",
      },
      
      /**
       * Password reset email body
       */
      passwordReset: {
        heading: "Reset Your Password",
        body: `We received a request to reset your password for your LessonSpark USA account.

Click the button below to create a new password:`,
        buttonText: "Reset Password",
        buttonUrl: "{resetUrl}",
        expirationNote: "This link will expire in 1 hour.",
        securityNote: "If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.",
      },
      
      /**
       * Email verification body
       */
      emailVerification: {
        heading: "Verify Your Email Address",
        body: `Please verify your email address to complete your LessonSpark USA registration.

Click the button below to verify:`,
        buttonText: "Verify Email",
        buttonUrl: "{verificationUrl}",
        expirationNote: "This link will expire in 24 hours.",
      },
      
      /**
       * Lesson shared email body
       */
      lessonShared: {
        heading: "A Lesson Has Been Shared With You",
        body: `{sharerName} has shared a Bible study lesson with you on LessonSpark USA.

Lesson: {lessonTitle}
Scripture: {lessonScripture}

Click below to view the lesson:`,
        buttonText: "View Lesson",
        buttonUrl: "{lessonUrl}",
      },
    },
    
    /**
     * =========================================
     * RESEND-SPECIFIC SETTINGS
     * =========================================
     */
    
    resend: {
      /**
       * Tags to apply to all emails (for Resend analytics)
       */
      defaultTags: [
        { name: "app", value: "lessonspark" },
        { name: "environment", value: "production" },  // Change per environment
      ],
      
      /**
       * Webhook endpoint for Resend events (optional)
       */
      webhookEndpoint: "https://lessonsparkusa.com/api/webhooks/resend",
      
      /**
       * Enable email tracking
       */
      trackOpens: true,
      trackClicks: true,
    },
  },

  // ==========================================================================
  // UI TEXT / MICROCOPY
  // ==========================================================================
  
  text: {
    /**
     * Landing page hero headline
     */
    heroHeadline: "Create Engaging Bible Studies in Minutes",
    
    /**
     * Landing page hero subheadline
     */
    heroSubheadline: "AI-powered lesson generation for Baptist Sunday School teachers",
    
    /**
     * Primary call-to-action button text
     */
    ctaPrimary: "Get Started Free",
    
    /**
     * Secondary CTA text
     */
    ctaSecondary: "See How It Works",
    
    /**
     * Loading state messages
     */
    loading: {
      lessons: "Generating your lesson...",
      default: "Loading...",
    },
    
    /**
     * Empty state messages
     */
    empty: {
      lessons: "No lessons yet. Create your first lesson to get started!",
      organizations: "You haven't joined any organizations yet.",
    },
    
    /**
     * Success messages
     */
    success: {
      lessonCreated: "Your lesson has been created successfully!",
      lessonSaved: "Lesson saved.",
      profileUpdated: "Your profile has been updated.",
    },
  },

} as const;

// ============================================================================
// TYPE EXPORTS (for TypeScript support)
// ============================================================================

export type BrandingConfig = typeof BRANDING;
export type BrandingColors = typeof BRANDING.colors;
export type BrandingFeatures = typeof BRANDING.features;
export type EmailStyles = typeof BRANDING.email.styles;
export type EmailSubjects = typeof BRANDING.email.subjects;
export type EmailTemplates = typeof BRANDING.email.templates;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get full page title with app name
 * @param pageTitle - The specific page title
 * @returns Formatted title like "Dashboard | LessonSpark USA"
 */
export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return BRANDING.appName;
  return `${pageTitle} | ${BRANDING.appName}`;
}

/**
 * Get copyright notice with current year
 */
export function getCopyrightNotice(): string {
  return BRANDING.legal.copyrightNotice;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof BRANDING.features): boolean {
  const value = BRANDING.features[feature];
  return typeof value === 'boolean' ? value : Boolean(value);
}

/**
 * Get available languages (if multi-language is enabled)
 */
export function getAvailableLanguages() {
  if (!BRANDING.features.multiLanguage) {
    return [BRANDING.features.availableLanguages[0]];
  }
  return BRANDING.features.availableLanguages;
}

// ============================================================================
// EMAIL HELPER FUNCTIONS
// ============================================================================

/**
 * Get email subject with placeholders replaced
 * @param templateKey - Key from BRANDING.email.subjects
 * @param replacements - Object with placeholder values
 */
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

/**
 * Get formatted "From" field for Resend
 */
export function getEmailFrom(): string {
  return BRANDING.email.from;
}

/**
 * Get email template with placeholders replaced
 * @param templateKey - Key from BRANDING.email.templates
 * @param replacements - Object with placeholder values
 */
export function getEmailTemplate(
  templateKey: keyof typeof BRANDING.email.templates,
  replacements: Record<string, string> = {}
): typeof BRANDING.email.templates[typeof templateKey] {
  const template = { ...BRANDING.email.templates[templateKey] };
  
  // Replace placeholders in all string properties
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

/**
 * Get greeting with user's name
 */
export function getEmailGreeting(
  firstName?: string,
  style: keyof typeof BRANDING.email.content.greetings = 'default'
): string {
  if (!firstName) {
    return BRANDING.email.content.greetings.noName;
  }
  return BRANDING.email.content.greetings[style].replace('{firstName}', firstName);
}

/**
 * Get email sign-off
 */
export function getEmailSignoff(
  style: keyof typeof BRANDING.email.content.signoffs = 'default'
): string {
  return BRANDING.email.content.signoffs[style];
}

/**
 * Generate Resend email options with branding defaults
 */
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

// ============================================================================
// CSS VARIABLES GENERATOR (for dynamic theming)
// ============================================================================

/**
 * Generate CSS custom properties from branding colors
 * Use in your root CSS or inject via JavaScript
 */
export function generateCSSVariables(): string {
  return `
:root {
  /* Primary Colors */
  --color-primary: ${BRANDING.colors.primary.DEFAULT};
  --color-primary-light: ${BRANDING.colors.primary.light};
  --color-primary-dark: ${BRANDING.colors.primary.dark};
  
  /* Secondary Colors */
  --color-secondary: ${BRANDING.colors.secondary.DEFAULT};
  --color-secondary-light: ${BRANDING.colors.secondary.light};
  --color-secondary-dark: ${BRANDING.colors.secondary.dark};
  
  /* Accent Colors */
  --color-accent: ${BRANDING.colors.accent.DEFAULT};
  --color-accent-light: ${BRANDING.colors.accent.light};
  --color-accent-dark: ${BRANDING.colors.accent.dark};
  
  /* Semantic Colors */
  --color-success: ${BRANDING.colors.success};
  --color-warning: ${BRANDING.colors.warning};
  --color-error: ${BRANDING.colors.error};
  --color-info: ${BRANDING.colors.info};
  
  /* Background Colors */
  --color-bg-primary: ${BRANDING.colors.background.primary};
  --color-bg-secondary: ${BRANDING.colors.background.secondary};
  --color-bg-dark: ${BRANDING.colors.background.dark};
  
  /* Text Colors */
  --color-text-primary: ${BRANDING.colors.text.primary};
  --color-text-secondary: ${BRANDING.colors.text.secondary};
  --color-text-light: ${BRANDING.colors.text.light};
  --color-text-inverse: ${BRANDING.colors.text.inverse};
  
  /* Typography */
  --font-primary: ${BRANDING.typography.fontFamily.primary};
  --font-secondary: ${BRANDING.typography.fontFamily.secondary};
}
  `.trim();
}

/**
 * Generate inline CSS for email templates
 * (Email clients often strip <style> tags, so inline styles are needed)
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
