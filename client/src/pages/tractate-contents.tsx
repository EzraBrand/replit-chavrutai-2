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

  return folios.map((folioInfo) => (
    <Link
      key={`${folioInfo.folio}${folioInfo.side}`}
      href={`/tractate/${tractate}/${folioInfo.folio}${folioInfo.side}`}
      className="inline-block"
    >
      <Button
        variant="outline"
        size="sm"
        className="m-1 text-xs h-8 min-w-[48px] bg-sepia-50 border-sepia-200 hover:bg-sepia-100 text-sepia-700"
      >
        {folioInfo.label}
      </Button>
    </Link>
  ));
}

export default function TractateContents() {
  const [, params] = useRoute("/tractate/:tractate");
  const tractate = params?.tractate;

  if (!tractate || !isValidTractate(tractate)) {
    return <NotFound />;
  }

  const displayName = normalizeDisplayTractateName(tractate);
  const hebrewName = TRACTATE_HEBREW_NAMES[tractate] || "";

  // Use the chapter data from the proper source
  const chapters = getChapterDataByTractate(tractate);

  const maxFolio = getMaxFolio(tractate);

  // SEO setup for tractate contents page
  const seoData = generateSEOData({
    title: `Tractate ${displayName} - Contents`,
    description: `Browse chapters and pages of Tractate ${displayName} (${hebrewName}) from the Talmud Bavli. Navigate through all ${chapters?.length || 0} chapters with detailed folio listings.`,
    path: `/tractate/${tractate}`,
    tractate: displayName,
    canonicalUrl: `https://chavrutai.com/tractate/${tractate}`,
  });

  useSEO(seoData);

  const location: TalmudLocation = {
    work: "Talmud Bavli",
    tractate: displayName,
    chapter: null,
    folio: null,
    side: null,
  };

  const breadcrumbItems = breadcrumbHelpers.generateBreadcrumbItems(location);

  return (
    <div className="min-h-screen bg-sepia-25 dark:bg-sepia-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between p-4 border-b border-sepia-200 dark:border-sepia-700 bg-white/80 dark:bg-sepia-800/80 backdrop-blur-sm">
          <BreadcrumbNavigation items={breadcrumbItems} />
          <HamburgerMenu />
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <img
              src={hebrewBookIcon}
              alt="Hebrew Book"
              className="w-12 h-12 opacity-80"
            />
            <div>
              <h1 className="text-3xl font-bold text-sepia-800 dark:text-sepia-100">
                Tractate {displayName}
              </h1>
              <p className="text-lg text-sepia-600 dark:text-sepia-300 mt-1">
                {hebrewName} • {chapters?.length || 0} Chapters • Folios 2a-{maxFolio}b
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {chapters?.map((chapter) => (
              <Card
                key={chapter.number}
                className="bg-white dark:bg-sepia-800 border-sepia-200 dark:border-sepia-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-sepia-800 dark:text-sepia-100 mb-2">
                        Chapter {chapter.number}: {chapter.englishName}
                      </h2>
                      <p className="text-lg text-sepia-600 dark:text-sepia-300 mb-3">
                        {chapter.hebrewName}
                      </p>
                      <p className="text-sm text-sepia-500 dark:text-sepia-400">
                        Folios {chapter.startFolio}{chapter.startSide} - {chapter.endFolio}{chapter.endSide}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {generateFolioButtons(
                      chapter.startFolio,
                      chapter.startSide,
                      chapter.endFolio,
                      chapter.endSide,
                      tractate
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
