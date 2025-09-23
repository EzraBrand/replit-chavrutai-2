import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getBooksFromCategory, getBookDisplayName, getBiblicalIndexMetadata } from "@/lib/biblical-index-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Scroll, Crown, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons = {
  torah: BookOpen,
  neviim: Scroll,
  ketuvim: Crown
};

const categoryTitles = {
  torah: "Torah (Five Books of Moses)",
  neviim: "Nevi'im (Prophets)", 
  ketuvim: "Ketuvim (Writings)"
};

export default function BiblicalCategoryPage() {
  const [, params] = useRoute("/biblical-index/:category");
  const category = params?.category as 'torah' | 'neviim' | 'ketuvim';
  
  if (!category || !['torah', 'neviim', 'ketuvim'].includes(category)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p>The requested biblical category was not found.</p>
        <Link href="/biblical-index">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Biblical Index
          </Button>
        </Link>
      </div>
    );
  }

  const { data: books, isLoading, error } = useQuery({
    queryKey: ['biblical-category', category],
    queryFn: () => getBooksFromCategory(category),
  });

  const metadata = getBiblicalIndexMetadata();
  const Icon = categoryIcons[category];
  const categoryTitle = categoryTitles[category];
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Error Loading Category</h1>
        <p>Failed to load books for this category. Please try again later.</p>
        <Link href="/biblical-index">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Biblical Index
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link href="/biblical-index">
          <Button variant="outline" className="mb-4" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Biblical Index
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="category-title">
            {categoryTitle}
          </h1>
        </div>
        
        <p className="text-lg text-muted-foreground">
          Browse biblical citations from all books in this category
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books?.map((book) => (
              <Card key={book.bookName} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {book.bookName}
                  </CardTitle>
                  <CardDescription>
                    {book.totalEntries} citations across {book.chapters.length} chapters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" data-testid={`badge-entries-${book.bookName.toLowerCase()}`}>
                        {book.totalEntries} entries
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-chapters-${book.bookName.toLowerCase()}`}>
                        {book.chapters.length} chapters
                      </Badge>
                    </div>
                    
                    {book.chapters.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <div className="font-medium mb-1">Sample chapters:</div>
                        <div className="flex flex-wrap gap-1">
                          {book.chapters.slice(0, 5).map((chapter) => (
                            <span key={chapter.chapterNumber} className="text-xs bg-muted px-2 py-1 rounded">
                              Ch. {chapter.chapterNumber}
                            </span>
                          ))}
                          {book.chapters.length > 5 && (
                            <span className="text-xs text-muted-foreground">
                              +{book.chapters.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Link 
                      href={`/biblical-index/book/${book.bookName.toLowerCase().replace(/\s+/g, '_')}`}
                      className="inline-flex items-center text-primary hover:underline text-sm"
                      data-testid={`link-book-${book.bookName.toLowerCase()}`}
                    >
                      View all citations
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {books && books.length === 0 && (
            <div className="text-center py-12">
              <Icon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Books Found</h3>
              <p className="text-muted-foreground">
                No biblical books were found in this category.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}