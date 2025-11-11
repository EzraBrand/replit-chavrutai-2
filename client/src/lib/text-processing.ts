/**
 * Client-side text processing utilities
 * 
 * This module re-exports shared text processing functions and adds
 * client-specific features like HTML styling and formatting.
 */

// Import shared functions for local use and re-export
import {
  removeNikud,
  splitHebrewText,
  replaceTerms,
  splitEnglishText,
  processEnglishText,
  containsHebrew,
  normalizeApiText,
  processHebrewTextCore
} from '@shared/text-processing';

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
};

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

/**
 * Processes Bible Hebrew text (no biblical quote styling for Ketiv-Qere notation)
 * Bible text should not apply italic styling to parentheses since those are Ketiv-Qere notations
 */
export function processBibleHebrewText(text: string): string {
  if (!text) return '';

  // Just normalize whitespace - nikud already removed by backend
  const processed = text
    .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n')  // Remove leading whitespace on new lines
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace before new lines
    .trim();

  return processed;
}

/**
 * Simpler processing for Bible English text - no auto-splitting
 * (Backend already handles verse splitting)
 */
export function processBibleEnglishText(text: string): string {
  if (!text) return '';

  let processed = text;

  // Only apply term replacements from shared processing, no splitting
  processed = replaceTerms(processed);

  // Fix possessive apostrophes and contractions - remove newlines before them
  // This prevents splitting like "YHWH\n's" into separate lines (e.g., Isaiah 5:25)
  // Handle both straight ('), curly ('), and modifier letter apostrophe (ʼ)
  processed = processed
    .replace(/\n\s*([''\u2019\u02BC]s)\b/g, '$1')  // Fix possessive 's
    .replace(/\n\s*([''\u2019\u02BC]t)\b/g, '$1')  // Fix contractions like 't
    .replace(/\n\s*([''\u2019\u02BC]re)\b/g, '$1')  // Fix contractions like 're
    .replace(/\n\s*([''\u2019\u02BC]ve)\b/g, '$1')  // Fix contractions like 've
    .replace(/\n\s*([''\u2019\u02BC]ll)\b/g, '$1')  // Fix contractions like 'll
    .replace(/\n\s*([''\u2019\u02BC]d)\b/g, '$1')  // Fix contractions like 'd
    .replace(/\n\s*([''\u2019\u02BC]m)\b/g, '$1');  // Fix contractions like 'm

  // Preserve paragraph breaks and normalize spacing
  processed = processed
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')  // Multiple line breaks to double
    .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n')  // Remove leading whitespace on new lines
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace before new lines
    .trim();

  return processed;
}
