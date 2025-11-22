import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalmudLocation } from "@/types/talmud";
import { getMaxFolio } from "@shared/tractates";
import { trackEvent } from "@/lib/analytics";

interface PageNavigationProps {
  location: TalmudLocation;
  onLocationChange: (location: TalmudLocation) => void;
}

export function PageNavigation({ location, onLocationChange }: PageNavigationProps) {
  const handlePrevious = () => {
    let newFolio = location.folio;
    let newSide = location.side;
    
    if (location.side === 'b') {
      newSide = 'a';
    } else if (location.folio > 2) {
      newFolio = location.folio - 1;
      newSide = 'b';
    } else {
      // At the beginning, don't go back further
      return;
    }
    
    // Track page navigation event
    trackEvent('navigate_page', 'navigation', `${location.tractate} ${newFolio}${newSide}`, newFolio);
    
    onLocationChange({
      ...location,
      folio: newFolio,
      side: newSide
    });
  };

  const handleNext = () => {
    let newFolio = location.folio;
    let newSide = location.side;
    
    const maxFolio = getMaxFolio(location.tractate);
    
    if (location.side === 'a') {
      newSide = 'b';
    } else {
      newFolio = location.folio + 1;
      newSide = 'a';
    }
    
    // Don't go beyond the tractate's maximum folio
    if (newFolio > maxFolio) {
      return;
    }
    
    // Track page navigation event
    trackEvent('navigate_page', 'navigation', `${location.tractate} ${newFolio}${newSide}`, newFolio);
    
    onLocationChange({
      ...location,
      folio: newFolio,
      side: newSide
    });
  };

  // Helper function to get previous page number
  const getPreviousPage = () => {
    if (location.side === 'b') {
      return `${location.folio}a`;
    } else if (location.folio > 2) {
      return `${location.folio - 1}b`;
    }
    return null;
  };

  // Helper function to get next page number
  const getNextPage = () => {
    const maxFolio = getMaxFolio(location.tractate);
    if (location.side === 'a') {
      return `${location.folio}b`;
    } else if (location.folio < maxFolio) {
      return `${location.folio + 1}a`;
    }
    return null;
  };

  const canGoPrevious = !(location.folio === 2 && location.side === 'a');
  const canGoNext = getNextPage() !== null;
  const previousPage = getPreviousPage();
  const nextPage = getNextPage();

  return (
    <div className="flex justify-between items-center mt-8">
      {/* Next button on left (Hebrew right-to-left logic) */}
      <Button
        variant="outline"
        className="flex items-center space-x-2 px-6 py-3"
        onClick={handleNext}
        disabled={!canGoNext}
      >
        <ChevronLeft className="w-4 h-4 text-primary" />
        <span className="text-primary font-medium">
          Next{nextPage ? ` (${nextPage})` : ''}
        </span>
      </Button>
      

      
      {/* Previous button on right (Hebrew right-to-left logic) */}
      <Button
        variant="outline"
        className="flex items-center space-x-2 px-6 py-3"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
      >
        <span className="text-primary font-medium">
          Previous{previousPage ? ` (${previousPage})` : ''}
        </span>
        <ChevronRight className="w-4 h-4 text-primary" />
      </Button>
    </div>
  );
}
