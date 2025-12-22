import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, BookOpen, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { SharedLayout } from "@/components/layout";
import { useSEO } from "@/hooks/use-seo";
import { useGazetteerData } from "@/lib/gazetteer";
import type { TextSearchResponse, SearchResult } from "@shared/schema";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "talmud" | "bible">("all");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 15;

  useSEO({
    title: "Search Talmud & Bible - Hebrew & English | ChavrutAI",
    description: "Search through the Babylonian Talmud and Hebrew Bible (Tanakh) in Hebrew and English. Find passages, concepts, and references across classical Jewish texts.",
    ogTitle: "Search Talmud & Bible - Hebrew & English",
    ogDescription: "Search through the Babylonian Talmud and Hebrew Bible in Hebrew and English.",
    canonical: `${window.location.origin}/search`,
    robots: "index, follow"
  });

  const { data: gazetteerData } = useGazetteerData();

  const { data: searchResults, isLoading, error } = useQuery<TextSearchResponse>({
    queryKey: ['/api/search/text', submittedQuery, currentPage, pageSize, typeFilter],
    queryFn: async ({ queryKey }) => {
      const [, query, page, size, type] = queryKey as [string, string, number, number, string];
      const params = new URLSearchParams({
        query: query,
        page: page.toString(),
        pageSize: size.toString(),
        type: type,
      });
      const response = await fetch(`/api/search/text?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    },
    enabled: submittedQuery.length > 0,
  });

  const handleTypeChange = (newType: "all" | "talmud" | "bible") => {
    setTypeFilter(newType);
    setCurrentPage(1);
  };

  const filteredSuggestions = useMemo(() => {
    if (!gazetteerData || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const concepts = gazetteerData.concepts || [];
    
    return concepts
      .filter(concept => concept.toLowerCase().includes(query))
      .slice(0, 8);
  }, [gazetteerData, searchQuery]);

  useEffect(() => {
    if (searchQuery.length >= 2 && filteredSuggestions.length > 0) {
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, filteredSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
      setCurrentPage(1);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSubmittedQuery(suggestion);
    setCurrentPage(1);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const getChavrutaiLink = (result: SearchResult): string | null => {
    const ref = result.ref;
    
    if (result.type === "talmud") {
      // Match format like "Berakhot 5a:9" or "Berakhot 5a:9-10" (range refs)
      // Capture the first section number for deep linking
      const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)([ab])(?::(\d+)(?:-\d+)?)?$/);
      if (match) {
        const tractate = match[1].trim().toLowerCase().replace(/\s+/g, '-');
        const folio = match[2];
        const side = match[3];
        const section = match[4]; // First section number (before any dash)
        const sectionAnchor = section ? `#section-${section}` : '';
        return `/tractate/${tractate}/${folio}${side}${sectionAnchor}`;
      }
    } else if (result.type === "bible") {
      // Match format like "Genesis 1:1" or "Genesis 1:1-3" (range refs)
      // Capture the first verse number for deep linking
      const match = ref.match(/^([A-Za-z\s]+)\s+(\d+)(?::(\d+)(?:-\d+)?)?$/);
      if (match) {
        const book = match[1].trim().toLowerCase().replace(/\s+/g, '-');
        const chapter = match[2];
        const verse = match[3]; // First verse number (before any dash)
        const verseAnchor = verse ? `#verse-${verse}` : '';
        return `/bible/${book}/${chapter}${verseAnchor}`;
      }
    }
    
    return null;
  };

  const renderHighlightedText = (result: SearchResult) => {
    const text = result.highlight || result.text;
    return (
      <div 
        className="text-sm text-muted-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  };

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "talmud":
        return <ScrollText className="w-4 h-4 text-amber-600" />;
      case "bible":
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-600" />;
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
    <SharedLayout variant="simple" mainMaxWidth="max-w-4xl">
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Search Texts
          </h1>
          <p className="text-muted-foreground">
            Search the Talmud and Bible in Hebrew and English
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Enter a word or phrase..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pr-10 text-lg py-6"
                data-testid="input-search"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors text-sm"
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
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </form>

        {submittedQuery && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Filter:</span>
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("all")}
              data-testid="filter-all"
            >
              All
            </Button>
            <Button
              variant={typeFilter === "talmud" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("talmud")}
              data-testid="filter-talmud"
            >
              <ScrollText className="w-4 h-4 mr-1" />
              Talmud
            </Button>
            <Button
              variant={typeFilter === "bible" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange("bible")}
              data-testid="filter-bible"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Bible
            </Button>
          </div>
        )}

        {/* How to use section - shown when no search is active */}
        {!submittedQuery && !isLoading && (
          <Card className="bg-muted/50" data-testid="section-how-to-search">
            <CardContent className="py-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">How to Search</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-1">What you can search</h3>
                  <p>Search across the 37 tractates of the Babylonian Talmud and the complete Hebrew Bible (Tanakh) in both Hebrew and English.</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Search tips</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Enter a word or phrase in Hebrew or English</li>
                    <li>As you type, suggestions for common Talmudic concepts will appear</li>
                    <li>Use the filter buttons to show only Talmud or Bible results</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Results</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Each result shows the source reference and matching text with your search term highlighted</li>
                    <li>"View in ChavrutAI" takes you directly to the specific section or verse</li>
                    <li>"View on Sefaria" opens the text on Sefaria.org for additional study resources</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4 text-destructive">
              Failed to search. Please try again.
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {searchResults && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {searchResults.total.toLocaleString()} results for "{searchResults.query}"
              </span>
              {searchResults.totalPages > 1 && (
                <span>
                  Page {searchResults.page} of {searchResults.totalPages}
                </span>
              )}
            </div>

            {searchResults.results.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No results found for "{searchResults.query}". Try a different search term.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {searchResults.results.map((result, index) => {
                  const chavrutaiLink = getChavrutaiLink(result);
                  
                  return (
                    <Card key={index} className="hover:bg-accent/50 transition-colors" data-testid={`result-${index}`}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                {getTypeLabel(result.type)}
                              </span>
                              <span className="font-medium text-foreground">
                                {result.ref}
                              </span>
                              {result.hebrewRef && (
                                <span className="text-muted-foreground font-hebrew" dir="rtl">
                                  {result.hebrewRef}
                                </span>
                              )}
                            </div>
                            
                            {renderHighlightedText(result)}
                            
                            <div className="mt-2 flex gap-2">
                              {chavrutaiLink && (
                                <Link href={chavrutaiLink}>
                                  <Button variant="outline" size="sm" data-testid={`link-chavrutai-${index}`}>
                                    View in ChavrutAI
                                  </Button>
                                </Link>
                              )}
                              <a
                                href={`https://www.sefaria.org/${result.ref.replace(/\s+/g, '_')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm" data-testid={`link-sefaria-${index}`}>
                                  View on Sefaria
                                </Button>
                              </a>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {searchResults.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="px-4 text-sm text-muted-foreground">
                  Page {currentPage} of {searchResults.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(searchResults.totalPages, p + 1))}
                  disabled={currentPage >= searchResults.totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {!submittedQuery && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Start your search</p>
            <p className="text-sm">
              Enter a word or phrase to search across the Talmud and Bible
            </p>
          </div>
        )}
      </div>
    </SharedLayout>
  );
}
