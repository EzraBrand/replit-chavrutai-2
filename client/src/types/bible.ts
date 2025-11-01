export interface BibleLocation {
  work: "Bible";
  book: string;
  chapter: number;
  verse?: number;
}

export interface BibleText {
  work: "Bible";
  book: string;
  chapter: number;
  hebrewText: string;
  englishText: string;
  hebrewVerses: string[];
  englishVerses: string[];
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
