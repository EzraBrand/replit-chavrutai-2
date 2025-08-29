import { useState, useEffect } from 'react';
import type { ChapterInfo } from '../../../talmud-data/index';
import { loadTractateChapters } from '../../../talmud-data/index';

// Global cache for chapter data
const chapterDataCache = new Map<string, ChapterInfo[]>();

/**
 * Hook for loading and accessing chapter data for tractates
 */
export function useChapterData(tractate?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount if tractate is specified
  useEffect(() => {
    if (tractate && !chapterDataCache.has(tractate.toLowerCase())) {
      loadChapterDataForTractate(tractate);
    }
  }, [tractate]);

  const loadChapterDataForTractate = async (tractateKey: string) => {
    const cacheKey = tractateKey.toLowerCase();
    if (chapterDataCache.has(cacheKey)) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const chapters = await loadTractateChapters(cacheKey);
      chapterDataCache.set(cacheKey, chapters);
    } catch (err) {
      setError(`Failed to load chapter data for ${tractateKey}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronous access to cached chapter data
  const getChapterData = (tractateKey: string): ChapterInfo[] | null => {
    const cacheKey = tractateKey.toLowerCase();
    return chapterDataCache.get(cacheKey) || null;
  };

  // Find chapter for folio (synchronous, uses cached data)
  const findChapterForFolio = (
    tractateKey: string, 
    folio: number, 
    side: 'a' | 'b'
  ): ChapterInfo | null => {
    const chapters = getChapterData(tractateKey);
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
  };

  return {
    isLoading,
    error,
    loadChapterDataForTractate,
    getChapterData,
    findChapterForFolio
  };
}

/**
 * Get the URL for the first page of a chapter
 */
export function getChapterFirstPageUrl(tractate: string, chapter: ChapterInfo): string {
  const tractateSlug = encodeURIComponent(tractate.toLowerCase());
  const folioSlug = `${chapter.startFolio}${chapter.startSide}`;
  return `/tractate/${tractateSlug}/${folioSlug}`;
}