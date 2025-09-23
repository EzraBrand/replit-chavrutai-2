import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ExternalLink, FileText, BookOpen } from "lucide-react";
import { Footer } from "@/components/footer";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { useSEO } from "@/hooks/use-seo";

interface TractateData {
  name: string;
  folios: number;
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
  useSEO({
    title: "Site Map - ChavrutAI Talmud Navigation Guide",
    description: "Complete navigation guide to all 37 Talmud tractates organized by traditional Seder structure. Find any page across 5,400+ folios in the Babylonian Talmud.",
    canonical: "/sitemap",
    robots: "index, follow"
  });

  const { data: sitemapData, isLoading } = useQuery<SitemapResponse>({
    queryKey: ['/api/sitemap'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <BreadcrumbNavigation items={breadcrumbHelpers.sitemap()} />
          <div className="text-center">Loading sitemap...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!sitemapData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <BreadcrumbNavigation items={breadcrumbHelpers.sitemap()} />
          <div className="text-center text-red-600">Error loading sitemap data</div>
        </div>
        <Footer />
      </div>
    );
  }

  const { sedarim, summary } = sitemapData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumbs */}
        <BreadcrumbNavigation items={breadcrumbHelpers.sitemap()} />
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            ChavrutAI Site Map
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Navigate all {summary.totalPages.toLocaleString()} pages across {summary.totalTractates} tractates 
            of the Babylonian Talmud, organized by traditional Seder structure
          </p>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{summary.totalSedarim}</div>
              <div className="text-sm text-muted-foreground">Sedarim (Orders)</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{summary.totalTractates}</div>
              <div className="text-sm text-muted-foreground">Tractates</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{summary.totalFolios.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Folios</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="text-2xl font-bold text-primary">{summary.totalPages.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Pages</div>
            </div>
          </div>
        </div>

        {/* Navigation Shortcuts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} />
            Main Pages
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 bg-card rounded border transition-colors">
              Home
            </Link>
            <Link href="/contents" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 bg-card rounded border transition-colors">
              All Tractates
            </Link>
            <Link href="/suggested-pages" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 bg-card rounded border transition-colors">
              Famous Pages
            </Link>
            <Link href="/blog-posts" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 bg-card rounded border transition-colors">
              Blog Posts
            </Link>
            <Link href="/outline/sanhedrin/10" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 bg-card rounded border transition-colors">
              Sanhedrin Outline
            </Link>
            <Link href="/biblical-index" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 bg-card rounded border transition-colors">
              Biblical Index
            </Link>
            <Link href="/about" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 bg-card rounded border transition-colors">
              About
            </Link>
          </div>
        </div>

        {/* Sedarim (Orders) */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen size={24} />
            Talmud Tractates by Seder (Traditional Orders)
          </h2>
          
          {sedarim.map((seder) => (
            <div key={seder.seder} className="bg-card rounded-lg border p-6">
              {/* Seder Header */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-foreground">
                  Seder {seder.name}
                </h3>
                <p className="text-muted-foreground mb-2">{seder.description}</p>
                <div className="text-sm text-muted-foreground">
                  {seder.totalTractates} tractates • {seder.totalFolios.toLocaleString()} folios • {seder.totalPages.toLocaleString()} pages
                </div>
              </div>

              {/* Tractates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {seder.tractates.map((tractate) => (
                  <div key={tractate.slug} className="bg-background rounded border p-4">
                    <div className="mb-2">
                      <Link 
                        href={`/contents/${tractate.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        {tractate.name}
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {tractate.folios} folios • {tractate.pages} pages
                    </div>
                    
                    {/* All Folio Page Links */}
                    <div className="flex flex-wrap gap-1 text-xs max-h-32 overflow-y-auto">
                      {Array.from({ length: tractate.folios - 1 }, (_, i) => i + 2).map(folio => (
                        <div key={folio} className="flex gap-1">
                          <Link 
                            href={`/tractate/${tractate.slug}/${folio}a`}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                          >
                            {folio}a
                          </Link>
                          <Link 
                            href={`/tractate/${tractate.slug}/${folio}b`}
                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                          >
                            {folio}b
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* XML Sitemap Links for Developers */}
        <div className="mt-12 bg-muted/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ExternalLink size={18} />
            XML Sitemaps (for Search Engines)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <a href="/sitemap.xml" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 hover:underline">
              Master Index
            </a>
            <a href="/sitemap-main.xml" target="_blank" rel="noopener" className="text-blue-600 dark:text-blue-400 hover:underline">
              Main Pages
            </a>
            {sedarim.map((seder) => (
              <a 
                key={seder.seder}
                href={`/sitemap-seder-${seder.seder}.xml`} 
                target="_blank" 
                rel="noopener" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Seder {seder.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}