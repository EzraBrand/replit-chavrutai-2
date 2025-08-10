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
  biblicalNations: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/bible_nations_gazetteer.txt',
  biblicalPlaces: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/bible_places_gazetteer.txt',
  talmudToponyms: 'https://raw.githubusercontent.com/EzraBrand/talmud-nlp-indexer/main/data/talmud_toponyms_gazetteer.txt',
} as const;

// Fetch and parse a single gazetteer file
async function fetchGazetteerFile(url: string): Promise<string[]> {
  try {
    console.log(`Fetching gazetteer from: ${url}`);
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
    
    console.log(`Loaded ${terms.length} terms from ${url.split('/').pop()}`);
    return terms;
  } catch (error) {
    console.warn(`Failed to fetch gazetteer from ${url}:`, error);
    return [];
  }
}

// Fetch all gazetteer data
async function fetchAllGazetteers(): Promise<GazetteerData> {
  console.log('Starting gazetteer data fetch...');
  
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
  
  console.log('Gazetteer data loaded:', {
    concepts: concepts.length,
    names: names.length,
    biblicalNames: biblicalNames.length,
    biblicalNations: biblicalNations.length,
    biblicalPlaces: biblicalPlaces.length,
    talmudToponyms: talmudToponyms.length,
    totalTerms: concepts.length + names.length + biblicalNames.length + biblicalNations.length + biblicalPlaces.length + talmudToponyms.length
  });
  
  // Check if "Hillel" is in the names data
  if (names.includes('Hillel')) {
    console.log('✓ "Hillel" found in names gazetteer');
  } else {
    console.log('✗ "Hillel" NOT found in names gazetteer');
    console.log('Names containing "hillel" (case-insensitive):', names.filter(name => name.toLowerCase().includes('hillel')));
  }
  
  return gazetteerData;
}

// React hook for fetching gazetteer data with caching
export function useGazetteerData() {
  return useQuery({
    queryKey: ['/gazetteers'],
    queryFn: fetchAllGazetteers,
    staleTime: 24 * 60 * 60 * 1000, // Consider data stale after 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // Cache for 7 days
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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

  constructor(gazetteerData: GazetteerData) {
    this.gazetteerData = gazetteerData;
  }

  // Find all matching terms in the text
  findMatches(text: string, enabledCategories: HighlightCategory[]): TextMatch[] {
    const matches: TextMatch[] = [];
    
    for (const category of enabledCategories) {
      const terms = this.getTermsForCategory(category);
      
      for (const term of terms) {
        // Create word boundary regex to match whole words only
        const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            term,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            category,
          });
        }
      }
    }
    
    // Sort matches by start position to avoid overlapping issues
    return matches.sort((a, b) => a.startIndex - b.startIndex);
  }

  // Apply highlighting to text and return HTML
  applyHighlighting(text: string, enabledCategories: HighlightCategory[]): string {
    const matches = this.findMatches(text, enabledCategories);
    
    if (matches.length === 0) {
      return text;
    }

    // Build highlighted text by replacing matches with HTML spans
    let result = '';
    let lastIndex = 0;

    for (const match of matches) {
      // Skip overlapping matches
      if (match.startIndex < lastIndex) {
        continue;
      }

      // Add text before the match
      result += text.substring(lastIndex, match.startIndex);

      // Add highlighted term with appropriate styling
      const highlightClass = this.getCssClassForCategory(match.category);
      const originalText = text.substring(match.startIndex, match.endIndex);
      
      result += `<span class="${highlightClass}" data-term="${this.escapeHtml(match.term)}" data-category="${match.category}">${this.escapeHtml(originalText)}</span>`;

      lastIndex = match.endIndex;
    }

    // Add remaining text
    result += text.substring(lastIndex);

    return result;
  }

  // Get terms for a specific category
  private getTermsForCategory(category: HighlightCategory): string[] {
    switch (category) {
      case 'concept':
        return this.gazetteerData.concepts;
      case 'name':
        return [
          ...this.gazetteerData.names,
          ...this.gazetteerData.biblicalNames,
        ];
      case 'place':
        return [
          ...this.gazetteerData.biblicalPlaces,
          ...this.gazetteerData.talmudToponyms,
        ];
      default:
        return [];
    }
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
}