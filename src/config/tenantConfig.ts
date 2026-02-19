/**
 * BibleLessonSpark Constants - Tenant Configuration
 *
 * SINGLE SOURCE OF TRUTH for tenant/white-label configuration.
 * This is Tier 1 (Supreme/Foundational).
 *
 * GOVERNANCE: Only admin can modify tenant settings.
 * Database table: tenant_config
 * 
 * ARCHITECTURE: Frontend drives backend
 * - This file defines the structure
 * - Database schema mirrors this structure
 * - TenantBrandingPanel reads/writes via this SSOT
 * 
 * SSOT COLORS: Default branding imports from branding.ts
 * - Do NOT hardcode colors here
 * - All defaults flow from BRANDING constant
 */

import { BRANDING } from "@/config/branding";

// =============================================================================
// TYPE DEFINITIONS (Nested structure for organized access)
// =============================================================================

export type TenantConfig = {
  tenantId: string;

  branding: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };

  uiText: {
    appTitle: string;
    tagline: string;
    primaryCta: string;
  };

  features: {
    devotionals: boolean;
    pdfExport: boolean;
    whiteLabel: boolean;
  };

  contact: {
    supportEmail: string;
    fromEmail: string;
    fromName: string;
  };

  beta: {
    landingPage: {
      ctaTitle: string;
      ctaSubtitle: string;
      ctaButton: string;
      trustText: string;
      badgeText: string;
    };
    form: {
      title: string;
      subtitle: string;
      fullNameLabel: string;
      fullNamePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      churchNameLabel: string;
      churchNamePlaceholder: string;
      referralSourceLabel: string;
      referralSourcePlaceholder: string;
      submitButton: string;
      submittingButton: string;
      alreadyHaveAccount: string;
      signInLink: string;
      termsText: string;
      termsLink: string;
      privacyLink: string;
    };
    dashboardPrompt: {
      title: string;
      description: string;
      button: string;
      dismissButton: string;
    };
    messages: {
      enrollmentSuccessTitle: string;
      enrollmentSuccessDescription: string;
      enrollmentErrorTitle: string;
      enrollmentErrorDescription: string;
      alreadyEnrolledTitle: string;
      alreadyEnrolledDescription: string;
      verificationSentTitle: string;
      verificationSentDescription: string;
    };
    validation: {
      fullNameRequired: string;
      fullNameMinLength: string;
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      passwordMinLength: string;
    };
  };

  production: {
    landingPage: {
      badgeText: string;
      ctaButton: string;
      trustText: string;
    };
  };
};

export interface TenantConfigRow {
  id: string;
  tenant_id: string;
  brand_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  app_title: string;
  tagline: string;
  primary_cta: string;
  feature_devotionals: boolean;
  feature_pdf_export: boolean;
  feature_white_label: boolean;
  contact_support_email: string;
  contact_from_email: string;
  contact_from_name: string;
  beta_landing_cta_title: string;
  beta_landing_cta_subtitle: string;
  beta_landing_cta_button: string;
  beta_landing_trust_text: string;
  beta_landing_badge_text: string;
  beta_form_title: string;
  beta_form_subtitle: string;
  beta_form_fullname_label: string;
  beta_form_fullname_placeholder: string;
  beta_form_email_label: string;
  beta_form_email_placeholder: string;
  beta_form_password_label: string;
  beta_form_password_placeholder: string;
  beta_form_church_label: string;
  beta_form_church_placeholder: string;
  beta_form_referral_label: string;
  beta_form_referral_placeholder: string;
  beta_form_submit_button: string;
  beta_form_submitting_button: string;
  beta_form_already_have_account: string;
  beta_form_signin_link: string;
  beta_form_terms_text: string;
  beta_form_terms_link: string;
  beta_form_privacy_link: string;
  beta_dashboard_title: string;
  beta_dashboard_description: string;
  beta_dashboard_button: string;
  beta_dashboard_dismiss_button: string;
  beta_msg_success_title: string;
  beta_msg_success_description: string;
  beta_msg_error_title: string;
  beta_msg_error_description: string;
  beta_msg_already_enrolled_title: string;
  beta_msg_already_enrolled_description: string;
  beta_msg_verification_title: string;
  beta_msg_verification_description: string;
  beta_val_fullname_required: string;
  beta_val_fullname_min: string;
  beta_val_email_required: string;
  beta_val_email_invalid: string;
  beta_val_password_required: string;
  beta_val_password_min: string;
  prod_landing_badge_text: string;
  prod_landing_cta_button: string;
  prod_landing_trust_text: string;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TENANT_ID = "biblelessonspark";

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  tenantId: DEFAULT_TENANT_ID,
  branding: {
    name: BRANDING.appName,
    logoUrl: null,
    primaryColor: BRANDING.colors.primary.DEFAULT,
    secondaryColor: BRANDING.colors.secondary.DEFAULT,
    fontFamily: BRANDING.typography.fontFamily.primary,
  },
  uiText: {
    appTitle: BRANDING.appName,
    tagline: BRANDING.tagline,
    primaryCta: "Create Lesson",
  },
  features: {
    devotionals: true,
    pdfExport: true,
    whiteLabel: false,
  },
  contact: {
    supportEmail: BRANDING.contact.supportEmail,
    fromEmail: BRANDING.contact.noReplyEmail,
    fromName: BRANDING.contact.emailSenderName,
  },
  beta: {
    landingPage: {
      ctaTitle: "Get Started Free",
      ctaSubtitle: "Create engaging Bible study lessons for your Sunday School class in minutes.",
      ctaButton: "Get Started Free",
      trustText: "Join hundreds of Baptist teachers already using BibleLessonSpark",
      badgeText: "Public Beta • Free for Baptist Teachers",
    },
    form: {
      title: "Join BibleLessonSpark",
      subtitle: "Start creating Bible study lessons in minutes.",
      fullNameLabel: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      emailLabel: "Email Address",
      emailPlaceholder: "you@church.org",
      passwordLabel: "Password",
      passwordPlaceholder: "Create a secure password",
      churchNameLabel: "Church Name (optional)",
      churchNamePlaceholder: "First Baptist Church",
      referralSourceLabel: "How did you hear about us? (optional)",
      referralSourcePlaceholder: "Select an option",
      submitButton: "Create My Free Account",
      submittingButton: "Creating Account...",
      alreadyHaveAccount: "Already have an account?",
      signInLink: "Sign in",
      termsText: "By creating an account, you agree to our",
      termsLink: "Terms of Service",
      privacyLink: "Privacy Policy",
    },
    dashboardPrompt: {
      title: "Complete Your Registration",
      description: "Complete your registration to access all features.",
      button: "Join Now",
      dismissButton: "Maybe Later",
    },
    messages: {
      enrollmentSuccessTitle: "Welcome to BibleLessonSpark!",
      enrollmentSuccessDescription: "Your account has been created. Check your email to verify your account.",
      enrollmentErrorTitle: "Enrollment Failed",
      enrollmentErrorDescription: "Something went wrong. Please try again or contact support.",
      alreadyEnrolledTitle: "Already Enrolled",
      alreadyEnrolledDescription: "You already have an account.",
      verificationSentTitle: "Verification Email Sent",
      verificationSentDescription: "Please check your inbox and click the verification link.",
    },
    validation: {
      fullNameRequired: "Please enter your full name",
      fullNameMinLength: "Name must be at least 2 characters",
      emailRequired: "Please enter your email address",
      emailInvalid: "Please enter a valid email address",
      passwordRequired: "Please create a password",
      passwordMinLength: "Password must be at least 8 characters",
    },
  },
  production: {
    landingPage: {
      badgeText: "Personalized Baptist Bible Study Curriculum",
      ctaButton: "Get Started",
      trustText: "Trusted by Baptist teachers across the country",
    },
  },
};

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Modern)" },
  { value: "system-ui", label: "System Default" },
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia (Serif)" },
  { value: "Times New Roman", label: "Times New Roman" },
] as const;

export const COLOR_PRESETS = {
  primary: [
    { value: BRANDING.colors.primary.DEFAULT, label: "BibleLessonSpark Green" },
    { value: "#2563EB", label: "Baptist Blue" },
    { value: "#059669", label: "Ministry Green" },
    { value: "#7C3AED", label: "Royal Purple" },
    { value: "#DC2626", label: "Classic Red" },
  ],
  secondary: [
    { value: BRANDING.colors.secondary.DEFAULT, label: "Antique Gold" },
    { value: "#1F2937", label: "Charcoal" },
    { value: "#374151", label: "Slate" },
    { value: "#1E3A5F", label: "Navy" },
    { value: "#064E3B", label: "Forest" },
  ],
} as const;

export const FEATURE_FLAGS = [
  {
    key: "devotionals" as const,
    dbKey: "feature_devotionals" as const,
    label: "Enable Devotionals",
    description: "Allow users to generate devotional content",
  },
  {
    key: "pdfExport" as const,
    dbKey: "feature_pdf_export" as const,
    label: "Enable PDF Export",
    description: "Allow users to export lessons as PDF",
  },
  {
    key: "whiteLabel" as const,
    dbKey: "feature_white_label" as const,
    label: "White Label Mode",
    description: "Remove BibleLessonSpark branding for enterprise clients",
  },
] as const;

export const CONTACT_FIELDS = {
  label: "Contact & Email",
  description: "Email addresses used for support and transactional emails",
  fields: [
    { key: "supportEmail", label: "Support Email", placeholder: "support@yourchurch.org", description: "Displayed in UI for users to contact support" },
    { key: "fromEmail", label: "From Email", placeholder: "noreply@yourchurch.org", description: "Sender address for transactional emails" },
    { key: "fromName", label: "From Name", placeholder: "Your Church Name", description: "Sender name for transactional emails" },
  ],
} as const;

export const BETA_FIELD_GROUPS = {
  landingPage: {
    label: "Landing Page CTA",
    description: "Text shown on the landing page beta call-to-action",
    fields: [
      { key: "ctaTitle", label: "CTA Title", placeholder: "Get Started Free" },
      { key: "ctaSubtitle", label: "CTA Subtitle", placeholder: "Create engaging Bible study lessons..." },
      { key: "ctaButton", label: "CTA Button Text", placeholder: "Get Started Free" },
      { key: "trustText", label: "Trust Text", placeholder: "Join hundreds of Baptist teachers..." },
      { key: "badgeText", label: "Badge Text", placeholder: "Public Beta • Free for Baptist Teachers" },
    ],
  },
  form: {
    label: "Enrollment Form",
    description: "Labels and placeholders for the enrollment form",
    fields: [
      { key: "title", label: "Form Title", placeholder: "Join BibleLessonSpark" },
      { key: "subtitle", label: "Form Subtitle", placeholder: "Start creating Bible study lessons..." },
      { key: "fullNameLabel", label: "Full Name Label", placeholder: "Full Name" },
      { key: "fullNamePlaceholder", label: "Full Name Placeholder", placeholder: "Enter your full name" },
      { key: "emailLabel", label: "Email Label", placeholder: "Email Address" },
      { key: "emailPlaceholder", label: "Email Placeholder", placeholder: "you@church.org" },
      { key: "passwordLabel", label: "Password Label", placeholder: "Password" },
      { key: "passwordPlaceholder", label: "Password Placeholder", placeholder: "Create a secure password" },
      { key: "churchNameLabel", label: "Church Name Label", placeholder: "Church Name (optional)" },
      { key: "churchNamePlaceholder", label: "Church Name Placeholder", placeholder: "First Baptist Church" },
      { key: "referralSourceLabel", label: "Referral Source Label", placeholder: "How did you hear about us?" },
      { key: "referralSourcePlaceholder", label: "Referral Source Placeholder", placeholder: "Select an option" },
      { key: "submitButton", label: "Submit Button", placeholder: "Create My Free Account" },
      { key: "submittingButton", label: "Submitting Button", placeholder: "Creating Account..." },
      { key: "alreadyHaveAccount", label: "Already Have Account Text", placeholder: "Already have an account?" },
      { key: "signInLink", label: "Sign In Link Text", placeholder: "Sign in" },
      { key: "termsText", label: "Terms Text", placeholder: "By creating an account, you agree to our" },
      { key: "termsLink", label: "Terms Link Text", placeholder: "Terms of Service" },
      { key: "privacyLink", label: "Privacy Link Text", placeholder: "Privacy Policy" },
    ],
  },
  dashboardPrompt: {
    label: "Dashboard Prompt",
    description: "Banner shown to users without an organization",
    fields: [
      { key: "title", label: "Prompt Title", placeholder: "Complete Your Registration" },
      { key: "description", label: "Prompt Description", placeholder: "Complete your registration to access all features." },
      { key: "button", label: "Join Button", placeholder: "Join Now" },
      { key: "dismissButton", label: "Dismiss Button", placeholder: "Maybe Later" },
    ],
  },
  messages: {
    label: "Status Messages",
    description: "Success, error, and status messages",
    fields: [
      { key: "enrollmentSuccessTitle", label: "Success Title", placeholder: "Welcome to BibleLessonSpark!" },
      { key: "enrollmentSuccessDescription", label: "Success Description", placeholder: "Your account has been created..." },
      { key: "enrollmentErrorTitle", label: "Error Title", placeholder: "Enrollment Failed" },
      { key: "enrollmentErrorDescription", label: "Error Description", placeholder: "Something went wrong..." },
      { key: "alreadyEnrolledTitle", label: "Already Enrolled Title", placeholder: "Already Enrolled" },
      { key: "alreadyEnrolledDescription", label: "Already Enrolled Description", placeholder: "You already have an account." },
      { key: "verificationSentTitle", label: "Verification Title", placeholder: "Verification Email Sent" },
      { key: "verificationSentDescription", label: "Verification Description", placeholder: "Please check your inbox..." },
    ],
  },
  validation: {
    label: "Validation Messages",
    description: "Form validation error messages",
    fields: [
      { key: "fullNameRequired", label: "Name Required", placeholder: "Please enter your full name" },
      { key: "fullNameMinLength", label: "Name Min Length", placeholder: "Name must be at least 2 characters" },
      { key: "emailRequired", label: "Email Required", placeholder: "Please enter your email address" },
      { key: "emailInvalid", label: "Email Invalid", placeholder: "Please enter a valid email address" },
      { key: "passwordRequired", label: "Password Required", placeholder: "Please create a password" },
      { key: "passwordMinLength", label: "Password Min Length", placeholder: "Password must be at least 8 characters" },
    ],
  },
} as const;

export const PRODUCTION_FIELD_GROUPS = {
  landingPage: {
    label: "Landing Page",
    description: "Text shown on the landing page when in production mode",
    fields: [
      { key: "badgeText", label: "Badge Text", placeholder: "Personalized Baptist Bible Study Curriculum" },
      { key: "ctaButton", label: "CTA Button Text", placeholder: "Get Started" },
      { key: "trustText", label: "Trust Text", placeholder: "Trusted by Baptist teachers across the country" },
    ],
  },
} as const;

export function mapRowToConfig(row: TenantConfigRow): TenantConfig {
  return {
    tenantId: row.tenant_id,
    branding: {
      name: row.brand_name,
      logoUrl: row.logo_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      fontFamily: row.font_family,
    },
    uiText: {
      appTitle: row.app_title,
      tagline: row.tagline,
      primaryCta: row.primary_cta,
    },
    features: {
      devotionals: row.feature_devotionals,
      pdfExport: row.feature_pdf_export,
      whiteLabel: row.feature_white_label,
    },
    contact: {
      supportEmail: row.contact_support_email ?? DEFAULT_TENANT_CONFIG.contact.supportEmail,
      fromEmail: row.contact_from_email ?? DEFAULT_TENANT_CONFIG.contact.fromEmail,
      fromName: row.contact_from_name ?? DEFAULT_TENANT_CONFIG.contact.fromName,
    },
    beta: {
      landingPage: {
        ctaTitle: row.beta_landing_cta_title ?? DEFAULT_TENANT_CONFIG.beta.landingPage.ctaTitle,
        ctaSubtitle: row.beta_landing_cta_subtitle ?? DEFAULT_TENANT_CONFIG.beta.landingPage.ctaSubtitle,
        ctaButton: row.beta_landing_cta_button ?? DEFAULT_TENANT_CONFIG.beta.landingPage.ctaButton,
        trustText: row.beta_landing_trust_text ?? DEFAULT_TENANT_CONFIG.beta.landingPage.trustText,
        badgeText: row.beta_landing_badge_text ?? DEFAULT_TENANT_CONFIG.beta.landingPage.badgeText,
      },
      form: {
        title: row.beta_form_title ?? DEFAULT_TENANT_CONFIG.beta.form.title,
        subtitle: row.beta_form_subtitle ?? DEFAULT_TENANT_CONFIG.beta.form.subtitle,
        fullNameLabel: row.beta_form_fullname_label ?? DEFAULT_TENANT_CONFIG.beta.form.fullNameLabel,
        fullNamePlaceholder: row.beta_form_fullname_placeholder ?? DEFAULT_TENANT_CONFIG.beta.form.fullNamePlaceholder,
        emailLabel: row.beta_form_email_label ?? DEFAULT_TENANT_CONFIG.beta.form.emailLabel,
        emailPlaceholder: row.beta_form_email_placeholder ?? DEFAULT_TENANT_CONFIG.beta.form.emailPlaceholder,
        passwordLabel: row.beta_form_password_label ?? DEFAULT_TENANT_CONFIG.beta.form.passwordLabel,
        passwordPlaceholder: row.beta_form_password_placeholder ?? DEFAULT_TENANT_CONFIG.beta.form.passwordPlaceholder,
        churchNameLabel: row.beta_form_church_label ?? DEFAULT_TENANT_CONFIG.beta.form.churchNameLabel,
        churchNamePlaceholder: row.beta_form_church_placeholder ?? DEFAULT_TENANT_CONFIG.beta.form.churchNamePlaceholder,
        referralSourceLabel: row.beta_form_referral_label ?? DEFAULT_TENANT_CONFIG.beta.form.referralSourceLabel,
        referralSourcePlaceholder: row.beta_form_referral_placeholder ?? DEFAULT_TENANT_CONFIG.beta.form.referralSourcePlaceholder,
        submitButton: row.beta_form_submit_button ?? DEFAULT_TENANT_CONFIG.beta.form.submitButton,
        submittingButton: row.beta_form_submitting_button ?? DEFAULT_TENANT_CONFIG.beta.form.submittingButton,
        alreadyHaveAccount: row.beta_form_already_have_account ?? DEFAULT_TENANT_CONFIG.beta.form.alreadyHaveAccount,
        signInLink: row.beta_form_signin_link ?? DEFAULT_TENANT_CONFIG.beta.form.signInLink,
        termsText: row.beta_form_terms_text ?? DEFAULT_TENANT_CONFIG.beta.form.termsText,
        termsLink: row.beta_form_terms_link ?? DEFAULT_TENANT_CONFIG.beta.form.termsLink,
        privacyLink: row.beta_form_privacy_link ?? DEFAULT_TENANT_CONFIG.beta.form.privacyLink,
      },
      dashboardPrompt: {
        title: row.beta_dashboard_title ?? DEFAULT_TENANT_CONFIG.beta.dashboardPrompt.title,
        description: row.beta_dashboard_description ?? DEFAULT_TENANT_CONFIG.beta.dashboardPrompt.description,
        button: row.beta_dashboard_button ?? DEFAULT_TENANT_CONFIG.beta.dashboardPrompt.button,
        dismissButton: row.beta_dashboard_dismiss_button ?? DEFAULT_TENANT_CONFIG.beta.dashboardPrompt.dismissButton,
      },
      messages: {
        enrollmentSuccessTitle: row.beta_msg_success_title ?? DEFAULT_TENANT_CONFIG.beta.messages.enrollmentSuccessTitle,
        enrollmentSuccessDescription: row.beta_msg_success_description ?? DEFAULT_TENANT_CONFIG.beta.messages.enrollmentSuccessDescription,
        enrollmentErrorTitle: row.beta_msg_error_title ?? DEFAULT_TENANT_CONFIG.beta.messages.enrollmentErrorTitle,
        enrollmentErrorDescription: row.beta_msg_error_description ?? DEFAULT_TENANT_CONFIG.beta.messages.enrollmentErrorDescription,
        alreadyEnrolledTitle: row.beta_msg_already_enrolled_title ?? DEFAULT_TENANT_CONFIG.beta.messages.alreadyEnrolledTitle,
        alreadyEnrolledDescription: row.beta_msg_already_enrolled_description ?? DEFAULT_TENANT_CONFIG.beta.messages.alreadyEnrolledDescription,
        verificationSentTitle: row.beta_msg_verification_title ?? DEFAULT_TENANT_CONFIG.beta.messages.verificationSentTitle,
        verificationSentDescription: row.beta_msg_verification_description ?? DEFAULT_TENANT_CONFIG.beta.messages.verificationSentDescription,
      },
      validation: {
        fullNameRequired: row.beta_val_fullname_required ?? DEFAULT_TENANT_CONFIG.beta.validation.fullNameRequired,
        fullNameMinLength: row.beta_val_fullname_min ?? DEFAULT_TENANT_CONFIG.beta.validation.fullNameMinLength,
        emailRequired: row.beta_val_email_required ?? DEFAULT_TENANT_CONFIG.beta.validation.emailRequired,
        emailInvalid: row.beta_val_email_invalid ?? DEFAULT_TENANT_CONFIG.beta.validation.emailInvalid,
        passwordRequired: row.beta_val_password_required ?? DEFAULT_TENANT_CONFIG.beta.validation.passwordRequired,
        passwordMinLength: row.beta_val_password_min ?? DEFAULT_TENANT_CONFIG.beta.validation.passwordMinLength,
      },
    },
    production: {
      landingPage: {
        badgeText: row.prod_landing_badge_text ?? DEFAULT_TENANT_CONFIG.production.landingPage.badgeText,
        ctaButton: row.prod_landing_cta_button ?? DEFAULT_TENANT_CONFIG.production.landingPage.ctaButton,
        trustText: row.prod_landing_trust_text ?? DEFAULT_TENANT_CONFIG.production.landingPage.trustText,
      },
    },
  };
}

export function mapConfigToRow(config: TenantConfig): Omit<TenantConfigRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    tenant_id: config.tenantId,
    brand_name: config.branding.name,
    logo_url: config.branding.logoUrl,
    primary_color: config.branding.primaryColor,
    secondary_color: config.branding.secondaryColor,
    font_family: config.branding.fontFamily,
    app_title: config.uiText.appTitle,
    tagline: config.uiText.tagline,
    primary_cta: config.uiText.primaryCta,
    feature_devotionals: config.features.devotionals,
    feature_pdf_export: config.features.pdfExport,
    feature_white_label: config.features.whiteLabel,
    contact_support_email: config.contact.supportEmail,
    contact_from_email: config.contact.fromEmail,
    contact_from_name: config.contact.fromName,
    beta_landing_cta_title: config.beta.landingPage.ctaTitle,
    beta_landing_cta_subtitle: config.beta.landingPage.ctaSubtitle,
    beta_landing_cta_button: config.beta.landingPage.ctaButton,
    beta_landing_trust_text: config.beta.landingPage.trustText,
    beta_landing_badge_text: config.beta.landingPage.badgeText,
    beta_form_title: config.beta.form.title,
    beta_form_subtitle: config.beta.form.subtitle,
    beta_form_fullname_label: config.beta.form.fullNameLabel,
    beta_form_fullname_placeholder: config.beta.form.fullNamePlaceholder,
    beta_form_email_label: config.beta.form.emailLabel,
    beta_form_email_placeholder: config.beta.form.emailPlaceholder,
    beta_form_password_label: config.beta.form.passwordLabel,
    beta_form_password_placeholder: config.beta.form.passwordPlaceholder,
    beta_form_church_label: config.beta.form.churchNameLabel,
    beta_form_church_placeholder: config.beta.form.churchNamePlaceholder,
    beta_form_referral_label: config.beta.form.referralSourceLabel,
    beta_form_referral_placeholder: config.beta.form.referralSourcePlaceholder,
    beta_form_submit_button: config.beta.form.submitButton,
    beta_form_submitting_button: config.beta.form.submittingButton,
    beta_form_already_have_account: config.beta.form.alreadyHaveAccount,
    beta_form_signin_link: config.beta.form.signInLink,
    beta_form_terms_text: config.beta.form.termsText,
    beta_form_terms_link: config.beta.form.termsLink,
    beta_form_privacy_link: config.beta.form.privacyLink,
    beta_dashboard_title: config.beta.dashboardPrompt.title,
    beta_dashboard_description: config.beta.dashboardPrompt.description,
    beta_dashboard_button: config.beta.dashboardPrompt.button,
    beta_dashboard_dismiss_button: config.beta.dashboardPrompt.dismissButton,
    beta_msg_success_title: config.beta.messages.enrollmentSuccessTitle,
    beta_msg_success_description: config.beta.messages.enrollmentSuccessDescription,
    beta_msg_error_title: config.beta.messages.enrollmentErrorTitle,
    beta_msg_error_description: config.beta.messages.enrollmentErrorDescription,
    beta_msg_already_enrolled_title: config.beta.messages.alreadyEnrolledTitle,
    beta_msg_already_enrolled_description: config.beta.messages.alreadyEnrolledDescription,
    beta_msg_verification_title: config.beta.messages.verificationSentTitle,
    beta_msg_verification_description: config.beta.messages.verificationSentDescription,
    beta_val_fullname_required: config.beta.validation.fullNameRequired,
    beta_val_fullname_min: config.beta.validation.fullNameMinLength,
    beta_val_email_required: config.beta.validation.emailRequired,
    beta_val_email_invalid: config.beta.validation.emailInvalid,
    beta_val_password_required: config.beta.validation.passwordRequired,
    beta_val_password_min: config.beta.validation.passwordMinLength,
    prod_landing_badge_text: config.production.landingPage.badgeText,
    prod_landing_cta_button: config.production.landingPage.ctaButton,
    prod_landing_trust_text: config.production.landingPage.trustText,
  };
}

export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function validateTenantConfig(config: TenantConfig): string[] {
  const errors: string[] = [];
  if (!config.branding.name.trim()) errors.push("Brand name cannot be empty");
  if (!config.uiText.appTitle.trim()) errors.push("App title cannot be empty");
  if (!isValidHexColor(config.branding.primaryColor)) errors.push("Primary color must be a valid hex color (e.g., #3D5C3D)");
  if (!isValidHexColor(config.branding.secondaryColor)) errors.push("Secondary color must be a valid hex color (e.g., #1F2937)");
  return errors;
}

export function applyTenantStyles(config: TenantConfig): void {
  document.documentElement.style.setProperty("--tenant-primary", config.branding.primaryColor);
  document.documentElement.style.setProperty("--tenant-secondary", config.branding.secondaryColor);
  document.documentElement.style.setProperty("--tenant-font", config.branding.fontFamily);
}

export const CSS_VARIABLES = {
  primary: "--tenant-primary",
  secondary: "--tenant-secondary",
  font: "--tenant-font",
} as const;

export function resolveTenantFromHost(host: string): string {
  const parts = host.split(".");
  if (parts.length >= 3 && parts[0] !== "www") return parts[0];
  return DEFAULT_TENANT_ID;
}

