import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, ExternalLink, X } from "lucide-react";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import jastrowMappings from "@/data/jastrow-mappings.json";
import {
  HEBREW_ALPHABET,
  dictionaryStyles,
  convertSefariaLinksToInternal,
  convertJastrowInternalLinks,
  annotateGreekInHtml,
  splitIntoParagraphs,
  splitByPeriodAndLink,
  convertSuperscriptLetters,
  expandAbbreviations,
  useDictionaryCopyHandler,
  type DictionaryEntry,
  type AutosuggestSuggestion,
} from "@/lib/dictionary-format";
import { useLexiconIndex, searchHeadwords, findFuzzyMatches } from "@/lib/lexicon-index";

export default function Jastrow() {
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutosuggestSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);
  const lexiconIndex = useLexiconIndex("jastrow");

  const seoTitle = selectedLetter
    ? `Jastrow Dictionary - Letter ${selectedLetter} | ChavrutAI`
    : searchQuery
      ? `"${searchQuery}" - Jastrow Dictionary | ChavrutAI`
      : "Jastrow Talmud Dictionary - Modernized Hebrew & Aramaic | ChavrutAI";

  const seoDescription = selectedLetter
    ? `Browse Jastrow Dictionary entries starting with ${selectedLetter}. Comprehensive Talmudic Hebrew and Aramaic dictionary with modernized presentation.`
    : searchQuery
      ? `Jastrow Dictionary results for "${searchQuery}". Comprehensive Talmudic Hebrew and Aramaic dictionary with modernized presentation.`
      : "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic. Modernized presentation with expanded abbreviations, enhanced readability, and direct term lookup.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    ogTitle: seoTitle.replace(' | ChavrutAI', ''),
    ogDescription: seoDescription,
    canonical: selectedLetter
      ? `${window.location.origin}/jastrow?letter=${encodeURIComponent(selectedLetter)}`
      : `${window.location.origin}/jastrow`,
    robots: "index, follow",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Jastrow Talmud Dictionary",
      description: "Comprehensive dictionary of Talmudic Hebrew and Aramaic with modernized presentation",
      url: `${window.location.origin}/jastrow`,
      applicationCategory: "ReferenceApplication",
      operatingSystem: "Web",
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
      about: {
        "@type": "Book",
        name: "A Dictionary of the Targumim, the Talmud Babli and Yerushalmi, and the Midrashic Literature",
        author: {
          "@type": "Person",
          name: "Marcus Jastrow",
        },
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
    setLastSearchedQuery(q.trim());
    updateURLParams({ q: q.trim() });
    try {
      const response = await fetch(`/api/jastrow/search?query=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const entries = await response.json();
      const validEntries = Array.isArray(entries) ? entries.filter((entry: DictionaryEntry) =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];
      setResults(validEntries);
      setSelectedLetter("");
    } catch (error) {
      console.error('Frontend: Search error:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [searchQuery, updateURLParams]);

  const handleLetterClick = useCallback(async (letter: string) => {
    setSelectedLetter(letter);
    setLastSearchedQuery("");
    setIsLoading(true);
    updateURLParams({ letter });
    try {
      const response = await fetch(`/api/jastrow/browse?letter=${encodeURIComponent(letter)}`);
      if (!response.ok) throw new Error(`Browse failed: ${response.status}`);
      const entries = await response.json();
      const validEntries = Array.isArray(entries) ? entries.filter((entry: DictionaryEntry) =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];
      setResults(validEntries);
      setSearchQuery("");
    } catch (error) {
      console.error('Frontend: Browse error:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [updateURLParams]);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
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
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (suppressSuggestionsRef.current) {
        suppressSuggestionsRef.current = false;
        return;
      }
      const q = searchQuery.trim();
      if (!q || !lexiconIndex) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const matches = searchHeadwords(lexiconIndex, q, 20);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    }, 80);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, lexiconIndex]);

  const didYouMean = useMemo(() => {
    if (!lexiconIndex || results.length > 0 || !lastSearchedQuery || isLoading) return [];
    return findFuzzyMatches(lexiconIndex, lastSearchedQuery, 5);
  }, [lexiconIndex, results, lastSearchedQuery, isLoading]);

  const handleSuggestionClick = (suggestion: AutosuggestSuggestion) => {
    suppressSuggestionsRef.current = true;
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
        <h1 className="text-3xl font-bold text-primary mb-6">Jastrow Talmudic Dictionary</h1>

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
                </div>
              )}
            </div>
            <Button onClick={handleSearch} data-testid="button-search" disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold">Browse by Letter</h2>
            <Link
              href="/jastrow/headwords"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              data-testid="link-headword-index"
            >
              Browse all headwords →
            </Link>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
            {HEBREW_ALPHABET.map((letter) => {
              const count = lexiconIndex?.perLetterCounts[letter];
              return (
                <Button
                  key={letter}
                  variant={selectedLetter === letter ? "default" : "outline"}
                  size="sm"
                  className="h-12 font-hebrew text-lg flex-col gap-0 py-1"
                  onClick={() => handleLetterClick(letter)}
                  data-testid={`button-letter-${letter}`}
                  disabled={isLoading}
                >
                  <span className="leading-none">{letter}</span>
                  {count !== undefined && (
                    <span className="text-[10px] tabular-nums leading-none mt-0.5 opacity-70">
                      {count.toLocaleString()}
                    </span>
                  )}
                </Button>
              );
            })}
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
                {didYouMean.length > 0 && (
                  <div className="mt-6 max-w-md mx-auto">
                    <p className="text-sm text-muted-foreground mb-2">Did you mean:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {didYouMean.map((m, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setSearchQuery(m.voweled); handleSearch(m.voweled); }}
                          className="font-hebrew text-base px-3 py-1 rounded-md border border-border hover:bg-accent text-blue-600 dark:text-blue-400"
                          data-testid={`fuzzy-${i}`}
                          dir="rtl"
                        >
                          {m.voweled}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((entry, index) => {
                const formatOriginMetadata = () => {
                  if (!entry.language_code && !entry.language_reference) return null;
                  let originText = '';
                  if (entry.language_code) originText = entry.language_code;
                  if (entry.language_reference) originText += entry.language_reference;
                  return originText.trim();
                };

                const originMetadata = formatOriginMetadata();

                return (
                  <div key={entry.rid || index} className="pb-4 border-b border-border last:border-b-0" data-testid={`entry-${entry.rid || index}`}>
                    <div className="flex items-start gap-4">
                      <h3 className="text-lg font-bold font-hebrew min-w-fit">
                        <a
                          href={`https://www.sefaria.org.il/Jastrow%2C_${encodeURIComponent(entry.headword)}`}
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
                        {originMetadata && (
                          <div
                            className="mb-2 dictionary-content text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: annotateGreekInHtml(convertSefariaLinksToInternal(convertJastrowInternalLinks(expandAbbreviations(originMetadata, jastrowMappings.mappings)))) }}
                          />
                        )}
                        {entry.content.senses.map((sense, senseIndex) => (
                          <div
                            key={senseIndex}
                            className="mb-2 last:mb-0 dictionary-content"
                            dangerouslySetInnerHTML={{ __html: annotateGreekInHtml(convertSefariaLinksToInternal(convertJastrowInternalLinks(expandAbbreviations(convertSuperscriptLetters(splitByPeriodAndLink(splitIntoParagraphs(sense.definition))), jastrowMappings.mappings)))) }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            To find out more about this, see:{" "}
            <a
              href="https://www.ezrabrand.com/p/jastrows-talmud-dictionary-a-modernized"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
              data-testid="link-about"
            >
              Jastrow's Talmud Dictionary: A Modernized and Enhanced Digital Presentation at ChavrutAI
              <ExternalLink className="h-3 w-3" />
            </a>
            {" "}
            <span className="text-muted-foreground">(Sep 28, 2025)</span>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
