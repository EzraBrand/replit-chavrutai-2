import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FooterPlaceholder } from "@/components/page-loading";
import { PageShell, PageHeader, PageSection } from "@/components/layout";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@workspace/shared-data/seo-data";
import { bibleAPI } from "@/lib/bible-api";
import { getBaseUrl } from "@/lib/utils";
import type { BibleBook } from "@/types/bible";

export default function BibleContents() {
  const baseUrl = getBaseUrl();
  // Set up SEO
  useSEO({
    ...getStaticSEO("/bible", baseUrl)!,
    ogUrl: `${baseUrl}/bible`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Hebrew Bible (Tanach)",
      description: "Complete Hebrew Bible with Koren Jerusalem Bible English translation - Torah, Nevi'im, and Ketuvim",
      url: `${baseUrl}/bible`,
      publisher: {
        "@type": "Organization",
        name: "Bekiut",
        url: baseUrl,
      },
      about: {
        "@type": "Book",
        name: "Hebrew Bible",
        alternateName: "Tanach",
        inLanguage: ["he", "en"],
        genre: "Religious Text",
      },
    },
  });

  const { data: bibleData, isLoading } = useQuery({
    queryKey: ['/api/bible/books'],
    queryFn: () => bibleAPI.getBooks()
  });

  if (isLoading) {
    return (
      <PageShell footer={<FooterPlaceholder />} mainClassName="py-12">
        <div className="text-center text-muted-foreground">Loading Bible books...</div>
      </PageShell>
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
      className="block border border-border rounded bg-background p-3 hover:bg-secondary"
    >
      <div className="text-primary dark:text-[#5b9fc5] font-medium text-base">{book.name}</div>
      <div className="text-sm text-muted-foreground hebrew-font-noto-sans-hebrew" dir="rtl" lang="he">
        {book.hebrew}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}
      </div>
    </Link>
  );

  const renderSection = (
    title: string,
    hebrew: string,
    description: string,
    books: BibleBook[],
    testid: string,
  ) => (
    <PageSection>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-georgia text-xl text-foreground" data-testid={testid}>
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-sm text-muted-foreground hebrew-font-noto-sans-hebrew" dir="rtl" lang="he">
          {hebrew}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {books.map(renderBookCard)}
      </div>
    </PageSection>
  );

  return (
    <PageShell>
      {/* Page title */}
      <PageHeader
        category="tanakh"
        title="Bible (Tanach)"
        titleTestId="text-page-title"
      >
        <p className="text-muted-foreground">
          Hebrew Bible with Koren Jerusalem Bible English Translation
        </p>
        <p className="text-sm text-muted-foreground mt-3">
          To find out more about this, see:{" "}
          <a 
            href="https://www.ezrabrand.com/p/introducing-the-chavrutai-bible-reader"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary dark:text-[#5b9fc5] hover:underline"
            data-testid="link-bible-intro-article"
          >
            Introducing the Bekiut Bible Reader ↗
          </a>
          {" "}(Nov 09, 2025)
        </p>
      </PageHeader>

      {renderSection("Torah", "תורה", "The Five Books of Moses", torah, "text-section-torah")}
      {renderSection("Nevi'im", "נביאים", "The Prophets", neviim, "text-section-neviim")}
      {renderSection("Ketuvim", "כתובים", "The Writings", ketuvim, "text-section-ketuvim")}
    </PageShell>
  );
}
