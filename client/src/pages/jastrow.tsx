import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, ExternalLink, X } from "lucide-react";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { HEBREW_ALPHABET } from "@shared/hebrew-alphabet";
import jastrowMappings from "@shared/data/lexicon-mappings/jastrow.json";
import {
  dictionaryStyles,
  convertSefariaLinksToInternal,
  convertJastrowInternalLinks,
  annotateTransliterationsInHtml,
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
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutosuggestSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);
  const lexiconIndex = useLexiconIndex("jastrow");

  const seoTitle = searchQuery
    ? `"${searchQuery}" - Jastrow Dictionary | ChavrutAI`
    : "Jastrow Talmud Dictionary - Modernized Hebrew & Aramaic | ChavrutAI";

  const seoDescription = searchQuery
    ? `Jastrow Dictionary results for "${searchQuery}". Comprehensive Talmudic Hebrew and Aramaic dictionary with modernized presentation.`
    : "Search the comprehensive Jastrow Dictionary of Talmudic Hebrew and Aramaic. Modernized presentation with expanded abbreviations, enhanced readability, and direct term lookup.";

  useSEO({
    title: seoTitle,
    description: seoDescription,
    ogTitle: seoTitle.replace(' | ChavrutAI', ''),
    ogDescription: seoDescription,
    canonical: `${window.location.origin}/jastrow`,
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

  const updateURLParams = useCallback((params: { q?: string }) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    url.searchParams.delete('letter');
    if (params.q) url.searchParams.set('q', params.q);
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
    } catch (error) {
      console.error('Frontend: Search error:', error);
      setResults([]);
    }
    setIsLoading(false);
  }, [searchQuery, updateURLParams]);

  // Initial-load + popstate handler. Re-runs the search when the URL's `q`
  // changes via back/forward or our click interceptor below. Legacy `?letter=`
  // URLs redirect to the headword index page (which superseded inline browse).
  useEffect(() => {
    const runFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const letter = params.get('letter');
      if (q) {
        // Only suppress suggestions if the query actually changes — otherwise
        // setSearchQuery is a no-op, the suggestions effect never runs, and
        // the flag would silently swallow the user's next keystroke.
        setSearchQuery((prev) => {
          if (prev !== q) suppressSuggestionsRef.current = true;
          return q;
        });
        handleSearch(q);
      } else if (letter) {
        window.location.replace(`/jastrow/headwords/${encodeURIComponent(letter)}`);
      } else {
        // Bare /jastrow (e.g. user popped back past all searches) — clear stale
        // state so the UI matches the URL.
        setSearchQuery("");
        setLastSearchedQuery("");
        setResults([]);
        setSuggestions([]);
        setShowSuggestions(false);
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

  // Intercept clicks on internal /jastrow?... links (e.g. cross-refs in entry
  // HTML) so we can re-run the search without a full page reload. We
  // deliberately skip modifier-key / middle-click / target="_blank" /
  // defaultPrevented events so open-in-new-tab and other browser conventions
  // still work.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/jastrow?')) return;
      e.preventDefault();
      window.history.pushState(null, '', href);
      const params = new URLSearchParams(href.split('?')[1] || '');
      const q = params.get('q');
      if (q) {
        setSearchQuery((prev) => {
          if (prev !== q) suppressSuggestionsRef.current = true;
          return q;
        });
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
          <h2 className="text-lg font-semibold mb-4">Browse by Letter</h2>
          <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
            {HEBREW_ALPHABET.map((letter) => {
              const count = lexiconIndex?.perLetterCounts[letter];
              return (
                <Link
                  key={letter}
                  href={`/jastrow/headwords/${encodeURIComponent(letter)}`}
                  data-testid={`button-letter-${letter}`}
                  className="h-12 inline-flex flex-col items-center justify-center gap-0 rounded-md border border-border text-lg font-hebrew transition-colors hover:bg-accent"
                >
                  <span className="leading-none">{letter}</span>
                  {count !== undefined && (
                    <span className="text-[10px] tabular-nums leading-none mt-0.5 opacity-70">
                      {count.toLocaleString()}
                    </span>
                  )}
                </Link>
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
                            dangerouslySetInnerHTML={{ __html: annotateTransliterationsInHtml(convertSefariaLinksToInternal(convertJastrowInternalLinks(expandAbbreviations(originMetadata, jastrowMappings.mappings)))) }}
                          />
                        )}
                        {entry.content.senses.map((sense, senseIndex) => (
                          <div
                            key={senseIndex}
                            className="mb-2 last:mb-0 dictionary-content"
                            dangerouslySetInnerHTML={{ __html: annotateTransliterationsInHtml(convertSefariaLinksToInternal(convertJastrowInternalLinks(expandAbbreviations(convertSuperscriptLetters(splitByPeriodAndLink(splitIntoParagraphs(sense.definition))), jastrowMappings.mappings)))) }}
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
