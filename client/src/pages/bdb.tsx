import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, ExternalLink, X } from "lucide-react";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { getBDBSEO } from "@shared/seo-data";
import { HEBREW_ALPHABET } from "@shared/hebrew-alphabet";
import bdbMappings from "@shared/data/lexicon-mappings/bdb.json";
import {
  dictionaryStyles,
  convertSefariaLinksToInternal,
  convertBdbInternalLinks,
  convertJastrowInternalLinks,
  annotateTransliterationsInHtml,
  convertSupTagsToParens,
  splitIntoParagraphsBdb,
  convertSuperscriptLetters,
  expandAbbreviations,
  useDictionaryCopyHandler,
  type DictionaryEntry,
  type AutosuggestSuggestion,
} from "@/lib/dictionary-format";
import { useLexiconIndex, searchHeadwords, findFuzzyMatches } from "@/lib/lexicon-index";

export default function Bdb() {
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutosuggestSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [splitBySemicolon, setSplitBySemicolon] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialLoadRef = useRef(false);
  const suppressSuggestionsRef = useRef(false);
  const lexiconIndex = useLexiconIndex("bdb");

  const bdbSEO = getBDBSEO("", searchQuery, window.location.origin);

  useSEO({
    ...bdbSEO,
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
      const response = await fetch(`/api/bdb/search?query=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const entries = await response.json();
      const validEntries = Array.isArray(entries) ? entries.filter((entry: DictionaryEntry) =>
        entry && entry.headword && entry.content && Array.isArray(entry.content.senses)
      ) : [];
      setResults(validEntries);
    } catch (error) {
      console.error('BDB: Search error:', error);
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
        window.location.replace(`/bdb/headwords/${encodeURIComponent(letter)}`);
      } else {
        // Bare /bdb (e.g. user popped back past all searches) — clear stale state
        // so the UI matches the URL.
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

  // Intercept clicks on internal /bdb?... links (e.g. cross-refs in entry HTML)
  // so we can re-run the search without a full page reload. We deliberately
  // skip modifier-key / middle-click / target="_blank" / defaultPrevented
  // events so open-in-new-tab and other browser conventions still work.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/bdb?')) return;
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

  // Extract a numbered outline from an entry's senses. A "numbered sense" is one
  // whose definition begins with <strong>N.</strong> (BDB's top-level numbered
  // meanings). For each, we pull the first <em>…</em> phrase as a short label.
  // Returns null when there are fewer than 2 numbered senses (nothing to outline).
  const buildOutline = (senses: { definition: string }[]): { num: string; label: string; index: number }[] | null => {
    const items: { num: string; label: string; index: number }[] = [];
    senses.forEach((sense, i) => {
      const m = sense.definition.match(/^\s*<strong>\s*(\d+)\.?\s*<\/strong>\s*(?:<em>([^<]+)<\/em>)?/);
      if (m) {
        const label = (m[2] || '').replace(/\s+/g, ' ').trim();
        items.push({ num: m[1], label, index: i });
      }
    });
    return items.length >= 2 ? items : null;
  };

  // Pipeline: split on long-dash only (no bullet-point splitting for BDB),
  // then convert <sup> citations to inline parens, then cross-refs, Bible/Talmud
  // refs, formatting, and abbreviation expansion. Greek transliteration runs last.
  const renderDefinition = (definition: string): string => {
    return annotateTransliterationsInHtml(
      convertSefariaLinksToInternal(
        convertJastrowInternalLinks(
          convertBdbInternalLinks(
            expandAbbreviations(
              convertSuperscriptLetters(
                convertSupTagsToParens(
                  splitIntoParagraphsBdb(definition, splitBySemicolon)
                )
              ),
              bdbMappings.mappings
            )
          )
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
        <h1 className="text-3xl font-bold text-primary mb-2">
          BDB Hebrew Bible Dictionary
          <span className="ml-2 text-base font-medium text-muted-foreground align-middle" data-testid="badge-beta">(beta)</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-3">
          Brown, Driver, and Briggs — A Hebrew and English Lexicon of the Old Testament (1906)
        </p>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowAbout((v) => !v)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            data-testid="button-about-toggle"
            aria-expanded={showAbout}
          >
            {showAbout ? "▲" : "▼"} About this dictionary
          </button>

          {showAbout && (
            <Card className="mt-2 bg-secondary/40 border-border" data-testid="about-panel">
              <CardContent className="pt-4 text-sm text-foreground space-y-3">
                <p>
                  <strong>BDB</strong> is shorthand for Francis Brown, S. R. Driver, and Charles
                  Briggs's <em>A Hebrew and English Lexicon of the Old Testament</em> (Oxford, 1906),
                  the standard scholarly dictionary for biblical Hebrew. It covers every Hebrew root
                  in the Tanakh. This reader pulls live entries from Sefaria's{" "}
                  <code className="text-xs bg-muted px-1 rounded">/api/words</code> endpoint and renders
                  them with a modernized presentation layer.
                </p>
                <p className="font-medium">What this reader adds on top of the raw text:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Inline abbreviation expansion.</strong> A wide variety of abbreviations
                    are replaced inline. Categories include grammatical shorthand
                    (<em>Pf.</em>, <em>Impf.</em>, <em>cstr.</em>, <em>abs.</em>), Latin logic
                    (<em>l.c.</em>, <em>c. acc.</em>, <em>i.q.</em>), cognate-language tags
                    (<em>Ar.</em>, <em>Aram.</em>, <em>Akk.</em>, <em>Ugar.</em>), scholar surnames
                    (<em>Dl</em> = Delitzsch, <em>Lag</em> = Lagarde, <em>We</em> = Wellhausen,{" "}
                    <em>Hpt</em> = Haupt), and symbols (<em>√</em> = verbal root, <em>𝔊</em> =
                    Septuagint, <em>𝔐</em> = Masoretic).
                  </li>
                  <li>
                    <strong>Bible citations as live links.</strong> BDB's compact references like{" "}
                    <em>Nu 21:30</em> or <em>Je 7:18</em> are expanded to <em>Numbers 21:30</em> /{" "}
                    <em>Jeremiah 7:18</em> and link directly to the corresponding chapter in the
                    ChavrutAI Bible reader.
                  </li>
                  <li>
                    <strong>Superscript and footnote markers inlined.</strong> BDB's tiny{" "}
                    <code className="text-xs bg-muted px-1 rounded">&lt;sup&gt;</code> qualifications
                    are converted to readable parentheticals.
                  </li>
                  <li>
                    <strong>Browse by Hebrew letter.</strong> Each letter button shows a per-letter
                    headword count and goes straight to the full filtered headword index for that
                    letter (5,250 entries total).
                  </li>
                  <li>
                    <strong>Cognate-script transliteration.</strong> Greek, Arabic, Syriac, and
                    Ethiopic (Ge'ez) runs are annotated inline with transliterations (Greek,
                    Arabic, and Ethiopic into Latin characters; Syriac into Hebrew characters), to
                    make the entries accessible to a wider audience.
                  </li>
                  <li>
                    <strong>Expanded abbreviations as monospace pills.</strong> Every inline
                    expansion is rendered in a small monospace pill, so consecutive expansions
                    (e.g. "Wellhausen Nöldeke") read as two distinct authority tags rather than
                    running together, and you can see at a glance which words came from the
                    original abbreviated text.
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  <a
                    href="https://www.ezrabrand.com/p/chavrutai-modernized-bdb-bible"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    Read more about this feature →
                  </a>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

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
                  href={`/bdb/headwords/${encodeURIComponent(letter)}`}
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

        {(isLoading || lastSearchedQuery) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Dictionary Entries</h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={splitBySemicolon}
                onChange={(e) => setSplitBySemicolon(e.target.checked)}
                className="accent-primary"
              />
              Split by semicolons
            </label>
          </div>

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
                const entryKey = entry.rid || `${index}`;
                const outline = buildOutline(entry.content.senses);
                return (
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
                    <div className="text-foreground flex-1 prose prose-sm max-w-none min-w-0">
                      {outline && (
                        <nav
                          aria-label="Sense outline"
                          className="mb-3 not-prose text-sm text-muted-foreground border-l-2 border-border pl-3"
                          data-testid={`outline-${entryKey}`}
                        >
                          <ol className="list-none p-0 m-0 space-y-0.5">
                            {outline.map((item) => (
                              <li key={item.index} className="leading-snug">
                                <a
                                  href={`#sense-${entryKey}-${item.index}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.getElementById(`sense-${entryKey}-${item.index}`);
                                    if (el) {
                                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      history.replaceState(null, '', `#sense-${entryKey}-${item.index}`);
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                >
                                  <span className="font-semibold tabular-nums">{item.num}.</span>
                                  {item.label && <span className="italic ml-1">{item.label}</span>}
                                </a>
                              </li>
                            ))}
                          </ol>
                        </nav>
                      )}
                      {entry.content.senses.map((sense, senseIndex) => (
                        <div
                          key={senseIndex}
                          id={`sense-${entryKey}-${senseIndex}`}
                          className="mb-2 last:mb-0 dictionary-content scroll-mt-20"
                          dangerouslySetInnerHTML={{ __html: renderDefinition(sense.definition) }}
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
        )}
      </main>
      <Footer />
    </div>
  );
}
