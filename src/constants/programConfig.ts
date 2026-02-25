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
      { date: "Feb 21", text: "Complete rebrand to BibleLessonSpark" },
      { date: "Feb 10", text: "Lesson Shapes — reshape any lesson into 5 teaching styles" },
      { date: "Feb 9", text: "Teaching Teams — invite up to 2 co-teachers to share lessons" },
      { date: "Feb 7", text: "Modern Parable Generator with perpetual freshness" },
      { date: "Jan 28", text: "DevotionalSpark v2.1 — personal quiet-time companion" },
      { date: "Jan 15", text: "PDF, DOCX, and Print export with optimized formatting" }
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
