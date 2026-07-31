import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, SectionHeading } from "@/components/layout";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { SEARCH_SUGGESTIONS } from "@/data/search-suggestions";
import { removeNikud, containsHebrew } from "@/lib/text-processing";
import type { TextSearchResponse, SearchResult } from "@shared/schema";
import { getTractateSlug } from "@shared/tractates";
import { getBookBySlug } from "@shared/bible-books";

function getUrlParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get("q") || "",
    type: (p.get("type") as "all" | "talmud" | "bible") || "all",
    exact: p.get("exact") === "true",
    excludeBefore: p.get("exclude_before") || "",
    excludeAfter: p.get("exclude_after") || "",
  };
}

function buildUrl(params: {
  q: string;
  type: "all" | "talmud" | "bible";
  exact: boolean;
  excludeBefore: string;
  excludeAfter: string;
}) {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.type !== "all") p.set("type", params.type);
  if (params.exact) p.set("exact", "true");
  if (params.excludeBefore.trim()) p.set("exclude_before", params.excludeBefore.trim());
  if (params.excludeAfter.trim()) p.set("exclude_after", params.excludeAfter.trim());
  return `/search${p.toString() ? "?" + p.toString() : ""}`;
}

function shouldExcludeResult(text: string, query: string, excludeBefore: string, excludeAfter: string): boolean {
  if (!excludeBefore && !excludeAfter) return false;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryIdx = lowerText.indexOf(lowerQuery);
  if (queryIdx === -1) return false;
  if (excludeBefore.trim()) {
    const before = lowerText.slice(0, queryIdx);
    if (before.includes(excludeBefore.trim().toLowerCase())) return true;
  }
  if (excludeAfter.trim()) {
    const after = lowerText.slice(queryIdx + lowerQuery.length);
    if (after.includes(excludeAfter.trim().toLowerCase())) return true;
  }
  return false;
}

export default function SearchPage() {
  const initialParams = useMemo(() => getUrlParams(), []);

  const [searchQuery, setSearchQuery] = useState(initialParams.q);
  const [submittedQuery, setSubmittedQuery] = useState(initialParams.q);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "talmud" | "bible">(initialParams.type);
  const [exactMatch, setExactMatch] = useState(initialParams.exact);
  const [excludeBefore, setExcludeBefore] = useState(initialParams.excludeBefore);
  const [excludeAfter, setExcludeAfter] = useState(initialParams.excludeAfter);
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initialParams.excludeBefore || initialParams.excludeAfter)
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const pageSize = 15;

  const pushUrl = (overrides?: Partial<{
    q: string; type: "all" | "talmud" | "bible"; exact: boolean;
    excludeBefore: string; excludeAfter: string;
  }>) => {
    const url = buildUrl({
      q: overrides?.q ?? submittedQuery,
      type: overrides?.type ?? typeFilter,
      exact: overrides?.exact ?? exactMatch,
      excludeBefore: overrides?.excludeBefore ?? excludeBefore,
      excludeAfter: overrides?.excludeAfter ?? excludeAfter,
    });
    window.history.replaceState(null, "", url);
  };

  useSEO({
    ...getStaticSEO("/search", window.location.origin)!,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ChavrutAI Search",
      url: `${window.location.origin}/search`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${window.location.origin}/search?q={search_term}`,
        "query-input": "required name=search_term",
      },
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  });

  const { data: searchResults, isLoading, error } = useQuery<TextSearchResponse>({
    queryKey: ["/api/search/text", submittedQuery, currentPage, pageSize, typeFilter, exactMatch],
    queryFn: async ({ queryKey }) => {
      const [, query, page, size, type, exact] = queryKey as [string, string, number, number, string, boolean];
      const params = new URLSearchParams({
        query: query,
        page: page.toString(),
        pageSize: size.toString(),
        type: type,
        exact: exact.toString(),
      });
      const response = await fetch(`/api/search/text?${params}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      return response.json();
    },
    enabled: submittedQuery.length > 0,
  });

  const filteredResults = useMemo(() => {
    if (!searchResults) return null;
    if (!excludeBefore.trim() && !excludeAfter.trim()) return searchResults;
    const filtered = searchResults.results.filter(
      (r) => !shouldExcludeResult(r.text, submittedQuery, excludeBefore, excludeAfter)
    );
    return { ...searchResults, results: filtered };
  }, [searchResults, submittedQuery, excludeBefore, excludeAfter]);

  const excludedCount = searchResults && filteredResults
    ? searchResults.results.length - filteredResults.results.length
    : 0;

  const handleTypeChange = (newType: "all" | "talmud" | "bible") => {
    setTypeFilter(newType);
    setCurrentPage(1);
    pushUrl({ type: newType });
  };

  const handleExactChange = (checked: boolean) => {
    setExactMatch(checked);
    setCurrentPage(1);
    pushUrl({ exact: checked });
  };

  const filteredSuggestions = useMemo(() => {
    if (searchQuery.length < 1) return [];
    const query = searchQuery.toLowerCase();
    const matching = SEARCH_SUGGESTIONS.filter((term) => term.toLowerCase().includes(query));
    const startsWithQuery = matching.filter((c) => c.toLowerCase().startsWith(query));
    const containsQuery = matching.filter((c) => !c.toLowerCase().startsWith(query));
    return [...startsWithQuery, ...containsQuery].slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    if (isUserTyping && searchQuery.length >= 2 && searchQuery !== submittedQuery && filteredSuggestions.length > 0) {
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, filteredSuggestions, isUserTyping, submittedQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const trimmed = searchQuery.trim();
      setSubmittedQuery(trimmed);
      setCurrentPage(1);
      setShowSuggestions(false);
      setIsUserTyping(false);
      pushUrl({ q: trimmed });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSubmittedQuery(suggestion);
    setCurrentPage(1);
    setShowSuggestions(false);
    setIsUserTyping(false);
    searchInputRef.current?.blur();
    pushUrl({ q: suggestion });
  };

  const getChavrutaiLink = (result: SearchResult): string | null => {
    const ref = result.ref;
    if (result.type === "talmud") {
      const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)([ab])(?::(\d+)(?:-\d+)?)?$/);
      if (match) {
        const tractate = getTractateSlug(match[1].trim());
        const folio = match[2];
        const side = match[3];
        const section = match[4];
        const sectionAnchor = section ? `#section-${section}` : "";
        return `/talmud/${tractate}/${folio}${side}${sectionAnchor}`;
      }
    } else if (result.type === "bible") {
      const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)(?::(\d+)(?:-\d+)?)?$/);
      if (match) {
        const bookInfo = getBookBySlug(match[1].trim());
        const book = bookInfo ? bookInfo.slug : match[1].trim().replace(/\s+/g, "_");
        const chapter = match[2];
        const verse = match[3];
        const verseAnchor = verse ? `#${verse}` : "";
        return `/bible/${book}/${chapter}${verseAnchor}`;
      }
    }
    return null;
  };

  const renderHighlightedText = (result: SearchResult) => {
    let text = result.highlight || result.text;
    const isHebrew = containsHebrew(text);
    if (isHebrew) {
      const parts = text.split(/(<[^>]+>)/);
      text = parts
        .map((part) => {
          if (part.startsWith("<")) return part;
          return removeNikud(part);
        })
        .join("");
    }
    return (
      <div
        className="text-sm text-muted-foreground leading-relaxed"
        dir={isHebrew ? "rtl" : "ltr"}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  };

  const getTypeBarColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "talmud":
        return "var(--category-talmud-bavli)";
      case "bible":
        return "var(--category-tanakh)";
      default:
        return "var(--border)";
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "talmud":
        return "Talmud";
      case "bible":
        return "Bible";
      default:
        return "Text";
    }
  };

  return (
    <PageShell mainClassName="max-w-4xl px-4 py-6">
      <style>{`
        mark {
          background-color: #fef08a;
          padding: 0 2px;
          border-radius: 2px;
        }
        .dark mark {
          background-color: #854d0e;
          color: #fef9c3;
        }
      `}</style>

      <div className="space-y-6">
        <PageHeader className="pt-10 pb-2" title="Search Texts">
          <p className="text-muted-foreground">Search the Talmud and Bible in Hebrew and English</p>
        </PageHeader>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Enter a word or phrase..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsUserTyping(true);
                }}
                onFocus={() => {
                  if (isUserTyping && suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="text-lg py-6"
                data-testid="input-search"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded max-h-60 overflow-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-secondary transition-colors text-sm"
                      data-testid={`suggestion-${index}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!searchQuery.trim() || isLoading}
              data-testid="button-search"
            >
              {isLoading ? "Searching…" : "Search"}
            </Button>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <input
              id="exact-match"
              type="checkbox"
              checked={exactMatch}
              onChange={(e) => handleExactChange(e.target.checked)}
              className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
              data-testid="checkbox-exact-match"
            />
            <label htmlFor="exact-match" className="text-sm cursor-pointer select-none">
              Exact match
            </label>
            <span className="text-xs text-muted-foreground ml-1">
              (requires words to appear exactly as typed, in order)
            </span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-sm text-primary hover:text-foreground transition-colors"
              data-testid="button-toggle-advanced"
            >
              {showAdvanced ? "▲" : "▼"} Advanced filters
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 border border-border rounded bg-secondary space-y-3">
                <p className="text-xs text-muted-foreground">
                  Exclude results where another phrase appears before or after your search term in the passage.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="exclude-before" className="text-sm font-medium">
                      Exclude if preceded by
                    </label>
                    <Input
                      id="exclude-before"
                      type="text"
                      placeholder='e.g. "Shimon"'
                      value={excludeBefore}
                      onChange={(e) => setExcludeBefore(e.target.value)}
                      className="text-sm"
                      data-testid="input-exclude-before"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="exclude-after" className="text-sm font-medium">
                      Exclude if followed by
                    </label>
                    <Input
                      id="exclude-after"
                      type="text"
                      placeholder='e.g. "bar Kahana"'
                      value={excludeAfter}
                      onChange={(e) => setExcludeAfter(e.target.value)}
                      className="text-sm"
                      data-testid="input-exclude-after"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {submittedQuery && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Filter:</span>
            <button
              type="button"
              onClick={() => handleTypeChange("all")}
              data-testid="filter-all"
              className={typeFilter === "all" ? "text-foreground font-medium" : "text-primary hover:underline"}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("talmud")}
              data-testid="filter-talmud"
              className={typeFilter === "talmud" ? "text-foreground font-medium" : "text-primary hover:underline"}
            >
              Talmud
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("bible")}
              data-testid="filter-bible"
              className={typeFilter === "bible" ? "text-foreground font-medium" : "text-primary hover:underline"}
            >
              Bible
            </button>
          </div>
        )}

        {/* How to use section - shown when no search is active */}
        {!submittedQuery && !isLoading && (
          <section className="pt-8 border-t border-border" data-testid="section-how-to-search">
            <div className="py-2">
              <SectionHeading className="mb-4">How to Search</SectionHeading>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-1">What you can search</h3>
                  <p>
                    Search across the 37 tractates of the Babylonian Talmud and the complete Hebrew
                    Bible (Tanakh) in both Hebrew and English.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Search tips</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Enter a word or phrase in Hebrew or English</li>
                    <li>As you type, suggestions for common Talmudic concepts will appear</li>
                    <li>Use the filter buttons to show only Talmud or Bible results</li>
                    <li>
                      Check <strong>Exact match</strong> to require words appear precisely as typed
                      (e.g. "Rabbi Abba" won't match "R' Ḥiyya bar Abba")
                    </li>
                    <li>
                      Use <strong>Advanced filters</strong> to exclude results where another phrase
                      appears before or after your search term (e.g. "ben Zoma" without "Shimon"
                      preceding it)
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">URL parameters</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 font-mono text-xs">
                    <li>
                      <span className="text-foreground">?q=</span> — search query
                    </li>
                    <li>
                      <span className="text-foreground">?type=talmud</span> or{" "}
                      <span className="text-foreground">?type=bible</span> — limit to a corpus
                    </li>
                    <li>
                      <span className="text-foreground">?exact=true</span> — exact phrase match
                    </li>
                    <li>
                      <span className="text-foreground">?exclude_before=</span> — exclude phrase
                      appearing before
                    </li>
                    <li>
                      <span className="text-foreground">?exclude_after=</span> — exclude phrase
                      appearing after
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Results</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      Each result shows the source reference and matching text with your search term
                      highlighted
                    </li>
                    <li>Click on any result to go directly to that section or verse in ChavrutAI</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-border mt-4">
                  <p className="text-sm">
                    To find out more about this feature, see: "
                    <a
                      href="https://www.ezrabrand.com/p/introducing-chavrutais-search-full"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      data-testid="link-search-blog-post"
                    >
                      Introducing ChavrutAI's Search: Full-Text Search of Bible and Talmud →
                    </a>
                    " (Dec 23, 2025)
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="border border-destructive rounded py-4 px-4 text-destructive">
            Failed to search. Please try again.
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="text-muted-foreground">Searching…</span>
          </div>
        )}

        {filteredResults && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {filteredResults.total.toLocaleString()} results for "{filteredResults.query}"
                {exactMatch && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (exact)
                  </span>
                )}
                {excludedCount > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({excludedCount} filtered by context on this page)
                  </span>
                )}
              </span>
              {filteredResults.totalPages > 1 && (
                <span>
                  Page {filteredResults.page} of {filteredResults.totalPages}
                </span>
              )}
            </div>

            {filteredResults.results.length === 0 ? (
              <div className="border-t border-border py-8 text-center text-muted-foreground">
                No results found for "{filteredResults.query}". Try a different search term.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResults.results.map((result, index) => {
                  const chavrutaiLink = getChavrutaiLink(result);

                  const handleResultClick = (e: React.MouseEvent) => {
                    if (!chavrutaiLink) return;
                    if (e.ctrlKey || e.metaKey) {
                      window.open(chavrutaiLink, "_blank");
                    } else {
                      const [path, hash] = chavrutaiLink.split("#");
                      navigate(path);
                      if (hash) {
                        setTimeout(() => {
                          window.location.hash = hash;
                        }, 0);
                      }
                    }
                  };

                  const handleOpenNewTab = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (chavrutaiLink) {
                      window.open(chavrutaiLink, "_blank");
                    }
                  };

                  return (
                    <div
                      key={index}
                      className={`border border-border rounded p-4 transition-colors ${chavrutaiLink ? "hover:bg-secondary cursor-pointer" : ""}`}
                      onClick={handleResultClick}
                      data-testid={`result-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div
                            className="mb-1.5 h-[2px] w-10"
                            style={{ backgroundColor: getTypeBarColor(result.type) }}
                            aria-hidden="true"
                          />
                          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              {getTypeLabel(result.type)}
                            </span>
                            <span className="font-medium text-foreground">{result.ref}</span>
                          </div>
                          {renderHighlightedText(result)}
                        </div>
                        {chavrutaiLink && (
                          <div className="flex-shrink-0 self-center flex items-center gap-2">
                            <button
                              onClick={handleOpenNewTab}
                              className="p-1 rounded hover:bg-secondary transition-colors text-sm text-primary"
                              title="Open in new tab"
                              data-testid={`button-open-new-tab-${index}`}
                            >
                              ↗
                            </button>
                            <span className="text-muted-foreground" aria-hidden="true">›</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredResults.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 text-sm">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  data-testid="button-prev-page"
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                >
                  ‹ Previous
                </button>
                <span className="px-4 text-muted-foreground">
                  Page {currentPage} of {filteredResults.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(filteredResults.totalPages, p + 1))}
                  disabled={currentPage >= filteredResults.totalPages}
                  data-testid="button-next-page"
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                >
                  Next ›
                </button>
              </div>
            )}
          </div>
        )}

        {!submittedQuery && !isLoading && (
          <div className="text-center py-12 text-muted-foreground border-t border-border">
            <p className="text-lg mb-2">Start your search</p>
            <p className="text-sm">Enter a word or phrase to search across the Talmud and Bible</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
