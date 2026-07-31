import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSEO } from "@/hooks/use-seo";
import { getStaticSEO } from "@shared/seo-data";
import { getTractateSlug, TRACTATE_HEBREW_NAMES, SEDER_TRACTATES, normalizeDisplayTractateName } from "@shared/tractates";
import { MISHNAH_MAP_DATA, type MishnahMapping } from "@shared/mishnah-map";
import { getMishnahChapterDataByTractate, getMishnahTalmudMapping, useChapterDataVersion, type ChapterInfo } from "@/lib/chapter-data";
import { PageShell, PageHeader, PageSection, SectionHeading } from "@/components/layout";

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

// Note: Tractate names now match Sefaria exactly (Beitzah, Arakhin)
// No mapping needed - keeping empty for backwards compatibility if needed
const TRACTATE_NAME_VARIANTS: Record<string, string> = {};

interface MishnahTile {
  mishnahNumber: string;
  talmudRange: string;
  href: string;
  sefariaUrl: string;
}

interface ChapterWithMishnayot extends ChapterInfo {
  mishnahTiles: MishnahTile[];
  talmudOrderNote?: string;
}

interface TractateData {
  name: string;
  chapters: ChapterWithMishnayot[];
}

interface SederData {
  tractates: TractateData[];
}

export default function MishnahMapPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeder, setSelectedSeder] = useState<string>("all");
  const chapterDataVersion = useChapterDataVersion();

  useSEO({
    ...getStaticSEO("/mishnah-map", window.location.origin)!,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Mishnah-Talmud Mapping",
      description: "Comprehensive mapping of Mishnah passages to their corresponding discussions in the Babylonian Talmud",
      url: `${window.location.origin}/mishnah-map`,
      creator: {
        "@type": "Organization",
        name: "Bekiut",
        url: window.location.origin,
      },
      about: {
        "@type": "Book",
        name: "Babylonian Talmud",
        inLanguage: ["he", "en"],
      },
    },
  });

  // Transform data into organized structure by Seder → Tractate → Chapter → Mishnah
  const organizedData = useMemo(() => {
    const result: Record<string, SederData> = {};

    // Iterate through Sedarim in canonical order
    Object.entries(SEDER_ORGANIZATION).forEach(([sederName, sederInfo]) => {
      result[sederName] = { tractates: [] };

      // Iterate through tractates in canonical order
      sederInfo.tractates.forEach(tractate => {
        // Get all Mishnah mappings for this tractate using slug-based comparison for robustness
        const canonicalSlug = getTractateSlug(tractate);
        const tractateMappings = MISHNAH_MAP_DATA.filter(entry => {
          // Normalize spelling variants first
          const normalizedTractate = TRACTATE_NAME_VARIANTS[entry.tractate] || entry.tractate;
          const entrySlug = getTractateSlug(normalizedTractate);
          return entrySlug === canonicalSlug;
        });

        if (tractateMappings.length === 0) return;

        const tractateSlug = tractate.toLowerCase().replace(/\s+/g, ' ');
        const chapters = getMishnahChapterDataByTractate(tractateSlug);
        const talmudMapping = getMishnahTalmudMapping(tractateSlug);

        // Shared tile builder: given filtered+sorted mappings and the Mishnah chapter number
        const buildTiles = (chapterMappings: MishnahMapping[], mishnahChNum: number): MishnahTile[] =>
          chapterMappings.map(mapping => {
            const mishnahNumber = mapping.startMishnah === mapping.endMishnah
              ? `${mapping.startMishnah}`
              : `${mapping.startMishnah}-${mapping.endMishnah}`;

            let talmudRange: string;
            if (mapping.startDaf === mapping.endDaf && mapping.startLine === mapping.endLine) {
              talmudRange = `${mapping.startDaf}:${mapping.startLine}`;
            } else if (mapping.startDaf === mapping.endDaf) {
              talmudRange = `${mapping.startDaf}:${mapping.startLine}-${mapping.endLine}`;
            } else {
              const startFolio = mapping.startDaf.slice(0, -1);
              const endFolio = mapping.endDaf.slice(0, -1);
              const endSide = mapping.endDaf.slice(-1);
              if (startFolio === endFolio) {
                talmudRange = `${mapping.startDaf}:${mapping.startLine}-${endSide}:${mapping.endLine}`;
              } else {
                talmudRange = `${mapping.startDaf}:${mapping.startLine}-${mapping.endDaf}:${mapping.endLine}`;
              }
            }

            const normalizedTractate = TRACTATE_NAME_VARIANTS[mapping.tractate] || normalizeDisplayTractateName(mapping.tractate);
            const tractateSlugForLink = getTractateSlug(normalizedTractate);
            const href = `/talmud/${tractateSlugForLink}/${mapping.startDaf}#section-${mapping.startLine}`;

            const sefariaTractateName = tractate.replace(/ /g, '_');
            const sefariaUrl = `https://www.sefaria.org.il/Mishnah_${sefariaTractateName}.${mishnahChNum}.${mapping.startMishnah}`;

            return { mishnahNumber, talmudRange, href, sefariaUrl };
          });

        // Group Mishnah mappings by chapter
        const chaptersWithMishnayot: ChapterWithMishnayot[] = chapters.length > 0
          ? (talmudMapping
              // Tractates with Mishnah/Talmud chapter numbering divergence:
              // iterate in Mishnah chapter order, grouping tiles by mishnahChapter
              // and pulling Talmud chapter folio data via the lookup
              ? talmudMapping.map(({ mishnahChapter, talmudChapter, talmudOrderNote }) => {
                  const talmudChData = chapters.find(ch => ch.number === talmudChapter) || {
                    number: mishnahChapter,
                    englishName: `Chapter ${mishnahChapter}`,
                    hebrewName: `פרק ${mishnahChapter}`,
                    startFolio: 0, startSide: 'a' as const,
                    endFolio: 0, endSide: 'a' as const,
                  };
                  const chapterMappings = tractateMappings
                    .filter(mapping => mapping.mishnahChapter === mishnahChapter)
                    .sort((a, b) => a.startMishnah - b.startMishnah);
                  const mishnahTiles = buildTiles(chapterMappings, mishnahChapter);
                  return { ...talmudChData, number: mishnahChapter, mishnahTiles, talmudOrderNote };
                })
              // Standard tractates: Talmud and Mishnah chapter numbers match
              : chapters.map(chapter => {
                  const chapterMappings = tractateMappings
                    .filter(mapping => mapping.mishnahChapter === chapter.number)
                    .sort((a, b) => a.startMishnah - b.startMishnah);
                  const mishnahTiles = buildTiles(chapterMappings, chapter.number);
                  return { ...chapter, mishnahTiles };
                })
            )
          : // Fallback for tractates without chapter data: group by Mishnah chapter
            (() => {
              const chapterNumbers = Array.from(new Set(tractateMappings.map(m => m.mishnahChapter))).sort((a, b) => a - b);
              
              return chapterNumbers.map(chapterNum => {
                const chapterMappings = tractateMappings
                  .filter(mapping => mapping.mishnahChapter === chapterNum)
                  .sort((a, b) => a.startMishnah - b.startMishnah);

                const mishnahTiles: MishnahTile[] = chapterMappings.map(mapping => {
                  const mishnahNumber = mapping.startMishnah === mapping.endMishnah
                    ? `${mapping.startMishnah}`
                    : `${mapping.startMishnah}-${mapping.endMishnah}`;

                  let talmudRange: string;
                  if (mapping.startDaf === mapping.endDaf && mapping.startLine === mapping.endLine) {
                    // Single line
                    talmudRange = `${mapping.startDaf}:${mapping.startLine}`;
                  } else if (mapping.startDaf === mapping.endDaf) {
                    // Same page, different lines
                    talmudRange = `${mapping.startDaf}:${mapping.startLine}-${mapping.endLine}`;
                  } else {
                    // Different pages - check if same folio number
                    const startFolio = mapping.startDaf.slice(0, -1);
                    const startSide = mapping.startDaf.slice(-1);
                    const endFolio = mapping.endDaf.slice(0, -1);
                    const endSide = mapping.endDaf.slice(-1);
                    
                    if (startFolio === endFolio) {
                      // Same folio number, different sides (e.g., 108a to 108b)
                      talmudRange = `${mapping.startDaf}:${mapping.startLine}-${endSide}:${mapping.endLine}`;
                    } else {
                      // Completely different folios
                      talmudRange = `${mapping.startDaf}:${mapping.startLine}-${mapping.endDaf}:${mapping.endLine}`;
                    }
                  }

                  const normalizedTractate = TRACTATE_NAME_VARIANTS[mapping.tractate] || normalizeDisplayTractateName(mapping.tractate);
                  const tractateSlug = getTractateSlug(normalizedTractate);
                  const href = `/talmud/${tractateSlug}/${mapping.startDaf}#section-${mapping.startLine}`;

                  // Generate Sefaria Mishnah URL
                  const sefariaTractateName = tractate.replace(/ /g, '_');
                  const sefariaUrl = `https://www.sefaria.org.il/Mishnah_${sefariaTractateName}.${chapterNum}.${mapping.startMishnah}`;

                  return {
                    mishnahNumber,
                    talmudRange,
                    href,
                    sefariaUrl
                  };
                });

                return {
                  number: chapterNum,
                  englishName: `Chapter ${chapterNum}`,
                  hebrewName: `פרק ${chapterNum}`,
                  startFolio: 0,
                  startSide: 'a' as const,
                  endFolio: 0,
                  endSide: 'a' as const,
                  mishnahTiles
                };
              });
            })();

        // Only include tractate if it has at least one Mishnah mapping
        const hasAnyMishnayot = chaptersWithMishnayot.some(ch => ch.mishnahTiles.length > 0);
        if (hasAnyMishnayot) {
          result[sederName].tractates.push({
            name: tractate,
            chapters: chaptersWithMishnayot
          });
        }
      });
    });

    return result;
  }, [chapterDataVersion]);

  // Filter data based on search and selected Seder
  const filteredData = useMemo(() => {
    let data = { ...organizedData };

    // Filter by Seder
    if (selectedSeder !== "all") {
      data = { [selectedSeder]: data[selectedSeder] || { tractates: [] } };
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered: typeof data = {};

      Object.entries(data).forEach(([sederName, sederData]) => {
        const filteredTractates: TractateData[] = [];

        sederData.tractates.forEach(tractate => {
          const filteredChapters = tractate.chapters
            .map(chapter => {
              const filteredTiles = chapter.mishnahTiles.filter(tile =>
                tractate.name.toLowerCase().includes(query) ||
                chapter.englishName.toLowerCase().includes(query) ||
                tile.mishnahNumber.includes(query) ||
                tile.talmudRange.toLowerCase().includes(query)
              );

              if (filteredTiles.length > 0) {
                return { ...chapter, mishnahTiles: filteredTiles };
              }
              return null;
            })
            .filter((ch): ch is ChapterWithMishnayot => ch !== null);

          if (filteredChapters.length > 0) {
            filteredTractates.push({
              name: tractate.name,
              chapters: filteredChapters
            });
          }
        });

        if (filteredTractates.length > 0) {
          filtered[sederName] = { tractates: filteredTractates };
        }
      });

      data = filtered;
    }

    return data;
  }, [organizedData, selectedSeder, searchQuery]);

  return (
    <PageShell>
      {/* Page title */}
      <PageHeader category="mishnah" title="Mishnah-Talmud Mapping">
        <p className="text-muted-foreground">
          Explore the connections between Mishnah passages and their corresponding discussions in the Talmud. 
          Click any Mishnah to navigate directly to the relevant section.
        </p>
      </PageHeader>

      {/* About */}
      <PageSection>
        <SectionHeading className="mb-3">About This Mapping</SectionHeading>
          <p className="text-sm text-secondary-foreground mb-2">
            This mapping is based on data from <a 
              href="https://github.com/Sefaria/Sefaria-Project/blob/master/data/Mishnah%20Map.csv" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Sefaria's Mishnah Map
            </a>.
          </p>
          <p className="text-sm text-secondary-foreground mb-2">
            Browse Mishnah passages organized by Seder, tractate, and chapter. Each tile shows the Mishnah number and its location in the Talmud. Click any tile to view the Mishnah in the Bekiut Talmud page, or use the "Sefaria" link below each tile to see the Mishnah in <a 
              href="https://www.sefaria.org.il/texts/Mishnah" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >Sefaria's Mishnah viewer</a>.
          </p>
          <p className="text-sm text-secondary-foreground mb-2">
            Note the following gaps in chapter order between Mishnah and Talmud: Sanhedrin: 10 ↔ 11; Megillah: 3 ↔ 4; Menachot: 10 (Mishnah) → 6 (Talmud; thus, 6–9 in Talmud each shift one place later than in Mishnah)
          </p>
          <p className="text-sm text-secondary-foreground">
            For more information about this mapping table, see <a 
              href="https://www.ezrabrand.com/p/introducing-chavrutais-mishnah-talmud" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              "Introducing Bekiut's Mishnah-Talmud Mapping Table"
            </a> (Nov 23, 2025)
          </p>
      </PageSection>

        {/* Filters */}
        <section className="py-6 border-t border-border">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by tractate, chapter, Mishnah, or page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        </section>

        {/* Seder Sections */}
        <div>
          {Object.entries(filteredData).map(([sederName, sederData]) => {
            const sederInfo = SEDER_ORGANIZATION[sederName as keyof typeof SEDER_ORGANIZATION];
            
            return (
              <section key={sederName} className="py-8 border-t border-border">
                {/* Seder Header */}
                <div className="mb-6 flex items-baseline justify-between gap-4">
                  <div>
                    <h2 className="font-georgia text-xl text-foreground">
                      {sederName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {sederInfo.description}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">
                    {sederInfo.hebrew}
                  </span>
                </div>

                {/* Tractates */}
                {sederData.tractates.map(tractate => (
                  <div key={tractate.name} className="mb-8 last:mb-0">
                    {/* Tractate Header */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <h3 className="font-georgia text-lg text-foreground">{tractate.name}</h3>
                      <span className="text-sm text-muted-foreground font-hebrew" dir="rtl" lang="he">
                        {TRACTATE_HEBREW_NAMES[tractate.name as keyof typeof TRACTATE_HEBREW_NAMES] || ''}
                      </span>
                    </div>

                    {/* Chapters */}
                    <div className="space-y-6">
                      {tractate.chapters.map(chapter => {
                        if (chapter.mishnahTiles.length === 0) return null;
                        
                        return (
                          <div
                            key={`${tractate.name}-${chapter.number}`}
                            data-testid={`card-chapter-${tractate.name}-${chapter.number}`}
                          >
                            <div className="mb-3">
                              <h4 className="text-base font-medium text-foreground mb-1">
                                Chapter {chapter.number}
                              </h4>
                              {chapter.talmudOrderNote && (
                                <p className="text-xs text-muted-foreground italic">
                                  {chapter.talmudOrderNote}
                                </p>
                              )}
                            </div>

                            {/* Mishnah tiles */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                              {chapter.mishnahTiles.map((tile, index) => (
                                <div 
                                  key={`${tile.mishnahNumber}-${index}`}
                                  className="flex flex-col items-center"
                                >
                                  <Link
                                    href={tile.href}
                                    data-testid={`link-mishnah-${tractate.name}-${chapter.number}-${tile.mishnahNumber}`}
                                    className="w-full min-w-[4.5rem] flex flex-col items-center gap-0.5 border border-border rounded bg-background px-1.5 py-2 hover:bg-secondary overflow-hidden"
                                  >
                                    <span className="text-base font-semibold text-primary">{tile.mishnahNumber}</span>
                                    <span className="text-[10px] text-muted-foreground text-center break-all leading-tight">{tile.talmudRange}</span>
                                  </Link>
                                  <a
                                    href={tile.sefariaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-primary hover:underline mt-0.5"
                                    data-testid={`link-sefaria-${tractate.name}-${chapter.number}-${tile.mishnahNumber}`}
                                  >
                                    Sefaria
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}

          {Object.keys(filteredData).length === 0 && (
            <div className="text-center py-12 border-t border-border">
              <p className="text-muted-foreground">
                No Mishnah mappings found. Try adjusting your search or filter.
              </p>
            </div>
          )}
        </div>
    </PageShell>
  );
}
