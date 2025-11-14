// Bible Translation Configuration
// This file manages all available Bible translations across different APIs

export interface BibleTranslation {
  id: string;           // API-specific ID
  name: string;         // Display name
  abbreviation: string; // Short code (KJV, ESV, etc.)
  apiSource: 'api.bible' | 'esv' | 'net' | 'other'; // Which API provides it
  description: string;  // Brief description
  year?: number;        // Year published
  recommended?: boolean; // Highlight as recommended
}

export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  {
    id: 'de4e12af7f28f599-02',
    name: 'King James Version',
    abbreviation: 'KJV',
    apiSource: 'api.bible',
    description: 'Traditional translation widely used in Baptist churches (1611)',
    year: 1611,
    recommended: true
  },
  {
    id: '9879dbb7cfe39e4d-01',
    name: 'World English Bible',
    abbreviation: 'WEB',
    apiSource: 'api.bible',
    description: 'Modern, readable English translation based on ASV',
    recommended: true
  },
  {
    id: '06125adad2d5898a-01',
    name: 'American Standard Version',
    abbreviation: 'ASV',
    apiSource: 'api.bible',
    description: 'Highly accurate literal translation (1901)',
    year: 1901
  },
  {
    id: '01b29f4b342acc35-01',
    name: 'Literal Standard Version',
    abbreviation: 'LSV',
    apiSource: 'api.bible',
    description: 'Modern literal translation with high accuracy'
  },
  {
    id: 'bba9f40183526463-01',
    name: 'Berean Standard Bible',
    abbreviation: 'BSB',
    apiSource: 'api.bible',
    description: 'Contemporary, readable translation free for ministry use'
  }
  // ESV will be added here when approved:
  // {
  //   id: 'esv',
  //   name: 'English Standard Version',
  //   abbreviation: 'ESV',
  //   apiSource: 'esv',
  //   description: 'Popular modern literal translation',
  //   recommended: true
  // }
];

// Helper to get default translation
export const getDefaultTranslation = (): BibleTranslation => {
  return BIBLE_TRANSLATIONS[0]; // KJV as default
};

// Helper to get translation by ID
export const getTranslationById = (id: string): BibleTranslation | undefined => {
  return BIBLE_TRANSLATIONS.find(t => t.id === id);
};

// Helper to get translations by API source
export const getTranslationsBySource = (source: string): BibleTranslation[] => {
  return BIBLE_TRANSLATIONS.filter(t => t.apiSource === source);
};