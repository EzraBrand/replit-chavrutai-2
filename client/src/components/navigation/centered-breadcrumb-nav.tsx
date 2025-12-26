import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalmudLocation } from "@/types/talmud";
import { findChapterForFolio } from "@/lib/chapter-data";
import { getNextPage, getPreviousPage, formatPage, type TalmudPage } from "@shared/talmud-navigation";

interface CenteredBreadcrumbNavProps {
  location: TalmudLocation;
  onLocationChange: (location: TalmudLocation) => void;
}

export function CenteredBreadcrumbNav({ location, onLocationChange }: CenteredBreadcrumbNavProps) {
  // Find current chapter info
  const currentChapter = findChapterForFolio(location.tractate, location.folio, location.side);
  
  // Use unified navigation helpers
  const currentPage: TalmudPage = {
    tractate: location.tractate,
    folio: location.folio,
    side: location.side
  };
  
  const nextPage = getNextPage(currentPage);
  const prevPage = getPreviousPage(currentPage);
  
  const canGoPrev = prevPage !== null;
  const canGoNext = nextPage !== null;
  
  const handlePrevPage = () => {
    if (!prevPage) return;
    
    onLocationChange({
      ...location,
      folio: prevPage.folio,
      side: prevPage.side
    });
  };
  
  const handleNextPage = () => {
    if (!nextPage) return;
    
    onLocationChange({
      ...location,
      folio: nextPage.folio,
      side: nextPage.side
    });
  };

  return (
    <div className="flex items-center justify-between w-full max-w-md">
      {/* Next Page Button (Left side - for Hebrew RTL flow) */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextPage}
        disabled={!canGoNext}
        className="flex items-center gap-1 px-2 py-2 flex-shrink-0"
        title={nextPage ? `Next: ${formatPage(nextPage)}` : 'Next page'}
      >
        <ChevronLeft className="w-3 h-3" />
        {/* Desktop: Full text */}
        <span className="text-xs hidden lg:inline">
          Next {nextPage ? `(${formatPage(nextPage)})` : ''}
        </span>
        {/* Tablet & Mobile: Just page numbers */}
        <span className="text-xs inline lg:hidden">
          {nextPage ? formatPage(nextPage) : ''}
        </span>
      </Button>

      {/* Centered Breadcrumb Content */}
      <div className="flex flex-col items-center justify-center text-center mx-4 min-w-0">
        {/* Row 1: Tractate */}
        <div className="text-sm font-medium text-primary truncate max-w-full">
          {location.tractate}
        </div>
        
        {/* Row 2: Chapter */}
        <div className="text-xs text-muted-foreground truncate max-w-full">
          {currentChapter ? (
            <>Chapter {currentChapter.number}: <em>{currentChapter.englishName}</em></>
          ) : (
            `Chapter 1`
          )}
        </div>
        
        {/* Row 3: Page */}
        <div className="text-xs text-muted-foreground">
          {location.folio}{location.side}
        </div>
      </div>

      {/* Previous Page Button (Right side - for Hebrew RTL flow) */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevPage}
        disabled={!canGoPrev}
        className="flex items-center gap-1 px-2 py-2 flex-shrink-0"
        title={prevPage ? `Previous: ${formatPage(prevPage)}` : 'Previous page'}
      >
        {/* Desktop: Full text */}
        <span className="text-xs hidden lg:inline">
          Previous {prevPage ? `(${formatPage(prevPage)})` : ''}
        </span>
        {/* Tablet & Mobile: Just page numbers */}
        <span className="text-xs inline lg:hidden">
          {prevPage ? formatPage(prevPage) : ''}
        </span>
        <ChevronRight className="w-3 h-3" />
      </Button>
    </div>
  );
}