import { useQuery } from "@tanstack/react-query";

// Gazetteer data types
export interface GazetteerData {
  concepts: string[];
  names: string[];
  biblicalNames: string[];
  biblicalNations: string[];
  biblicalPlaces: string[];
  talmudToponyms: string[];
}

// Raw gazetteer URLs from the talmud-nlp-indexer repository
const GAZETTEER_URLS = {
  concepts: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/talmud_concepts_gazetteer.txt',
  names: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/talmud_names_gazetteer.txt',
  biblicalNames: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/bible_names_gazetteer.txt',
  biblicalNations: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/nations_and_demonyms_gazetteer.txt',
  biblicalPlaces: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/bible_places_gazetteer.txt',
  talmudToponyms: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/talmud_toponyms_gazetteer.txt',
} as const;

// Fetch and parse a single gazetteer file
async function fetchGazetteerFile(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch gazetteer: ${response.status}`);
    }
    const text = await response.text();
    
    // Parse the text file - each line is a term, ignore empty lines and filter out "on"
    const terms = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.toLowerCase() !== 'on')
      .sort(); // Sort alphabetically for consistent ordering
    
    return terms;
  } catch (error) {
    console.warn(`Failed to fetch gazetteer from ${url}:`, error);
    return [];
  }
}

// Fetch all gazetteer data
async function fetchAllGazetteers(): Promise<GazetteerData> {
  
  const [concepts, names, biblicalNames, biblicalNations, biblicalPlaces, talmudToponyms] = 
    await Promise.all([
      fetchGazetteerFile(GAZETTEER_URLS.concepts),
      fetchGazetteerFile(GAZETTEER_URLS.names),
      fetchGazetteerFile(GAZETTEER_URLS.biblicalNames),
      fetchGazetteerFile(GAZETTEER_URLS.biblicalNations),
      fetchGazetteerFile(GAZETTEER_URLS.biblicalPlaces),
      fetchGazetteerFile(GAZETTEER_URLS.talmudToponyms),
    ]);

  const gazetteerData = {
    concepts,
    names,
    biblicalNames,
    biblicalNations,
    biblicalPlaces,
    talmudToponyms,
  };
  
  
  
  return gazetteerData;
}

// React hook for fetching gazetteer data with caching
// Only fetches when highlighting is enabled to avoid blocking page load
export function useGazetteerData(enabled: boolean = true) {
  return useQuery({
    queryKey: ['/gazetteers'],
    queryFn: fetchAllGazetteers,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    enabled,
  });
}

// Highlighting categories
export type HighlightCategory = 'concept' | 'name' | 'place';

// Text match interface for highlighting results
export interface TextMatch {
  term: string;
  startIndex: number;
  endIndex: number;
  category: HighlightCategory;
}

// Text highlighting engine
export class TextHighlighter {
  private gazetteerData: GazetteerData;
  private compiledRegexes: Map<HighlightCategory, { regex: RegExp; termsSet: Set<string> }> = new Map();
  private cache: Map<string, string> = new Map();
  private maxCacheSize = 500;

  constructor(gazetteerData: GazetteerData) {
    this.gazetteerData = gazetteerData;
    this.precompileRegexes();
  }

  private precompileRegexes(): void {
    const categories: HighlightCategory[] = ['concept', 'name', 'place'];
    for (const category of categories) {
      const terms = this.getTermsForCategory(category);
      if (terms.length === 0) continue;
      const termsSet = new Set(terms);
      const escapedTerms = terms.map(t => this.escapeRegex(t));
      const alternation = escapedTerms.join('|');
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternation})s?(?![\\p{L}\\p{N}])`, 'gu');
      this.compiledRegexes.set(category, { regex, termsSet });
    }
  }

  private findBoldRegions(text: string): Array<{ start: number; end: number }> {
    const regions: Array<{ start: number; end: number }> = [];
    const boldPattern = /<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = boldPattern.exec(text)) !== null) {
      const openingTagEnd = match.index + match[0].indexOf('>') + 1;
      const closingTagStart = match.index + match[0].lastIndexOf('<');
      regions.push({ start: openingTagEnd, end: closingTagStart });
    }
    return regions;
  }

  private isWithinBoldRegion(
    startIndex: number,
    endIndex: number,
    boldRegions: Array<{ start: number; end: number }>
  ): boolean {
    return boldRegions.some(
      (region) => startIndex >= region.start && endIndex <= region.end
    );
  }

  findMatches(text: string, enabledCategories: HighlightCategory[]): TextMatch[] {
    const matches: TextMatch[] = [];
    const boldRegions = this.findBoldRegions(text);
    if (boldRegions.length === 0) return matches;

    for (const category of enabledCategories) {
      const compiled = this.compiledRegexes.get(category);
      if (!compiled) continue;

      const { regex, termsSet } = compiled;
      regex.lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;

        if (this.isWithinBoldRegion(startIndex, endIndex, boldRegions)) {
          const matchedText = match[0];
          let baseTerm = matchedText;
          if (!termsSet.has(baseTerm) && baseTerm.endsWith('s')) {
            baseTerm = baseTerm.slice(0, -1);
          }
          const originalTerm = this.getOriginalTerm(baseTerm);
          matches.push({
            term: originalTerm,
            startIndex,
            endIndex,
            category,
          });
        }
      }
    }

    return matches.sort((a, b) => {
      if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
      return b.term.length - a.term.length;
    });
  }

  applyHighlighting(text: string, enabledCategories: HighlightCategory[]): string {
    const cacheKey = text + '|' + enabledCategories.join(',');
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const matches = this.findMatches(text, enabledCategories);

    if (matches.length === 0) {
      this.setCacheEntry(cacheKey, text);
      return text;
    }

    let result = '';
    let lastIndex = 0;

    for (const match of matches) {
      if (match.startIndex < lastIndex) continue;

      result += text.substring(lastIndex, match.startIndex);
      const highlightClass = this.getCssClassForCategory(match.category);
      const originalText = text.substring(match.startIndex, match.endIndex);
      result += `<span class="${highlightClass}" data-term="${this.escapeHtml(match.term)}" data-category="${match.category}">${this.escapeHtml(originalText)}</span>`;
      lastIndex = match.endIndex;
    }

    result += text.substring(lastIndex);
    this.setCacheEntry(cacheKey, result);
    return result;
  }

  private setCacheEntry(key: string, value: string): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  private getTermsForCategory(category: HighlightCategory): string[] {
    let terms: string[] = [];

    switch (category) {
      case 'concept':
        terms = [...this.gazetteerData.concepts];
        break;
      case 'name':
        terms = [
          ...this.gazetteerData.names,
          ...this.gazetteerData.biblicalNames,
        ];
        break;
      case 'place':
        terms = [
          ...this.gazetteerData.biblicalPlaces,
          ...this.gazetteerData.talmudToponyms,
        ];
        break;
      default:
        return [];
    }

    if (category === 'name') {
      const rabbiVariants: string[] = [];
      terms.forEach(term => {
        const hasStartRabbi = term.startsWith('Rabbi ');
        const hasMiddleRabbi = term.includes(' Rabbi ');
        if (hasStartRabbi) {
          rabbiVariants.push(term.replace(/^Rabbi /, "R' "));
        }
        if (hasMiddleRabbi) {
          rabbiVariants.push(term.replace(/ Rabbi /g, " R' "));
        }
        if (hasStartRabbi && hasMiddleRabbi) {
          rabbiVariants.push(term.replace(/^Rabbi /, "R' ").replace(/ Rabbi /g, " R' "));
        }
      });
      terms.push(...rabbiVariants);
    }

    return terms.sort((a, b) => b.length - a.length);
  }

  // Get CSS class for highlighting category
  private getCssClassForCategory(category: HighlightCategory): string {
    const baseClasses = 'rounded px-1 transition-colors';
    
    switch (category) {
      case 'concept':
        return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100`;
      case 'name':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100`;
      case 'place':
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100`;
      default:
        return baseClasses;
    }
  }

  // Escape special regex characters
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Escape HTML characters
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get original gazetteer term (convert R' back to Rabbi for data attributes)
  private getOriginalTerm(term: string): string {
    const allNameTerms = [
      ...this.gazetteerData.names,
      ...this.gazetteerData.biblicalNames,
    ];
    
    // Handle R' at the beginning
    if (term.startsWith("R' ")) {
      const rabbiForm = term.replace(/^R' /, "Rabbi ");
      if (allNameTerms.includes(rabbiForm)) {
        return rabbiForm;
      }
    }
    
    // Handle R' in the middle of phrases
    if (term.includes(" R' ")) {
      const rabbiForm = term.replace(/ R' /g, " Rabbi ");
      if (allNameTerms.includes(rabbiForm)) {
        return rabbiForm;
      }
    }
    
    return term;
  }
}