/**
 * Edge Function Branding Helper
 * ==============================
 * 
 * Fetches branding configuration from the database.
 * This ensures both frontend and backend use the same source of truth.
 * 
 * Location: supabase/functions/_shared/branding.ts
 * 
 * USAGE:
 *   import { getBranding, getEmailFrom, getEmailSubject } from '../_shared/branding.ts'
 *   
 *   const branding = await getBranding(supabaseClient);
 *   const subject = getEmailSubject(branding, 'orgInvitation', { orgName: 'My Church' });
 * 
 * SSOT: Fallback values mirror src/config/branding.ts
 * Last synced: January 15, 2026
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPE DEFINITIONS (mirrors frontend types)
// ============================================================================

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

export interface BrandingEmail {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  subjects: BrandingEmailSubjects;
  // Other email properties available but not typed here for brevity
  [key: string]: any;
}

export interface BrandingUrls {
  domain: string;
  baseUrl: string;
  support: string;
  [key: string]: any;
}

export interface BrandingConfig {
  appName: string;
  appNameShort: string;
  tagline: string;
  urls: BrandingUrls;
  contact: {
    supportEmail: string;
    noReplyEmail: string;
    emailSenderName: string;
    [key: string]: any;
  };
  email: BrandingEmail;
  [key: string]: any;
}

// ============================================================================
// FALLBACK BRANDING (SSOT: mirrors src/config/branding.ts)
// ============================================================================
// These values must match the frontend SSOT in src/config/branding.ts
// If you rebrand, update BOTH files (or implement database-driven branding)
// ============================================================================

const FALLBACK_BRANDING: BrandingConfig = {
  appName: "BibleLessonSpark",
  appNameShort: "BibleLessonSpark",
  tagline: "Personalized Bible Study Lessons for Baptist Teachers",
  urls: {
    domain: "biblelessonspark.com",
    baseUrl: "https://biblelessonspark.com",
    support: "https://biblelessonspark.com/support",
  },
  contact: {
    supportEmail: "support@biblelessonspark.com",
    noReplyEmail: "noreply@biblelessonspark.com",
    emailSenderName: "BibleLessonSpark",
  },
  email: {
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
  },
};

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

let cachedBranding: BrandingConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function isCacheValid(): boolean {
  return cachedBranding !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION_MS;
}

// ============================================================================
// MAIN FUNCTION: Get Branding from Database
// ============================================================================

/**
 * Fetches branding configuration from the database.
 * Uses in-memory caching for performance.
 * Falls back to default values if fetch fails.
 * 
 * @param supabaseClient - Supabase client instance
 * @param organizationId - Optional organization ID for white-label branding
 * @returns Promise<BrandingConfig>
 */
export async function getBranding(
  supabaseClient: SupabaseClient,
  organizationId?: string | null
): Promise<BrandingConfig> {
  // Return cached version if still valid
  if (isCacheValid() && !organizationId) {
    return cachedBranding!;
  }

  try {
    // Call the database function
    const { data, error } = await supabaseClient.rpc('get_branding_config', {
      p_organization_id: organizationId || null,
    });

    if (error) {
      console.error('Error fetching branding from database:', error.message);
      return FALLBACK_BRANDING;
    }

    if (data) {
      // Update cache (only for global branding, not org-specific)
      if (!organizationId) {
        cachedBranding = data as BrandingConfig;
        cacheTimestamp = Date.now();
      }
      return data as BrandingConfig;
    }

    console.warn('No branding config found in database, using fallback');
    return FALLBACK_BRANDING;
  } catch (err) {
    console.error('Unexpected error fetching branding:', err);
    return FALLBACK_BRANDING;
  }
}

/**
 * Clears the branding cache (useful for testing or after updates)
 */
export function clearBrandingCache(): void {
  cachedBranding = null;
  cacheTimestamp = 0;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get formatted "From" field for Resend emails
 * Returns: "BibleLessonSpark <noreply@biblelessonspark.com>"
 */
export function getEmailFrom(branding: BrandingConfig): string {
  return `${branding.email.fromName} <${branding.email.fromEmail}>`;
}

/**
 * Get email subject with placeholders replaced
 * 
 * @example
 * getEmailSubject(branding, 'orgInvitation', { orgName: 'First Baptist' })
 * // Returns: "You've been invited to join First Baptist on BibleLessonSpark"
 */
export function getEmailSubject(
  branding: BrandingConfig,
  templateKey: keyof BrandingEmailSubjects,
  replacements: Record<string, string> = {}
): string {
  let subject = branding.email.subjects[templateKey];
  
  if (!subject) {
    console.warn(`Email subject template '${templateKey}' not found, using fallback`);
    subject = FALLBACK_BRANDING.email.subjects[templateKey] || `Notification from ${branding.appName}`;
  }
  
  // Replace placeholders
  Object.entries(replacements).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  return subject;
}

/**
 * Get reply-to email address
 */
export function getReplyTo(branding: BrandingConfig): string {
  return branding.email.replyTo || branding.contact.supportEmail;
}

/**
 * Get base URL for building links
 */
export function getBaseUrl(branding: BrandingConfig): string {
  return branding.urls?.baseUrl || FALLBACK_BRANDING.urls.baseUrl;
}

/**
 * Get app name for use in email templates
 */
export function getAppName(branding: BrandingConfig): string {
  return branding.appName || FALLBACK_BRANDING.appName;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { FALLBACK_BRANDING };
