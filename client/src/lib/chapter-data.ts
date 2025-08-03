// Chapter data utility functions
// This file provides access to chapter information for breadcrumb navigation

import { CHAPTER_DATA } from '@/pages/tractate-contents';

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
  const tractateKey = tractate.toLowerCase().replace(/\s+/g, ' ');
  
  const chapters = CHAPTER_DATA[tractateKey];
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