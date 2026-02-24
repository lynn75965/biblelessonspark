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
  biblePassageInput: "max-w-md",
  // Autocomplete dropdown styling
  autocompleteDropdown: "absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-card shadow-lg",
  autocompleteItem: "cursor-pointer px-3 py-2 hover:bg-muted",
  autocompleteMinChars: 2,
} as const;
