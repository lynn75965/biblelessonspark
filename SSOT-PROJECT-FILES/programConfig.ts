// =====================================================
// PROGRAM CONFIG - Static Content Only
// =====================================================
// This file contains ONLY static content arrays and text.
// Mode logic is in systemSettings.ts (isBetaMode, getPhaseDisplayLabel)
// Visibility toggles are in system_settings database table
// =====================================================

export const PROGRAM_CONFIG = {
  // Maintenance mode static content
  maintenance: {
    title: "We'll Be Right Back",
    message: "BibleLessonSpark is currently undergoing scheduled maintenance. We apologize for any inconvenience and appreciate your patience.",
    subtext: "Please check back shortly."
  },
  // Beta-specific static content
  beta: {
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
  },
  // Production static content
  production: {
    adminHubTitle: "Admin Dashboard",
    recentUpdates: [
      // Populate with release notes at launch
    ],
  }
};
