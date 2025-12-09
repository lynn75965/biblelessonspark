// SSOT MASTER: Bible book names for autocomplete
// Used by: EnhanceLessonForm Bible passage input

export const BIBLE_BOOKS = [
  // Old Testament
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  // New Testament
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation"
] as const;

export type BibleBook = typeof BIBLE_BOOKS[number];

/**
 * Find Bible books matching a prefix (case-insensitive)
 * @param prefix - User input to match against book names
 * @param limit - Maximum number of suggestions to return
 * @returns Array of matching book names
 */
export function findMatchingBooks(prefix: string, limit: number = 5, minChars: number = 2): string[] {
  if (!prefix || prefix.length < minChars) return [];
  const lowerPrefix = prefix.toLowerCase();
  return BIBLE_BOOKS
    .filter(book => book.toLowerCase().startsWith(lowerPrefix))
    .slice(0, limit);
}