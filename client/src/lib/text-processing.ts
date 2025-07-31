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
  
  // Define the punctuation marks for splitting
  const splitMarks = [
    '.',     // Period
    ',',     // Comma
    '–',     // M-dash
    ':',     // Colon
    '?',     // Question mark
    '!',     // Exclamation mark
    '?!',    // Rhetorical question mark
    '״ ',    // Hebrew quotation mark + space
    ' - ',   // Regular dash + spaces
    '׃'      // Hebrew SOF PASUQ
  ];
  
  let processedText = text;
  
  // Split on each punctuation mark and add line breaks
  splitMarks.forEach(mark => {
    // Create regex pattern that preserves the punctuation mark
    const regex = new RegExp(`(${mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
    processedText = processedText.replace(regex, `$1\n`);
  });
  
  // Clean up multiple consecutive line breaks and trim
  processedText = processedText
    .replace(/\n\s*\n/g, '\n')  // Remove empty lines
    .replace(/^\s+|\s+$/g, '')  // Trim whitespace
    .replace(/\n\s+/g, '\n');   // Remove leading spaces on new lines
  
  return processedText;
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
  
  // Define the punctuation marks for splitting English text
  const splitMarks = [
    '.',     // Period
    '?'      // Question mark
  ];
  
  let processedText = text;
  
  // Split on each punctuation mark and add line breaks
  splitMarks.forEach(mark => {
    // Create regex pattern that preserves the punctuation mark
    const regex = new RegExp(`(\\${mark})`, 'g');
    processedText = processedText.replace(regex, `$1\n`);
  });
  
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
  
  // Enhanced formatting for common patterns (updated to reflect term replacements)
  processed = processed
    // MISHNA/TALMUD headers - make them stand out
    .replace(/^(MISHNA|TALMUD|MISHNAH):/gm, '**$1:**')
    // R' names - add emphasis (updated to use R' instead of Rabbi)
    .replace(/\b(R'|Rav|Rebbe)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g, '*$1 $2*')
    // Talmudic terms - add emphasis
    .replace(/\b(Tanya|Tanu Rabbanan|Amar|Amri)\b/g, '*$1*')
    // Questions and responses
    .replace(/\b(What is the reason|Why|How so|From where do we know)\?/g, '**$1?**')
    // Common Aramaic/Hebrew terms (removed "Talmud" to prevent auto-bolding)
    .replace(/\b(halakha|Halakha|mitzvah|Mitzvah|Torah|Mishnah|tefillin|Shekhina)\b/g, '*$1*');
  
  return processed;
}

/**
 * Enhanced formatting for English text with markdown-like syntax
 */
export function formatEnglishText(text: string): string {
  if (!text) return '';
  
  // Process inline formatting markers for later rendering
  let formatted = text
    // Bold text markers
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text markers
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
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