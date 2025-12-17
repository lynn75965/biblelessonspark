/**
 * INTEGRATION CONFIGURATION
 * =========================
 * 
 * Add this section to branding.ts for white-label deployments.
 * 
 * This controls how LessonSparkUSA integrates with the buyer's
 * existing CRM and email systems.
 */

// Add to BRANDING object:

  // ==========================================================================
  // INTEGRATION SETTINGS
  // ==========================================================================
  
  integrations: {
    /**
     * =========================================
     * EMAIL PROVIDER CONFIGURATION
     * =========================================
     */
    
    email: {
      /**
       * Email provider to use
       * Options: 'resend', 'sendgrid', 'smtp', 'disabled'
       * 
       * Set to 'disabled' if buyer handles all email through their own system
       * (they would configure webhooks to receive events instead)
       */
      provider: 'resend',
      
      /**
       * Per-email-type enable/disable
       * Allows buyer to selectively disable certain emails
       * (e.g., let their CRM handle invitations but LessonSparkUSA handles password reset)
       */
      emailTypesEnabled: {
        welcome: true,
        emailVerification: true,
        passwordReset: true,
        invitation: true,          // Set false if CRM handles invitations
        lessonShared: true,        // Set false if CRM handles notifications
        organizationUpdates: true,
        systemNotices: true,
      },
    },
    
    /**
     * =========================================
     * WEBHOOK CONFIGURATION
     * =========================================
     * 
     * Webhooks allow buyer's systems to receive real-time
     * notifications when events occur in LessonSparkUSA.
     */
    
    webhooks: {
      /**
       * Master enable/disable for webhooks
       */
      enabled: false,
      
      /**
       * Webhook endpoint URL (buyer provides)
       * Events will be POST'd to this URL
       */
      endpointUrl: '',
      
      /**
       * Authentication type for webhook calls
       * Options: 'bearer', 'basic', 'header', 'none'
       */
      authType: 'bearer',
      
      /**
       * Secret for webhook signature verification
       * Used to generate HMAC signature so buyer can verify authenticity
       * IMPORTANT: Generate a unique secret for each white-label deployment
       */
      signingSecret: '',
      
      /**
       * Events to send via webhook
       * Buyer can selectively enable/disable event types
       */
      eventsEnabled: {
        // User events
        'user.registered': true,
        'user.verified': true,
        'user.profile_updated': false,
        
        // Authentication events
        'auth.password_reset_requested': false,
        'auth.password_changed': false,
        
        // Invitation events
        'invitation.sent': true,
        'invitation.accepted': true,
        'invitation.expired': false,
        
        // Organization events
        'organization.member_added': true,
        'organization.member_removed': true,
        'organization.member_role_changed': true,
        
        // Lesson events
        'lesson.created': true,
        'lesson.updated': false,
        'lesson.deleted': false,
        'lesson.shared': true,
        
        // Focus events
        'focus.created': false,
        'focus.updated': false,
        'focus.shared': false,
      },
      
      /**
       * Retry configuration
       */
      retryAttempts: 3,
      retryDelaySeconds: 60,
      timeoutSeconds: 30,
    },
    
    /**
     * =========================================
     * SSO CONFIGURATION (Advanced)
     * =========================================
     * 
     * For enterprise buyers who want users to authenticate
     * through their existing identity provider.
     */
    
    sso: {
      /**
       * Enable SSO authentication
       */
      enabled: false,
      
      /**
       * SSO Provider type
       * Options: 'saml', 'oidc', 'none'
       */
      provider: 'none',
      
      /**
       * Allow local (email/password) authentication alongside SSO
       * Set false to force all users through SSO
       */
      allowLocalAuth: true,
      
      /**
       * Automatically create user accounts for new SSO logins
       */
      autoProvisionUsers: true,
      
      /**
       * Default role for auto-provisioned users
       */
      defaultRole: 'teacher',
      
      /**
       * SAML-specific settings (if provider is 'saml')
       */
      saml: {
        entryPoint: '',      // IdP login URL
        issuer: '',          // Your app's entity ID
        certificate: '',     // IdP's public certificate
        callbackUrl: '',     // Your app's assertion consumer service URL
      },
      
      /**
       * OIDC-specific settings (if provider is 'oidc')
       */
      oidc: {
        clientId: '',
        clientSecret: '',
        discoveryUrl: '',    // e.g., https://accounts.google.com/.well-known/openid-configuration
        callbackUrl: '',
        scopes: ['openid', 'email', 'profile'],
      },
    },
    
    /**
     * =========================================
     * API ACCESS CONFIGURATION
     * =========================================
     * 
     * For buyers who want to sync data from LessonSparkUSA
     * into their own systems.
     */
    
    api: {
      /**
       * Enable read-only API access for data sync
       */
      enabled: false,
      
      /**
       * API rate limits (requests per minute)
       */
      rateLimitPerMinute: 60,
      
      /**
       * Resources available via API
       */
      resourcesEnabled: {
        users: true,
        lessons: true,
        organizations: true,
        activity: true,
      },
    },
  },

// ============================================================================
// INTEGRATION HELPER FUNCTIONS
// ============================================================================

/**
 * Check if webhooks are enabled
 */
export function areWebhooksEnabled(): boolean {
  return BRANDING.integrations.webhooks.enabled && 
         Boolean(BRANDING.integrations.webhooks.endpointUrl);
}

/**
 * Check if a specific webhook event is enabled
 */
export function isWebhookEventEnabled(
  eventType: keyof typeof BRANDING.integrations.webhooks.eventsEnabled
): boolean {
  if (!areWebhooksEnabled()) return false;
  return BRANDING.integrations.webhooks.eventsEnabled[eventType] ?? false;
}

/**
 * Check if a specific email type is enabled
 */
export function isEmailTypeEnabled(
  emailType: keyof typeof BRANDING.integrations.email.emailTypesEnabled
): boolean {
  if (BRANDING.integrations.email.provider === 'disabled') return false;
  return BRANDING.integrations.email.emailTypesEnabled[emailType] ?? false;
}

/**
 * Check if SSO is enabled and configured
 */
export function isSSOEnabled(): boolean {
  return BRANDING.integrations.sso.enabled && 
         BRANDING.integrations.sso.provider !== 'none';
}

/**
 * Get SSO configuration for the configured provider
 */
export function getSSOConfig() {
  if (!isSSOEnabled()) return null;
  
  const provider = BRANDING.integrations.sso.provider;
  if (provider === 'saml') {
    return BRANDING.integrations.sso.saml;
  } else if (provider === 'oidc') {
    return BRANDING.integrations.sso.oidc;
  }
  return null;
}
