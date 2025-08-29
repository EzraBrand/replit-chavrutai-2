import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import {
  BreadcrumbNavigation,
  breadcrumbHelpers,
} from "@/components/navigation/breadcrumb-navigation";
import { getChapterDataByTractate } from "@/lib/chapter-data";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { sefariaAPI } from "@/lib/sefaria";
import { getMaxFolio } from "@/lib/tractate-ranges";
import {
  TRACTATE_HEBREW_NAMES,
  normalizeDisplayTractateName,
  isValidTractate,
} from "@shared/tractates";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";
import NotFound from "@/pages/not-found";

function generateFolioButtons(
  startFolio: number,
  startSide: "a" | "b",
  endFolio: number,
  endSide: "a" | "b",
  tractate: string,
) {
  const folios: Array<{ folio: number; side: "a" | "b"; label: string }> = [];

  for (let folio = startFolio; folio <= endFolio; folio++) {
    if (folio === startFolio && folio === endFolio) {
      // Same folio range
      if (startSide === "a") {
        folios.push({ folio, side: "a", label: `${folio}a` });
        if (endSide === "b") {
          folios.push({ folio, side: "b", label: `${folio}b` });
        }
      } else {
        folios.push({ folio, side: "b", label: `${folio}b` });
      }
    } else if (folio === startFolio) {
      // First folio
      if (startSide === "a") {
        folios.push({ folio, side: "a", label: `${folio}a` });
        folios.push({ folio, side: "b", label: `${folio}b` });
      } else {
        folios.push({ folio, side: "b", label: `${folio}b` });
      }
    } else if (folio === endFolio) {
      // Last folio
      folios.push({ folio, side: "a", label: `${folio}a` });
      if (endSide === "b") {
        folios.push({ folio, side: "b", label: `${folio}b` });
      }
    } else {
      // Middle folios
      folios.push({ folio, side: "a", label: `${folio}a` });
      folios.push({ folio, side: "b", label: `${folio}b` });
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
    queryKey: ["/api/chapters", tractate],
    queryFn: () => sefariaAPI.getChapters(tractateDisplayName),
    enabled: !!tractate,
  });

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

  if (isLoading) {
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
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
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
            {tractateChapters.length > 0
              ? `${tractateChapters.length} Chapters`
              : `Folios 2a-${maxFolio}b`}
          </p>
        </div>

        {/* Chapters */}
        {tractateChapters.length > 0 ? (
          <div className="space-y-8">
            {tractateChapters.map((chapter) => {
              const folios = generateFolioButtons(
                chapter.startFolio,
                chapter.startSide,
                chapter.endFolio,
                chapter.endSide,
                tractateDisplayName,
              );

              return (
                <div key={chapter.number} className="space-y-4">
                  {/* Chapter Header */}
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xl font-semibold text-primary">
                      Chapter {chapter.number}: <em>{chapter.englishName}</em> (
                      {chapter.hebrewName})
                    </h3>
                  </div>

                  {/* Folio Grid */}
                  <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
                    {folios.map((folio) => (
                      <Link
                        key={`${folio.folio}${folio.side}`}
                        href={`/tractate/${tractateDisplayName.toLowerCase().replace(/\s+/g, "-")}/${folio.folio}${folio.side}`}
                      >
                        <Card className="hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                          <CardContent className="p-3 text-center">
                            <span className="text-sm font-medium text-primary">
                              {folio.label}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Fallback: Show all folios if no chapter data available
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-xl font-semibold text-primary">All Folios</h3>
            </div>

            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
              {Array.from({ length: maxFolio - 1 }, (_, i) => i + 2)
                .map((folio) =>
                  ["a", "b"].map((side) => (
                    <Link
                      key={`${folio}${side}`}
                      href={`/tractate/${tractateDisplayName.toLowerCase().replace(/\s+/g, "-")}/${folio}${side}`}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                        <CardContent className="p-3 text-center">
                          <span className="text-sm font-medium text-primary">
                            {folio}
                            {side}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  )),
                )
                .flat()}
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}