/**
 * useBranding Hook
 * =================
 * 
 * Fetches and caches branding configuration from the database.
 * Provides fallback values for resilience during loading/errors.
 * 
 * Location: src/hooks/useBranding.ts
 * 
 * USAGE:
 *   const { branding, isLoading, error } = useBranding();
 *   <h1>{branding.appName}</h1>
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrandingConfig } from '@/types/branding';

// ============================================================================
// FALLBACK BRANDING (used during loading or if database fetch fails)
// ============================================================================
// This ensures the app never breaks, even if branding can't be loaded

const FALLBACK_BRANDING: BrandingConfig = {
  appName: "LessonSpark USA",
  appNameShort: "LessonSparkUSA",
  tagline: "Baptist Bible Study Enhancement Platform",
  description: "Personalized Bible study lesson generator for Baptist Sunday School teachers.",
  keywords: ["Baptist", "Bible study", "Sunday School"],
  
  urls: {
    domain: "lessonsparkusa.com",
    baseUrl: "https://lessonsparkusa.com",
    support: "https://lessonsparkusa.com/support",
    termsOfService: "https://lessonsparkusa.com/terms",
    privacyPolicy: "https://lessonsparkusa.com/privacy",
    documentation: "https://lessonsparkusa.com/help",
    unsubscribe: "https://lessonsparkusa.com/unsubscribe?token={token}",
    emailPreferences: "https://lessonsparkusa.com/settings/notifications",
  },
  
  contact: {
    supportEmail: "support@lessonsparkusa.com",
    infoEmail: "info@lessonsparkusa.com",
    noReplyEmail: "noreply@lessonsparkusa.com",
    emailSenderName: "LessonSpark USA",
    phone: null,
    address: {
      line1: "LessonSpark USA",
      line2: null,
      city: "Nacogdoches",
      state: "TX",
      zip: "75965",
      country: "USA",
    },
  },
  
  logo: {
    primary: "/assets/logo-primary.svg",
    light: "/assets/logo-light.svg",
    icon: "/assets/logo-icon.svg",
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    ogImage: "/assets/og-image.png",
    altText: "LessonSpark USA Logo",
  },
  
  colors: {
    primary: { DEFAULT: "#4F46E5", light: "#818CF8", dark: "#3730A3" },
    secondary: { DEFAULT: "#10B981", light: "#34D399", dark: "#059669" },
    accent: { DEFAULT: "#F59E0B", light: "#FBBF24", dark: "#D97706" },
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    background: { primary: "#FFFFFF", secondary: "#F9FAFB", dark: "#111827" },
    text: { primary: "#111827", secondary: "#6B7280", light: "#9CA3AF", inverse: "#FFFFFF" },
  },
  
  typography: {
    fontFamily: {
      primary: '"Inter", system-ui, sans-serif',
      secondary: '"Merriweather", Georgia, serif',
    },
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap",
  },
  
  legal: {
    copyrightHolder: "LessonSpark USA",
    copyrightYear: "2024",
    legalEntityName: "LessonSpark USA",
    jurisdiction: "Texas, United States",
  },
  
  social: {
    facebook: null,
    twitter: null,
    instagram: null,
    youtube: null,
    linkedin: null,
  },
  
  features: {
    showPoweredBy: false,
    allowPublicSignup: true,
    multiLanguage: true,
    availableLanguages: [
      { code: "en", name: "English", flag: "US" },
      { code: "es", name: "Español", flag: "MX" },
      { code: "fr", name: "Français", flag: "FR" },
    ],
    defaultLanguage: "en",
    organizationsEnabled: true,
    betaFeaturesEnabled: false,
    showFeedbackButton: true,
  },
  
  theological: {
    denomination: "Baptist",
    tradition: "Southern Baptist",
    defaultBibleTranslation: "KJV",
    theologicalTagline: "Rooted in Baptist Heritage, Relevant for Today",
    theologicalStatement: "LessonSpark USA creates Bible study content aligned with historic Baptist theology and the Baptist Faith & Message.",
  },
  
  email: {
    fromEmail: "noreply@lessonsparkusa.com",
    fromName: "LessonSpark USA",
    replyTo: "support@lessonsparkusa.com",
    styles: {
      headerBackground: "#4F46E5",
      headerTextColor: "#FFFFFF",
      bodyBackground: "#F9FAFB",
      contentBackground: "#FFFFFF",
      textColor: "#111827",
      mutedTextColor: "#6B7280",
      linkColor: "#4F46E5",
      buttonBackground: "#4F46E5",
      buttonTextColor: "#FFFFFF",
      secondaryButtonBackground: "#E5E7EB",
      secondaryButtonTextColor: "#374151",
      footerBackground: "#F3F4F6",
      footerTextColor: "#6B7280",
      borderColor: "#E5E7EB",
      borderRadius: "6px",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    images: {
      headerLogo: "https://lessonsparkusa.com/assets/email-logo.png",
      headerLogoWidth: 180,
      headerLogoHeight: 40,
      headerLogoAlt: "LessonSpark USA",
      iconLogo: "https://lessonsparkusa.com/assets/email-icon.png",
      socialIcons: {
        facebook: "https://lessonsparkusa.com/assets/email/icon-facebook.png",
        twitter: "https://lessonsparkusa.com/assets/email/icon-twitter.png",
        instagram: "https://lessonsparkusa.com/assets/email/icon-instagram.png",
      },
    },
    subjects: {
      welcome: "Welcome to LessonSpark USA!",
      emailVerification: "Verify your LessonSpark USA email address",
      signup: "Welcome to LessonSpark USA - Confirm Your Email",
      magiclink: "Your LessonSpark USA Login Link",
      passwordReset: "Reset your LessonSpark USA password",
      recovery: "Reset Your LessonSpark USA Password",
      passwordChanged: "Your LessonSpark USA password has been changed",
      orgInvitation: "You've been invited to join {orgName} on LessonSpark USA",
      orgInvitationAccepted: "{userName} has joined {orgName}",
      orgRoleChanged: "Your role in {orgName} has been updated",
      orgRemoved: "You've been removed from {orgName}",
      lessonShared: "{userName} shared a lesson with you",
      lessonComplete: "Your lesson is ready: {lessonTitle}",
      feedbackReceived: "New feedback received from {userName}",
      weeklyDigest: "Your LessonSpark USA weekly summary",
      systemNotice: "Important notice from LessonSpark USA",
      betaInvitation: "You're invited to try LessonSpark USA Beta!",
      featureAnnouncement: "New feature: {featureName}",
    },
    content: {
      footerTagline: "Helping Baptist teachers create engaging Bible studies",
      unsubscribeText: "Unsubscribe from these emails",
      preferencesText: "Manage email preferences",
      disclaimer: "This email was sent by LessonSpark USA. You received this email because you have an account with us or someone invited you to join.",
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
        team: "The LessonSpark USA Team",
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
        heading: "Welcome to LessonSpark USA!",
        body: "Thank you for joining LessonSpark USA!",
        buttonText: "Create Your First Lesson",
        buttonUrl: "{baseUrl}/dashboard",
      },
      orgInvitation: {
        heading: "You've Been Invited!",
        body: "{inviterName} has invited you to join {orgName}.",
        buttonText: "Accept Invitation",
        buttonUrl: "{invitationUrl}",
        expirationNote: "This invitation will expire in {expirationDays} days.",
      },
      passwordReset: {
        heading: "Reset Your Password",
        body: "Click the button below to reset your password.",
        buttonText: "Reset Password",
        buttonUrl: "{resetUrl}",
        expirationNote: "This link will expire in 1 hour.",
        securityNote: "If you didn't request this, ignore this email.",
      },
      emailVerification: {
        heading: "Verify Your Email Address",
        body: "Please verify your email to complete registration.",
        buttonText: "Verify Email",
        buttonUrl: "{verificationUrl}",
        expirationNote: "This link will expire in 24 hours.",
      },
      lessonShared: {
        heading: "A Lesson Has Been Shared With You",
        body: "{sharerName} shared a lesson with you.",
        buttonText: "View Lesson",
        buttonUrl: "{lessonUrl}",
      },
    },
    resend: {
      defaultTags: [
        { name: "app", value: "lessonspark" },
        { name: "environment", value: "production" },
      ],
      webhookEndpoint: "https://lessonsparkusa.com/api/webhooks/resend",
      trackOpens: true,
      trackClicks: true,
    },
  },
  
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
};

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_KEY = 'lessonspark_branding';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CachedBranding {
  data: BrandingConfig;
  timestamp: number;
}

function getCachedBranding(): BrandingConfig | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed: CachedBranding = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - parsed.timestamp < CACHE_DURATION_MS) {
      return parsed.data;
    }
    
    // Cache expired
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedBranding(data: BrandingConfig): void {
  try {
    const cached: CachedBranding = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded)
  }
}

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

export interface UseBrandingResult {
  /** The branding configuration (never null - uses fallback if needed) */
  branding: BrandingConfig;
  /** True while fetching from database */
  isLoading: boolean;
  /** Error message if fetch failed (branding will still have fallback values) */
  error: string | null;
  /** True if using cached or fallback data (not fresh from database) */
  isStale: boolean;
  /** Force refresh from database */
  refresh: () => Promise<void>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useBranding(organizationId?: string | null): UseBrandingResult {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    // Try to get from cache on initial render
    return getCachedBranding() || FALLBACK_BRANDING;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(true);

  const fetchBranding = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the database function
      const { data, error: rpcError } = await supabase.rpc('get_branding_config', {
        p_organization_id: organizationId || null,
      });
      
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      
      if (data) {
        const config = data as BrandingConfig;
        setBranding(config);
        setCachedBranding(config);
        setIsStale(false);
      } else {
        // No data returned - use fallback
        console.warn('No branding config found in database, using fallback');
        setBranding(FALLBACK_BRANDING);
        setIsStale(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load branding';
      console.error('Error fetching branding:', message);
      setError(message);
      // Keep using cached or fallback branding
      setIsStale(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [organizationId]);

  const refresh = async () => {
    localStorage.removeItem(CACHE_KEY);
    await fetchBranding();
  };

  return {
    branding,
    isLoading,
    error,
    isStale,
    refresh,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get full page title with app name
 */
export function getPageTitle(branding: BrandingConfig, pageTitle?: string): string {
  if (!pageTitle) return branding.appName;
  return `${pageTitle} | ${branding.appName}`;
}

/**
 * Get copyright notice with current year
 */
export function getCopyrightNotice(branding: BrandingConfig): string {
  const currentYear = new Date().getFullYear();
  const startYear = branding.legal.copyrightYear;
  const yearRange = startYear === String(currentYear)
    ? startYear
    : `${startYear}-${currentYear}`;
  return `© ${yearRange} ${branding.legal.copyrightHolder}. All rights reserved.`;
}

/**
 * Get formatted "From" field for emails
 */
export function getEmailFrom(branding: BrandingConfig): string {
  return `${branding.email.fromName} <${branding.email.fromEmail}>`;
}

/**
 * Get email subject with placeholders replaced
 */
export function getEmailSubject(
  branding: BrandingConfig,
  templateKey: keyof BrandingConfig['email']['subjects'],
  replacements: Record<string, string> = {}
): string {
  let subject = branding.email.subjects[templateKey];
  
  Object.entries(replacements).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  return subject;
}

/**
 * Get formatted address
 */
export function getFormattedAddress(branding: BrandingConfig): string {
  const addr = branding.contact.address;
  const line2 = addr.line2 ? `, ${addr.line2}` : '';
  return `${addr.line1}${line2}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default useBranding;

// Also export the fallback for testing/Edge Functions
export { FALLBACK_BRANDING };

