import { useRoute, Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import {
  BreadcrumbNavigation,
  breadcrumbHelpers,
} from "@/components/navigation/breadcrumb-navigation";
import { getChapterDataByTractate } from "@/lib/chapter-data";
import { generateFolioButtons } from "@/lib/folio-utils";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { getMaxFolio } from "@/lib/tractate-ranges";
import {
  TRACTATE_HEBREW_NAMES,
  normalizeDisplayTractateName,
  isValidTractate,
} from "@shared/tractates";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";
import NotFound from "@/pages/not-found";

export default function TractateContents() {
  const [match, params] = useRoute("/contents/:tractate");
  const tractate = params?.tractate || "";
  const tractateDisplayName = normalizeDisplayTractateName(tractate);

  // Set up SEO
  useSEO(generateSEOData.tractatePage(tractateDisplayName));

  // Navigation handler for hamburger menu
  const handleLocationChange = (newLocation: TalmudLocation) => {
    // Navigate to clean URL
    const tractateSlug = encodeURIComponent(newLocation.tractate.toLowerCase());
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/tractate/${tractateSlug}/${folioSlug}`;
  };

  if (!match) {
    return <div>Tractate not found</div>;
  }

  // Validate tractate name and show 404 if invalid
  if (tractate && !isValidTractate(tractate)) {
    return <NotFound />;
  }

  const tractateChapters = getChapterDataByTractate(tractate.toLowerCase().replace(/\s+/g, ' '));
  const maxFolio = getMaxFolio(tractateDisplayName);
  // Convert tractate name to proper case for Hebrew name lookup
  const properCaseTractate = tractateDisplayName;
  const hebrewName =
    TRACTATE_HEBREW_NAMES[
      properCaseTractate as keyof typeof TRACTATE_HEBREW_NAMES
    ] || tractate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu */}
            <HamburgerMenu onLocationChange={handleLocationChange} />

            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={hebrewBookIcon}
                  alt="ChavrutAI Logo"
                  className="w-10 h-10 object-cover"
                />
              </div>
              <h1 className="text-xl font-semibold text-primary font-roboto">
                ChavrutAI
              </h1>
            </div>

            {/* Empty space for balance */}
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <BreadcrumbNavigation
          items={breadcrumbHelpers.tractateContents(tractateDisplayName)}
        />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/contents">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Contents
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            {tractateDisplayName}
          </h1>
          <h2 className="text-2xl text-primary/80 mb-4 font-hebrew">
            {hebrewName}
          </h2>
          <p className="text-lg text-muted-foreground">
            {tractateChapters?.length || 0} Chapters • {maxFolio} Folios
          </p>
        </div>

        {/* Chapter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tractateChapters?.map((chapter) => {
            const folios = generateFolioButtons(
              chapter.startFolio,
              chapter.startSide,
              chapter.endFolio,
              chapter.endSide
            );

            return (
              <Card
                key={chapter.number}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-primary mb-2">
                      Chapter {chapter.number}: {chapter.englishName}{' '}
                      <span className="font-hebrew">({chapter.hebrewName})</span>
                    </h3>
                  </div>

                  {/* Folio buttons */}
                  <div className="flex flex-wrap gap-1">
                    {folios.map((folio) => (
                      <Link
                        key={`${folio.folio}${folio.side}`}
                        href={`/tractate/${encodeURIComponent(
                          tractate.toLowerCase(),
                        )}/${folio.folio}${folio.side}`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs hover:bg-primary hover:text-primary-foreground"
                        >
                          {folio.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}