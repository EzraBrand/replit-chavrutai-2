import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HamburgerMenu } from "@/components/navigation/hamburger-menu";
import { BreadcrumbNavigation, breadcrumbHelpers } from "@/components/navigation/breadcrumb-navigation";
import { useSEO, generateSEOData } from "@/hooks/use-seo";
import { sefariaAPI } from "@/lib/sefaria";
import { TRACTATE_LISTS, TRACTATE_HEBREW_NAMES } from "@shared/tractates";
import { trackEvent } from "@/lib/analytics";
import hebrewBookIcon from "@/assets/hebrew-book-icon.png";
import type { TalmudLocation } from "@/types/talmud";

// Seder organization with Hebrew names
const SEDER_ORGANIZATION = {
  "Seder Zeraim": {
    hebrew: "סדר זרעים",
    description: "Agriculture and blessings",
    tractates: ["Berakhot"]
  },
  "Seder Moed": {
    hebrew: "סדר מועד", 
    description: "Holidays and appointed times",
    tractates: ["Shabbat", "Eruvin", "Pesachim", "Rosh Hashanah", "Yoma", "Sukkah", "Beitza", "Taanit", "Megillah", "Moed Katan", "Chagigah"]
  },
  "Seder Nashim": {
    hebrew: "סדר נשים",
    description: "Women and family law", 
    tractates: ["Yevamot", "Ketubot", "Nedarim", "Nazir", "Sotah", "Gittin", "Kiddushin"]
  },
  "Seder Nezikin": {
    hebrew: "סדר נזיקין",
    description: "Damages and civil law",
    tractates: ["Bava Kamma", "Bava Metzia", "Bava Batra", "Sanhedrin", "Makkot", "Shevuot", "Avodah Zarah", "Horayot"]
  },
  "Seder Kodashim": {
    hebrew: "סדר קדשים", 
    description: "Holy things and sacrifices",
    tractates: ["Zevachim", "Menachot", "Chullin", "Bekhorot", "Arachin", "Temurah", "Keritot", "Meilah", "Tamid", "Middot", "Kinnim"]
  },
  "Seder Tohorot": {
    hebrew: "סדר טהרות",
    description: "Ritual purity",
    tractates: ["Niddah"]
  }
};



export default function Contents() {
  // Set up SEO
  useSEO(generateSEOData.homePage());

  const { data: tractatesData, isLoading } = useQuery({
    queryKey: ['/api/tractates'],
    queryFn: () => sefariaAPI.getTractates("Talmud Bavli")
  });

  // Navigation handler for hamburger menu
  const handleLocationChange = (newLocation: TalmudLocation) => {
    // Navigate to clean URL
    const tractateSlug = newLocation.tractate.toLowerCase().replace(/\s+/g, '-');
    const folioSlug = `${newLocation.folio}${newLocation.side}`;
    window.location.href = `/tractate/${tractateSlug}/${folioSlug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Hamburger Menu */}
              <HamburgerMenu onLocationChange={handleLocationChange} />
              
              {/* Logo */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={hebrewBookIcon} 
                    alt="ChavrutAI Logo" 
                    className="w-10 h-10 object-cover"
                  />
                </div>
                <h1 className="text-xl font-semibold text-primary font-roboto">ChavrutAI</h1>
              </div>
              
              {/* Empty space for balance */}
              <div className="w-10 flex-shrink-0"></div>
            </div>
          </div>
        </header>
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const availableTractates = tractatesData || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu */}
            <HamburgerMenu onLocationChange={handleLocationChange} />
            
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={hebrewBookIcon} 
                  alt="ChavrutAI Logo" 
                  className="w-10 h-10 object-cover"
                />
              </div>
              <h1 className="text-xl font-semibold text-primary font-roboto">ChavrutAI</h1>
            </div>
            
            {/* Empty space for balance */}
            <div className="w-10 flex-shrink-0"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <BreadcrumbNavigation items={breadcrumbHelpers.contents()} />
        
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-primary mb-1">Study Talmud Online</h1>
          <h2 className="text-xl text-primary/80 mb-2">תלמוד בבלי - Babylonian Talmud</h2>
          <p className="text-base text-muted-foreground">Complete digital collection of all 37 tractates with Hebrew-English text display</p>
        </div>

        {/* Quick Links Section */}
        <div className="mb-6 bg-card border border-border rounded-lg p-3">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              href="/suggested-pages"
              className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
              data-testid="link-suggested-pages"
            >
              ⭐ Famous Pages
            </Link>
            <Link 
              href="/about"
              className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
              data-testid="link-about"
            >
              ℹ️ About ChavrutAI
            </Link>
            <Link 
              href="/contents/berakhot"
              className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
              data-testid="link-berakhot"
            >
              📚 Start with Berakhot
            </Link>
          </div>
        </div>

        {/* Seder Sections */}
        <div className="space-y-4">
          {Object.entries(SEDER_ORGANIZATION).map(([sederName, sederData]) => {
            // Filter tractates that are available in our data
            const availableSederTractates = sederData.tractates.filter(
              tractate => availableTractates.includes(tractate)
            );

            if (availableSederTractates.length === 0) return null;

            return (
              <div key={sederName} className="space-y-2">
                {/* Seder Header */}
                <div className="text-center border-b border-border pb-2">
                  <h3 className="text-xl font-semibold text-primary">
                    {sederName}
                  </h3>
                  <p className="text-base text-primary/70 font-hebrew">
                    {sederData.hebrew}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sederData.description}
                  </p>
                </div>

                {/* Tractates Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableSederTractates.map((tractate) => (
                    <Link 
                      key={tractate} 
                      href={`/contents/${encodeURIComponent(tractate.toLowerCase())}`}
                      onClick={() => trackEvent('select_tractate', 'navigation', tractate)}
                    >
                      <Card className="hover:shadow-sm transition-shadow cursor-pointer border-border hover:border-primary/20 bg-card/50">
                        <div className="p-3">
                          <div className="text-primary font-medium text-base">{tractate}</div>
                          <div className="text-sm text-primary/70 font-hebrew">
                            {TRACTATE_HEBREW_NAMES[tractate as keyof typeof TRACTATE_HEBREW_NAMES] || tractate}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}