/**
 * Branding Configuration Types
 * ============================
 * 
 * TypeScript type definitions for the branding_config table.
 * These types mirror the JSONB structure stored in the database.
 * 
 * Location: src/types/branding.ts
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface BrandingUrls {
  domain: string;
  baseUrl: string;
  support: string;
  termsOfService: string;
  privacyPolicy: string;
  documentation: string;
  unsubscribe: string;
  emailPreferences: string;
}

export interface BrandingAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface BrandingContact {
  supportEmail: string;
  infoEmail: string;
  noReplyEmail: string;
  emailSenderName: string;
  phone: string | null;
  address: BrandingAddress;
}

export interface BrandingLogo {
  primary: string;
  light: string;
  icon: string;
  favicon: string;
  appleTouchIcon: string;
  ogImage: string;
  altText: string;
}

export interface BrandingColorSet {
  DEFAULT: string;
  light: string;
  dark: string;
}

export interface BrandingColors {
  primary: BrandingColorSet;
  secondary: BrandingColorSet;
  accent: BrandingColorSet;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: {
    primary: string;
    secondary: string;
    dark: string;
  };
  text: {
    primary: string;
    secondary: string;
    light: string;
    inverse: string;
  };
}

export interface BrandingTypography {
  fontFamily: {
    primary: string;
    secondary: string;
  };
  googleFontsUrl: string | null;
}

export interface BrandingLegal {
  copyrightHolder: string;
  copyrightYear: string;
  legalEntityName: string;
  jurisdiction: string;
}

export interface BrandingSocial {
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  linkedin: string | null;
}

export interface BrandingLanguage {
  code: string;
  name: string;
  flag: string;
}

export interface BrandingFeatures {
  showPoweredBy: boolean;
  allowPublicSignup: boolean;
  multiLanguage: boolean;
  availableLanguages: BrandingLanguage[];
  defaultLanguage: string;
  organizationsEnabled: boolean;
  betaFeaturesEnabled: boolean;
  showFeedbackButton: boolean;
}

export interface BrandingTheological {
  denomination: string;
  tradition: string;
  /**
   * @deprecated SSOT for Bible version defaults is bibleVersions.ts → getDefaultBibleVersion().
   * This field may exist in legacy database rows but should not be used by new code.
   */
  defaultBibleTranslation?: string;
  theologicalTagline: string;
  theologicalStatement: string;
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

export interface BrandingEmailStyles {
  headerBackground: string;
  headerTextColor: string;
  bodyBackground: string;
  contentBackground: string;
  textColor: string;
  mutedTextColor: string;
  linkColor: string;
  buttonBackground: string;
  buttonTextColor: string;
  secondaryButtonBackground: string;
  secondaryButtonTextColor: string;
  footerBackground: string;
  footerTextColor: string;
  borderColor: string;
  borderRadius: string;
  fontFamily: string;
}

export interface BrandingEmailImages {
  headerLogo: string;
  headerLogoWidth: number;
  headerLogoHeight: number;
  headerLogoAlt: string;
  iconLogo: string;
  socialIcons: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
}

export interface BrandingEmailSubjects {
  welcome: string;
  emailVerification: string;
  signup: string;
  magiclink: string;
  passwordReset: string;
  recovery: string;
  passwordChanged: string;
  orgInvitation: string;
  orgInvitationAccepted: string;
  orgRoleChanged: string;
  orgRemoved: string;
  lessonShared: string;
  lessonComplete: string;
  feedbackReceived: string;
  weeklyDigest: string;
  systemNotice: string;
  betaInvitation: string;
  featureAnnouncement: string;
}

export interface BrandingEmailContent {
  footerTagline: string;
  unsubscribeText: string;
  preferencesText: string;
  disclaimer: string;
  supportPrompt: string;
  greetings: {
    default: string;
    formal: string;
    friendly: string;
    noName: string;
  };
  signoffs: {
    default: string;
    formal: string;
    friendly: string;
    team: string;
  };
  buttons: {
    verifyEmail: string;
    resetPassword: string;
    acceptInvitation: string;
    viewLesson: string;
    getStarted: string;
    login: string;
    learnMore: string;
  };
}

export interface BrandingEmailTemplate {
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  expirationNote?: string;
  securityNote?: string;
}

export interface BrandingEmailTemplates {
  welcome: BrandingEmailTemplate;
  orgInvitation: BrandingEmailTemplate;
  passwordReset: BrandingEmailTemplate;
  emailVerification: BrandingEmailTemplate;
  lessonShared: BrandingEmailTemplate;
}

export interface BrandingEmailResend {
  defaultTags: Array<{ name: string; value: string }>;
  webhookEndpoint: string;
  trackOpens: boolean;
  trackClicks: boolean;
}

export interface BrandingEmail {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  styles: BrandingEmailStyles;
  images: BrandingEmailImages;
  subjects: BrandingEmailSubjects;
  content: BrandingEmailContent;
  templates: BrandingEmailTemplates;
  resend: BrandingEmailResend;
}

// ============================================================================
// UI TEXT TYPES
// ============================================================================

export interface BrandingText {
  heroHeadline: string;
  heroSubheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  loading: {
    lessons: string;
    default: string;
  };
  empty: {
    lessons: string;
    organizations: string;
  };
  success: {
    lessonCreated: string;
    lessonSaved: string;
    profileUpdated: string;
  };
}

// ============================================================================
// MAIN BRANDING CONFIG TYPE
// ============================================================================

export interface BrandingConfig {
  appName: string;
  appNameShort: string;
  tagline: string;
  description: string;
  keywords: string[];
  urls: BrandingUrls;
  contact: BrandingContact;
  logo: BrandingLogo;
  colors: BrandingColors;
  typography: BrandingTypography;
  legal: BrandingLegal;
  social: BrandingSocial;
  features: BrandingFeatures;
  theological: BrandingTheological;
  email: BrandingEmail;
  text: BrandingText;
}

// ============================================================================
// DATABASE ROW TYPE
// ============================================================================

export interface BrandingConfigRow {
  id: string;
  organization_id: string | null;
  config: BrandingConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// ============================================================================
// HELPER TYPE EXPORTS
// ============================================================================

export type EmailSubjectKey = keyof BrandingEmailSubjects;
export type EmailTemplateKey = keyof BrandingEmailTemplates;
export type GreetingStyle = keyof BrandingEmailContent['greetings'];
export type SignoffStyle = keyof BrandingEmailContent['signoffs'];
