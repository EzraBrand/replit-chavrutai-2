// Central barrel export for all Talmud data loading utilities
// This file makes imports cleaner: import { loadTractateChapters } from '@/talmud-data'

// Chapter data loaders
export {
  loadTractateChapters,
  loadAllChapterData,
  getCachedTractateChapters
} from './chapters/loader';

// Outline data loaders  
export {
  loadChapterOutline,
  loadTractateOutlines,
  getCachedChapterOutline
} from './outlines/loader';

// Type exports for convenience
export type { ChapterInfo, ChapterOutline } from '../shared/schema';