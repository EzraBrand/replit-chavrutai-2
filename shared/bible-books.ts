/**
 * Bible (Tanach) books configuration
 * Contains canonical list of all 24 books with Hebrew names and chapter counts
 */

export interface BibleBook {
  name: string;
  hebrew: string;
  chapters: number;
  sefaria: string;
  slug: string;
}

export const TORAH_BOOKS: BibleBook[] = [
  { name: "Genesis", hebrew: "בראשית", chapters: 50, sefaria: "Genesis", slug: "genesis" },
  { name: "Exodus", hebrew: "שמות", chapters: 40, sefaria: "Exodus", slug: "exodus" },
  { name: "Leviticus", hebrew: "ויקרא", chapters: 27, sefaria: "Leviticus", slug: "leviticus" },
  { name: "Numbers", hebrew: "במדבר", chapters: 36, sefaria: "Numbers", slug: "numbers" },
  { name: "Deuteronomy", hebrew: "דברים", chapters: 34, sefaria: "Deuteronomy", slug: "deuteronomy" },
];

export const NEVIIM_BOOKS: BibleBook[] = [
  { name: "Joshua", hebrew: "יהושע", chapters: 24, sefaria: "Joshua", slug: "joshua" },
  { name: "Judges", hebrew: "שופטים", chapters: 21, sefaria: "Judges", slug: "judges" },
  { name: "I Samuel", hebrew: "שמואל א", chapters: 31, sefaria: "I Samuel", slug: "i-samuel" },
  { name: "II Samuel", hebrew: "שמואל ב", chapters: 24, sefaria: "II Samuel", slug: "ii-samuel" },
  { name: "I Kings", hebrew: "מלכים א", chapters: 22, sefaria: "I Kings", slug: "i-kings" },
  { name: "II Kings", hebrew: "מלכים ב", chapters: 25, sefaria: "II Kings", slug: "ii-kings" },
  { name: "Isaiah", hebrew: "ישעיהו", chapters: 66, sefaria: "Isaiah", slug: "isaiah" },
  { name: "Jeremiah", hebrew: "ירמיהו", chapters: 52, sefaria: "Jeremiah", slug: "jeremiah" },
  { name: "Ezekiel", hebrew: "יחזקאל", chapters: 48, sefaria: "Ezekiel", slug: "ezekiel" },
  { name: "Hosea", hebrew: "הושע", chapters: 14, sefaria: "Hosea", slug: "hosea" },
  { name: "Joel", hebrew: "יואל", chapters: 4, sefaria: "Joel", slug: "joel" },
  { name: "Amos", hebrew: "עמוס", chapters: 9, sefaria: "Amos", slug: "amos" },
  { name: "Obadiah", hebrew: "עובדיה", chapters: 1, sefaria: "Obadiah", slug: "obadiah" },
  { name: "Jonah", hebrew: "יונה", chapters: 4, sefaria: "Jonah", slug: "jonah" },
  { name: "Micah", hebrew: "מיכה", chapters: 7, sefaria: "Micah", slug: "micah" },
  { name: "Nahum", hebrew: "נחום", chapters: 3, sefaria: "Nahum", slug: "nahum" },
  { name: "Habakkuk", hebrew: "חבקוק", chapters: 3, sefaria: "Habakkuk", slug: "habakkuk" },
  { name: "Zephaniah", hebrew: "צפניה", chapters: 3, sefaria: "Zephaniah", slug: "zephaniah" },
  { name: "Haggai", hebrew: "חגי", chapters: 2, sefaria: "Haggai", slug: "haggai" },
  { name: "Zechariah", hebrew: "זכריה", chapters: 14, sefaria: "Zechariah", slug: "zechariah" },
  { name: "Malachi", hebrew: "מלאכי", chapters: 3, sefaria: "Malachi", slug: "malachi" },
];

export const KETUVIM_BOOKS: BibleBook[] = [
  { name: "Psalms", hebrew: "תהילים", chapters: 150, sefaria: "Psalms", slug: "psalms" },
  { name: "Proverbs", hebrew: "משלי", chapters: 31, sefaria: "Proverbs", slug: "proverbs" },
  { name: "Job", hebrew: "איוב", chapters: 42, sefaria: "Job", slug: "job" },
  { name: "Song of Songs", hebrew: "שיר השירים", chapters: 8, sefaria: "Song of Songs", slug: "song-of-songs" },
  { name: "Ruth", hebrew: "רות", chapters: 4, sefaria: "Ruth", slug: "ruth" },
  { name: "Lamentations", hebrew: "איכה", chapters: 5, sefaria: "Lamentations", slug: "lamentations" },
  { name: "Ecclesiastes", hebrew: "קהלת", chapters: 12, sefaria: "Ecclesiastes", slug: "ecclesiastes" },
  { name: "Esther", hebrew: "אסתר", chapters: 10, sefaria: "Esther", slug: "esther" },
  { name: "Daniel", hebrew: "דניאל", chapters: 12, sefaria: "Daniel", slug: "daniel" },
  { name: "Ezra", hebrew: "עזרא", chapters: 10, sefaria: "Ezra", slug: "ezra" },
  { name: "Nehemiah", hebrew: "נחמיה", chapters: 13, sefaria: "Nehemiah", slug: "nehemiah" },
  { name: "I Chronicles", hebrew: "דברי הימים א", chapters: 29, sefaria: "I Chronicles", slug: "i-chronicles" },
  { name: "II Chronicles", hebrew: "דברי הימים ב", chapters: 36, sefaria: "II Chronicles", slug: "ii-chronicles" },
];

export const ALL_BIBLE_BOOKS: BibleBook[] = [
  ...TORAH_BOOKS,
  ...NEVIIM_BOOKS,
  ...KETUVIM_BOOKS,
];

export const BIBLE_SECTIONS = {
  Torah: TORAH_BOOKS,
  "Nevi'im": NEVIIM_BOOKS,
  Ketuvim: KETUVIM_BOOKS,
};

/**
 * Check if a book name is valid
 */
export function isValidBook(bookName: string): boolean {
  const normalizedInput = bookName.toLowerCase().replace(/\s+/g, '-');
  return ALL_BIBLE_BOOKS.some(
    book => book.slug === normalizedInput || 
            book.name.toLowerCase() === bookName.toLowerCase() ||
            book.sefaria.toLowerCase() === bookName.toLowerCase()
  );
}

/**
 * Normalize book name to match Sefaria API format
 */
export function normalizeSefariaBookName(bookName: string): string {
  const normalizedInput = bookName.toLowerCase().replace(/\s+/g, '-');
  const book = ALL_BIBLE_BOOKS.find(
    b => b.slug === normalizedInput || 
         b.name.toLowerCase() === bookName.toLowerCase() ||
         b.sefaria.toLowerCase() === bookName.toLowerCase()
  );
  
  return book ? book.sefaria : bookName;
}

/**
 * Get book by slug
 */
export function getBookBySlug(slug: string): BibleBook | undefined {
  return ALL_BIBLE_BOOKS.find(book => book.slug === slug.toLowerCase());
}

/**
 * Get chapter count for a book
 */
export function getChapterCount(bookName: string): number {
  const book = ALL_BIBLE_BOOKS.find(
    b => b.slug === bookName.toLowerCase() || 
         b.name.toLowerCase() === bookName.toLowerCase() ||
         b.sefaria.toLowerCase() === bookName.toLowerCase()
  );
  
  return book ? book.chapters : 0;
}
