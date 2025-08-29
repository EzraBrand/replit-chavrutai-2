// Chapter data utility functions
// This file provides access to chapter information for breadcrumb navigation

import { CHAPTER_DATA } from '@/pages/tractate-contents';

// NEW: JSON-based chapter data cache (will replace CHAPTER_DATA)
const CHAPTER_DATA_CACHE = new Map<string, ChapterInfo[]>();

/**
 * NEW: Preload chapter data from JSON files (async initialization)
 * This function allows us to gradually migrate away from CHAPTER_DATA
 */
export async function preloadChapterData() {
  const tractates = [
    'berakhot', 'shabbat', 'eruvin', 'pesachim', 'yoma', 'sukkah', 'beitza',
    'rosh-hashanah', 'taanit', 'megillah', 'moed-katan', 'chagigah',
    'yevamot', 'ketubot', 'nedarim', 'nazir', 'sotah', 'gittin', 'kiddushin',
    'bava-kamma', 'bava-metzia', 'bava-batra', 'sanhedrin', 'makkot', 
    'shevuot', 'avodah-zarah', 'horayot', 'zevachim', 'menachot', 'chullin',
    'bekhorot', 'arakhin', 'temurah', 'keritot', 'meilah', 'tamid', 'niddah'
  ];

  for (const tractate of tractates) {
    try {
      const module = await import(`../../../../talmud-data/chapters/${tractate}.json`);
      CHAPTER_DATA_CACHE.set(tractate, module.default || module);
    } catch (error) {
      console.warn(`Failed to preload ${tractate}:`, error);
    }
  }
}

/**
 * NEW: Get chapter data from JSON (with fallback to CHAPTER_DATA)
 */
function getChapterData(tractate: string): ChapterInfo[] | null {
  const tractateKey = tractate.toLowerCase().replace(/\s+/g, ' ');
  const jsonKey = tractateKey.replace(/\s+/g, '-');
  
  // Try JSON data first
  if (CHAPTER_DATA_CACHE.has(jsonKey)) {
    return CHAPTER_DATA_CACHE.get(jsonKey)!;
  }
  
  // Fallback to old CHAPTER_DATA
  return CHAPTER_DATA[tractateKey] || null;
}

export interface ChapterInfo {
  number: number;
  englishName: string;
  hebrewName: string;
  startFolio: number;
  startSide: 'a' | 'b';
  endFolio: number;
  endSide: 'a' | 'b';
}

/**
 * Find which chapter a given folio belongs to for a specific tractate
 */
export function findChapterForFolio(
  tractate: string, 
  folio: number, 
  side: 'a' | 'b'
): ChapterInfo | null {
  const chapters = getChapterData(tractate);
  if (!chapters) return null;

  // Convert folio and side to a comparable number (2a = 2.0, 2b = 2.5)
  const folioNumber = folio + (side === 'b' ? 0.5 : 0);

  for (const chapter of chapters) {
    const startNumber = chapter.startFolio + (chapter.startSide === 'b' ? 0.5 : 0);
    const endNumber = chapter.endFolio + (chapter.endSide === 'b' ? 0.5 : 0);
    
    if (folioNumber >= startNumber && folioNumber <= endNumber) {
      return chapter;
    }
  }

  // If no exact match found, find the chapter that starts closest to or before this folio
  let bestMatch: ChapterInfo | null = null;
  for (const chapter of chapters) {
    const startNumber = chapter.startFolio + (chapter.startSide === 'b' ? 0.5 : 0);
    if (startNumber <= folioNumber) {
      if (!bestMatch || startNumber > (bestMatch.startFolio + (bestMatch.startSide === 'b' ? 0.5 : 0))) {
        bestMatch = chapter;
      }
    }
  }

  return bestMatch;
}

/**
 * Get the URL for the first page of a chapter
 */
export function getChapterFirstPageUrl(tractate: string, chapter: ChapterInfo): string {
  const tractateSlug = encodeURIComponent(tractate.toLowerCase());
  const folioSlug = `${chapter.startFolio}${chapter.startSide}`;
  return `/tractate/${tractateSlug}/${folioSlug}`;
}