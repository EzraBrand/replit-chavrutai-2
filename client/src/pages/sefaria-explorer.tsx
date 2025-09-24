import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, BookOpen, Library, Scroll } from "lucide-react";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { Footer } from "@/components/footer";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";

interface SefariaCategory {
  category: string;
  heCategory?: string;
  enDesc?: string;
  contents?: any[];
}

interface SefariaCorpusData {
  totalCategories: number;
  categories: SefariaCategory[];
  talmudStructure: {
    bavli: SefariaCategory[];
    yerushalmi: SefariaCategory[];
  };
}

export default function SefariaExplorer() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Set up SEO
  useSEO({
    title: "Sefaria Corpus Explorer - Complete Jewish Library Structure | ChavrutAI",
    description: "Explore the complete structure of the Sefaria digital library - from Talmud to Tanakh, Midrash to Modern Commentary. Comprehensive overview of Jewish texts.",
    canonical: "/sefaria-explorer"
  });

  // Fetch Sefaria index data
  const { data: corpusData, isLoading, error } = useQuery<SefariaCorpusData>({
    queryKey: ['/api/sefaria-corpus'],
    queryFn: async () => {
      // This would call our backend to get the processed Sefaria data
      // For now, return the data we discovered
      return {
        totalCategories: 14,
        categories: [
          { category: "Tanakh", heCategory: "תנ\"ך", enDesc: "The Hebrew Bible - Torah, Prophets, and Writings" },
          { category: "Mishnah", heCategory: "משנה", enDesc: "The foundational oral law" },
          { category: "Talmud", heCategory: "תלמוד", enDesc: "Rabbinic discussions and elaborations of the Mishnah" },
          { category: "Midrash", heCategory: "מדרש", enDesc: "Homiletic and exegetical literature" },
          { category: "Halakhah", heCategory: "הלכה", enDesc: "Jewish legal literature and codes" },
          { category: "Kabbalah", heCategory: "קבלה", enDesc: "Mystical and esoteric Jewish texts" },
          { category: "Liturgy", heCategory: "תפילה", enDesc: "Prayer books and liturgical texts" },
          { category: "Jewish Thought", heCategory: "מחשבת ישראל", enDesc: "Philosophy and theological works" },
          { category: "Tosefta", heCategory: "תוספתא", enDesc: "Early rabbinic legal collection" },
          { category: "Chasidut", heCategory: "חסידות", enDesc: "Hasidic teachings and texts" },
          { category: "Musar", heCategory: "מוסר", enDesc: "Jewish ethical and moral literature" },
          { category: "Responsa", heCategory: "שו\"ת", enDesc: "Rabbinic legal decisions and answers" },
          { category: "Second Temple", heCategory: "בית שני", enDesc: "Second Temple period literature" },
          { category: "Reference", heCategory: "ספרי עזר", enDesc: "Reference works and study aids" }
        ],
        talmudStructure: {
          bavli: [
            { 
              category: "Seder Zeraim", 
              heCategory: "סדר זרעים", 
              enDesc: "Agriculture and blessings (1 tractate)",
              contents: [{ title: "Berakhot" }]
            },
            { 
              category: "Seder Moed", 
              heCategory: "סדר מועד", 
              enDesc: "Holidays and appointed times (11 tractates)",
              contents: ["Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitzah", "Taanit", "Megillah", "Moed Katan", "Chagigah"].map(t => ({ title: t }))
            },
            { 
              category: "Seder Nashim", 
              heCategory: "סדר נשים", 
              enDesc: "Women and family law (7 tractates)",
              contents: ["Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin"].map(t => ({ title: t }))
            },
            { 
              category: "Seder Nezikin", 
              heCategory: "סדר נזיקין", 
              enDesc: "Damages and civil law (8 tractates)",
              contents: ["Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Horayot"].map(t => ({ title: t }))
            },
            { 
              category: "Seder Kodashim", 
              heCategory: "סדר קדשים", 
              enDesc: "Holy things and sacrifices (9 tractates)",
              contents: ["Zevachim", "Menachot", "Chullin", "Bekhorot", "Arakhin", "Temurah", "Keritot", "Meilah", "Tamid"].map(t => ({ title: t }))
            },
            { 
              category: "Seder Tahorot", 
              heCategory: "סדר טהרות", 
              enDesc: "Ritual purity (1 tractate)",
              contents: [{ title: "Niddah" }]
            },
            { 
              category: "Minor Tractates", 
              heCategory: "מסכתות קטנות", 
              enDesc: "Additional rabbinic tractates (15 tractates)",
              contents: ["Avot DeRabbi Natan", "Tractate Soferim", "Tractate Semachot", "Tractate Kallah", "Tractate Derekh Eretz"].map(t => ({ title: t }))
            },
            { 
              category: "Guides", 
              heCategory: "ספרות עזר", 
              enDesc: "Study guides and introductions (5 works)",
              contents: [{ title: "Introductions to the Babylonian Talmud" }]
            }
          ],
          yerushalmi: [
            { category: "Jerusalem Talmud Sedarim", heCategory: "תלמוד ירושלמי", enDesc: "Jerusalem Talmud orders" }
          ]
        }
      };
    }
  });

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Navigation handler for hamburger menu
  const handleLocationChange = (newLocation: TalmudLocation) => {
    const tractateSlug = newLocation.tractate.toLowerCase().replace(/\s+/g, '-');
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/tractate/${tractateSlug}/${folioSlug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <HamburgerMenu onLocationChange={handleLocationChange} />
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={hebrewBookIcon} 
                    alt="ChavrutAI Logo" 
                    className="w-10 h-10 object-cover"
                  />
                </div>
                <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
              </div>
              <div className="w-10 flex-shrink-0"></div>
            </div>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading Sefaria corpus data...</div>
        </div>
      </div>
    );
  }

  if (error || !corpusData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-red-600">Error loading Sefaria data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <HamburgerMenu onLocationChange={handleLocationChange} />
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={hebrewBookIcon} 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <div className="text-xl font-semibold text-primary font-roboto">ChavrutAI</div>
            </div>
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <BreadcrumbNavigation items={[
          { label: "Home", href: "/" },
          { label: "Sefaria Explorer", href: "/sefaria-explorer" }
        ]} />
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Sefaria Corpus Explorer</h1>
          <h2 className="text-xl text-primary/80 mb-2">Complete Jewish Library Structure</h2>
          <p className="text-base text-muted-foreground">Explore the comprehensive digital collection of Jewish texts and their organization</p>
        </div>

        {/* Summary Stats */}
        <Card className="mb-6" data-testid="corpus-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="w-5 h-5" />
              Sefaria Digital Library Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{corpusData.totalCategories}</div>
                <div className="text-sm text-muted-foreground">Major Categories</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">37</div>
                <div className="text-sm text-muted-foreground">Main Talmud Tractates</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">6</div>
                <div className="text-sm text-muted-foreground">Talmud Sedarim</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">2</div>
                <div className="text-sm text-muted-foreground">Talmud Versions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complete Corpus Categories */}
        <Card className="mb-6" data-testid="corpus-categories">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Complete Sefaria Corpus (14 Categories)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {corpusData.categories.map((category, index) => (
                <div 
                  key={category.category}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    category.category === 'Talmud' 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCategory(category.category)}
                  data-testid={`category-${category.category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-primary">{category.category}</h3>
                      <p className="text-sm text-primary/70 font-hebrew">{category.heCategory}</p>
                      {category.enDesc && (
                        <p className="text-xs text-muted-foreground mt-1">{category.enDesc}</p>
                      )}
                    </div>
                    {category.category === 'Talmud' && (
                      <div className="text-sm font-medium text-primary bg-primary/20 px-2 py-1 rounded">
                        Current Focus
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Talmud Structure */}
        <Card className="mb-6" data-testid="talmud-structure">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scroll className="w-5 h-5" />
              Babylonian Talmud (Bavli) - Complete Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {corpusData.talmudStructure.bavli.map((seder, index) => (
                <Collapsible 
                  key={seder.category}
                  open={expandedSections.has(seder.category)}
                  onOpenChange={() => toggleSection(seder.category)}
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-4 h-auto text-left"
                      data-testid={`seder-${seder.category.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{seder.category}</h3>
                        <p className="text-base text-primary/70 font-hebrew">{seder.heCategory}</p>
                        <p className="text-sm text-muted-foreground">{seder.enDesc}</p>
                      </div>
                      {expandedSections.has(seder.category) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {seder.contents?.map((tractate, tractateIndex) => (
                        <div 
                          key={tractate.title || tractateIndex}
                          className="p-2 bg-muted/30 rounded border text-sm"
                          data-testid={`tractate-${tractate.title?.toLowerCase().replace(/\s+/g, '-') || tractateIndex}`}
                        >
                          <div className="font-medium text-primary">{tractate.title || `Item ${tractateIndex + 1}`}</div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current App Integration */}
        <Card className="mb-6" data-testid="current-app">
          <CardHeader>
            <CardTitle>Your Current Application Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">Current Scope</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your ChavrutAI app currently focuses on the <strong>6 main Sedarim</strong> with <strong>37 tractates</strong> of the Babylonian Talmud. 
                This represents the core traditional structure of the Talmud.
              </p>
              <h3 className="font-semibold text-primary mb-2">Expansion Opportunities</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Minor Tractates:</strong> 15 additional tractates beyond the main 37</li>
                <li>• <strong>Jerusalem Talmud (Yerushalmi):</strong> Parallel tradition with different perspectives</li>
                <li>• <strong>Commentary Collections:</strong> Rishonim, Acharonim, and modern commentary</li>
                <li>• <strong>Study Guides:</strong> Introductory materials and learning aids</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}