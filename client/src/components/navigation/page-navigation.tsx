import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalmudLocation } from "@/types/talmud";

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
    
    onLocationChange({
      ...location,
      folio: newFolio,
      side: newSide
    });
  };

  const handleNext = () => {
    let newFolio = location.folio;
    let newSide = location.side;
    
    if (location.side === 'a') {
      newSide = 'b';
    } else {
      newFolio = location.folio + 1;
      newSide = 'a';
    }
    
    onLocationChange({
      ...location,
      folio: newFolio,
      side: newSide
    });
  };

  const canGoPrevious = !(location.folio === 2 && location.side === 'a');

  return (
    <div className="flex justify-between items-center mt-8">
      <Button
        variant="outline"
        className="flex items-center space-x-2 px-6 py-3"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
      >
        <ChevronLeft className="w-4 h-4 text-talmud-blue" />
        <span className="text-talmud-blue font-medium">Previous</span>
      </Button>
      
      <div className="text-center">
        <p className="text-gray-600 text-sm">Page {location.folio}{location.side}</p>
        <p className="text-gray-500 text-xs">{location.tractate}, Chapter {location.chapter}</p>
      </div>
      
      <Button
        variant="outline"
        className="flex items-center space-x-2 px-6 py-3"
        onClick={handleNext}
      >
        <span className="text-talmud-blue font-medium">Next</span>
        <ChevronRight className="w-4 h-4 text-talmud-blue" />
      </Button>
    </div>
  );
}
