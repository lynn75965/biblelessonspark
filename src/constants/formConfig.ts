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
  // Bible passage input: narrower width + hide datalist dropdown arrow
  biblePassageInput: "max-w-md [&::-webkit-calendar-picker-indicator]:hidden",
} as const;