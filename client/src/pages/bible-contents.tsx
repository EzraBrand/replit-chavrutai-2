import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { bibleAPI } from "@/lib/bible-api";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";
import type { BibleBook } from "@/types/bible";

export default function BibleContents() {
  // Set up SEO
  useSEO({
    title: "Bible (Tanach) - Hebrew & English | ChavrutAI",
    description: "Read the complete Hebrew Bible (Tanach) with JPS 1985 English translation. Access all 24 books of the Torah, Nevi'im, and Ketuvim with parallel Hebrew-English text.",
    ogTitle: "Bible (Tanach) - Hebrew & English",
    ogDescription: "Read the complete Hebrew Bible with JPS 1985 translation.",
    canonical: "/bible",
    robots: "index, follow"
  });

  const { data: bibleData, isLoading } = useQuery({
    queryKey: ['/api/bible/books'],
    queryFn: () => bibleAPI.getBooks()
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-primary">Bible (Tanach)</h1>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading Bible books...</div>
        </div>
      </div>
    );
  }

  const sections = bibleData?.sections || {};
  const torah = sections.Torah || [];
  const neviim = sections["Nevi'im"] || [];
  const ketuvim = sections.Ketuvim || [];

  const renderBookCard = (book: BibleBook) => (
    <Card key={book.slug} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            <span className="text-lg">{book.name}</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-xl text-right hebrew-font-noto-sans-hebrew" dir="rtl">
            {book.hebrew}
          </p>
          <Link href={`/bible/${book.slug}`}>
            <Button
              variant="outline"
              className="w-full"
              data-testid={`button-open-${book.slug}`}
            >
              Open {book.name}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2" data-testid="text-page-title">
                Bible (Tanach)
              </h1>
              <p className="text-muted-foreground">
                Hebrew Bible with JPS 1985 English Translation
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" data-testid="button-home">
                ← Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* Torah Section */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1" data-testid="text-section-torah">
                Torah <span className="text-muted-foreground text-lg">(תורה)</span>
              </h2>
              <p className="text-sm text-muted-foreground">The Five Books of Moses</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {torah.map(renderBookCard)}
            </div>
          </section>

          {/* Nevi'im Section */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1" data-testid="text-section-neviim">
                Nevi'im <span className="text-muted-foreground text-lg">(נביאים)</span>
              </h2>
              <p className="text-sm text-muted-foreground">The Prophets</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {neviim.map(renderBookCard)}
            </div>
          </section>

          {/* Ketuvim Section */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1" data-testid="text-section-ketuvim">
                Ketuvim <span className="text-muted-foreground text-lg">(כתובים)</span>
              </h2>
              <p className="text-sm text-muted-foreground">The Writings</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ketuvim.map(renderBookCard)}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
