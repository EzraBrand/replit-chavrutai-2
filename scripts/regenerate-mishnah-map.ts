/**
 * Script to regenerate the Mishnah Map from Sefaria's full CSV
 * Downloads the latest CSV and generates the TypeScript data file
 */

import * as fs from 'fs';
import * as https from 'https';

interface MishnahMapping {
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

function downloadCSV(): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = 'https://raw.githubusercontent.com/Sefaria/Sefaria-Project/master/data/Mishnah%20Map.csv';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', reject);
  });
}

function parseCSV(csvText: string): MishnahMapping[] {
  const lines = csvText.trim().split('\n').slice(1); // Skip header
  const mappings: MishnahMapping[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    
    const [book, chapter, startMishnah, endMishnah, startDaf, startLine, endDaf, endLine] = line.split(',');
    
    if (!book || !chapter) continue;

    // Extract tractate name by removing "Mishnah " prefix
    const tractate = book.replace(/^Mishnah\s+/, '');

    mappings.push({
      book,
      tractate,
      mishnahChapter: parseInt(chapter),
      startMishnah: parseInt(startMishnah),
      endMishnah: parseInt(endMishnah),
      startDaf,
      startLine: parseInt(startLine),
      endDaf,
      endLine: parseInt(endLine)
    });
  }

  return mappings;
}

function generateTypeScriptFile(mappings: MishnahMapping[]): string {
  return `/**
 * Mishnah-Talmud Mapping Data
 * Generated from Sefaria's Mishnah Map CSV
 * Source: https://github.com/Sefaria/Sefaria-Project/blob/master/data/Mishnah%20Map.csv
 * 
 * This file contains ${mappings.length} Mishnah-to-Talmud mappings across all tractates.
 * Generated on: ${new Date().toISOString().split('T')[0]}
 */

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

export const MISHNAH_MAP_DATA: MishnahMapping[] = ${JSON.stringify(mappings, null, 2)};

/**
 * Get the section number for the first Mishnah of a given chapter
 * @param tractate - Tractate name (case-insensitive)
 * @param chapter - Chapter number
 * @param page - Talmud page (e.g., "90a", "2b")
 * @returns Section number or null if not found
 */
export function getMishnahSection(tractate: string, chapter: number, page: string): number | null {
  const normalizedTractate = tractate.toLowerCase();
  const normalizedPage = page.toLowerCase();

  // Find the first mishnah of the given chapter that starts on the given page
  const mapping = MISHNAH_MAP_DATA.find(
    m => 
      m.tractate.toLowerCase() === normalizedTractate &&
      m.mishnahChapter === chapter &&
      m.startMishnah === 1 &&
      m.startDaf.toLowerCase() === normalizedPage
  );

  return mapping ? mapping.startLine : null;
}

/**
 * Get the chapter number for a given page
 * @param tractate - Tractate name (case-insensitive)
 * @param page - Talmud page (e.g., "90a", "2b")
 * @returns Chapter number or null if not found
 */
export function getChapterForPage(tractate: string, page: string): number | null {
  const normalizedTractate = tractate.toLowerCase();
  const normalizedPage = page.toLowerCase();

  const mapping = MISHNAH_MAP_DATA.find(
    m => 
      m.tractate.toLowerCase() === normalizedTractate &&
      m.startDaf.toLowerCase() === normalizedPage &&
      m.startMishnah === 1
  );

  return mapping ? mapping.mishnahChapter : null;
}

/**
 * Get all mappings for a specific tractate
 * @param tractate - Tractate name (case-insensitive)
 * @returns Array of all Mishnah mappings for the tractate
 */
export function getTractateMap(tractate: string): MishnahMapping[] {
  const normalizedTractate = tractate.toLowerCase();
  return MISHNAH_MAP_DATA.filter(
    m => m.tractate.toLowerCase() === normalizedTractate
  );
}

/**
 * Get all unique tractates in the mapping
 * @returns Array of unique tractate names
 */
export function getAllTractates(): string[] {
  const tractates = new Set(MISHNAH_MAP_DATA.map(m => m.tractate));
  return Array.from(tractates).sort();
}
`;
}

// Main execution
async function main() {
  console.log('Downloading Mishnah Map CSV from Sefaria...');
  const csvData = await downloadCSV();
  
  console.log('Parsing CSV data...');
  const mappings = parseCSV(csvData);
  console.log(`Parsed ${mappings.length} Mishnah mappings`);
  
  const tractates = new Set(mappings.map(m => m.tractate));
  console.log(`Found ${tractates.size} unique tractates:`);
  console.log(Array.from(tractates).sort().join(', '));
  
  console.log('\nGenerating TypeScript file...');
  const tsContent = generateTypeScriptFile(mappings);
  
  const outputPath = 'shared/mishnah-map.ts';
  fs.writeFileSync(outputPath, tsContent);
  console.log(`\nSuccessfully wrote ${outputPath}`);
  console.log(`File size: ${(tsContent.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
