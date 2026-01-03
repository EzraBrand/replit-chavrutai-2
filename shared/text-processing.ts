/**
 * Shared text processing utilities for Hebrew and English text formatting
 * 
 * This module contains environment-agnostic text processing logic that can be
 * used by both server and client. DOM-specific operations (e.g., HTML styling)
 * should remain in the client library.
 * 
 * V2 Optimizations (see docs/text-processing-analysis.md):
 * - Single-pass term replacement using combined regex (10-50x faster)
 * - Pre-compiled regex patterns at module load
 * - Feature flag for A/B testing between V1 and V2
 */

// Feature flag for A/B testing - set TEXT_PIPELINE=v2 in environment to enable optimized version
// Uses safe check for both Node.js (process.env) and browser (Vite's import.meta.env) environments
const USE_V2_PIPELINE = (() => {
  // Try Node.js environment first
  if (typeof process !== 'undefined' && process.env?.TEXT_PIPELINE === 'v2') {
    return true;
  }
  // Try Vite/browser environment (import.meta.env.VITE_TEXT_PIPELINE)
  try {
    // @ts-ignore - import.meta.env may not exist in all environments
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TEXT_PIPELINE === 'v2') {
      return true;
    }
  } catch {
    // import.meta not available, continue
  }
  return false;
})();

// =============================================================================
// PRE-COMPILED REGEX PATTERNS (initialized at module load for performance)
// =============================================================================

// Hebrew processing patterns
const NIKUD_PATTERN = /[\u0591-\u05AF\u05B0-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7]/g;
const HTML_TAG_PATTERN = /<\/?\w+(?:\s+[^>]*)?>/g;
const HEBREW_QUOTE_DASH_PATTERN = /״\s*[–—]/g;

// Mishnah/Gemara marker patterns (Hebrew)
const MISHNA_STRONG_BIG_PATTERN = /<strong[^>]*><big[^>]*>(מתני['׳])<\/big><\/strong>\s*/gi;
const GEMARA_STRONG_BIG_PATTERN = /<strong[^>]*><big[^>]*>(גמ['׳])<\/big><\/strong>\s*/gi;
const GEMARA_ALT_STRONG_BIG_PATTERN = /<strong[^>]*><big[^>]*>(גמר['׳])<\/big><\/strong>\s*/gi;
const BIG_STRONG_CONTENT_PATTERN = /<big[^>]*><strong[^>]*>([^<]+)<\/strong><\/big>/gi;
const STRONG_BIG_CONTENT_PATTERN = /<strong[^>]*><big[^>]*>([^<]+)<\/big><\/strong>/gi;
const MISHNA_MARKER_PATTERN = /מתני['׳](?!\w)/g;
const GEMARA_MARKER_PATTERN = /גמ['׳](?!\w)/g;
const GEMARA_ALT_MARKER_PATTERN = /גמר['׳](?!\w)/g;
const IRONY_PUNCT_PATTERN = /\?\!/g;
const QUESTION_NOT_EXCLAIM_PATTERN = /\?(?!\!)/g;
const EXCLAIM_NOT_QUESTION_PATTERN = /(?<!\?)\!/g;

// English processing patterns
const RABBI_VOCATIVE_PATTERN = /\bRabbi,/g;
const RABBI_GENERAL_PATTERN = /\bRabbi(?![!s])/g;
const BARAITA_REDUNDANT_PATTERN = /(A baraita states)(<\/(?:b|strong)>)?\s+in a(?:\s+|(?:\s*<(?:i|em)>))baraita(?:<\/(?:i|em)>)?/gi;
const SON_OF_PATTERN = /,\s*(?:the\s+)?son of\s+[^,;:.]+,?/gi;
const MISHNA_GEMARA_ENG_PATTERN = /<strong[^>]*>(MISHNA|GEMARA):<\/strong>/gi;
const BR_TAG_PATTERN = /<br\s*\/?>/gi;
const BOLD_CONTENT_PATTERN = /<(b|strong)[^>]*>([\s\S]*?)<\/\1>/g;
const BOLD_COMMA_PATTERN = /(?<!\d)<(b|strong)[^>]*>,<\/\1>(?![""\u201C\u201D'\u2018\u2019]|\d)/g;
const BOLD_COLON_PATTERN = /<(b|strong)[^>]*>:<\/\1>/g;
const CROSS_TAG_COMMA_PATTERN = /(?<!\d)<\/(b|strong)>,(?![""\u201C\u201D'\u2018\u2019]|\d)(\s*)<\1[^>]*>/g;
const CROSS_TAG_COLON_PATTERN = /<\/(b|strong)>:(\s*)<\1[^>]*>/g;
const ELLIPSIS_PATTERN = /\.{2,}/g;
const TRIPLE_PUNCT_PATTERN = /([,.\?!;])[''\u2018\u2019][""\u201C\u201D]/g;
const COMMA_QUOTE_PATTERN = /,[""\u201C\u201D'\u2018\u2019]/g;
const PERIOD_QUOTE_PATTERN = /\.[""\u201C\u201D'\u2018\u2019]/g;
const PERIOD_SPLIT_PATTERN = /\.(?![""\u201C\u201D'\u2018\u2019]|\s*[a-z]|,)/g;
const QUESTION_QUOTE_PATTERN = /\?[""\u201C\u201D'\u2018\u2019]/g;
const QUESTION_OTHER_PATTERN = /\?(?![""\u201C\u201D'\u2018\u2019])/g;
const BOLD_COMMA_COLON_TEST = /[,:]/;
const BOLD_COLON_SPLIT = /:/g;
const BOLD_COMMA_SPLIT = /,(?![""\u201C\u201D'\u2018\u2019]|\d)(?<!\d)(?<!\.)/g;

// Whitespace normalization patterns
const MULTI_NEWLINE_PATTERN = /\n\s*\n/g;
const LEADING_TRAILING_WS_PATTERN = /^\s+|\s+$/g;
const NEWLINE_LEADING_WS_PATTERN = /\n\s+/g;
const MULTI_SPACE_TAB_PATTERN = /[ \t]+/g;
const NEWLINE_LEADING_SPACE_PATTERN = /\n[ \t]+/g;
const TRAILING_SPACE_NEWLINE_PATTERN = /[ \t]+\n/g;

// Abbreviation fix patterns
const IE_FIX_PATTERN = /i\.e\.\n/g;
const EG_FIX_PATTERN = /e\.g\.\n/g;
const ETC_FIX_PATTERN = /etc\.\n/g;
const VS_FIX_PATTERN = /vs\.\n/g;
const CF_FIX_PATTERN = /cf\.\n/g;

// Orphaned quote patterns
const ORPHAN_QUOTE_COMMA_PATTERN = /,\n\n[""\u201C\u201D'\u2018\u2019]\s*\n/g;
const ORPHAN_QUOTE_NO_PUNCT_PATTERN = /(?<![,.\?!;''\u2018\u2019""\u201C\u201D])\n[""\u201C\u201D'\u2018\u2019]\s*\n/g;
const ORPHAN_QUOTE_END_PATTERN = /(?<![,.\?!;''\u2018\u2019""\u201C\u201D])\n[""\u201C\u201D'\u2018\u2019]\s*$/g;

// =============================================================================
// TERM REPLACEMENT DATA STRUCTURES (loaded from JSON config)
// =============================================================================

import termReplacementsConfig from './data/term-replacements.json';
import { loadTermReplacements, buildCombinedPattern, TermReplacementsConfigSchema } from './term-replacements-schema';

// Validate config at module load
const validatedConfig = TermReplacementsConfigSchema.parse(termReplacementsConfig);

// Load terms from JSON config
const TERM_LOOKUP_MAP: Map<string, string> = loadTermReplacements(validatedConfig);

// Build combined regex pattern from loaded terms
const COMBINED_TERM_PATTERN: RegExp = buildCombinedPattern(TERM_LOOKUP_MAP);

// For V1 compatibility: convert Map back to Record
const ALL_TERM_REPLACEMENTS: Record<string, string> = Object.fromEntries(TERM_LOOKUP_MAP);

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Removes nikud (vowel points and cantillation marks) from Hebrew text
 */
export function removeNikud(hebrewText: string): string {
  return hebrewText.replace(NIKUD_PATTERN, '');
}

/**
 * Split Hebrew text into paragraphs based on specific punctuation marks
 */
export function splitHebrewText(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // STEP 1: Remove special formatting from Mishnah/Gemara markers AND chapter names
  processedText = processedText.replace(MISHNA_STRONG_BIG_PATTERN, '$1\n');
  processedText = processedText.replace(GEMARA_STRONG_BIG_PATTERN, '$1\n');
  processedText = processedText.replace(GEMARA_ALT_STRONG_BIG_PATTERN, '$1\n');
  processedText = processedText.replace(BIG_STRONG_CONTENT_PATTERN, '$1');
  processedText = processedText.replace(STRONG_BIG_CONTENT_PATTERN, '$1');
  
  // STEP 2: Protect HTML tags with placeholders
  const htmlTags: string[] = [];
  const htmlPlaceholders: string[] = [];
  
  processedText = processedText.replace(HTML_TAG_PATTERN, (match) => {
    const placeholder = `__HTML_TAG_${htmlTags.length}__`;
    htmlTags.push(match);
    htmlPlaceholders.push(placeholder);
    return placeholder;
  });
  
  // STEP 3: Protect special punctuation clusters
  const protectedClusters: string[] = [];
  processedText = processedText.replace(HEBREW_QUOTE_DASH_PATTERN, (match) => {
    protectedClusters.push(match);
    return `___PROTECTED_${protectedClusters.length - 1}___`;
  });
  
  // STEP 4: Split after unwrapped Mishnah/Gemara markers
  processedText = processedText.replace(MISHNA_MARKER_PATTERN, (match) => match + '\n');
  processedText = processedText.replace(GEMARA_MARKER_PATTERN, (match) => match + '\n');
  processedText = processedText.replace(GEMARA_ALT_MARKER_PATTERN, (match) => match + '\n');
  
  // STEP 5: Handle irony punctuation (?!) as a unit
  processedText = processedText.replace(IRONY_PUNCT_PATTERN, '?!\n');
  
  // STEP 6: Handle other punctuation marks
  const singleMarks = ['.', ',', '–', '—', ':', ';', '!', '?', '״ ', ' - ', '׃'];
  
  singleMarks.forEach(mark => {
    if (mark === '?') {
      processedText = processedText.replace(QUESTION_NOT_EXCLAIM_PATTERN, '?\n');
    } else if (mark === '!') {
      processedText = processedText.replace(EXCLAIM_NOT_QUESTION_PATTERN, '!\n');
    } else {
      const regex = new RegExp(`(${mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
      processedText = processedText.replace(regex, `$1\n`);
    }
  });
  
  // STEP 7: Clean up
  processedText = processedText
    .replace(MULTI_NEWLINE_PATTERN, '\n')
    .replace(LEADING_TRAILING_WS_PATTERN, '')
    .replace(NEWLINE_LEADING_WS_PATTERN, '\n');
  
  // STEP 8: Restore HTML tags
  htmlPlaceholders.forEach((placeholder, index) => {
    processedText = processedText.replace(placeholder, htmlTags[index]);
  });
  
  // STEP 9: Restore protected punctuation clusters
  processedText = processedText.replace(/___PROTECTED_(\d+)___/g, (match, index) => {
    return protectedClusters[parseInt(index)];
  });
  
  return processedText;
}

/**
 * Processes Hebrew text by removing nikud and normalizing spacing
 */
export function processHebrewTextCore(text: string): string {
  if (!text) return '';
  
  let processed = removeNikud(text);
  processed = splitHebrewText(processed);
  
  processed = processed
    .replace(MULTI_SPACE_TAB_PATTERN, ' ')
    .replace(NEWLINE_LEADING_SPACE_PATTERN, '\n')
    .replace(TRAILING_SPACE_NEWLINE_PATTERN, '\n')
    .trim();
    
  return processed;
}

/**
 * V2 OPTIMIZED: Replace terms using single-pass combined regex
 * Expected improvement: 10-50x faster than V1
 */
function replaceTermsV2(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // Handle Rabbi special cases first (not in combined pattern due to complex logic)
  processedText = processedText.replace(RABBI_VOCATIVE_PATTERN, 'Rabbi!');
  processedText = processedText.replace(RABBI_GENERAL_PATTERN, "R'");
  
  // Single-pass replacement for all terms
  processedText = processedText.replace(COMBINED_TERM_PATTERN, (match) => {
    return TERM_LOOKUP_MAP.get(match.toLowerCase()) || match;
  });
  
  // Post-processing: Remove redundant "in a baraita"
  processedText = processedText.replace(BARAITA_REDUNDANT_PATTERN, '$1$2');
  
  return processedText;
}

/**
 * V1 ORIGINAL: Replace terms using multiple sequential regex passes
 * Kept for A/B testing comparison - now uses same JSON config as V2
 */
function replaceTermsV1(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  processedText = processedText.replace(RABBI_VOCATIVE_PATTERN, 'Rabbi!');
  processedText = processedText.replace(RABBI_GENERAL_PATTERN, "R'");
  
  // Apply term replacements (multiple passes - inefficient, but keeps V1 behavior)
  Object.entries(ALL_TERM_REPLACEMENTS).forEach(([original, replacement]) => {
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    processedText = processedText.replace(regex, replacement);
  });
  
  processedText = processedText.replace(BARAITA_REDUNDANT_PATTERN, '$1$2');
  
  return processedText;
}

/**
 * Replace specific terms in English text with preferred alternatives
 * Uses V2 optimized version when TEXT_PIPELINE=v2
 */
export function replaceTerms(text: string): string {
  if (USE_V2_PIPELINE) {
    try {
      return replaceTermsV2(text);
    } catch (error) {
      console.error('V2 replaceTerms failed, falling back to V1:', error);
      return replaceTermsV1(text);
    }
  }
  return replaceTermsV1(text);
}

/**
 * Split English text into paragraphs based on specific punctuation marks while preserving HTML formatting
 */
export function splitEnglishText(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // STEP -1: Protect "X, [the] son of Y" patterns
  const sonOfProtections: string[] = [];
  processedText = processedText.replace(SON_OF_PATTERN, (match) => {
    sonOfProtections.push(match);
    return `__SON_OF_PROTECTION_${sonOfProtections.length - 1}__`;
  });
  
  // STEP 0: Remove special formatting from MISHNA/GEMARA markers
  processedText = processedText.replace(MISHNA_GEMARA_ENG_PATTERN, '$1:');
  
  // Convert <br> tags to newlines
  processedText = processedText.replace(BR_TAG_PATTERN, '\n');
  
  // Split on bolded commas and colons BEFORE protecting HTML tags
  processedText = processedText.replace(BOLD_CONTENT_PATTERN, (match, tagName, content) => {
    if (!BOLD_COMMA_COLON_TEST.test(content)) {
      return match;
    }
    
    let splitContent = content;
    splitContent = splitContent.replace(BOLD_COLON_SPLIT, ':\n');
    splitContent = splitContent.replace(BOLD_COMMA_SPLIT, ',\n');
    
    return `<${tagName}>${splitContent}</${tagName}>`;
  });
  
  // Handle cases where just the comma or colon itself is bolded
  processedText = processedText.replace(BOLD_COMMA_PATTERN, ',\n');
  processedText = processedText.replace(BOLD_COLON_PATTERN, ':\n');
  
  // Handle cross-tag scenarios
  processedText = processedText.replace(CROSS_TAG_COMMA_PATTERN, (match, tagName, whitespace) => {
    return `,\n${whitespace}`;
  });
  processedText = processedText.replace(CROSS_TAG_COLON_PATTERN, (match, tagName, whitespace) => {
    return `:\n${whitespace}`;
  });
  
  // Protect ellipses
  const ellipsisProtections: string[] = [];
  processedText = processedText.replace(ELLIPSIS_PATTERN, (match) => {
    ellipsisProtections.push(match);
    return `__ELLIPSIS_${ellipsisProtections.length - 1}__`;
  });
  
  // Protect HTML tags
  const htmlTags: string[] = [];
  const htmlPlaceholders: string[] = [];
  
  processedText = processedText.replace(HTML_TAG_PATTERN, (match) => {
    const placeholder = `__HTML_TAG_${htmlTags.length}__`;
    htmlTags.push(match);
    htmlPlaceholders.push(placeholder);
    return placeholder;
  });
  
  // Handle triple-punctuation clusters FIRST
  processedText = processedText.replace(TRIPLE_PUNCT_PATTERN, (match) => match + '\n');
  
  // Handle comma + end quote pattern
  processedText = processedText.replace(COMMA_QUOTE_PATTERN, (match) => match + '\n');
  
  // Split on periods
  processedText = processedText.replace(PERIOD_QUOTE_PATTERN, (match) => match + '\n');
  processedText = processedText.replace(PERIOD_SPLIT_PATTERN, '.\n');
  processedText = processedText.replace(IE_FIX_PATTERN, 'i.e.');
  processedText = processedText.replace(EG_FIX_PATTERN, 'e.g.');
  processedText = processedText.replace(ETC_FIX_PATTERN, 'etc.');
  processedText = processedText.replace(VS_FIX_PATTERN, 'vs.');
  processedText = processedText.replace(CF_FIX_PATTERN, 'cf.');
  
  // Split on question marks
  processedText = processedText.replace(QUESTION_QUOTE_PATTERN, (match) => match + '\n');
  processedText = processedText.replace(QUESTION_OTHER_PATTERN, '?\n');
  
  // Split on semicolons
  processedText = processedText.replace(/;/g, ';\n');
  
  // Clean up
  processedText = processedText
    .replace(MULTI_NEWLINE_PATTERN, '\n')
    .replace(LEADING_TRAILING_WS_PATTERN, '')
    .replace(NEWLINE_LEADING_WS_PATTERN, '\n');
  
  // Restore HTML tags
  htmlPlaceholders.forEach((placeholder, index) => {
    processedText = processedText.replace(placeholder, htmlTags[index]);
  });
  
  // Restore "son of" protected patterns
  sonOfProtections.forEach((original, index) => {
    processedText = processedText.replace(`__SON_OF_PROTECTION_${index}__`, original);
  });
  
  // Restore ellipses
  ellipsisProtections.forEach((original, index) => {
    processedText = processedText.replace(`__ELLIPSIS_${index}__`, original);
  });
  
  // Final cleanup: Fix orphaned quotes
  processedText = processedText
    .replace(ORPHAN_QUOTE_COMMA_PATTERN, ',\n\n')
    .replace(ORPHAN_QUOTE_NO_PUNCT_PATTERN, '\n')
    .replace(ORPHAN_QUOTE_END_PATTERN, '');
  
  return processedText;
}

/**
 * Processes English text to preserve and enhance formatting
 */
export function processEnglishText(text: string): string {
  if (!text) return '';
  
  let processed = text;
  
  processed = replaceTerms(processed);
  processed = splitEnglishText(processed);
  
  processed = processed
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(MULTI_SPACE_TAB_PATTERN, ' ')
    .replace(NEWLINE_LEADING_SPACE_PATTERN, '\n')
    .replace(TRAILING_SPACE_NEWLINE_PATTERN, '\n')
    .trim();
  
  return processed;
}

/**
 * Utility to detect if text contains Hebrew characters
 */
export function containsHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Utility to clean and normalize text from API responses
 */
export function normalizeApiText(text: string | string[]): string {
  if (Array.isArray(text)) {
    return text.join('\n\n');
  }
  return text || '';
}

// Export version info for debugging
export const TEXT_PROCESSING_VERSION = USE_V2_PIPELINE ? 'v2' : 'v1';
