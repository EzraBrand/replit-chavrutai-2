import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { bibleAPI } from "@/lib/bible-api";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
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
        <div className="max-w-4xl mx-auto px-4 py-8">
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
    <Link 
      key={book.slug} 
      href={`/bible/${book.slug}`}
      data-testid={`link-open-${book.slug}`}
    >
      <Card className="hover:shadow-sm transition-shadow cursor-pointer border-border hover:border-primary/20 bg-card/50">
        <div className="p-3">
          <div className="text-primary font-medium text-base mb-1">{book.name}</div>
          <div className="text-sm text-primary/70 hebrew-font-noto-sans-hebrew mb-1" dir="rtl">
            {book.hebrew}
          </div>
          <div className="text-xs text-muted-foreground">
            {book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}
          </div>
        </div>
      </Card>
    </Link>
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

      {/* Introduction */}
      <div className="max-w-4xl mx-auto px-4 py-6 border-b border-border">
        <p className="text-sm text-muted-foreground">
          To find out more about this, see:{" "}
          <a 
            href="https://www.ezrabrand.com/p/introducing-the-chavrutai-bible-reader"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            data-testid="link-bible-intro-article"
          >
            Introducing the ChavrutAI Bible Reader
            <ExternalLink size={14} />
          </a>
          {" "}(Nov 09, 2025)
        </p>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="space-y-4">
          {/* Torah Section */}
          <section>
            <div className="text-center border-b border-border pb-2 mb-2">
              <h2 className="text-xl font-semibold text-primary" data-testid="text-section-torah">
                Torah
              </h2>
              <p className="text-base text-primary/70 hebrew-font-noto-sans-hebrew">תורה</p>
              <p className="text-xs text-muted-foreground">The Five Books of Moses</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {torah.map(renderBookCard)}
            </div>
          </section>

          {/* Nevi'im Section */}
          <section>
            <div className="text-center border-b border-border pb-2 mb-2">
              <h2 className="text-xl font-semibold text-primary" data-testid="text-section-neviim">
                Nevi'im
              </h2>
              <p className="text-base text-primary/70 hebrew-font-noto-sans-hebrew">נביאים</p>
              <p className="text-xs text-muted-foreground">The Prophets</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {neviim.map(renderBookCard)}
            </div>
          </section>

          {/* Ketuvim Section */}
          <section>
            <div className="text-center border-b border-border pb-2 mb-2">
              <h2 className="text-xl font-semibold text-primary" data-testid="text-section-ketuvim">
                Ketuvim
              </h2>
              <p className="text-base text-primary/70 hebrew-font-noto-sans-hebrew">כתובים</p>
              <p className="text-xs text-muted-foreground">The Writings</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {ketuvim.map(renderBookCard)}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
