import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalmudLocation } from "@/types/talmud";
import { getNextPage, getPreviousPage, formatPage, type TalmudPage } from "@shared/talmud-navigation";
import { trackEvent } from "@/lib/analytics";

interface PageNavigationProps {
  location: TalmudLocation;
  onLocationChange: (location: TalmudLocation) => void;
}

export function PageNavigation({ location, onLocationChange }: PageNavigationProps) {
  const currentPage: TalmudPage = {
    tractate: location.tractate,
    folio: location.folio,
    side: location.side
  };
  
  const nextPage = getNextPage(currentPage);
  const previousPage = getPreviousPage(currentPage);
  
  const handlePrevious = () => {
    if (!previousPage) return;
    
    trackEvent('navigate_page', 'navigation', `${location.tractate} ${formatPage(previousPage)}`, previousPage.folio);
    
    onLocationChange({
      ...location,
      folio: previousPage.folio,
      side: previousPage.side
    });
  };

  const handleNext = () => {
    if (!nextPage) return;
    
    trackEvent('navigate_page', 'navigation', `${location.tractate} ${formatPage(nextPage)}`, nextPage.folio);
    
    onLocationChange({
      ...location,
      folio: nextPage.folio,
      side: nextPage.side
    });
  };

  const canGoPrevious = previousPage !== null;
  const canGoNext = nextPage !== null;

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
          Next{nextPage ? ` (${formatPage(nextPage)})` : ''}
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
          Previous{previousPage ? ` (${formatPage(previousPage)})` : ''}
        </span>
        <ChevronRight className="w-4 h-4 text-primary" />
      </Button>
    </div>
  );
}
