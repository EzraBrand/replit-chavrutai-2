import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BreadcrumbNav } from "@/components/navigation/breadcrumb-nav";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { SectionedBilingualDisplay } from "@/components/text/sectioned-bilingual-display";
import { PageNavigation } from "@/components/navigation/page-navigation";
import { Footer } from "@/components/footer";
import { usePreferences } from "@/context/preferences-context";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { sefariaAPI } from "@/lib/sefaria";
import { normalizeDisplayTractateName, getTractateSlug } from "@shared/tractates";
import type { TalmudLocation } from "@/types/talmud";

export default function Home() {
  const { preferences } = usePreferences();
  const [currentLocation, setCurrentLocation] = useLocation();
  const [location, setLocation] = useState<TalmudLocation>({
    work: "Talmud Bavli",
    tractate: "Berakhot",
    chapter: 1,
    folio: 2,
    side: 'a'
  });

  // Set up SEO - this is actually the main page, use homepage SEO
  useSEO(generateSEOData.homePage());

  // Read URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tractateParam = urlParams.get('tractate');
    const folioParam = urlParams.get('folio');
    const sideParam = urlParams.get('side');

    if (tractateParam && folioParam && sideParam) {
      const folio = parseInt(folioParam, 10);
      const side = sideParam as 'a' | 'b';
      
      if (!isNaN(folio) && (side === 'a' || side === 'b')) {
        setLocation({
          work: "Talmud Bavli",
          tractate: normalizeDisplayTractateName(tractateParam),
          chapter: 1,
          folio,
          side
        });
      }
    }
  }, []);

  // Fetch current text
  const { 
    data: text, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/text', location.work, location.tractate, location.chapter, location.folio, location.side],
    queryFn: () => sefariaAPI.getText(location),
  });

  const handleLocationChange = (newLocation: TalmudLocation) => {
    setLocation(newLocation);
    
    // Redirect to clean URL for SEO
    const tractateSlug = getTractateSlug(newLocation.tractate);
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    setCurrentLocation(`/tractate/${tractateSlug}/${folioSlug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu */}
            <HamburgerMenu onLocationChange={handleLocationChange} />
            
            {/* Logo */}
            <Link 
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
              data-testid="header-logo-link"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/hebrew-book-icon.png" 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
            
            {/* Navigation - Always Visible */}
            <div className="flex-1 flex justify-center">
              <BreadcrumbNav location={location} onLocationChange={handleLocationChange} />
            </div>
            
            {/* Empty space for balance */}
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} english-font-${preferences.englishFont}`}>
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-primary mb-2">
            {location.tractate} {location.folio}{location.side}
          </h1>
          <p className="text-muted-foreground">
            Tractate {location.tractate}, Folio {location.folio}, Page {location.side}
          </p>
        </div>

        {/* Text Content */}
        {isLoading && (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert className="bg-destructive/10 border-destructive/20">
            <AlertDescription className="text-destructive">
              Failed to load text. This may be because the text is not available or there was a connection error.
              <Button 
                variant="link" 
                className="ml-2 p-0 h-auto text-destructive"
                onClick={() => refetch()}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {text && (
          <>
            <SectionedBilingualDisplay text={text} />
            <PageNavigation location={location} onLocationChange={handleLocationChange} />
          </>
        )}

        {!isLoading && !error && !text && (
          <Alert className="bg-accent border-accent">
            <AlertDescription className="text-accent-foreground">
              No text found for this location. This may be because the text hasn't been digitized yet or the reference is invalid.
            </AlertDescription>
          </Alert>
        )}
      </main>

      <Footer />
    </div>
  );
}
