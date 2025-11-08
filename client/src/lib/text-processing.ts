/**
 * Client-side text processing utilities
 * 
 * This module re-exports shared text processing functions and adds
 * client-specific features like HTML styling and formatting.
 */

// Import for use in client functions
import { processHebrewTextCore } from '@shared/text-processing';

// Re-export all shared text processing functions
export {
  removeNikud,
  splitHebrewText,
  replaceTerms,
  splitEnglishText,
  processEnglishText,
  containsHebrew,
  normalizeApiText,
  processHebrewTextCore
} from '@shared/text-processing';

/**
 * Processes Hebrew text (alias for core processing)
 * Note: Previously included HTML styling for parentheses, but that was removed
 * due to issues with Hebrew text in Niddah 47a.16 and other sections
 */
export function processHebrewText(text: string): string {
  return processHebrewTextCore(text);
}

/**
 * Basic formatting for English text - processes HTML and line breaks while preserving formatting
 * CLIENT-SPECIFIC: Creates HTML paragraph tags
 */
export function formatEnglishText(text: string): string {
  if (!text) return '';
  
  // Split text into lines and create paragraph tags with proper spacing
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return '';
  
  // Create properly spaced paragraphs
  const paragraphs = lines.map(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return '';
    return `<p class="mb-3 leading-relaxed">${trimmedLine}</p>`;
  }).filter(p => p);
  
  return paragraphs.join('');
}
