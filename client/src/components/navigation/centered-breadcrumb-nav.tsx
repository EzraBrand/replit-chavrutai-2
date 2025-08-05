import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalmudLocation } from "@/types/talmud";
import { findChapterForFolio } from "@/lib/chapter-data";
import { getMaxFolio } from "@/lib/tractate-ranges";

interface CenteredBreadcrumbNavProps {
  location: TalmudLocation;
  onLocationChange: (location: TalmudLocation) => void;
}

export function CenteredBreadcrumbNav({ location, onLocationChange }: CenteredBreadcrumbNavProps) {
  // Find current chapter info
  const currentChapter = findChapterForFolio(location.tractate, location.folio, location.side);
  
  // Calculate prev/next page navigation
  const maxFolio = getMaxFolio(location.tractate);
  const currentPageNumber = (location.folio - 2) * 2 + (location.side === 'a' ? 0 : 1) + 1;
  const totalPages = (maxFolio - 1) * 2;
  
  const canGoPrev = currentPageNumber > 1;
  const canGoNext = currentPageNumber < totalPages;
  
  const handlePrevPage = () => {
    if (!canGoPrev) return;
    
    if (location.side === 'b') {
      // Go from 3b to 3a
      onLocationChange({
        ...location,
        side: 'a'
      });
    } else {
      // Go from 3a to 2b (previous folio)
      const newFolio = location.folio - 1;
      if (newFolio >= 2) {
        onLocationChange({
          ...location,
          folio: newFolio,
          side: 'b'
        });
      }
    }
  };
  
  const handleNextPage = () => {
    if (!canGoNext) return;
    
    if (location.side === 'a') {
      // Go from 3a to 3b
      onLocationChange({
        ...location,
        side: 'b'
      });
    } else {
      // Go from 3b to 4a (next folio)
      const newFolio = location.folio + 1;
      if (newFolio <= maxFolio) {
        onLocationChange({
          ...location,
          folio: newFolio,
          side: 'a'
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      {/* Previous Page Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrevPage}
        disabled={!canGoPrev}
        className="flex items-center gap-1 text-sm px-2 py-1 h-auto"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">
          {canGoPrev && location.side === 'b' ? `${location.folio}a` : 
           canGoPrev ? `${location.folio - 1}b` : ''}
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

      {/* Next Page Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNextPage}
        disabled={!canGoNext}
        className="flex items-center gap-1 text-sm px-2 py-1 h-auto"
      >
        <span className="hidden sm:inline">
          {canGoNext && location.side === 'a' ? `${location.folio}b` : 
           canGoNext ? `${location.folio + 1}a` : ''}
        </span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}