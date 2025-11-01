export interface BibleLocation {
  work: "Bible";
  book: string;
  chapter: number;
  verse?: number;
}

export interface BibleVerse {
  verseNumber: number;
  hebrewSegments: string[];
  englishSegments: string[];
}

export interface BibleText {
  work: "Bible";
  book: string;
  chapter: number;
  verses: BibleVerse[];
  sefariaRef: string;
  verseCount: number;
}

export interface BibleBook {
  name: string;
  hebrew: string;
  chapters: number;
  sefaria: string;
  slug: string;
}

export interface BibleSection {
  [key: string]: BibleBook[];
}
