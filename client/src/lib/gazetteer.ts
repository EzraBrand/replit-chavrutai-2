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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch gazetteer: ${response.status}`);
    }
    const text = await response.text();
    
    // Parse the text file - each line is a term, ignore empty lines
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .sort(); // Sort alphabetically for consistent ordering
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

  return {
    concepts,
    names,
    biblicalNames,
    biblicalNations,
    biblicalPlaces,
    talmudToponyms,
  };
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

// Highlighting category type
export type HighlightCategory = 'concept' | 'name' | 'place';

// Term matching interface
export interface MatchedTerm {
  term: string;
  category: HighlightCategory;
  startIndex: number;
  endIndex: number;
}

// Text highlighting engine
export class TextHighlighter {
  private gazetteerData: GazetteerData;
  
  constructor(gazetteerData: GazetteerData) {
    this.gazetteerData = gazetteerData;
  }

  // Create consolidated term lists by category
  private getTermsByCategory(): Record<HighlightCategory, string[]> {
    return {
      concept: this.gazetteerData.concepts,
      name: [
        ...this.gazetteerData.names,
        ...this.gazetteerData.biblicalNames,
      ],
      place: [
        ...this.gazetteerData.biblicalPlaces,
        ...this.gazetteerData.biblicalNations,
        ...this.gazetteerData.talmudToponyms,
      ],
    };
  }

  // Find all term matches in text
  findMatches(text: string, enabledCategories: HighlightCategory[]): MatchedTerm[] {
    const termsByCategory = this.getTermsByCategory();
    const matches: MatchedTerm[] = [];

    // Process each enabled category
    for (const category of enabledCategories) {
      const terms = termsByCategory[category];
      
      for (const term of terms) {
        // Create regex for word boundary matching (case-insensitive)
        // Handle both single words and multi-word phrases
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
        
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            term: match[0], // Preserve original casing from text
            category,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          });
        }
      }
    }

    // Sort matches by start index to ensure proper processing order
    return matches.sort((a, b) => a.startIndex - b.startIndex);
  }

  // Apply highlighting to text
  applyHighlighting(
    text: string, 
    enabledCategories: HighlightCategory[],
    options: {
      conceptClass?: string;
      nameClass?: string;
      placeClass?: string;
    } = {}
  ): string {
    const matches = this.findMatches(text, enabledCategories);
    
    if (matches.length === 0) {
      return text;
    }

    // Remove overlapping matches (keep the first one found)
    const nonOverlappingMatches = this.removeOverlaps(matches);
    
    // Apply highlighting from right to left to maintain correct indices
    let highlightedText = text;
    
    for (let i = nonOverlappingMatches.length - 1; i >= 0; i--) {
      const match = nonOverlappingMatches[i];
      const className = this.getCategoryClass(match.category, options);
      
      const before = highlightedText.substring(0, match.startIndex);
      const highlighted = highlightedText.substring(match.startIndex, match.endIndex);
      const after = highlightedText.substring(match.endIndex);
      
      highlightedText = before + 
        `<span class="${className}" data-term="${match.term}" data-category="${match.category}" data-testid="highlighted-term-${match.category}">${highlighted}</span>` + 
        after;
    }

    return highlightedText;
  }

  // Remove overlapping matches, preferring earlier matches
  private removeOverlaps(matches: MatchedTerm[]): MatchedTerm[] {
    if (matches.length <= 1) return matches;

    const result: MatchedTerm[] = [];
    let lastEnd = -1;

    for (const match of matches) {
      if (match.startIndex >= lastEnd) {
        result.push(match);
        lastEnd = match.endIndex;
      }
    }

    return result;
  }

  // Get CSS class for highlighting category
  private getCategoryClass(
    category: HighlightCategory, 
    options: { conceptClass?: string; nameClass?: string; placeClass?: string; }
  ): string {
    const defaultClasses = {
      concept: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded px-1 cursor-help',
      name: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 rounded px-1 cursor-help', 
      place: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 rounded px-1 cursor-help',
    };

    return options[`${category}Class`] || defaultClasses[category];
  }
}