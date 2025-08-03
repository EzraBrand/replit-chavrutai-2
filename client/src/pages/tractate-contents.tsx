import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { sefariaAPI } from "@/lib/sefaria";
import { getMaxFolio } from "@/lib/tractate-ranges";
import { CHAPTER_DATA } from "@/lib/chapter-data";
import { TRACTATE_HEBREW_NAMES, normalizeDisplayTractateName } from "@shared/tractates";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";

// Using shared chapter data from @/lib/chapter-data

function generateFolioButtons(startFolio: number, startSide: 'a' | 'b', endFolio: number, endSide: 'a' | 'b', tractate: string) {
  const folios: Array<{ folio: number; side: 'a' | 'b'; label: string }> = [];
  
  for (let folio = startFolio; folio <= endFolio; folio++) {
    if (folio === startFolio && folio === endFolio) {
      // Same folio range
      if (startSide === 'a') {
        folios.push({ folio, side: 'a', label: `${folio}a` });
        if (endSide === 'b') {
          folios.push({ folio, side: 'b', label: `${folio}b` });
        }
      } else {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else if (folio === startFolio) {
      // First folio
      if (startSide === 'a') {
        folios.push({ folio, side: 'a', label: `${folio}a` });
        folios.push({ folio, side: 'b', label: `${folio}b` });
      } else {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else if (folio === endFolio) {
      // Last folio
      folios.push({ folio, side: 'a', label: `${folio}a` });
      if (endSide === 'b') {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else {
      // Middle folios
      folios.push({ folio, side: 'a', label: `${folio}a` });
      folios.push({ folio, side: 'b', label: `${folio}b` });
    }
  }
  
  return folios;
}

export default function TractateContents() {
  const [match, params] = useRoute("/contents/:tractate");
  const tractate = params?.tractate || "";
  const tractateDisplayName = normalizeDisplayTractateName(tractate);
  
  // Set up SEO
  useSEO(generateSEOData.tractatePage(tractateDisplayName));
  
  const { data: chapters, isLoading } = useQuery({
    queryKey: ['/api/chapters', tractate],
    queryFn: () => sefariaAPI.getChapters(tractateDisplayName)
  });

  if (!match) {
    return null;
  }

  const tractateKey = tractate.toLowerCase().replace(/\s+/g, '');
  const chapterData = CHAPTER_DATA[tractateKey] || [];
  const maxFolio = getMaxFolio(tractateDisplayName);

  return (
    <div className="min-h-screen bg-sepia-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-sepia-200 dark:border-gray-800 bg-sepia-50/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-sepia-50/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <img
                src={hebrewBookIcon}
                alt="ChavrutAI"
                className="h-8 w-8 rounded"
              />
              <span className="text-xl font-semibold text-primary">ChavrutAI</span>
            </div>

            {/* Right Side - Hamburger Menu */}
            <HamburgerMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <BreadcrumbNavigation items={breadcrumbHelpers.tractateContents(tractateDisplayName)} />
        
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Contents
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {tractateDisplayName}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Talmud Bavli</span>
            <span>•</span>
            <span>{TRACTATE_HEBREW_NAMES[tractateDisplayName] || ""}</span>
            <span>•</span>
            <span>{maxFolio} pages</span>
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="space-y-6">
          {chapterData.map((chapter) => {
            const folioButtons = generateFolioButtons(
              chapter.startFolio,
              chapter.startSide,
              chapter.endFolio,
              chapter.endSide,
              tractate
            );

            return (
              <Card key={chapter.number} className="border-sepia-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-primary mb-1">
                      Chapter {chapter.number}: {chapter.englishName}
                    </h2>
                    <p className="text-lg text-muted-foreground font-hebrew">
                      {chapter.hebrewName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pages {chapter.startFolio}{chapter.startSide} - {chapter.endFolio}{chapter.endSide}
                    </p>
                  </div>

                  {/* Folio Buttons */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                    {folioButtons.map((folio) => (
                      <Button
                        key={`${folio.folio}${folio.side}`}
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-10 border-sepia-300 dark:border-gray-700 hover:bg-sepia-100 dark:hover:bg-gray-800"
                      >
                        <Link href={`/tractate/${tractate}/${folio.folio}${folio.side}`}>
                          {folio.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        )}

        {/* No Chapters State */}
        {!isLoading && chapterData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Chapter information not available for this tractate.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}