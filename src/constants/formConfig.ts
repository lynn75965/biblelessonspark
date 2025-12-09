// SSOT MASTER: Form field styling configuration
// Controls consistent form element appearance across the platform

export const FORM_STYLING = {
  // Select/Dropdown max-width to keep chevron visible near text
  selectMaxWidth: "max-w-md",
  
  // Full-width selects (for modals or constrained containers)
  selectFullWidth: "w-full",
  
  // Input field max-widths
  inputMaxWidth: "max-w-lg",
  inputFullWidth: "w-full",
} as const;