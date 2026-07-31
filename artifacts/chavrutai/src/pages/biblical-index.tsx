import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getBiblicalIndexMetadata } from "@/lib/biblical-index-data";
import { Footer } from "@/components/footer";
import { FooterPlaceholder } from "@/components/page-loading";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSimple } from "@/components/layout/header-simple";

const categoryDescriptions = {
  torah: "Torah (The Five Books of Moses)",
  neviim: "Nevi'im (The Prophets)",
  ketuvim: "Ketuvim (The Writings)"
};

export default function BiblicalIndexPage() {
  useSEO({
    ...getStaticSEO("/biblical-index", window.location.origin)!,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Biblical Citations in the Talmud",
      description: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud",
      url: `${window.location.origin}/biblical-index`,
      license: "https://opensource.org/licenses/MIT",
      creator: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: window.location.origin,
      },
    },
  });

  const { data: metadata, isLoading } = useQuery({
    queryKey: ['biblical-index-metadata'],
    queryFn: getBiblicalIndexMetadata,
  });

  const renderHeader = () => (
    <HeaderSimple />
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        {renderHeader()}
        <main className="max-w-content mx-auto px-6 py-12">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <FooterPlaceholder />
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        {renderHeader()}
        <main className="max-w-content mx-auto px-6 py-12">
          <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-4">Error Loading Index</h1>
          <p className="text-muted-foreground">Unable to load the biblical index metadata.</p>
        </main>
      </div>
    );
  }

  const getDisplayName = (bookName: string): string => {
    const cleanName = bookName.toLowerCase().replace(/ /g, '_');
    const bookInfo = metadata.books.find(
      b => b.filename === `${cleanName}.json` || b.displayName.toLowerCase() === bookName.toLowerCase()
    );
    return bookInfo?.displayName || bookName.replace(/_/g, ' ');
  };

  const getBookUrl = (bookName: string): string => {
    return bookName.toLowerCase().replace(/ /g, '_');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {renderHeader()}
      <main className="max-w-content mx-auto px-6">
        {/* Page title */}
        <div className="pt-10 pb-8">
          <div
            className="mb-3 h-[2px] w-10" style={{ backgroundColor: "var(--category-tanakh)" }}
            aria-hidden="true"
          />
          <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-2" data-testid="page-title">
            Biblical Citations in the Talmud
          </h1>
          <p className="text-muted-foreground mb-2">
            A comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud
          </p>
          <p className="text-sm text-muted-foreground">
            For more about this, see{" "}
            <a 
              href="https://www.ezrabrand.com/p/biblical-citations-in-the-talmud" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid="link-article"
            >
              Biblical Citations in the Talmud: A New Digital Index and Concordance
            </a>{" "}
            (Sep 21, 2025)
          </p>
        </div>

        {/* About */}
        <section className="py-8 border-t border-border">
          <h2 className="font-georgia text-xl text-foreground mb-3">About This Index</h2>
          <p className="text-secondary-foreground mb-4">
            This digital index provides a comprehensive mapping of biblical citations found throughout 
            the Babylonian Talmud. Each entry includes the biblical verse, its location in the Talmud, 
            and the complete context surrounding the citation.
          </p>
          <h3 className="font-georgia text-lg text-foreground mb-2">Features</h3>
          <ul className="list-disc list-inside space-y-1 text-secondary-foreground">
            <li>Direct hyperlinks to the original Talmudic passages on ChavrutAI</li>
            <li>Full contextual quotations for each citation</li>
            <li>Organized by biblical book and chapter</li>
            <li>Searchable and browseable interface</li>
          </ul>
        </section>

        <div>
          {Object.entries(metadata.categories).map(([category, books]) => {
            return (
              <section key={category} className="py-8 border-t border-border">
                <h2 className="font-georgia text-xl text-foreground mb-4">
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1">
                  {(books as string[])
                    .filter(book => book !== 'Song of Songs')
                    .map((book: string) => (
                    <Link
                      key={book}
                      href={`/biblical-index/book/${getBookUrl(book)}`}
                      className="text-primary hover:underline py-1"
                      data-testid={`link-book-${getBookUrl(book)}`}
                    >
                      {getDisplayName(book)}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
