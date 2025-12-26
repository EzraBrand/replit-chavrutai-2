import { getBookBySlug } from "@shared/bible-books";
import { numberToHebrewGematria } from "@/lib/external-links";

export interface BibleReference {
  book: string;
  chapter: number;
  verse?: number;
}

export interface BibleExternalLink {
  name: string;
  url: string;
  type: 'verse' | 'chapter';
  description?: string;
}

const ALHATORAH_BOOK_NAMES: Record<string, string> = {
  "genesis": "Bereshit",
  "exodus": "Shemot",
  "leviticus": "Vayikra",
  "numbers": "Bemidbar",
  "deuteronomy": "Devarim",
  "joshua": "Yehoshua",
  "judges": "Shofetim",
  "i-samuel": "Shemuel_I",
  "ii-samuel": "Shemuel_II",
  "i-kings": "Melakhim_I",
  "ii-kings": "Melakhim_II",
  "isaiah": "Yeshayahu",
  "jeremiah": "Yirmeyahu",
  "ezekiel": "Yechezkel",
  "hosea": "Hoshea",
  "joel": "Yoel",
  "amos": "Amos",
  "obadiah": "Ovadyah",
  "jonah": "Yonah",
  "micah": "Mikhah",
  "nahum": "Nachum",
  "habakkuk": "Chavakkuk",
  "zephaniah": "Tzefanyah",
  "haggai": "Chaggai",
  "zechariah": "Zekharyah",
  "malachi": "Malakhi",
  "psalms": "Tehillim",
  "proverbs": "Mishlei",
  "job": "Iyyov",
  "song-of-songs": "Shir_HaShirim",
  "ruth": "Rut",
  "lamentations": "Eikhah",
  "ecclesiastes": "Kohelet",
  "esther": "Esther",
  "daniel": "Daniel",
  "ezra": "Ezra",
  "nehemiah": "Nechemyah",
  "i-chronicles": "Divrei_HaYamim_I",
  "ii-chronicles": "Divrei_HaYamim_II",
};

function getAlHaTorahBookName(slug: string): string {
  return ALHATORAH_BOOK_NAMES[slug.toLowerCase()] || slug;
}

function getSefariaBookName(slug: string): string {
  const book = getBookBySlug(slug);
  return book ? book.sefaria : slug;
}

function getHebrewBookName(slug: string): string {
  const book = getBookBySlug(slug);
  return book ? book.hebrew : slug;
}

export function getBibleSefariaLink(ref: BibleReference): string {
  const { book, chapter, verse } = ref;
  const sefariaName = getSefariaBookName(book);
  if (verse !== undefined) {
    return `https://www.sefaria.org.il/${sefariaName}.${chapter}.${verse}`;
  }
  return `https://www.sefaria.org.il/${sefariaName}.${chapter}`;
}

export function getBibleAlHaTorahLink(ref: BibleReference): string {
  const { book, chapter, verse } = ref;
  const alHaTorahName = getAlHaTorahBookName(book);
  if (verse !== undefined) {
    return `https://mg.alhatorah.org/Full/${alHaTorahName}/${chapter}.${verse}`;
  }
  return `https://mg.alhatorah.org/Full/${alHaTorahName}/${chapter}`;
}

export function getBibleWikisourceChapterLink(ref: BibleReference): string {
  const { book, chapter } = ref;
  const hebrewName = getHebrewBookName(book);
  if (!hebrewName) return '';
  
  const hebrewChapter = numberToHebrewGematria(chapter);
  const pageName = `${hebrewName}_${hebrewChapter}`;
  return `https://he.wikisource.org/wiki/${encodeURIComponent(pageName)}`;
}

export function getBibleWikisourceVerseLink(ref: BibleReference): string {
  const { book, chapter, verse } = ref;
  if (verse === undefined) return '';
  
  const hebrewName = getHebrewBookName(book);
  if (!hebrewName) return '';
  
  const hebrewChapter = numberToHebrewGematria(chapter);
  const hebrewVerse = numberToHebrewGematria(verse);
  const pageName = `קטגוריה:${hebrewName}_${hebrewChapter}_${hebrewVerse}`;
  return `https://he.wikisource.org/wiki/${encodeURIComponent(pageName)}`;
}

export function getAllBibleExternalLinks(ref: BibleReference): BibleExternalLink[] {
  const links: BibleExternalLink[] = [];
  
  if (ref.verse !== undefined) {
    links.push({
      name: 'Sefaria',
      url: getBibleSefariaLink(ref),
      type: 'verse',
      description: 'Sefaria.org.il - verse-level link'
    });
    
    links.push({
      name: 'Al HaTorah',
      url: getBibleAlHaTorahLink(ref),
      type: 'verse',
      description: 'Al HaTorah Mikraot Gedolot - verse-level link'
    });
    
    const wikisourceVerseUrl = getBibleWikisourceVerseLink(ref);
    if (wikisourceVerseUrl) {
      links.push({
        name: 'Wikisource',
        url: wikisourceVerseUrl,
        type: 'verse',
        description: 'Hebrew Wikisource - verse-level link'
      });
    }
  }
  
  const chapterRef = { ...ref, verse: undefined };
  
  links.push({
    name: 'Sefaria',
    url: getBibleSefariaLink(chapterRef),
    type: 'chapter',
    description: 'Sefaria.org.il - chapter-level link'
  });
  
  links.push({
    name: 'Al HaTorah',
    url: getBibleAlHaTorahLink(chapterRef),
    type: 'chapter',
    description: 'Al HaTorah Mikraot Gedolot - chapter-level link'
  });
  
  const wikisourceChapterUrl = getBibleWikisourceChapterLink(ref);
  if (wikisourceChapterUrl) {
    links.push({
      name: 'Wikisource',
      url: wikisourceChapterUrl,
      type: 'chapter',
      description: 'Hebrew Wikisource - full chapter text'
    });
  }
  
  return links;
}

export function getBibleVerseLinks(ref: BibleReference): BibleExternalLink[] {
  return getAllBibleExternalLinks(ref).filter(link => link.type === 'verse');
}

export function getBibleChapterLinks(ref: BibleReference): BibleExternalLink[] {
  return getAllBibleExternalLinks(ref).filter(link => link.type === 'chapter');
}

export { numberToHebrewGematria };
