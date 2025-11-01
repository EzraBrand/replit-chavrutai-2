import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { BibleTextDisplay } from "@/components/bible/bible-text-display";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { Footer } from "@/components/footer";
import { usePreferences } from "@/context/preferences-context";
import { useSEO } from "@/hooks/use-seo";
import type { BibleLocation } from "@/types/bible";
import type { TalmudLocation } from "@/types/talmud";
import { bibleAPI } from "@/lib/bible-api";
import NotFound from "@/pages/not-found";

export default function BibleChapterPage() {
  const { book, chapter } = useParams<{ book: string; chapter: string }>();
  const [location, setLocation] = useLocation();
  const { preferences } = usePreferences();

  const parsedChapter = chapter ? parseInt(chapter) : 1;
  
  const bibleLocation: BibleLocation = {
    work: "Bible",
    book: book || "genesis",
    chapter: parsedChapter,
  };

  // Set up SEO
  const bookTitle = book ? book.charAt(0).toUpperCase() + book.slice(1).replace(/-/g, ' ') : 'Genesis';
  useSEO({
    title: `${bookTitle} ${parsedChapter} - Hebrew & English Bible | ChavrutAI`,
    description: `Read ${bookTitle} Chapter ${parsedChapter} with Hebrew and English text from JPS 1985 translation. Free access to the Bible online.`,
    ogTitle: `${bookTitle} ${parsedChapter} - Bible Study`,
    ogDescription: `Read ${bookTitle} Chapter ${parsedChapter} with parallel Hebrew-English text.`,
    canonical: `/bible/${book}/${chapter}`,
    robots: "index, follow"
  });

  // Fetch Bible text
  const { 
    data: text, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/bible/text', bibleLocation.book, bibleLocation.chapter],
    queryFn: () => bibleAPI.getText(bibleLocation),
  });

  // Fetch chapter count for navigation
  const { data: chapters } = useQuery({
    queryKey: ['/api/bible/chapters', bibleLocation.book],
    queryFn: () => bibleAPI.getChapters(bibleLocation.book),
  });

  const maxChapter = chapters?.length || 50;
  const canGoPrev = parsedChapter > 1;
  const canGoNext = parsedChapter < maxChapter;

  const handlePrevChapter = () => {
    if (canGoPrev) {
      setLocation(`/bible/${book}/${parsedChapter - 1}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextChapter = () => {
    if (canGoNext) {
      setLocation(`/bible/${book}/${parsedChapter + 1}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handler for hamburger menu navigation (Bible doesn't use same navigation structure as Talmud)
  const handleLocationChange = (newLocation: TalmudLocation) => {
    // Navigate to Talmud tractate
    const tractateSlug = newLocation.tractate.toLowerCase().replace(/\s+/g, '-');
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/tractate/${tractateSlug}/${folioSlug}`;
  };

  if (!book || !chapter) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Hamburger Menu */}
            <div className="flex items-center flex-shrink-0">
              <HamburgerMenu onLocationChange={handleLocationChange} />
            </div>
            
            {/* Center Section: Title */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <h1 className="text-xl font-semibold truncate" data-testid="text-chapter-title">
                {bookTitle} {parsedChapter}
              </h1>
            </div>
            
            {/* Right Section: Spacer for symmetry */}
            <div className="flex-shrink-0" style={{ width: '48px' }} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-4xl mx-auto px-4 py-6 text-size-${preferences.textSize} hebrew-font-${preferences.hebrewFont} layout-${preferences.layout}`}>

        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load Bible text. Please try again.
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

        {/* Bible Text */}
        {text && !isLoading && (
          <div className="space-y-6">
            <BibleTextDisplay text={text} />
          </div>
        )}

        {/* Chapter Navigation */}
        {text && !isLoading && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrevChapter}
                disabled={!canGoPrev}
                data-testid="button-prev-chapter"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {bookTitle} {parsedChapter - 1}
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Chapter {parsedChapter} of {maxChapter}
              </span>
              
              <Button
                variant="outline"
                onClick={handleNextChapter}
                disabled={!canGoNext}
                data-testid="button-next-chapter"
              >
                {bookTitle} {parsedChapter + 1}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
