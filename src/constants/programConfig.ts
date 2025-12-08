// Program configuration - SSOT
// Controls beta vs production behavior across the platform
// Admin-only visibility for Program Hub controlled in Dashboard.tsx
// Feedback collection available to all users during beta

// STATUS OPTIONS:
// "beta" - Private beta phase: shows beta-specific UI, beta benefits, beta news
// "production" - Live phase: hides beta UI, converts to Admin Dashboard

export const PROGRAM_CONFIG = {
  status: "beta" as "beta" | "production",

  // Beta-specific settings (ignored when status is "production")
  beta: {
    currentPhase: "Private Beta",
    targetLaunch: "Q1 2026",

    benefits: [
      "Free access during beta period",
      "50% discount on first year after launch",
      "\"Founding Member\" badge on your profile",
      "Direct input on features we build"
    ],

    recentUpdates: [
      { date: "Dec 8", text: "Beta launch - SMS invitations sent" },
      { date: "Nov 29", text: "New form layout with helper text" },
      { date: "Nov 28", text: "Footer links and Help pages added" },
      { date: "Nov 25", text: "PDF/DOCX export now available" }
    ],

    // UI Configuration for beta period
    ui: {
      headerButtonText: "Sign In",
      showJoinBetaButton: true,
      joinBetaButtonText: "Join Beta",
      authDefaultTab: "signup" as "signin" | "signup",
      showOrganizationSignup: false,
      showPricing: false,
      showCreditsBlock: false,
    }
  },

  // Production settings (used when status is "production")
  production: {
    adminHubTitle: "Admin Dashboard",

    // Changelog replaces beta news
    recentUpdates: [
      // Populate with release notes at launch
    ],

    // UI Configuration for production
    ui: {
      headerButtonText: "Sign In",
      showJoinBetaButton: false,
      joinBetaButtonText: "",
      authDefaultTab: "signin" as "signin" | "signup",
      showOrganizationSignup: true,
      showPricing: true,
      showCreditsBlock: true,
    }
  }
};

// Helper functions for components
export const isBetaMode = () => PROGRAM_CONFIG.status === "beta";
export const isProductionMode = () => PROGRAM_CONFIG.status === "production";

// UI helpers - returns appropriate config based on current mode
export const getUIConfig = () => {
  return isBetaMode() ? PROGRAM_CONFIG.beta.ui : PROGRAM_CONFIG.production.ui;
};
