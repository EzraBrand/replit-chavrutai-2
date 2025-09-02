import type { ChapterOutline } from '@shared/schema';
import sanhedrinOutlineData from '../../../talmud-data/outlines/sanhedrin-10.json';

/**
 * Sanhedrin Chapter 10 outline data loaded from JSON file
 */
export const sanhedrin10Outline: ChapterOutline = sanhedrinOutlineData;

/**
 * Get outline data for Sanhedrin Chapter 10 (Perek Chelek)
 * Now loads from JSON file in talmud-data/outlines/
 */
export async function getSanhedrin10Outline(): Promise<ChapterOutline | null> {
  return sanhedrin10Outline;
}