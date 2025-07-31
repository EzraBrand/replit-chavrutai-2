import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BreadcrumbNav } from "@/components/navigation/breadcrumb-nav";
import { SectionedBilingualDisplay } from "@/components/text/sectioned-bilingual-display";
import { PageNavigation } from "@/components/navigation/page-navigation";
import { Footer } from "@/components/footer";
import { sefariaAPI } from "@/lib/sefaria";
import type { TalmudLocation } from "@/types/talmud";

export default function Home() {
  const [location, setLocation] = useState<TalmudLocation>({
    work: "Talmud Bavli",
    tractate: "Berakhot",
    chapter: 1,
    folio: 2,
    side: 'a'
  });

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
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-10 h-10 bg-talmud-brown rounded-full flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-primary">ChavrutAI</h1>
            </div>
            
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
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-primary mb-2">
            {location.tractate} {location.folio}{location.side}
          </h2>
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
