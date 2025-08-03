import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sefariaAPI } from "@/lib/sefaria";
import { getMaxFolio } from "@/lib/tractate-ranges";

// Chapter data with Hebrew names - this would ideally come from an API
// For now, I'll include data for the main tractates shown in the example
const CHAPTER_DATA: Record<string, Array<{
  number: number;
  englishName: string;
  hebrewName: string;
  startFolio: number;
  startSide: 'a' | 'b';
  endFolio: number;
  endSide: 'a' | 'b';
}>> = {
  "shabbat": [
    { number: 1, englishName: "Yetziot HaShabbat", hebrewName: "יציאות השבת", startFolio: 2, startSide: 'a', endFolio: 20, endSide: 'b' },
    { number: 2, englishName: "BaMeh Madlikin", hebrewName: "במה מדליקין", startFolio: 20, startSide: 'b', endFolio: 31, endSide: 'a' },
    { number: 3, englishName: "Kirah", hebrewName: "כירה", startFolio: 36, startSide: 'b', endFolio: 47, endSide: 'b' },
    { number: 4, englishName: "BaMeh Tomnin", hebrewName: "במה טומנין", startFolio: 47, startSide: 'b', endFolio: 51, endSide: 'b' }
  ],
  "berakhot": [
    { number: 1, englishName: "From When", hebrewName: "מאימתי", startFolio: 2, startSide: 'a', endFolio: 13, endSide: 'a' },
    { number: 2, englishName: "He Was Standing in Prayer", hebrewName: "היה עומד בתפלה", startFolio: 13, startSide: 'a', endFolio: 22, endSide: 'a' },
    { number: 3, englishName: "One Whose Dead Lies Before Him", hebrewName: "מי שמתו מוטל לפניו", startFolio: 22, startSide: 'a', endFolio: 31, endSide: 'a' }
  ],
  "eruvin": [
    { number: 1, englishName: "With What Boundary", hebrewName: "במה מבואות", startFolio: 2, startSide: 'a', endFolio: 26, endSide: 'b' },
    { number: 2, englishName: "One May Make an Eruv", hebrewName: "עושין פסין", startFolio: 26, startSide: 'b', endFolio: 35, endSide: 'a' },
    { number: 3, englishName: "All Roofs", hebrewName: "כל גגות", startFolio: 35, startSide: 'a', endFolio: 49, endSide: 'a' }
  ]
};

// Hebrew names for tractates
const TRACTATE_HEBREW_NAMES: Record<string, string> = {
  "berakhot": "ברכות",
  "shabbat": "שבת", 
  "eruvin": "עירובין",
  "pesachim": "פסחים",
  "rosh hashanah": "ראש השנה", 
  "yoma": "יומא",
  "sukkah": "סוכה",
  "beitza": "ביצה",
  "ta'anit": "תענית",
  "megillah": "מגילה", 
  "mo'ed katan": "מועד קטן",
  "chagigah": "חגיגה"
};

function generateFolioButtons(startFolio: number, startSide: 'a' | 'b', endFolio: number, endSide: 'a' | 'b', tractate: string) {
  const folios: Array<{ folio: number; side: 'a' | 'b'; label: string }> = [];
  
  for (let folio = startFolio; folio <= endFolio; folio++) {
    if (folio === startFolio && folio === endFolio) {
      // Same folio range
      if (startSide === 'a') {
        folios.push({ folio, side: 'a', label: `${folio}a` });
        if (endSide === 'b') {
          folios.push({ folio, side: 'b', label: `${folio}b` });
        }
      } else {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else if (folio === startFolio) {
      // First folio
      if (startSide === 'a') {
        folios.push({ folio, side: 'a', label: `${folio}a` });
        folios.push({ folio, side: 'b', label: `${folio}b` });
      } else {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else if (folio === endFolio) {
      // Last folio
      folios.push({ folio, side: 'a', label: `${folio}a` });
      if (endSide === 'b') {
        folios.push({ folio, side: 'b', label: `${folio}b` });
      }
    } else {
      // Middle folios
      folios.push({ folio, side: 'a', label: `${folio}a` });
      folios.push({ folio, side: 'b', label: `${folio}b` });
    }
  }
  
  return folios;
}

export default function TractateContents() {
  const [match, params] = useRoute("/contents/:tractate");
  const tractate = params?.tractate || "";
  const tractateDisplayName = tractate.charAt(0).toUpperCase() + tractate.slice(1);
  
  const { data: chapters, isLoading } = useQuery({
    queryKey: ['/api/chapters', tractate],
    queryFn: () => sefariaAPI.getChapters(tractateDisplayName),
    enabled: !!tractate
  });

  if (!match) {
    return <div>Tractate not found</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const tractateChapters = CHAPTER_DATA[tractate.toLowerCase()] || [];
  const maxFolio = getMaxFolio(tractateDisplayName);
  const hebrewName = TRACTATE_HEBREW_NAMES[tractate.toLowerCase()] || tractate;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/contents">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Contents
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">{tractateDisplayName}</h1>
          <h2 className="text-2xl text-primary/80 mb-4 font-hebrew">{hebrewName}</h2>
          <p className="text-lg text-muted-foreground">
            {tractateChapters.length > 0 ? `${tractateChapters.length} Chapters` : `Folios 2a-${maxFolio}b`}
          </p>
        </div>

        {/* Chapters */}
        {tractateChapters.length > 0 ? (
          <div className="space-y-8">
            {tractateChapters.map((chapter) => {
              const folios = generateFolioButtons(
                chapter.startFolio, 
                chapter.startSide, 
                chapter.endFolio, 
                chapter.endSide,
                tractateDisplayName
              );

              return (
                <div key={chapter.number} className="space-y-4">
                  {/* Chapter Header */}
                  <div className="border-b border-border pb-3">
                    <h3 className="text-xl font-semibold text-primary">
                      Chapter {chapter.number}: {chapter.englishName}
                    </h3>
                    <p className="text-lg text-primary/70 font-hebrew mt-1">
                      {chapter.hebrewName}
                    </p>
                  </div>

                  {/* Folio Grid */}
                  <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
                    {folios.map((folio) => (
                      <Link 
                        key={`${folio.folio}${folio.side}`}
                        href={`/?tractate=${tractateDisplayName}&folio=${folio.folio}&side=${folio.side}`}
                      >
                        <Card className="hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                          <CardContent className="p-3 text-center">
                            <span className="text-sm font-medium text-primary">
                              {folio.label}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Fallback: Show all folios if no chapter data available
          <div className="space-y-4">
            <div className="border-b border-border pb-3">
              <h3 className="text-xl font-semibold text-primary">All Folios</h3>
            </div>
            
            <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-2">
              {Array.from({ length: maxFolio - 1 }, (_, i) => i + 2).map((folio) => (
                ['a', 'b'].map((side) => (
                  <Link 
                    key={`${folio}${side}`}
                    href={`/?tractate=${tractateDisplayName}&folio=${folio}&side=${side}`}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/20">
                      <CardContent className="p-3 text-center">
                        <span className="text-sm font-medium text-primary">
                          {folio}{side}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )).flat()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}