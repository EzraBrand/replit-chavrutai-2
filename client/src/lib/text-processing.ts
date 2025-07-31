/**
 * Text processing utilities for Hebrew and English Talmud text
 * These functions handle text segmentation, formatting, and term replacement
 */

/**
 * Strip common Sefaria formatting patterns from Hebrew text
 */
export function stripSefariaFormatting(text: string): string {
  if (!text) return '';
  
  return text
    // Remove common Sefaria markers
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\([^)]*\)/g, '') // Remove parenthetical content
    .replace(/\[[^\]]*\]/g, '') // Remove bracketed content
    .replace(/\{[^}]*\}/g, '') // Remove braced content
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Clean and format Hebrew text by removing unwanted characters and normalizing
 */
export function cleanHebrewText(text: string): string {
  if (!text) return '';
  
  let processed = text;
  
  // Remove HTML tags and entities
  processed = processed.replace(/<[^>]*>/g, '');
  processed = processed.replace(/&[a-z]+;/gi, '');
  
  // Remove common Sefaria formatting
  processed = stripSefariaFormatting(processed);
  
  // Remove unwanted punctuation but keep Hebrew punctuation
  processed = processed.replace(/[^\u0590-\u05FF\u0020\u002E\u003A\u003B\u002C\u0021\u003F\u2013\u2014\u201C\u201D\u2018\u2019]/g, ' ');
  
  // Normalize whitespace
  processed = processed.replace(/\s+/g, ' ').trim();
  
  return processed;
}

/**
 * Clean and format English text by removing unwanted formatting
 */
export function cleanEnglishText(text: string): string {
  if (!text) return '';
  
  let processed = text;
  
  // Remove HTML tags and entities first
  processed = processed.replace(/<[^>]*>/g, '');
  processed = processed.replace(/&[a-z]+;/gi, '');
  
  // Remove common Sefaria formatting
  processed = stripSefariaFormatting(processed);
  
  // Remove special characters but keep basic punctuation
  processed = processed.replace(/[^\w\s\.\,\;\:\!\?\(\)\[\]\-\u2013\u2014\u201C\u201D\u2018\u2019]/g, ' ');
  
  // Clean up extra whitespace
  processed = processed.replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1') // Remove space before punctuation
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure space after sentence endings
    .trim();
    
  return processed;
}

/**
 * Split Hebrew text into logical segments based on punctuation and structure
 */
export function splitHebrewText(text: string): string {
  if (!text) return '';
  
  let processed = text;
  
  // Split on Hebrew punctuation marks
  processed = processed.replace(/[\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4]/g, '$&\n');
  // Split on periods and colons
  processed = processed.replace(/[\.:](?=\s)/g, '$&\n');
  // Split on question marks and exclamation points
  processed = processed.replace(/[?!](?=\s)/g, '$&\n');
  
  // Clean up extra newlines
  processed = processed.replace(/\n\s*\n/g, '\n')
    .replace(/^\n+|\n+$/g, '')
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
    "The Holy One, Blessed be He,": "God",
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
  
  // Split on semicolons when followed by capital letters or Hebrew text
  processedText = processedText.replace(/;(?=\s*[A-Z\u0590-\u05FF])/g, ';\n');
  
  // Split on colons when followed by capital letters
  processedText = processedText.replace(/:(?=\s*[A-Z])/g, ':\n');
  
  // Clean up extra newlines and whitespace
  processedText = processedText.replace(/\n\s*\n/g, '\n')
    .replace(/^\n+|\n+$/g, '')
    .trim();
    
  return processedText;
}

/**
 * Process and segment both Hebrew and English text for display
 */
export function processTextSegments(hebrewText: string, englishText: string): { hebrew: string; english: string; } {
  // Clean the texts first
  const cleanedHebrew = cleanHebrewText(hebrewText);
  const cleanedEnglish = cleanEnglishText(englishText);
  
  // Apply term replacements to English
  const processedEnglish = replaceTerms(cleanedEnglish);
  
  // Split texts into segments
  const segmentedHebrew = splitHebrewText(cleanedHebrew);
  const segmentedEnglish = splitEnglishText(processedEnglish);
  
  return {
    hebrew: segmentedHebrew,
    english: segmentedEnglish
  };
}

/**
 * Remove common noise words and phrases from text
 */
export function removeNoiseWords(text: string): string {
  if (!text) return '';
  
  const noisePatterns = [
    /\b(said|says|taught|teaches|states|stated)\b/gi,
    /\b(as it is written|as we learned|as it says)\b/gi,
    /\b(the mishna teaches|the gemara says)\b/gi,
    /\b(rabbi [a-z]+ said)\b/gi,
    /\b(rav [a-z]+ said)\b/gi
  ];
  
  let cleaned = text;
  noisePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}