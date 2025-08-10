import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { getMaxFolio } from "@/lib/tractate-ranges";
import { SectionedBilingualDisplay } from "@/components/text/sectioned-bilingual-display";
import { PageNavigation } from "@/components/navigation/page-navigation";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { CenteredBreadcrumbNav } from "@/components/navigation/centered-breadcrumb-nav";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { SectionNavigation } from "@/components/navigation/section-navigation";
import { Footer } from "@/components/footer";
import { usePreferences } from "@/context/preferences-context";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import type { TalmudLocation } from "@/types/talmud";
import { sefariaAPI } from "@/lib/sefaria";
import { normalizeDisplayTractateName } from "@shared/tractates";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";

export default function TractateView() {
  const { tractate, folio } = useParams<{ tractate: string; folio: string }>();
  const [location, setLocation] = useLocation();
  const { preferences } = usePreferences();
  
  // Parse folio parameter (e.g., "2a" -> folio: 2, side: "a")
  const parsedFolio = folio ? parseInt(folio.slice(0, -1)) : 2;
  const parsedSide = folio ? folio.slice(-1) as 'a' | 'b' : 'a';
  
  const [talmudLocation, setTalmudLocation] = useState<TalmudLocation>({
    work: "Talmud Bavli",
    tractate: tractate ? normalizeDisplayTractateName(tractate) : "Berakhot",
    chapter: 1,
    folio: parsedFolio,
    side: parsedSide
  });

  const [currentSection, setCurrentSection] = useState<number>(1);

  // Update location when URL params change
  useEffect(() => {
    if (tractate && folio) {
      const normalizedTractate = normalizeDisplayTractateName(tractate);
      const folioNum = parseInt(folio.slice(0, -1));
      const side = folio.slice(-1) as 'a' | 'b';
      
      if (!isNaN(folioNum) && (side === 'a' || side === 'b')) {
        setTalmudLocation({
          work: "Talmud Bavli",
          tractate: normalizedTractate,
          chapter: 1,
          folio: folioNum,
          side
        });
      }
    }
  }, [tractate, folio]);

  // Set up SEO
  useSEO(generateSEOData.homePage(talmudLocation.tractate, talmudLocation.folio, talmudLocation.side));

  // Fetch current text
  const { 
    data: text, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/text', talmudLocation.work, talmudLocation.tractate, talmudLocation.chapter, talmudLocation.folio, talmudLocation.side],
    queryFn: () => sefariaAPI.getText(talmudLocation),
  });

  const handleLocationChange = (newLocation: TalmudLocation) => {
    setTalmudLocation(newLocation);
    // Clear hash when changing pages
    window.history.pushState(null, '', window.location.pathname);
    setCurrentSection(1);
    // Update URL to match new location
    const tractateSlug = encodeURIComponent(newLocation.tractate.toLowerCase());
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    setLocation(`/tractate/${tractateSlug}/${folioSlug}`);
  };

  const handleSectionChange = (section: number) => {
    setCurrentSection(section);
  };

  const handleSectionVisible = (section: number) => {
    setCurrentSection(section);
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  if (!tractate || !folio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid URL format. Please check the tractate and folio parameters.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Hamburger Menu */}
            <div className="flex items-center flex-shrink-0">
              <HamburgerMenu onLocationChange={handleLocationChange} />
            </div>
            
            {/* Center Section: Centered Breadcrumb Navigation */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <CenteredBreadcrumbNav location={talmudLocation} onLocationChange={handleLocationChange} />
            </div>
            

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} layout-${preferences.layout}`}>

        


        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load text. Please try again.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4 mb-6">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        )}

        {/* Text Content */}
        {text && !isLoading && (
          <div className="space-y-6">
            <SectionedBilingualDisplay 
              text={text} 
              onSectionVisible={handleSectionVisible}
            />
          </div>
        )}

        {/* Page Navigation */}
        <div className="mt-8 pt-6 border-t border-border">
          <PageNavigation 
            location={talmudLocation} 
            onLocationChange={handleLocationChange}
          />
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Section Navigation */}
      {text && (
        <SectionNavigation 
          totalSections={Math.max(
            (text.hebrewSections || [text.hebrewText]).length,
            (text.englishSections || [text.englishText]).length
          )}
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
        />
      )}
    </div>
  );
}