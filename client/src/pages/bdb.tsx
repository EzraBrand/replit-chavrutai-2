import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, ExternalLink, X } from "lucide-react";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import bdbMappings from "@/data/bdb-mappings.json";
import {
  HEBREW_ALPHABET,
  dictionaryStyles,
  convertSefariaLinksToInternal,
  convertBdbInternalLinks,
  convertSupTagsToParens,
  splitIntoParagraphs,
  splitByPeriodAndLink,
  convertSuperscriptLetters,
  expandAbbreviations,
  useDictionaryCopyHandler,
  type DictionaryEntry,
  type AutosuggestSuggestion,
} from "@/lib/dictionary-format";

export default function Bdb() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutosuggestSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);

  const seoTitle = selectedLetter
    ? `BDB Hebrew Bible Dictionary - Letter ${selectedLetter} | ChavrutAI`
    : searchQuery
      ? `"${searchQuery}" - BDB Hebrew Bible Dictionary | ChavrutAI`
      : "BDB (Brown-Driver-Briggs) Hebrew Bible Dictionary | ChavrutAI";

  const seoDescription = selectedLetter
    ? `Browse Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary entries starting with ${selectedLetter}. Classic biblical Hebrew lexicon with modernized presentation.`
    : searchQuery
      ? `BDB Hebrew Bible Dictionary results for "${searchQuery}". Brown-Driver-Briggs biblical Hebrew lexicon with modernized presentation.`
      : "Search the Brown-Driver-Briggs (BDB) Hebrew Bible Dictionary. Modernized presentation with expanded abbreviations and direct links to biblical citations on ChavrutAI.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    ogTitle: seoTitle.replace(' | ChavrutAI', ''),
    ogDescription: seoDescription,
    canonical: selectedLetter
      ? `${window.location.origin}/bdb?letter=${encodeURIComponent(selectedLetter)}`
      : `${window.location.origin}/bdb`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "BDB Hebrew Bible Dictionary",
      description: "Brown-Driver-Briggs Hebrew Bible Dictionary with modernized presentation",
      url: `${window.location.origin}/bdb`,
      applicationCategory: "ReferenceApplication",
      operatingSystem: "Web",
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
      about: {
        "@type": "Book",
        name: "A Hebrew and English Lexicon of the Old Testament",
        author: [
          { "@type": "Person", name: "Francis Brown" },
          { "@type": "Person", name: "S. R. Driver" },
          { "@type": "Person", name: "Charles A. Briggs" },
        ],
      },
    },
  });

  const updateURLParams = useCallback((params: { q?: string; letter?: string }) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('letter');
    if (params.q) url.searchParams.set('q', params.q);
    if (params.letter) url.searchParams.set('letter', params.letter);
    const newPath = url.pathname + url.search;
    window.history.replaceState(null, '', newPath);
  }, []);

  const handleSearch = useCallback(async (query?: string | unknown) => {
    const q = typeof query === 'string' ? query : searchQuery;
    if (!q.trim()) return;
    setIsLoading(true);
    updateURLParams({ q: q.trim() });
    try {
      const response = await fetch(`/api/bdb/search?query=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const entries = await response.json();
      const validEntries = Array.isArray(entries) ? entries.filter((entry: DictionaryEntry) =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];
      setResults(validEntries);
      setSelectedLetter("");
    } catch (error) {
      console.error('BDB: Search error:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [searchQuery, updateURLParams]);

  const handleLetterClick = useCallback(async (letter: string) => {
    setSelectedLetter(letter);
    setIsLoading(true);
    updateURLParams({ letter });
    try {
      const response = await fetch(`/api/bdb/browse?letter=${encodeURIComponent(letter)}`);
      if (!response.ok) throw new Error(`Browse failed: ${response.status}`);
      const entries = await response.json();
      const validEntries = Array.isArray(entries) ? entries.filter((entry: DictionaryEntry) =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];
      setResults(validEntries);
      setSearchQuery("");
    } catch (error) {
      console.error('BDB: Browse error:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [updateURLParams]);

  // Re-run on URL changes (e.g. clicking a BDB cross-ref rewrites to /bdb?q=X)
  useEffect(() => {
    const runFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const letter = params.get('letter');
      if (q) {
        suppressSuggestionsRef.current = true;
        setSearchQuery(q);
        handleSearch(q);
      } else if (letter) {
        handleLetterClick(letter);
      }
    };

    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      runFromUrl();
    }

    const onPopState = () => runFromUrl();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Intercept clicks on internal /bdb?... links so we can re-run the search without a full page reload
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || !href.startsWith('/bdb?')) return;
      e.preventDefault();
      window.history.pushState(null, '', href);
      const params = new URLSearchParams(href.split('?')[1] || '');
      const q = params.get('q');
      if (q) {
        suppressSuggestionsRef.current = true;
        setSearchQuery(q);
        handleSearch(q);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [handleSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async (query: string) => {
      if (query.length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/bdb/autosuggest?query=${encodeURIComponent(query)}`);
        if (response.ok) {
          const suggestionsData = await response.json();
          setSuggestions(suggestionsData);
          setShowSuggestions(suggestionsData.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('BDB autosuggest error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setIsLoadingSuggestions(false);
    };

    const timeoutId = setTimeout(() => {
      if (suppressSuggestionsRef.current) {
        suppressSuggestionsRef.current = false;
        return;
      }
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
    handleSearch(suggestion.voweled);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useDictionaryCopyHandler('main.max-w-4xl', [results]);

  // Pipeline: convert <sup> citations to inline parens first, then BDB-internal
  // cross-refs, then Bible/Talmud refs, then formatting and abbreviation expansion
  const renderDefinition = (definition: string): string => {
    return convertSefariaLinksToInternal(
      convertBdbInternalLinks(
        expandAbbreviations(
          convertSuperscriptLetters(
            splitByPeriodAndLink(
              convertSupTagsToParens(
                splitIntoParagraphs(definition)
              )
            )
          ),
          bdbMappings.mappings
        )
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{ __html: dictionaryStyles }} />

      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
              data-testid="header-logo-link"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="/hebrew-book-icon.png"
                  alt="ChavrutAI Logo"
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-primary mb-2">BDB Hebrew Bible Dictionary</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Brown, Driver, and Briggs — A Hebrew and English Lexicon of the Old Testament (1906)
        </p>

        <div className="mb-8">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1" ref={searchInputRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="Search Hebrew"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="pl-10 pr-9 font-hebrew"
                data-testid="input-search"
                disabled={isLoading}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                    (searchInputRef.current?.querySelector('input[type="search"]') as HTMLInputElement)?.focus();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

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
                    <h3 className="text-lg font-bold font-hebrew min-w-fit">
                      <a
                        href={`https://www.sefaria.org.il/BDB%2C_${encodeURIComponent(entry.headword)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1.5"
                        title="View this entry on Sefaria"
                      >
                        {entry.headword}
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                      </a>
                    </h3>
                    <div className="text-foreground flex-1 prose prose-sm max-w-none">
                      {entry.content.senses.map((sense, senseIndex) => (
                        <div
                          key={senseIndex}
                          className="mb-2 last:mb-0 dictionary-content"
                          dangerouslySetInnerHTML={{ __html: renderDefinition(sense.definition) }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
