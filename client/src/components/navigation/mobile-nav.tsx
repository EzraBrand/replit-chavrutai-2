import { X, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { TalmudLocation, Work } from "@/types/talmud";
import { WORKS } from "@/types/talmud";
import { useQuery } from "@tanstack/react-query";
import { sefariaAPI } from "@/lib/sefaria";
import { getMaxFolio, getLastSide } from "@shared/talmud-navigation";

interface MobileNavProps {
  location: TalmudLocation;
  onLocationChange: (location: TalmudLocation) => void;
}

export function MobileNav({ location, onLocationChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Fetch tractates for current work
  const { data: tractates = [] } = useQuery({
    queryKey: ['/api/tractates', location.work],
    queryFn: () => sefariaAPI.getTractates(location.work),
  });

  // Fetch chapters for current tractate
  const { data: chapters = [] } = useQuery({
    queryKey: ['/api/chapters', location.tractate],
    queryFn: () => sefariaAPI.getChapters(location.tractate),
  });

  const handleWorkChange = (work: string) => {
    onLocationChange({
      work: work as Work,
      tractate: "Berakhot",
      chapter: 1,
      folio: 2,
      side: 'a'
    });
  };

  const handleTractateChange = (tractate: string) => {
    onLocationChange({
      ...location,
      tractate,
      chapter: 1,
      folio: 2,
      side: 'a'
    });
  };

  const handleChapterChange = (chapter: string) => {
    onLocationChange({
      ...location,
      chapter: parseInt(chapter),
      folio: 2,
      side: 'a'
    });
  };

  const handlePageChange = (page: string) => {
    const folio = parseInt(page.slice(0, -1));
    const side = page.slice(-1) as 'a' | 'b';
    onLocationChange({
      ...location,
      folio,
      side
    });
  };

  // Generate page options for current tractate with accurate folio ranges
  const generatePageOptions = () => {
    const pages: string[] = [];
    
    const maxFolio = getMaxFolio(location.tractate);
    const lastSide = getLastSide(location.tractate);
    
    // Generate pages from 2 to the tractate's maximum folio
    for (let folio = 2; folio <= maxFolio; folio++) {
      pages.push(`${folio}a`);
      // Only add 'b' side if not the last folio or if lastSide is 'b'
      if (folio < maxFolio || lastSide === 'b') {
        pages.push(`${folio}b`);
      }
    }
    
    return pages;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden text-primary hover:text-primary/80"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 bg-background">
        <SheetHeader>
          <SheetTitle className="text-primary">ChavrutAI</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          {/* Current Location Display */}
          <div className="border-b border-border pb-4">
            <h3 className="font-semibold text-primary mb-2">Current Location</h3>
            <p className="text-sm text-muted-foreground">
              {location.tractate} › {location.folio}{location.side}
            </p>
          </div>
          
          {/* Navigation Selectors */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Tractate</label>
              <Select value={location.tractate} onValueChange={handleTractateChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tractates.map((tractate) => (
                    <SelectItem key={tractate} value={tractate}>
                      {tractate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Page</label>
              <Select value={`${location.folio}${location.side}`} onValueChange={handlePageChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generatePageOptions().map((page) => (
                    <SelectItem key={page} value={page}>
                      {page}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
