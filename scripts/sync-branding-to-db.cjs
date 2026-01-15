/**
 * Sync Branding to Database
 * =========================
 * 
 * SSOT Architecture: Frontend drives backend
 * 
 * Source: src/config/brand-values.json (colors/typography)
 *         + hardcoded BibleLessonSpark branding values below
 * Target: Supabase branding_config table
 * 
 * Usage: npm run sync-branding
 * 
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// =============================================================================
// CONSOLE COLORS
// =============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), colors.blue);
  log(`  ${title}`, colors.bright + colors.blue);
  log('='.repeat(60), colors.blue);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

// =============================================================================
// SSOT: BRANDING CONFIGURATION
// =============================================================================
// These values are the SINGLE SOURCE OF TRUTH for BibleLessonSpark branding.
// Edit here, then run: npm run sync-branding
// =============================================================================

const BRANDING_SSOT = {
  // Core Identity
  appName: "BibleLessonSpark",
  appNameShort: "BibleLessonSpark",
  tagline: "Personalized Bible Study Lessons for Baptist Teachers",
  description: "Personalized Bible study lesson generator for Baptist Sunday School teachers. Create customized, theologically sound lessons in minutes.",
  
  // Keywords
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

  // URLs - All biblelessonspark.com
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

  // Contact Information
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
  },

  // Logos
  logo: {
    primary: "/assets/logo-primary.svg",
    light: "/assets/logo-light.svg",
    icon: "/assets/logo-icon.svg",
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    ogImage: "/assets/og-image.png",
    altText: "BibleLessonSpark Logo - Golden flame rising from open Bible",
  },

  // Legal
  legal: {
    copyrightYear: "2024",
    copyrightHolder: "BibleLessonSpark",
    legalEntityName: "BibleLessonSpark",
    jurisdiction: "Texas, United States",
  },

  // Theological Identity
  theological: {
    denomination: "Baptist",
    tradition: "Southern Baptist",
    defaultBibleTranslation: "KJV",
    theologicalTagline: "Rooted in Baptist Heritage, Relevant for Today",
    theologicalStatement: "BibleLessonSpark creates Bible study content aligned with historic Baptist theology and the Baptist Faith & Message.",
  },

  // Features
  features: {
    allowPublicSignup: true,
    showPoweredBy: false,
    showFeedbackButton: true,
    organizationsEnabled: true,
    betaFeaturesEnabled: false,
    multiLanguage: true,
    defaultLanguage: "en",
    availableLanguages: [
      { code: "en", name: "English", flag: "🇺🇸" },
      { code: "es", name: "Español", flag: "🇲🇽" },
      { code: "fr", name: "Français", flag: "🇫🇷" },
    ],
  },

  // Social Media (null if not set up)
  social: {
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    linkedin: null,
  },

  // UI Text
  text: {
    heroHeadline: "Create Engaging Bible Studies in Minutes",
    heroSubheadline: "AI-powered lesson generation for Baptist Sunday School teachers",
    ctaPrimary: "Get Started Free",
    ctaSecondary: "See How It Works",
    loading: {
      default: "Loading...",
      lessons: "Generating your lesson...",
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
};

// =============================================================================
// EMAIL CONFIGURATION (SSOT)
// =============================================================================

const EMAIL_SSOT = {
  fromEmail: "noreply@biblelessonspark.com",
  fromName: "BibleLessonSpark",
  replyTo: "support@biblelessonspark.com",

  subjects: {
    welcome: "Welcome to BibleLessonSpark! 🎉",
    emailVerification: "Verify your BibleLessonSpark email address",
    signup: "Welcome to BibleLessonSpark - Confirm Your Email",
    magiclink: "Your BibleLessonSpark Login Link",
    passwordReset: "Reset your BibleLessonSpark password",
    recovery: "Reset Your BibleLessonSpark Password",
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
    footerTagline: "Helping Baptist teachers create engaging Bible studies",
    unsubscribeText: "Unsubscribe from these emails",
    preferencesText: "Manage email preferences",
    disclaimer: "This email was sent by BibleLessonSpark. You received this email because you have an account with us or someone invited you to join.",
    supportPrompt: "Questions? Contact us at",
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

  resend: {
    defaultTags: [
      { name: "app", value: "biblelessonspark" },
      { name: "environment", value: "production" },
    ],
    trackOpens: true,
    trackClicks: true,
    webhookEndpoint: "https://biblelessonspark.com/api/webhooks/resend",
  },
};

// =============================================================================
// MAIN FUNCTION
// =============================================================================

async function main() {
  logSection('Sync Branding to Database (SSOT)');
  log('\nSource: src/config/brand-values.json + sync-branding-to-db.cjs');
  log('Target: Supabase branding_config table\n');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('Missing environment variables!');
    log('Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
    log('Make sure .env file exists and contains these values.');
    process.exit(1);
  }

  logSuccess('Environment variables loaded');

  // Read brand-values.json
  const brandValuesPath = path.join(process.cwd(), 'src', 'config', 'brand-values.json');
  
  if (!fs.existsSync(brandValuesPath)) {
    logError(`brand-values.json not found at: ${brandValuesPath}`);
    process.exit(1);
  }

  const brandValues = JSON.parse(fs.readFileSync(brandValuesPath, 'utf8'));
  logSuccess('Read brand-values.json');

  // Build complete config object
  const config = {
    ...BRANDING_SSOT,
    
    // Colors from brand-values.json
    colors: {
      primary: {
        DEFAULT: brandValues.colors.primary.DEFAULT,
        light: brandValues.colors.primary.light,
        dark: brandValues.colors.primary.dark,
      },
      secondary: {
        DEFAULT: brandValues.colors.secondary.DEFAULT,
        light: brandValues.colors.secondary.light,
        dark: brandValues.colors.secondary.dark,
      },
      accent: {
        DEFAULT: brandValues.colors.accent.DEFAULT,
        light: "#DBBF6E",
        dark: "#A88B3D",
      },
      background: {
        primary: brandValues.colors.background.primary,
        secondary: brandValues.colors.background.secondary,
        dark: brandValues.colors.background.dark,
      },
      text: {
        primary: brandValues.colors.text.primary,
        secondary: brandValues.colors.text.secondary,
        light: brandValues.colors.text.light,
        inverse: "#FFFFFF",
      },
      success: brandValues.colors.status.success,
      warning: brandValues.colors.status.warning,
      error: brandValues.colors.destructive.DEFAULT,
      info: brandValues.colors.status.info,
    },

    // Typography from brand-values.json
    typography: {
      fontFamily: {
        primary: brandValues.typography.fontFamily.primary,
        secondary: brandValues.typography.fontFamily.secondary,
      },
      googleFontsUrl: brandValues.typography.googleFontsUrl,
    },

    // Email configuration
    email: {
      ...EMAIL_SSOT,
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
    },
  };

  logSuccess('Built complete branding config');

  // Connect to Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);
  logSuccess('Connected to Supabase');

  // Check for existing global branding config
  const { data: existing, error: fetchError } = await supabase
    .from('branding_config')
    .select('id')
    .is('organization_id', null)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    logError(`Failed to check existing config: ${fetchError.message}`);
    process.exit(1);
  }

  // Update or insert
  if (existing) {
    log(`\nUpdating existing config (id: ${existing.id})...`);
    
    const { error: updateError } = await supabase
      .from('branding_config')
      .update({ 
        config: config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      logError(`Failed to update branding config: ${updateError.message}`);
      process.exit(1);
    }
    
    logSuccess('Updated branding_config table');
  } else {
    log('\nNo existing global config found. Creating new one...');
    
    const { error: insertError } = await supabase
      .from('branding_config')
      .insert({
        organization_id: null,
        is_active: true,
        config: config,
      });

    if (insertError) {
      logError(`Failed to insert branding config: ${insertError.message}`);
      process.exit(1);
    }
    
    logSuccess('Inserted new branding_config record');
  }

  // Verify
  const { data: verify, error: verifyError } = await supabase
    .rpc('get_branding_config', { p_organization_id: null });

  if (verifyError) {
    logWarning(`Could not verify: ${verifyError.message}`);
  } else {
    logSection('Verification');
    log(`appName: ${verify.appName}`);
    log(`email.fromName: ${verify.email?.fromName}`);
    log(`email.fromEmail: ${verify.email?.fromEmail}`);
    log(`urls.baseUrl: ${verify.urls?.baseUrl}`);
  }

  logSection('Summary');
  logSuccess('Branding synced to database successfully!');
  log('\nNext steps:');
  log('1. Test by sending an invite from Organization Manager');
  log('2. Verify email shows "BibleLessonSpark" branding\n');
}

main().catch((err) => {
  logError(`Unexpected error: ${err.message}`);
  process.exit(1);
});
