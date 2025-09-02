import type { ChapterOutline } from '../../shared/schema';

/**
 * Dynamically loads outline data for a specific chapter
 * @param tractate - Name of the tractate (lowercase)
 * @param chapter - Chapter number
 * @returns Promise resolving to chapter outline data
 */
export async function loadChapterOutline(tractate: string, chapter: number): Promise<ChapterOutline | null> {
  try {
    const filename = `${tractate.toLowerCase()}-${chapter}.json`;
    const module = await import(/* @vite-ignore */ `./${filename}`);
    return module.default || module;
  } catch (error) {
    console.warn(`Failed to load outline data for ${tractate} chapter ${chapter}`, error);
    return null;
  }
}

/**
 * Loads all available chapter outlines for a tractate
 * @param tractate - Name of the tractate
 * @returns Promise resolving to array of available outlines
 */
export async function loadTractateOutlines(tractate: string): Promise<ChapterOutline[]> {
  // For now, we only have Sanhedrin 10, but this can be expanded
  const availableChapters = tractate.toLowerCase() === 'sanhedrin' ? [10] : [];
  
  const outlines: ChapterOutline[] = [];
  
  for (const chapterNum of availableChapters) {
    const outline = await loadChapterOutline(tractate, chapterNum);
    if (outline) {
      outlines.push(outline);
    }
  }
  
  return outlines;
}

/**
 * Cache for loaded outline data to avoid repeated requests
 */
const outlineCache = new Map<string, ChapterOutline>();

/**
 * Cached version of loadChapterOutline for better performance
 * @param tractate - Name of the tractate (lowercase)
 * @param chapter - Chapter number
 * @returns Promise resolving to cached or freshly loaded outline data
 */
export async function getCachedChapterOutline(tractate: string, chapter: number): Promise<ChapterOutline | null> {
  const cacheKey = `${tractate.toLowerCase()}-${chapter}`;
  
  if (outlineCache.has(cacheKey)) {
    return outlineCache.get(cacheKey)!;
  }

  const outline = await loadChapterOutline(tractate, chapter);
  if (outline) {
    outlineCache.set(cacheKey, outline);
  }
  return outline;
}