// Bible Version Configuration
// This file manages all available Bible versions across different APIs

export interface BibleVersion {
  id: string;           // API-specific ID
  name: string;         // Display name
  abbreviation: string; // Short code (KJV, ESV, etc.)
  apiSource: 'api.bible' | 'esv' | 'net' | 'other';
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: 'de4e12af7f28f599-02',
    name: 'King James Version',
    abbreviation: 'KJV',
    apiSource: 'api.bible'
  },
  {
    id: '9879dbb7cfe39e4d-01',
    name: 'World English Bible',
    abbreviation: 'WEB',
    apiSource: 'api.bible'
  },
  {
    id: '06125adad2d5898a-01',
    name: 'American Standard Version',
    abbreviation: 'ASV',
    apiSource: 'api.bible'
  },
  {
    id: '01b29f4b342acc35-01',
    name: 'Literal Standard Version',
    abbreviation: 'LSV',
    apiSource: 'api.bible'
  },
  {
    id: 'bba9f40183526463-01',
    name: 'Berean Standard Bible',
    abbreviation: 'BSB',
    apiSource: 'api.bible'
  }
  // To add ESV when approved, just add this:
  // {
  //   id: 'esv',
  //   name: 'English Standard Version',
  //   abbreviation: 'ESV',
  //   apiSource: 'esv'
  // }
];

export const getDefaultVersion = (): BibleVersion => BIBLE_VERSIONS[0];

export const getVersionById = (id: string): BibleVersion | undefined => 
  BIBLE_VERSIONS.find(v => v.id === id);
