import { Link } from "wouter";
import { getBiblicalIndexMetadata, getBookDisplayName } from "@/lib/biblical-index-data";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";

const categoryDescriptions = {
  torah: "Torah (The Five Books of Moses)",
  neviim: "Nevi'im (The Prophets)",
  ketuvim: "Ketuvim (The Writings)"
};

export default function BiblicalIndexPage() {
  useSEO({
    title: "Biblical Citations in the Talmud - Complete Index | ChavrutAI",
    description: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud. Search Torah, Prophets, and Writings references with direct links to Talmudic passages.",
    ogTitle: "Biblical Citations in the Talmud - Complete Index",
    ogDescription: "Comprehensive digital index mapping biblical verses to their citations throughout the Babylonian Talmud.",
    canonical: `${window.location.origin}/biblical-index`,
    robots: "index, follow"
  });

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
      </div>

      <div className="space-y-8">
        {Object.entries(metadata.categories).map(([category, books]) => {
          return (
            <div key={category} className="space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-3xl font-bold mb-2">
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {books
                  .filter(book => book !== 'Song_of_Songs')
                  .map((book) => (
                  <Link
                    key={book}
                    href={`/biblical-index/book/${book.toLowerCase()}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline underline-offset-2 transition-colors py-2 px-3 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-transparent"
                    data-testid={`link-book-${book.toLowerCase()}`}
                  >
                    {getBookDisplayName(book)}
                  </Link>
                ))}
              </div>
            </div>
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

      </div>
      
      <Footer />
    </div>
  );
}