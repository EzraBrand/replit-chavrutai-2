/**
 * Client-side text processing utilities
 * 
 * This module re-exports shared text processing functions and adds
 * client-specific features like HTML styling and formatting.
 */

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

// Import for use in client-specific functions
import { processHebrewTextCore } from '@shared/text-processing';

/**
 * Applies special styling to Hebrew text in parentheses (biblical quotes)
 * CLIENT-SPECIFIC: Creates HTML span tags
 */
export function styleHebrewParentheses(text: string): string {
  if (!text) return '';
  
  // Replace text in parentheses with span tags for special styling
  return text.replace(/\(([^)]+)\)/g, '<span class="biblical-quote">($1)</span>');
}

/**
 * Processes Hebrew text with client-specific HTML styling
 * This extends the core processing with DOM-specific features
 */
export function processHebrewText(text: string): string {
  if (!text) return '';
  
  // Use core processing from shared module
  let processed = processHebrewTextCore(text);
  
  // Add client-specific HTML styling
  processed = styleHebrewParentheses(processed);
  
  return processed;
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
