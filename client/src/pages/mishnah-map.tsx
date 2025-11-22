import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getTractateSlug } from "@shared/tractates";
import { MISHNAH_MAP_DATA, getAllTractates, type MishnahMapping } from "@shared/mishnah-map";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";

export default function MishnahMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTractate, setSelectedTractate] = useState<string>("all");

  useSEO({
    title: "Mishnah-Talmud Mapping | ChavrutAI",
    description: "Comprehensive mapping of Mishnah passages to their corresponding discussions in the Talmud. Find where each Mishnah is discussed and navigate directly to the relevant section."
  });

  const handleLocationChange = (newLocation: TalmudLocation) => {
    const tractateSlug = getTractateSlug(newLocation.tractate);
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/tractate/${tractateSlug}/${folioSlug}`;
  };

  const allTractates = useMemo(() => getAllTractates(), []);

  const filteredData = useMemo(() => {
    let data = MISHNAH_MAP_DATA;

    if (selectedTractate !== "all") {
      data = data.filter(entry => entry.tractate === selectedTractate);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(entry =>
        entry.tractate.toLowerCase().includes(query) ||
        entry.mishnahChapter.toString().includes(query) ||
        entry.startDaf.toLowerCase().includes(query)
      );
    }

    return data;
  }, [selectedTractate, searchQuery]);

  const generateChavrutAILink = (entry: MishnahMapping): string => {
    const tractateSlug = getTractateSlug(entry.tractate);
    const page = entry.startDaf;
    const section = entry.startLine;
    return `/tractate/${tractateSlug}/${page}#section-${section}`;
  };

  const formatMishnahRange = (entry: MishnahMapping): string => {
    if (entry.startMishnah === entry.endMishnah) {
      return `${entry.startMishnah}`;
    }
    return `${entry.startMishnah}-${entry.endMishnah}`;
  };

  const formatTalmudLocation = (entry: MishnahMapping): string => {
    if (entry.startDaf === entry.endDaf && entry.startLine === entry.endLine) {
      return `${entry.startDaf}:${entry.startLine}`;
    }
    return `${entry.startDaf}:${entry.startLine} - ${entry.endDaf}:${entry.endLine}`;
  };

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
            Click any link to navigate directly to the relevant section.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by tractate, chapter, or page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              {/* Tractate Filter */}
              <div className="md:w-64">
                <Select value={selectedTractate} onValueChange={setSelectedTractate}>
                  <SelectTrigger data-testid="select-tractate">
                    <SelectValue placeholder="All Tractates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tractates</SelectItem>
                    {allTractates.map((tractate) => (
                      <SelectItem key={tractate} value={tractate}>
                        {tractate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredData.length} of {MISHNAH_MAP_DATA.length} mappings
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mishnah Mappings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm">Tractate</th>
                    <th className="text-left p-4 font-semibold text-sm">Chapter</th>
                    <th className="text-left p-4 font-semibold text-sm">Mishnah</th>
                    <th className="text-left p-4 font-semibold text-sm">Talmud Location</th>
                    <th className="text-left p-4 font-semibold text-sm">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No mappings found. Try adjusting your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry, index) => (
                      <tr
                        key={`${entry.tractate}-${entry.mishnahChapter}-${entry.startMishnah}-${index}`}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                        data-testid={`row-mapping-${index}`}
                      >
                        <td className="p-4 font-medium">{entry.tractate}</td>
                        <td className="p-4">{entry.mishnahChapter}</td>
                        <td className="p-4">{formatMishnahRange(entry)}</td>
                        <td className="p-4 font-mono text-sm">{formatTalmudLocation(entry)}</td>
                        <td className="p-4">
                          <Link
                            href={generateChavrutAILink(entry)}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                            data-testid={`link-chavrutai-${index}`}
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
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
            <p className="text-sm text-blue-800 dark:text-blue-200">
              The table shows where each Mishnah passage appears in the Talmud, with direct links to the specific section in ChavrutAI.
              Use the search and filter tools above to find specific passages.
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
