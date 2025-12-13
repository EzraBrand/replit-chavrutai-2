/**
 * Shared text processing utilities for Hebrew and English text formatting
 * 
 * This module contains environment-agnostic text processing logic that can be
 * used by both server and client. DOM-specific operations (e.g., HTML styling)
 * should remain in the client library.
 */

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
  
  // STEP 1: Remove special formatting from Mishnah/Gemara markers AND chapter names
  // Strip <strong> and <big> tags from markers and immediately following chapter names
  // Pattern: מתני׳ <big><strong>Chapter Name</strong></big> -> מתני׳ Chapter Name
  processedText = processedText.replace(/<strong[^>]*><big[^>]*>(מתני['׳])<\/big><\/strong>\s*/gi, '$1\n');
  processedText = processedText.replace(/<strong[^>]*><big[^>]*>(גמ['׳])<\/big><\/strong>\s*/gi, '$1\n');
  processedText = processedText.replace(/<strong[^>]*><big[^>]*>(גמר['׳])<\/big><\/strong>\s*/gi, '$1\n');
  
  // Also strip formatting from chapter names that follow the markers
  processedText = processedText.replace(/<big[^>]*><strong[^>]*>([^<]+)<\/strong><\/big>/gi, '$1');
  processedText = processedText.replace(/<strong[^>]*><big[^>]*>([^<]+)<\/big><\/strong>/gi, '$1');
  
  // STEP 2: Protect HTML tags with placeholders (like English processing does)
  const htmlTagPattern = /<\/?\w+(?:\s+[^>]*)?>/g;
  const htmlTags: string[] = [];
  const htmlPlaceholders: string[] = [];
  
  processedText = processedText.replace(htmlTagPattern, (match) => {
    const placeholder = `__HTML_TAG_${htmlTags.length}__`;
    htmlTags.push(match);
    htmlPlaceholders.push(placeholder);
    return placeholder;
  });
  
  // STEP 3: Protect special punctuation clusters with placeholders
  // Hebrew end quote + space + em-dash should NOT split at all (e.g., Niddah 47a.9)
  const protectedClusters: string[] = [];
  processedText = processedText.replace(/״\s*[–—]/g, (match) => {
    protectedClusters.push(match);
    return `___PROTECTED_${protectedClusters.length - 1}___`;
  });
  
  // STEP 4: Split after unwrapped Mishnah/Gemara markers
  processedText = processedText.replace(/מתני['׳](?!\w)/g, (match) => match + '\n');
  processedText = processedText.replace(/גמ['׳](?!\w)/g, (match) => match + '\n');
  processedText = processedText.replace(/גמר['׳](?!\w)/g, (match) => match + '\n');
  
  // STEP 5: Handle irony punctuation (?!) as a unit - split after the whole thing
  processedText = processedText.replace(/\?\!/g, '?!\n');
  
  // STEP 6: Handle other punctuation marks individually, but avoid splitting after partial ?! sequences
  const singleMarks = [
    '.',     // Period
    ',',     // Comma
    '–',     // M-dash
    '—',     // Em-dash
    ':',     // Colon
    ';',     // Semicolon
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
  
  // STEP 7: Clean up multiple consecutive line breaks and trim
  processedText = processedText
    .replace(/\n\s*\n/g, '\n')  // Remove empty lines
    .replace(/^\s+|\s+$/g, '')  // Trim whitespace
    .replace(/\n\s+/g, '\n');   // Remove leading spaces on new lines
  
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
 * Note: This is the core function - client may extend with HTML styling
 */
export function processHebrewTextCore(text: string): string {
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
 * Generate sexual relations term replacements programmatically
 */
function generateSexualTerms(): Record<string, string> {
  const baseTerms = ["intercourse", "sexual intercourse", "sexual relations", "intimacy"];
  const conjugations = [
    { prefix: "engage in", replacement: "have sex" },
    { prefix: "engages in", replacement: "has sex" },
    { prefix: "engaged in", replacement: "had sex" },
    { prefix: "engaging in", replacement: "having sex" },
    { prefix: "have", replacement: "have sex" },
    { prefix: "has", replacement: "has sex" },
    { prefix: "had", replacement: "had sex" },
    { prefix: "having", replacement: "having sex" }
  ];
  
  const result: Record<string, string> = {};
  
  // Generate all combinations
  conjugations.forEach(({ prefix, replacement }) => {
    baseTerms.forEach(term => {
      result[`${prefix} ${term}`] = replacement;
    });
  });
  
  // Add standalone terms
  result["sexual intercourse"] = "sex";
  result["intercourse"] = "sex";
  result["conjugal relations"] = "sex";
  result["relations"] = "sex";
  
  return result;
}

/**
 * Replace specific terms in English text with preferred alternatives
 */
export function replaceTerms(text: string): string {
  if (!text) return '';
  
  const basicTerms: Record<string, string> = {
    "GEMARA": "Talmud",
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
    "the Holy One, Blessed be He, ": "God ",
    "The Holy One, Blessed be He, ": "God ",
    "the Holy One, Blessed be He": "God",
    "The Holy One, Blessed be He": "God",
    "the Merciful One": "God",
    "the Almighty": "God",
    "the Omnipresent": "God",
    "Master of the Universe,": "God!",
    "Master of the Universe": "God!",
    "sky-blue": "tekhelet",
    "ritual fringes": "tzitzit",
    "ritual bath": "mikveh",
    "malicious speech": "lashon hara",
    "bloodshed": "murder",
    "nations of the world": "non-Jewish nations",
    "sexual relations": "sex",
    "sexual sex": "sex",
    "mishna": "Mishnah",
    "rainy season": "winter",
    ", son of R' ": " ben "
  };
  
  // Combine basic terms with generated sexual terms
  const termReplacements = { ...basicTerms, ...generateSexualTerms() };
  
  // Ordinal number mappings (3rd and up)
  // Process compound ordinals first to avoid conflicts
  const compoundOrdinalReplacements: Record<string, string> = {
    "twenty-first": "21st",
    "twenty first": "21st",
    "twenty-second": "22nd",
    "twenty second": "22nd",
    "twenty-third": "23rd",
    "twenty third": "23rd",
    "twenty-fourth": "24th",
    "twenty fourth": "24th",
    "twenty-fifth": "25th",
    "twenty fifth": "25th",
    "twenty-sixth": "26th",
    "twenty sixth": "26th",
    "twenty-seventh": "27th",
    "twenty seventh": "27th",
    "twenty-eighth": "28th",
    "twenty eighth": "28th",
    "twenty-ninth": "29th",
    "twenty ninth": "29th",
    "thirty-first": "31st",
    "thirty first": "31st",
    "thirty-second": "32nd",
    "thirty second": "32nd",
    "thirty-third": "33rd",
    "thirty third": "33rd",
    "thirty-fourth": "34th",
    "thirty fourth": "34th",
    "thirty-fifth": "35th",
    "thirty fifth": "35th",
    "thirty-sixth": "36th",
    "thirty sixth": "36th",
    "thirty-seventh": "37th",
    "thirty seventh": "37th",
    "thirty-eighth": "38th",
    "thirty eighth": "38th",
    "thirty-ninth": "39th",
    "thirty ninth": "39th",
  };
  
  const basicOrdinalReplacements: Record<string, string> = {
    "third": "3rd",
    "fourth": "4th",
    "fifth": "5th",
    "sixth": "6th",
    "seventh": "7th",
    "eighth": "8th",
    "ninth": "9th",
    "tenth": "10th",
    "eleventh": "11th",
    "twelfth": "12th",
    "thirteenth": "13th",
    "fourteenth": "14th",
    "fifteenth": "15th",
    "sixteenth": "16th",
    "seventeenth": "17th",
    "eighteenth": "18th",
    "nineteenth": "19th",
    "twentieth": "20th",
    "thirtieth": "30th",
    "fortieth": "40th",
    "fiftieth": "50th",
    "sixtieth": "60th",
    "seventieth": "70th",
    "eightieth": "80th",
    "ninetieth": "90th",
    "hundredth": "100th"
  };
  
  let processedText = text;
  
  // Apply term replacements
  Object.entries(termReplacements).forEach(([original, replacement]) => {
    // Use word boundaries to avoid partial matches, case-insensitive for some terms
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    processedText = processedText.replace(regex, replacement);
  });
  
  // Apply compound ordinal replacements first (case-insensitive)
  Object.entries(compoundOrdinalReplacements).forEach(([original, replacement]) => {
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    processedText = processedText.replace(regex, replacement);
  });
  
  // Then apply basic ordinal replacements (case-insensitive)
  Object.entries(basicOrdinalReplacements).forEach(([original, replacement]) => {
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    processedText = processedText.replace(regex, replacement);
  });
  
  return processedText;
}

/**
 * Split English text into paragraphs based on specific punctuation marks while preserving HTML formatting
 */
export function splitEnglishText(text: string): string {
  if (!text) return '';
  
  let processedText = text;
  
  // STEP -1: Protect "X, [the] son of Y, said" patterns from being split
  // This keeps genealogical attributions together on one line
  // Pattern matches: ", son of ..." or ", the son of ..." followed by ", said" or ", said to"
  const sonOfProtections: string[] = [];
  processedText = processedText.replace(/,\s*(the\s+)?son of\s+[^,]+,\s+said/gi, (match) => {
    sonOfProtections.push(match);
    return `__SON_OF_PROTECTION_${sonOfProtections.length - 1}__`;
  });
  
  // STEP 0: Remove special formatting from MISHNA/GEMARA markers in English
  // Strip <strong> tags from these markers to make them plain text
  processedText = processedText.replace(/<strong[^>]*>(MISHNA|GEMARA):<\/strong>/gi, '$1:');
  
  // Convert <br> and <br/> tags to newlines BEFORE any other processing
  // This treats line breaks from source the same as punctuation-based splits
  processedText = processedText.replace(/<br\s*\/?>/gi, '\n');
  
  // Split on bolded commas and colons BEFORE protecting HTML tags
  // BUT avoid splitting comma + quote patterns (those will be handled later)
  processedText = processedText.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/g, (match, tagName, content) => {
    // Only process if the content contains commas or colons
    if (!/[,:]/.test(content)) {
      return match; // No commas or colons to split, return as-is
    }
    
    let splitContent = content;
    // Handle colons (always split)
    splitContent = splitContent.replace(/:/g, ':\n');
    // Handle commas, but NOT if followed by a quote (single or double) or digit, and NOT if preceded by a digit (number separator)
    splitContent = splitContent.replace(/,(?![""\u201C\u201D'\u2018\u2019]|\d)(?<!\d)/g, ',\n');
    
    return `<${tagName}>${splitContent}</${tagName}>`;
  });
  
  // Also handle cases where just the comma or colon itself is bolded
  // For commas: don't split if followed by a quote (single or double) or digit, or if preceded by digit (number separator)
  processedText = processedText.replace(/(?<!\d)<(b|strong)[^>]*>,<\/\1>(?![""\u201C\u201D'\u2018\u2019]|\d)/g, ',\n');
  // For colons: always split
  processedText = processedText.replace(/<(b|strong)[^>]*>:<\/\1>/g, ':\n');
  
  // Handle cross-tag scenarios where commas or colons might be at tag boundaries
  // For commas: don't split if followed by a quote (single or double) or digit
  processedText = processedText.replace(/(?<!\d)<\/(b|strong)>,(?![""\u201C\u201D'\u2018\u2019]|\d)(\s*)<\1[^>]*>/g, (match, tagName, whitespace) => {
    return `,\n${whitespace}`;
  });
  // For colons: always split
  processedText = processedText.replace(/<\/(b|strong)>:(\s*)<\1[^>]*>/g, (match, tagName, whitespace) => {
    return `:\n${whitespace}`;
  });
  
  // Now protect HTML tags by temporarily replacing them with placeholders
  const htmlTagPattern = /<\/?\w+(?:\s+[^>]*)?>/g;
  const htmlTags: string[] = [];
  const htmlPlaceholders: string[] = [];
  
  processedText = processedText.replace(htmlTagPattern, (match) => {
    const placeholder = `__HTML_TAG_${htmlTags.length}__`;
    htmlTags.push(match);
    htmlPlaceholders.push(placeholder);
    return placeholder;
  });
  
  // Handle triple-punctuation clusters FIRST (e.g., ?'", .'", ,'")
  // These must be handled before double-punctuation to avoid splitting in the middle
  processedText = processedText.replace(/([,.\?!;])[''\u2018\u2019][""\u201C\u201D]/g, (match) => match + '\n');
  
  // Handle comma + end quote pattern (for bolded commas that are followed by quotes)
  // Handle both single (') and double (") quotes, straight and curly
  processedText = processedText.replace(/,[""\u201C\u201D'\u2018\u2019]/g, (match) => match + '\n'); // Handle ,", ,', etc. as units
  
  // NOTE: General comma splitting is NOT done - only BOLDED commas split (handled above before HTML protection)
  
  // Split on periods, but handle period + end quote pattern first
  // Handle both single (') and double (") quotes, straight and curly
  processedText = processedText.replace(/\.[""\u201C\u201D'\u2018\u2019]/g, (match) => match + '\n'); // Handle .", .', etc. as units
  
  // Then split on ALL other periods - avoid splitting after "i.e." and other abbreviations
  // Also avoid splitting if followed by a quote (already handled above)
  processedText = processedText.replace(/\.(?![""\u201C\u201D'\u2018\u2019]|\s*[a-z])/g, '.\n');
  processedText = processedText.replace(/i\.e\.\n/g, 'i.e.');
  processedText = processedText.replace(/e\.g\.\n/g, 'e.g.');
  processedText = processedText.replace(/etc\.\n/g, 'etc.');
  processedText = processedText.replace(/vs\.\n/g, 'vs.');
  processedText = processedText.replace(/cf\.\n/g, 'cf.');
  
  // Split on question marks, but handle question mark + end quote pattern
  // Handle both single (') and double (") quotes, straight and curly
  processedText = processedText.replace(/\?[""\u201C\u201D'\u2018\u2019]/g, (match) => match + '\n'); // Handle ?", ?', etc. as units
  processedText = processedText.replace(/\?(?![""\u201C\u201D'\u2018\u2019])/g, '?\n'); // Handle other question marks
  
  // Split on semicolons
  processedText = processedText.replace(/;/g, ';\n');
  
  // Clean up multiple consecutive line breaks and trim
  processedText = processedText
    .replace(/\n\s*\n/g, '\n')  // Remove empty lines
    .replace(/^\s+|\s+$/g, '')  // Trim whitespace
    .replace(/\n\s+/g, '\n');   // Remove leading spaces on new lines
  
  // Restore HTML tags
  htmlPlaceholders.forEach((placeholder, index) => {
    processedText = processedText.replace(placeholder, htmlTags[index]);
  });
  
  // Restore "son of" protected patterns
  sonOfProtections.forEach((original, index) => {
    processedText = processedText.replace(`__SON_OF_PROTECTION_${index}__`, original);
  });
  
  // Final cleanup: Fix orphaned quotes that end up on their own lines
  // This handles cases where quotes get separated from preceding text
  // BUT only remove quotes that are NOT part of punctuation clusters (not preceded by punctuation or another quote)
  // Handle both single (') and double (") quotes, straight and curly
  processedText = processedText
    .replace(/,\n\n[""\u201C\u201D'\u2018\u2019]\s*\n/g, ',\n\n') // Remove orphaned quotes after commas (only with double newline)
    .replace(/(?<![,.\?!;''\u2018\u2019""\u201C\u201D])\n[""\u201C\u201D'\u2018\u2019]\s*\n/g, '\n') // Remove orphaned quotes NOT preceded by punctuation
    .replace(/(?<![,.\?!;''\u2018\u2019""\u201C\u201D])\n[""\u201C\u201D'\u2018\u2019]\s*$/g, ''); // Remove orphaned quotes at end NOT preceded by punctuation
  
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
