import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { Footer } from "@/components/footer";
import jastrowMappings from "@/data/jastrow-mappings.json";

const HEBREW_ALPHABET = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'ן', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'
];

interface DictionaryEntry {
  headword: string;
  rid?: string;
  parent_lexicon: string;
  content: {
    senses: Array<{
      definition: string;
    }>;
  };
}

interface AutosuggestSuggestion {
  unvoweled: string;
  voweled: string;
}

export default function Dictionary() {
  // Add CSS for dictionary content styling
  const dictionaryStyles = `
    /* Link styling */
    .dictionary-content a.refLink {
      color: #2563eb;
      text-decoration: underline;
      cursor: pointer;
    }
    .dictionary-content a.refLink:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }
    .dark .dictionary-content a.refLink {
      color: #60a5fa;
    }
    .dark .dictionary-content a.refLink:hover {
      color: #93c5fd;
    }
    
    /* Font styling */
    .dictionary-content {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .dictionary-content span[dir="rtl"] {
      font-family: 'Assistant', -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 500;
    }
    .dictionary-content i {
      font-style: italic;
    }
    
    /* Hebrew letter buttons and search input */
    .font-hebrew {
      font-family: 'Assistant', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Header title */
    .dictionary-header {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  `;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutosuggestSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Function to split text into paragraphs by long dash while preserving HTML structure
  const splitIntoParagraphs = (text: string) => {
    // Check for various dash types: em dash (—), en dash (–), and HTML entities
    const dashPatterns = ['—', '–', '&mdash;', '&#8212;', '&#x2014;'];
    let foundDash = '';

    for (const dash of dashPatterns) {
      if (text.includes(dash)) {
        foundDash = dash;
        break;
      }
    }

    if (!foundDash) {
      return text;
    }

    // Split by the found dash and filter out empty parts
    const parts = text.split(foundDash).filter(part => part.trim().length > 0);

    // If there's only one part, return as is
    if (parts.length <= 1) {
      return text;
    }

    // Wrap each part in a paragraph tag with extra spacing, preserving HTML
    return parts
      .map(part => `<p class="mb-4">${part.trim()}</p>`)
      .join('');
  };

  // Function to expand abbreviations using comprehensive Jastrow mappings
  // This function preserves HTML tags while expanding abbreviations
  const expandAbbreviations = (text: string) => {
    let result = text;

    // Sort mappings by length (longest first) to avoid partial replacements
    const sortedMappings = Object.entries(jastrowMappings.mappings).sort(
      ([a], [b]) => b.length - a.length
    );

    // Apply all mappings, but only to text outside of HTML tags
    for (const [abbreviation, expansion] of sortedMappings) {
      // Create appropriate regex pattern based on the abbreviation format
      let pattern: RegExp;

      if (abbreviation === '&c.') {
        // Special case for &c. - don't use word boundary since & is not a word character
        pattern = new RegExp('&c\\.(?![^<]*>)', 'g');
      } else if (abbreviation.includes(' ')) {
        // Multi-word abbreviations - match as exact phrases, but not inside HTML tags
        const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`${escaped}(?![^<]*>)`, 'g');
      } else if (abbreviation.endsWith('.')) {
        // Abbreviations ending with period - match with word boundary before, not inside HTML tags
        const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`\\b${escaped}(?![^<]*>)`, 'g');
      } else {
        // Other abbreviations - use word boundaries on both sides, not inside HTML tags
        const escaped = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`\\b${escaped}\\b(?![^<]*>)`, 'g');
      }

      result = result.replace(pattern, expansion);
    }

    return result;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      console.log('Frontend: Making search request for:', searchQuery);
      const response = await fetch(`/api/dictionary/search?query=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const entries = await response.json();
      console.log('Frontend: Search response:', entries);

      // Validate entries structure
      const validEntries = Array.isArray(entries) ? entries.filter(entry =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];

      setResults(validEntries);
      setSelectedLetter(""); // Clear letter selection when searching
      console.log('Frontend: Valid search results:', validEntries.length, 'entries');
    } catch (error) {
      console.error('Frontend: Search error:', error);
      setResults([]);
    }
    setIsLoading(false);
  };

  const handleLetterClick = async (letter: string) => {
    setSelectedLetter(letter);
    setIsLoading(true);

    try {
      console.log('Frontend: Making browse request for letter:', letter);
      const response = await fetch(`/api/dictionary/browse?letter=${encodeURIComponent(letter)}`);

      if (!response.ok) {
        throw new Error(`Browse failed: ${response.status}`);
      }

      const entries = await response.json();
      console.log('Frontend: Browse response:', entries);

      // Validate entries structure
      const validEntries = Array.isArray(entries) ? entries.filter(entry =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];

      setResults(validEntries);
      setSearchQuery(""); // Clear search when browsing
      console.log('Frontend: Valid browse results:', validEntries.length, 'entries');
    } catch (error) {
      console.error('Frontend: Browse error:', error);
      setResults([]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Debounced function to fetch autosuggest suggestions
  useEffect(() => {
    const fetchSuggestions = async (query: string) => {
      if (query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/dictionary/autosuggest?query=${encodeURIComponent(query)}`);
        if (response.ok) {
          const suggestionsData = await response.json();
          setSuggestions(suggestionsData);
          setShowSuggestions(suggestionsData.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Autosuggest error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setIsLoadingSuggestions(false);
    };

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSuggestionClick = (suggestion: AutosuggestSuggestion) => {
    setSearchQuery(suggestion.voweled);
    setShowSuggestions(false);
    // Automatically trigger search when suggestion is selected
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // Handle clicks outside the suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Inject CSS for dictionary links */}
      <style dangerouslySetInnerHTML={{ __html: dictionaryStyles }} />
      
      {/* Simple Header */}
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-foreground dictionary-header">Jastrow Dictionary - Modernized</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Search */}
        <div className="mb-8">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1" ref={searchInputRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="Search Hebrew/Aramaic"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="pl-10 font-hebrew"
                data-testid="input-search"
                disabled={isLoading}
              />

              {/* Autosuggest Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      data-testid={`suggestion-${index}`}
                      className="px-4 py-3 hover:bg-accent cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="font-hebrew text-lg" dir="rtl">{suggestion.voweled}</span>
                      {suggestion.voweled !== suggestion.unvoweled && (
                        <span className="text-muted-foreground text-sm font-hebrew" dir="rtl">{suggestion.unvoweled}</span>
                      )}
                    </div>
                  ))}
                  {isLoadingSuggestions && (
                    <div className="px-4 py-3 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      Loading suggestions...
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} data-testid="button-search" disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </div>

        {/* Browse by Letter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Browse by Letter</h2>
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
            {HEBREW_ALPHABET.map((letter) => (
              <Button
                key={letter}
                variant={selectedLetter === letter ? "default" : "outline"}
                size="sm"
                className="h-10 font-hebrew text-lg"
                onClick={() => handleLetterClick(letter)}
                data-testid={`button-letter-${letter}`}
                disabled={isLoading}
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Dictionary Entries</h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading entries...</span>
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No entries found. Try a different search term or browse by letter.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((entry, index) => (
                <div key={entry.rid || index} className="pb-4 border-b border-border last:border-b-0" data-testid={`entry-${entry.rid || index}`}>
                  <div className="flex items-start gap-4">
                    <h3 className="text-lg font-bold font-hebrew text-primary min-w-fit">
                      {entry.headword}
                    </h3>
                    <div className="text-foreground flex-1 prose prose-sm max-w-none">
                      {entry.content.senses.map((sense, senseIndex) => (
                        <div 
                          key={senseIndex} 
                          className="mb-2 last:mb-0 dictionary-content" 
                          dangerouslySetInnerHTML={{ __html: expandAbbreviations(splitIntoParagraphs(sense.definition)) }} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About Link */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            To find out more about this, see:{" "}
            <a 
              href="https://www.ezrabrand.com/p/jastrows-talmud-dictionary-a-modernized"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-about"
            >
              https://www.ezrabrand.com/p/jastrows-talmud-dictionary-a-modernized
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}