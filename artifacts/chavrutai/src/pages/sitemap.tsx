import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { getBaseUrl } from "@/lib/utils";
import { HeaderSimple } from "@/components/layout/header-simple";

interface TractateData {
  name: string;
  folios: number;
  lastSide: 'a' | 'b';
  startFolio: number;
  startSide: 'a' | 'b';
  slug: string;
  pages: number;
}

interface SederData {
  seder: string;
  name: string;
  description: string;
  tractates: TractateData[];
  totalTractates: number;
  totalFolios: number;
  totalPages: number;
}

interface SitemapResponse {
  sedarim: SederData[];
  summary: {
    totalSedarim: number;
    totalTractates: number;
    totalFolios: number;
    totalPages: number;
  };
}

export default function Sitemap() {
  const baseUrl = getBaseUrl();
  useSEO({
    ...getStaticSEO("/sitemap", baseUrl)!,
    ogUrl: `${baseUrl}/sitemap`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "ChavrutAI Site Map",
      description: "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure",
      url: `${baseUrl}/sitemap`,
      publisher: {
        "@type": "Organization",
        name: "ChavrutAI",
        url: baseUrl,
      },
    },
  });

  const { data: sitemapData, isLoading } = useQuery<SitemapResponse>({
    queryKey: ['/api/sitemap'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <HeaderSimple />
        <div className="max-w-content mx-auto px-6 py-12">
          <div className="text-center text-muted-foreground">Loading sitemap...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!sitemapData) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans">
        <HeaderSimple />
        <div className="max-w-content mx-auto px-6 py-12">
          <div className="text-center text-muted-foreground">Error loading sitemap data</div>
        </div>
        <Footer />
      </div>
    );
  }

  const { sedarim, summary } = sitemapData;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Centered Logo Header */}
      <HeaderSimple />

      <main className="max-w-content mx-auto px-6">
        {/* Page title */}
        <div className="pt-10 pb-8">
          <div
            className="mb-3 h-[2px] w-10" style={{ backgroundColor: "var(--category-talmud-bavli)" }}
            aria-hidden="true"
          />
          <h1 className="font-georgia text-3xl md:text-4xl text-foreground mb-2">
            ChavrutAI Site Map
          </h1>
          <p className="text-muted-foreground mb-6">
            Navigate all {summary.totalPages.toLocaleString()} pages across {summary.totalTractates} tractates 
            of the Babylonian Talmud, organized by traditional Seder structure
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="border border-border rounded bg-background p-4">
              <div className="text-2xl font-georgia text-foreground">{summary.totalSedarim}</div>
              <div className="text-sm text-muted-foreground">Sedarim (Orders)</div>
            </div>
            <div className="border border-border rounded bg-background p-4">
              <div className="text-2xl font-georgia text-foreground">{summary.totalTractates}</div>
              <div className="text-sm text-muted-foreground">Tractates</div>
            </div>
            <div className="border border-border rounded bg-background p-4">
              <div className="text-2xl font-georgia text-foreground">{summary.totalFolios.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Folios</div>
            </div>
            <div className="border border-border rounded bg-background p-4">
              <div className="text-2xl font-georgia text-foreground">{summary.totalPages.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Pages</div>
            </div>
          </div>
        </div>

        {/* Navigation Shortcuts */}
        <section className="py-8 border-t border-border">
          <h2 className="font-georgia text-xl text-foreground mb-4">
            Main Pages
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Link href="/" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Home
            </Link>
            <Link href="/talmud" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              All Tractates
            </Link>
            <Link href="/suggested-pages" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Famous Pages
            </Link>
            <Link href="/blog-posts" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Blog Posts
            </Link>
            <Link href="/outline/sanhedrin/10" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Sanhedrin Outline
            </Link>
            <Link href="/biblical-index" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Biblical Index
            </Link>
            <Link href="/bible" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Bible Reader
            </Link>
            <Link href="/yerushalmi" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Jerusalem Talmud
            </Link>
            <Link href="/rambam" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Mishneh Torah (Rambam)
            </Link>
            <Link href="/jastrow" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Jastrow Dictionary
            </Link>
            <Link href="/bdb" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              BDB Hebrew Bible Dictionary
            </Link>
            <Link href="/term-index" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              Talmud Term Index
            </Link>
            <Link href="/about" className="block border border-border rounded bg-background p-2 text-primary dark:text-[#5b9fc5] hover:bg-secondary">
              About
            </Link>
          </div>
        </section>

        {/* Sedarim (Orders) */}
        <section className="py-8 border-t border-border">
          <h2 className="font-georgia text-2xl text-foreground mb-6">
            Talmud Tractates by Seder (Traditional Orders)
          </h2>

          <div className="space-y-8">
            {sedarim.map((seder) => (
              <div key={seder.seder}>
                {/* Seder Header */}
                <div className="mb-4">
                  <h3 className="font-georgia text-xl text-foreground">
                    Seder {seder.name}
                  </h3>
                  <p className="text-muted-foreground mb-2">{seder.description}</p>
                  <div className="text-sm text-muted-foreground">
                    {seder.totalTractates} tractates • {seder.totalFolios.toLocaleString()} folios • {seder.totalPages.toLocaleString()} pages
                  </div>
                </div>

                {/* Tractates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {seder.tractates.map((tractate) => (
                    <div key={tractate.slug} className="border border-border rounded bg-background p-4">
                      <div className="mb-2">
                        <Link 
                          href={`/talmud/${tractate.slug}`}
                          className="text-primary dark:text-[#5b9fc5] font-medium"
                        >
                          {tractate.name}
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        {tractate.folios} folios • {tractate.pages} pages
                      </div>
                      
                      {/* All Folio Page Links */}
                      <div className="flex flex-wrap gap-1 text-xs max-h-32 overflow-y-auto">
                        {Array.from({ length: tractate.folios - tractate.startFolio + 1 }, (_, i) => i + tractate.startFolio).map(folio => {
                          const isFirstFolio = folio === tractate.startFolio;
                          const isLastFolio = folio === tractate.folios;
                          const showASide = !isFirstFolio || tractate.startSide === 'a';
                          const showBSide = !isLastFolio || tractate.lastSide === 'b';
                          return (
                            <div key={folio} className="flex gap-1">
                              {showASide && (
                                <Link 
                                  href={`/talmud/${tractate.slug}/${folio}a`}
                                  className="text-primary dark:text-[#5b9fc5] border border-border rounded px-2 py-1 hover:bg-secondary"
                                >
                                  {folio}a
                                </Link>
                              )}
                              {showBSide && (
                                <Link 
                                  href={`/talmud/${tractate.slug}/${folio}b`}
                                  className="text-primary dark:text-[#5b9fc5] border border-border rounded px-2 py-1 hover:bg-secondary"
                                >
                                  {folio}b
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* XML Sitemap Links for Developers */}
        <section className="py-8 border-t border-border">
          <h3 className="font-georgia text-lg text-foreground mb-4">
            XML Sitemaps (for Search Engines)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <a href="/sitemap.xml" target="_blank" rel="noopener" className="text-primary dark:text-[#5b9fc5] hover:underline">
              Master Index
            </a>
            <a href="/sitemap-main.xml" target="_blank" rel="noopener" className="text-primary dark:text-[#5b9fc5] hover:underline">
              Main Pages
            </a>
            <a href="/sitemap-bible.xml" target="_blank" rel="noopener" className="text-primary dark:text-[#5b9fc5] hover:underline">
              Bible Pages
            </a>
            <a href="/sitemap-yerushalmi.xml" target="_blank" rel="noopener" className="text-primary dark:text-[#5b9fc5] hover:underline">
              Jerusalem Talmud
            </a>
            {sedarim.map((seder) => (
              <a 
                key={seder.seder}
                href={`/sitemap-seder-${seder.seder}.xml`} 
                target="_blank" 
                rel="noopener" 
                className="text-primary dark:text-[#5b9fc5] hover:underline"
              >
                Seder {seder.name}
              </a>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}