/**
 * BibleLessonSpark Branding Configuration
 * ========================================
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
 * 
 * REBRAND: January 2026 - LessonSparkUSA → BibleLessonSpark
 * Color palette derived from logo: forest green book, golden flame, cream background
 */

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
    /**
     * Primary domain (without protocol)
     */
    domain: "biblelessonspark.com",

    /**
     * Full base URL (with protocol)
     */
    baseUrl: "https://biblelessonspark.com",

    /**
     * Support/help page URL
     */
    support: "https://biblelessonspark.com/support",

    /**
     * Terms of Service URL
     */
    termsOfService: "https://biblelessonspark.com/terms",

    /**
     * Privacy Policy URL
     */
    privacyPolicy: "https://biblelessonspark.com/privacy",

    /**
     * Documentation/Help URL (if separate)
     */
    documentation: "https://biblelessonspark.com/help",

    /**
     * Unsubscribe URL template (for email compliance)
     * {token} will be replaced with user-specific unsubscribe token
     */
    unsubscribe: "https://biblelessonspark.com/unsubscribe?token={token}",

    /**
     * Email preferences URL
     */
    emailPreferences: "https://biblelessonspark.com/settings/notifications",
  },

  // ==========================================================================
  // CONTACT INFORMATION
  // ==========================================================================

  contact: {
    /**
     * Primary support email
     */
    supportEmail: "support@biblelessonspark.com",

    /**
     * General inquiries email
     */
    infoEmail: "info@biblelessonspark.com",

    /**
     * No-reply email for automated messages
     */
    noReplyEmail: "noreply@biblelessonspark.com",

    /**
     * Display name for email sender
     */
    emailSenderName: "BibleLessonSpark",

    /**
     * Phone number (optional - set to null if not used)
     */
    phone: null,

    /**
     * Physical address (REQUIRED for CAN-SPAM compliance in emails)
     * Even a PO Box is acceptable
     */
    address: {
      line1: "BibleLessonSpark",
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
    primary: "/assets/logo-primary.png",

    /**
     * Logo for dark backgrounds
     */
    light: "/assets/logo-light.png",

    /**
     * Small logo/icon for compact spaces (navbar, mobile)
     * Recommended: Square format, ~40px
     */
    icon: "/assets/logo-icon.png",

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
    altText: "BibleLessonSpark Logo - Golden flame rising from open Bible",
  },

  // ==========================================================================
  // VISUAL IDENTITY - COLORS
  // ==========================================================================
  // Derived from logo: Forest green book, golden flame, warm cream background

  colors: {
    /**
     * Primary brand color - Forest Green (from Bible/book in logo)
     * Used for: buttons, links, primary actions, headers
     */
    primary: {
      DEFAULT: "#3D5C3D",  // Forest green - main
      light: "#4A7A4A",    // Lighter forest green
      dark: "#2D4A2D",     // Darker forest green
    },

    /**
     * Secondary brand color - Antique Gold (from flame in logo)
     * Used for: secondary buttons, accents, highlights
     */
    secondary: {
      DEFAULT: "#D4A74B",  // Antique gold - main
      light: "#E4BE6A",    // Lighter gold
      dark: "#B8923E",     // Deeper gold
    },

    /**
     * Accent color - Deep Gold (from ring around logo)
     * Used for: highlights, notifications, badges, hover states
     */
    accent: {
      DEFAULT: "#C9A754",  // Deep gold
      light: "#DBBF6E",    // Light gold
      dark: "#A88B3D",     // Dark gold
    },

    /**
     * Tertiary color - Burgundy (Baptist heritage, reverence, importance)
     * Used for: errors, warnings, important badges, heritage elements
     * Strategic use: communion themes, sacrifice/redemption tags, footer accents
     */
    burgundy: {
      DEFAULT: "#661A33",  // Deep burgundy - primary accent (hsl 345, 60%, 25%)
      light: "#995266",    // Muted burgundy - softer accents (hsl 345, 40%, 40%)
      dark: "#4D1426",     // Darker burgundy - pressed states
      hover: "#8C3352",    // Wine - hover states (hsl 345, 55%, 35%)
    },

    /**
     * Success color (confirmations, completions)
     */
    success: "#3D5C3D",    // Using primary green for success

    /**
     * Warning color (cautions, alerts)
     */
    warning: "#D4A74B",    // Using secondary gold for warnings

    /**
     * Error/Danger color - Using burgundy for Baptist heritage feel
     */
    error: "#661A33",      // Deep burgundy (replaces harsh red)

    /**
     * Info color
     */
    info: "#4A7A4A",       // Light green for info

    /**
     * Background colors
     */
    background: {
      primary: "#FFFEF9",    // Warm cream (from logo background)
      secondary: "#FAF8F3",  // Slightly darker cream
      dark: "#2D4A2D",       // Dark forest green
    },

    /**
     * Text colors
     */
    text: {
      primary: "#2D2D2D",    // Dark charcoal
      secondary: "#5C5C5C",  // Medium gray
      light: "#8A8A8A",      // Light gray
      inverse: "#FFFEF9",    // Cream for dark backgrounds
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
    legalPageWrapper: "min-h-screen bg-gradient-to-br from-green-50 to-amber-50 py-12 px-4",

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
    copyrightHolder: "BibleLessonSpark",

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
    legalEntityName: "BibleLessonSpark",

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
     * Show "Powered by BibleLessonSpark" badge in footer
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
  // HELP VIDEOS (Explainer/Onboarding Videos)
  // ==========================================================================

  /**
   * Help video configuration for user onboarding.
   * White-label tenants can customize video URLs and content.
   *
   * USAGE:
   *   - Set enabled: true when videos are ready
   *   - Replace URLs with your Vimeo/YouTube embed links
   *   - Each tenant can have their own voice/branding in videos
   */
  helpVideos: {
    /**
     * Master switch - set to true when videos are ready
     * When false, all help video UI is hidden
     */
    enabled: false,

    /**
     * Show first-time user banner above lesson creation form
     */
    showBanner: true,

    /**
     * Show floating help button on Enhance Lesson tab
     */
    showFloatingButton: true,

    /**
     * Auto-play video on first visit (if enabled and video exists)
     */
    autoPlayOnFirstVisit: false,

    /**
     * Video definitions - add more as needed
     */
    videos: {
      /**
       * Create Your First Lesson - primary onboarding video
       */
      createLesson: {
        id: 'create_first_lesson',
        title: 'Create Your First Lesson',
        description: 'Learn how to generate a customized Bible study lesson in under 2 minutes.',
        url: '', // Vimeo embed URL: https://player.vimeo.com/video/XXXXXXX
        durationSeconds: 60,
        storageKey: 'bls_help_create_first_lesson_seen',
      },

      /**
       * Understanding Your Lesson Output
       */
      understandingOutput: {
        id: 'understanding_output',
        title: 'Understanding Your Lesson',
        description: 'See how to navigate and use your generated lesson sections.',
        url: '', // Vimeo embed URL
        durationSeconds: 45,
        storageKey: 'bls_help_understanding_output_seen',
      },

      /**
       * Credits & Subscription
       */
      creditsAndUsage: {
        id: 'credits_usage',
        title: 'Credits & Subscription',
        description: 'Understand your lesson credits and subscription options.',
        url: '', // Vimeo embed URL
        durationSeconds: 30,
        storageKey: 'bls_help_credits_usage_seen',
      },

      /**
       * Export & Share Your Lesson
       */
      exportLesson: {
        id: 'export_lesson',
        title: 'Export & Share Your Lesson',
        description: 'Download your lesson as PDF or Word document.',
        url: '', // Vimeo embed URL
        durationSeconds: 30,
        storageKey: 'bls_help_export_lesson_seen',
      },

      /**
       * Step 1: Choose Your Scripture
       * Accordion workspace video for scripture input
       */
      step1: {
        id: 'step1_scripture',
        title: 'Step 1: Choose Your Scripture',
        description: 'Learn how to enter Bible passages or paste curriculum content.',
        url: '', // Vimeo embed URL - populate when video is ready
        durationSeconds: 45,
        storageKey: 'bls_help_step1_seen',
      },

      /**
       * Step 2: Set Teaching Context
       * Accordion workspace video for age group, theology, Bible version
       */
      step2: {
        id: 'step2_context',
        title: 'Step 2: Set Your Teaching Context',
        description: 'Configure age group, theology profile, and Bible version.',
        url: '', // Vimeo embed URL - populate when video is ready
        durationSeconds: 60,
        storageKey: 'bls_help_step2_seen',
      },

      /**
       * Step 3: Personalize Your Lesson
       * Accordion workspace video for teacher customization options
       */
      step3: {
        id: 'step3_personalize',
        title: 'Step 3: Personalize Your Lesson',
        description: 'Save teacher profiles and customize lesson generation settings.',
        url: '', // Vimeo embed URL - populate when video is ready
        durationSeconds: 90,
        storageKey: 'bls_help_step3_seen',
      },
    },

    /**
     * Banner styling (can be customized per tenant)
     * Using BibleLessonSpark color palette
     */
    bannerStyles: {
      backgroundColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconBackgroundColor: 'bg-amber-100',
      iconColor: 'text-amber-700',
      titleColor: 'text-green-900',
      subtitleColor: 'text-green-700',
      buttonBackgroundColor: 'bg-green-700',
      buttonHoverColor: 'hover:bg-green-800',
    },

    /**
     * Floating button styling
     */
    floatingButtonStyles: {
      backgroundColor: 'bg-green-700',
      hoverColor: 'hover:bg-green-800',
      textColor: 'text-white',
    },
  },

  // ==========================================================================
  // THEOLOGICAL IDENTITY (specific to BibleLessonSpark)
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
    theologicalStatement: "BibleLessonSpark creates Bible study content aligned with historic Baptist theology and the Baptist Faith & Message.",
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
    fromEmail: "noreply@biblelessonspark.com",

    /**
     * Default "From" name that appears in inbox
     */
    fromName: "BibleLessonSpark",

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
    replyTo: "support@biblelessonspark.com",

    /**
     * =========================================
     * EMAIL TEMPLATE STYLING
     * =========================================
     */

    styles: {
      /**
       * Email header background color - Forest Green
       */
      headerBackground: "#3D5C3D",

      /**
       * Email header text color
       */
      headerTextColor: "#FFFFFF",

      /**
       * Email body background color - Warm cream
       */
      bodyBackground: "#FAF8F3",

      /**
       * Email content area background
       */
      contentBackground: "#FFFFFF",

      /**
       * Primary text color in emails
       */
      textColor: "#2D2D2D",

      /**
       * Secondary/muted text color
       */
      mutedTextColor: "#5C5C5C",

      /**
       * Link color in emails - Forest green
       */
      linkColor: "#3D5C3D",

      /**
       * Primary button background - Forest green
       */
      buttonBackground: "#3D5C3D",

      /**
       * Primary button text color
       */
      buttonTextColor: "#FFFFFF",

      /**
       * Secondary button background - Antique gold
       */
      secondaryButtonBackground: "#D4A74B",

      /**
       * Secondary button text color
       */
      secondaryButtonTextColor: "#2D2D2D",

      /**
       * Footer background color
       */
      footerBackground: "#FAF8F3",

      /**
       * Footer text color
       */
      footerTextColor: "#5C5C5C",

      /**
       * Border color for cards/sections
       */
      borderColor: "#E5E2D9",

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
      headerLogo: "https://biblelessonspark.com/assets/email-logo.png",

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
      headerLogoAlt: "BibleLessonSpark",

      /**
       * Icon for transactional emails (smaller logo)
       */
      iconLogo: "https://biblelessonspark.com/assets/email-icon.png",

      /**
       * Social media icons (if used in footer)
       */
      socialIcons: {
        facebook: "https://biblelessonspark.com/assets/email/icon-facebook.png",
        twitter: "https://biblelessonspark.com/assets/email/icon-twitter.png",
        instagram: "https://biblelessonspark.com/assets/email/icon-instagram.png",
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
      welcome: "Welcome to BibleLessonSpark! 🎉",
      emailVerification: "Verify your BibleLessonSpark email address",
      passwordReset: "Reset your BibleLessonSpark password",
      passwordChanged: "Your BibleLessonSpark password has been changed",

      // Organization emails
      orgInvitation: "You've been invited to join {orgName} on BibleLessonSpark",
      orgInvitationAccepted: "{userName} has joined {orgName}",
      orgRoleChanged: "Your role in {orgName} has been updated",
      orgRemoved: "You've been removed from {orgName}",

      // Lesson emails
      lessonShared: "{userName} shared a lesson with you",
      lessonComplete: "Your lesson is ready: {lessonTitle}",

      // Admin/System emails
      feedbackReceived: "New feedback received from {userName}",
      weeklyDigest: "Your BibleLessonSpark weekly summary",
      systemNotice: "Important notice from BibleLessonSpark",

      // Beta/Special
      betaInvitation: "You're invited to try BibleLessonSpark!",
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
      disclaimer: "This email was sent by BibleLessonSpark. You received this email because you have an account with us or someone invited you to join.",

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
        team: "The BibleLessonSpark Team",
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

      /**
       * Organization invitation email body
       */
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

      /**
       * Password reset email body
       */
      passwordReset: {
        heading: "Reset Your Password",
        body: `We received a request to reset your password for your BibleLessonSpark account.

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
        body: `Please verify your email address to complete your BibleLessonSpark registration.

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
        body: `{sharerName} has shared a Bible study lesson with you on BibleLessonSpark.

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
        { name: "app", value: "biblelessonspark" },
        { name: "environment", value: "production" },  // Change per environment
      ],

      /**
       * Webhook endpoint for Resend events (optional)
       */
      webhookEndpoint: "https://biblelessonspark.com/api/webhooks/resend",

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
    heroSubheadline: "Personalized lesson generation for Baptist Sunday School teachers",

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

  // ==========================================================================
  // BETA PROGRAM UI TEXT (for white-label customization)
  // ==========================================================================

  /**
   * Beta program display text.
   * Controls what the UI SAYS about beta features.
   *
   * ARCHITECTURAL NOTE:
   * - TEXT lives here in BRANDING.beta (what UI displays)
   * - BEHAVIOR lives in betaEnrollmentConfig.ts (toggles, logic, form options)
   *
   * White-label tenants edit THIS section to customize beta messaging.
   */
  beta: {
    /**
     * Landing page beta CTA section text
     */
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

    /**
     * Beta enrollment form labels and placeholders
     */
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

    /**
     * Dashboard prompt for users without an organization
     */
    dashboardPrompt: {
      title: 'Complete Your Registration',
      description: 'Complete your registration to access all features.',
      button: 'Join Now',
      dismissButton: 'Maybe Later',
    },

    /**
     * Success, error, and status messages
     */
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

    /**
     * Form validation messages
     */
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
// TYPE EXPORTS (for TypeScript support)
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

/**
 * Get full page title with app name
 * @param pageTitle - The specific page title
 * @returns Formatted title like "Dashboard | BibleLessonSpark"
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
  /* Primary Colors - Forest Green */
  --color-primary: ${BRANDING.colors.primary.DEFAULT};
  --color-primary-light: ${BRANDING.colors.primary.light};
  --color-primary-dark: ${BRANDING.colors.primary.dark};

  /* Secondary Colors - Antique Gold */
  --color-secondary: ${BRANDING.colors.secondary.DEFAULT};
  --color-secondary-light: ${BRANDING.colors.secondary.light};
  --color-secondary-dark: ${BRANDING.colors.secondary.dark};

  /* Accent Colors - Deep Gold */
  --color-accent: ${BRANDING.colors.accent.DEFAULT};
  --color-accent-light: ${BRANDING.colors.accent.light};
  --color-accent-dark: ${BRANDING.colors.accent.dark};

  /* Tertiary Colors - Burgundy (Baptist Heritage) */
  --color-burgundy: ${BRANDING.colors.burgundy.DEFAULT};
  --color-burgundy-light: ${BRANDING.colors.burgundy.light};
  --color-burgundy-dark: ${BRANDING.colors.burgundy.dark};
  --color-burgundy-hover: ${BRANDING.colors.burgundy.hover};

  /* Semantic Colors */
  --color-success: ${BRANDING.colors.success};
  --color-warning: ${BRANDING.colors.warning};
  --color-error: ${BRANDING.colors.error};
  --color-info: ${BRANDING.colors.info};

  /* Background Colors - Warm Cream */
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
