import { X, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { TalmudLocation, Work } from "@/types/talmud";
import { WORKS } from "@/types/talmud";
import { useQuery } from "@tanstack/react-query";
import { sefariaAPI } from "@/lib/sefaria";

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

  // Generate page options with expanded ranges
  const generatePageOptions = () => {
    const pages: string[] = [];
    
    // Map chapters to their folio ranges (up to 150 pages)
    const chapterRanges: Record<number, [number, number]> = {
      1: [2, 25],
      2: [25, 50],
      3: [50, 75],
      4: [75, 100],
      5: [100, 125],
      6: [125, 150]
    };
    
    const [startFolio, endFolio] = chapterRanges[location.chapter] || [2, 25];
    
    for (let folio = startFolio; folio <= endFolio; folio++) {
      pages.push(`${folio}a`);
      pages.push(`${folio}b`);
    }
    
    return pages;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="lg:hidden text-talmud-brown hover:text-talmud-lightbrown"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 bg-sepia-50">
        <SheetHeader>
          <SheetTitle className="text-talmud-brown">ChavrutAI</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-6">
          {/* Current Location Display */}
          <div className="border-b border-sepia-200 pb-4">
            <h3 className="font-semibold text-talmud-brown mb-2">Current Location</h3>
            <p className="text-sm text-gray-600">
              {location.work} › {location.tractate} › Chapter {location.chapter} › {location.folio}{location.side}
            </p>
          </div>
          
          {/* Navigation Selectors */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Work</label>
              <Select value={location.work} onValueChange={handleWorkChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKS.map((work) => (
                    <SelectItem key={work} value={work}>
                      {work}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Tractate</label>
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">Chapter</label>
              <Select value={location.chapter.toString()} onValueChange={handleChapterChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.number} value={chapter.number.toString()}>
                      Chapter {chapter.number} ({chapter.folioRange})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Page</label>
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
