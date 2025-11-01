/**
 * Bible text processing utilities
 * Handles Hebrew cantillation splitting and English formatting for Bible texts
 */

/**
 * Split Hebrew verse by specific cantillation marks
 * CRITICAL: Split by these two marks only (from אִ֔ישׁ and יִשְׂרָאֵ֑ל):
 * - U+0591 (֑) - Etnahta
 * - U+0594 (֔) - Zaqef Qatan
 */
function splitHebrewByCantillation(verse: string): string[] {
  if (!verse) return [];
  
  // Split by Etnahta (֑) and Zaqef Qatan (֔) only
  const cantillationSplitPattern = /[\u0591\u0594]/;
  
  // Split the verse at these marks
  const segments = verse.split(cantillationSplitPattern);
  
  // Clean and filter empty segments
  return segments
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Strip HTML tags and footnotes from text
 */
function stripHTML(text: string): string {
  if (!text) return '';
  
  // First remove Sefaria footnotes entirely (content between <i class="footnote"> and </i>)
  let cleaned = text.replace(/<i class="footnote">.*?<\/i>/g, '');
  
  // Then remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Clean up any double spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Remove ALL nikud and cantillation marks from Hebrew
 * Unicode ranges:
 * - Nikud: \u05B0-\u05BC, \u05C1-\u05C2, \u05C4-\u05C7
 * - Cantillation: \u0591-\u05AF, \u05BD, \u05BF, \u05C0, \u05C3
 */
function removeCantillationAndNikud(hebrewText: string): string {
  if (!hebrewText) return '';
  
  // First strip any HTML tags that Sefaria might include
  const noHTML = stripHTML(hebrewText);
  
  // Then remove all nikud and cantillation marks
  return noHTML.replace(/[\u0591-\u05C7]/g, '');
}

/**
 * Process Hebrew verse: FIRST split by cantillation, THEN remove marks
 * This is the correct order - split while marks are visible, then clean
 */
export function processHebrewVerse(verse: string): string[] {
  if (!verse) return [];
  
  // Step 1: Split by cantillation marks (while they're still visible)
  const segments = splitHebrewByCantillation(verse);
  
  // Step 2: Remove nikud and cantillation from each segment
  return segments.map(segment => removeCantillationAndNikud(segment));
}

/**
 * Process an array of Hebrew verses
 */
export function processHebrewVerses(verses: string[]): string[][] {
  return verses.map(verse => processHebrewVerse(verse));
}

/**
 * Process English text: Strip HTML and replace "the Lord" with "YHWH"
 */
export function processBibleEnglish(text: string): string {
  if (!text) return '';
  
  // First strip HTML tags (Sefaria includes footnotes as HTML)
  const noHTML = stripHTML(text);
  
  // Then replace "the Lord" with "YHWH"
  return noHTML
    .replace(/\bthe Lord\b/g, "YHWH")
    .replace(/\bthe LORD\b/g, "YHWH")
    .replace(/\bThe Lord\b/g, "YHWH")
    .replace(/\bThe LORD\b/g, "YHWH");
}

/**
 * Split English text by commas
 */
export function splitEnglishByCommas(text: string): string[] {
  if (!text) return [text];
  
  // Split on commas followed by space, trim each segment
  return text
    .split(/,\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Process English verse: Replace "the Lord" then split by commas
 */
export function processEnglishVerse(verse: string): string[] {
  if (!verse) return [];
  
  // First replace "the Lord" with "YHWH"
  const withYHWH = processBibleEnglish(verse);
  
  // Then split by commas
  return splitEnglishByCommas(withYHWH);
}

/**
 * Process an array of English verses
 */
export function processEnglishVerses(verses: string[]): string[][] {
  return verses.map(verse => processEnglishVerse(verse));
}

/**
 * Flatten processed verses into a single array for display
 * This joins all segments from all verses into one array
 */
export function flattenVerseSegments(processedVerses: string[][]): string[] {
  return processedVerses.flat();
}
