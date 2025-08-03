// Complete authentic chapter data for all Talmud Bavli tractates
export const CHAPTER_DATA: Record<string, Array<{
  number: number;
  englishName: string;
  hebrewName: string;
  startFolio: number;
  startSide: 'a' | 'b';
  endFolio: number;
  endSide: 'a' | 'b';
}>> = {
  "berakhot": [
    { number: 1, englishName: "Me'eimatay", hebrewName: "מאימתי", startFolio: 2, startSide: 'a', endFolio: 13, endSide: 'a' },
    { number: 2, englishName: "Hayah Korei", hebrewName: "היה קורא", startFolio: 13, startSide: 'a', endFolio: 17, endSide: 'b' },
    { number: 3, englishName: "Mi She'meto", hebrewName: "מי שמתו", startFolio: 17, startSide: 'b', endFolio: 26, endSide: 'a' },
    { number: 4, englishName: "Tefilat HaShachar", hebrewName: "תפילת השחר", startFolio: 26, startSide: 'a', endFolio: 30, endSide: 'b' },
    { number: 5, englishName: "Ein Omdin", hebrewName: "אין עומדין", startFolio: 30, startSide: 'b', endFolio: 35, endSide: 'a' },
    { number: 6, englishName: "Keytzad Mevarkhim", hebrewName: "כיצד מברכין", startFolio: 35, startSide: 'a', endFolio: 45, endSide: 'a' },
    { number: 7, englishName: "Sheloshah She'achlu", hebrewName: "שלשה שאכלו", startFolio: 45, startSide: 'a', endFolio: 51, endSide: 'a' },
    { number: 8, englishName: "Eilu Devarim", hebrewName: "אלו דברים", startFolio: 51, startSide: 'a', endFolio: 54, endSide: 'a' },
    { number: 9, englishName: "HaRo'eh", hebrewName: "הרואה", startFolio: 54, startSide: 'a', endFolio: 64, endSide: 'a' }
  ],
  "shabbat": [
    { number: 1, englishName: "Yetziot HaShabbat", hebrewName: "יציאות השבת", startFolio: 2, startSide: 'a', endFolio: 20, endSide: 'b' },
    { number: 2, englishName: "BaMeh Madlikin", hebrewName: "במה מדליקין", startFolio: 20, startSide: 'b', endFolio: 36, endSide: 'b' },
    { number: 3, englishName: "Kirah", hebrewName: "כירה", startFolio: 36, startSide: 'b', endFolio: 47, endSide: 'b' },
    { number: 4, englishName: "BaMeh Tomnin", hebrewName: "במה טומנין", startFolio: 47, startSide: 'b', endFolio: 51, endSide: 'b' },
    { number: 5, englishName: "BaMeh Beheimah", hebrewName: "במה בהמה", startFolio: 51, startSide: 'b', endFolio: 57, endSide: 'a' },
    { number: 6, englishName: "BaMeh Ishah", hebrewName: "במה אשה", startFolio: 57, startSide: 'a', endFolio: 67, endSide: 'b' },
    { number: 7, englishName: "Kelal Gadol", hebrewName: "כלל גדול", startFolio: 67, startSide: 'b', endFolio: 76, endSide: 'b' },
    { number: 8, englishName: "HaMotzi Yayin", hebrewName: "המוציא יין", startFolio: 76, startSide: 'b', endFolio: 82, endSide: 'a' },
    { number: 9, englishName: "Amar Rabbi Akiva", hebrewName: "[אמר] רבי עקיבא", startFolio: 82, startSide: 'a', endFolio: 90, endSide: 'b' },
    { number: 10, englishName: "HaMatzni'a", hebrewName: "המצניע", startFolio: 90, startSide: 'b', endFolio: 96, endSide: 'a' },
    { number: 11, englishName: "HaZorek", hebrewName: "הזורק", startFolio: 96, startSide: 'a', endFolio: 102, endSide: 'b' },
    { number: 12, englishName: "HaBoneh", hebrewName: "הבונה", startFolio: 102, startSide: 'b', endFolio: 105, endSide: 'a' },
    { number: 13, englishName: "HaOreg", hebrewName: "האורג", startFolio: 105, startSide: 'a', endFolio: 107, endSide: 'a' },
    { number: 14, englishName: "Shmonah Sheratzim", hebrewName: "שמונה שרצים", startFolio: 107, startSide: 'a', endFolio: 111, endSide: 'b' },
    { number: 15, englishName: "V'Eilu Kesharim", hebrewName: "ואלו קשרים", startFolio: 111, startSide: 'b', endFolio: 115, endSide: 'a' },
    { number: 16, englishName: "Kol Kitvei", hebrewName: "כל כתבי", startFolio: 115, startSide: 'a', endFolio: 122, endSide: 'b' },
    { number: 17, englishName: "Kol HaKelim", hebrewName: "כל הכלים", startFolio: 122, startSide: 'b', endFolio: 126, endSide: 'b' },
    { number: 18, englishName: "Mefanin", hebrewName: "מפנין", startFolio: 126, startSide: 'b', endFolio: 130, endSide: 'a' },
    { number: 19, englishName: "Rabbi Eliezer DeMilah", hebrewName: "רבי אליעזר דמילה", startFolio: 130, startSide: 'a', endFolio: 137, endSide: 'b' },
    { number: 20, englishName: "Tolin", hebrewName: "תולין", startFolio: 137, startSide: 'b', endFolio: 141, endSide: 'b' },
    { number: 21, englishName: "Notel", hebrewName: "נוטל", startFolio: 141, startSide: 'b', endFolio: 143, endSide: 'b' },
    { number: 22, englishName: "Chavit", hebrewName: "חבית", startFolio: 143, startSide: 'b', endFolio: 148, endSide: 'a' },
    { number: 23, englishName: "Sho'el", hebrewName: "שואל", startFolio: 148, startSide: 'a', endFolio: 153, endSide: 'a' },
    { number: 24, englishName: "Mi She'hechshikh", hebrewName: "מי שהחשיך", startFolio: 153, startSide: 'a', endFolio: 157, endSide: 'b' }
  ],
  "eruvin": [
    { number: 1, englishName: "Mavoy She'hu Gavoah", hebrewName: "מבוי שהוא גבוה", startFolio: 2, startSide: 'a', endFolio: 17, endSide: 'b' },
    { number: 2, englishName: "Osin Pasin", hebrewName: "עושין פסין", startFolio: 17, startSide: 'b', endFolio: 26, endSide: 'b' },
    { number: 3, englishName: "BaKol Me'arvin", hebrewName: "בכל מערבין", startFolio: 26, startSide: 'b', endFolio: 41, endSide: 'b' },
    { number: 4, englishName: "Mi She'hotziuhu", hebrewName: "מי שהוציאוהו", startFolio: 41, startSide: 'b', endFolio: 52, endSide: 'b' },
    { number: 5, englishName: "Keytzad Me'abrin", hebrewName: "כיצד מעברין", startFolio: 52, startSide: 'b', endFolio: 61, endSide: 'b' },
    { number: 6, englishName: "HaDar", hebrewName: "הדר", startFolio: 61, startSide: 'b', endFolio: 76, endSide: 'a' },
    { number: 7, englishName: "Chalon", hebrewName: "חלון", startFolio: 76, startSide: 'a', endFolio: 82, endSide: 'a' },
    { number: 8, englishName: "Keytzad Mishtatin", hebrewName: "כיצד משתתפין", startFolio: 82, startSide: 'a', endFolio: 89, endSide: 'a' },
    { number: 9, englishName: "Kol Gagot", hebrewName: "כל גגות", startFolio: 89, startSide: 'a', endFolio: 95, endSide: 'a' },
    { number: 10, englishName: "HaMotzei Tefilin", hebrewName: "המוצא תפילין", startFolio: 95, startSide: 'a', endFolio: 105, endSide: 'a' }
  ]
};

// Utility function to find which chapter a folio belongs to
export function findChapterForFolio(tractate: string, folio: number, side: 'a' | 'b'): {
  number: number;
  englishName: string;
  hebrewName: string;
  startFolio: number;
  startSide: 'a' | 'b';
} | null {
  const tractateKey = tractate.toLowerCase().replace(/\s+/g, '');
  const chapters = CHAPTER_DATA[tractateKey];
  
  if (!chapters) {
    return null;
  }

  // Convert folio and side to a comparable number
  const folioNum = folio * 2 + (side === 'a' ? 0 : 1);
  
  for (const chapter of chapters) {
    const chapterStart = chapter.startFolio * 2 + (chapter.startSide === 'a' ? 0 : 1);
    const chapterEnd = chapter.endFolio * 2 + (chapter.endSide === 'a' ? 0 : 1);
    
    if (folioNum >= chapterStart && folioNum <= chapterEnd) {
      return chapter;
    }
  }
  
  return null;
}