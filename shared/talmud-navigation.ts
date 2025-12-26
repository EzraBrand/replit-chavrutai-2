import { SEDER_TRACTATES, getTractateSlug } from './tractates';

export interface TalmudPage {
  tractate: string;
  folio: number;
  side: 'a' | 'b';
}

export interface TractateInfo {
  name: string;
  folios: number;
  lastSide: 'a' | 'b';
  seder: string;
}

const tractateInfoCache = new Map<string, TractateInfo | null>();

/**
 * Get tractate info from SEDER_TRACTATES by name
 * Handles various input formats: display name, slug, or Sefaria name
 * Results are cached for performance
 */
export function getTractateInfo(tractate: string): TractateInfo | null {
  const slug = getTractateSlug(tractate);
  
  if (tractateInfoCache.has(slug)) {
    return tractateInfoCache.get(slug)!;
  }
  
  for (const [sederName, tractates] of Object.entries(SEDER_TRACTATES)) {
    for (const t of tractates) {
      if (getTractateSlug(t.name) === slug) {
        const info: TractateInfo = { 
          name: t.name, 
          folios: t.folios, 
          lastSide: t.lastSide,
          seder: sederName
        };
        tractateInfoCache.set(slug, info);
        return info;
      }
    }
  }
  
  tractateInfoCache.set(slug, null);
  return null;
}

/**
 * Check if a specific page (tractate + folio + side) is valid and has content
 */
export function isValidPage(tractate: string, folio: number, side: 'a' | 'b'): boolean {
  const info = getTractateInfo(tractate);
  if (!info) return false;
  
  if (folio < 2 || folio > info.folios) return false;
  
  if (folio === info.folios && side === 'b' && info.lastSide === 'a') {
    return false;
  }
  
  return true;
}

/**
 * Check if a page is the first page of its tractate (2a)
 */
export function isFirstPage(page: TalmudPage): boolean {
  return page.folio === 2 && page.side === 'a';
}

/**
 * Check if a page is the last valid page of its tractate
 */
export function isLastPage(page: TalmudPage): boolean {
  const info = getTractateInfo(page.tractate);
  if (!info) return false;
  
  if (page.folio === info.folios) {
    return page.side === info.lastSide;
  }
  
  return false;
}

/**
 * Get the next valid page in the tractate
 * Returns null if at the last page
 */
export function getNextPage(page: TalmudPage): TalmudPage | null {
  const info = getTractateInfo(page.tractate);
  if (!info) return null;
  
  if (isLastPage(page)) {
    return null;
  }
  
  if (page.side === 'a') {
    return { tractate: page.tractate, folio: page.folio, side: 'b' };
  } else {
    return { tractate: page.tractate, folio: page.folio + 1, side: 'a' };
  }
}

/**
 * Get the previous valid page in the tractate
 * Returns null if at the first page (2a)
 */
export function getPreviousPage(page: TalmudPage): TalmudPage | null {
  if (isFirstPage(page)) {
    return null;
  }
  
  if (page.side === 'b') {
    return { tractate: page.tractate, folio: page.folio, side: 'a' };
  } else {
    return { tractate: page.tractate, folio: page.folio - 1, side: 'b' };
  }
}

/**
 * Get the maximum valid folio number for a tractate
 */
export function getMaxFolio(tractate: string): number {
  const info = getTractateInfo(tractate);
  return info?.folios ?? 150;
}

/**
 * Get the last valid side for the final folio of a tractate
 */
export function getLastSide(tractate: string): 'a' | 'b' {
  const info = getTractateInfo(tractate);
  return info?.lastSide ?? 'b';
}

/**
 * Get the first page of a tractate
 */
export function getFirstPage(tractate: string): TalmudPage | null {
  const info = getTractateInfo(tractate);
  if (!info) return null;
  return { tractate: info.name, folio: 2, side: 'a' };
}

/**
 * Get the last valid page of a tractate
 */
export function getLastPageOfTractate(tractate: string): TalmudPage | null {
  const info = getTractateInfo(tractate);
  if (!info) return null;
  return { tractate: info.name, folio: info.folios, side: info.lastSide };
}

/**
 * Calculate total number of pages in a tractate
 */
export function getTotalPages(tractate: string): number {
  const info = getTractateInfo(tractate);
  if (!info) return 0;
  
  return (info.folios - 1) * 2 + (info.lastSide === 'b' ? 2 : 1);
}

/**
 * Format a page as a string (e.g., "64a")
 */
export function formatPage(page: TalmudPage): string {
  return `${page.folio}${page.side}`;
}

/**
 * Parse a folio string (e.g., "64a") into components
 */
export function parseFolio(folioStr: string): { folio: number; side: 'a' | 'b' } | null {
  const match = folioStr.match(/^(\d+)([ab])$/);
  if (!match) return null;
  
  return {
    folio: parseInt(match[1], 10),
    side: match[2] as 'a' | 'b'
  };
}

/**
 * Generator to iterate through all valid pages of a tractate
 */
export function* iterateTractatePages(tractate: string): Generator<TalmudPage> {
  const info = getTractateInfo(tractate);
  if (!info) return;
  
  for (let folio = 2; folio <= info.folios; folio++) {
    yield { tractate: info.name, folio, side: 'a' };
    
    if (folio < info.folios || info.lastSide === 'b') {
      yield { tractate: info.name, folio, side: 'b' };
    }
  }
}

/**
 * Get all tractates as a flat array with their info
 */
export function getAllTractates(): TractateInfo[] {
  const tractates: TractateInfo[] = [];
  
  for (const [sederName, sederTractates] of Object.entries(SEDER_TRACTATES)) {
    for (const t of sederTractates) {
      tractates.push({
        name: t.name,
        folios: t.folios,
        lastSide: t.lastSide,
        seder: sederName
      });
    }
  }
  
  return tractates;
}
