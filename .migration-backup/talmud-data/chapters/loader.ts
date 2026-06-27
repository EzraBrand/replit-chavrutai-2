import type { ChapterInfo } from '../../shared/schema';

/**
 * Dynamically loads chapter data for a specific tractate
 * @param tractate - Name of the tractate (lowercase)
 * @returns Promise resolving to array of chapter information
 */
export async function loadTractateChapters(tractate: string): Promise<ChapterInfo[]> {
  try {
    // Dynamic import of the specific tractate's chapter data
    const module = await import(`./${tractate.toLowerCase()}.json`);
    return module.default || module;
  } catch (error) {
    console.warn(`Failed to load chapter data for tractate: ${tractate}`, error);
    return [];
  }
}

/**
 * Loads all available tractate chapter data
 * @returns Promise resolving to Record of tractate name -> chapters
 */
export async function loadAllChapterData(): Promise<Record<string, ChapterInfo[]>> {
  // List of available tractates (extracted from existing JSON files)
  const availableTractates = [
    'berakhot', 'shabbat', 'eruvin', 'pesachim', 'yoma', 'sukkah', 'beitza',
    'rosh-hashanah', 'taanit', 'megillah', 'moed-katan', 'chagigah',
    'yevamot', 'ketubot', 'nedarim', 'nazir', 'sotah', 'gittin', 'kiddushin',
    'bava-kamma', 'bava-metzia', 'bava-batra', 'sanhedrin', 'makkot', 
    'shevuot', 'avodah-zarah', 'horayot', 'zevachim', 'menachot', 'chullin',
    'bekhorot', 'arakhin', 'temurah', 'keritot', 'meilah', 'tamid', 'niddah'
  ];

  const chapterData: Record<string, ChapterInfo[]> = {};

  for (const tractate of availableTractates) {
    chapterData[tractate] = await loadTractateChapters(tractate);
  }

  return chapterData;
}

/**
 * Cache for loaded chapter data to avoid repeated requests
 */
const chapterCache = new Map<string, ChapterInfo[]>();

/**
 * Cached version of loadTractateChapters for better performance
 * @param tractate - Name of the tractate (lowercase)
 * @returns Promise resolving to cached or freshly loaded chapter data
 */
export async function getCachedTractateChapters(tractate: string): Promise<ChapterInfo[]> {
  const cacheKey = tractate.toLowerCase();
  
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey)!;
  }

  const chapters = await loadTractateChapters(tractate);
  chapterCache.set(cacheKey, chapters);
  return chapters;
}