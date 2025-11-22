import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { Footer } from "@/components/footer";
import { useSEO } from "@/hooks/use-seo";
import { getTractateSlug, TRACTATE_HEBREW_NAMES, SEDER_TRACTATES } from "@shared/tractates";
import { MISHNAH_MAP_DATA, type MishnahMapping } from "@shared/mishnah-map";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";

const SEDER_ORGANIZATION = {
  "Seder Zeraim": {
    hebrew: "סדר זרעים",
    description: "Agriculture and blessings",
    tractates: SEDER_TRACTATES.zeraim.map(t => t.name)
  },
  "Seder Moed": {
    hebrew: "סדר מועד", 
    description: "Holidays and appointed times",
    tractates: SEDER_TRACTATES.moed.map(t => t.name)
  },
  "Seder Nashim": {
    hebrew: "סדר נשים",
    description: "Women and family law", 
    tractates: SEDER_TRACTATES.nashim.map(t => t.name)
  },
  "Seder Nezikin": {
    hebrew: "סדר נזיקין",
    description: "Damages and civil law",
    tractates: SEDER_TRACTATES.nezikin.map(t => t.name)
  },
  "Seder Kodashim": {
    hebrew: "סדר קדשים", 
    description: "Holy things and sacrifices",
    tractates: SEDER_TRACTATES.kodashim.map(t => t.name)
  },
  "Seder Tohorot": {
    hebrew: "סדר טהרות",
    description: "Ritual purity",
    tractates: SEDER_TRACTATES.tohorot.map(t => t.name)
  }
};

interface MishnahCardData {
  tractate: string;
  chapterMishnah: string;
  talmudRange: string;
  href: string;
}

export default function MishnahMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeder, setSelectedSeder] = useState<string>("all");

  useSEO({
    title: "Mishnah-Talmud Mapping | ChavrutAI",
    description: "Comprehensive mapping of Mishnah passages to their corresponding discussions in the Talmud. Find where each Mishnah is discussed and navigate directly to the relevant section."
  });

  const handleLocationChange = (newLocation: TalmudLocation) => {
    const tractateSlug = getTractateSlug(newLocation.tractate);
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/tractate/${tractateSlug}/${folioSlug}`;
  };

  // Transform data into organized structure by Seder and tractate
  const organizedData = useMemo(() => {
    const result: Record<string, Record<string, MishnahCardData[]>> = {};

    MISHNAH_MAP_DATA.forEach((entry: MishnahMapping) => {
      // Find which Seder this tractate belongs to
      let sederName: string | null = null;
      for (const [seder, data] of Object.entries(SEDER_ORGANIZATION)) {
        if (data.tractates.includes(entry.tractate)) {
          sederName = seder;
          break;
        }
      }

      if (!sederName) return;

      // Initialize seder if needed
      if (!result[sederName]) {
        result[sederName] = {};
      }

      // Initialize tractate if needed
      if (!result[sederName][entry.tractate]) {
        result[sederName][entry.tractate] = [];
      }

      // Format chapter:mishnah
      const chapterMishnah = entry.startMishnah === entry.endMishnah
        ? `${entry.mishnahChapter}:${entry.startMishnah}`
        : `${entry.mishnahChapter}:${entry.startMishnah}-${entry.endMishnah}`;

      // Format Talmud range
      const talmudRange = entry.startDaf === entry.endDaf && entry.startLine === entry.endLine
        ? `${entry.startDaf}:${entry.startLine}`
        : `${entry.startDaf}:${entry.startLine}-${entry.endDaf}:${entry.endLine}`;

      // Generate link
      const tractateSlug = getTractateSlug(entry.tractate);
      const href = `/tractate/${tractateSlug}/${entry.startDaf}#section-${entry.startLine}`;

      result[sederName][entry.tractate].push({
        tractate: entry.tractate,
        chapterMishnah,
        talmudRange,
        href
      });
    });

    return result;
  }, []);

  // Filter data based on search and selected Seder
  const filteredData = useMemo(() => {
    let data = { ...organizedData };

    // Filter by Seder
    if (selectedSeder !== "all") {
      data = { [selectedSeder]: data[selectedSeder] || {} };
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered: typeof data = {};

      Object.entries(data).forEach(([seder, tractates]) => {
        const filteredTractates: Record<string, MishnahCardData[]> = {};

        Object.entries(tractates).forEach(([tractate, cards]) => {
          const filteredCards = cards.filter(card =>
            card.tractate.toLowerCase().includes(query) ||
            card.chapterMishnah.includes(query) ||
            card.talmudRange.toLowerCase().includes(query)
          );

          if (filteredCards.length > 0) {
            filteredTractates[tractate] = filteredCards;
          }
        });

        if (Object.keys(filteredTractates).length > 0) {
          filtered[seder] = filteredTractates;
        }
      });

      data = filtered;
    }

    return data;
  }, [organizedData, selectedSeder, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <HamburgerMenu onLocationChange={handleLocationChange} />
            
            <Link 
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
              data-testid="header-logo-link"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={hebrewBookIcon} 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </Link>
            
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Mishnah-Talmud Mapping
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore the connections between Mishnah passages and their corresponding discussions in the Talmud. 
            Click any Mishnah to navigate directly to the relevant section.
          </p>
        </div>

        {/* Info Box */}
        <Card className="mb-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2 text-blue-900 dark:text-blue-100">
              About This Mapping
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              This mapping is based on data from <a 
                href="https://github.com/Sefaria/Sefaria-Project/blob/master/data/Mishnah%20Map.csv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-300"
              >
                Sefaria's Mishnah Map
              </a>.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Browse Mishnah passages organized by Seder and tractate. Each card shows the Mishnah reference and its location in the Talmud.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              See also the discussion of this table in <a 
                href="https://www.ezrabrand.com/p/a-quantitative-analysis-of-the-talmudic" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-300"
              >
                A Quantitative Analysis of the Talmudic 'Sugya': Identifying the Upper Bound of Sugya Length, and Lower Bound of Number of Sugyot
              </a>, sections "Methodology" and "Appendix 2 - Where on the page does each Chapter start?"
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by tractate, Mishnah, or page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              {/* Seder Filter */}
              <div className="md:w-64">
                <Select value={selectedSeder} onValueChange={setSelectedSeder}>
                  <SelectTrigger data-testid="select-seder">
                    <SelectValue placeholder="All Sedarim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sedarim</SelectItem>
                    {Object.keys(SEDER_ORGANIZATION).map((seder) => (
                      <SelectItem key={seder} value={seder}>
                        {seder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seder Sections */}
        <div className="space-y-4">
          {Object.entries(filteredData).map(([sederName, tractates]) => {
            const sederInfo = SEDER_ORGANIZATION[sederName as keyof typeof SEDER_ORGANIZATION];
            
            return (
              <div key={sederName} className="space-y-2">
                {/* Seder Header */}
                <div className="text-center border-b border-border pb-2">
                  <h3 className="text-xl font-semibold text-primary">
                    {sederName}
                  </h3>
                  <p className="text-base text-primary/70 font-hebrew">
                    {sederInfo.hebrew}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sederInfo.description}
                  </p>
                </div>

                {/* Tractates */}
                {Object.entries(tractates).map(([tractate, cards]) => (
                  <div key={tractate} className="space-y-2">
                    {/* Tractate Header */}
                    <div className="flex items-baseline gap-2 px-2 mt-4">
                      <h4 className="text-lg font-semibold text-primary">{tractate}</h4>
                      <span className="text-sm text-primary/70 font-hebrew">
                        {TRACTATE_HEBREW_NAMES[tractate as keyof typeof TRACTATE_HEBREW_NAMES] || ''}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {cards.length} {cards.length === 1 ? 'Mishnah' : 'Mishnahs'}
                      </span>
                    </div>

                    {/* Mishnah Cards Grid */}
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                      {cards.map((card, index) => (
                        <Link 
                          key={`${card.tractate}-${card.chapterMishnah}-${index}`}
                          href={card.href}
                          data-testid={`card-mishnah-${tractate}-${index}`}
                        >
                          <Card className="hover:shadow-sm transition-shadow cursor-pointer border-border hover:border-primary/30 bg-card/50 hover:bg-card h-full">
                            <div className="p-3 text-center">
                              <div className="text-base font-semibold text-primary mb-1">
                                {card.chapterMishnah}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {card.talmudRange}
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {Object.keys(filteredData).length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No Mishnah mappings found. Try adjusting your search or filter.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
