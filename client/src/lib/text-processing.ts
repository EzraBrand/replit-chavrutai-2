/**
 * Text processing utilities for Hebrew and English text formatting
 */

// Unicode ranges for Hebrew nikud (diacritical marks)
const NIKUD_RANGES = [
  [0x0591, 0x05AF], // Hebrew accents
  [0x05B0, 0x05BD], // Hebrew points
  [0x05BF, 0x05BF], // Hebrew point RAFE
  [0x05C1, 0x05C2], // Hebrew points SIN/SHIN DOT
  [0x05C4, 0x05C5], // Hebrew punctuation
  [0x05C7, 0x05C7], // Hebrew point QAMATS QATAN
];

/**
 * Removes nikud (vowel points and cantillation marks) from Hebrew text
 */
export function removeNikud(hebrewText: string): string {
  return hebrewText.replace(/[\u0591-\u05AF\u05B0-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7]/g, '');
}

/**
 * Split Hebrew text into paragraphs based on specific punctuation marks
 */
export function splitHebrewText(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // Handle irony punctuation (?!) as a unit - split after the whole thing
  processedText = processedText.replace(/\?\!/g, '?!\n');
  
  // Handle other punctuation marks individually, but avoid splitting after partial ?! sequences
  const singleMarks = [
    '.',     // Period
    ',',     // Comma
    '–',     // M-dash
    ':',     // Colon
    '!',     // Exclamation mark (but not when preceded by ?)
    '?',     // Question mark (but not when followed by !)
    '״ ',    // Hebrew quotation mark + space
    ' - ',   // Regular dash + spaces
    '׃'      // Hebrew SOF PASUQ
  ];
  
  // Apply splits for individual marks, being careful about ? and ! combinations
  singleMarks.forEach(mark => {
    if (mark === '?') {
      // Don't split ? when followed by !
      processedText = processedText.replace(/\?(?!\!)/g, '?\n');
    } else if (mark === '!') {
      // Don't split ! when preceded by ?
      processedText = processedText.replace(/(?<!\?)\!/g, '!\n');
    } else {
      // Regular splitting for other marks
      const regex = new RegExp(`(${mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
      processedText = processedText.replace(regex, `$1\n`);
    }
  });
  
  // Clean up multiple consecutive line breaks and trim
  processedText = processedText
    .replace(/\n\s*\n/g, '\n')  // Remove empty lines
    .replace(/^\s+|\s+$/g, '')  // Trim whitespace
    .replace(/\n\s+/g, '\n');   // Remove leading spaces on new lines
  
  return processedText;
}

/**
 * Applies special styling to Hebrew text in parentheses (biblical quotes)
 */
export function styleHebrewParentheses(text: string): string {
  if (!text) return '';
  
  // Replace text in parentheses with span tags for special styling
  return text.replace(/\(([^)]+)\)/g, '<span class="biblical-quote">($1)</span>');
}

/**
 * Processes Hebrew text by removing nikud and normalizing spacing
 */
export function processHebrewText(text: string): string {
  if (!text) return '';
  
  // Remove nikud
  let processed = removeNikud(text);
  
  // Split text based on punctuation marks
  processed = splitHebrewText(processed);
  
  // Apply biblical quote styling
  processed = styleHebrewParentheses(processed);
  
  // Normalize whitespace while preserving paragraph breaks
  processed = processed
    .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n')  // Remove leading whitespace on new lines
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace before new lines
    .trim();
    
  return processed;
}

/**
 * Replace specific terms in English text with preferred alternatives
 */
export function replaceTerms(text: string): string {
  if (!text) return '';
  
  const termReplacements: Record<string, string> = {
    "GEMARA": "TALMUD",
    "Gemara": "Talmud",
    "Rabbi": "R'",
    "The Sages taught": "A baraita states",
    "Divine Voice": "bat kol",
    "Divine Presence": "Shekhina",
    "divine inspiration": "Holy Spirit",
    "Divine Spirit": "Holy Spirit",
    "the Lord": "YHWH",
    "leper": "metzora",
    "leprosy": "tzara'at",
    "phylacteries": "tefillin",
    "gentile": "non-Jew",
    "gentiles": "non-Jews",
    "ignoramus": "am ha'aretz",
    "maidservant": "female slave",
    "maidservants": "female slaves",
    "barrel": "jug",
    "barrels": "jugs",
    "the Holy One, Blessed be He": "God",
    "the Merciful One": "God",
    "the Almighty": "God",
    "engage in intercourse": "have sex",
    "engages in intercourse": "has sex",
    "engaged in intercourse": "had sex",
    "engaging in intercourse": "having sex",
    "had intercourse": "had sex",
    "intercourse with": "sex with",
    "Sages": "rabbis",
    "mishna": "Mishnah",
    "rainy season": "winter",
    "son of R'": "ben"
  };
  
  let processedText = text;
  
  // Apply term replacements
  Object.entries(termReplacements).forEach(([original, replacement]) => {
    // Use word boundaries to avoid partial matches, case-insensitive for some terms
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    processedText = processedText.replace(regex, replacement);
  });
  
  return processedText;
}

/**
 * Split English text into paragraphs based on specific punctuation marks
 */
export function splitEnglishText(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // Split on periods, but avoid splitting after "i.e."
  processedText = processedText.replace(/\.(?!\s*[a-z])/g, '.\n');
  // Don't split after "i.e." specifically
  processedText = processedText.replace(/i\.e\.\n/g, 'i.e.');
  
  // Split on question marks
  processedText = processedText.replace(/\?/g, '?\n');
  
  // Clean up multiple consecutive line breaks and trim
  processedText = processedText
    .replace(/\n\s*\n/g, '\n')  // Remove empty lines
    .replace(/^\s+|\s+$/g, '')  // Trim whitespace
    .replace(/\n\s+/g, '\n');   // Remove leading spaces on new lines
  
  return processedText;
}

/**
 * Processes English text to preserve and enhance formatting
 */
export function processEnglishText(text: string): string {
  if (!text) return '';
  
  let processed = text;
  
  // Apply term replacements first
  processed = replaceTerms(processed);
  
  // Split text based on punctuation marks
  processed = splitEnglishText(processed);
  
  // Preserve paragraph breaks and normalize spacing
  processed = processed
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')  // Multiple line breaks to double
    .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n')  // Remove leading whitespace on new lines
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace before new lines
    .trim();
  
  // No auto-formatting applied - preserve original source formatting
  
  return processed;
}

/**
 * Basic formatting for English text - only processes existing HTML and line breaks
 */
export function formatEnglishText(text: string): string {
  if (!text) return '';
  
  // Only handle line breaks - preserve all existing formatting from source
  let formatted = text
    // Line breaks within paragraphs
    .replace(/\n(?!\n)/g, '<br />');
    
  return formatted;
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