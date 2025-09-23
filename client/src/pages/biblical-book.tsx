import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getBiblicalBook, getBookDisplayName } from "@/lib/biblical-index-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, ExternalLink, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { Footer } from "@/components/footer";

export default function BiblicalBookPage() {
  const [, params] = useRoute("/biblical-index/book/:bookName");
  const bookName = params?.bookName;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  
  const { data: book, isLoading, error } = useQuery({
    queryKey: ['biblical-book', bookName],
    queryFn: () => bookName ? getBiblicalBook(bookName) : null,
    enabled: !!bookName,
  });

  if (!bookName) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Book Not Specified</h1>
        <Link href="/biblical-index">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Biblical Index
          </Button>
        </Link>
      </div>
    );
  }

  if (error || (!isLoading && !book)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
        <p>The requested biblical book was not found or could not be loaded.</p>
        <Link href="/biblical-index">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Biblical Index
          </Button>
        </Link>
      </div>
    );
  }

  // Filter citations based on search and chapter selection
  const filteredCitations = book?.chapters.flatMap(chapter => 
    chapter.citations
      .filter(citation => {
        const matchesSearch = !searchTerm || 
          citation.verseText.toLowerCase().includes(searchTerm.toLowerCase()) ||
          citation.verseLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          citation.talmudFullText.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesChapter = selectedChapter === null || chapter.chapterNumber === selectedChapter;
        
        return matchesSearch && matchesChapter;
      })
      .map(citation => ({ ...citation, chapterNumber: chapter.chapterNumber }))
  ) || [];

  const displayName = book ? book.bookName : getBookDisplayName(bookName);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <Link href="/biblical-index">
          <Button variant="outline" className="mb-4" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Biblical Index
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold" data-testid="book-title">
            {displayName} — Biblical Citations
          </h1>
        </div>

        {book && (
          <div className="flex items-center gap-4 mb-6">
            <Badge variant="secondary" data-testid="total-entries-badge">
              {book.totalEntries} Total Citations
            </Badge>
            <Badge variant="outline" data-testid="total-chapters-badge">
              {book.chapters.length} Chapters
            </Badge>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search citations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          
          {book && (
            <select
              value={selectedChapter || ""}
              onChange={(e) => setSelectedChapter(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-input bg-background rounded-md"
              data-testid="chapter-filter"
            >
              <option value="">All Chapters</option>
              {book.chapters.map(chapter => (
                <option key={chapter.chapterNumber} value={chapter.chapterNumber}>
                  Chapter {chapter.chapterNumber}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : book ? (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredCitations.length} of {book.totalEntries} citations
            {selectedChapter && ` from Chapter ${selectedChapter}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredCitations.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Citations Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? `No citations match your search term "${searchTerm}"`
                      : selectedChapter 
                        ? `No citations found in Chapter ${selectedChapter}`
                        : "No citations available for this book"
                    }
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Fixed Headers */}
                  <div className="sticky top-0 z-20 bg-background border-b">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px] bg-background border-r">Verse</TableHead>
                          <TableHead className="w-[160px] bg-background border-r">Quoted Text</TableHead>
                          <TableHead className="w-[140px] bg-background border-r">Talmud Location</TableHead>
                          <TableHead className="w-[400px] bg-background">Context</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                  </div>
                  
                  {/* Scrollable Body */}
                  <div className="overflow-auto max-h-[60vh]">
                    <Table>
                      <TableBody>
                        {filteredCitations.map((citation, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell className="w-[140px] font-medium border-r" data-testid={`verse-${index}`}>
                              <span>{citation.verseLocation}</span>
                            </TableCell>
                            <TableCell className="w-[160px] border-r">
                              <div className="text-sm text-muted-foreground whitespace-normal break-words">
                                {citation.verseText}
                              </div>
                            </TableCell>
                            <TableCell className="w-[140px] border-r">
                              <a
                                href={citation.talmudLocationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary hover:underline text-sm"
                                data-testid={`talmud-link-${index}`}
                              >
                                {citation.talmudLocation}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </TableCell>
                            <TableCell className="w-[400px]">
                              <div 
                                className="text-sm whitespace-normal break-words"
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeHtml(citation.talmudFullText)
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Book Not Available</h3>
          <p className="text-muted-foreground">
            This biblical book is not currently available in the index.
          </p>
        </div>
      )}
      
      <Footer />
    </div>
  );
}