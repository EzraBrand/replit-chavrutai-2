/**
 * Mishnah-Talmud Mapping Data
 * Generated from Sefaria's Mishnah Map CSV
 * Source: https://github.com/Sefaria/Sefaria-Project/blob/master/data/Mishnah%20Map.csv
 * 
 * This file provides utilities to access 2390 Mishnah-to-Talmud mappings across all tractates.
 * Data is stored in data/mishnah-map.json
 * Generated on: 2025-11-22
 */

import mishnahMapData from '../data/mishnah-map.json';
import { SEDER_TRACTATES } from './tractates';

export interface MishnahMapping {
  book: string;
  tractate: string;
  mishnahChapter: number;
  startMishnah: number;
  endMishnah: number;
  startDaf: string;
  startLine: number;
  endDaf: string;
  endLine: number;
}

export const MISHNAH_MAP_DATA: MishnahMapping[] = mishnahMapData as MishnahMapping[];

/**
 * Traditional Talmudic tractate order (by Seder)
 * Used for consistent ordering throughout the application
 */
export const TRADITIONAL_TRACTATE_ORDER = [
  ...SEDER_TRACTATES.zeraim.map(t => t.name),
  ...SEDER_TRACTATES.moed.map(t => t.name),
  ...SEDER_TRACTATES.nashim.map(t => t.name),
  ...SEDER_TRACTATES.nezikin.map(t => t.name),
  ...SEDER_TRACTATES.kodashim.map(t => t.name),
  ...SEDER_TRACTATES.tohorot.map(t => t.name)
] as const;

/**
 * Get all unique tractate names from the Mishnah map data
 * @returns Array of tractate names in traditional order
 */
export function getAllTractates(): string[] {
  const uniqueTractates = new Set(MISHNAH_MAP_DATA.map(entry => entry.tractate));
  const tractateArray = Array.from(uniqueTractates);
  
  // Sort according to traditional order
  return tractateArray.sort((a, b) => {
    const indexA = TRADITIONAL_TRACTATE_ORDER.indexOf(a as any);
    const indexB = TRADITIONAL_TRACTATE_ORDER.indexOf(b as any);
    
    // If both found, sort by order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one found, it comes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // If neither found, sort alphabetically
    return a.localeCompare(b);
  });
}

/**
 * Find the earliest Mishnah section on a specific page of a tractate chapter
 * This is used to navigate to the correct section when clicking chapter first page links
 * 
 * @param tractate - The tractate name (case-insensitive)
 * @param chapter - The chapter number
 * @param page - The page/folio identifier (e.g., "2a", "17b")
 * @returns The section number (startLine) of the earliest Mishnah on this page, or null if none found
 */
export function getMishnahSection(tractate: string, chapter: number, page: string): number | null {
  const normalizedTractate = tractate.toLowerCase();
  const normalizedPage = page.toLowerCase();

  // Find all Mishnah entries for this chapter on this page
  const mappings = MISHNAH_MAP_DATA.filter(
    m => 
      m.tractate.toLowerCase() === normalizedTractate &&
      m.mishnahChapter === chapter &&
      m.startDaf.toLowerCase() === normalizedPage
  );

  // If no mappings found, return null
  if (mappings.length === 0) return null;

  // Return the earliest section (lowest startLine) on this page
  const earliest = mappings.reduce((min, current) => 
    current.startLine < min.startLine ? current : min
  );

  return earliest.startLine;
}
