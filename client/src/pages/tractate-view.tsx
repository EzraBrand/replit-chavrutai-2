import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { SectionedBilingualDisplay } from "@/components/text/sectioned-bilingual-display";
import { PageNavigation } from "@/components/navigation/page-navigation";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNav } from "@/components/navigation/breadcrumb-nav";
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
    // Update URL to match new location
    const tractateSlug = newLocation.tractate.toLowerCase().replace(/\s+/g, '-');
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    setLocation(`/tractate/${tractateSlug}/${folioSlug}`);
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
              <h1 className="text-xl font-semibold text-primary font-roboto">ChavrutAI</h1>
            </div>
            
            {/* Navigation - Always Visible */}
            <div className="flex-1 flex justify-center">
              <BreadcrumbNav location={talmudLocation} onLocationChange={handleLocationChange} />
            </div>
            
            {/* Home Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoHome}
              className="flex-shrink-0"
              title="Go to Home"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont}`}>
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-primary mb-2">
            {talmudLocation.tractate} {talmudLocation.folio}{talmudLocation.side}
          </h2>
          <p className="text-muted-foreground">
            {talmudLocation.work}
          </p>
        </div>

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
            <SectionedBilingualDisplay text={text} />
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
    </div>
  );
}