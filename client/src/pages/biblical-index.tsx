import { Link } from "wouter";
import { getBiblicalIndexMetadata, getBookDisplayName } from "@/lib/biblical-index-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scroll, Crown } from "lucide-react";

const categoryIcons = {
  torah: BookOpen,
  neviim: Scroll,
  ketuvim: Crown
};

const categoryDescriptions = {
  torah: "The Five Books of Moses",
  neviim: "The Prophets",
  ketuvim: "The Writings"
};

export default function BiblicalIndexPage() {
  const metadata = getBiblicalIndexMetadata();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4" data-testid="page-title">
          Biblical Citations in the Talmud
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          A comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="secondary" data-testid="total-books-badge">
            {metadata.totalBooks} Books Available
          </Badge>
          <span>Based on the Steinsaltz English Translation</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(metadata.categories).map(([category, books]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons];
          const displayName = category.charAt(0).toUpperCase() + category.slice(1);
          
          return (
            <Card key={category} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                </div>
                <CardDescription>
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{books.length} books</span>
                    <Link 
                      href={`/biblical-index/${category}`}
                      className="text-primary hover:underline"
                      data-testid={`link-category-${category}`}
                    >
                      View all →
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                    {books.slice(0, 8).map((book) => (
                      <Link
                        key={book}
                        href={`/biblical-index/book/${book.toLowerCase()}`}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors py-1"
                        data-testid={`link-book-${book.toLowerCase()}`}
                      >
                        {getBookDisplayName(book)}
                      </Link>
                    ))}
                    {books.length > 8 && (
                      <div className="text-xs text-muted-foreground pt-1 border-t">
                        + {books.length - 8} more books
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 prose prose-sm dark:prose-invert max-w-none">
        <h2>About This Index</h2>
        <p>
          This digital index provides a comprehensive mapping of biblical citations found throughout 
          the Babylonian Talmud. Each entry includes the biblical verse, its location in the Talmud, 
          and the complete context surrounding the citation.
        </p>
        
        <h3>Features</h3>
        <ul>
          <li>Direct hyperlinks to the original Talmudic passages on ChavrutAI</li>
          <li>Full contextual quotations for each citation</li>
          <li>Organized by biblical book and chapter</li>
          <li>Searchable and browseable interface</li>
        </ul>

        <p className="text-sm text-muted-foreground">
          Data source: Steinsaltz English Translation of the Babylonian Talmud. 
          This resource is open access and freely available for academic and personal study.
        </p>
      </div>
    </div>
  );
}