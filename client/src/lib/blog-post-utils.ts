/**
 * Utility functions for working with blog post Talmud locations
 */

/**
 * Convert blog post location to full Sefaria URL
 * Input: "Berakhot.7a.5-22"
 * Output: "https://www.sefaria.org/Berakhot.7a.5-22"
 */
export function locationToSefariaUrl(location: string): string {
  return `https://www.sefaria.org/${location}`;
}

/**
 * Format location for human-readable display
 * Input: "Berakhot.7a.5-22"
 * Output: "Berakhot 7a:5-22"
 * Input: "Berakhot.7a.23-7b.25"
 * Output: "Berakhot 7a:23-7b:25"
 */
export function formatLocationDisplay(location: string): string {
  // Replace first dot with space, subsequent dots with colons
  return location.replace('.', ' ').replace(/\./g, ':');
}

/**
 * Extract tractate name from location
 * Input: "Berakhot.7a.5-22"
 * Output: "Berakhot"
 */
export function extractTractate(location: string): string {
  return location.split('.')[0];
}

/**
 * Validate location format
 * Returns true if format matches expected patterns
 */
export function isValidLocation(location: string): boolean {
  // Cross-page range: Tractate.PageA.SectionA-PageB.SectionB
  const crossPagePattern = /^[^.]+\.\d+[ab]\.\d+-\d+[ab]\.\d+$/;
  // Same-page range: Tractate.Page.Section-Section
  const samePagePattern = /^[^.]+\.\d+[ab]\.\d+-\d+$/;
  // Single section: Tractate.Page.Section
  const singlePattern = /^[^.]+\.\d+[ab]\.\d+$/;
  
  return crossPagePattern.test(location) || 
         samePagePattern.test(location) || 
         singlePattern.test(location);
}

/**
 * Extract basic components (for display/filtering only)
 */
export interface LocationComponents {
  tractate: string;
  startPage: string;
  displayText: string;
}

export function parseLocationBasic(location: string): LocationComponents {
  const parts = location.split('.');
  return {
    tractate: parts[0],
    startPage: parts[1] || '',
    displayText: formatLocationDisplay(location)
  };
}
