import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalmudLocation } from "@/types/talmud";
import { findChapterForFolio } from "@/lib/chapter-data";
import { getMaxFolio } from "@shared/tractates";

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
    <div className="flex items-center justify-between w-full max-w-md">
      {/* Next Page Button (Left side - for Hebrew RTL flow) */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextPage}
        disabled={!canGoNext}
        className="flex items-center gap-1 px-2 py-2 flex-shrink-0"
        title={(() => {
          if (location.side === 'a') {
            return `Next: ${location.folio}b`;
          } else if (location.folio < maxFolio) {
            return `Next: ${location.folio + 1}a`;
          }
          return 'Next page';
        })()}
      >
        <ChevronLeft className="w-3 h-3" />
        {/* Desktop: Full text */}
        <span className="text-xs hidden lg:inline">
          Next {(() => {
            if (location.side === 'a') {
              return `(${location.folio}b)`;
            } else if (location.folio < maxFolio) {
              return `(${location.folio + 1}a)`;
            }
            return '';
          })()}
        </span>
        {/* Tablet & Mobile: Just page numbers */}
        <span className="text-xs inline lg:hidden">
          {(() => {
            if (location.side === 'a') {
              return `${location.folio}b`;
            } else if (location.folio < maxFolio) {
              return `${location.folio + 1}a`;
            }
            return '';
          })()}
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
        title={(() => {
          if (location.side === 'b') {
            return `Previous: ${location.folio}a`;
          } else if (location.folio > 2) {
            return `Previous: ${location.folio - 1}b`;
          }
          return 'Previous page';
        })()}
      >
        {/* Desktop: Full text */}
        <span className="text-xs hidden lg:inline">
          Previous {(() => {
            if (location.side === 'b') {
              return `(${location.folio}a)`;
            } else if (location.folio > 2) {
              return `(${location.folio - 1}b)`;
            }
            return '';
          })()}
        </span>
        {/* Tablet & Mobile: Just page numbers */}
        <span className="text-xs inline lg:hidden">
          {(() => {
            if (location.side === 'b') {
              return `${location.folio}a`;
            } else if (location.folio > 2) {
              return `${location.folio - 1}b`;
            }
            return '';
          })()}
        </span>
        <ChevronRight className="w-3 h-3" />
      </Button>
    </div>
  );
}