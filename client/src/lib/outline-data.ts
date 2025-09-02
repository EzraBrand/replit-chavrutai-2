import type { ChapterOutline } from '@shared/schema';
import { loadChapterOutline } from '../../../talmud-data/outlines/loader';

/**
 * Get outline data for Sanhedrin Chapter 10 (Perek Chelek)
 * Now loads from JSON file in talmud-data/outlines/
 */
export async function getSanhedrin10Outline(): Promise<ChapterOutline | null> {
  return await loadChapterOutline('sanhedrin', 10);
}

// Legacy export for backward compatibility - loads dynamically
let _cachedOutline: ChapterOutline | null = null;
export const sanhedrin10Outline = new Proxy({} as ChapterOutline, {
  get(target, prop) {
    if (!_cachedOutline) {
      // Load synchronously for immediate access (will be cached)
      import('../../../talmud-data/outlines/sanhedrin-10.json').then(module => {
        _cachedOutline = module.default || module;
      });
      // Return empty structure while loading
      return prop === 'entries' ? [] : prop === 'tractate' ? 'Sanhedrin' : prop === 'chapter' ? 10 : '';
    }
    return _cachedOutline[prop as keyof ChapterOutline];
  }
});