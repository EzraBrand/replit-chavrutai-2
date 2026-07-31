import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getBiblicalIndexMetadata } from "@/lib/biblical-index-data";
import { FooterPlaceholder } from "@/components/page-loading";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";

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
        name: "Bekiut",
        url: window.location.origin,
      },
    },
  });

  const { data: metadata, isLoading } = useQuery({
    queryKey: ['biblical-index-metadata'],
    queryFn: getBiblicalIndexMetadata,
  });

  if (isLoading) {
    return (
      <PageShell footer={<FooterPlaceholder />} mainClassName="py-12">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="space-y-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (!metadata) {
    return (
      <PageShell footer={null} mainClassName="py-12">
        <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-4">Error Loading Index</h1>
        <p className="text-muted-foreground">Unable to load the biblical index metadata.</p>
      </PageShell>
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
    <PageShell>
      {/* Page title */}
      <PageHeader
        category="tanakh"
        title="Biblical Citations in the Talmud"
        titleTestId="page-title"
      >
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
      </PageHeader>

      {/* About */}
      <PageSection>
        <SectionHeading className="mb-3">About This Index</SectionHeading>
        <p className="text-secondary-foreground mb-4">
          This digital index provides a comprehensive mapping of biblical citations found throughout 
          the Babylonian Talmud. Each entry includes the biblical verse, its location in the Talmud, 
          and the complete context surrounding the citation.
        </p>
        <h3 className="font-georgia text-lg text-foreground mb-2">Features</h3>
        <ul className="list-disc list-inside space-y-1 text-secondary-foreground">
          <li>Direct hyperlinks to the original Talmudic passages on Bekiut</li>
          <li>Full contextual quotations for each citation</li>
          <li>Organized by biblical book and chapter</li>
          <li>Searchable and browseable interface</li>
        </ul>
      </PageSection>

      <div>
        {Object.entries(metadata.categories).map(([category, books]) => {
          return (
            <PageSection key={category}>
              <SectionHeading className="mb-4">
                {categoryDescriptions[category as keyof typeof categoryDescriptions]}
              </SectionHeading>

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
            </PageSection>
          );
        })}
      </div>
    </PageShell>
  );
}
